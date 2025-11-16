import { useState } from 'react';
import TaskNode from './TaskNode';
import './SearchResults.css';

const SearchResults = ({ searchResults, onEditTask, onAddSubtask }) => {
  const { mode, data, query, matchCount } = searchResults;

  if (mode === 'task-list') {
    // Standard list of matching tasks
    return (
      <div className="search-results">
        <div className="search-results-header">
          <h3>Search Results</h3>
          <span className="search-count">{matchCount} task{matchCount !== 1 ? 's' : ''} found</span>
        </div>

        {data.length === 0 ? (
          <div className="no-results">
            <p>No tasks found matching "{query}"</p>
            <small>Try a different search or check for typos</small>
          </div>
        ) : (
          <div className="search-results-list">
            {data.map(task => (
              <TaskNode
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onAddSubtask={onAddSubtask}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'property-view') {
    // Organized view by property
    const { propertyName, groups } = data;

    return (
      <div className="search-results property-view">
        <div className="search-results-header">
          <h3>Tasks by {propertyName}</h3>
          <span className="search-count">{matchCount} task{matchCount !== 1 ? 's' : ''}</span>
        </div>

        {groups.length === 0 ? (
          <div className="no-results">
            <p>No tasks have the "{propertyName}" property</p>
          </div>
        ) : (
          <div className="property-groups">
            {groups.map((group, idx) => (
              <PropertyGroup
                key={idx}
                group={group}
                propertyName={propertyName}
                onEditTask={onEditTask}
                onAddSubtask={onAddSubtask}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'property-filter') {
    // Filtered by specific property value
    const { propertyName, propertyValue } = data;

    return (
      <div className="search-results property-filter">
        <div className="search-results-header">
          <h3>
            <span className="property-badge">{propertyName}: {propertyValue}</span>
          </h3>
          <span className="search-count">{matchCount} task{matchCount !== 1 ? 's' : ''}</span>
        </div>

        {data.tasks.length === 0 ? (
          <div className="no-results">
            <p>No tasks with {propertyName} = "{propertyValue}"</p>
          </div>
        ) : (
          <div className="search-results-list">
            {data.tasks.map(task => (
              <TaskNode
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onAddSubtask={onAddSubtask}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

const PropertyGroup = ({ group, propertyName, onEditTask, onAddSubtask }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="property-group">
      <div className="property-group-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="property-value-label">
          {group.value || <em>(empty)</em>}
        </span>
        <span className="property-count">{group.tasks.length}</span>
      </div>

      {isExpanded && (
        <div className="property-group-tasks">
          {group.tasks.map(task => (
            <TaskNode
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
