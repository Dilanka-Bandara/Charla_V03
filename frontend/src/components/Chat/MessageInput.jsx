import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiSmile, FiPaperclip } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { createMessage } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import toast from 'react-hot-toast';
import './MessageInput.css';

const MessageInput = ({ roomId }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { sendTyping } = useWebSocket();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (value && !isTyping) {
      setIsTyping(true);
      sendTyping(roomId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(roomId, false);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    try {
      await createMessage({
        content: message.trim(),
        room_id: roomId,
        message_type: 'text'
      });

      setIsTyping(false);
      sendTyping(roomId, false);
      
      setMessage('');
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Failed to send message:', error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      {showEmojiPicker && (
        <div className="emoji-picker-wrapper">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            width="100%"
            height="350px"
          />
        </div>
      )}

      <form className="message-input glass-card" onSubmit={handleSubmit}>
        <button
          type="button"
          className="input-action-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <FiSmile size={22} />
        </button>

        <textarea
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows="1"
          className="message-textarea"
        />

        <button
          type="button"
          className="input-action-btn"
          title="Attach file (Coming soon)"
        >
          <FiPaperclip size={22} />
        </button>

        <motion.button
          type="submit"
          className="send-btn"
          disabled={!message.trim()}
          whileHover={{ scale: message.trim() ? 1.05 : 1 }}
          whileTap={{ scale: message.trim() ? 0.95 : 1 }}
        >
          <FiSend size={20} />
        </motion.button>
      </form>
    </div>
  );
};

export default MessageInput;
