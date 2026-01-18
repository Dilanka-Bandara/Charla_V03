import React, { createContext, useState, useContext } from 'react';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const value = {
    currentRoom,
    setCurrentRoom,
    messages,
    setMessages,
    onlineUsers,
    setOnlineUsers
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
