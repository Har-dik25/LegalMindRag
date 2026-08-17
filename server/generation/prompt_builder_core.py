"""
Core Python Prompt Builder — No LangChain dependency.
Approach 2: Pure string-based prompt construction.
"""
import logging
import config

logger = logging.getLogger(__name__)


def get_system_prompt() -> str:
    """Return the system prompt string for direct Ollama API calls."""
    return config.LEGAL_SYSTEM_PROMPT


def build_rag_prompt(query: str, results: list) -> str:
    """
    Build a complete RAG prompt from query and retrieval results.
    Used by the CLI (main.py) and the Core Python API approach.
    
    Args:
        query: The user's legal question
        results: List of RetrievalResult objects from the retriever
    
    Returns:
        Formatted prompt string with context and query
    """
    context = format_docs_core(results)
    
    return f"""You have been provided with the following verified Indian legal sources:

LEGAL SOURCES:
{context}

QUESTION:
{query}

Provide a structured, authoritative legal answer with exact Section/Article citations, explanations of elements, punishments/remedies, and relevant historical mappings (if applicable).

LEGAL ANALYSIS & ANSWER:"""


def format_docs_core(docs) -> str:
    """Format retrieval results for the context variable (Core Python approach)."""
    if not docs:
        return "NO_CONTEXT_AVAILABLE"
        
    context_parts = []
    total_tokens = 0

    for i, doc in enumerate(docs, 1):
        meta = doc.metadata if hasattr(doc, "metadata") else getattr(doc, "metadata", {})
        text = doc.page_content if hasattr(doc, "page_content") else getattr(doc, "text", "")
        title = meta.get("doc_title") or meta.get("title") or meta.get("file_name") or "Legal Document"
        section_ref = meta.get("section_ref", "")
        doc_type = meta.get("doc_type", "")

        chunk_tokens = len(text.split()) * 1.3
        if total_tokens + chunk_tokens > config.MAX_CONTEXT_TOKENS and context_parts:
            break

        header = f'[Source {i}: {title}'
        if section_ref:
            header += f" | Reference: {section_ref}"
        if doc_type:
            header += f" | Type: {doc_type}"
        header += "]"

        context_parts.append(f"{header}\n{text}")
        total_tokens += chunk_tokens

    return "\n\n".join(context_parts)
