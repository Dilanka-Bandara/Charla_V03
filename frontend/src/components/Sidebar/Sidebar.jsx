import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiLogOut, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { getRooms } from '../../services/api';
import Avatar from '../Common/Avatar';
import ThemeToggle from '../Common/ThemeToggle';
import RoomList from './RoomList';
import UserList from './UserList';
import CreateRoomModal from './CreateRoomModal';
import './Sidebar.css';

const Sidebar = ({ currentRoom, onRoomChange }) => {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const handleRoomCreated = (newRoom) => {
    setRooms([...rooms, newRoom]);
    setShowCreateRoom(false);
    onRoomChange(newRoom);
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
          Rooms
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
            <motion.button
              className="create-room-btn"
              onClick={() => setShowCreateRoom(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus size={20} />
              Create Room
            </motion.button>
            <RoomList
              rooms={filteredRooms}
              currentRoom={currentRoom}
              onRoomSelect={onRoomChange}
            />
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
