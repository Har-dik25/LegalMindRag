"""
Embedder — Generate dense vector embeddings using HuggingFaceEmbeddings via LangChain.
All computation runs locally, no API calls needed.
"""
import logging
from langchain_huggingface import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

class Embedder:
    """Local embedding model LangChain wrapper."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        logger.info(f"Loading embedding model: {model_name}")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True, 'batch_size': 64}
        )
        logger.info(f"LangChain HuggingFaceEmbeddings loaded")

    def embed_chunks(self, texts: list[str], batch_size: int = None) -> list[list[float]]:
        """Embed a list of texts using LangChain's embed_documents."""
        logger.info(f"Embedding {len(texts)} texts...")
        # Ignore batch_size arg to preserve interface, it's set in init
        return self.embeddings.embed_documents(texts)

    def embed_query(self, query: str) -> list[float]:
        """Embed a single query string using LangChain's embed_query."""
        return self.embeddings.embed_query(query)
