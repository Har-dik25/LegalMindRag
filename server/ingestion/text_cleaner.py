# -*- coding: utf-8 -*-
"""
Text Cleaner - Normalize and clean extracted legal text.
Preserves legal structure (section numbers, article refs) while
removing artifacts from PDF extraction.
"""
import re
import logging

logger = logging.getLogger(__name__)


def clean_text(raw_text: str) -> str:
    """
    Clean and normalize extracted text while preserving legal formatting.
    """
    text = raw_text

    # 1. Fix common encoding artifacts (using Unicode escapes for safety)
    encoding_fixes = {
        "\u00e2\u0080\u0099": "'",
        "\u00e2\u0080\u0098": "'",
        "\u00e2\u0080\u009c": '"',
        "\u00e2\u0080\u009d": '"',
        "\u00e2\u0080\u0093": "-",
        "\u00e2\u0080\u0094": "-",
        "\u00e2\u0080\u00a6": "...",
        "\u00c2\u00a7": "\u00a7",
        "\u00e2\u0080\u008b": "",
        "\x00": "",
        "\ufeff": "",
    }
    for bad, good in encoding_fixes.items():
        text = text.replace(bad, good)

    # 2. Fix broken words from PDF line wrapping (e.g., "juris-\ndiction")
    text = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", text)

    # 3. Remove page numbers (standalone numbers on their own line)
    text = re.sub(r"\n\s*\d{1,4}\s*\n", "\n", text)

    # 4. Remove repeated headers/footers (lines that appear 3+ times)
    lines = text.split("\n")
    line_counts = {}
    for line in lines:
        stripped = line.strip()
        if len(stripped) > 10:
            line_counts[stripped] = line_counts.get(stripped, 0) + 1
    repeated = {line for line, count in line_counts.items() if count >= 3}
    if repeated:
        lines = [l for l in lines if l.strip() not in repeated]
        text = "\n".join(lines)

    # 5. Collapse multiple blank lines into max 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    # 6. Collapse multiple spaces (but preserve indentation for legal structure)
    text = re.sub(r"[^\S\n]{3,}", "  ", text)

    # 7. Remove non-printable characters (but keep newlines, tabs, and common chars)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # 8. Trim leading/trailing whitespace
    text = text.strip()

    return text
