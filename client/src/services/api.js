import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s for LLM generation or chunking
});

export const getDocuments = async () => {
  const response = await client.get('/documents');
  return response.data;
};

export const uploadPDF = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await client.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await client.delete(`/documents/${id}`);
  return response.data;
};

export const loadSampleDocuments = async () => {
  const response = await client.post('/documents/samples');
  return response.data;
};

export const sendChatMessage = async ({ message, documentId = null, conversationHistory = [] }) => {
  const response = await client.post('/chat', {
    message,
    documentId,
    conversationHistory,
  });
  return response.data;
};

export const getSystemStats = async () => {
  const response = await client.get('/stats');
  return response.data;
};
