"""
Query Preprocessor — Expands legal abbreviations and normalizes queries
before they hit the embedding model and BM25 search.

Legal queries often use shorthand ("S. 302", "Art. 21", "IPC", "u/s 103 BNS") which
embedding models and BM25 don't handle well. This module expands them
to their full forms with dual acronyms for maximum retrieval precision.
"""
import re
import logging

logger = logging.getLogger(__name__)

# ─── Legal Abbreviation Mappings ────────────────────────────────
# Order matters: longer and more specific patterns first
ABBREVIATIONS = [
    # Notation references: u/s, u/sec, S., Sec., Art., etc.
    (r'\bu/sec\.?\s*(\d+[a-zA-Z]?)', r'Section \1'),
    (r'\bu/s\.?\s*(\d+[a-zA-Z]?)', r'Section \1'),
    (r'\bsec\.?\s*(\d+[a-zA-Z]?)', r'Section \1'),
    (r'\bs\.\s*(\d+[a-zA-Z]?)', r'Section \1'),
    (r'\bs\s+(\d+[a-zA-Z]?)', r'Section \1'),
    (r'\bart\.?\s*(\d+[a-zA-Z]?)', r'Article \1'),
    (r'\bcl\.?\s*(\d+[a-zA-Z]?)', r'Clause \1'),
    (r'\bsch\.?\s*(\d+[a-zA-Z]?)', r'Schedule \1'),
    (r'\br\.?\s*(\d+[a-zA-Z]?)', r'Rule \1'),
    (r'\bo\.?\s*([ivxlcdm\d]+)', r'Order \1'),

    # Statute abbreviations (expanded with dual representation for BM25 + Dense)
    (r'\bBNS\s*2023\b', 'Bharatiya Nyaya Sanhita (BNS) 2023'),
    (r'\bBNS\b', 'Bharatiya Nyaya Sanhita (BNS)'),
    (r'\bBNSS\s*2023\b', 'Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023'),
    (r'\bBNSS\b', 'Bharatiya Nagarik Suraksha Sanhita (BNSS)'),
    (r'\bBSA\s*2023\b', 'Bharatiya Sakshya Adhiniyam (BSA) 2023'),
    (r'\bBSA\b', 'Bharatiya Sakshya Adhiniyam (BSA)'),
    (r'\bIPC\b', 'Indian Penal Code (IPC)'),
    (r'\bCrPC\b', 'Code of Criminal Procedure (CrPC)'),
    (r'\bCPC\b', 'Code of Civil Procedure (CPC)'),
    (r'\bIEA\b', 'Indian Evidence Act (IEA)'),
    (r'\bDPDP\s*Act\b|\bDPDP\b|\bDPDPA\b', 'Digital Personal Data Protection Act (DPDP)'),
    (r'\bRERA\b', 'Real Estate Regulation and Development Act (RERA)'),
    (r'\bIBC\b', 'Insolvency and Bankruptcy Code (IBC)'),
    (r'\bDV\s*Act\b', 'Domestic Violence Act (DV Act)'),
    (r'\bHMA\b', 'Hindu Marriage Act (HMA)'),
    (r'\bTPA\b', 'Transfer of Property Act (TPA)'),
    (r'\bIT\s*Act\b', 'Information Technology Act (IT Act)'),
    (r'\bRTI\b', 'Right to Information (RTI)'),
    (r'\bPOCSO\b', 'Protection of Children from Sexual Offences (POCSO)'),
    (r'\bNDPS\b', 'Narcotic Drugs and Psychotropic Substances (NDPS)'),
    (r'\bMVA\b', 'Motor Vehicles Act (MVA)'),
    (r'\bNI\s*Act\b', 'Negotiable Instruments Act (NI Act)'),
    (r'\bFIR\b', 'First Information Report (FIR)'),
    (r'\bPIL\b', 'Public Interest Litigation (PIL)'),
    (r'\bCOI\b', 'Constitution of India'),
    (r'\bSC\b(?!\s*(?:judgment|order|bench))', 'Supreme Court'),
    (r'\bHC\b', 'High Court'),
]


def extract_query_section_ref(query: str) -> str | None:
    """Extract target section or article reference from query (e.g. 'Section 103', 'Article 21')."""
    match = re.search(r'\b(Section\s+\d+[a-zA-Z]?|Article\s+\d+[a-zA-Z]?|Order\s+[IVXLCDM\d]+|Rule\s+\d+)\b', query, re.IGNORECASE)
    if match:
        return match.group(1).title()
    # Shorthand fallback
    match_s = re.search(r'\b(?:s|sec|u/s)\.?\s*(\d+[a-zA-Z]?)\b', query, re.IGNORECASE)
    if match_s:
        return f"Section {match_s.group(1).upper()}"
    match_art = re.search(r'\bart\.?\s*(\d+[a-zA-Z]?)\b', query, re.IGNORECASE)
    if match_art:
        return f"Article {match_art.group(1).upper()}"
    return None


def preprocess_query(query: str) -> str:
    """
    Preprocess a legal query by expanding abbreviations and normalizing text.
    
    Args:
        query: Raw user query string
    
    Returns:
        Expanded and normalized query string
    """
    if not query or not query.strip():
        return query

    original = query
    processed = query.strip()

    # 1. Expand legal abbreviations and notations
    for pattern, replacement in ABBREVIATIONS:
        processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)

    # 2. Normalize whitespace (collapse multiple spaces)
    processed = re.sub(r'\s+', ' ', processed).strip()

    if processed != original:
        logger.info(f"Query preprocessed: '{original}' → '{processed}'")

    return processed
