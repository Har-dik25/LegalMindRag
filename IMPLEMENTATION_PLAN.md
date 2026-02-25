# 🏗️ IMPLEMENTATION PLAN — Legal RAG Pipeline (Core Python)

> **Project**: Industry-Grade RAG Agent for Indian Legal Corpus  
> **Approach**: Pure Core Python (No LangChain/LlamaIndex)  
> **Vector Store**: ChromaDB | **LLM**: Ollama (Local)  
> **Created**: February 20, 2026  
> **Estimated Total Time**: 8-10 days of focused development

---

## 📐 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     USER (Browser / API Client)                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP Request
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FASTAPI SERVER (main.py)                      │
│  /query  /ingest  /health  /evaluate  /chat                      │
└───────────────────────────┬──────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌─────────────┐   ┌──────────────────┐   ┌──────────────┐
│   QUERY     │   │   RETRIEVAL      │   │  GENERATION  │
│  PROCESSOR  │   │   ENGINE         │   │   ENGINE     │
│             │   │                  │   │              │
│ • Clean     │──▶│ • Dense (Chroma) │──▶│ • Prompt     │
│ • Classify  │   │ • Sparse (BM25)  │   │   Builder    │
│ • Expand    │   │ • Hybrid (RRF)   │   │ • Ollama LLM │
│             │   │ • Re-rank        │   │ • Citations  │
└─────────────┘   └──────────────────┘   └──────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    DATA LAYER         │
              │                       │
              │  ChromaDB (persist/) │
              │  BM25 Index (.pkl)   │
              │  SQLite (metadata)   │
              │  Chunks (.jsonl)     │
              └───────────────────────┘
                          ▲
                          │ Built by
              ┌───────────────────────┐
              │   INGESTION PIPELINE  │
              │                       │
              │  PDF Parser → Cleaner │
              │  → Chunker → Embedder │
              │  → ChromaDB + BM25    │
              └───────────────────────┘
```

---

## 📁 Final Project Structure

```
Core Python RAG/
├── LegalAI Dataset/              # ✅ DONE — 65 documents
├── evaluation/                   # ✅ DONE — golden QA + FAQs
├── RAG_Research_Guide.md         # ✅ DONE — research & strategy
├── IMPLEMENTATION_PLAN.md        # ✅ THIS FILE
│
├── requirements.txt              # Phase 1
├── .env                          # Phase 1 (API keys)
├── config.py                     # Phase 1 (all settings)
│
├── ingestion/                    # Phase 2
│   ├── __init__.py
│   ├── pdf_parser.py             # PDF/TXT → raw text
│   ├── text_cleaner.py           # Normalize, fix encoding
│   ├── chunker.py                # Legal-aware chunking
│   └── metadata_extractor.py     # Extract Act name, year, sections
│
├── embeddings/                   # Phase 3
│   ├── __init__.py
│   ├── embedder.py               # Generate embeddings
│   └── cache.py                  # Embedding cache
│
├── vectorstore/                  # Phase 3
│   ├── __init__.py
│   ├── chroma_store.py           # ChromaDB vector store wrapper
│   └── bm25_store.py             # BM25 sparse index
│
├── retrieval/                    # Phase 4
│   ├── __init__.py
│   ├── dense_retriever.py        # Semantic search (FAISS)
│   ├── sparse_retriever.py       # Keyword search (BM25)
│   ├── hybrid_retriever.py       # RRF fusion
│   └── reranker.py               # Cross-encoder re-ranking
│
├── generation/                   # Phase 5
│   ├── __init__.py
│   ├── prompt_builder.py         # Dynamic legal prompts
│   ├── llm_client.py             # OpenAI / Groq / Ollama wrapper
│   └── response_parser.py        # Parse citations, structure output
│
├── memory/                       # Phase 5
│   ├── __init__.py
│   ├── conversation.py           # Chat history management
│   └── query_resolver.py         # Follow-up → standalone query
│
├── api/                          # Phase 6
│   ├── __init__.py
│   ├── main.py                   # FastAPI entry point
│   ├── routes.py                 # API endpoints
│   ├── models.py                 # Pydantic request/response models
│   └── middleware.py             # Rate limiting, CORS, logging
│
├── eval/                         # Phase 7
│   ├── __init__.py
│   ├── metrics.py                # Retrieval & generation metrics
│   ├── evaluator.py              # Run evaluation pipeline
│   └── report.py                 # Generate evaluation report
│
├── client/                       # Phase 8 — React Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.jsx              # React entry point
│       ├── App.jsx               # Root component with routing
│       ├── index.css             # Global styles + design tokens
│       ├── api/
│       │   └── ragApi.js         # Axios API client for FastAPI backend
│       ├── components/
│       │   ├── ChatWindow.jsx    # Main chat area (messages + input)
│       │   ├── MessageBubble.jsx # Individual message (user/assistant)
│       │   ├── SourceCard.jsx    # Expandable source citation card
│       │   ├── Sidebar.jsx       # Chat history + new chat button
│       │   ├── SearchFilters.jsx # Category/year/doc_type filters
│       │   ├── ConfidenceBadge.jsx # Confidence score indicator
│       │   ├── LoadingDots.jsx   # Typing indicator animation
│       │   └── Header.jsx        # Top navbar with branding
│       ├── hooks/
│       │   ├── useChat.js        # Chat state management hook
│       │   └── useStream.js      # SSE streaming hook
│       ├── pages/
│       │   ├── ChatPage.jsx      # Main chat interface page
│       │   ├── SourcesPage.jsx   # Browse all indexed documents
│       │   └── EvalPage.jsx      # Evaluation dashboard
│       └── utils/
│           ├── markdown.js       # Markdown rendering helpers
│           └── constants.js      # API URLs, theme tokens
│
├── scripts/                      # Utility scripts
│   ├── ingest_all.py             # One-shot ingestion of full dataset
│   ├── build_index.py            # Build/rebuild vector + BM25 indices
│   └── run_eval.py               # Run evaluation against golden QA
│
├── data/                         # Generated at runtime
│   ├── chunks/                   # Chunked documents (.jsonl)
│   ├── chroma_db/                # ChromaDB persistent storage
│   ├── bm25_index/               # BM25 pickle files
│   └── metadata.db               # SQLite metadata store
│
└── logs/                         # Runtime logs
    └── rag.log
