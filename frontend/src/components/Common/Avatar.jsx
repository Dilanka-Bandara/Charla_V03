import React from 'react';
import './Avatar.css';

const Avatar = ({ user, size = 'md', showOnline = true, onClick }) => {
  const sizeClasses = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div 
      className={`avatar ${sizeClasses[size]} ${onClick ? 'avatar-clickable' : ''}`}
      onClick={onClick}
    >
      {user.avatar_url && user.avatar_url !== 'default-avatar.png' ? (
        <img src={user.avatar_url} alt={user.username} />
      ) : (
        <div 
          className="avatar-initials"
          style={{ backgroundColor: user.avatar_color || '#6366f1' }}
        >
          {getInitials(user.full_name || user.username)}
        </div>
      )}
      {showOnline && user.is_online && (
        <span className="avatar-status online"></span>
      )}
    </div>
  );
};

export default Avatar;
