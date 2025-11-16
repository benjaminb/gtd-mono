import { useState } from 'react';
import './EmojiPicker.css';

/**
 * Simple emoji picker component
 * Provides a grid of common emojis for task icons
 */
const EmojiPicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Common task-related emojis
  const emojis = [
    '📋', '✅', '📝', '💻', '📧', '📞', '📅', '📊',
    '🎯', '📁', '🔧', '🎨', '💡', '🏠', '🏢', '🛒',
    '🍔', '🏃', '📚', '🎓', '💰', '🚗', '✈️', '🏥',
    '🔍', '📦', '🎵', '📷', '🎮', '⚽', '🌟', '⭐',
    '❤️', '🎉', '🔥', '💪', '👥', '📱', '⏰', '📌',
    '🎬', '🍕', '☕', '🌍', '🔑', '📖', '🎁', '🏆'
  ];

  const handleSelectEmoji = (emoji) => {
    onChange(emoji);
    setIsOpen(false);
  };

  const handleClearEmoji = () => {
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className="emoji-picker">
      <button
        type="button"
        className="emoji-display-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to change emoji"
      >
        {value || '📋'}
      </button>

      {isOpen && (
        <div className="emoji-picker-dropdown">
          <div className="emoji-picker-header">
            <span>Select Emoji</span>
            <button
              type="button"
              className="close-picker-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="emoji-grid">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-btn ${value === emoji ? 'selected' : ''}`}
                onClick={() => handleSelectEmoji(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="emoji-picker-footer">
            <button
              type="button"
              className="clear-emoji-btn"
              onClick={handleClearEmoji}
            >
              Clear Emoji
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
