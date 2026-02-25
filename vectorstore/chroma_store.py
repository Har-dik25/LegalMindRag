"""
ChromaDB Store — Persistent vector store via LangChain Chroma Integration.
"""
import logging
import chromadb
from chromadb.config import Settings
from langchain_chroma import Chroma
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

class ChromaStore:
    """LangChain Chroma DB wrapper for the legal RAG vector store."""

    def __init__(self, persist_dir: str, collection_name: str, embedding_function=None):
        logger.info(f"Initializing LangChain Chroma at: {persist_dir}")
        
        # We pass the underlying chromadb client to LangChain to maintain the exact same settings
        self._client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False),
        )
        
        self.vectorstore = Chroma(
            client=self._client,
            collection_name=collection_name,
            embedding_function=embedding_function,
            collection_metadata={"hnsw:space": "cosine"}
        )
        
        # Keep underlying collection reference for count/reset helper methods
        self._collection = self._client.get_or_create_collection(
            name=collection_name, 
            metadata={"hnsw:space": "cosine"}
        )
        
        logger.info(
            f"LangChain Chroma collection '{collection_name}' ready — "
            f"{self._collection.count()} existing documents"
        )

    def add(self, chunks: list[dict], embeddings: list[list[float]] = None):
        """Add chunks to LangChain ChromaDB."""
        if not chunks:
            return

        # LangChain's Chroma wrapper handles chunking naturally via add_documents
        # which maps to the underlying chroma client.
        documents = []
        for c in chunks:
            meta = {
                "doc_id": c["doc_id"],
                "doc_title": c["metadata"]["title"],
                "doc_type": c["metadata"]["doc_type"],
                "year": c["metadata"].get("year") or 0,
                "category": c["metadata"]["category"],
                "section_ref": c.get("section_ref") or "",
                "chunk_index": c["chunk_index"],
                "file_name": c["metadata"].get("file_name", ""),
            }
            documents.append(
                Document(page_content=c["text"], metadata=meta, id=c["chunk_id"])
            )

        # Batch addition
        batch_size = 5000
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            self.vectorstore.add_documents(documents=batch)
            logger.info(f"Upserted batch {i // batch_size + 1} ({len(batch)} chunks)")

    def search(
        self,
        query: str = None,
        query_embedding: list[float] = None,
        top_k: int = 15,
        where: dict = None,
    ) -> list[dict]:
        """Search Chroma using LangChain similarity search with optional metadata filtering."""
        
        # If the embedding function is loaded directly in the store, we can use raw string search
        # We extract distances using similarity_search_with_score
        
        if query:
            results = self.vectorstore.similarity_search_with_score(
                query=query, 
                k=top_k, 
                filter=where
            )
        else:
            # Langchain Chroma doesn't elegantly support searching solely by raw vector without query
            # So we map back to the underlying client if only raw embedding is provided.
            kwargs = {
                "query_embeddings": [query_embedding],
                "n_results": top_k,
                "include": ["documents", "metadatas", "distances"],
            }
            if where:
                kwargs["where"] = where

            raw_results = self._collection.query(**kwargs)
            
            output = []
            if raw_results["ids"] and raw_results["ids"][0]:
                for i in range(len(raw_results["ids"][0])):
                    output.append({
                        "chunk_id": raw_results["ids"][0][i],
                        "text": raw_results["documents"][0][i],
                        "metadata": raw_results["metadatas"][0][i],
                        "score": 1 - raw_results["distances"][0][i],  # distance → similarity
                    })
            return output

        # Format LangChain results to match original signature output
        output = []
        for doc, distance in results:
            output.append({
                "chunk_id": doc.id if hasattr(doc, 'id') else None,
                "text": doc.page_content,
                "metadata": doc.metadata,
                "score": 1 - distance, # LangChain chroma returns distance usually
            })
            
        return output

    def get_stats(self) -> dict:
        """Return collection statistics."""
        return {
            "total_chunks": self._collection.count(),
            "collection_name": self._collection.name,
        }

    def reset(self):
        """Delete and recreate the collection."""
        name = self._collection.name
        self._client.delete_collection(name)
        self._collection = self._client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )
        logger.warning(f"ChromaDB collection '{name}' has been reset")
