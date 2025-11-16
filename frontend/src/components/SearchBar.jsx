import { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import './SearchBar.css';

const SearchBar = ({ onSearch, onClear }) => {
  const { getSuggestions } = useTask();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

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

  // Update suggestions when query changes
  useEffect(() => {
    if (query.length >= 2) {
      const newSuggestions = getSuggestions(query);
      setSuggestions(newSuggestions);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [query, getSuggestions]);

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
    setSuggestions([]);
    setSelectedIndex(-1);
    onClear();
    inputRef.current?.blur();
  };

  const selectSuggestion = (suggestion) => {
    setQuery(suggestion.text);
    setSuggestions([]);
    setSelectedIndex(-1);
    onSearch(suggestion.text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    }
  };

  const handleBlur = (e) => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
        setSuggestions([]);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'task':
        return '📝';
      case 'property':
        return '🏷️';
      case 'property-value':
        return '🔖';
      default:
        return '🔍';
    }
  };

  const showSuggestions = isFocused && suggestions.length > 0;
  const showHints = isFocused && !query && suggestions.length === 0;

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
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
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

      {showSuggestions && (
        <div className="search-suggestions" ref={dropdownRef}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="suggestion-icon">
                {getSuggestionIcon(suggestion.type)}
              </span>
              <div className="suggestion-content">
                {suggestion.category && (
                  <span className="suggestion-category">{suggestion.category}:</span>
                )}
                <span className="suggestion-label">{suggestion.label}</span>
              </div>
              {suggestion.type === 'property' && (
                <span className="suggestion-hint">view all</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showHints && (
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
