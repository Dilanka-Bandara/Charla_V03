import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiMail, FiCalendar } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../Common/Avatar';
import './UserProfile.css';

const UserProfile = ({ user, onClose }) => {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="user-profile-modal glass-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          <FiX size={24} />
        </button>

        <div className="profile-header">
          <Avatar user={user} size="xl" />
          <h2>{user.username}</h2>
          {user.full_name && <p className="full-name">{user.full_name}</p>}
          <span className={`status-badge ${user.is_online ? 'online' : 'offline'}`}>
            {user.is_online ? '🟢 Online' : '⚫ Offline'}
          </span>
        </div>

        <div className="profile-info">
          {user.bio && (
            <div className="info-section">
              <h3>Bio</h3>
              <p>{user.bio}</p>
            </div>
          )}

          <div className="info-section">
            <h3>Contact Information</h3>
            <div className="info-item">
              <FiMail size={18} />
              <span>{user.email}</span>
            </div>
          </div>

          <div className="info-section">
            <h3>Member Since</h3>
            <div className="info-item">
              <FiCalendar size={18} />
              <span>
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {!user.is_online && user.last_seen && (
            <div className="info-section">
              <h3>Last Seen</h3>
              <p>{formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserProfile;
