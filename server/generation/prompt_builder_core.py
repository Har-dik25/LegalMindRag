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
    
    return f"""[SYSTEM.DATALOG.INIT]

CONTEXT:
{context}

EXTRACT LEGAL DATA FOR QUERY: {query}

[FORMAT RULES]
1. DO NOT greet the user or say "Here is the answer".
2. EXTRACT raw legal findings in bullet points.
3. USE ONLY the provided context. If the context is strictly 'NO_CONTEXT_AVAILABLE', you MUST output ONLY the exact string '[ERR_NO_DATA_FOUND]' and absolutely zero other characters or words. DONT hallucinate.
4. If there is context found, answer the query based strictly on the context.

YOUR RAW DATA RESPONSE:"""


def format_docs_core(docs) -> str:
    """Format retrieval results for the context variable (Core Python approach)."""
    if not docs:
        return "NO_CONTEXT_AVAILABLE"
        
    context_parts = []
    total_tokens = 0

    for i, doc in enumerate(docs, 1):
        # Handle both LangChain Document objects and custom RetrievalResult objects
        meta = doc.metadata if hasattr(doc, "metadata") else getattr(doc, "metadata", {})
        text = doc.page_content if hasattr(doc, "page_content") else getattr(doc, "text", "")
        title = meta.get("doc_title", meta.get("title", ""))

        # Basic token budget check
        chunk_tokens = len(text.split()) * 1.3
        if total_tokens + chunk_tokens > config.MAX_CONTEXT_TOKENS:
            break

        context_parts.append(f"[{i}. {title}]\n{text}")
        total_tokens += chunk_tokens

    return "\n\n".join(context_parts)
