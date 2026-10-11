import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Server,
  FileCode,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

export const StatsModal = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl glass-panel rounded-2xl border border-white/10 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">System Architecture & Telemetry</h2>
            <p className="text-xs text-slate-400">
              RAG Engine, Vector Indexing & AI Model Configuration
            </p>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold">
              <Database className="w-4 h-4" />
              <span>Storage Engine</span>
            </div>
            <p className="text-xs text-slate-200 font-medium">
              {stats?.storageEngine || 'Dual-Mode Engine'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold">
              <Layers className="w-4 h-4" />
              <span>Vector Dimensions</span>
            </div>
            <p className="text-xs text-slate-200 font-mono font-medium">
              768-dim (Dense)
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Embeddings Model</span>
            </div>
            <p className="text-xs text-slate-200 font-mono">
              {stats?.embeddingModel || 'text-embedding-004'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold">
              <Cpu className="w-4 h-4" />
              <span>Generative LLM</span>
            </div>
            <p className="text-xs text-slate-200 font-mono">
              {stats?.chatModel || 'gemini-1.5-flash'}
            </p>
          </div>
        </div>

        {/* Technical Architecture Specs */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Pipeline Specifications
          </h3>
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-slate-400">Chunking Strategy:</span>
              <span className="font-mono text-cyan-300">Sliding Window (400 tokens / 50 overlap)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-slate-400">Distance Metric:</span>
              <span className="font-mono text-cyan-300">Cosine Similarity ($vectorSearch)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-slate-400">Top-K Retrieval:</span>
              <span className="font-mono text-cyan-300">K = 4 Chunks</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Anti-Hallucination:</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Strict Context Grounding</span>
              </span>
            </div>
          </div>
        </div>

        {/* MongoDB Atlas Search Index Guide */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>MongoDB Atlas Vector Search JSON Definition</span>
          </div>
          <p className="text-[11px] text-slate-400">
            To enable native cloud vector search, create a Vector Index named <code className="text-cyan-300 font-mono">vector_index</code> on collection <code className="text-cyan-300 font-mono">chunks</code>:
          </p>
          <pre className="p-2.5 rounded-lg bg-slate-900 border border-white/5 text-[10px] text-slate-300 font-mono overflow-x-auto">
{`{
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
}`}
          </pre>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
