"""
Core Python Hybrid Retriever — No LangChain dependency.
Approach 2: Direct ChromaDB + BM25 retrieval with RRF fusion and optional re-ranking.
"""
import logging
from dataclasses import dataclass, field
from sentence_transformers import CrossEncoder

from embeddings.embedder import Embedder
from vectorstore.chroma_store import ChromaStore
from vectorstore.bm25_store import BM25Store
import config

logger = logging.getLogger(__name__)


@dataclass
class RetrievalResult:
    """A single retrieval result."""
    chunk_id: str
    text: str
    score: float
    source: str  # "dense", "sparse", "hybrid", "reranked"
    metadata: dict = field(default_factory=dict)
    rerank_score: float = 0.0


class CoreHybridRetriever:
    """
    Core Python Retrieval Pipeline (No LangChain):
    1. Direct ChromaDB semantic search (dense)
    2. Direct BM25 keyword search (sparse)
    3. Reciprocal Rank Fusion (RRF)
    4. Optional Cross-encoder re-ranking
    """

    def __init__(
        self,
        embedder: Embedder,
        chroma_store: ChromaStore,
        bm25_store: BM25Store,
        reranker_model: str = None,
        load_reranker: bool = True,
    ):
        self.embedder = embedder
        self.chroma_store = chroma_store
        self.bm25_store = bm25_store
        self.reranker = None

        # Load cross-encoder for re-ranking (optional)
        if load_reranker:
            model_name = reranker_model or config.CROSS_ENCODER_MODEL
            logger.info(f"Loading cross-encoder reranker: {model_name}")
            self.reranker = CrossEncoder(model_name)
            logger.info("Reranker loaded successfully")

    def retrieve(
        self,
        query: str,
        top_k: int = None,
        filters: dict = None,
        use_reranker: bool = True,
    ) -> list[RetrievalResult]:
        """
        Full hybrid retrieval pipeline using direct API calls (no LangChain).
        """
        top_k = top_k or config.TOP_K_RERANK

        # 1. Dense retrieval: embed query → search ChromaDB directly
        logger.info("Running Core Python Dense Retriever (ChromaDB)")
        query_embedding = self.embedder.embed_query(query)
        dense_results = self.chroma_store.search(
            query_embedding=query_embedding,
            top_k=config.TOP_K_DENSE,
            where=filters,
        )
        
        dense_items = []
        for r in dense_results:
            dense_items.append(RetrievalResult(
                chunk_id=r["chunk_id"],
                text=r["text"],
                score=r["score"],
                source="dense",
                metadata=r["metadata"],
            ))

        # 2. Sparse retrieval: BM25 keyword search
        logger.info("Running Core Python Sparse Retriever (BM25)")
        sparse_raw = self.bm25_store.search(query, top_k=config.TOP_K_SPARSE)
        sparse_items = []
        for r in sparse_raw:
            sparse_items.append(RetrievalResult(
                chunk_id=r["chunk_id"],
                text=r.get("text", ""),
                score=r.get("score", 0.0),
                source="sparse",
                metadata=r.get("metadata", {}),
            ))

        # 3. RRF Fusion
        fused = self._reciprocal_rank_fusion(dense_items, sparse_items)

        # 4. Re-rank (optional)
        if use_reranker and self.reranker and fused:
            reranked = self._rerank(query, fused, top_k)
            logger.info(f"Re-ranked to top {len(reranked)} results")
            return reranked
        else:
            return fused[:top_k]

    def _reciprocal_rank_fusion(
        self,
        dense_results: list[RetrievalResult],
        sparse_results: list[RetrievalResult],
        k: int = None,
    ) -> list[RetrievalResult]:
        """
        Reciprocal Rank Fusion — merge dense and sparse results.
        RRF_score(doc) = sum(1 / (k + rank)) across all lists.
        """
        k = k or config.RRF_K
        scores: dict[str, float] = {}
        result_map: dict[str, RetrievalResult] = {}

        def process_results(results: list[RetrievalResult]):
            for rank, result in enumerate(results):
                cid = result.chunk_id
                scores[cid] = scores.get(cid, 0) + 1.0 / (k + rank + 1)
                if cid not in result_map:
                    result_map[cid] = RetrievalResult(
                        chunk_id=cid,
                        text=result.text,
                        score=0.0,
                        source="hybrid",
                        metadata=result.metadata,
                    )

        process_results(dense_results)
        process_results(sparse_results)

        # Sort by RRF score
        sorted_ids = sorted(scores.keys(), key=lambda cid: scores[cid], reverse=True)

        fused = []
        for chunk_id in sorted_ids:
            result = result_map[chunk_id]
            result.score = scores[chunk_id]
            fused.append(result)

        return fused

    def _rerank(
        self, query: str, results: list[RetrievalResult], top_k: int
    ) -> list[RetrievalResult]:
        """Re-rank results using a cross-encoder model."""
        if not results:
            return []

        pairs = [(query, r.text) for r in results]
        scores = self.reranker.predict(pairs)

        for result, score in zip(results, scores):
            result.rerank_score = float(score)

        results.sort(key=lambda r: r.rerank_score, reverse=True)
        return results[:top_k]
