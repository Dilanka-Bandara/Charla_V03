import React from 'react';
import EmojiPickerReact from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import './EmojiPicker.css';

const EmojiPicker = ({ show, onEmojiClick, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="emoji-picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="emoji-picker-container"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
          >
            <EmojiPickerReact
              onEmojiClick={onEmojiClick}
              autoFocusSearch={false}
              theme="dark"
              width="100%"
              height="400px"
              searchPlaceHolder="Search emojis..."
              previewConfig={{ showPreview: false }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmojiPicker;
