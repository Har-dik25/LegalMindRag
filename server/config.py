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

# ─── Extractive Legal AI Overview Settings ────────────────────
# Pure Zero-LLM Deterministic Synthesis Engine
EXTRACTIVE_MODE = True
CONFIDENCE_THRESHOLD = 0.65
MAX_STATUTORY_SNIPPETS = 6
