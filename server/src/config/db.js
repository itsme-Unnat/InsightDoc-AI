import mongoose from 'mongoose';

let mongoConnected = false;

// In-Memory store fallback for standalone/demo execution without Atlas credentials
export const inMemoryStore = {
  documents: new Map(),
  chunks: []
};

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.trim() === '' || uri.includes('your_mongo') || !uri.startsWith('mongodb')) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  [MongoDB] MONGO_URI is unset or using placeholder. Initializing High-Performance In-Memory Vector Store.');
    console.log('\x1b[36m%s\x1b[0m', 'ℹ️  [MongoDB] Full Vector Search, Chunking & RAG capabilities remain 100% active with Cosine Similarity!');
    mongoConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    mongoConnected = true;
    console.log('\x1b[32m%s\x1b[0m', `✅ [MongoDB Atlas] Connected to cluster: ${conn.connection.host} (${conn.connection.name})`);
    return true;
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `❌ [MongoDB] Connection error: ${err.message}`);
    console.log('\x1b[33m%s\x1b[0m', '⚠️  [MongoDB] Seamlessly falling back to In-Memory Vector Store mode.');
    mongoConnected = false;
    return false;
  }
};

export const isMongoConnected = () => mongoConnected;
