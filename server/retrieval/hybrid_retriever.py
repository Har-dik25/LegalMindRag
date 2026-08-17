"""
Hybrid Retriever — Combines dense (ChromaDB) and sparse (BM25) retrieval
using LangChain's EnsembleRetriever (RRF), then re-ranks with a cross-encoder.
"""
import logging
import re
from dataclasses import dataclass, field
from sentence_transformers import CrossEncoder

from embeddings.embedder import Embedder
from vectorstore.chroma_store import ChromaStore
from vectorstore.bm25_store import BM25Store
from retrieval.query_preprocessor import extract_query_section_ref
import config

logger = logging.getLogger(__name__)


@dataclass
class RetrievalResult:
    """A single retrieval result."""
    chunk_id: str
    text: str
    score: float
    source: str  # "ensemble" or "reranked"
    metadata: dict = field(default_factory=dict)
    rerank_score: float = 0.0


class HybridRetriever:
    """
    Full retrieval pipeline:
    1. LangChain Dense Retriever (Chroma)
    2. LangChain Sparse Retriever (BM25)
    3. Custom Reciprocal Rank Fusion (RRF) with Section Boosting
    4. Cross-encoder re-ranking
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
            try:
                self.reranker = CrossEncoder(model_name)
                logger.info("Reranker loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load cross-encoder ({e}), falling back to RRF fusion.")
                self.reranker = None

    def retrieve(
        self,
        query: str,
        top_k: int = None,
        filters: dict = None,
        use_reranker: bool = True,
    ) -> list[RetrievalResult]:
        """
        Full hybrid retrieval pipeline using LangChain base retrievers + Custom RRF.
        """
        top_k = top_k or config.TOP_K_RERANK

        # Build individual LangChain retrievers
        chroma_retriever = self.chroma_store.vectorstore.as_retriever(
            search_kwargs={"k": config.TOP_K_DENSE, "filter": filters}
        )
        
        # Dense retrieval
        logger.info("Running LangChain Dense Retriever")
        try:
            dense_docs = chroma_retriever.invoke(query)
        except Exception as e:
            logger.error(f"Dense retrieval error: {e}")
            dense_docs = []
        
        # Sparse retrieval
        sparse_docs = []
        if self.bm25_store.retriever:
            self.bm25_store.retriever.k = config.TOP_K_SPARSE
            logger.info("Running LangChain Sparse Retriever (BM25)")
            try:
                sparse_docs = self.bm25_store.retriever.invoke(query)
            except Exception as e:
                logger.error(f"Sparse retrieval error: {e}")
                sparse_docs = []
        else:
            logger.warning("BM25 Retriever not built, skipping sparse retrieval")

        # Extract target section for section-boosted fusion
        target_section = extract_query_section_ref(query)

        # Fusion
        fused = self._reciprocal_rank_fusion(dense_docs, sparse_docs, target_section=target_section)

        # Re-rank (optional but recommended)
        if use_reranker and self.reranker and fused:
            reranked = self._rerank(query, fused, top_k)
            logger.info(f"Re-ranked to top {len(reranked)} results")
            return reranked
        else:
            return fused[:top_k]

    def _reciprocal_rank_fusion(
        self,
        dense_docs: list,
        sparse_docs: list,
        k: int = None,
        target_section: str = None,
    ) -> list[RetrievalResult]:
        """
        Reciprocal Rank Fusion — merge dense and sparse LangChain documents
        with section-priority boosting and complete metadata preservation.
        """
        k = k or config.RRF_K
        scores: dict[str, float] = {}
        result_map: dict[str, RetrievalResult] = {}

        def process_docs(docs, source_name):
            for rank, doc in enumerate(docs):
                meta = getattr(doc, "metadata", {}) or {}
                cid = meta.get("chunk_id", doc.id if hasattr(doc, 'id') else f"unknown_{rank}_{source_name}")
                
                # Base RRF score
                base_score = 1.0 / (k + rank + 1)
                
                # Section match bonus: if query specifically targets Section/Article X
                if target_section:
                    sec_ref = meta.get("section_ref", "") or ""
                    full_content = doc.page_content if hasattr(doc, "page_content") else str(doc)
                    sec_pat = re.compile(rf'\b{re.escape(target_section)}\b', re.IGNORECASE)
                    if sec_pat.search(sec_ref) or sec_pat.search(full_content[:250]):
                        base_score *= 2.5  # Header match
                    elif sec_pat.search(full_content):
                        base_score *= 1.8  # Body match anywhere in chunk
                
                scores[cid] = scores.get(cid, 0) + base_score
                
                if cid not in result_map:
                    result_map[cid] = RetrievalResult(
                        chunk_id=cid,
                        text=doc.page_content if hasattr(doc, "page_content") else str(doc),
                        score=0.0,
                        source="hybrid",
                        metadata=meta
                    )
                else:
                    # Merge metadata if second retriever has richer info
                    for key, val in meta.items():
                        if val and not result_map[cid].metadata.get(key):
                            result_map[cid].metadata[key] = val

        process_docs(dense_docs, "dense")
        process_docs(sparse_docs, "sparse")

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
        try:
            scores = self.reranker.predict(pairs)
            for result, score in zip(results, scores):
                result.rerank_score = float(score)

            results.sort(key=lambda r: r.rerank_score, reverse=True)
        except Exception as e:
            logger.error(f"Re-ranking failed ({e}), keeping RRF order.")

        return results[:top_k]
