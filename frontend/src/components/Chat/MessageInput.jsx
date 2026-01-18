import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiSmile, FiPaperclip, FiX } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { createMessage, uploadFile } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import toast from 'react-hot-toast';
import './MessageInput.css';

const MessageInput = ({ roomId }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedFile) return;

    try {
      if (selectedFile) {
        // Upload file
        setUploading(true);
        await uploadFile(selectedFile, roomId);
        toast.success('File sent successfully!');
        setSelectedFile(null);
      } else {
        // Send text message
        await createMessage({
          content: message.trim(),
          room_id: roomId,
          message_type: 'text'
        });
      }

      setIsTyping(false);
      sendTyping(roomId, false);
      
      setMessage('');
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Failed to send message:', error);
    } finally {
      setUploading(false);
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

      {selectedFile && (
        <div className="selected-file-preview">
          <div className="file-info">
            <span className="file-icon">📎</span>
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            type="button"
            className="remove-file-btn"
            onClick={() => setSelectedFile(null)}
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      <form className="message-input glass-card" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

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
          placeholder={selectedFile ? "Add a caption (optional)" : "Type a message..."}
          rows="1"
          className="message-textarea"
          disabled={uploading}
        />

        <button
          type="button"
          className="input-action-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <FiPaperclip size={22} />
        </button>

        <motion.button
          type="submit"
          className="send-btn"
          disabled={(!message.trim() && !selectedFile) || uploading}
          whileHover={{ scale: (message.trim() || selectedFile) && !uploading ? 1.05 : 1 }}
          whileTap={{ scale: (message.trim() || selectedFile) && !uploading ? 0.95 : 1 }}
        >
          {uploading ? (
            <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
          ) : (
            <FiSend size={20} />
          )}
        </motion.button>
      </form>
    </div>
  );
};

export default MessageInput;
