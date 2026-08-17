"""
Quick Index Statutes — Rapidly ingests and indexes core Indian statutes and benchmarks.
Ensures BNS 2023, BNSS 2023, BSA 2023, Constitution of India, IPC, Special Laws,
and all existing chunks are indexed into ChromaDB and BM25.
"""
import sys
import json
import logging
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from ingestion.pdf_parser import parse_file
from ingestion.text_cleaner import clean_text
from ingestion.metadata_extractor import extract_metadata
from ingestion.chunker import chunk_document
from embeddings.embedder import Embedder
from vectorstore.chroma_store import ChromaStore
from vectorstore.bm25_store import BM25Store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

CORE_STATUTES = [
    "Bharatiya_Nyaya_Sanhita_2023.txt",
    "Bharatiya_Nagarik_Suraksha_Sanhita_2023.txt",
    "Bharatiya_Sakshya_Adhiniyam_2023.txt",
    "Constitution_of_India_Compilation.txt",
    "Indian_Penal_Code_and_CrPC_Comparison.txt",
    "Indian_Commercial_Cyber_Special_Laws.txt",
    "Legal_Maxims_Principles_Doctrines.txt",
]


def index_statutes_and_rebuild():
    print("=" * 65)
    print("🚀 QUICK INDEXER — Core Indian Statutes & Benchmark Corpus")
    print("=" * 65)

    dataset_path = config.DATASET_PATH
    chunks_file = config.CHUNKS_DIR / "all_chunks.jsonl"

    # Step 1: Load existing chunks if present
    existing_chunks = []
    existing_file_names = set()
    if chunks_file.exists():
        with open(chunks_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    c = json.loads(line)
                    fn = c.get("metadata", {}).get("file_name", "")
                    # Don't duplicate core statutes if we are re-indexing them
                    if fn not in CORE_STATUTES:
                        existing_chunks.append(c)
                        existing_file_names.add(fn)
        print(f"📦 Loaded {len(existing_chunks)} existing background chunks.")

    # Step 2: Ingest core statutes
    new_statute_chunks = []
    for fname in CORE_STATUTES:
        fpath = dataset_path / fname
        if not fpath.exists():
            print(f"⚠️ Warning: {fname} not found in {dataset_path}")
            continue

        print(f"📄 Processing: {fname}")
        parsed = parse_file(fpath)
        if not parsed:
            continue

        parsed["raw_text"] = clean_text(parsed["raw_text"])
        metadata = extract_metadata(parsed, dataset_path)

        chunks = chunk_document(
            text=parsed["raw_text"],
            metadata=metadata,
            chunk_size=config.CHUNK_SIZE,
            chunk_overlap=config.CHUNK_OVERLAP,
            min_chunk_size=config.MIN_CHUNK_SIZE,
        )

        for c in chunks:
            c["rel_filepath"] = f"SamvidhanAI Dataset/{fname}"
            # Ensure metadata has file_name and section_ref
            c["metadata"]["file_name"] = fname
            if c.get("section_ref"):
                c["metadata"]["section_ref"] = c["section_ref"]

        new_statute_chunks.extend(chunks)
        print(f"   -> Generated {len(chunks)} chunks for {fname}")

    # Combine
    all_chunks = new_statute_chunks + existing_chunks

    print(f"\n💾 Saving {len(all_chunks)} total chunks to {chunks_file}...")
    with open(chunks_file, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    # Step 3: Embed and index into ChromaDB
    print("\n🧠 Initializing Embedder and ChromaDB...")
    embedder = Embedder(config.EMBEDDING_MODEL)
    chroma = ChromaStore(config.CHROMA_PERSIST_DIR, config.CHROMA_COLLECTION, embedding_function=embedder.embeddings)

    print("⚠️  Resetting ChromaDB collection...")
    chroma.reset()

    print(f"⚡ Generating embeddings for {len(all_chunks)} chunks...")
    texts = [c["text"] for c in all_chunks]
    embeddings = embedder.embed_chunks(texts, batch_size=config.EMBEDDING_BATCH_SIZE)

    print("🗄️  Writing chunks to ChromaDB...")
    chroma.add(all_chunks, embeddings)

    # Step 4: Build BM25 Index
    print("\n📚 Building BM25 Index...")
    bm25 = BM25Store()
    bm25.build(all_chunks)
    bm25.save(str(config.BM25_DIR))

    print("\n" + "=" * 65)
    print("✅ QUICK INDEXING COMPLETE!")
    print(f"   Total Chunks Indexed: {len(all_chunks)}")
    print(f"   ChromaDB: {config.CHROMA_PERSIST_DIR}")
    print(f"   BM25: {config.BM25_DIR}")
    print("=" * 65)


if __name__ == "__main__":
    index_statutes_and_rebuild()
