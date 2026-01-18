import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMoreVertical, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { deleteMessage, addReaction } from '../../services/api';
import Avatar from '../Common/Avatar';
import toast from 'react-hot-toast';
import './MessageItem.css';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

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

  const getReactionCount = () => {
    const counts = {};
    message.reactions?.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    return counts;
  };

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
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
          </div>
        )}

        <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
          <p>{message.content}</p>
          
          {isOwnMessage && (
            <span className="message-time-own">
              {new Date(message.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>

        {/* Reactions */}
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

        {/* Action Buttons */}
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
              <>
                <button className="action-btn" onClick={handleDelete}>
                  <FiTrash2 size={14} />
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* Reaction Picker */}
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
