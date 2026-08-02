import hashlib
import logging
from pathlib import Path
from typing import Dict, List, Tuple
from ingestion.db import MetadataDB
import config

logger = logging.getLogger(__name__)

def compute_file_hash(filepath: Path) -> str:
    """Compute SHA-256 hash of a file's contents."""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        # Read in blocks to handle large files
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def detect_changes(db: MetadataDB, files: List[Path]) -> Tuple[List[Path], List[Path], List[Path]]:
    """
    Compare current file hashes against the database manifest.
    Returns three lists: (new_files, modified_files, unchanged_files).
    """
    new_files = []
    modified_files = []
    unchanged_files = []

    for file_path in files:
        rel_path = str(file_path.relative_to(config.ROOT_DIR))
        current_hash = compute_file_hash(file_path)
        last_hash = db.get_document_hash(rel_path)

        if last_hash is None:
            new_files.append(file_path)
        elif last_hash != current_hash:
            modified_files.append(file_path)
        else:
            unchanged_files.append(file_path)

    return new_files, modified_files, unchanged_files
