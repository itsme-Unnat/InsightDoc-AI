import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Trash2,
  Database,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  FolderOpen,
  PlusCircle,
  HardDrive,
  Cpu,
} from 'lucide-react';

export const Sidebar = ({
  documents = [],
  selectedDocId = null,
  onSelectDoc,
  onDeleteDoc,
  onOpenUpload,
  onLoadSamples,
  isAtlasConnected = false,
  totalChunks = 0,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = documents.filter((doc) =>
    (doc.originalName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <aside className="w-80 h-full flex flex-col glass-panel border-r border-white/10 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1px] shadow-glow-cyan flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
              InsightDoc <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400">RAG Knowledge Hub</p>
          </div>
        </div>

        {/* Database Mode Badge */}
        <div
          title={isAtlasConnected ? 'Connected to MongoDB Atlas Vector Search' : 'In-Memory Cosine Vector Store Active'}
          className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-[10px] font-medium border ${
            isAtlasConnected
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isAtlasConnected ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
          <span>{isAtlasConnected ? 'Atlas' : 'VectorStore'}</span>
        </div>
      </div>

      {/* Upload & Sample CTA Buttons */}
      <div className="p-4 space-y-2 border-b border-white/5">
        <button
          onClick={onOpenUpload}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload PDF Document</span>
        </button>

        {documents.length === 0 && (
          <button
            onClick={onLoadSamples}
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/20 font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Research Docs</span>
          </button>
        )}
      </div>

      {/* Document Scope Selector */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Context Scope
          </span>
          <span className="text-[11px] text-slate-500">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Global Scope Button */}
        <button
          onClick={() => onSelectDoc(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer ${
            selectedDocId === null
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>All Documents (Full Hub)</span>
          </div>
          {selectedDocId === null && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
        </button>

        {/* Search documents */}
        {documents.length > 2 && (
          <div className="relative mt-2.5">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg glass-input text-slate-200 placeholder-slate-500"
            />
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1.5">
        {filteredDocs.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4">
            <FolderOpen className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">No documents found</p>
            <p className="text-[10px] text-slate-500 mt-1">Upload a PDF or load samples to start querying</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredDocs.map((doc) => {
              const isSelected = selectedDocId === (doc._id || doc.id);
              return (
                <motion.div
                  key={doc._id || doc.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative rounded-xl p-2.5 transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/40 shadow-glow-cyan/20'
                      : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/50 hover:border-white/10'
                  }`}
                  onClick={() => onSelectDoc(isSelected ? null : (doc._id || doc.id))}
                >
                  <div className="flex items-start justify-between space-x-2">
                    <div className="flex items-start space-x-2.5 overflow-hidden">
                      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400 group-hover:text-cyan-400'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium truncate ${
                          isSelected ? 'text-cyan-200 font-semibold' : 'text-slate-200'
                        }`}>
                          {doc.originalName}
                        </p>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400">
                          <span>{doc.pageCount || 1} pg</span>
                          <span>•</span>
                          <span className="text-cyan-400/80">{doc.chunkCount || 0} chunks</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDoc(doc._id || doc.id);
                      }}
                      title="Delete document and vector chunks"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer System Telemetry */}
      <div className="p-3 border-t border-white/10 bg-slate-950/40">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
          <div className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-slate-900/60 border border-white/5">
            <Database className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <div className="truncate">
              <span className="block text-slate-500">Vector Chunks</span>
              <span className="font-semibold text-slate-200 font-mono">{totalChunks}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-slate-900/60 border border-white/5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <div className="truncate">
              <span className="block text-slate-500">Embedding</span>
              <span className="font-semibold text-slate-200 font-mono">768-dim</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
