import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', text }) => {
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
