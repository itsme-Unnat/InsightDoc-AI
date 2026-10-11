import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    default: 'application/pdf',
  },
  pageCount: {
    type: Number,
    default: 1,
  },
  chunkCount: {
    type: Number,
    default: 0,
  },
  summary: {
    type: String,
    default: '',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);
