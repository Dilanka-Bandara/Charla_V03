import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX } from 'react-icons/fi';
import { getMyInvites, acceptInvite, declineInvite } from '../../services/api';
import toast from 'react-hot-toast';
import './RoomInvites.css';

const RoomInvites = ({ onInviteAccepted }) => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const response = await getMyInvites();
      setInvites(response.data);
    } catch (error) {
      console.error('Failed to load invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId) => {
    try {
      await acceptInvite(inviteId);
      toast.success('Invite accepted!');
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
      if (onInviteAccepted) onInviteAccepted();
    } catch (error) {
      toast.error('Failed to accept invite');
    }
  };

  const handleDecline = async (inviteId) => {
    try {
      await declineInvite(inviteId);
      toast.success('Invite declined');
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } catch (error) {
      toast.error('Failed to decline invite');
    }
  };

  if (loading) {
    return <div className="loading-state">Loading invites...</div>;
  }

  if (invites.length === 0) {
    return (
      <div className="empty-invites">
        <p>No pending invites</p>
      </div>
    );
  }

  return (
    <div className="room-invites">
      <h3 className="invites-header">Pending Invites</h3>
      {invites.map((invite, index) => (
        <motion.div
          key={invite.id}
          className="invite-item glass-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="invite-info">
            <h4>{invite.room_name}</h4>
            <p>Invited by {invite.inviter_name}</p>
          </div>
          <div className="invite-actions">
            <motion.button
              className="accept-btn"
              onClick={() => handleAccept(invite.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiCheck size={18} />
            </motion.button>
            <motion.button
              className="decline-btn"
              onClick={() => handleDecline(invite.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiX size={18} />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default RoomInvites;