```

---

## 🚀 PHASE 1: Project Setup & Configuration
**Duration**: ~1 hour | **Difficulty**: Easy

### 1.1 Create `requirements.txt`

```txt
# ── PDF & Text Processing ──
pypdf==4.3.1
pdfplumber==0.11.4
PyMuPDF==1.25.3

# ── Embeddings ──
sentence-transformers==3.4.1

# ── Vector Store ──
chromadb==0.6.3

# ── Sparse Retrieval ──
rank-bm25==0.2.2

# ── Re-Ranking ──
# (uses sentence-transformers CrossEncoder — already included above)

# ── LLM Provider (Ollama — installed separately) ──
ollama==0.4.7
requests==2.32.3

# ── API Framework ──
fastapi==0.115.8
uvicorn[standard]==0.34.0

# ── Data & Utilities ──
python-dotenv==1.0.1
pydantic==2.10.6
numpy==2.2.3
tqdm==4.67.1
structlog==25.1.0

# ── Evaluation ──
scikit-learn==1.6.1
rouge-score==0.1.2
```

### 1.2 Create `.env`

```env
# ── Ollama Configuration ──
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
# Alternatives: mistral:latest, deepseek-r1:8b, gemma2:9b, phi3:latest

# ── Embedding Model (local via sentence-transformers) ──
EMBEDDING_MODEL=all-MiniLM-L6-v2

# ── ChromaDB ──
CHROMA_PERSIST_DIR=./data/chroma_db
CHROMA_COLLECTION=legal_chunks

# ── Paths ──
DATASET_PATH=./LegalAI Dataset
INDEX_PATH=./data
LOG_PATH=./logs
```

### 1.3 Create `config.py`

Central configuration module. All constants, paths, and model settings live here.

```python
# Key settings to define:
CHUNK_SIZE = 512          # tokens per chunk
CHUNK_OVERLAP = 128       # overlap between chunks
TOP_K_DENSE = 15          # dense retrieval candidates
TOP_K_SPARSE = 15         # sparse retrieval candidates
TOP_K_RERANK = 5          # final results after re-ranking
RRF_K = 60                # RRF constant
MAX_CONTEXT_TOKENS = 4000 # max context for LLM prompt
CROSS_ENCODER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# Ollama
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2:latest"  # or mistral, deepseek-r1:8b, etc.
OLLAMA_TIMEOUT = 120      # seconds — local models can be slower
OLLAMA_TEMPERATURE = 0.1  # low for factual legal answers

# ChromaDB
CHROMA_PERSIST_DIR = "./data/chroma_db"
CHROMA_COLLECTION = "legal_chunks"
```

### 1.4 Install & Configure Ollama

**Ollama** runs LLMs locally on your machine — no API keys, no costs, full privacy.

```bash
# 1. Download Ollama from https://ollama.com/download (Windows installer)
# 2. After install, pull a model:
ollama pull llama3.2          # 3B params, ~2GB, fast (recommended for dev)
ollama pull mistral            # 7B params, ~4GB, great quality
ollama pull deepseek-r1:8b     # 8B params, ~5GB, strong reasoning
ollama pull gemma2:9b          # 9B params, ~5GB, good for structured output

# 3. Verify Ollama is running:
ollama list                    # Should show pulled models
curl http://localhost:11434    # Should return "Ollama is running"

# 4. Test a model:
ollama run llama3.2 "What is Article 21 of the Indian Constitution?"
```

**Recommended models for Legal RAG**:
| Model | Size | RAM Needed | Speed | Legal Quality |
|-------|------|-----------|-------|---------------|
| `llama3.2` | 3B | ~4 GB | ⚡ Very fast | Good for dev/testing |
| `llama3.1:8b` | 8B | ~6 GB | Fast | Good |
| `mistral` | 7B | ~6 GB | Fast | Very Good |
| `deepseek-r1:8b` | 8B | ~6 GB | Medium | Excellent reasoning |
| `gemma2:9b` | 9B | ~7 GB | Medium | Very Good |
| `llama3.3:70b` | 70B | ~40 GB | Slow | Best (needs GPU) |

### 1.5 Deliverables
- [ ] `requirements.txt` created
- [ ] `.env` configured
- [ ] `config.py` with all settings
- [ ] Ollama installed and at least one model pulled
- [ ] Virtual environment created (`python -m venv venv`)
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] Verify imports: `python -c "import chromadb; import sentence_transformers; print('OK')"`
- [ ] Verify Ollama: `curl http://localhost:11434` returns OK

---

## 📄 PHASE 2: Document Ingestion Pipeline
**Duration**: ~2-3 hours | **Difficulty**: Medium

### 2.1 `ingestion/pdf_parser.py`

**Purpose**: Extract raw text from PDFs and TXT files.

**Logic**:
```
For each file in dataset:
    if .txt → read directly (UTF-8)
    if .pdf → try pypdf first
        → if text is empty/garbage → try pdfplumber
        → if still bad → try PyMuPDF (fitz)
    return: {
        "file_path": str,
        "file_name": str,
        "raw_text": str,
        "num_pages": int,
        "extraction_method": str,
        "file_type": str
    }
```

**Key considerations**:
- Some legal PDFs are scanned images → log warning, skip (OCR is out of scope for MVP)
- Handle encoding issues (Indian legal PDFs often have non-standard encoding)
- Track extraction quality (character count vs page count ratio)

### 2.2 `ingestion/text_cleaner.py`

**Purpose**: Clean and normalize extracted text.

**Operations**:
1. Fix encoding artifacts (`â€™` → `'`, `â€"` → `—`)
2. Normalize whitespace (collapse multiple spaces/newlines)
3. Remove page headers/footers (repeated text across pages)
4. Remove page numbers
5. Fix broken words from PDF line wrapping (`juris-\ndiction` → `jurisdiction`)
6. Preserve legal formatting (section numbers, article numbers, indentation)
7. Remove non-textual artifacts (watermarks, stamps)

**Important**: Do NOT lowercase — legal text is case-sensitive (`Article` vs `article`).

### 2.3 `ingestion/metadata_extractor.py`

**Purpose**: Extract structured metadata from each document.

**Metadata schema**:
```python
{
    "doc_id": "uuid",
    "file_name": str,
    "file_path": str,
    "doc_type": str,         # "act", "judgment", "amendment", "report", "template", etc.
    "title": str,            # "Bharatiya Nyaya Sanhita, 2023"
    "year": int | None,      # 2023
    "jurisdiction": str,     # "India", "Supreme Court", "Delhi High Court"
    "category": str,         # "Criminal Law", "Family Law", "Property Law"
    "subcategory": str,      # "BNS", "Hindu Marriage Act"
    "num_pages": int,
    "num_characters": int,
    "extraction_method": str,
    "ingested_at": datetime
}
```

