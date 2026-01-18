import { useState, useEffect } from 'react';
import { getRoomMessages } from '../services/api';

export const useChat = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (roomId) {
      loadMessages();
    }
  }, [roomId]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoomMessages(roomId);
      setMessages(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const updateMessage = (messageId, updates) => {
    setMessages(prev =>
      prev.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg)
    );
  };

  const removeMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  return {
    messages,
    loading,
    error,
    addMessage,
    updateMessage,
    removeMessage,
    reload: loadMessages
  };
};
