"""
Kaggle Data Ingestion Script
Searches for Indian legal datasets and downloads them via the Kaggle API.
"""
import os
import sys
import zipfile
import logging
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")
logger = logging.getLogger(__name__)

def run_kaggle_ingest(limit_files=5000):
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
    except ImportError:
        logger.error("Kaggle package not installed. Run: pip install kaggle")
        return

    logger.info("=" * 60)
    logger.info("📥 KAGGLE INGESTION: Fetching Indian Legal Datasets")
    logger.info("=" * 60)

    try:
        api = KaggleApi()
        api.authenticate()
    except Exception as e:
        logger.error(f"Kaggle authentication failed: {e}. Please ensure ~/.kaggle/kaggle.json or access_token is set.")
        return

    TARGET_DATASETS = [
        "vangap/indian-supreme-court-judgments",
        "adarshsingh0903/legal-dataset-sc-judgments-india-19502024",
        "shivvamm/indian-supreme-court-dataset",
    ]

    download_dir = config.ROOT_DIR / "SamvidhanAI Dataset" / "kaggle"
    download_dir.mkdir(parents=True, exist_ok=True)

    for dataset_ref in TARGET_DATASETS:
        logger.info(f"Downloading dataset {dataset_ref}...")
        try:
            api.dataset_download_files(dataset_ref, path=str(download_dir), unzip=True)
            logger.info(f"✅ Download and extraction complete to {download_dir}")
        except Exception as e:
            logger.error(f"Failed to download dataset {dataset_ref}: {e}")
            continue

    # Post-process: rename and move txt/pdf files up, optionally process CSVs
    logger.info("Processing downloaded files...")
    target_files = list(download_dir.rglob("*.txt")) + list(download_dir.rglob("*.pdf"))
    csv_files = list(download_dir.rglob("*.csv"))
    
    count = 0
    for target_file in target_files:
        if count >= limit_files:
            break
        # Move to main dataset folder
        dest = config.DATASET_PATH / f"kaggle_{target_file.name}"
        if not dest.exists():
            target_file.rename(dest)
            count += 1
            
    logger.info(f"Ingested {count} .txt/.pdf cases from Kaggle.")
    logger.info("Note: CSV files (if any) need custom parsing logic based on schema.")
    for csv_file in csv_files:
        logger.info(f"Found CSV dataset: {csv_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=5000, help="Max files to process")
    args = parser.parse_args()
    run_kaggle_ingest(args.limit)
