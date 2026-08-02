"""
PDF & TXT Parser — Extract raw text from legal documents.
Uses a fallback chain: pypdf → pdfplumber → PyMuPDF (fitz).
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text_from_txt(file_path: Path) -> dict:
    """Read a plain text file."""
    try:
        text = file_path.read_text(encoding="utf-8", errors="replace")
        return {
            "file_path": str(file_path),
            "file_name": file_path.name,
            "raw_text": text,
            "num_pages": max(1, text.count("\f") + 1),  # form-feed = page break
            "extraction_method": "txt_read",
            "file_type": "txt",
        }
    except Exception as e:
        logger.error(f"Failed to read TXT {file_path.name}: {e}")
        return None


def _try_pypdf(file_path: Path) -> str | None:
    """Attempt extraction with pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(file_path))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n\n".join(pages)
        if len(text.strip()) > 100:
            return text
    except Exception as e:
        logger.debug(f"pypdf failed for {file_path.name}: {e}")
    return None


def _try_pdfplumber(file_path: Path) -> str | None:
    """Attempt extraction with pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(str(file_path)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        text = "\n\n".join(pages)
        if len(text.strip()) > 100:
            return text
    except Exception as e:
        logger.debug(f"pdfplumber failed for {file_path.name}: {e}")
    return None


def _try_pymupdf(file_path: Path) -> str | None:
    """Attempt extraction with PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(str(file_path))
        pages = [page.get_text() for page in doc]
        doc.close()
        text = "\n\n".join(pages)
        if len(text.strip()) > 100:
            return text
    except Exception as e:
        logger.debug(f"PyMuPDF failed for {file_path.name}: {e}")
    return None


def extract_text_from_pdf(file_path: Path) -> dict | None:
    """
    Extract text from a PDF using a fallback chain.
    Returns None if all methods fail (likely a scanned/image PDF).
    """
    num_pages = 0
    method = None

    # Try pypdf first (fastest)
    text = _try_pypdf(file_path)
    if text:
        method = "pypdf"
    else:
        # Try pdfplumber (better with tables)
        text = _try_pdfplumber(file_path)
        if text:
            method = "pdfplumber"
        else:
            # Last resort: PyMuPDF
            text = _try_pymupdf(file_path)
            if text:
                method = "pymupdf"

    if not text or len(text.strip()) < 100:
        logger.warning(f"⚠️  Could not extract text from {file_path.name} — likely scanned/image PDF")
        return None

    # Count pages
    try:
        from pypdf import PdfReader
        num_pages = len(PdfReader(str(file_path)).pages)
    except Exception:
        num_pages = text.count("\f") + 1

    return {
        "file_path": str(file_path),
        "file_name": file_path.name,
        "raw_text": text,
        "num_pages": num_pages,
        "extraction_method": method,
        "file_type": "pdf",
    }


def parse_file(file_path: Path) -> dict | None:
    """Parse any supported file, return structured dict or None."""
    suffix = file_path.suffix.lower()
    if suffix == ".txt":
        return extract_text_from_txt(file_path)
    elif suffix == ".pdf":
        return extract_text_from_pdf(file_path)
    else:
        logger.warning(f"Skipping unsupported file type: {file_path.name}")
        return None


def discover_files(dataset_dir: Path) -> list[Path]:
    """Discover all parseable files in the dataset directory."""
    supported = {".pdf", ".txt"}
    files = []
    for f in sorted(dataset_dir.rglob("*")):
        if f.is_file() and f.suffix.lower() in supported:
            # Skip known corrupted files
            if "crdownload" in f.name.lower():
                logger.warning(f"Skipping corrupted file: {f.name}")
                continue
            files.append(f)
    logger.info(f"Discovered {len(files)} files in {dataset_dir}")
    return files