**How**: Use regex patterns + folder structure to infer metadata:
- Folder name → category (e.g., `Family_Law` → "Family Law")
- Filename → title + year (e.g., `Bharatiya_Nyaya_Sanhita_2023.txt` → title="BNS 2023", year=2023)
- Content patterns → doc_type (presence of "HELD:" → judgment, "Section 1:" → act)

### 2.4 `ingestion/chunker.py`

**Purpose**: Split documents into retrievable chunks with legal-aware boundaries.

**Strategy — Hierarchical Legal Chunking**:

```
Level 1: Split by major divisions
    → "PART I:", "PART II:", "CHAPTER I:", "CHAPTER II:"

Level 2: Split by sections/articles
    → "Section 302.", "Article 21.", "Rule 5."

Level 3: Split by sub-sections/clauses
    → "(1)", "(2)", "(a)", "(b)"

Level 4: If still too large → split by paragraph (\n\n)

Level 5: If STILL too large → split by sentence with overlap
```

**Each chunk output**:
```python
{
    "chunk_id": "uuid",
    "doc_id": "parent_doc_uuid",
    "text": str,                    # The chunk content
    "chunk_index": int,             # Position in document
    "section_ref": str | None,      # "Section 302" or "Article 21"
    "parent_section": str | None,   # "Chapter XVI - Of Offences"
    "token_count": int,
    "metadata": { ... }             # Inherited from document metadata
}
```

**Store as**: `data/chunks/all_chunks.jsonl` (one JSON per line)

### 2.5 Deliverables
- [ ] `pdf_parser.py` — handles PDF + TXT extraction with fallback chain
- [ ] `text_cleaner.py` — normalizes text while preserving legal structure
- [ ] `metadata_extractor.py` — extracts structured metadata
- [ ] `chunker.py` — legal-aware hierarchical chunking
- [ ] `scripts/ingest_all.py` — orchestrates full ingestion pipeline
- [ ] Verify: Run on full dataset, check chunk quality manually on 5-10 docs
- [ ] **Output**: `data/chunks/all_chunks.jsonl` + `data/metadata.db`
- [ ] **Expected**: ~5000-8000 chunks from 65 documents

---

## 🧮 PHASE 3: Embedding & Index Building
**Duration**: ~2-3 hours | **Difficulty**: Medium

### 3.1 `embeddings/embedder.py`

**Purpose**: Convert text chunks into dense vector representations.

**Model choices**:
| Model | Dimensions | Speed | Quality | Cost |
|-------|-----------|-------|---------|------|
| `all-MiniLM-L6-v2` | 384 | ⚡ Fast | Good | Free (local) |
| `all-mpnet-base-v2` | 768 | Medium | Better | Free (local) |
| `BAAI/bge-small-en-v1.5` | 384 | ⚡ Fast | Great | Free (local) |
| `text-embedding-3-small` | 1536 | API call | Excellent | $0.02/1M tokens |

**Recommendation**: Start with `all-MiniLM-L6-v2` (free, fast, good enough for MVP).
Upgrade to `BAAI/bge-small-en-v1.5` if retrieval quality needs improvement.

> 💡 **All embedding runs locally** — no API calls, no cost, works offline.

**Logic**:
```python
class Embedder:
    def __init__(self, model_name: str):
        self.model = SentenceTransformer(model_name)
    
    def embed_chunks(self, chunks: list[str], batch_size=64) -> np.ndarray:
        """Embed all chunks in batches, return numpy array of shape (N, D)"""
        embeddings = self.model.encode(
            chunks,
            batch_size=batch_size,
            show_progress_bar=True,
            normalize_embeddings=True  # Important for cosine similarity
        )
        return embeddings
    
    def embed_query(self, query: str) -> np.ndarray:
        """Embed a single query"""
        return self.model.encode(query, normalize_embeddings=True)
```

### 3.2 `embeddings/cache.py`

**Purpose**: Cache embeddings to avoid re-computation.

**Strategy**: Hash each chunk's text → check if embedding exists → compute only new ones.
Store cache as `data/embedding_cache.npz` (numpy compressed).

### 3.3 `vectorstore/chroma_store.py`

**Purpose**: Build and query a ChromaDB vector index with persistent storage.

**Why ChromaDB over FAISS**:
- Built-in persistence (auto-saves to disk)
- Built-in metadata filtering (filter by doc_type, year, jurisdiction)
- Built-in document storage (stores text alongside embeddings)
- No manual ID mapping needed
- Simple Python API

**Logic**:
```python
import chromadb
from chromadb.config import Settings

class ChromaStore:
    def __init__(self, persist_dir: str, collection_name: str):
        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}  # Use cosine similarity
        )
    
    def add(self, chunks: list[dict], embeddings: list[list[float]]):
        """Add chunks with embeddings and metadata to ChromaDB"""
        self.collection.upsert(
            ids=[c["chunk_id"] for c in chunks],
            embeddings=embeddings,
            documents=[c["text"] for c in chunks],
            metadatas=[{
                "doc_id": c["doc_id"],
                "doc_title": c["metadata"]["title"],
                "doc_type": c["metadata"]["doc_type"],
                "year": c["metadata"].get("year", 0),
                "category": c["metadata"]["category"],
                "section_ref": c.get("section_ref", ""),
                "chunk_index": c["chunk_index"]
            } for c in chunks]
        )
    
    def search(self, query_embedding: list[float], top_k: int = 15,
               where: dict = None) -> list[dict]:
        """Search by embedding with optional metadata filtering"""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where,  # e.g., {"doc_type": "act"} or {"year": {"$gte": 2023}}
            include=["documents", "metadatas", "distances"]
        )
        return [
            {
                "chunk_id": results["ids"][0][i],
                "text": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": 1 - results["distances"][0][i]  # Convert distance to similarity
            }
            for i in range(len(results["ids"][0]))
        ]
    
    def get_stats(self) -> dict:
        return {"total_chunks": self.collection.count()}
```

**ChromaDB metadata filtering examples** (powerful for legal RAG):
```python
# Only search in Acts/Statutes
results = chroma.search(query_emb, where={"doc_type": "act"})

# Only search in documents from 2023 onwards
results = chroma.search(query_emb, where={"year": {"$gte": 2023}})

# Only search in Criminal Law category
results = chroma.search(query_emb, where={"category": "Criminal Law"})

# Combine filters
results = chroma.search(query_emb, where={
    "$and": [
        {"doc_type": "judgment"},
        {"year": {"$gte": 2020}}
    ]
})
```

