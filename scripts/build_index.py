"""
Build Index — Load chunks, generate embeddings, and build ChromaDB + BM25 indices.
Run this after ingestion to prepare the retrieval system.

Usage: python -m scripts.build_index
"""
import json
import logging
import sys
from pathlib import Path
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from embeddings.embedder import Embedder
from vectorstore.chroma_store import ChromaStore
from vectorstore.bm25_store import BM25Store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(config.LOG_PATH / "indexing.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


def load_chunks() -> list[dict]:
    """Load chunks from the JSONL file."""
    chunks_file = config.CHUNKS_DIR / "all_chunks.jsonl"
    if not chunks_file.exists():
        print(f"❌ Chunks file not found: {chunks_file}")
        print("   Run 'python -m scripts.ingest_all' first.")
        sys.exit(1)

    chunks = []
    with open(chunks_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                chunks.append(json.loads(line))

    print(f"   Loaded {len(chunks)} chunks from {chunks_file}")
    return chunks


def build_index(reset: bool = False):
    """Build both ChromaDB (dense) and BM25 (sparse) indices."""
    print("\n" + "=" * 60)
    print("   🧮 LEGAL RAG — Index Building Pipeline")
    print("=" * 60)

    # Step 1: Load chunks
    print("\n📦 Loading chunks...")
    chunks = load_chunks()

    if not chunks:
        print("❌ No chunks found. Run ingestion first.")
        return

    # Step 2: Initialize embedder
    print(f"\n🧠 Loading embedding model: {config.EMBEDDING_MODEL}")
    embedder = Embedder(config.EMBEDDING_MODEL)

    # Step 3: Generate embeddings
    print(f"\n⚡ Generating embeddings for {len(chunks)} chunks...")
    texts = [c["text"] for c in chunks]
    embeddings = embedder.embed_chunks(texts, batch_size=config.EMBEDDING_BATCH_SIZE)
    print(f"   Generated {len(embeddings)} embeddings (dim={len(embeddings[0])})")

    # Step 4: Build ChromaDB index
    print(f"\n🗄️  Building ChromaDB index...")
    chroma = ChromaStore(config.CHROMA_PERSIST_DIR, config.CHROMA_COLLECTION)
    if reset:
        print("   Resetting existing collection...")
        chroma.reset()
    chroma.add(chunks, embeddings)
    stats = chroma.get_stats()
    print(f"   ChromaDB ready — {stats['total_chunks']} chunks indexed")

    # Step 5: Build BM25 index
    print(f"\n📚 Building BM25 index...")
    bm25 = BM25Store()
    bm25.build(chunks)
    bm25.save(str(config.BM25_DIR))
    print(f"   BM25 index saved — {len(chunks)} chunks indexed")

    # Summary
    print("\n" + "=" * 60)
    print("   ✅ INDEX BUILDING COMPLETE")
    print("=" * 60)
    print(f"   🗄️  ChromaDB: {stats['total_chunks']} chunks at {config.CHROMA_PERSIST_DIR}")
    print(f"   📚 BM25: {len(chunks)} chunks at {config.BM25_DIR}")
    print(f"   🧠 Embedding model: {config.EMBEDDING_MODEL} (dim={len(embeddings[0])})")
    print()


if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    if reset_flag:
        print("⚠️  Reset mode: existing indices will be cleared")
    build_index(reset=reset_flag)
