import React from 'react';
import './Avatar.css';

// Define API URL constant
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

  // Helper to resolve image URL
  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url === 'default-avatar.png') return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const avatarSrc = getAvatarUrl(user.avatar_url);

  return (
    <div 
      className={`avatar ${sizeClasses[size]} ${onClick ? 'avatar-clickable' : ''}`}
      onClick={onClick}
    >
      {avatarSrc ? (
        <img src={avatarSrc} alt={user.username} />
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