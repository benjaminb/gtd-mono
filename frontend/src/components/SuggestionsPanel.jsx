import { useState } from 'react';
import { useTask } from '../context/TaskContext';
import './SuggestionsPanel.css';

const SuggestionsPanel = () => {
  const { tasks, acceptSuggestion, rejectSuggestion } = useTask();
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter for AI-suggested tasks only
  const suggestions = tasks.filter(task => task.source === 'ai-suggested');

  if (suggestions.length === 0) {
    return null; // Don't show panel if no suggestions
  }

  const handleAccept = async (task) => {
    try {
      await acceptSuggestion(task.id);
    } catch (err) {
      console.error('Error accepting suggestion:', err);
    }
  };

  const handleReject = async (task) => {
    try {
      await rejectSuggestion(task.id);
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
    }
  };

  const handleAcceptAll = async () => {
    if (window.confirm(`Accept all ${suggestions.length} suggestions?`)) {
      for (const task of suggestions) {
        try {
          await acceptSuggestion(task.id);
        } catch (err) {
          console.error('Error accepting suggestion:', err);
        }
      }
    }
  };

  const handleRejectAll = async () => {
    if (window.confirm(`Reject all ${suggestions.length} suggestions? This cannot be undone.`)) {
      for (const task of suggestions) {
        try {
          await rejectSuggestion(task.id);
        } catch (err) {
          console.error('Error rejecting suggestion:', err);
        }
      }
    }
  };

  return (
    <div className={`suggestions-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="suggestions-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <span className="suggestions-icon">💡</span>
          <h3>AI Suggestions</h3>
          <span className="suggestions-count">{suggestions.length}</span>
        </div>
        <div className="header-right">
          {isExpanded && suggestions.length > 1 && (
            <>
              <button
                className="batch-accept-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptAll();
                }}
                title="Accept all suggestions"
              >
                ✓ Accept All
              </button>
              <button
                className="batch-reject-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectAll();
                }}
                title="Reject all suggestions"
              >
                × Dismiss All
              </button>
            </>
          )}
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="suggestions-content">
          <div className="suggestions-list">
            {suggestions.map(task => (
              <div key={task.id} className="suggestion-item">
                <div className="suggestion-main">
                  <div className="suggestion-info">
                    <div className="suggestion-name">{task.name}</div>
                    {task.suggestionMetadata && (
                      <div className="suggestion-metadata">
                        {task.suggestionMetadata.reasoning && (
                          <div className="suggestion-reasoning">
                            <span className="reasoning-label">Why:</span> {task.suggestionMetadata.reasoning}
                          </div>
                        )}
                        {task.suggestionMetadata.confidence && (
                          <div className="suggestion-confidence">
                            <span className="confidence-label">Confidence:</span>
                            <div className="confidence-bar">
                              <div
                                className="confidence-fill"
                                style={{ width: `${task.suggestionMetadata.confidence * 100}%` }}
                              />
                            </div>
                            <span className="confidence-value">
                              {Math.round(task.suggestionMetadata.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {Object.keys(task.customProperties || {}).length > 0 && (
                      <div className="suggestion-properties">
                        {Object.entries(task.customProperties).map(([key, value]) => (
                          <span key={key} className="property-tag">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="suggestion-actions">
                    <button
                      className="accept-suggestion-btn"
                      onClick={() => handleAccept(task)}
                      title="Accept this suggestion"
                    >
                      ✓ Accept
                    </button>
                    <button
                      className="reject-suggestion-btn"
                      onClick={() => handleReject(task)}
                      title="Dismiss this suggestion"
                    >
                      × Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionsPanel;
