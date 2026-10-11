import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev / flexible client binding
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Health root
app.get('/', (req, res) => {
  res.json({
    name: 'InsightDoc AI - RAG Knowledge Hub Backend',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      upload: 'POST /api/upload',
      documents: 'GET /api/documents',
      chat: 'POST /api/chat',
      stats: 'GET /api/stats',
    },
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 [Server Exception]:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected server error occurred.',
  });
});

// Connect to Database & Launch HTTP Server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log(`🚀 [InsightDoc AI Server] Running on http://localhost:${PORT}`);
    console.log(`⚡ API Endpoints active at http://localhost:${PORT}/api`);
    console.log('======================================================\n');
  });
};

startServer().catch(err => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
