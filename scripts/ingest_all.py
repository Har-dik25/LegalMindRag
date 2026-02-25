"""
Ingest All — Parse, clean, chunk, and save all documents from the dataset.
Run this once to prepare data for indexing.

Usage: python -m scripts.ingest_all
"""
import json
import logging
import sys
from pathlib import Path
from tqdm import tqdm

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from ingestion.pdf_parser import discover_files, parse_file
from ingestion.text_cleaner import clean_text
from ingestion.metadata_extractor import extract_metadata
from ingestion.chunker import chunk_document

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(config.LOG_PATH / "ingestion.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


def run_ingestion():
    """Run the full ingestion pipeline."""
    print("\n" + "=" * 60)
    print("   📄 LEGAL RAG — Document Ingestion Pipeline")
    print("=" * 60)

    dataset_path = config.DATASET_PATH
    chunks_file = config.CHUNKS_DIR / "all_chunks.jsonl"

    if not dataset_path.exists():
        logger.error(f"Dataset path not found: {dataset_path}")
        print(f"\n❌ Dataset not found at: {dataset_path}")
        return

    # Step 1: Discover files
    print(f"\n📂 Scanning: {dataset_path}")
    files = discover_files(dataset_path)
    print(f"   Found {len(files)} files ({sum(1 for f in files if f.suffix == '.pdf')} PDFs, "
          f"{sum(1 for f in files if f.suffix == '.txt')} TXTs)")

    # Step 2: Parse, clean, extract metadata, and chunk
    all_chunks = []
    all_metadata = []
    failed_files = []

    print(f"\n🔄 Processing documents...\n")

    for file_path in tqdm(files, desc="Ingesting", unit="file"):
        try:
            # Parse
            parsed = parse_file(file_path)
            if parsed is None:
                failed_files.append((file_path.name, "extraction_failed"))
                continue

            # Clean
            parsed["raw_text"] = clean_text(parsed["raw_text"])

            if len(parsed["raw_text"].strip()) < 50:
                failed_files.append((file_path.name, "too_short_after_cleaning"))
                continue

            # Extract metadata
            metadata = extract_metadata(parsed, dataset_path)
            all_metadata.append(metadata)

            # Chunk
            chunks = chunk_document(
                text=parsed["raw_text"],
                metadata=metadata,
                chunk_size=config.CHUNK_SIZE,
                chunk_overlap=config.CHUNK_OVERLAP,
                min_chunk_size=config.MIN_CHUNK_SIZE,
            )
            all_chunks.extend(chunks)

        except Exception as e:
            failed_files.append((file_path.name, str(e)))
            logger.error(f"Failed to process {file_path.name}: {e}")

    # Step 3: Save chunks to JSONL
    print(f"\n💾 Saving {len(all_chunks)} chunks to {chunks_file}...")
    with open(chunks_file, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    # Step 4: Save metadata
    metadata_file = config.CHUNKS_DIR / "documents_metadata.json"
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(all_metadata, f, indent=2, ensure_ascii=False)

    # Summary
    print("\n" + "=" * 60)
    print("   ✅ INGESTION COMPLETE")
    print("=" * 60)
    print(f"   📄 Documents processed: {len(all_metadata)}/{len(files)}")
    print(f"   📦 Total chunks: {len(all_chunks)}")
    print(f"   📊 Avg chunks/doc: {len(all_chunks) // max(len(all_metadata), 1)}")
    print(f"   📊 Avg tokens/chunk: {sum(c['token_count'] for c in all_chunks) // max(len(all_chunks), 1)}")
    print(f"   💾 Chunks saved: {chunks_file}")
    print(f"   💾 Metadata saved: {metadata_file}")

    if failed_files:
        print(f"\n   ⚠️  Failed files ({len(failed_files)}):")
        for name, reason in failed_files:
            print(f"      - {name}: {reason}")

    print()
    return all_chunks, all_metadata


if __name__ == "__main__":
    run_ingestion()
