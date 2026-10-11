import mongoose from 'mongoose';

const ChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true,
  },
  documentName: {
    type: String,
    required: true,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
  pageNumber: {
    type: Number,
    default: 1,
  },
  text: {
    type: String,
    required: true,
  },
  tokenCount: {
    type: Number,
    default: 0,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for querying chunks by document
ChunkSchema.index({ documentId: 1, chunkIndex: 1 });

export default mongoose.models.Chunk || mongoose.model('Chunk', ChunkSchema);
