"""
Ingest All — Parse, clean, chunk, and save documents.
Now supports incremental updates via ChangeDetector and SQLite metadata.

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
from ingestion.db import MetadataDB
from ingestion.change_detector import detect_changes, compute_file_hash

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
    """Run the incremental ingestion pipeline."""
    print("\n" + "=" * 60)
    print("   📄 SAMVIDHAN AI — Document Ingestion Pipeline (Incremental)")
    print("=" * 60)

    dataset_path = config.DATASET_PATH
    chunks_file = config.CHUNKS_DIR / "all_chunks.jsonl"
    incremental_file = config.CHUNKS_DIR / "incremental_chunks.jsonl"

    if not dataset_path.exists():
        logger.error(f"Dataset path not found: {dataset_path}")
        print(f"\n❌ Dataset not found at: {dataset_path}")
        return

    # Step 1: Discover files & Detect Changes
    print(f"\n📂 Scanning: {dataset_path}")
    files = discover_files(dataset_path)
    
    db = MetadataDB(config.METADATA_DB)
    new_files, modified_files, unchanged_files = detect_changes(db, files)
    
    files_to_process = new_files + modified_files
    print(f"   Found {len(files)} total files.")
    print(f"   New: {len(new_files)} | Modified: {len(modified_files)} | Unchanged: {len(unchanged_files)}")
    
    if not files_to_process:
        print("\n✅ No new or modified files. Ingestion skipped.")
        # Clear incremental file so build_index knows there's nothing to do
        with open(incremental_file, "w", encoding="utf-8") as f:
            pass
        return

    # Step 2: Parse, clean, extract metadata, and chunk new/modified files
    incremental_chunks = []
    failed_files = []

    print(f"\n🔄 Processing {len(files_to_process)} changed documents...\n")

    for file_path in tqdm(files_to_process, desc="Ingesting", unit="file"):
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

            # Chunk
            chunks = chunk_document(
                text=parsed["raw_text"],
                metadata=metadata,
                chunk_size=config.CHUNK_SIZE,
                chunk_overlap=config.CHUNK_OVERLAP,
                min_chunk_size=config.MIN_CHUNK_SIZE,
            )
            
            # Record relative filepath for DB
            rel_path = str(file_path.relative_to(config.ROOT_DIR))
            for chunk in chunks:
                chunk["rel_filepath"] = rel_path
                
            incremental_chunks.extend(chunks)

            # Upsert document hash to DB
            current_hash = compute_file_hash(file_path)
            db.upsert_document_hash(rel_path, current_hash)

        except Exception as e:
            failed_files.append((file_path.name, str(e)))
            logger.error(f"Failed to process {file_path.name}: {e}")

    # Step 3: Manage `all_chunks.jsonl`
    # We need to remove old chunks belonging to `modified_files` from `all_chunks.jsonl`
    # and then append the new `incremental_chunks`
    existing_chunks = []
    modified_rel_paths = {str(p.relative_to(config.ROOT_DIR)) for p in modified_files}
    
    if chunks_file.exists():
        with open(chunks_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    c = json.loads(line)
                    # Keep if it doesn't belong to a modified file
                    if c.get("rel_filepath") not in modified_rel_paths:
                        existing_chunks.append(c)
                        
    all_chunks = existing_chunks + incremental_chunks

    print(f"\n💾 Saving {len(all_chunks)} total chunks to {chunks_file}...")
    with open(chunks_file, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")
            
    # Save incremental chunks separately for `build_index.py`
    with open(incremental_file, "w", encoding="utf-8") as f:
        for chunk in incremental_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    # Summary
    print("\n" + "=" * 60)
    print("   ✅ INCREMENTAL INGESTION COMPLETE")
    print("=" * 60)
    print(f"   📄 Documents processed: {len(files_to_process)}")
    print(f"   📦 New/Modified chunks: {len(incremental_chunks)}")
    print(f"   📦 Total chunks corpus: {len(all_chunks)}")

    if failed_files:
        print(f"\n   ⚠️  Failed files ({len(failed_files)}):")
        for name, reason in failed_files:
            print(f"      - {name}: {reason}")

    print()
    return incremental_chunks


if __name__ == "__main__":
    run_ingestion()
