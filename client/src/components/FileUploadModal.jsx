import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { uploadPDF } from '../services/api';

export const FileUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusStage, setStatusStage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadStats, setUploadStats] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    setErrorMsg('');
    setUploadStats(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Invalid file type. Please upload a PDF document (.pdf).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File exceeds 25 MB limit. Please select a smaller PDF.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isProcessing) return;

    setIsProcessing(true);
    setErrorMsg('');
    setUploadProgress(15);
    setStatusStage('Uploading PDF document...');

    try {
      // Simulate staged progress updates during ingestion pipeline
      const stageTimer1 = setTimeout(() => {
        setUploadProgress(45);
        setStatusStage('Extracting text & parsing page boundaries...');
      }, 700);

      const stageTimer2 = setTimeout(() => {
        setUploadProgress(70);
        setStatusStage('Generating semantic chunks (400t / 50t overlap)...');
      }, 1500);

      const stageTimer3 = setTimeout(() => {
        setUploadProgress(88);
        setStatusStage('Calculating 768-dim Gemini vector embeddings...');
      }, 2300);

      const res = await uploadPDF(selectedFile, (progress) => {
        // HTTP upload progress
        if (progress < 40) setUploadProgress(progress);
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      setUploadProgress(100);
      setStatusStage('Vector indexing complete!');
      setUploadStats(res.stats);

      if (onUploadSuccess) {
        onUploadSuccess(res.document);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to process and index PDF');
      setUploadProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setStatusStage('');
    setErrorMsg('');
    setUploadStats(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg glass-panel rounded-2xl border border-white/10 shadow-2xl p-6 overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Ingest PDF Document</h2>
            <p className="text-xs text-slate-400">
              Automatic chunking, vector embedding & vector search indexing
            </p>
          </div>
        </div>

        {/* Drop Zone */}
        {!selectedFile && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                : 'border-white/15 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-900/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7 text-cyan-400" />
            </div>
            <p className="text-sm font-semibold text-slate-200 mb-1">
              Drag & drop your PDF file here
            </p>
            <p className="text-xs text-slate-400 mb-3">
              or <span className="text-cyan-400 underline underline-offset-2">browse your computer</span>
            </p>
            <div className="flex items-center space-x-3 text-[11px] text-slate-500">
              <span>PDF only</span>
              <span>•</span>
              <span>Up to 25 MB</span>
              <span>•</span>
              <span>Vectorized to 768-dim</span>
            </div>
          </div>
        )}

        {/* Selected File Card */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {!isProcessing && !uploadStats && (
                <button
                  onClick={handleReset}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Progress & Status Feedback */}
            {isProcessing && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center space-x-2 text-cyan-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>{statusStage}</span>
                  </span>
                  <span className="font-mono text-cyan-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"
                    style={{ width: `${uploadProgress}%` }}
                    transition={{ ease: 'easeInOut' }}
                  />
                </div>
              </div>
            )}

            {/* Completed Ingestion Stats */}
            {uploadStats && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 space-y-2"
              >
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Document Successfully Ingested & Vectorized!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                  <div className="p-2 rounded bg-slate-900/60 flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Chunks: <strong>{uploadStats.totalChunks}</strong></span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pages: <strong>{uploadStats.totalPages}</strong></span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              {uploadStats ? (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Start Asking Questions
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Document...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Vectorize Document</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="flex-1">{errorMsg}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
