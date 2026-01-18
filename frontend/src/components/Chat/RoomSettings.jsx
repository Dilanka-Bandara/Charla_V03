import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUserPlus } from 'react-icons/fi';
import { getAllUsers, inviteToRoom } from '../../services/api';
import toast from 'react-hot-toast';
import Avatar from '../Common/Avatar';
import './RoomSettings.css';

const RoomSettings = ({ room, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      // Filter out users already in the room
      const availableUsers = response.data.filter(
        user => !room.members?.includes(user.id)
      );
      setUsers(availableUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId) => {
    try {
      await inviteToRoom(room.id, userId);
      toast.success('Invitation sent!');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send invite');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="room-settings-modal glass-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Invite Users to {room.name}</h2>
            <button className="icon-btn" onClick={onClose}>
              <FiX size={24} />
            </button>
          </div>

          <div className="users-to-invite">
            {loading ? (
              <div className="loading-state">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">No users to invite</div>
            ) : (
              users.map(user => (
                <motion.div
                  key={user.id}
                  className="user-invite-item"
                  whileHover={{ x: 4 }}
                >
                  <Avatar user={user} size="md" />
                  <div className="user-info">
                    <h4>{user.username}</h4>
                    <p>{user.email}</p>
                  </div>
                  <button
                    className="invite-user-btn"
                    onClick={() => handleInvite(user.id)}
                  >
                    <FiUserPlus size={18} />
                    Invite
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RoomSettings;
