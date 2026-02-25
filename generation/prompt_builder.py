"""
Prompt Builder — Constructs LangChain prompt templates for legal RAG generation.
"""
import logging
import config
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.messages import SystemMessage

logger = logging.getLogger(__name__)


def get_rag_prompt_template() -> ChatPromptTemplate:
    """
    Returns a LangChain ChatPromptTemplate configured for legal extraction.
    Expects {context} and {query} input variables in the chain.
    """
    
    system_prompt = config.LEGAL_SYSTEM_PROMPT
    
    human_template = """[SYSTEM.DATALOG.INIT]

CONTEXT:
{context}

EXTRACT LEGAL DATA FOR QUERY: {query}

[FORMAT RULES]
1. DO NOT greet the user or say "Here is the answer".
2. EXTRACT raw legal findings in bullet points.
3. USE ONLY the provided context. If the context is strictly 'NO_CONTEXT_AVAILABLE', you MUST output ONLY the exact string '[ERR_NO_DATA_FOUND]' and absolutely zero other characters or words. DONT hallucinate.
4. If there is context found, answer the query based strictly on the context.

YOUR RAW DATA RESPONSE:"""

    return ChatPromptTemplate.from_messages([
        SystemMessage(content=system_prompt),
        HumanMessagePromptTemplate.from_template(human_template)
    ])

def format_docs(docs) -> str:
    """Format LangChain documents for the {context} variable."""
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


# ── Re-export Core Python functions for main.py CLI compatibility ──
from generation.prompt_builder_core import get_system_prompt, build_rag_prompt
