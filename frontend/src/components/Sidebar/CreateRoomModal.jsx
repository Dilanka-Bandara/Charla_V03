import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { createRoom } from '../../services/api';
import toast from 'react-hot-toast';
import './CreateRoomModal.css';

const ROOM_ICONS = ['💬', '🎮', '📚', '🎵', '🎨', '💼', '🏃', '🍕', '🌟', '🚀'];

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '💬',
    room_type: 'public'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    console.log('Creating room with data:', formData);
    const response = await createRoom(formData);
    console.log('Room created successfully:', response.data);
    toast.success('Room created successfully! 🎉');
    onRoomCreated(response.data);
  } catch (error) {
    console.error('Failed to create room:', error);
    const errorMsg = error.response?.data?.detail || 'Failed to create room';
    toast.error(errorMsg);
  } finally {
    setIsLoading(false);
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
          className="modal-content glass-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Create New Room</h2>
            <button className="icon-btn" onClick={onClose}>
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Room Icon</label>
              <div className="icon-selector">
                {ROOM_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Room Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., General Chat"
                required
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What's this room about?"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Room Type</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="public"
                    checked={formData.room_type === 'public'}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  />
                  <span>Public</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="private"
                    checked={formData.room_type === 'private'}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  />
                  <span>Private</span>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


export default CreateRoomModal;
