import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext'; // Added Import
import './TypingIndicator.css';

const TypingIndicator = ({ users }) => {
  const { user } = useAuth(); // Get current user

  // Filter out the current user's username
  const filteredUsers = users.filter(u => u !== user?.username);

  // If nobody else is typing, don't render anything
  if (filteredUsers.length === 0) {
    return null;
  }

  const displayText = filteredUsers.length === 1
    ? `${filteredUsers[0]} is typing`
    : filteredUsers.length === 2
    ? `${filteredUsers[0]} and ${filteredUsers[1]} are typing`
    : `${filteredUsers.length} people are typing`;

  return (
    <motion.div
      className="typing-indicator"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="typing-dots">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
      <span className="typing-text">{displayText}</span>
    </motion.div>
  );
};

export default TypingIndicator;