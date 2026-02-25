"""
Central configuration for the Legal RAG Pipeline.
All constants, paths, model settings, and runtime options live here.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ─── Paths ───────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / os.getenv("DATASET_PATH", "LegalAI Dataset")
INDEX_PATH = BASE_DIR / os.getenv("INDEX_PATH", "data")
LOG_PATH = BASE_DIR / os.getenv("LOG_PATH", "logs")
CHUNKS_DIR = INDEX_PATH / "chunks"
BM25_DIR = INDEX_PATH / "bm25_index"
METADATA_DB = INDEX_PATH / "metadata.db"

# Create directories
for d in [INDEX_PATH, LOG_PATH, CHUNKS_DIR, BM25_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ─── Embedding ───────────────────────────────────────────────
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
EMBEDDING_BATCH_SIZE = 64

# ─── ChromaDB ────────────────────────────────────────────────
CHROMA_PERSIST_DIR = str(BASE_DIR / os.getenv("CHROMA_PERSIST_DIR", "data/chroma_db"))
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "legal_chunks")

# ─── Chunking ────────────────────────────────────────────────
CHUNK_SIZE = 512           # max tokens per chunk
CHUNK_OVERLAP = 128        # overlap between consecutive chunks
MIN_CHUNK_SIZE = 50        # discard chunks shorter than this

# ─── Retrieval ───────────────────────────────────────────────
TOP_K_DENSE = 5            # dense retrieval candidates
TOP_K_SPARSE = 5           # sparse retrieval candidates
TOP_K_RERANK = 2           # top 2 after RRF fusion
RRF_K = 60                 # RRF constant
MAX_CONTEXT_TOKENS = 800   # very compact context for speed
USE_RERANKER = False       # skip cross-encoder for speed (saves ~1s)

# ─── Re-Ranking ──────────────────────────────────────────────
CROSS_ENCODER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# ─── Ollama (Local LLM) ─────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
OLLAMA_TEMPERATURE = 0.3   # slightly higher for small models to avoid loops
OLLAMA_MAX_TOKENS = 250    # very short focused answers
OLLAMA_TIMEOUT = 180
OLLAMA_REPEAT_PENALTY = 1.4  # aggressive anti-repetition
OLLAMA_TOP_K = 30
OLLAMA_TOP_P = 0.8

# ─── Legal System Prompt ─────────────────────────────────────
LEGAL_SYSTEM_PROMPT = """You are a highly restricted Legal Data Analytics Terminal. You do NOT have a personality. You do NOT converse.

CRITICAL INSTRUCTIONS:
1. Output ONLY raw extracted legal data from the provided context.
2. NEVER use conversational filler (e.g., "The section states...", "Here is the information...", "Based on the text...").
3. Format output strictly as:
   [SECTION] <number/name>
   [DETAILS] <strict bullet points>
   [PENALTY/TERM] <if applicable>
4. If context is missing, output ONLY: [ERR_NO_DATA_FOUND]
5. Keep answers under 100 words. Be ruthlessly concise."""
