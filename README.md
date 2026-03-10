# ⚖️ LegalMindRag — Legal AI Assistant for Indian Law

**LegalMindRag** is an industry-grade Retrieval-Augmented Generation (RAG) pipeline designed specifically for the Indian Legal Corpus. Built with **Core Python** (without high-level abstractions like LangChain or LlamaIndex), it provides deep control over the retrieval and generation phases. It utilizes a powerful hybrid retrieval system (ChromaDB + BM25), cross-encoder re-ranking, and local LLM generation via Ollama for a secure, offline, and highly accurate legal AI experience.

## ✨ Key Features

- **Core Python Implementation**: Built from scratch for maximum control and understanding of the RAG mechanics.
- **Hybrid Retrieval System**: Combines semantic dense retrieval (ChromaDB) with keyword sparse retrieval (BM25) using Reciprocal Rank Fusion (RRF) to ensure accurate fetching of strict legal terminology.
- **Cross-Encoder Re-ranking**: Integrates a cross-encoder model to re-score the retrieved chunks, boosting precision.
- **Local Data & LLM**: Runs entirely locally using `Ollama` (Llama 3 / Mistral), ensuring sensitive legal data never leaves your machine.
- **Dual Interfaces**: 
  - An interactive terminal CLI (`main.py`)
  - A FastAPI backend (`api.py`) configured to serve a React frontend (`client/`).

## 📐 Architecture Overview

The system is organized into distinct phases mimicking an enterprise-level pipeline:
1. **Ingestion (`ingestion/`)**: Parses PDF/TXT files, cleans text, extracts metadata (Act name, year, section), and performs legal-aware hierarchical chunking.
2. **Embeddings & Vector Store (`embeddings/`, `vectorstore/`)**: Uses `sentence-transformers` for embeddings, caching them to avoid recomputation, and stores vectors in `ChromaDB` alongside a `BM25` index.
3. **Retrieval (`retrieval/`)**: Queries both indices, fuses results with RRF, and re-ranks them.
4. **Generation (`generation/`)**: Constructs dynamic, context-aware prompts enforcing strict legal citations, passing them to the local LLM.

## 🛠️ Tech Stack
- **Backend**: Python 3, FastAPI, Uvicorn
- **Vector Store**: ChromaDB (Semantic Dense Search)
- **Sparse Index**: rank-bm25 (Keyword Search)
- **Embeddings/Re-ranking**: `sentence-transformers`
- **LLM Engine**: Ollama (e.g., `llama3.2`)
- **Frontend**: React (Vite)

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- [Ollama](https://ollama.com/download) installed and running.

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Har-dik25/LegalMindRag.git
   cd LegalMindRag
   ```

2. **Set up the virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Pull an Ollama Model:**
   Make sure Ollama is running, then pull a local model:
   ```bash
   ollama pull llama3.2
   ```
   *(You can select other models in `config.py`)*

### Usage

**Option A: Terminal CLI mode**
Run the interactive CLI application to ask legal questions directly from your terminal:
```bash
python main.py
```

**Option B: Web Application (API + Frontend)**
1. **Start the FastAPI backend:**
   ```bash
   uvicorn api.main:app --reload
   ```
2. **Start the React Frontend:**
   Navigate to the `client/` directory, install dependencies, and start the Vite development server:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 📂 Data Structure
*(Ensure the data structure is built out by running the ingestion scripts before querying. Use the scripts provided in the `scripts/` directory as detailed in the internal documentation).*

- `data/chroma_db/`: Persistent vector storage.
- `data/bm25_index/`: Cached sparse index.
- `LegalAI Dataset/`: Your local repository of legal documents.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

---
*Built to make Indian constitutional, corporate, and civil law instantly searchable.*
