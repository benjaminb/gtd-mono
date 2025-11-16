import { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import './CommandPalette.css';

const CommandPalette = ({ isOpen, onClose, onNavigate, savedViews = [] }) => {
  const { tasks, search } = useTask();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, query]);

  if (!isOpen) return null;

  // Build list of results based on query
  const results = [];

  // Add saved views
  if (query === '' || 'saved views'.includes(query.toLowerCase())) {
    savedViews.forEach((view) => {
      if (query === '' || view.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: 'saved-view',
          icon: '⭐',
          label: view.name,
          subtitle: view.type === 'search' ? 'Saved Search' : 'Saved Analytics',
          data: view,
        });
      }
    });
  }

  // Add quick actions
  if (query === '' || 'new task'.includes(query.toLowerCase())) {
    results.push({
      type: 'action',
      icon: '+',
      label: 'New Task',
      subtitle: 'Create a new task',
      action: 'new-task',
    });
  }

  if (query === '' || 'analytics'.includes(query.toLowerCase())) {
    results.push({
      type: 'action',
      icon: '📊',
      label: 'View Analytics',
      subtitle: 'Open analytics dashboard',
      action: 'analytics',
    });
  }

  if (query === '' || 'properties'.includes(query.toLowerCase())) {
    results.push({
      type: 'action',
      icon: '⚙',
      label: 'Manage Properties',
      subtitle: 'Configure property schemas',
      action: 'properties',
    });
  }

  // Search tasks
  if (query.length > 0) {
    const taskResults = tasks
      .filter((task) => task.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    taskResults.forEach((task) => {
      results.push({
        type: 'task',
        icon: task.emoji || '○',
        label: task.name,
        subtitle: task.done ? '✓ Complete' : 'Active',
        data: task,
      });
    });
  }

  // Add search option if query is not empty
  if (query.length > 0) {
    results.push({
      type: 'search',
      icon: '🔍',
      label: `Search for "${query}"`,
      subtitle: 'Run search query',
      query: query,
    });
  }

  const handleSelect = (result) => {
    switch (result.type) {
      case 'saved-view':
        onNavigate('saved-view', result.data);
        break;
      case 'action':
        onNavigate('action', result.action);
        break;
      case 'task':
        onNavigate('task', result.data);
        break;
      case 'search':
        onNavigate('search', result.query);
        break;
    }
    onClose();
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="command-palette-input-wrapper">
          <span className="command-palette-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="command-palette-shortcut">Esc</kbd>
        </div>

        {/* Results List */}
        <div className="command-palette-results">
          {results.length === 0 ? (
            <div className="command-palette-empty">
              <p>No results found</p>
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={`${result.type}-${index}`}
                className={`command-palette-result ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="result-icon">{result.icon}</span>
                <div className="result-content">
                  <div className="result-label">{result.label}</div>
                  <div className="result-subtitle">{result.subtitle}</div>
                </div>
                {index === selectedIndex && (
                  <kbd className="result-enter">Enter</kbd>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="command-palette-footer">
          <div className="footer-hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="footer-hint">
            <kbd>Enter</kbd>
            <span>Select</span>
          </div>
          <div className="footer-hint">
            <kbd>Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