### 3.4 `vectorstore/bm25_store.py`

**Purpose**: Build a BM25 sparse index for keyword matching.

**Logic**:
```python
from rank_bm25 import BM25Okapi
import pickle

class BM25Store:
    def __init__(self):
        self.bm25 = None
        self.chunk_ids = []
        self.tokenized_corpus = []
    
    def build(self, chunks: list[dict]):
        """Build BM25 index from chunk texts"""
        self.chunk_ids = [c["chunk_id"] for c in chunks]
        self.tokenized_corpus = [self._tokenize(c["text"]) for c in chunks]
        self.bm25 = BM25Okapi(self.tokenized_corpus)
    
    def search(self, query: str, top_k: int = 15):
        tokenized_query = self._tokenize(query)
        scores = self.bm25.get_scores(tokenized_query)
        top_indices = scores.argsort()[-top_k:][::-1]
        return [(self.chunk_ids[i], float(scores[i])) for i in top_indices]
    
    def _tokenize(self, text: str) -> list[str]:
        """Legal-aware tokenization"""
        # Keep section references intact: "Section 302" as one token
        # Remove stopwords but keep legal terms
        ...
```

### 3.5 `scripts/build_index.py`

**Purpose**: Orchestrate: Load chunks → Embed → Store in ChromaDB → Build BM25 index.

**Estimated indexing time**: ~5-10 minutes for the full dataset (65 files, ~5000-8000 chunks).

> 💡 ChromaDB **auto-persists** — no explicit save step needed. Just point to a directory.

### 3.6 Deliverables
- [ ] `embedder.py` — SentenceTransformer-based embedding (local, free)
- [ ] `cache.py` — hash-based embedding cache
- [ ] `chroma_store.py` — ChromaDB vector store with metadata filtering
- [ ] `bm25_store.py` — BM25 index build, search, save, load
- [ ] `scripts/build_index.py` — full indexing pipeline
- [ ] **Output**: `data/chroma_db/` (persistent ChromaDB) + `data/bm25_index/` 
- [ ] Verify: Run sample queries, check if relevant chunks are returned

---

## 🔍 PHASE 4: Retrieval Engine
**Duration**: ~2-3 hours | **Difficulty**: Medium-Hard

### 4.1 `retrieval/dense_retriever.py`

**Purpose**: Semantic search using ChromaDB.

```python
class DenseRetriever:
    def retrieve(self, query: str, top_k: int = 15, 
                 filters: dict = None) -> list[RetrievalResult]:
        query_embedding = self.embedder.embed_query(query)
        results = self.chroma_store.search(
            query_embedding.tolist(), top_k, where=filters
        )
        return [
            RetrievalResult(
                chunk_id=r["chunk_id"], 
                text=r["text"],
                metadata=r["metadata"],
                score=r["score"], 
                source="dense"
            )
            for r in results
        ]
```

> 💡 **ChromaDB advantage**: You can pass `filters` to restrict search by doc_type,
> year, category, etc. — this is a major win for legal RAG.

### 4.2 `retrieval/sparse_retriever.py`

**Purpose**: Keyword search using BM25. Excels at finding exact section/article references.

```python
class SparseRetriever:
    def retrieve(self, query: str, top_k: int = 15) -> list[RetrievalResult]:
        results = self.bm25_store.search(query, top_k)
        return [
            RetrievalResult(chunk_id=cid, score=score, source="sparse")
            for cid, score in results
        ]
```

### 4.3 `retrieval/hybrid_retriever.py` ⭐ (Core Innovation)

**Purpose**: Fuse dense + sparse results using Reciprocal Rank Fusion (RRF).

**Why hybrid matters for legal RAG**:
- Dense (ChromaDB semantic): Catches conceptual matches ("right to privacy" → Article 21)
- Sparse (BM25 keyword): Catches exact matches ("Section 302 BNS" → Section 302)
- **Together**: Best of both worlds

**Algorithm**:
```
RRF_score(doc) = Σ 1 / (k + rank_in_list)

where k = 60 (constant), and we sum across both retriever lists.
```

**Logic**:
```python
class HybridRetriever:
    def retrieve(self, query: str, top_k: int = 10) -> list[RetrievalResult]:
        # Step 1: Get candidates from both retrievers
        dense_results = self.dense_retriever.retrieve(query, top_k=15)
        sparse_results = self.sparse_retriever.retrieve(query, top_k=15)
        
        # Step 2: RRF fusion
        fused = self._reciprocal_rank_fusion(dense_results, sparse_results)
        
        # Step 3: Return top-k fused results
        return fused[:top_k]
```

### 4.4 `retrieval/reranker.py` ⭐ (Quality Booster)

**Purpose**: Re-rank fused results using a cross-encoder model for high-precision relevance scoring.

**Why**: Bi-encoder embeddings are fast but approximate. Cross-encoders process (query, document) pairs jointly → much more accurate relevance judgments.

**Model**: `cross-encoder/ms-marco-MiniLM-L-6-v2` (fast, good quality)

```python
from sentence_transformers import CrossEncoder

class Reranker:
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model = CrossEncoder(model_name)
    
    def rerank(self, query: str, results: list[RetrievalResult], top_k: int = 5):
        # Create (query, chunk_text) pairs
        pairs = [(query, r.text) for r in results]
        
        # Score all pairs
        scores = self.model.predict(pairs)
        
        # Re-sort by cross-encoder scores
        for result, score in zip(results, scores):
            result.rerank_score = float(score)
        
        results.sort(key=lambda r: r.rerank_score, reverse=True)
        return results[:top_k]
```

### 4.5 Full Retrieval Pipeline

```
User Query
    │
    ▼
┌──────────────────────┐
│ Dense Retriever       │ → top 15 results
│ (ChromaDB semantic)   │
│ + metadata filtering  │
└──────────┬───────────┘
           │                    ┌─────────────────────┐
           ├────────────────────│ Sparse Retriever     │ → top 15 results
           │                    │ (BM25 keyword)       │
           │                    └──────────┬──────────┘
           │                               │
           └───────────┬───────────────────┘
                       ▼
            ┌──────────────────┐
            │ RRF Fusion       │ → top 10 fused results
            └────────┬─────────┘
                     ▼
            ┌──────────────────┐
            │ Cross-Encoder    │ → top 5 re-ranked results
            │ Reranker         │
            └────────┬─────────┘
                     ▼
              Final 5 chunks with metadata & scores
```

