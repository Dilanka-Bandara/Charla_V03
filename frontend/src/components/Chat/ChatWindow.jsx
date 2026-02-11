import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiUsers, FiMoreVertical } from 'react-icons/fi';
import { getRoomMessages, joinRoom as joinRoomApi } from '../../services/api'; // Renamed to avoid confusion
import { useWebSocket } from '../../hooks/useWebSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import './ChatWindow.css';

const ChatWindow = ({ room, onToggleSidebar }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false); // Changed default to false
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  
  // Destructure isConnected to trigger re-joins
  const { subscribeToEvent, joinRoom: wsJoinRoom, isConnected } = useWebSocket();

  const loadMessages = useCallback(async () => {
    if (!room?.id) return;
    
    setLoading(true);
    try {
      const response = await getRoomMessages(room.id);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [room?.id]);

  // 1. Handle Room Changes & Initial Load
  useEffect(() => {
    if (room?.id) {
      loadMessages();
      // Call API to ensure user is member in DB
      joinRoomApi(room.id).catch(console.error);
    }
  }, [room?.id, loadMessages]);

  // 2. Handle WebSocket Room Joining (Runs on room change AND reconnection)
  useEffect(() => {
    if (room?.id && isConnected) {
      console.log(`Joining WS room: ${room.id}`);
      wsJoinRoom(room.id);
    }
  }, [room?.id, isConnected, wsJoinRoom]);

  // 3. Handle Incoming WebSocket Events
  const handleNewMessage = useCallback((data) => {
    // Strict check: Only add if message belongs to THIS room
    if (data.message && data.room_id === room?.id) {
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === data.message.id);
        if (exists) return prev;
        return [...prev, data.message];
      });
      // Scroll to bottom on new message
      setTimeout(scrollToBottom, 100); 
    }
  }, [room?.id]);

  const handleTyping = useCallback((data) => {
    if (data.room_id === room?.id) {
      setTypingUsers(data.users || []);
    }
  }, [room?.id]);

  const handleReaction = useCallback((data) => {
    if (data.message_id && data.room_id === room?.id) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.message_id
            ? { ...msg, reactions: data.reaction ? [...(msg.reactions || []), data.reaction] : msg.reactions }
            : msg
        )
      );
    }
  }, [room?.id]);

  const handleMessageDeleted = useCallback((data) => {
    if (data.message_id && data.room_id === room?.id) {
      setMessages(prev => prev.filter(msg => msg.id !== data.message_id));
    }
  }, [room?.id]);

  useEffect(() => {
    const unsubscribeMessage = subscribeToEvent('new_message', handleNewMessage);
    const unsubscribeTyping = subscribeToEvent('typing', handleTyping);
    const unsubscribeReaction = subscribeToEvent('message_reaction', handleReaction);
    const unsubscribeDeleted = subscribeToEvent('message_deleted', handleMessageDeleted);

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeReaction();
      unsubscribeDeleted();
    };
  }, [subscribeToEvent, handleNewMessage, handleTyping, handleReaction, handleMessageDeleted]);

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
              {room.room_type === 'private' && ' • Private'}
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