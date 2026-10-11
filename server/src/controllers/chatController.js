import { getEmbedding, generateRAGAnswer } from '../services/geminiService.js';
import { searchSimilarChunks } from '../services/vectorService.js';
import { isMongoConnected, inMemoryStore } from '../config/db.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';

/**
 * Executes the full RAG Retrieval & Generation loop:
 * 1. Embeds user question via Gemini Embedding model.
 * 2. Queries Atlas Vector Search / Cosine engine for top-K chunks.
 * 3. Builds grounded context prompt with strict citation constraints.
 * 4. Invokes Gemini LLM for hallucination-free generation with source cards.
 */
export const handleChatQuery = async (req, res) => {
  const startTime = Date.now();

  try {
    const { message, documentId = null, topK = 4, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'A valid query message string is required.' });
    }

    const trimmedQuery = message.trim();
    console.log(`💬 [RAG Query] "${trimmedQuery.slice(0, 60)}..." (Filter: ${documentId || 'All Documents'})`);

    // 1. Vectorize user inquiry
    const queryVector = await getEmbedding(trimmedQuery);

    // 2. Perform high-dimensional vector similarity retrieval
    const retrievedChunks = await searchSimilarChunks(queryVector, {
      topK: Math.min(Math.max(topK, 1), 8),
      documentId: documentId || null,
      minScore: 0.1, // Minimum cosine relevance threshold
    });

    console.log(`🔍 [Retrieval] Found ${retrievedChunks.length} relevant context chunk(s) (Top score: ${retrievedChunks[0]?.similarityScore ?? 'N/A'})`);

    // 3. Grounded Generation via Gemini LLM
    const { answer, citations, modelUsed } = await generateRAGAnswer({
      question: trimmedQuery,
      contextChunks: retrievedChunks,
      conversationHistory,
    });

    const latencyMs = Date.now() - startTime;

    return res.json({
      success: true,
      answer,
      citations,
      stats: {
        latencyMs,
        retrievedChunksCount: retrievedChunks.length,
        topScore: retrievedChunks[0]?.similarityScore || 0,
        modelUsed,
        retrievalMethod: isMongoConnected() ? 'MongoDB Atlas Vector Search ($vectorSearch)' : 'In-Memory Cosine Similarity Engine',
      },
    });
  } catch (error) {
    console.error('❌ [RAG Chat Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error occurred while processing RAG query',
    });
  }
};

/**
 * Returns diagnostic and capacity metrics for the knowledge hub.
 */
export const getSystemStats = async (req, res) => {
  try {
    let docCount = 0;
    let chunkCount = 0;

    if (isMongoConnected()) {
      docCount = await Document.countDocuments();
      chunkCount = await Chunk.countDocuments();
    } else {
      docCount = inMemoryStore.documents.size;
      chunkCount = inMemoryStore.chunks.length;
    }

    return res.json({
      success: true,
      stats: {
        totalDocuments: docCount,
        totalChunks: chunkCount,
        vectorDimensions: 768,
        storageEngine: isMongoConnected() ? 'MongoDB Atlas (Live Cluster)' : 'High-Speed In-Memory Vector Store',
        chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
        hasGeminiKey: Boolean(
          process.env.GEMINI_API_KEY &&
          !process.env.GEMINI_API_KEY.includes('your_gemini_api_key') &&
          !process.env.GEMINI_API_KEY.includes('YOUR_ACTUAL_API_KEY')
        ),
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
