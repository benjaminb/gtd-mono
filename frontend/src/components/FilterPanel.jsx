import { useState } from 'react';
import './FilterPanel.css';

const FilterPanel = ({ onFilterChange, availableCustomProperties, allTasks }) => {
  const [filters, setFilters] = useState({
    name: '',
    done: 'all', // 'all', 'done', 'notDone'
    customProperties: {}
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Get all unique custom property keys from all tasks
  const getUniqueCustomProperties = () => {
    const propKeys = new Set();
    allTasks.forEach(task => {
      Object.keys(task.customProperties || {}).forEach(key => {
        propKeys.add(key);
      });
    });
    return Array.from(propKeys).sort();
  };

  const customPropKeys = getUniqueCustomProperties();

  const handleNameChange = (value) => {
    const newFilters = { ...filters, name: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDoneChange = (value) => {
    const newFilters = { ...filters, done: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCustomPropertyChange = (propName, value) => {
    const newFilters = {
      ...filters,
      customProperties: {
        ...filters.customProperties,
        [propName]: value
      }
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const removeCustomPropertyFilter = (propName) => {
    const newCustomProps = { ...filters.customProperties };
    delete newCustomProps[propName];
    const newFilters = {
      ...filters,
      customProperties: newCustomProps
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const newFilters = {
      name: '',
      done: 'all',
      customProperties: {}
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.name !== '' ||
      filters.done !== 'all' ||
      Object.keys(filters.customProperties).length > 0
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.name !== '') count++;
    if (filters.done !== 'all') count++;
    count += Object.keys(filters.customProperties).length;
    return count;
  };

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <button
          className="filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'} Filters
          {hasActiveFilters() && (
            <span className="filter-count">{getActiveFilterCount()}</span>
          )}
        </button>
        {hasActiveFilters() && (
          <button className="clear-filters" onClick={clearAllFilters}>
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="filter-content">
          {/* Name filter */}
          <div className="filter-group">
            <label>Task Name</label>
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          {/* Done filter */}
          <div className="filter-group">
            <label>Status</label>
            <select value={filters.done} onChange={(e) => handleDoneChange(e.target.value)}>
              <option value="all">All Tasks</option>
              <option value="done">Done</option>
              <option value="notDone">Not Done</option>
            </select>
          </div>

          {/* Custom properties filter */}
          {customPropKeys.length > 0 && (
            <div className="filter-group">
              <label>Custom Properties</label>
              <div className="custom-prop-filters">
                {Object.keys(filters.customProperties).map(propName => (
                  <div key={propName} className="custom-prop-filter">
                    <label>{propName}</label>
                    <div className="custom-prop-input">
                      <input
                        type="text"
                        placeholder={`Filter by ${propName}...`}
                        value={filters.customProperties[propName]}
                        onChange={(e) => handleCustomPropertyChange(propName, e.target.value)}
                      />
                      <button
                        className="remove-filter"
                        onClick={() => removeCustomPropertyFilter(propName)}
                        title="Remove filter"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add custom property filter */}
                <div className="add-custom-filter">
                  <select
                    onChange={(e) => {
                      if (e.target.value && !filters.customProperties[e.target.value]) {
                        handleCustomPropertyChange(e.target.value, '');
                      }
                      e.target.value = '';
                    }}
                  >
                    <option value="">+ Add property filter...</option>
                    {customPropKeys
                      .filter(key => !filters.customProperties[key])
                      .map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active filters display */}
      {hasActiveFilters() && !isExpanded && (
        <div className="active-filters-summary">
          {filters.name && <span className="filter-tag">Name: {filters.name}</span>}
          {filters.done !== 'all' && (
            <span className="filter-tag">
              Status: {filters.done === 'done' ? 'Done' : 'Not Done'}
            </span>
          )}
          {Object.entries(filters.customProperties).map(([key, value]) => (
            value && <span key={key} className="filter-tag">{key}: {value}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
