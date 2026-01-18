import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import MessageItem from './MessageItem';
import './MessageList.css';

const MessageList = ({ messages }) => {
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="empty-messages">
        <p>No messages yet. Start the conversation! 👋</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      <AnimatePresence>
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="message-group">
            <div className="date-separator">
              <span>{getDateLabel(date)}</span>
            </div>
            
            {msgs.map((message, index) => (
              <MessageItem 
                key={message.id} 
                message={message}
                index={index}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;
