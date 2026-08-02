import sqlite3
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class MetadataDB:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Table to track documents and their hashes to detect changes
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS document_manifest (
                    filepath TEXT PRIMARY KEY,
                    file_hash TEXT NOT NULL,
                    last_processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Table to track which vectors (chunks) belong to which document 
            # to allow deleting old vectors when a document is modified
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS embedding_metadata (
                    chunk_id TEXT PRIMARY KEY,
                    filepath TEXT NOT NULL,
                    vector_id TEXT,
                    FOREIGN KEY(filepath) REFERENCES document_manifest(filepath) ON DELETE CASCADE
                )
            """)
            
            # Table to track pipeline run history for portfolio/monitoring
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS pipeline_runs (
                    run_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    new_docs_scraped INTEGER,
                    chunks_embedded INTEGER,
                    duration_seconds REAL
                )
            """)
            conn.commit()

    def record_pipeline_run(self, new_docs: int, chunks_embedded: int, duration: float):
        """Log a pipeline run to track growth over time."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO pipeline_runs (new_docs_scraped, chunks_embedded, duration_seconds)
                VALUES (?, ?, ?)
            """, (new_docs, chunks_embedded, duration))
            conn.commit()

    def get_document_hash(self, filepath: str) -> str:
        """Get the last known hash for a document."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT file_hash FROM document_manifest WHERE filepath = ?", (filepath,))
            result = cursor.fetchone()
            return result[0] if result else None

    def upsert_document_hash(self, filepath: str, file_hash: str):
        """Insert or update a document's hash."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO document_manifest (filepath, file_hash, last_processed_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(filepath) DO UPDATE SET 
                    file_hash=excluded.file_hash,
                    last_processed_at=CURRENT_TIMESTAMP
            """, (filepath, file_hash))
            conn.commit()

    def get_chunks_for_document(self, filepath: str) -> list:
        """Get all chunk IDs associated with a document."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT chunk_id FROM embedding_metadata WHERE filepath = ?", (filepath,))
            return [row[0] for row in cursor.fetchall()]

    def delete_document_metadata(self, filepath: str):
        """Delete all metadata for a document (triggers cascade delete on chunks)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("PRAGMA foreign_keys = ON")
            cursor.execute("DELETE FROM document_manifest WHERE filepath = ?", (filepath,))
            conn.commit()

    def delete_chunks_for_document(self, filepath: str):
        """Delete only the chunk metadata for a document."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM embedding_metadata WHERE filepath = ?", (filepath,))
            conn.commit()

    def insert_chunk_metadata(self, chunk_id: str, filepath: str, vector_id: str = None):
        """Insert metadata for a new chunk."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO embedding_metadata (chunk_id, filepath, vector_id)
                VALUES (?, ?, ?)
            """, (chunk_id, filepath, vector_id))
            conn.commit()
