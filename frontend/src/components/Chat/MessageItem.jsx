import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2, FiDownload } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { deleteMessage, addReaction } from '../../services/api';
import Avatar from '../Common/Avatar';
import toast from 'react-hot-toast';
import './MessageItem.css';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const MessageItem = ({ message, index }) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.user_id === user.id;

  const handleDelete = async () => {
    try {
      await deleteMessage(message.id);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleReaction = async (emoji) => {
    try {
      await addReaction(message.id, emoji);
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `${API_URL}${message.file_url}`;
    link.download = message.file_name || 'download';
    link.click();
  };

  const getReactionCount = () => {
    const counts = {};
    message.reactions?.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    return counts;
  };

  const isImage = (filename) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  // Helper for Timezone fix: Append 'Z' to force UTC interpretation if missing
  const getMessageDate = (timestamp) => {
    if (!timestamp) return new Date();
    // If it doesn't end with Z and doesn't have offset, assume UTC
    if (!timestamp.endsWith('Z') && !timestamp.includes('+')) {
        return new Date(timestamp + 'Z');
    }
    return new Date(timestamp);
  };
  
  const messageDate = getMessageDate(message.timestamp);
  const reactionCounts = getReactionCount();

  return (
    <motion.div
      className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {!isOwnMessage && (
        <Avatar user={message} size="sm" showOnline={false} />
      )}

      <div className="message-content-wrapper">
        {!isOwnMessage && (
          <div className="message-header">
            <span className="message-username" style={{ color: message.avatar_color }}>
              {message.username}
            </span>
            <span className="message-time">
              {formatDistanceToNow(messageDate, { addSuffix: true })}
            </span>
          </div>
        )}

        <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
          {message.message_type === 'file' ? (
            <div className="message-file">
              {message.file_url && isImage(message.file_name) ? (
                <img 
                  src={`${API_URL}${message.file_url}`} 
                  alt={message.file_name}
                  className="message-image"
                  onClick={() => window.open(`${API_URL}${message.file_url}`, '_blank')}
                />
              ) : (
                <div className="file-attachment">
                  <span className="file-icon">📎</span>
                  <span className="file-name">{message.file_name}</span>
                </div>
              )}
              {message.content && message.content !== `📎 ${message.file_name}` && (
                <p className="file-caption">{message.content}</p>
              )}
              <button className="download-btn" onClick={handleDownload}>
                <FiDownload size={16} />
                Download
              </button>
            </div>
          ) : (
            <p>{message.content}</p>
          )}
          
          {isOwnMessage && (
            <span className="message-time-own">
              {messageDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>

        {Object.keys(reactionCounts).length > 0 && (
          <div className="message-reactions">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <motion.button
                key={emoji}
                className="reaction-bubble"
                onClick={() => handleReaction(emoji)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {emoji} {count > 1 && count}
              </motion.button>
            ))}
          </div>
        )}

        {showActions && (
          <motion.div
            className="message-actions"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <button
              className="action-btn"
              onClick={() => setShowReactions(!showReactions)}
            >
              😊
            </button>
            {isOwnMessage && (
              <button className="action-btn" onClick={handleDelete}>
                <FiTrash2 size={14} />
              </button>
            )}
          </motion.div>
        )}

        {showReactions && (
          <motion.div
            className="reaction-picker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {QUICK_REACTIONS.map(emoji => (
              <button
                key={emoji}
                className="reaction-option"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageItem;