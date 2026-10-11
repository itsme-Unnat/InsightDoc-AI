import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { extractTextFromPDF } from '../services/pdfService.js';
import { chunkText } from '../services/chunkService.js';
import { getBatchEmbeddings, getEmbedding } from '../services/geminiService.js';
import { isMongoConnected, inMemoryStore } from '../config/db.js';
import { SAMPLE_DOCUMENTS } from '../utils/sampleDocs.js';

/**
 * Handles PDF file upload, text extraction, sliding-window chunking,
 * embedding generation via Gemini, and database persistence.
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded. Please provide a valid file.' });
    }

    const { originalname, buffer, size, mimetype } = req.file;

    if (!mimetype.includes('pdf') && !originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ success: false, error: 'Only PDF documents are supported at this time.' });
    }

    console.log(`📥 [Ingestion] Processing upload: "${originalname}" (${(size / 1024).toFixed(1)} KB)`);

    // 1. Extract text and metadata from PDF
    const { text, numPages } = await extractTextFromPDF(buffer);

    if (!text || text.trim().length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Unable to extract text from this PDF. It may be an image scan or password-protected.',
      });
    }

    // 2. Chunk text with sliding window
    const rawChunks = chunkText(text, { targetTokens: 400, overlapTokens: 50, pageNumber: 1 });
    console.log(`✂️  [Chunking] Generated ${rawChunks.length} chunks from ${numPages} page(s)`);

    // 3. Batch generate vector embeddings using Gemini API
    const chunkTexts = rawChunks.map(c => c.text);
    const embeddings = await getBatchEmbeddings(chunkTexts);
    console.log(`🧠 [Embeddings] Calculated ${embeddings.length} dense vector embeddings (768 dimensions)`);

    // 4. Save Document and Chunks
    let savedDoc;
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const summary = text.slice(0, 180).replace(/\s+/g, ' ') + '...';

    if (isMongoConnected()) {
      savedDoc = await Document.create({
        originalName: originalname,
        filename: `${Date.now()}-${originalname}`,
        fileSize: size,
        mimeType: mimetype,
        pageCount: numPages,
        chunkCount: rawChunks.length,
        summary,
      });

      const chunkDocs = rawChunks.map((chunk, idx) => ({
        documentId: savedDoc._id,
        documentName: originalname,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        embedding: embeddings[idx],
      }));

      await Chunk.insertMany(chunkDocs);
    } else {
      // In-Memory store fallback
      savedDoc = {
        _id: docId,
        id: docId,
        originalName: originalname,
        filename: `${Date.now()}-${originalname}`,
        fileSize: size,
        mimeType: mimetype,
        pageCount: numPages,
        chunkCount: rawChunks.length,
        summary,
        uploadedAt: new Date(),
      };

      inMemoryStore.documents.set(docId, savedDoc);

      rawChunks.forEach((chunk, idx) => {
        inMemoryStore.chunks.push({
          id: `chunk_${docId}_${idx}`,
          documentId: docId,
          documentName: originalname,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
          text: chunk.text,
          tokenCount: chunk.tokenCount,
          embedding: embeddings[idx],
        });
      });
    }

    return res.status(201).json({
      success: true,
      message: 'PDF document successfully parsed, vectorized, and indexed!',
      document: savedDoc,
      stats: {
        totalChunks: rawChunks.length,
        totalPages: numPages,
        fileSize: size,
      },
    });
  } catch (error) {
    console.error('❌ [Upload Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error processing PDF' });
  }
};

/**
 * Lists all registered documents and stats.
 */
export const getDocuments = async (req, res) => {
  try {
    let docs = [];
    if (isMongoConnected()) {
      docs = await Document.find().sort({ uploadedAt: -1 }).lean();
    } else {
      docs = Array.from(inMemoryStore.documents.values()).sort(
        (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );
    }

    const totalChunks = isMongoConnected()
      ? await Chunk.countDocuments()
      : inMemoryStore.chunks.length;

    return res.json({
      success: true,
      documents: docs,
      totalCount: docs.length,
      totalChunks,
      isAtlasConnected: isMongoConnected(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Removes a document and all of its vector chunks.
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      await Document.findByIdAndDelete(id);
      await Chunk.deleteMany({ documentId: id });
    } else {
      inMemoryStore.documents.delete(id);
      inMemoryStore.chunks = inMemoryStore.chunks.filter(c => String(c.documentId) !== String(id));
    }

    return res.json({ success: true, message: 'Document and its vector embeddings removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Loads pre-configured technical sample documents with embeddings into the store.
 */
export const loadSampleDocuments = async (req, res) => {
  try {
    const loadedDocs = [];

    for (const sample of SAMPLE_DOCUMENTS) {
      // Check if already loaded
      let exists = false;
      if (isMongoConnected()) {
        exists = await Document.findOne({ originalName: sample.originalName });
      } else {
        exists = Array.from(inMemoryStore.documents.values()).some(
          d => d.originalName === sample.originalName
        );
      }

      if (exists) {
        continue;
      }

      const chunks = chunkText(sample.content, { targetTokens: 350, overlapTokens: 50 });
      const embeddings = await getBatchEmbeddings(chunks.map(c => c.text));

      let doc;
      if (isMongoConnected()) {
        doc = await Document.create({
          originalName: sample.originalName,
          filename: sample.filename,
          fileSize: sample.fileSize,
          pageCount: sample.pageCount,
          chunkCount: chunks.length,
          summary: sample.summary,
        });

        const chunkRecords = chunks.map((c, i) => ({
          documentId: doc._id,
          documentName: sample.originalName,
          chunkIndex: c.chunkIndex,
          pageNumber: c.pageNumber,
          text: c.text,
          tokenCount: c.tokenCount,
          embedding: embeddings[i],
        }));

        await Chunk.insertMany(chunkRecords);
      } else {
        doc = {
          _id: sample.id,
          id: sample.id,
          originalName: sample.originalName,
          filename: sample.filename,
          fileSize: sample.fileSize,
          pageCount: sample.pageCount,
          chunkCount: chunks.length,
          summary: sample.summary,
          uploadedAt: new Date(),
        };

        inMemoryStore.documents.set(sample.id, doc);

        chunks.forEach((c, i) => {
          inMemoryStore.chunks.push({
            id: `chunk_${sample.id}_${i}`,
            documentId: sample.id,
            documentName: sample.originalName,
            chunkIndex: c.chunkIndex,
            pageNumber: c.pageNumber,
            text: c.text,
            tokenCount: c.tokenCount,
            embedding: embeddings[i],
          });
        });
      }

      loadedDocs.push(doc);
    }

    return res.json({
      success: true,
      message: `Sample documents initialized (${loadedDocs.length} new added)`,
      documents: loadedDocs,
    });
  } catch (error) {
    console.error('❌ [Load Samples Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
