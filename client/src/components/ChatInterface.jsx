import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Layers,
  Trash2,
  Loader2,
  FileText,
  CornerDownLeft,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage } from './ChatMessage';

export const ChatInterface = ({
  messages = [],
  onSendMessage,
  onClearChat,
  isLoading = false,
  selectedDoc = null,
  totalDocs = 0,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const samplePrompts = [
    {
      title: 'NIST Standards',
      query: 'What post-quantum cryptography algorithms were standardized by NIST?',
    },
    {
      title: 'RAG Architecture',
      query: 'How does sliding-window chunking prevent information loss at paragraph boundaries?',
    },
    {
      title: 'Key & Ciphertext Sizes',
      query: 'Compare key and ciphertext sizes between classical RSA-2048 and ML-KEM-768.',
    },
    {
      title: 'Harvest Now Attacks',
      query: 'What is the "Harvest Now, Decrypt Later" threat and how is it mitigated?',
    },
  ];

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (query) => {
    setInput(query);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0B0F19] relative overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-14 px-6 border-b border-white/10 glass-panel flex items-center justify-between z-10">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/5 text-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Grounding Scope:</span>
            <span className="font-semibold text-slate-200">
              {selectedDoc ? selectedDoc.originalName : `All Uploaded Documents (${totalDocs})`}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-[10px] text-emerald-400 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Anti-Hallucination Active</span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
            title="Clear current conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-glow-cyan">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent mb-2">
              InsightDoc AI Knowledge Assistant
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-8">
              Ask deep questions across your ingested PDFs. All responses are strictly grounded in vector search excerpts with traceable source citations.
            </p>

            {/* Suggested Question Chips */}
            <div className="w-full text-left">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Suggested Research Questions</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {samplePrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(item.query)}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 text-left transition-all group cursor-pointer"
                  >
                    <span className="text-[10px] font-mono text-cyan-400 block mb-1 group-hover:text-cyan-300">
                      #{item.title}
                    </span>
                    <p className="text-xs text-slate-300 group-hover:text-slate-100 line-clamp-2">
                      {item.query}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message Stream */
          <div className="divide-y divide-white/5">
            {messages.map((msg, idx) => (
              <ChatMessage key={`msg_${idx}`} message={msg} />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-5 px-6 bg-slate-900/40 border-t border-white/5">
                <div className="max-w-4xl mx-auto flex items-center space-x-3 text-cyan-400">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-medium text-slate-300">
                      Querying vector search and generating grounded response...
                    </span>
                    <span className="inline-flex space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 border-t border-white/10 glass-panel z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl glass-input p-2 flex items-end space-x-2 border border-white/10 focus-within:border-cyan-500/50 focus-within:shadow-glow-cyan">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedDoc
                  ? `Ask a question about ${selectedDoc.originalName}...`
                  : 'Ask anything across your ingested document library...'
              }
              className="w-full bg-transparent resize-none py-1.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none max-h-32"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-40 disabled:hover:from-cyan-500 disabled:hover:to-blue-600 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer flex-shrink-0"
              title="Send query"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">Shift+Enter</kbd> for newline</span>
            <span className="hidden sm:inline">RAG Pipeline • Google Gemini AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
