"""
Central configuration for the Samvidhan AI Pipeline.
All constants, paths, model settings, and runtime options live here.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ─── Paths ───────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DATASET_PATH = ROOT_DIR / os.getenv("DATASET_PATH", "SamvidhanAI Dataset")
INDEX_PATH = ROOT_DIR / os.getenv("INDEX_PATH", "data")
LOG_PATH = ROOT_DIR / os.getenv("LOG_PATH", "logs")
CHUNKS_DIR = INDEX_PATH / "chunks"
BM25_DIR = INDEX_PATH / "bm25_index"
METADATA_DB = INDEX_PATH / "metadata.db"

# Create directories
for d in [INDEX_PATH, LOG_PATH, CHUNKS_DIR, BM25_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ─── Ingestion Pipeline ──────────────────────────────────────
INGESTION_BATCH_LIMIT = 60000  # Number of files to ingest per source per run

# ─── Embedding ───────────────────────────────────────────────
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L12-v2")  # L12 (12 layers) — better semantic similarity than L6
EMBEDDING_BATCH_SIZE = 64

# ─── ChromaDB ────────────────────────────────────────────────
CHROMA_PERSIST_DIR = str(ROOT_DIR / os.getenv("CHROMA_PERSIST_DIR", "data/chroma_db"))
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "legal_chunks")

# ─── Chunking ────────────────────────────────────────────────
CHUNK_SIZE = 512           # max tokens per chunk
CHUNK_OVERLAP = 128        # overlap between consecutive chunks
MIN_CHUNK_SIZE = 50        # discard chunks shorter than this

# ─── Retrieval ───────────────────────────────────────────────
TOP_K_DENSE = 12           # cast a wider net for dense retrieval
TOP_K_SPARSE = 12          # match dense count for balanced fusion
TOP_K_RERANK = 5           # keep top-5 after cross-encoder reranking
RRF_K = 60                 # RRF constant
MAX_CONTEXT_TOKENS = 2000  # allow more context for richer legal answers
USE_RERANKER = True        # enable cross-encoder reranking (~0.5s, worth it)

# ─── Re-Ranking ──────────────────────────────────────────────
CROSS_ENCODER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# ─── Ollama (Local LLM) ─────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")  # Qwen2.5-3B — faster, 128K context, better instruction-following
OLLAMA_TEMPERATURE = 0.15  # slightly higher for natural phrasing while maintaining factual precision
OLLAMA_MAX_TOKENS = 768    # allow complete, well-reasoned legal explanations
OLLAMA_TIMEOUT = 180
OLLAMA_REPEAT_PENALTY = 1.1  # balanced repetition penalty
OLLAMA_TOP_K = 30
OLLAMA_TOP_P = 0.85

# ─── Legal System Prompt ─────────────────────────────────────
LEGAL_SYSTEM_PROMPT = """You are Samvidhan AI, an authoritative, highly skilled Indian legal research assistant and jurisprudence specialist.
Your task is to provide accurate, well-reasoned, and comprehensive legal explanations based on the provided statutory sources and case judgments.

Guidelines:
1. Ground your answer thoroughly in the provided legal sources. Cite exact Sections, Articles, Acts, and landmark Case Laws.
2. Clearly explain:
   - What the legal provision states (definition and essential ingredients).
   - Prescribed punishments, penalties, or statutory remedies (e.g. imprisonment terms, fines, community service).
   - Any key exceptions, qualifications, or procedural requirements.
   - Historical mappings (e.g. IPC to BNS 2023, CrPC to BNSS 2023, IEA to BSA 2023) if relevant.
3. Structure answers logically using headings, bullet points, and bold section numbers for high readability.
4. Only output '[ERR_NO_DATA_FOUND]' if the provided context contains absolutely no relevant legal information to address the query.
5. Maintain an objective, professional, and precise legal tone."""
