"""
Metadata Extractor — Infer structured metadata from legal documents
using folder structure, filename patterns, and content analysis.
"""
import re
import uuid
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

# Category mapping from folder names
FOLDER_CATEGORY_MAP = {
    "bns_2023": "Criminal Law",
    "bnss_2023": "Criminal Procedure",
    "bsa_2023": "Evidence Law",
    "ipc": "Criminal Law",
    "crpc": "Criminal Procedure",
    "evidence_act": "Evidence Law",
    "civil_procedure_code": "Civil Procedure",
    "contract_act": "Contract Law",
    "companies_act": "Corporate Law",
    "consumer_protection_act": "Consumer Law",
    "it_act": "Cyber Law",
    "cyber_law": "Cyber Law",
    "environment_laws": "Environmental Law",
    "family_law": "Family Law",
    "property_law": "Property Law",
    "tax_law": "Tax & Financial Law",
    "labour laws": "Labour Law",
    "right to information act": "Administrative Law",
    "advocates_act": "Legal Profession",
    "arbitration_adr": "ADR & Arbitration",
    "constitution": "Constitutional Law",
    "amendments": "Constitutional Law",
    "supreme_court": "Case Law - Supreme Court",
    "high_courts": "Case Law - High Courts",
    "law commission reports": "Law Commission",
    "international treaties": "International Law",
    "commentaries notes": "Commentary",
    "legal dictionaries & glossaries": "Legal Reference",
    "legal forms & templates": "Legal Templates",
    "legal reference": "Legal Reference",
    "policy documents & reports": "Policy",
    "textbooks": "Legal Education",
}

# Document type inference patterns
DOC_TYPE_PATTERNS = [
    (r"(?:section|chapter|part)\s+\d+", "act"),
    (r"article\s+\d+", "constitution"),
    (r"(?:held|ratio|obiter|per\s+curiam|hon'ble)", "judgment"),
    (r"(?:amendment|amend)", "amendment"),
    (r"law commission|report no", "report"),
    (r"(?:template|format|form|specimen)", "template"),
    (r"(?:maxim|doctrine|principle)", "reference"),
    (r"(?:treaty|convention|protocol)", "treaty"),
    (r"(?:faq|question|answer)", "faq"),
]


def _extract_year(text: str, filename: str) -> int | None:
    """Try to extract year from filename or content."""
    # From filename first
    match = re.search(r"(1[89]\d{2}|2[01]\d{2})", filename)
    if match:
        return int(match.group(1))
    # From content (first 500 chars)
    match = re.search(r"(1[89]\d{2}|2[01]\d{2})", text[:500])
    if match:
        return int(match.group(1))
    return None


def _infer_doc_type(text: str, filename: str, folder_path: str) -> str:
    """Infer document type from content and location."""
    lower_text = text[:2000].lower()
    lower_name = filename.lower()
    lower_folder = folder_path.lower()

    # Check folder first
    if "judgment" in lower_folder or "court" in lower_folder:
        return "judgment"
    if "amendment" in lower_folder:
        return "amendment"
    if "commission" in lower_folder:
        return "report"
    if "template" in lower_folder or "form" in lower_folder:
        return "template"
    if "treat" in lower_folder or "convention" in lower_folder:
        return "treaty"
    if "reference" in lower_folder or "glossar" in lower_folder or "dictionar" in lower_folder:
        return "reference"

    # Check filename
    if "judgment" in lower_name or "verdict" in lower_name:
        return "judgment"
    if "compilation" in lower_name:
        return "compilation"
    if "report" in lower_name:
        return "report"
    if "faq" in lower_name:
        return "faq"
    if "template" in lower_name:
        return "template"

    # Check content patterns
    for pattern, doc_type in DOC_TYPE_PATTERNS:
        if re.search(pattern, lower_text):
            return doc_type

    return "act"  # default


def _infer_category(folder_path: str) -> str:
    """Infer category from the folder structure."""
    parts = Path(folder_path).parts
    for part in reversed(parts):
        key = part.lower().replace(" ", "_").replace("&", "").replace("__", "_").strip("_")
        if key in FOLDER_CATEGORY_MAP:
            return FOLDER_CATEGORY_MAP[key]
        # Also try the original (with spaces)
        if part.lower() in FOLDER_CATEGORY_MAP:
            return FOLDER_CATEGORY_MAP[part.lower()]
    return "General Law"


def _extract_title(filename: str) -> str:
    """Clean up filename into a human-readable title."""
    name = Path(filename).stem
    # Remove common suffixes
    name = re.sub(r"_(?:compilation|text|full|final)", "", name, flags=re.I)
    # Replace underscores with spaces
    name = name.replace("_", " ")
    # Title case
    name = name.title()
    return name.strip()


def extract_metadata(parsed_doc: dict, dataset_root: Path) -> dict:
    """
    Extract structured metadata from a parsed document.
    Returns a metadata dict.
    """
    file_path = Path(parsed_doc["file_path"])
    text = parsed_doc.get("raw_text", "")

    # Relative path from dataset root
    try:
        rel_path = file_path.relative_to(dataset_root)
        folder_path = str(rel_path.parent)
    except ValueError:
        folder_path = str(file_path.parent)

    metadata = {
        "doc_id": str(uuid.uuid4()),
        "file_name": parsed_doc["file_name"],
        "file_path": str(file_path),
        "title": _extract_title(parsed_doc["file_name"]),
        "doc_type": _infer_doc_type(text, parsed_doc["file_name"], folder_path),
        "year": _extract_year(text, parsed_doc["file_name"]),
        "category": _infer_category(folder_path),
        "jurisdiction": "India",
        "num_pages": parsed_doc.get("num_pages", 0),
        "num_characters": len(text),
        "extraction_method": parsed_doc.get("extraction_method", "unknown"),
        "file_type": parsed_doc.get("file_type", "unknown"),
        "ingested_at": datetime.now().isoformat(),
    }

    logger.debug(
        f"Metadata: {metadata['title']} | "
        f"type={metadata['doc_type']} | "
        f"cat={metadata['category']} | "
        f"year={metadata['year']}"
    )
    return metadata
