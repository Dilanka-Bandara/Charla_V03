import React from 'react';
import { motion } from 'framer-motion';
import './TypingIndicator.css';

const TypingIndicator = ({ users }) => {
  const displayText = users.length === 1
    ? `${users[0]} is typing`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing`
    : `${users.length} people are typing`;

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
