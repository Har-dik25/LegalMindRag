"""
Legal-Aware Chunker — Splits documents into retrievable chunks
while respecting legal document structure (Sections, Articles, Rules).
"""
import re
import uuid
import logging

logger = logging.getLogger(__name__)

# ── Patterns that indicate legal section boundaries ──
LEGAL_BOUNDARY_PATTERNS = [
    # Major divisions
    r"^(?:PART|CHAPTER|SCHEDULE)\s+[IVXLCDM\d]+",
    # Sections & Articles
    r"^(?:Section|SECTION|Art(?:icle)?\.?)\s+\d+[A-Z]?[\.\:\-]",
    # Rules & Orders
    r"^(?:Rule|ORDER|Order)\s+\d+",
    # Judgment sections
    r"^(?:HELD|RATIO|OBITER|PER CURIAM|JUDGMENT|ORDER|FACTS|ISSUES?)\s*[\:\-]",
    # Numbered provisions
    r"^\d+\.\s+[A-Z]",
]

BOUNDARY_RE = re.compile("|".join(LEGAL_BOUNDARY_PATTERNS), re.MULTILINE)


def _count_tokens_approx(text: str) -> int:
    """Approximate token count (words ≈ 0.75 tokens for English)."""
    return int(len(text.split()) * 1.3)


def _extract_section_ref(text: str) -> str | None:
    """Extract section/article reference from the start of a chunk."""
    patterns = [
        r"(Section\s+\d+[A-Z]?(?:\(\d+\))?)",
        r"(Article\s+\d+[A-Z]?(?:\(\d+\))?)",
        r"(Rule\s+\d+)",
        r"(Order\s+[IVXLCDM]+)",
        r"(CHAPTER\s+[IVXLCDM\d]+)",
        r"(PART\s+[IVXLCDM\d]+)",
    ]
    for pat in patterns:
        match = re.search(pat, text[:200], re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def _split_by_legal_boundaries(text: str) -> list[str]:
    """Split text at legal section boundaries."""
    positions = [0]
    for match in BOUNDARY_RE.finditer(text):
        pos = match.start()
        if pos > 0:
            positions.append(pos)
    positions.append(len(text))

    segments = []
    for i in range(len(positions) - 1):
        segment = text[positions[i]:positions[i + 1]].strip()
        if segment:
            segments.append(segment)

    return segments if segments else [text]


def _split_by_paragraphs(text: str) -> list[str]:
    """Split text by double newlines (paragraph boundaries)."""
    paragraphs = re.split(r"\n\s*\n", text)
    return [p.strip() for p in paragraphs if p.strip()]


def _merge_small_chunks(chunks: list[str], min_size: int, max_size: int) -> list[str]:
    """Merge consecutive small chunks up to max_size."""
    merged = []
    buffer = ""

    for chunk in chunks:
        if not buffer:
            buffer = chunk
        elif _count_tokens_approx(buffer + "\n\n" + chunk) <= max_size:
            buffer += "\n\n" + chunk
        else:
            if _count_tokens_approx(buffer) >= min_size:
                merged.append(buffer)
            elif merged:
                # Attach to previous chunk if too small
                merged[-1] += "\n\n" + buffer
            else:
                merged.append(buffer)
            buffer = chunk

    if buffer:
        if _count_tokens_approx(buffer) >= min_size and merged:
            merged.append(buffer)
        elif merged:
            merged[-1] += "\n\n" + buffer
        else:
            merged.append(buffer)

    return merged


def _split_large_chunk(text: str, max_size: int, overlap: int) -> list[str]:
    """Split an oversized chunk with overlap using sentence boundaries."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current = []
    current_tokens = 0

    for sentence in sentences:
        sent_tokens = _count_tokens_approx(sentence)
        if current_tokens + sent_tokens > max_size and current:
            chunks.append(" ".join(current))
            # Keep overlap
            overlap_tokens = 0
            overlap_start = len(current)
            for i in range(len(current) - 1, -1, -1):
                overlap_tokens += _count_tokens_approx(current[i])
                if overlap_tokens >= overlap:
                    overlap_start = i
                    break
            current = current[overlap_start:]
            current_tokens = sum(_count_tokens_approx(s) for s in current)
        current.append(sentence)
        current_tokens += sent_tokens

    if current:
        chunks.append(" ".join(current))

    return chunks


def chunk_document(
    text: str,
    metadata: dict,
    chunk_size: int = 512,
    chunk_overlap: int = 128,
    min_chunk_size: int = 50,
) -> list[dict]:
    """
    Split a legal document into chunks respecting legal boundaries.

    Strategy:
    1. First split by legal section boundaries (Section, Article, Chapter)
    2. If segments are too large, split by paragraphs
    3. Merge small segments up to chunk_size
    4. Split any remaining oversized segments with overlap

    Returns a list of chunk dicts.
    """
    # Step 1: Split by legal boundaries
    segments = _split_by_legal_boundaries(text)

    # Step 2: Split any large segments by paragraphs
    refined = []
    for seg in segments:
        if _count_tokens_approx(seg) > chunk_size * 2:
            paras = _split_by_paragraphs(seg)
            refined.extend(paras)
        else:
            refined.append(seg)

    # Step 3: Merge consecutive small segments
    merged = _merge_small_chunks(refined, min_chunk_size, chunk_size)

    # Step 4: Split any remaining oversized chunks
    final_texts = []
    for chunk_text in merged:
        if _count_tokens_approx(chunk_text) > chunk_size:
            splits = _split_large_chunk(chunk_text, chunk_size, chunk_overlap)
            final_texts.extend(splits)
        else:
            final_texts.append(chunk_text)

    # Build chunk dicts
    chunks = []
    for i, text_chunk in enumerate(final_texts):
        if _count_tokens_approx(text_chunk) < min_chunk_size and len(final_texts) > 1:
            continue  # Skip tiny chunks (unless it's the only one)

        chunk = {
            "chunk_id": str(uuid.uuid4()),
            "doc_id": metadata["doc_id"],
            "text": text_chunk.strip(),
            "chunk_index": i,
            "section_ref": _extract_section_ref(text_chunk),
            "token_count": _count_tokens_approx(text_chunk),
            "metadata": {
                "title": metadata["title"],
                "doc_type": metadata["doc_type"],
                "year": metadata.get("year"),
                "category": metadata["category"],
                "jurisdiction": metadata.get("jurisdiction", "India"),
                "file_name": metadata["file_name"],
            },
        }
        chunks.append(chunk)

    logger.info(
        f"Chunked '{metadata['title']}' → {len(chunks)} chunks "
        f"(avg {sum(c['token_count'] for c in chunks) // max(len(chunks), 1)} tokens)"
    )
    return chunks
