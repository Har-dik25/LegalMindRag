import sys
import logging
import config
from embeddings.embedder import Embedder
from vectorstore.chroma_store import ChromaStore
from vectorstore.bm25_store import BM25Store
from retrieval.hybrid_retriever import HybridRetriever
from generation.extractive_summarizer import generate_extractive_summary

logging.basicConfig(level=logging.INFO)

def test_pipeline():
    embedder = Embedder(config.EMBEDDING_MODEL)
    chroma = ChromaStore(config.CHROMA_PERSIST_DIR, config.CHROMA_COLLECTION, embedding_function=embedder.embeddings)
    bm25 = BM25Store()
    bm25.load(str(config.BM25_DIR))
    retriever = HybridRetriever(embedder, chroma, bm25, load_reranker=False)

    queries = [
        "What is Section 103 of BNS 2023?",
        "What is a Zero FIR under BNSS 2023?",
        "How does BSA 2023 treat WhatsApp messages as electronic evidence?",
    ]

    for q in queries:
        print("\n" + "="*70)
        print(f"QUERY: {q}")
        print("="*70)
        docs = retriever.retrieve(q, top_k=5)
        print(f"Retrieved {len(docs)} documents.")
        for i, d in enumerate(docs[:3]):
            title = getattr(d, 'metadata', {}).get('doc_title', 'Unknown')
            sec = getattr(d, 'metadata', {}).get('section_ref', 'N/A')
            print(f"  [{i+1}] Title: {title} | Sec: {sec} | Score: {getattr(d, 'score', 0):.3f}")
        
        answer = generate_extractive_summary(q, docs)
        print("\n--- EXTRACTIVE AI OVERVIEW ---")
        print(answer)

if __name__ == "__main__":
    test_pipeline()
