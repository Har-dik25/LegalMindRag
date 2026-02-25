"""
Legal RAG Terminal — Interactive CLI for the Legal AI Assistant.
Run the complete RAG pipeline from your terminal.

Usage: python main.py
"""
import sys
import time
import logging
from pathlib import Path

import config
from embeddings.embedder import Embedder
from vectorstore.chroma_store import ChromaStore
from vectorstore.bm25_store import BM25Store
from retrieval.hybrid_retriever import HybridRetriever
from generation.llm_client import LLMClient
from generation.prompt_builder_core import build_rag_prompt, get_system_prompt

# ── Logging Setup ──
logging.basicConfig(
    level=logging.WARNING,  # Only warnings+ for clean terminal output
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    handlers=[
        logging.FileHandler(config.LOG_PATH / "rag.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

# ── Banner ──
BANNER = r"""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ⚖️   LEGAL AI — RAG Assistant for Indian Law   ⚖️       ║
║                                                              ║
║     Powered by: ChromaDB + BM25 + Ollama (Local LLM)        ║
║     Dataset: 65 legal documents | Indian Law Corpus          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"""

HELP_TEXT = """
📋 COMMANDS:
  /help     — Show this help message
  /stats    — Show index statistics
  /sources  — List indexed document categories
  /stream   — Toggle streaming mode (on/off)
  /verbose  — Toggle verbose mode (show retrieval details)
  /filter   — Set category filter (e.g., /filter Criminal Law)
  /nofilter — Remove category filters
  /clear    — Clear screen
  /quit     — Exit the application

💡 USAGE:
  Just type your legal question and press Enter.

📝 EXAMPLE QUESTIONS:
  • What is Section 302 of BNS 2023?
  • Explain the right to privacy under Article 21
  • What are the grounds for divorce under Hindu Marriage Act?
  • Difference between bail under BNSS and CrPC
  • What did the Supreme Court hold in Kesavananda Bharati?
"""


class LegalRAG:
    """The core RAG application — ties everything together."""

    def __init__(self):
        self.retriever = None
        self.llm = None
        self.streaming = True
        self.verbose = False
        self.active_filter = None

    def initialize(self):
        """Load all components."""
        print("\n🔄 Initializing Legal RAG system...\n")

        # 1. Load embedder
        print("   [1/5] Loading embedding model...", end=" ", flush=True)
        start = time.time()
        embedder = Embedder(config.EMBEDDING_MODEL)
        print(f"✅ ({time.time() - start:.1f}s)")

        # 2. Load ChromaDB
        print("   [2/5] Loading ChromaDB index...", end=" ", flush=True)
        start = time.time()
        chroma = ChromaStore(config.CHROMA_PERSIST_DIR, config.CHROMA_COLLECTION)
        stats = chroma.get_stats()
        if stats["total_chunks"] == 0:
            print("❌")
            print("\n   ⚠️  ChromaDB is empty! Run these commands first:")
            print("      python -m scripts.ingest_all")
            print("      python -m scripts.build_index")
            sys.exit(1)
        print(f"✅ ({stats['total_chunks']} chunks, {time.time() - start:.1f}s)")

        # 3. Load BM25
        print("   [3/5] Loading BM25 index...", end=" ", flush=True)
        start = time.time()
        bm25 = BM25Store()
        loaded = bm25.load(str(config.BM25_DIR))
        if not loaded:
            print("❌")
            print("\n   ⚠️  BM25 index not found! Run: python -m scripts.build_index")
            sys.exit(1)
        print(f"✅ ({len(bm25.chunk_ids)} chunks, {time.time() - start:.1f}s)")

        # 4. Load retriever
        if config.USE_RERANKER:
            print("   [4/5] Loading hybrid retriever + reranker...", end=" ", flush=True)
        else:
            print("   [4/5] Loading hybrid retriever (no reranker)...", end=" ", flush=True)
        start = time.time()
        self.retriever = HybridRetriever(embedder, chroma, bm25, load_reranker=config.USE_RERANKER)
        print(f"✅ ({time.time() - start:.1f}s)")

        # 5. Load LLM
        print("   [5/5] Connecting to Ollama LLM...", end=" ", flush=True)
        start = time.time()
        self.llm = LLMClient()
        print(f"✅ ({time.time() - start:.1f}s)")

        print("\n   ✅ All systems ready!")
        print(f"   📊 Index: {stats['total_chunks']} chunks | Model: {config.OLLAMA_MODEL}")

    def query(self, question: str) -> str:
        """Run the full RAG pipeline: retrieve → build prompt → generate."""
        total_start = time.time()

        # Step 1: Retrieve
        retrieve_start = time.time()
        results = self.retriever.retrieve(
            query=question,
            top_k=config.TOP_K_RERANK,
            filters=self.active_filter,
            use_reranker=config.USE_RERANKER,
        )
        retrieve_time = time.time() - retrieve_start

        if self.verbose:
            print(f"\n   🔍 Retrieved {len(results)} chunks in {retrieve_time:.2f}s")
            for i, r in enumerate(results, 1):
                meta = r.metadata
                title = meta.get("doc_title", meta.get("title", "?"))
                score = r.rerank_score if r.rerank_score else r.score
                print(f"      [{i}] {title} (score={score:.4f}, {r.source})")
                if r.metadata.get("section_ref"):
                    print(f"          Section: {r.metadata['section_ref']}")

        # Step 2: Build prompt
        system_prompt = get_system_prompt()
        user_prompt = build_rag_prompt(question, results)

        # Step 3: Generate
        generate_start = time.time()

        if self.streaming:
            # Stream tokens to terminal
            print()
            full_response = ""
            for token in self.llm.generate_stream(system_prompt, user_prompt):
                print(token, end="", flush=True)
                full_response += token
            print()
            answer = full_response
        else:
            answer = self.llm.generate(system_prompt, user_prompt)

        generate_time = time.time() - generate_start
        total_time = time.time() - total_start

        # Print timing
        print(f"\n   ⏱️  Retrieval: {retrieve_time:.2f}s | "
              f"Generation: {generate_time:.2f}s | "
              f"Total: {total_time:.2f}s")

        # Print sources
        if results:
            print(f"\n   📚 Sources ({len(results)}):")
            seen = set()
            for r in results:
                meta = r.metadata
                title = meta.get("doc_title", meta.get("title", "?"))
                if title not in seen:
                    doc_type = meta.get("doc_type", "?")
                    year = meta.get("year", "N/A")
                    print(f"      • {title} ({doc_type}, {year})")
                    seen.add(title)

        return answer

    def show_stats(self):
        """Display index statistics."""
        stats = self.retriever.chroma_store.get_stats()
        print(f"\n   📊 ChromaDB: {stats['total_chunks']} chunks")
        print(f"   📚 BM25: {len(self.retriever.bm25_store.chunk_ids)} chunks")
        print(f"   🧠 Embedding: {config.EMBEDDING_MODEL}")
        print(f"   🤖 LLM: {config.OLLAMA_MODEL}")
        print(f"   🔄 Streaming: {'ON' if self.streaming else 'OFF'}")
        print(f"   🔍 Verbose: {'ON' if self.verbose else 'OFF'}")
        if self.active_filter:
            print(f"   🏷️  Filter: {self.active_filter}")

    def show_sources(self):
        """List indexed document categories."""
        # Get unique categories from ChromaDB metadata
        print("\n   📂 Indexed Document Categories:")
        print("      (Based on dataset folder structure)\n")
        categories = [
            "Constitutional Law", "Criminal Law", "Criminal Procedure",
            "Evidence Law", "Civil Procedure", "Contract Law",
            "Corporate Law", "Consumer Law", "Cyber Law",
            "Environmental Law", "Family Law", "Property Law",
            "Tax & Financial Law", "Labour Law", "Administrative Law",
            "Legal Profession", "ADR & Arbitration", "International Law",
            "Case Law - Supreme Court", "Case Law - High Courts",
            "Law Commission", "Legal Reference", "Legal Templates",
            "Commentary", "Policy", "Legal Education",
        ]
        for cat in categories:
            print(f"      • {cat}")
        print(f"\n   💡 Use '/filter {categories[0]}' to restrict searches")


def main():
    """Main entry point for the terminal RAG application."""
    print(BANNER)

    # Initialize
    rag = LegalRAG()
    rag.initialize()

    print(HELP_TEXT)
    print("-" * 60)

    # Interactive loop
    while True:
        try:
            print()
            question = input("⚖️  You: ").strip()

            if not question:
                continue

            # Handle commands
            if question.startswith("/"):
                cmd = question.lower().split()
                command = cmd[0]

                if command == "/quit" or command == "/exit" or command == "/q":
                    print("\n   👋 Goodbye! Stay legally informed.\n")
                    break

                elif command == "/help":
                    print(HELP_TEXT)

                elif command == "/stats":
                    rag.show_stats()

                elif command == "/sources":
                    rag.show_sources()

                elif command == "/stream":
                    rag.streaming = not rag.streaming
                    print(f"   🔄 Streaming: {'ON' if rag.streaming else 'OFF'}")

                elif command == "/verbose":
                    rag.verbose = not rag.verbose
                    print(f"   🔍 Verbose: {'ON' if rag.verbose else 'OFF'}")

                elif command == "/filter":
                    if len(cmd) > 1:
                        category = " ".join(cmd[1:])
                        rag.active_filter = {"category": category}
                        print(f"   🏷️  Filter set: category = '{category}'")
                    else:
                        print("   Usage: /filter Criminal Law")

                elif command == "/nofilter":
                    rag.active_filter = None
                    print("   🏷️  Filters removed")

                elif command == "/clear":
                    import os
                    os.system("cls" if os.name == "nt" else "clear")
                    print(BANNER)

                else:
                    print(f"   ❓ Unknown command: {command}. Type /help for options.")

                continue

            # Run RAG query
            print("\n   🤔 Thinking...")
            rag.query(question)

        except KeyboardInterrupt:
            print("\n\n   👋 Interrupted. Goodbye!\n")
            break
        except Exception as e:
            logger.error(f"Error: {e}", exc_info=True)
            print(f"\n   ❌ Error: {e}")
            print("   Check logs/rag.log for details.")


if __name__ == "__main__":
    main()