### 4.6 Deliverables
- [ ] `dense_retriever.py` — ChromaDB-based semantic search with metadata filters
- [ ] `sparse_retriever.py` — BM25-based keyword search
- [ ] `hybrid_retriever.py` — RRF fusion of dense + sparse
- [ ] `reranker.py` — cross-encoder re-ranking
- [ ] Verify: Test all 20 golden QA questions, check if correct source docs are in top-5
- [ ] **Target**: Retrieval accuracy ≥ 80% (correct doc in top-5 for golden QA)

---

## 🤖 PHASE 5: Generation Engine
**Duration**: ~2-3 hours | **Difficulty**: Medium

### 5.1 `generation/prompt_builder.py`

**Purpose**: Construct dynamic, legal-specific prompts with retrieved context.

**Prompt template**:
```
SYSTEM PROMPT:
You are an expert Indian Legal AI Assistant specializing in statutes,
case law, and legal procedures. You answer STRICTLY based on the retrieved
legal documents provided below.

RULES:
1. ALWAYS cite exact Section, Article, or Case name.
2. If retrieved context is insufficient, say: "I don't have sufficient
   information in my legal database to answer this accurately."
3. NEVER fabricate legal provisions or case citations.
4. Distinguish between Acts (legislation), Judgments (case law), and
   Commentary (analysis).
5. When a law has been replaced, mention BOTH old and new (e.g., IPC → BNS).
6. For procedural questions, cite the exact section of BNSS/CrPC.
7. Format your answer with clear headings and numbered points.

RETRIEVED LEGAL CONTEXT:
[Source 1: {doc_title} ({doc_type}, {year})]
{chunk_text_1}

[Source 2: {doc_title} ({doc_type}, {year})]
{chunk_text_2}

... (up to 5 sources)

USER QUESTION: {query}

Provide a comprehensive legal answer with proper citations:
```

**Dynamic context window management**:
- Count tokens in each chunk
- Fill context window up to `MAX_CONTEXT_TOKENS` (4000)
- Prioritize higher-ranked chunks
- Always include source attribution metadata

### 5.2 `generation/llm_client.py`

**Purpose**: LLM client using Ollama for local inference.

**Why Ollama**:
- 🔒 **100% local** — no data leaves your machine (important for legal data)
- 💰 **$0 cost** — no API bills, no rate limits
- 🌐 **Works offline** — no internet needed after initial model download
- ⚡ **Fast enough** — modern models on good hardware deliver sub-5s responses

**Logic**:
```python
import ollama

class LLMClient:
    def __init__(self, model: str = "llama3.2", base_url: str = "http://localhost:11434"):
        self.model = model
        self.client = ollama.Client(host=base_url)
        # Verify model is available
        models = [m['name'] for m in self.client.list()['models']]
        if not any(model in m for m in models):
            raise RuntimeError(f"Model '{model}' not found. Run: ollama pull {model}")
    
    def generate(self, system_prompt: str, user_prompt: str, 
                 temperature: float = 0.1,  # Low temp for legal accuracy
                 max_tokens: int = 2000) -> str:
        response = self.client.chat(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            options={
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": 0.9,
                "repeat_penalty": 1.1  # Reduce repetition
            }
        )
        return response['message']['content']
    
    def generate_stream(self, system_prompt: str, user_prompt: str,
                        temperature: float = 0.1):
        """Streaming generation for real-time UI updates"""
        stream = self.client.chat(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            stream=True,
            options={"temperature": temperature}
        )
        for chunk in stream:
            yield chunk['message']['content']
```

**Temperature = 0.1**: Very low for legal answers — we want factual, deterministic responses.

**Hardware requirements for Ollama**:
| Model | Min RAM | Recommended | GPU Needed? |
|-------|---------|-------------|-------------|
| `llama3.2` (3B) | 4 GB | 8 GB | No (CPU OK) |
| `mistral` (7B) | 6 GB | 16 GB | Recommended |
| `deepseek-r1:8b` | 6 GB | 16 GB | Recommended |
| `llama3.3:70b` | 40 GB | 48 GB+ | Required |

### 5.3 `generation/response_parser.py`

**Purpose**: Parse LLM output, extract citations, validate against sources.

**Logic**:
```python
class ResponseParser:
    def parse(self, raw_response: str, sources: list[dict]) -> LegalResponse:
        return LegalResponse(
            answer=raw_response,
            citations=self._extract_citations(raw_response),
            sources_used=[s["doc_title"] for s in sources],
            confidence=self._estimate_confidence(raw_response, sources),
            disclaimer="This is AI-generated legal information, not legal advice."
        )
    
    def _extract_citations(self, text: str) -> list[str]:
        """Extract Section/Article/Case references from answer"""
        patterns = [
            r'Section\s+\d+[\w]*',       # Section 302, Section 173(1)
            r'Article\s+\d+[\w]*',        # Article 21, Article 19(1)(a)
            r'Rule\s+\d+',                # Rule 5
            r'\([12]\d{3}\)\s+\d+\s+SCC', # (2024) 10 SCC 51
        ]
        ...
    
    def _estimate_confidence(self, answer: str, sources: list) -> float:
        """Heuristic confidence: higher if citations match source documents"""
        ...
```

### 5.4 `memory/conversation.py`

**Purpose**: Maintain multi-turn conversation context.

**Strategy**: Store last N turns (default=5) in memory. Use for follow-up resolution.

### 5.5 `memory/query_resolver.py`

**Purpose**: Convert follow-up queries into standalone queries.

**Example**:
```
Turn 1: "What is Section 302 of BNS?"      → standalone
Turn 2: "What is the punishment for it?"    → "What is the punishment for Section 302 of BNS?"
Turn 3: "How does it differ from the IPC?"  → "How does Section 302 of BNS differ from the IPC equivalent?"
```

**How**: Use LLM to rewrite the follow-up query given conversation history.

### 5.6 Deliverables
- [ ] `prompt_builder.py` — legal-specific prompt with dynamic context
- [ ] `llm_client.py` — multi-provider LLM client
- [ ] `response_parser.py` — citation extraction, confidence scoring
- [ ] `conversation.py` — conversation memory
- [ ] `query_resolver.py` — follow-up → standalone query resolution
- [ ] Verify: Test 10 golden QA questions end-to-end (query → retrieval → generation)
- [ ] **Target**: Answers should include correct citations for ≥ 70% of questions

