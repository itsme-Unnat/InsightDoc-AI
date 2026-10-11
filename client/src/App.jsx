import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { FileUploadModal } from './components/FileUploadModal';
import { StatsModal } from './components/StatsModal';
import {
  getDocuments,
  deleteDocument,
  loadSampleDocuments,
  sendChatMessage,
  getSystemStats,
} from './services/api';
import { Menu, X, Cpu, UploadCloud } from 'lucide-react';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [systemStats, setSystemStats] = useState(null);
  const [isAtlasConnected, setIsAtlasConnected] = useState(false);
  const [totalChunks, setTotalChunks] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initial load
  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const data = await getDocuments();
      setDocuments(data.documents || []);
      setIsAtlasConnected(Boolean(data.isAtlasConnected));
      setTotalChunks(data.totalChunks || 0);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getSystemStats();
      setSystemStats(data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSelectDoc = (id) => {
    setSelectedDocId(id);
    setMobileSidebarOpen(false);
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Delete this document and all of its vector embeddings?')) return;
    try {
      await deleteDocument(id);
      if (selectedDocId === id) setSelectedDocId(null);
      await fetchDocuments();
      await fetchStats();
    } catch (err) {
      alert('Error deleting document: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLoadSamples = async () => {
    try {
      setIsLoadingDocs(true);
      await loadSampleDocuments();
      await fetchDocuments();
      await fetchStats();
    } catch (err) {
      alert('Error loading sample documents: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUploadSuccess = async () => {
    await fetchDocuments();
    await fetchStats();
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoadingChat(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage({
        message: text,
        documentId: selectedDocId,
        conversationHistory: history,
      });

      const assistantMessage = {
        role: 'assistant',
        content: res.answer,
        citations: res.citations || [],
        stats: res.stats || {},
        timestamp: new Date(),
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ **Error Processing Query**: ${
          err.response?.data?.error || err.message || 'Failed to communicate with RAG server.'
        }`,
        citations: [],
        stats: null,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const selectedDoc = documents.find((d) => (d._id || d.id) === selectedDocId) || null;

  return (
    <div className="flex h-screen w-screen bg-[#0B0F19] overflow-hidden text-slate-100">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          documents={documents}
          selectedDocId={selectedDocId}
          onSelectDoc={handleSelectDoc}
          onDeleteDoc={handleDeleteDoc}
          onOpenUpload={() => setIsUploadOpen(true)}
          onLoadSamples={handleLoadSamples}
          isAtlasConnected={isAtlasConnected}
          totalChunks={totalChunks}
          isLoading={isLoadingDocs}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Mobile Header Bar */}
        <div className="h-12 px-4 border-b border-white/10 glass-panel flex lg:hidden items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-xs tracking-wider bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            InsightDoc AI
          </span>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-950/40"
          >
            <UploadCloud className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Interface */}
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          isLoading={isLoadingChat}
          selectedDoc={selectedDoc}
          totalDocs={documents.length}
        />
      </div>

      {/* Floating System Diagnostics Trigger */}
      <button
        onClick={() => setIsStatsOpen(true)}
        title="View Architecture & Vector Search Telemetry"
        className="fixed bottom-4 right-4 z-30 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
      >
        <Cpu className="w-4 h-4" />
      </button>

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={systemStats}
      />
    </div>
  );
}
