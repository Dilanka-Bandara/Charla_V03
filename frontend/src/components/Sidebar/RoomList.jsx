import React from 'react';
import { motion } from 'framer-motion';
import './RoomList.css';

const RoomList = ({ rooms, currentRoom, onRoomSelect }) => {
  if (rooms.length === 0) {
    return (
      <div className="empty-state">
        <p>No rooms yet</p>
        <span>Create one to get started!</span>
      </div>
    );
  }

  return (
    <div className="room-list">
      {rooms.map((room, index) => (
        <motion.div
          key={room.id}
          className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
          onClick={() => onRoomSelect(room)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ x: 4 }}
        >
          <div className="room-icon">{room.icon}</div>
          <div className="room-info">
            <h4>{room.name}</h4>
            <p className="room-description">
              {room.description || 'No description'}
            </p>
          </div>
          {room.member_count > 0 && (
            <span className="room-members">{room.member_count}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default RoomList;
