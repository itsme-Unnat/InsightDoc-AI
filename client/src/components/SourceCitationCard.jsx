import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';

export const SourceCitationCard = ({ citation, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    sourceNumber = index + 1,
    documentName = 'Document',
    pageNumber = 1,
    chunkIndex = 0,
    similarityScore = 0.85,
    snippet = '',
  } = citation;

  const scorePercentage = Math.round(similarityScore * 100);

  const getScoreColor = (score) => {
    if (score >= 0.7) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
    if (score >= 0.4) return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
    return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
  };

  const getScoreBarColor = (score) => {
    if (score >= 0.7) return 'from-emerald-500 to-teal-400';
    if (score >= 0.4) return 'from-cyan-500 to-blue-500';
    return 'from-amber-500 to-orange-400';
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 overflow-hidden transition-all hover:border-cyan-500/30">
      {/* Top Header Card */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-semibold flex-shrink-0">
            Source {sourceNumber}
          </span>
          <div className="flex items-center space-x-1.5 min-w-0">
            <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-200 truncate max-w-[220px]" title={documentName}>
              {documentName}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Page Badge */}
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono border border-white/5">
            P.{pageNumber}
          </span>

          {/* Similarity Score Pill */}
          <div
            title={`Cosine Similarity: ${similarityScore.toFixed(4)}`}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono border ${getScoreColor(similarityScore)}`}
          >
            <span>{scorePercentage}% match</span>
          </div>

          <button className="text-slate-400 hover:text-slate-200 p-0.5 transition-colors">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Similarity Progress Bar */}
      <div className="w-full h-1 bg-slate-800/60">
        <div
          className={`h-full bg-gradient-to-r ${getScoreBarColor(similarityScore)} transition-all duration-500`}
          style={{ width: `${Math.min(Math.max(scorePercentage, 5), 100)}%` }}
        />
      </div>

      {/* Expandable Excerpt Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5 bg-slate-950/60 p-3"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span className="font-mono text-[10px] text-cyan-400/80">
                Chunk #{chunkIndex} Excerpt
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Excerpt'}</span>
              </button>
            </div>

            <blockquote className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/80 border-l-2 border-cyan-400 p-2.5 rounded-r-lg font-sans">
              "{snippet}"
            </blockquote>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
