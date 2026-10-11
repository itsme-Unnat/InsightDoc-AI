import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  User,
  Copy,
  Check,
  Clock,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SourceCitationCard } from './SourceCitationCard';

export const ChatMessage = ({ message }) => {
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [showSources, setShowSources] = useState(true);

  const isUser = message.role === 'user';
  const hasCitations = message.citations && message.citations.length > 0;

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  return (
    <div className={`py-4 px-4 sm:px-6 transition-colors ${isUser ? 'bg-transparent' : 'bg-slate-900/40 border-y border-white/5'}`}>
      <div className="max-w-4xl mx-auto flex items-start space-x-3.5">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-[1px] shadow-glow-cyan/50 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-200">
                {isUser ? 'You' : 'InsightDoc AI'}
              </span>
              {!isUser && message.stats?.modelUsed && (
                <span className="text-[10px] text-cyan-400/90 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                  {message.stats.modelUsed.includes('1.5') ? 'Gemini 1.5 Flash' : message.stats.modelUsed}
                </span>
              )}
            </div>

            {/* Quick Actions (Copy) */}
            {!isUser && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleCopyAnswer}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copy full response"
                >
                  {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAnswer ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Markdown Content */}
          <div className="markdown-body text-sm text-slate-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeContent = String(children).replace(/\n$/, '');
                  return !inline ? (
                    <div className="relative my-3 rounded-xl overflow-hidden border border-white/10 bg-slate-950">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/5 text-[11px] font-mono text-slate-400">
                        <span>{match ? match[1] : 'code'}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(codeContent)}
                          className="hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="p-3 text-xs overflow-x-auto text-slate-200 font-mono">
                        <code {...props}>{children}</code>
                      </pre>
                    </div>
                  ) : (
                    <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Source Citations Section */}
          {!isUser && hasCitations && (
            <div className="pt-2 border-t border-white/5">
              <div
                onClick={() => setShowSources(!showSources)}
                className="flex items-center justify-between py-1 cursor-pointer select-none group"
              >
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 group-hover:text-cyan-300 transition-colors">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Grounding Sources ({message.citations.length})</span>
                </div>
                <button className="text-slate-400 group-hover:text-slate-200">
                  {showSources ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showSources && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
                  {message.citations.map((citation, idx) => (
                    <SourceCitationCard
                      key={`cit_${idx}_${citation.chunkIndex}`}
                      citation={citation}
                      index={idx}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Telemetry Footer */}
          {!isUser && message.stats && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
              {message.stats.latencyMs && (
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{message.stats.latencyMs}ms response</span>
                </span>
              )}
              {message.stats.retrievedChunksCount !== undefined && (
                <span className="flex items-center space-x-1">
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span>{message.stats.retrievedChunksCount} chunks retrieved</span>
                </span>
              )}
              {message.stats.retrievalMethod && (
                <span className="text-[10px] text-slate-500 truncate">
                  • {message.stats.retrievalMethod}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