---

## 🌐 PHASE 6: API Layer (FastAPI)
**Duration**: ~1-2 hours | **Difficulty**: Easy-Medium

### 6.1 `api/models.py` — Pydantic Models

```python
class QueryRequest(BaseModel):
    query: str
    conversation_id: str | None = None
    top_k: int = 5
    use_reranker: bool = True

class QueryResponse(BaseModel):
    answer: str
    citations: list[str]
    sources: list[SourceDoc]
    confidence: float
    processing_time_ms: float
    disclaimer: str

class SourceDoc(BaseModel):
    title: str
    doc_type: str
    year: int | None
    chunk_text: str
    relevance_score: float
```

### 6.2 `api/routes.py` — Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/query` | Main RAG query endpoint |
| `POST` | `/api/chat` | Multi-turn chat with memory |
| `POST` | `/api/ingest` | Ingest new documents |
| `GET`  | `/api/health` | Health check + index stats |
| `POST` | `/api/evaluate` | Run evaluation on golden QA |
| `GET`  | `/api/sources` | List all indexed documents |

### 6.3 `api/main.py` — FastAPI App

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="LegalAI RAG API",
    description="Industry-Grade Legal RAG for Indian Law",
    version="1.0.0"
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load indices on startup
@app.on_event("startup")
async def load_indices():
    # Load ChromaDB, BM25 index, embedder, reranker, Ollama client
    ...

# SSE streaming endpoint for React frontend
@app.get("/api/stream")
async def stream_query(query: str):
    """Server-Sent Events endpoint for real-time streaming to React UI"""
    from fastapi.responses import StreamingResponse
    async def event_generator():
        for token in llm_client.generate_stream(system_prompt, query):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

### 6.4 Deliverables
- [ ] `models.py` — request/response Pydantic models
- [ ] `routes.py` — all API endpoints
- [ ] `main.py` — FastAPI app with startup loading
- [ ] `middleware.py` — CORS, rate limiting, structured logging
- [ ] CORS configured for React dev server (`http://localhost:5173`)
- [ ] SSE streaming endpoint for real-time responses
- [ ] Verify: `uvicorn api.main:app --reload` starts successfully
- [ ] Test all endpoints with curl or Postman

---

## 📊 PHASE 7: Evaluation & Optimization
**Duration**: ~2-3 hours | **Difficulty**: Medium-Hard

### 7.1 Evaluation Metrics

| Metric | What It Measures | Target |
|--------|-----------------|--------|
| **Retrieval Precision@5** | % of top-5 chunks that are relevant | ≥ 80% |
| **Retrieval Recall@5** | % of relevant chunks found in top-5 | ≥ 70% |
| **Hit Rate** | % of queries where correct source doc is in top-5 | ≥ 85% |
| **MRR (Mean Reciprocal Rank)** | Average of 1/rank of first relevant result | ≥ 0.7 |
| **Answer Faithfulness** | Does the answer stay faithful to retrieved context? | ≥ 90% |
| **Citation Accuracy** | Are cited sections actually in source docs? | ≥ 95% |
| **Latency (P95)** | 95th percentile response time | ≤ 5 seconds |

### 7.2 `eval/evaluator.py`

```python
class RAGEvaluator:
    def evaluate(self, golden_qa: list[dict]) -> EvalReport:
        results = []
        for qa in golden_qa:
            # Run retrieval
            retrieved = self.retriever.retrieve(qa["question"])
            
            # Check retrieval quality
            retrieved_sources = [r.doc_title for r in retrieved]
            hit = any(expected in retrieved_sources 
                      for expected in qa["source_documents"])
            
            # Run generation
            response = self.generator.generate(qa["question"], retrieved)
            
            # Check answer quality
            citation_accuracy = self._check_citations(
                response.citations, retrieved
            )
            
            results.append({
                "question": qa["question"],
                "hit": hit,
                "mrr": self._compute_mrr(retrieved, qa["source_documents"]),
                "citation_accuracy": citation_accuracy,
                "latency_ms": response.processing_time_ms,
            })
        
        return self._aggregate(results)
```

### 7.3 Optimization Playbook

If retrieval quality is low:
```
1. Check chunk quality → Are legal sections being split incorrectly?
   Fix: Adjust chunker regex patterns, increase overlap

2. Check embedding model → Is it capturing legal semantics?
   Fix: Switch to a better model (bge-small → bge-base → OpenAI)

3. Check query expansion → Is the query too narrow?
   Fix: Add legal synonym expansion (e.g., "murder" → "culpable homicide")

4. Tune RRF weights → Is dense or sparse being under-weighted?
   Fix: Adjust RRF k constant, try different weight ratios

5. Check BM25 tokenization → Are legal terms being split?
   Fix: Add legal-aware tokenizer (keep "Section 302" as one token)
```

If generation quality is low:
```
1. Check prompt → Is the system prompt clear enough?
   Fix: Add more specific rules, example outputs

2. Check context → Is the right context reaching the LLM?
   Fix: Improve retrieval first, then generation improves automatically

3. Check temperature → Is it too creative?
   Fix: Lower to 0.05 for purely factual queries

4. Check model → Is the model capable enough?
   Fix: Upgrade from llama-3.1-8b → llama-3.3-70b → gpt-4o
```

### 7.4 Deliverables
- [ ] `eval/metrics.py` — all evaluation metric functions
- [ ] `eval/evaluator.py` — full evaluation pipeline
- [ ] `eval/report.py` — generate markdown evaluation report
- [ ] `scripts/run_eval.py` — CLI to run evaluation
- [ ] Run evaluation on golden QA set (20 questions) + FAQs (25 questions)
- [ ] Generate evaluation report with per-question breakdown
- [ ] **Target**: Hit Rate ≥ 85%, Citation Accuracy ≥ 95%

---

## 💻 PHASE 8: React Frontend (Node.js + Vite)
**Duration**: ~4-5 hours | **Difficulty**: Medium-Hard

### 8.1 Project Setup

```bash
# Create React app with Vite (from project root)
cd "Core Python RAG"
npx -y create-vite@latest client --template react
cd client
npm install

# Install additional dependencies
npm install axios react-router-dom react-markdown
npm install react-icons framer-motion
npm install -D @types/react
```

**`client/package.json`** key scripts:
```json
{
  "scripts": {
    "dev": "vite",           // Starts on http://localhost:5173
    "build": "vite build",   // Production build → client/dist/
    "preview": "vite preview"
  }
}
```

