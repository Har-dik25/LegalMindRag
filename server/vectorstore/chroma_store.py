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
    """LangChain Chroma DB wrapper for the Samvidhan AI vector store."""

    def __init__(self, persist_dir: str, collection_name: str, embedding_function=None):
        logger.info(f"Initializing LangChain Chroma at: {persist_dir}")
        self.persist_dir = persist_dir
        self.collection_name = collection_name
        self.embedding_function = embedding_function
        
        self._client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False),
        )
        
        self._collection = self._client.get_or_create_collection(
            name=collection_name, 
            metadata={"hnsw:space": "cosine"}
        )

        self.vectorstore = Chroma(
            client=self._client,
            collection_name=collection_name,
            embedding_function=embedding_function,
            collection_metadata={"hnsw:space": "cosine"}
        )
        
        logger.info(
            f"LangChain Chroma collection '{collection_name}' ready — "
            f"{self._collection.count()} existing documents"
        )

    def add(self, chunks: list[dict], embeddings: list[list[float]] = None):
        """Add chunks to ChromaDB. If precomputed embeddings are passed, uses fast direct upsert."""
        if not chunks:
            return

        batch_size = 2000
        for i in range(0, len(chunks), batch_size):
            chunk_batch = chunks[i:i + batch_size]
            emb_batch = embeddings[i:i + batch_size] if embeddings else None
            
            ids = [c["chunk_id"] for c in chunk_batch]
            documents = [c["text"] for c in chunk_batch]
            metadatas = []
            for c in chunk_batch:
                c_meta = c.get("metadata", {}) or {}
                metadatas.append({
                    "doc_id": str(c.get("doc_id", "")),
                    "doc_title": str(c_meta.get("title", "") or c_meta.get("doc_title", "")),
                    "doc_type": str(c_meta.get("doc_type", "Document")),
                    "year": int(c_meta.get("year") or 0),
                    "category": str(c_meta.get("category", "")),
                    "section_ref": str(c.get("section_ref") or c_meta.get("section_ref", "")),
                    "chunk_index": int(c.get("chunk_index", 0)),
                    "file_name": str(c_meta.get("file_name", "")),
                })
            
            if emb_batch:
                self._collection.upsert(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas,
                    embeddings=emb_batch,
                )
            else:
                lc_docs = [
                    Document(page_content=doc, metadata=meta, id=cid)
                    for doc, meta, cid in zip(documents, metadatas, ids)
                ]
                self.vectorstore.add_documents(documents=lc_docs)
            
            logger.info(f"Upserted batch {i // batch_size + 1} ({len(chunk_batch)} chunks)")

    def delete(self, chunk_ids: list[str]):
        """Delete chunks from ChromaDB by their IDs."""
        if not chunk_ids:
            return
        batch_size = 2000
        for i in range(0, len(chunk_ids), batch_size):
            batch = chunk_ids[i:i + batch_size]
            self._collection.delete(ids=batch)
            logger.info(f"Deleted batch {i // batch_size + 1} ({len(batch)} chunks from ChromaDB)")

    def search(
        self,
        query: str = None,
        query_embedding: list[float] = None,
        top_k: int = 15,
        where: dict = None,
    ) -> list[dict]:
        """Search Chroma using LangChain similarity search with optional metadata filtering."""
        if query and not query_embedding:
            results = self.vectorstore.similarity_search_with_score(
                query=query, 
                k=top_k, 
                filter=where
            )
            output = []
            for doc, distance in results:
                output.append({
                    "chunk_id": doc.id if hasattr(doc, 'id') else None,
                    "text": doc.page_content,
                    "metadata": doc.metadata,
                    "score": 1 - distance,
                })
            return output

        # Direct vector query
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
                dist = raw_results["distances"][0][i] if "distances" in raw_results else 0.0
                output.append({
                    "chunk_id": raw_results["ids"][0][i],
                    "text": raw_results["documents"][0][i],
                    "metadata": raw_results["metadatas"][0][i],
                    "score": 1.0 - dist,
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
        name = self.collection_name
        try:
            self._client.delete_collection(name)
        except Exception:
            pass
        self._collection = self._client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )
        self.vectorstore = Chroma(
            client=self._client,
            collection_name=name,
            embedding_function=self.embedding_function,
            collection_metadata={"hnsw:space": "cosine"}
        )
        logger.warning(f"ChromaDB collection '{name}' has been reset")
