import Chunk from '../models/Chunk.js';
import { isMongoConnected, inMemoryStore } from '../config/db.js';

/**
 * Calculates cosine similarity between two numeric vectors.
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
};

/**
 * Searches chunks using MongoDB Atlas Vector Search ($vectorSearch).
 */
const searchAtlasVector = async (queryVector, options = {}) => {
  const { topK = 4, documentId = null, minScore = 0.55 } = options;
  const indexName = process.env.VECTOR_INDEX_NAME || 'vector_index';

  const vectorSearchStage = {
    index: indexName,
    path: 'embedding',
    queryVector: queryVector,
    numCandidates: Math.max(topK * 10, 50),
    limit: topK,
  };

  if (documentId) {
    vectorSearchStage.filter = { documentId };
  }

  const pipeline = [
    { $vectorSearch: vectorSearchStage },
    {
      $project: {
        _id: 1,
        documentId: 1,
        documentName: 1,
        chunkIndex: 1,
        pageNumber: 1,
        text: 1,
        tokenCount: 1,
        similarityScore: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  const results = await Chunk.aggregate(pipeline);
  return results.filter(r => (r.similarityScore || 0) >= minScore);
};

/**
 * Searches chunks using In-Memory / Local Cosine Similarity ranking.
 */
const searchLocalCosine = async (queryVector, options = {}) => {
  const { topK = 4, documentId = null, minScore = 0.1 } = options;

  let candidates = [];

  if (isMongoConnected()) {
    // If Mongo is connected but Atlas Search index is not yet built, fetch from Mongo Chunks
    const query = documentId ? { documentId } : {};
    candidates = await Chunk.find(query).lean();
  } else {
    // In-memory store
    candidates = documentId
      ? inMemoryStore.chunks.filter(c => String(c.documentId) === String(documentId))
      : inMemoryStore.chunks;
  }

  if (candidates.length === 0) return [];

  const scored = candidates.map(chunk => {
    const score = cosineSimilarity(queryVector, chunk.embedding);
    return {
      _id: chunk._id || chunk.id,
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      text: chunk.text,
      tokenCount: chunk.tokenCount,
      similarityScore: parseFloat(score.toFixed(4)),
    };
  });

  // Sort descending by similarity score
  scored.sort((a, b) => b.similarityScore - a.similarityScore);

  return scored
    .filter(item => item.similarityScore >= minScore)
    .slice(0, topK);
};

/**
 * Main Vector Search entrypoint.
 * Automatically tries Atlas Vector Search first, and transparently falls back to Cosine Similarity.
 * @param {number[]} queryVector - 768-dim query embedding
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Top matched chunks with similarity scores
 */
export const searchSimilarChunks = async (queryVector, options = {}) => {
  const { topK = 4, documentId = null } = options;

  if (isMongoConnected()) {
    try {
      const atlasResults = await searchAtlasVector(queryVector, { topK, documentId });
      if (atlasResults && atlasResults.length > 0) {
        return atlasResults;
      }
    } catch (atlasErr) {
      console.warn(`ℹ️ [Vector Search] Atlas $vectorSearch index not active or queried with error (${atlasErr.message}). Falling back to Mongoose Cosine ranking.`);
    }
  }

  // Graceful local/fallback search
  return await searchLocalCosine(queryVector, { topK, documentId });
};
