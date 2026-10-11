import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

const getGenAI = () => {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  
  apiKey = apiKey.replace(/^["']|["']$/g, '').trim();

  if (
    apiKey === '' ||
    apiKey.includes('your_gemini_api_key') ||
    apiKey.includes('YOUR_ACTUAL_API_KEY')
  ) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Deterministic pseudo-embedding generator (768 dimensions) for offline/testing mode.
 * Generates normalized vector with semantic clustering from token hashes.
 */
const generatePseudoEmbedding = (text) => {
  const dim = 768;
  const vec = new Array(dim).fill(0);
  const words = text.toLowerCase().match(/\w+/g) || ['empty'];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(j);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % dim;
    vec[bucket] += 1.0 / (1 + Math.log(1 + words.length));
  }

  // Normalize to unit vector
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) vec[i] /= norm;

  return vec;
};

/**
 * Generates a 768-dimensional vector embedding for a single text chunk.
 * @param {string} text - Chunk text
 * @returns {Promise<number[]>}
 */
export const getEmbedding = async (text) => {
  const ai = getGenAI();

  if (!ai) {
    return generatePseudoEmbedding(text);
  }

  try {
    const modelName = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
    const model = ai.getGenerativeModel({ model: modelName });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.warn(`⚠️ [Gemini Embeddings] API call failed (${error.message}). Falling back to local vector representation.`);
    return generatePseudoEmbedding(text);
  }
};

/**
 * Generates embeddings for multiple texts in managed concurrent batches.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export const getBatchEmbeddings = async (texts) => {
  const results = [];
  const batchSize = 5;

  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(slice.map(text => getEmbedding(text)));
    results.push(...batchResults);
    // Brief sleep to avoid hitting quota spikes
    if (i + batchSize < texts.length) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  return results;
};

/**
 * RAG Generation: Grounds the user question on retrieved context chunks.
 * @param {Object} params
 * @param {string} params.question - User's query
 * @param {Array} params.contextChunks - Top-K chunks retrieved by vector search
 * @param {Array} params.conversationHistory - Prior messages
 * @returns {Promise<{ answer: string, citations: Array, modelUsed: string }>}
 */
export const generateRAGAnswer = async ({ question, contextChunks = [], conversationHistory = [] }) => {
  const ai = getGenAI();
  const modelName = process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash';

  // Format context excerpts with explicit citation tags
  const contextText = contextChunks
    .map((chunk, idx) => {
      const sourceId = `[Source ${idx + 1}]`;
      return `${sourceId} Document: "${chunk.documentName}", Page ${chunk.pageNumber}, Chunk #${chunk.chunkIndex}:\n"""\n${chunk.text}\n"""`;
    })
    .join('\n\n');

  const systemInstruction = `You are InsightDoc AI, an expert Research & Engineering Document Assistant.
Your mission is to deliver comprehensive, highly structured, and strictly context-grounded answers to the user's inquiry based exclusively on the provided document excerpts.

STRICT GROUNDING & ANTI-HALLUCINATION RULES:
1. ONLY utilize information explicitly mentioned in the provided [Source X] excerpts below.
2. DO NOT speculate, assume, or hallucinate facts that are absent from the context.
3. If the provided excerpts do not contain enough facts to answer the question, clearly state:
   "Based on the provided document(s), there is insufficient information to answer this question." Then briefly highlight what relevant topics ARE discussed in the documents.
4. CITE YOUR SOURCES ACCURATELY: Whenever you state a fact derived from an excerpt, append the corresponding bracketed citation immediately (e.g., "[Source 1]" or "[Source 1, Source 2]").
5. FORMATTING: Use clean GitHub-flavored Markdown, including bold highlights, bullet points, headers, and code blocks where applicable. Keep the tone professional, precise, and articulate.`;

  const prompt = `DOCUMENT CONTEXT EXCERPTS:
${contextChunks.length > 0 ? contextText : '(No relevant document chunks found for this query.)'}

----------------------------------------
USER QUESTION:
${question}

Provide your grounded response below, following the citation rules:`;

  if (!ai) {
    // High-quality mock response when GEMINI_API_KEY is not configured
    let mockAnswer = '';
    if (contextChunks.length === 0) {
      mockAnswer = `Based on the provided document(s), there are no relevant text passages found for your question **"${question}"**. Please make sure you have uploaded relevant PDF documents or try a different phrasing.`;
    } else {
      const top = contextChunks[0];
      mockAnswer = `### Synthesis & Analysis

According to **${top.documentName}** [Source 1], the document highlights key findings pertinent to your inquiry:

> *"${top.text.slice(0, 220)}..."* [Source 1]

${contextChunks.length > 1 ? `Furthermore, secondary context from page ${contextChunks[1].pageNumber} indicates that: \n\n> *"${contextChunks[1].text.slice(0, 200)}..."* [Source 2]\n\n` : ''}
#### Summary Points:
- **Primary Insight**: The context directly addresses ${question.toLowerCase().replace(/[^a-z0-9 ]/g, '')} within the recorded segments [Source 1].
- **Traceability**: All referenced excerpts have been mapped to their respective document positions and similarity scores.

*(Notice: Running in In-Memory / Local Mode. Add your free GEMINI_API_KEY in \`server/.env\` for live multi-modal Gemini LLM generation!)*`;
    }

    return {
      answer: mockAnswer,
      citations: contextChunks.map((c, i) => ({
        sourceNumber: i + 1,
        documentName: c.documentName,
        documentId: c.documentId,
        pageNumber: c.pageNumber,
        chunkIndex: c.chunkIndex,
        similarityScore: c.similarityScore || 0.85,
        snippet: c.text.slice(0, 280) + '...',
      })),
      modelUsed: 'InsightDoc Local Engine (Configure GEMINI_API_KEY for live Gemini 1.5 Flash)',
    };
  }

  try {
    const model = ai.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return {
      answer,
      citations: contextChunks.map((c, i) => ({
        sourceNumber: i + 1,
        documentName: c.documentName,
        documentId: c.documentId,
        pageNumber: c.pageNumber,
        chunkIndex: c.chunkIndex,
        similarityScore: c.similarityScore,
        snippet: c.text.slice(0, 280) + '...',
      })),
      modelUsed: modelName,
    };
  } catch (error) {
    console.error('❌ [Gemini Chat] API Error:', error.message);
    throw new Error(`Gemini LLM Generation failed: ${error.message}`);
  }
};