**`client/vite.config.js`**:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // FastAPI backend
        changeOrigin: true,
      }
    }
  }
})
```

### 8.2 Design System

**Theme**: Dark mode legal-grade UI with premium aesthetics.

**Color palette**:
```css
:root {
  --bg-primary: #0a0e1a;        /* Deep navy background */
  --bg-secondary: #111827;       /* Card backgrounds */
  --bg-tertiary: #1e293b;        /* Input fields, hover states */
  --accent-gold: #d4a843;        /* Legal gold — primary accent */
  --accent-blue: #3b82f6;        /* Links, interactive elements */
  --text-primary: #f1f5f9;       /* Main text */
  --text-secondary: #94a3b8;     /* Muted text */
  --text-muted: #64748b;         /* Timestamps, metadata */
  --border: #1e293b;             /* Subtle borders */
  --success: #10b981;            /* Confidence high */
  --warning: #f59e0b;            /* Confidence medium */
  --error: #ef4444;              /* Confidence low / errors */
  --glass: rgba(255,255,255,0.05); /* Glassmorphism */
}
```

**Typography**: Google Fonts — `Inter` for body, `Playfair Display` for headings.

### 8.3 Component Architecture

```
App.jsx
├── Header.jsx                    # Logo + "LegalAI" branding + nav
├── ChatPage.jsx                  # Main page
│   ├── Sidebar.jsx               # Chat history list + New Chat btn
│   │   └── ChatHistoryItem.jsx   # Individual chat entry
│   └── ChatWindow.jsx            # Core chat area
│       ├── MessageBubble.jsx     # User or AI message
│       │   ├── MarkdownRenderer  # Renders legal markdown
│       │   ├── CitationHighlight # Highlights Section/Article refs
│       │   ├── ConfidenceBadge   # 🟢🟡🔴 score indicator
│       │   └── SourceCards.jsx   # Expandable source documents
│       │       └── SourceCard    # Single source with metadata
│       ├── SearchFilters.jsx     # Optional: filter by category/year
│       ├── LoadingDots.jsx       # Typing animation
│       └── ChatInput.jsx         # Input field + send button
├── SourcesPage.jsx               # Browse all 65 indexed documents
└── EvalPage.jsx                  # Evaluation results dashboard
```

### 8.4 Key Components — Implementation Details

#### `api/ragApi.js` — API Client
```javascript
import axios from 'axios';

const API_BASE = '/api';  // Proxied to FastAPI via Vite

