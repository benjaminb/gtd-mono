import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './SearchView.css';

const SearchView = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState('natural'); // 'natural' or 'expression'
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [expressionInput, setExpressionInput] = useState('');
  const [parsedExpression, setParsedExpression] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expressionError, setExpressionError] = useState(null);

  /**
   * Convert natural language to expression using LLM
   */
  const handleConvertNaturalLanguage = async () => {
    if (!naturalLanguageInput.trim()) return;

    setLoading(true);
    setError(null);
    setParsedExpression(null);

    try {
      const result = await api.convertNaturalLanguageToExpression(
        naturalLanguageInput,
        user.id
      );

      setParsedExpression(result.expression);
      setExplanation(result.explanation);
      setConfidence(result.confidence);
      setExpressionInput(result.expression);
      setExpressionError(null);
    } catch (err) {
      console.error('Error converting natural language:', err);
      setError('Failed to convert natural language: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate expression as user types
   */
  const handleExpressionChange = async (value) => {
    setExpressionInput(value);
    setExpressionError(null);

    if (!value.trim()) {
      return;
    }

    try {
      const validation = await api.validateExpression(value);
      if (!validation.valid) {
        setExpressionError(validation.error);
      }
    } catch (err) {
      // Silently handle validation errors
    }
  };

  /**
   * Execute search with current expression
   */
  const handleSearch = async () => {
    const expression = expressionInput.trim();

    if (!expression) {
      setError('Please enter a search expression');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await api.searchTasks(user.id, expression);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching tasks:', err);
      setError('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all search state
   */
  const handleClear = () => {
    setNaturalLanguageInput('');
    setExpressionInput('');
    setParsedExpression(null);
    setExplanation('');
    setConfidence(null);
    setSearchResults(null);
    setError(null);
    setExpressionError(null);
  };

  /**
   * Example queries for user reference
   */
  const exampleQueries = [
    {
      natural: 'Show me completed tasks',
      expression: 'done = true'
    },
    {
      natural: 'High priority tasks that are not done',
      expression: 'priority = high AND done = false'
    },
    {
      natural: 'Tasks created by AI',
      expression: 'source = ai-accepted OR source = ai-suggested'
    },
    {
      natural: 'Tasks that mention meeting',
      expression: 'name contains meeting'
    }
  ];

  return (
    <div className="search-view">
      <div className="search-header">
        <h2>Search Tasks</h2>
        <p className="search-description">
          Find tasks using natural language or boolean expressions
        </p>
      </div>

      {/* Mode Selector */}
      <div className="search-mode-selector">
        <button
          className={`mode-btn ${mode === 'natural' ? 'active' : ''}`}
          onClick={() => setMode('natural')}
        >
          Natural Language
        </button>
        <button
          className={`mode-btn ${mode === 'expression' ? 'active' : ''}`}
          onClick={() => setMode('expression')}
        >
          Boolean Expression
        </button>
      </div>

      {/* Natural Language Input */}
      {mode === 'natural' && (
        <div className="natural-language-section">
          <div className="input-group">
            <label>Describe what you're looking for</label>
            <textarea
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              placeholder="e.g., Show me high priority tasks due today that aren't done"
              rows="3"
              className="natural-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleConvertNaturalLanguage();
                }
              }}
            />
            <div className="input-hint">Press Ctrl+Enter to convert</div>
          </div>

          <button
            onClick={handleConvertNaturalLanguage}
            disabled={loading || !naturalLanguageInput.trim()}
            className="convert-btn"
          >
            {loading ? 'Converting...' : 'Convert to Expression'}
          </button>

          {/* Show parsed expression */}
          {parsedExpression && (
            <div className="parsed-expression-box">
              <div className="parsed-header">
                <span className="parsed-label">AI Interpreted Expression:</span>
                {confidence !== null && (
                  <span className="confidence-badge">
                    {Math.round(confidence * 100)}% confident
                  </span>
                )}
              </div>
              <div className="parsed-expression">{parsedExpression}</div>
              {explanation && (
                <div className="parsed-explanation">{explanation}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Boolean Expression Input */}
      <div className="expression-section">
        <div className="input-group">
          <label>Boolean Expression</label>
          <textarea
            value={expressionInput}
            onChange={(e) => handleExpressionChange(e.target.value)}
            placeholder="e.g., priority = high AND done = false"
            rows="3"
            className={`expression-input ${expressionError ? 'error' : ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSearch();
              }
            }}
          />
          {expressionError && (
            <div className="expression-error">{expressionError}</div>
          )}
          <div className="expression-hint">
            <div>Operators: =, !=, &lt;, &gt;, &lt;=, &gt;=, contains, not contains</div>
            <div>Boolean: AND, OR, NOT</div>
            <div>Special: today, yesterday, tomorrow</div>
          </div>
        </div>

        <div className="search-actions">
          <button
            onClick={handleSearch}
            disabled={loading || !expressionInput.trim() || expressionError}
            className="search-btn"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button onClick={handleClear} className="clear-btn">
            Clear
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="search-error-box">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="search-results">
          <div className="results-header">
            <h3>Search Results</h3>
            <div className="results-stats">
              Found {searchResults.matchingTasks} of {searchResults.totalTasks} tasks
            </div>
          </div>

          {searchResults.tasks.length === 0 ? (
            <div className="no-results">
              No tasks match your search criteria
            </div>
          ) : (
            <div className="results-list">
              {searchResults.tasks.map((task) => (
                <div key={task.id} className="result-item">
                  <div className="result-header">
                    <input
                      type="checkbox"
                      checked={task.done}
                      readOnly
                      className="task-checkbox"
                    />
                    <div className="task-name">{task.name}</div>
                    {task.source && task.source !== 'user' && (
                      <span className={`source-badge ${task.source}`}>
                        {task.source === 'ai-suggested' ? 'AI Suggested' : 'AI Accepted'}
                      </span>
                    )}
                  </div>

                  {task.customProperties && Object.keys(task.customProperties).length > 0 && (
                    <div className="task-properties">
                      {Object.entries(task.customProperties).map(([key, value]) => (
                        <div key={key} className="property-item">
                          <span className="property-key">{key}:</span>
                          <span className="property-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Examples Section */}
      {!searchResults && (
        <div className="examples-section">
          <h3>Example Queries</h3>
          <div className="examples-list">
            {exampleQueries.map((example, index) => (
              <div key={index} className="example-item">
                <div className="example-natural">{example.natural}</div>
                <div className="example-expression">{example.expression}</div>
                <button
                  onClick={() => {
                    setExpressionInput(example.expression);
                    setMode('expression');
                  }}
                  className="try-btn"
                >
                  Try it
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchView;
