import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const useConversationHistory = (storageKey: string) => {
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  // Load conversation history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(storageKey);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setConversationHistory(parsedHistory);
      } catch (error) {
        console.error('Error parsing conversation history:', error);
      }
    }
  }, [storageKey]);

  // Save conversation history to localStorage whenever it changes
  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(conversationHistory));
    }
  }, [conversationHistory, storageKey]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      role,
      content,
      timestamp: Date.now()
    };

    setConversationHistory(prev => {
      const updated = [...prev, newMessage];
      // Keep only the last 10 messages (5 pairs of user-assistant)
      return updated.slice(-10);
    });
  };

  const getLastMessages = (count: number = 10): Message[] => {
    return conversationHistory.slice(-count);
  };

  const clearHistory = () => {
    setConversationHistory([]);
    localStorage.removeItem(storageKey);
  };

  return {
    conversationHistory,
    addMessage,
    getLastMessages,
    clearHistory
  };
};
