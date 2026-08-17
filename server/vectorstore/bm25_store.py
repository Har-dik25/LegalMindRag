"""
BM25 Store — Sparse keyword index using LangChain's BM25Retriever.
Complements dense (semantic) retrieval with exact keyword matching.
"""
import re
import pickle
import logging
from pathlib import Path
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

# Legal stopwords to KEEP (important legal terms often removed by generic stopwords)
LEGAL_KEEP_WORDS = {
    "act", "section", "article", "rule", "order", "clause", "schedule",
    "court", "shall", "may", "must", "herein", "thereof", "wherein",
    "plaintiff", "defendant", "appellant", "respondent", "petitioner",
    "bail", "fir", "charge", "summons", "warrant", "judgment", "decree",
    "appeal", "revision", "writ", "habeas", "corpus", "mandamus",
    "certiorari", "prohibition", "quo", "warranto", "bns", "bnss", "bsa",
    "ipc", "crpc", "cpc", "iea", "tpa", "hma", "rera", "ibc", "dpdp",
    "murder", "homicide", "theft", "arrest", "zero", "evidence", "custody",
}

GENERIC_STOPWORDS = {
    "the", "is", "at", "which", "on", "a", "an", "and", "or", "but",
    "in", "of", "to", "for", "with", "it", "this", "that", "by",
    "from", "as", "be", "was", "were", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "could", "should",
    "can", "not", "no", "so", "if", "then", "than", "too", "very",
    "are", "am", "its", "his", "her", "their", "our", "your",
}

def _tokenize(text: str) -> list[str]:
    """Legal-aware tokenization keeping statutory markers, acronyms, and section numbers."""
    text = text.lower()
    # Normalize section/article/rule tokens
    text = re.sub(r"\b(?:section|sec|s)\.?\s*(\d+[a-z]?)", r"section_\1 \1", text)
    text = re.sub(r"\b(?:article|art)\.?\s*(\d+[a-z]?)", r"article_\1 \1", text)
    text = re.sub(r"\b(?:rule|r)\.?\s*(\d+)", r"rule_\1 \1", text)
    text = re.sub(r"\b(?:order|o)\.?\s*([ivxlcdm\d]+)", r"order_\1 \1", text)
    tokens = re.findall(r"\b[\w_]+\b", text)
    return [t for t in tokens if t in LEGAL_KEEP_WORDS or (t not in GENERIC_STOPWORDS and len(t) > 1)]

class BM25Store:
    """BM25 sparse LangChain retriever wrapper."""

    def __init__(self):
        self.retriever = None

    @property
    def chunk_ids(self) -> list:
        """Backward-compatible accessor — extracts chunk IDs from internal LangChain docs."""
        if self.retriever is None:
            return []
        try:
            return [doc.metadata.get("chunk_id", "") for doc in self.retriever.docs]
        except Exception:
            return []

    def build(self, chunks: list[dict]):
        """Build LangChain BM25 index from chunk dicts preserving full metadata."""
        logger.info(f"Building LangChain BM25 index from {len(chunks)} chunks...")
        
        docs = []
        for c in chunks:
            meta = {
                "chunk_id": c["chunk_id"],
                "doc_id": c.get("doc_id", ""),
                "doc_title": c.get("metadata", {}).get("title", ""),
                "doc_type": c.get("metadata", {}).get("doc_type", "Document"),
                "year": c.get("metadata", {}).get("year", 0),
                "category": c.get("metadata", {}).get("category", ""),
                "section_ref": c.get("section_ref") or "",
                "file_name": c.get("metadata", {}).get("file_name", ""),
            }
            docs.append(Document(
                page_content=c["text"],
                metadata=meta
            ))
            
        self.retriever = BM25Retriever.from_documents(docs, preprocess_func=_tokenize)
        logger.info("BM25 LangChain index built successfully")

    def search(self, query: str, top_k: int = 15) -> list[dict]:
        """Search the BM25 index using LangChain, returning full metadata."""
        if self.retriever is None:
            logger.error("BM25 index not built. Call build() first.")
            return []

        self.retriever.k = top_k
        docs = self.retriever.invoke(query)
        
        results = []
        for i, doc in enumerate(docs):
            results.append({
                "chunk_id": doc.metadata.get("chunk_id", ""),
                "text": doc.page_content,
                "metadata": doc.metadata,
                "score": 1.0 / (i + 1), # Reciprocal rank as dummy score
            })
        return results

    def save(self, path: str):
        """Save BM25 LangChain Retriever to disk."""
        filepath = Path(path) / "bm25_langchain.pkl"
        with open(filepath, "wb") as f:
            pickle.dump(self.retriever, f)
        logger.info(f"BM25 LangChain index saved to {filepath}")

    def load(self, path: str) -> bool:
        """Load BM25 LangChain Retriever from disk."""
        filepath = Path(path) / "bm25_langchain.pkl"
        
        # Fallback to older index name if migrating
        if not filepath.exists():
            filepath = Path(path) / "bm25.pkl"
            
        if not filepath.exists():
            logger.error(f"BM25 index file not found: {filepath}")
            return False

        try:
            with open(filepath, "rb") as f:
                data = pickle.load(f)
                
            # If migrating from old dictionary format
            if isinstance(data, dict) and "chunk_texts" in data:
               logger.info("Migrating old BM25 dictionary to LangChain Retriever format on the fly...")
               docs = [Document(page_content=txt, metadata={"chunk_id": cid}) for txt, cid in zip(data["chunk_texts"], data["chunk_ids"])]
               self.retriever = BM25Retriever.from_documents(docs, preprocess_func=_tokenize)
               return True
               
            self.retriever = data
            logger.info(f"BM25 LangChain index loaded")
            return True
        except Exception as e:
            logger.error(f"Failed to load BM25 index: {e}")
            return False
