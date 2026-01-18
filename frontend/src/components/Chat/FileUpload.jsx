import React, { useRef } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import './FileUpload.css';

const FileUpload = ({ onFileSelect, selectedFile, onClear }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      onFileSelect(file);
    }
  };

  return (
    <div className="file-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {!selectedFile ? (
        <button
          type="button"
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <FiUpload size={20} />
        </button>
      ) : (
        <div className="selected-file">
          <span className="file-name">{selectedFile.name}</span>
          <button
            type="button"
            className="clear-file-btn"
            onClick={onClear}
          >
            <FiX size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
