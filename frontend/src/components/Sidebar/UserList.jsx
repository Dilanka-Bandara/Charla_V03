import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllUsers } from '../../services/api';
import Avatar from '../Common/Avatar';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading users...</div>;
  }

  return (
    <div className="user-list">
      {users.map((user, index) => (
        <motion.div
          key={user.id}
          className="user-item"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Avatar user={user} size="md" />
          <div className="user-info">
            <h4>{user.username}</h4>
            <p className={user.is_online ? 'status-online' : 'status-offline'}>
              {user.is_online ? '🟢 Online' : '⚫ Offline'}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default UserList;
