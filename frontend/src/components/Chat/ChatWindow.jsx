import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiUsers, FiMoreVertical } from 'react-icons/fi';
import { getRoomMessages, joinRoom } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import './ChatWindow.css';

const ChatWindow = ({ room, onToggleSidebar }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const { subscribeToEvent, joinRoom: wsJoinRoom } = useWebSocket();

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRoomMessages(room.id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [room?.id]);

  useEffect(() => {
    if (room) {
      loadMessages();
      wsJoinRoom(room.id);
      joinRoom(room.id);
    }
  }, [room, loadMessages, wsJoinRoom]);

  const handleNewMessage = useCallback((data) => {
    if (data.message && data.room_id === room?.id) {
      setMessages(prev => [...prev, data.message]);
    }
  }, [room?.id]);

  const handleTyping = useCallback((data) => {
    if (data.room_id === room?.id) {
      setTypingUsers(data.users || []);
    }
  }, [room?.id]);

  const handleReaction = useCallback((data) => {
    if (data.message_id) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.message_id
            ? { ...msg, reactions: msg.reactions || [] }
            : msg
        )
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribeMessage = subscribeToEvent('new_message', handleNewMessage);
    const unsubscribeTyping = subscribeToEvent('typing', handleTyping);
    const unsubscribeReaction = subscribeToEvent('message_reaction', handleReaction);

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeReaction();
    };
  }, [subscribeToEvent, handleNewMessage, handleTyping, handleReaction]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!room) {
    return (
      <div className="chat-empty">
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="empty-icon">💬</div>
          <h2>Welcome to ChatFlow</h2>
          <p>Select a room to start chatting</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <motion.div
        className="chat-header glass-card"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button className="mobile-menu-btn" onClick={onToggleSidebar}>
          <FiMenu size={24} />
        </button>
        
        <div className="chat-room-info">
          <div className="room-icon-large">{room.icon}</div>
          <div>
            <h2>{room.name}</h2>
            <p className="room-meta">
              <FiUsers size={14} />
              {room.member_count} members
            </p>
          </div>
        </div>

        <button className="icon-btn">
          <FiMoreVertical size={20} />
        </button>
      </motion.div>

      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}

      <MessageInput roomId={room.id} />
    </div>
  );
};

export default ChatWindow;
