"""
Build Index — Load chunks, generate embeddings, and build ChromaDB + BM25 indices.
Now supports incremental updates via SQLite metadata.

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
from ingestion.db import MetadataDB

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(config.LOG_PATH / "indexing.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


def load_chunks(file_path: Path) -> list[dict]:
    """Load chunks from a JSONL file."""
    if not file_path.exists():
        return []

    chunks = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                chunks.append(json.loads(line))
    return chunks


def build_index(reset: bool = False):
    """Build or update ChromaDB (dense) and BM25 (sparse) indices."""
    print("\n" + "=" * 60)
    print("   🧮 SAMVIDHAN AI — Index Building Pipeline")
    print("=" * 60)

    db = MetadataDB(config.METADATA_DB)
    chroma = ChromaStore(config.CHROMA_PERSIST_DIR, config.CHROMA_COLLECTION)

    if reset:
        print("\n⚠️  Resetting ChromaDB and Metadata DB...")
        chroma.reset()
        with db._get_connection() as conn:
            conn.cursor().execute("DELETE FROM embedding_metadata")
            conn.commit()
        
        chunks_file = config.CHUNKS_DIR / "all_chunks.jsonl"
        print(f"📦 Loading all chunks from {chunks_file.name}...")
        chunks = load_chunks(chunks_file)
    else:
        chunks_file = config.CHUNKS_DIR / "incremental_chunks.jsonl"
        print(f"📦 Loading incremental chunks from {chunks_file.name}...")
        chunks = load_chunks(chunks_file)

    if chunks:
        if not reset:
            # Incremental step: delete old vectors for modified files
            unique_files = {c.get("rel_filepath") for c in chunks if c.get("rel_filepath")}
            print(f"   Found chunks for {len(unique_files)} modified/new files. Cleaning old vectors...")
            for rel_filepath in unique_files:
                old_chunk_ids = db.get_chunks_for_document(rel_filepath)
                if old_chunk_ids:
                    chroma.delete(old_chunk_ids)
                    db.delete_chunks_for_document(rel_filepath)

        # Generate embeddings
        print(f"\n🧠 Loading embedding model: {config.EMBEDDING_MODEL}")
        embedder = Embedder(config.EMBEDDING_MODEL)

        print(f"\n⚡ Generating embeddings for {len(chunks)} chunks...")
        texts = [c["text"] for c in chunks]
        embeddings = embedder.embed_chunks(texts, batch_size=config.EMBEDDING_BATCH_SIZE)
        
        # Add to Chroma
        print(f"\n🗄️  Adding to ChromaDB...")
        chroma.add(chunks, embeddings)
        
        # Update metadata DB
        print(f"   Updating SQLite metadata for chunks...")
        for c in chunks:
            rel_path = c.get("rel_filepath", "unknown")
            db.insert_chunk_metadata(c["chunk_id"], rel_path, c["chunk_id"])

    else:
        print("   ✅ No chunks to embed for ChromaDB.")

    stats = chroma.get_stats()
    print(f"   ChromaDB now has {stats['total_chunks']} total chunks.")

    # Step 5: Build BM25 index from scratch (using all chunks)
    # BM25 is fast enough to rebuild and needs full corpus IDF stats
    print(f"\n📚 Building BM25 index from all chunks...")
    all_chunks = load_chunks(config.CHUNKS_DIR / "all_chunks.jsonl")
    if all_chunks:
        bm25 = BM25Store()
        bm25.build(all_chunks)
        bm25.save(str(config.BM25_DIR))
        print(f"   BM25 index saved — {len(all_chunks)} chunks indexed")
    else:
        print("   ❌ No chunks found to build BM25.")

    # Summary
    print("\n" + "=" * 60)
    print("   ✅ INDEX BUILDING COMPLETE")
    print("=" * 60)
    print(f"   🗄️  ChromaDB: {stats['total_chunks']} chunks at {config.CHROMA_PERSIST_DIR}")
    if all_chunks:
        print(f"   📚 BM25: {len(all_chunks)} chunks at {config.BM25_DIR}")
    print()


if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv or "--rebuild" in sys.argv
    build_index(reset=reset_flag)