export const ragApi = {
  // Single query (non-streaming)
  async query(text, options = {}) {
    const { data } = await axios.post(`${API_BASE}/query`, {
      query: text,
      top_k: options.topK || 5,
      use_reranker: options.useReranker ?? true,
      conversation_id: options.conversationId || null,
    });
    return data;
  },

  // Multi-turn chat
  async chat(text, conversationId) {
    const { data } = await axios.post(`${API_BASE}/chat`, {
      query: text,
      conversation_id: conversationId,
    });
    return data;
  },

  // Streaming query via SSE
  streamQuery(text, onToken, onDone, onError) {
    const url = `${API_BASE}/stream?query=${encodeURIComponent(text)}`;
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        onDone?.();
      } else {
        onToken(event.data);
      }
    };
    
    eventSource.onerror = (err) => {
      eventSource.close();
      onError?.(err);
    };
    
    return () => eventSource.close();  // cleanup function
  },

  // Get health + index stats
  async getHealth() {
    const { data } = await axios.get(`${API_BASE}/health`);
    return data;
  },

  // List all indexed sources
  async getSources() {
    const { data } = await axios.get(`${API_BASE}/sources`);
    return data;
  },

  // Run evaluation
  async evaluate() {
    const { data } = await axios.post(`${API_BASE}/evaluate`);
    return data;
  }
};
```

#### `hooks/useChat.js` — Chat State Management
```javascript
import { useState, useCallback } from 'react';
import { ragApi } from '../api/ragApi';
import { v4 as uuidv4 } from 'uuid';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(uuidv4());

  const sendMessage = useCallback(async (text) => {
    // Add user message
    const userMsg = { id: uuidv4(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await ragApi.chat(text, conversationId);
      const aiMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        sources: response.sources,
        confidence: response.confidence,
        processingTime: response.processing_time_ms,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, an error occurred. Please check if the backend is running.',
        isError: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
```

#### `components/MessageBubble.jsx` — Message Display
```jsx
import ReactMarkdown from 'react-markdown';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceCard } from './SourceCard';
import { FiCopy, FiCheck } from 'react-icons/fi';

export function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--ai'}`}>
      <div className="message__avatar">
        {isUser ? '👤' : '⚖️'}
      </div>
      <div className="message__content">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <>
            <ReactMarkdown>{message.content}</ReactMarkdown>
            
            {message.confidence && (
              <ConfidenceBadge score={message.confidence} />
            )}
            
            {message.sources?.length > 0 && (
              <div className="message__sources">
                <h4>📚 Sources ({message.sources.length})</h4>
                {message.sources.map((src, i) => (
                  <SourceCard key={i} source={src} />
                ))}
              </div>
            )}
            
            <div className="message__actions">
              <button onClick={handleCopy} title="Copy answer">
                {copied ? <FiCheck /> : <FiCopy />}
              </button>
              {message.processingTime && (
                <span className="message__time">
                  {(message.processingTime / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

#### `components/SourceCard.jsx` — Expandable Citation
```jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiFileText } from 'react-icons/fi';

export function SourceCard({ source }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="source-card" onClick={() => setIsExpanded(!isExpanded)}>
      <div className="source-card__header">
        <FiFileText className="source-card__icon" />
        <div>
          <span className="source-card__title">{source.title}</span>
          <span className="source-card__meta">
            {source.doc_type} • {source.year || 'N/A'} • 
            Score: {(source.relevance_score * 100).toFixed(0)}%
          </span>
        </div>
        <FiChevronDown className={`source-card__chevron ${isExpanded ? 'rotated' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="source-card__body"
          >
            <pre>{source.chunk_text}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 8.5 UI Features

| Feature | Implementation |
|---------|---------------|
| **Real-time streaming** | SSE via `EventSource` API → tokens appear as they're generated by Ollama |
| **Markdown rendering** | `react-markdown` renders headings, bold, lists, code blocks |
| **Citation highlighting** | Regex detects `Section XX`, `Article XX` → wraps in `<mark>` |
| **Copy answer** | Clipboard API with visual feedback |
| **Source cards** | Collapsible cards with `framer-motion` animations |
| **Confidence badge** | 🟢 High (>0.8), 🟡 Medium (0.5-0.8), 🔴 Low (<0.5) |
| **Dark mode** | Default dark theme with CSS custom properties |
| **Glassmorphism** | `backdrop-filter: blur()` on cards and sidebar |
| **Keyboard shortcuts** | `Enter` to send, `Shift+Enter` for newline, `Ctrl+N` new chat |
| **Chat history** | Sidebar with previous conversations (stored in `localStorage`) |
| **Responsive** | Mobile-friendly layout with CSS Grid + Flexbox |
| **Loading animation** | Pulsing dots ("Legal AI is thinking...") |
| **Filter panel** | Optional category/year/doc_type filters before sending query |
| **Document browser** | `/sources` page lists all 65 indexed documents |
| **Eval dashboard** | `/eval` page shows golden QA results with metrics charts |

### 8.6 Running the Frontend

```bash
# Terminal 1: Start FastAPI backend
cd "Core Python RAG"
uvicorn api.main:app --reload --port 8000

# Terminal 2: Start React dev server
cd "Core Python RAG/client"
npm run dev
# → Opens http://localhost:5173 (proxies /api to :8000)
```

**Production build**:
```bash
cd client
npm run build
# Output: client/dist/
# Then serve from FastAPI:
#   app.mount("/", StaticFiles(directory="client/dist", html=True))
```

### 8.7 Deliverables
- [ ] React project scaffolded with Vite (`client/` directory)
- [ ] `ragApi.js` — Axios API client with streaming support
- [ ] `useChat.js` — Chat state management hook
- [ ] `ChatWindow.jsx` — Main chat interface with message list + input
- [ ] `MessageBubble.jsx` — Markdown rendering + citation highlighting
- [ ] `SourceCard.jsx` — Expandable source citation cards with animations
- [ ] `Sidebar.jsx` — Chat history with localStorage persistence
- [ ] `Header.jsx` — Branded navbar
- [ ] `SourcesPage.jsx` — Document browser page
- [ ] `EvalPage.jsx` — Evaluation dashboard
- [ ] `index.css` — Complete dark theme design system
- [ ] Vite proxy configured to FastAPI backend
- [ ] Production build works (`npm run build`)
- [ ] Served at `http://localhost:5173` (dev) or built into FastAPI

---

## 📋 EXECUTION TIMELINE

```
DAY 1: ┌──────────────────────────────────────────┐
       │ Phase 1: Setup + Config + Ollama          │ ~1.5 hrs
       │ Phase 2: Ingestion Pipeline               │ ~3 hrs
       └──────────────────────────────────────────┘

DAY 2: ┌──────────────────────────────────────────┐
       │ Phase 3: Embedding + Index Building       │ ~3 hrs
       │ Phase 4: Retrieval Engine (start)         │ ~2 hrs
       └──────────────────────────────────────────┘

DAY 3: ┌──────────────────────────────────────────┐
       │ Phase 4: Retrieval Engine (complete)      │ ~1 hr
       │ Phase 5: Generation Engine                │ ~3 hrs
       └──────────────────────────────────────────┘

DAY 4: ┌──────────────────────────────────────────┐
       │ Phase 6: API Layer (FastAPI + CORS)       │ ~2 hrs
       │ Phase 7: Evaluation + Tuning              │ ~3 hrs
       └──────────────────────────────────────────┘

DAY 5: ┌──────────────────────────────────────────┐
       │ Phase 8: React UI — Setup + Components    │ ~3 hrs
       └──────────────────────────────────────────┘

DAY 6: ┌──────────────────────────────────────────┐
       │ Phase 8: React UI — Pages + Streaming     │ ~2 hrs
       │ Final Integration Testing + Documentation │ ~2 hrs
       └──────────────────────────────────────────┘
```

---

## 🔑 KEY DEPENDENCIES & SETUP

| Component | What For | Cost | Link |
|-----------|----------|------|------|
| **Ollama** | Local LLM inference | ✅ Free (open source) | [ollama.com/download](https://ollama.com/download) |
| **ChromaDB** | Vector store (via pip) | ✅ Free (open source) | [docs.trychroma.com](https://docs.trychroma.com) |
| **HuggingFace** | Embedding model download (auto) | ✅ Free | [huggingface.co](https://huggingface.co) |
| **sentence-transformers** | Local embeddings (via pip) | ✅ Free | [sbert.net](https://www.sbert.net) |

> 🎉 **Total cost: $0** — Everything runs locally. No API keys. No cloud bills. No data leaves your machine.

---

## ✅ SUCCESS CRITERIA

| Criteria | Target | How to Verify |
|----------|--------|---------------|
| All documents ingested | 65/65 files | Check `data/metadata.db` |
| Chunks generated | 5000-8000 total | Check `data/chunks/all_chunks.jsonl` |
| ChromaDB index built | Collection exists | `chroma_store.get_stats()` returns count |
| BM25 index built | Pickle file exists | Check `data/bm25_index/bm25.pkl` |
| Ollama responds | Model loaded | `ollama list` shows model |
| Query → Answer works | End-to-end test | Test 5 sample queries |
| Retrieval Hit Rate | ≥ 85% | Run `scripts/run_eval.py` |
| Citation Accuracy | ≥ 95% | Manual review of 20 golden QA |
| API responds | < 8s P95 latency | Load test with `curl` (local LLM is slower) |
| React UI works | Chat interface loads | `npm run dev` → `http://localhost:5173` |
| React build works | No build errors | `npm run build` produces `client/dist/` |

---

## 🚨 RISK MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF extraction fails on some files | Missing data | Use 3 fallback extractors + log failures |
| Embedding model too slow | Long indexing | Batch processing + cache + GPU if available |
| Ollama model too slow | Slow responses | Use smaller model (3B) for dev, upgrade for prod |
| Ollama not running | Generation fails | Add health check on startup, auto-detect model |
| Chunking breaks legal sections | Bad retrieval | Extensive regex testing on sample docs |
| ChromaDB collection too large | Slow queries | ChromaDB handles millions of docs well; no concern at this scale |
| Hallucinated citations | Legal liability | Post-process: verify every citation against sources |
| Insufficient RAM for LLM | OOM crash | Use `llama3.2` (3B) — needs only 4GB RAM |

---

> **Ready to start building? We'll begin with Phase 1: Project Setup & Configuration.**
