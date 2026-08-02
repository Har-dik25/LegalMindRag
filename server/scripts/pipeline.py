"""
Samvidhan AI Pipeline Orchestrator.
Uses APScheduler to run the end-to-end data pipeline on a schedule.

Flow: Scrape -> Ingest (Incremental) -> Build Index (Incremental) -> DVC Commit
"""
import sys
import logging
from pathlib import Path
import subprocess
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from scripts.data_sources.web_scraper import scrape_all
from scripts.ingest_all import run_ingestion
from scripts.build_index import build_index
from ingestion.db import MetadataDB

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(config.LOG_PATH / "pipeline.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

def run_dvc_commit():
    """Commit changes to DVC."""
    logger.info("Committing dataset changes to DVC...")
    try:
        # Add the dataset and chunks
        subprocess.run(["python", "-m", "dvc", "add", "SamvidhanAI Dataset"], check=True, cwd=config.ROOT_DIR)
        subprocess.run(["python", "-m", "dvc", "add", "data/chunks"], check=True, cwd=config.ROOT_DIR)
        logger.info("DVC add successful.")
    except subprocess.CalledProcessError as e:
        logger.error(f"DVC add failed: {e}")

def run_pipeline():
    """Run the entire data pipeline sequentially."""
    start_time = datetime.now()
    logger.info("="*60)
    logger.info("🚀 STARTING SAMVIDHAN AI DATA PIPELINE")
    logger.info("="*60)
    
    try:
        # Phase 1: Collect new data from all sources
        logger.info("STEP 1/4: COLLECTING NEW DOCUMENTS")
        
        # Scraper (Indian Kanoon & Statutes)
        scrape_results = scrape_all(config.DATASET_PATH)
        docs_scraped = sum(1 for r in scrape_results if r.get("status") == "saved")
        
        # Kaggle
        from scripts.data_sources.kaggle_ingest import run_kaggle_ingest
        run_kaggle_ingest(limit_files=config.INGESTION_BATCH_LIMIT)
        
        # HuggingFace
        from scripts.data_sources.huggingface_ingest import bulk_download
        bulk_download(limit=config.INGESTION_BATCH_LIMIT)
        
        # Phase 2: Ingest (Detect changes, parse, clean, chunk)
        logger.info("\nSTEP 2/4: INGESTION (INCREMENTAL)")
        incremental_chunks = run_ingestion()
        
        # Phase 3: Indexing (Embed and add to ChromaDB, rebuild BM25)
        logger.info("\nSTEP 3/4: INDEXING (INCREMENTAL)")
        # We only need to run indexing if we actually found changes!
        if incremental_chunks or (incremental_chunks is not None and len(incremental_chunks) > 0):
            build_index(reset=False)
        else:
            # If no chunks were returned, we still run build_index to ensure it handles the empty state cleanly
            build_index(reset=False)
            
        # Phase 4: DVC Versioning
        logger.info("\nSTEP 4/4: DATA VERSIONING (DVC)")
        run_dvc_commit()
        
        duration = datetime.now() - start_time
        duration_seconds = duration.total_seconds()
        
        # Log to DB
        db = MetadataDB(config.METADATA_DB)
        # Using placeholder 1 for scraped docs since the dummy scraper just returns 1.
        db.record_pipeline_run(docs_scraped, len(incremental_chunks) if incremental_chunks else 0, duration_seconds)
        
        logger.info("="*60)
        logger.info(f"✅ PIPELINE COMPLETED SUCCESSFULLY in {duration}")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ PIPELINE FAILED: {e}", exc_info=True)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-now", action="store_true", help="Run the pipeline once immediately")
    args = parser.parse_args()

    if args.run_now:
        run_pipeline()
    else:
        logger.info("Starting APScheduler. Pipeline will run every day at 2:00 AM.")
        scheduler = BlockingScheduler()
        # Schedule the job to run every day at 2:00 AM
        scheduler.add_job(run_pipeline, 'cron', hour=2, minute=0)
        try:
            scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            logger.info("Scheduler stopped.")
