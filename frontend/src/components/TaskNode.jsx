import { useState } from 'react';
import { useTask } from '../context/TaskContext';
import './TaskNode.css';

const TaskNode = ({ task, onEdit, onAddSubtask }) => {
  const { getChildren, updateTask, deleteTask, matchesFilters, filters, acceptSuggestion, rejectSuggestion } = useTask();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const children = getChildren(task.id);
  const hasChildren = children.length > 0;

  // Check if this task directly matches the filter
  const directMatch = matchesFilters(task);

  // Check if any filters are active
  const hasActiveFilters = filters.name !== '' ||
                          filters.done !== 'all' ||
                          Object.keys(filters.customProperties).length > 0;

  const toggleExpanded = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleToggleDone = async (e) => {
    e.stopPropagation();
    try {
      await updateTask(task.id, { done: !task.done });
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${task.name}"?`)) {
      try {
        await deleteTask(task.id);
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleAddSubtask = (e) => {
    e.stopPropagation();
    onAddSubtask(task);
  };

  const handleAcceptSuggestion = async (e) => {
    e.stopPropagation();
    try {
      await acceptSuggestion(task.id);
    } catch (err) {
      console.error('Error accepting suggestion:', err);
    }
  };

  const handleRejectSuggestion = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Reject suggestion "${task.name}"?`)) {
      try {
        await rejectSuggestion(task.id);
      } catch (err) {
        console.error('Error rejecting suggestion:', err);
      }
    }
  };

  const customProps = task.customProperties || {};
  const hasCustomProps = Object.keys(customProps).length > 0;
  const source = task.source || 'user';
  const isAiSuggested = source === 'ai-suggested';
  const isAiAccepted = source === 'ai-accepted';

  return (
    <div className={`task-node ${isAiSuggested ? 'ai-suggested' : ''} ${isAiAccepted ? 'ai-accepted' : ''}`}>
      <div
        className={`task-header ${hasActiveFilters && directMatch ? 'filter-match' : ''}`}
        onClick={toggleDetails}
      >
        <span className="task-expand-icon" onClick={toggleExpanded}>
          {hasChildren ? (isExpanded ? '▼' : '▶') : '  '}
        </span>

        <input
          type="checkbox"
          checked={task.done}
          onChange={handleToggleDone}
          onClick={(e) => e.stopPropagation()}
          className="task-checkbox"
        />

        <span className={`task-name ${task.done ? 'done' : ''}`}>
          {task.name}
        </span>

        {isAiSuggested && <span className="ai-badge ai-suggested-badge" title="AI Suggested">AI</span>}
        {isAiAccepted && <span className="ai-badge ai-accepted-badge" title="AI Accepted">✓ AI</span>}

        {hasCustomProps && <span className="has-props-indicator">●</span>}

        <div className="task-actions">
          {isAiSuggested ? (
            <>
              <button onClick={handleAcceptSuggestion} title="Accept suggestion" className="accept-btn">✓</button>
              <button onClick={handleRejectSuggestion} title="Reject suggestion" className="reject-btn">×</button>
            </>
          ) : (
            <>
              <button onClick={handleAddSubtask} title="Add subtask">+</button>
              <button onClick={handleEdit} title="Edit">✎</button>
              <button onClick={handleDelete} title="Delete">×</button>
            </>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="task-details">
          <div className="task-meta">
            <small>Created: {new Date(task.createdAt).toLocaleDateString()}</small>
            {task.updatedAt && (
              <small> | Updated: {new Date(task.updatedAt).toLocaleDateString()}</small>
            )}
          </div>

          {hasCustomProps && (
            <div className="task-custom-props">
              <strong>Properties:</strong>
              <ul>
                {Object.entries(customProps).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {
                      Array.isArray(value) ? value.join(', ') : String(value)
                    }
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isExpanded && hasChildren && (
        <div className="task-children">
          {children.map(child => (
            <TaskNode
              key={child.id}
              task={child}
              onEdit={onEdit}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskNode;
