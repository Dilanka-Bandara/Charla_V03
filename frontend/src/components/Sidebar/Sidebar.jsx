import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiLogOut, FiSearch, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { getRooms } from '../../services/api';
import Avatar from '../Common/Avatar';
import ThemeToggle from '../Common/ThemeToggle';
import RoomList from './RoomList';
import UserList from './UserList';
import CreateRoomModal from './CreateRoomModal';
import RoomInvites from './RoomInvites';
import toast from 'react-hot-toast';
import './Sidebar.css';

const Sidebar = ({ currentRoom, onRoomChange }) => {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading rooms...');
      const response = await getRooms();
      console.log('Rooms loaded:', response.data);
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setError('Failed to load rooms. Please refresh.');
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomCreated = (newRoom) => {
    console.log('New room created:', newRoom);
    setRooms([...rooms, newRoom]);
    setShowCreateRoom(false);
    onRoomChange(newRoom);
    toast.success(`Room "${newRoom.name}" created!`);
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="sidebar glass-card"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sidebar-header">
        <div className="sidebar-user">
          <Avatar user={user} size="md" />
          <div className="sidebar-user-info">
            <h3>{user.username}</h3>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="sidebar-actions">
          <ThemeToggle />
          <button 
            className="icon-btn"
            onClick={logout}
            title="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>

      <div className="sidebar-search">
        <FiSearch size={18} />
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="sidebar-tabs">
        <button
          className={`tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Rooms ({rooms.length})
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'rooms' ? (
          <>
            <RoomInvites onInviteAccepted={loadRooms} />
            
            <motion.button
              className="create-room-btn"
              onClick={() => setShowCreateRoom(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus size={20} />
              Create Room
            </motion.button>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading rooms...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <FiAlertCircle size={32} />
                <p>{error}</p>
                <button onClick={loadRooms} className="retry-btn">
                  Retry
                </button>
              </div>
            ) : (
              <RoomList
                rooms={filteredRooms}
                currentRoom={currentRoom}
                onRoomSelect={onRoomChange}
              />
            )}
          </>
        ) : (
          <UserList />
        )}
      </div>

      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onRoomCreated={handleRoomCreated}
        />
      )}
    </motion.div>
  );
};

export default Sidebar;
