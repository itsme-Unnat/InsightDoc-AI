import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  loadSampleDocuments,
} from '../controllers/docController.js';
import {
  handleChatQuery,
  getSystemStats,
} from '../controllers/chatController.js';

const router = express.Router();

// Configure Multer for memory buffer storage with 25MB maximum limit
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents (.pdf) are permitted for ingestion.'));
    }
  },
});

// Document Ingestion & Management Routes
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/documents', getDocuments);
router.delete('/documents/:id', deleteDocument);
router.post('/documents/samples', loadSampleDocuments);

// RAG Query & Chat Routes
router.post('/chat', handleChatQuery);

// Diagnostics & System Metrics
router.get('/stats', getSystemStats);
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'InsightDoc AI RAG Server',
  });
});

export default router;
