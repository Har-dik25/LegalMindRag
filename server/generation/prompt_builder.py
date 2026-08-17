"""
Prompt Builder — Constructs LangChain prompt templates for Samvidhan AI generation.
"""
import logging
import config
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate
from langchain_core.messages import SystemMessage

logger = logging.getLogger(__name__)


def get_rag_prompt_template() -> ChatPromptTemplate:
    """
    Returns a LangChain ChatPromptTemplate configured for legal extraction.
    Expects {context} and {query} input variables in the chain.
    """
    system_prompt = config.LEGAL_SYSTEM_PROMPT
    
    human_template = """You have been provided with the following verified Indian legal sources:

LEGAL SOURCES:
{context}

QUESTION:
{query}

Provide a structured, authoritative legal answer with exact Section/Article citations, explanations of elements, punishments/remedies, and relevant historical mappings (if applicable).

LEGAL ANALYSIS & ANSWER:"""

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


# ── Re-export Core Python functions for main.py CLI compatibility ──
from generation.prompt_builder_core import get_system_prompt, build_rag_prompt
