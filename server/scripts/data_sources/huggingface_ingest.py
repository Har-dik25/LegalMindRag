"""
Bulk Download Script for Samvidhan AI

Downloads real Indian Supreme Court cases from the open-source HuggingFace dataset
Exploration-Lab/ILDC_multi (Indian Legal Documents Corpus).

Usage: python -m scripts.bulk_download --limit 1000
"""
import sys
import logging
import argparse
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")
logger = logging.getLogger(__name__)

def _sanitise_filename(text: str, max_len: int = 80) -> str:
    """Turn a string into a safe filename."""
    text = re.sub(r"[^\w\s\-]", "", text)
    text = re.sub(r"\s+", "_", text.strip())
    return text[:max_len]

def bulk_download(limit: int):
    try:
        from datasets import load_dataset
    except ImportError:
        logger.error("The 'datasets' package is missing. Run: pip install datasets")
        return

    logger.info("=" * 60)
    logger.info(f"📥 BULK DOWNLOADING {limit} CASES FROM HUGGINGFACE")
    logger.info("=" * 60)
    logger.info("Connecting to sujantkumarkv/indian_legal_corpus...")
    
    # Load dataset in streaming mode to avoid massive RAM usage
    try:
        dataset = load_dataset("sujantkumarkv/indian_legal_corpus", split="train", streaming=True)
    except Exception as e:
        logger.error(f"Failed to connect to HuggingFace dataset: {e}")
        return
        
    dataset_path = config.DATASET_PATH
    dataset_path.mkdir(parents=True, exist_ok=True)
    
    count = 0
    skipped = 0
    
    import hashlib
    
    for row in dataset:
        if count >= limit:
            break
            
        text = row.get("text", "")
        if len(text) < 500:
            skipped += 1
            continue
            
        # Use a hash of the text to ensure uniqueness
        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:12]
        safe_name = f"indian_legal_corpus_{text_hash}"
        filename = f"{safe_name}.txt"
        filepath = dataset_path / filename
        
        # Save to file if it doesn't already exist
        if not filepath.exists():
            try:
                filepath.write_text(text, encoding="utf-8")
                count += 1
            except Exception as e:
                logger.error(f"Failed to write {filename}: {e}")
                continue
        else:
            skipped += 1
        
        if count % 100 == 0 and count > 0:
            logger.info(f"  ...Downloaded {count}/{limit} cases so far")
            
    logger.info("=" * 60)
    logger.info(f"✅ BULK DOWNLOAD COMPLETE")
    logger.info(f"   Saved {count} new cases to {dataset_path}")
    logger.info(f"   Skipped {skipped} cases (already existed or too short)")
    logger.info("=" * 60)
    logger.info("To index these files, run: python -m scripts.pipeline --run-now")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk download Indian Legal cases from HuggingFace")
    parser.add_argument("--limit", type=int, default=1000, help="Number of cases to download")
    args = parser.parse_args()
    
    bulk_download(args.limit)
