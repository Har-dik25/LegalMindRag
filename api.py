# api.py — Dual-Approach Legal RAG API
# Supports Approach 1 (LangChain) and Approach 2 (Core Python)
import logging
import time
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import json
import os

import config
from embeddings.embedder import Embedder
from vectorstore.chroma_store import ChromaStore
from vectorstore.bm25_store import BM25Store

# ── Approach 1: LangChain ──
from retrieval.hybrid_retriever import HybridRetriever
from generation.llm_client import LLMClient
from generation.prompt_builder import get_rag_prompt_template, format_docs
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# ── Approach 2: Core Python ──
from retrieval.hybrid_retriever_core import CoreHybridRetriever
from generation.llm_client_core import CoreLLMClient
from generation.prompt_builder_core import get_system_prompt, build_rag_prompt, format_docs_core

import auth_db

# ─── Logging ───
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    handlers=[
        logging.FileHandler(config.LOG_PATH / "api.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("LegalAI-API")

# ─── App Setup ───
app = FastAPI(title="Legal AI API", version="2.0.0")

# CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global State ───
class RAGState:
    def __init__(self):
        # Shared data layer
        self.embedder = None
        self.chroma = None
        self.bm25 = None
        
        # Approach 1: LangChain
        self.lc_retriever = None
        self.lc_llm = None
        
        # Approach 2: Core Python
        self.core_retriever = None
        self.core_llm = None
        
        # Current active approach (default: "langchain")
        self.active_approach = "langchain"

rag = RAGState()

@app.on_event("startup")
def startup_event():
    logger.info("🚀 Starting Legal AI API (Dual Approach)...")
    
    # 1. Load shared Embedder
    rag.embedder = Embedder(config.EMBEDDING_MODEL)
    
    # 2. Load shared Vector Stores
    rag.chroma = ChromaStore(config.CHROMA_PERSIST_DIR, config.CHROMA_COLLECTION, embedding_function=rag.embedder.embeddings)
    rag.bm25 = BM25Store()
    if not rag.bm25.load(str(config.BM25_DIR)):
        logger.error("❌ BM25 index not found. Run build_index.py first.")
        raise RuntimeError("BM25 index missing")
        
    # 3. Load Approach 1: LangChain Retriever + LLM
    logger.info("📦 Loading Approach 1 (LangChain)...")
    rag.lc_retriever = HybridRetriever(
        rag.embedder, rag.chroma, rag.bm25, load_reranker=config.USE_RERANKER
    )
    rag.lc_llm = LLMClient()
    
    # 4. Load Approach 2: Core Python Retriever + LLM
    logger.info("🐍 Loading Approach 2 (Core Python)...")
    rag.core_retriever = CoreHybridRetriever(
        rag.embedder, rag.chroma, rag.bm25, load_reranker=config.USE_RERANKER
    )
    rag.core_llm = CoreLLMClient()
    
    logger.info("✅ API Ready — Both approaches loaded")

# ─── Models ───
class QueryRequest(BaseModel):
    query: str
    category: str = None
    approach: str = None  # "langchain" or "core_python" — overrides global

class AuthRequest(BaseModel):
    username: str
    password: str

class ChatSaveRequest(BaseModel):
    chat_id: str
    user_id: int
    title: str
    messages: list

class ApproachRequest(BaseModel):
    approach: str  # "langchain" or "core_python"

# ─── Utility: get active approach ───
def _get_approach(override: str = None) -> str:
    """Return effective approach: per-request override > global setting."""
    if override and override in ("langchain", "core_python"):
        return override
    return rag.active_approach

# ─── Endpoints ───
@app.get("/")
def health_check():
    return {
        "status": "ok",
        "model": config.OLLAMA_MODEL,
        "active_approach": rag.active_approach,
    }

@app.get("/config/approach")
def get_approach():
    """Return the current active approach."""
    return {"approach": rag.active_approach}

@app.post("/config/approach")
def set_approach(req: ApproachRequest):
    """Switch the active approach globally."""
    if req.approach not in ("langchain", "core_python"):
        raise HTTPException(status_code=400, detail="Invalid approach. Use 'langchain' or 'core_python'.")
    rag.active_approach = req.approach
    logger.info(f"🔄 Switched active approach to: {req.approach}")
    return {"approach": rag.active_approach}


@app.post("/query")
def query_rag(request: QueryRequest):
    """Standard non-streaming query — routes to the selected approach."""
    approach = _get_approach(request.approach)
    start_time = time.time()
    
    filters = {"category": request.category} if request.category else None

    if approach == "langchain":
        return _query_langchain(request.query, filters, start_time)
    else:
        return _query_core_python(request.query, filters, start_time)


def _query_langchain(query: str, filters: dict, start_time: float):
    """Approach 1: LangChain LCEL Chain."""
    results = rag.lc_retriever.retrieve(
        query=query, top_k=config.TOP_K_RERANK,
        filters=filters, use_reranker=config.USE_RERANKER
    )
    if not results:
        return {
            "answer": "[ERR_NO_DATA_FOUND]", "sources": [],
            "metrics": {"time": round(time.time() - start_time, 2), "approach": "langchain"}
        }

    prompt = get_rag_prompt_template()
    chain = (
        {"context": lambda x: format_docs(results), "query": RunnablePassthrough()}
        | prompt
        | rag.lc_llm.llm
        | StrOutputParser()
    )
    answer = chain.invoke(query)
    return _format_response(answer, results, start_time, "langchain")


def _query_core_python(query: str, filters: dict, start_time: float):
    """Approach 2: Core Python — direct Ollama REST API."""
    results = rag.core_retriever.retrieve(
        query=query, top_k=config.TOP_K_RERANK,
        filters=filters, use_reranker=config.USE_RERANKER
    )
    if not results:
        return {
            "answer": "[ERR_NO_DATA_FOUND]", "sources": [],
            "metrics": {"time": round(time.time() - start_time, 2), "approach": "core_python"}
        }

    system_prompt = get_system_prompt()
    user_prompt = build_rag_prompt(query, results)
    answer = rag.core_llm.generate(system_prompt, user_prompt)
    return _format_response(answer, results, start_time, "core_python")


def _format_response(answer, results, start_time, approach):
    """Build the standard API response with sources and metrics."""
    sources = []
    for r in results:
        meta = r.metadata
        sources.append({
            "title": meta.get("doc_title", getattr(r, "chunk_id", "Unknown")),
            "type": meta.get("doc_type", "Document"),
            "section": meta.get("section_ref", ""),
            "score": round(r.rerank_score if hasattr(r, "rerank_score") and r.rerank_score else r.score, 4),
            "text": r.text[:200] + "..."
        })
    return {
        "answer": answer,
        "sources": sources,
        "metrics": {"time": round(time.time() - start_time, 2), "approach": approach}
    }


@app.get("/stream")
def stream_rag(query: str, category: str = None, approach: str = None):
    """Streaming endpoint — routes to the selected approach."""
    effective_approach = _get_approach(approach)
    
    if effective_approach == "langchain":
        return StreamingResponse(_stream_langchain(query, category), media_type="text/event-stream")
    else:
        return StreamingResponse(_stream_core_python(query, category), media_type="text/event-stream")


def _stream_langchain(query: str, category: str = None):
    """Approach 1: LangChain LCEL streaming."""
    start_time = time.time()
    filters = {"category": category} if category else None
    
    results = rag.lc_retriever.retrieve(
        query=query, top_k=config.TOP_K_RERANK,
        filters=filters, use_reranker=config.USE_RERANKER
    )
    
    # Send approach info
    yield f"data: {json.dumps({'type': 'approach', 'data': 'langchain'})}\n\n"
    
    # Send sources
    sources_data = _build_sources_data(results)
    yield f"data: {json.dumps({'type': 'sources', 'data': sources_data})}\n\n"
    
    if not results:
        yield f"data: {json.dumps({'type': 'token', 'content': '[ERR_NO_DATA_FOUND]'})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'time': round(time.time() - start_time, 2)})}\n\n"
        return
    
    # Build LCEL Chain
    prompt = get_rag_prompt_template()
    chain = (
        {"context": lambda x: format_docs(results), "query": RunnablePassthrough()}
        | prompt
        | rag.lc_llm.llm
        | StrOutputParser()
    )
    
    # Stream tokens
    for token in chain.stream(query):
        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
    
    total_time = time.time() - start_time
    yield f"data: {json.dumps({'type': 'done', 'time': round(total_time, 2)})}\n\n"


def _stream_core_python(query: str, category: str = None):
    """Approach 2: Core Python streaming via raw Ollama HTTP."""
    start_time = time.time()
    filters = {"category": category} if category else None
    
    results = rag.core_retriever.retrieve(
        query=query, top_k=config.TOP_K_RERANK,
        filters=filters, use_reranker=config.USE_RERANKER
    )
    
    # Send approach info
    yield f"data: {json.dumps({'type': 'approach', 'data': 'core_python'})}\n\n"
    
    # Send sources
    sources_data = _build_sources_data(results)
    yield f"data: {json.dumps({'type': 'sources', 'data': sources_data})}\n\n"
    
    if not results:
        yield f"data: {json.dumps({'type': 'token', 'content': '[ERR_NO_DATA_FOUND]'})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'time': round(time.time() - start_time, 2)})}\n\n"
        return
    
    # Build prompt strings
    system_prompt = get_system_prompt()
    user_prompt = build_rag_prompt(query, results)
    
    # Stream tokens via raw Ollama HTTP
    for token in rag.core_llm.generate_stream(system_prompt, user_prompt):
        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
    
    total_time = time.time() - start_time
    yield f"data: {json.dumps({'type': 'done', 'time': round(total_time, 2)})}\n\n"


def _build_sources_data(results) -> list:
    """Build sources array for SSE events."""
    sources_data = []
    for r in results:
        meta = r.metadata
        sources_data.append({
            "title": meta.get("doc_title", getattr(r, "chunk_id", "Unknown")),
            "type": meta.get("doc_type", "Document"),
            "score": round(r.rerank_score if hasattr(r, "rerank_score") and r.rerank_score else r.score, 4),
            "text": getattr(r, "text", "")
        })
    return sources_data


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Experimental: Receive a document and process it for research."""
    logger.info(f"📁 Received custom document: {file.filename}")
    time.sleep(1)
    return {"status": "success", "filename": file.filename, "message": "Document indexed for current session (simulated)"}

# ─── Auth & History Endpoints ───
@app.post("/auth/register")
def register(req: AuthRequest):
    user, error = auth_db.register_user(req.username, req.password)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return user

@app.post("/auth/login")
def login(req: AuthRequest):
    user, error = auth_db.authenticate_user(req.username, req.password)
    if error:
        raise HTTPException(status_code=401, detail=error)
    return user

@app.post("/history/save")
def save_history(req: ChatSaveRequest):
    success = auth_db.save_chat(req.chat_id, req.user_id, req.title, req.messages)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save chat history")
    return {"status": "success"}

@app.get("/history/load/{user_id}")
def load_history(user_id: int):
    return auth_db.load_user_chats(user_id)

@app.delete("/history/delete/{user_id}/{chat_id}")
def delete_history(user_id: int, chat_id: str):
    success = auth_db.delete_chat(chat_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat not found or deletion failed")
    return {"status": "deleted"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
