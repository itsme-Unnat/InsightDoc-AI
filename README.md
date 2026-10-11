# InsightDoc AI — Smart RAG Document Knowledge Hub

> **A Production-Grade 4th-Year Engineering Portfolio Project**  
> An enterprise-grade, full-stack Retrieval-Augmented Generation (RAG) system integrating a modern MERN stack with Google Gemini's 768-dimensional vector embeddings, semantic chunking, and MongoDB Atlas Vector Search.

---

## 🌟 Key Features

- **🎨 Modern Glassmorphic Dark UI / UX**:
  - Deep obsidian theme with neon cyan & indigo accents, glassmorphic panels, and backdrop blurs.
  - Smooth micro-interactions powered by **Framer Motion** and **Lucide React** icons.
  - Drag-and-drop PDF upload zone with multi-stage progress feedback.
  - Interactive chat interface with GitHub-flavored Markdown rendering, syntax-highlighted code blocks, and copy-to-clipboard utilities.
  
- **📄 Smart Document Ingestion Pipeline**:
  - Secure multipart PDF parsing with `multer` and `pdf-parse`.
  - **Sliding-Window Semantic Chunking**: ~400 tokens per chunk with 50-token overlap to prevent semantic information loss at paragraph and sentence boundaries.
  - Token estimation and document metadata tracking (page numbers, chunk indices, file size).

- **🧠 Google Gemini Vector Embeddings & RAG**:
  - Generates 768-dimensional dense vector embeddings using Google's `text-embedding-004`.
  - Strict context-grounded prompting with Gemini (`gemini-1.5-flash`) enforcing zero-hallucination guardrails.
  - Traceable **Source Citation Cards**: displays exact source document, page number, chunk index, similarity match score bar, and expandable quotation excerpt.

- **⚡ Dual-Engine Vector Store**:
  - **Primary**: Cloud-native **MongoDB Atlas Vector Search** using `$vectorSearch` aggregation pipelines.
  - **Fallback / Standalone Mode**: High-performance in-memory Cosine Similarity engine that enables instant out-of-the-box local testing without requiring external cloud credentials!

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client ["Client Tier (React + Vite + Tailwind + Framer Motion)"]
        UI[Glassmorphic Dark UI]
        Upload[Drag & Drop PDF Uploader]
        Chat[Chat Interface & Markdown Stream]
        Citations[Source Citation Cards]
    end

    subgraph Server ["Backend Tier (Node.js + Express)"]
        API[Express REST API]
        Multer[Multer Memory Storage]
        Parser[PDF Text Extractor]
        Chunker[Sliding Chunker (400t / 50t overlap)]
        RagController[RAG Orchestrator]
        CosineEngine[Fallback Cosine Ranker]
    end

    subgraph AI ["Google Gemini AI"]
        EmbedAPI["Embedding Model (text-embedding-004)"]
        LLM["Generative LLM (gemini-1.5-flash)"]
    end

    subgraph DB ["MongoDB Atlas"]
        DocsCol[("documents Collection")]
        ChunksCol[("chunks Collection + $vectorSearch Index")]
    end

    Upload -->|POST /api/upload| Multer
    Multer --> Parser
    Parser --> Chunker
    Chunker -->|Batch texts| EmbedAPI
    EmbedAPI -->|768-dim Vectors| Chunker
    Chunker -->|Store Chunks & Vectors| ChunksCol
    Parser -->|Store Metadata| DocsCol

    Chat -->|POST /api/chat| RagController
    RagController -->|User Question| EmbedAPI
    EmbedAPI -->|Query Vector| RagController
    RagController -->|Vector Similarity Query| ChunksCol
    RagController -.->|Fallback Ranking| CosineEngine
    ChunksCol -->|Top-K Context Chunks| RagController
    RagController -->|Grounded Prompt + Context| LLM
    LLM -->|Answer with [Source X] Citations| RagController
    RagController -->|Answer + Citations Metadata| Chat
    Chat --> Citations
