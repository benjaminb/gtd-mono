import { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch, onClear }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Keyboard shortcut: Cmd/Ctrl + K to focus search
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Escape to clear search
      if (e.key === 'Escape' && isFocused) {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim()) {
      onSearch(value.trim());
    } else {
      onClear();
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
    inputRef.current?.blur();
  };

  return (
    <div className={`search-bar ${isFocused ? 'focused' : ''}`}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search tasks, properties, or values... (⌘K)"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {query && (
          <button
            className="search-clear"
            onClick={handleClear}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {isFocused && !query && (
        <div className="search-hints">
          <div className="search-hint">
            <strong>Task search:</strong> Type any text to find tasks
          </div>
          <div className="search-hint">
            <strong>Property filter:</strong> property:value (e.g., "priority:high")
          </div>
          <div className="search-hint">
            <strong>Property view:</strong> Type a property name to see organized view
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