```

---

## 📁 Repository Structure

```
InsightDoc AI/
├── client/                     # Frontend SPA (Vite + React 18)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx             # Document library & context scope selector
│   │   │   ├── ChatInterface.jsx       # Chat stream, suggestions & input area
│   │   │   ├── ChatMessage.jsx         # Markdown, code blocks & telemetry
│   │   │   ├── FileUploadModal.jsx     # Drag-and-drop uploader with progress
│   │   │   ├── SourceCitationCard.jsx  # Expandable source citation card
│   │   │   └── StatsModal.jsx          # System architecture & index specs modal
│   │   ├── services/
│   │   │   └── api.js                  # Axios client for backend endpoints
│   │   ├── App.jsx                     # Root application container
│   │   ├── main.jsx                    # React DOM bootstrap
│   │   └── index.css                   # Glassmorphism & Tailwind styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend REST API (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # MongoDB Atlas / In-Memory dual-mode connector
│   │   ├── models/
│   │   │   ├── Document.js             # Mongoose Document metadata schema
│   │   │   └── Chunk.js                # Chunk schema with 768-dim vector embeddings
│   │   ├── services/
│   │   │   ├── pdfService.js           # PDF parsing with pdf-parse
│   │   │   ├── chunkService.js         # Semantic sliding-window chunker
│   │   │   ├── geminiService.js        # Gemini Embeddings & Chat generation
│   │   │   └── vectorService.js        # Atlas $vectorSearch & cosine fallback
│   │   ├── controllers/
│   │   │   ├── docController.js        # Upload, list, delete & sample loaders
│   │   │   └── chatController.js       # RAG query retrieval & telemetry
│   │   ├── routes/
│   │   │   └── api.js                  # Express API router
│   │   ├── utils/
│   │   │   └── sampleDocs.js           # Pre-configured research datasets
│   │   └── index.js                    # Express app initialization
│   ├── .env.example
│   ├── .env
│   └── package.json
│
└── README.md                   # Complete documentation & Atlas setup guide
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- *(Optional)* Free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* Free MongoDB Atlas Cluster from [MongoDB Cloud](https://www.mongodb.com/cloud/atlas)

### 2. Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
NODE_ENV=development

# Google Gemini API Key (Get a free key at https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Atlas URI (Optional: leave empty to use built-in high-performance In-Memory Vector Store!)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/insightdoc?retryWrites=true&w=majority

# Vector Index Configuration
VECTOR_INDEX_NAME=vector_index
GEMINI_EMBEDDING_MODEL=text-embedding-004
GEMINI_CHAT_MODEL=gemini-1.5-flash
```

> 💡 **Zero-Setup Demo Mode**: If `MONGO_URI` is left blank, the application automatically activates the **In-Memory Vector Store** with exact Cosine Similarity matching. If `GEMINI_API_KEY` is omitted, the application uses local pseudo-embeddings and synthesized grounded responses so the entire UI and RAG citation flow can be explored immediately!

### 3. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
The server will boot on `http://localhost:5000`.

### 4. Start the Frontend Client
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
The client will launch on `http://localhost:3000`.

---

## 🗄️ MongoDB Atlas Vector Search Index Configuration

To enable cloud-native vector search on MongoDB Atlas:

1. Log into your [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
2. Navigate to **Atlas Search** or **Vector Search** in your cluster.
3. Select **Create Search Index** -> choose **JSON Editor**.
4. Select the Database: `insightdoc`, Collection: `chunks`.
5. Enter Index Name: `vector_index`.
6. Paste the following index definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "documentId"
    }
  ]
}
```

7. Click **Create Vector Search Index**. Atlas will index the vectors within 1–2 minutes.

---

## 🔌 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Server health check and timestamp |
| `/api/upload` | `POST` | Multipart PDF upload, chunking & vector indexing |
| `/api/documents` | `GET` | List all ingested documents and chunk statistics |
| `/api/documents/:id` | `DELETE` | Remove a document and its corresponding vector chunks |
| `/api/documents/samples` | `POST` | Preload NIST Post-Quantum & RAG research documents |
| `/api/chat` | `POST` | RAG retrieval query: vector search + grounded Gemini response |
| `/api/stats` | `GET` | Telemetry: vector dimensions, database mode, uptime |

---

## 🛡️ Anti-Hallucination & Citation Protocol

InsightDoc AI implements strict guardrails:
1. Every response is grounded exclusively on the retrieved top-K context chunks.
2. In-text bracketed citations (e.g. `[Source 1]`) link directly to the interactive **Source Citation Cards**.
3. Each citation card exposes:
   - File Origin & Page Number
   - Chunk Index
   - Cosine Match Percentage
   - Full Quoted Excerpt with One-Click Copy
