import { useEffect, useState } from 'react';
import { useTask } from '../context/TaskContext';
import './TaskHoverCard.css';

const TaskHoverCard = ({ task, position, onEdit, onDelete, onAddSubtask, onClose }) => {
  const { getChildren, updateTask } = useTask();
  const [cardPosition, setCardPosition] = useState(position);

  useEffect(() => {
    // Adjust card position if it would go off-screen
    const card = document.querySelector('.task-hover-card');
    if (card) {
      const rect = card.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // Keep card on screen horizontally
      if (rect.right > viewportWidth) {
        newX = position.x - (rect.right - viewportWidth) - 20;
      }
      if (rect.left < 0) {
        newX = position.x + Math.abs(rect.left) + 20;
      }

      // Keep card on screen vertically
      if (rect.bottom > viewportHeight) {
        newY = position.y - (rect.bottom - viewportHeight) - 20;
      }
      if (rect.top < 0) {
        newY = position.y + Math.abs(rect.top) + 20;
      }

      if (newX !== position.x || newY !== position.y) {
        setCardPosition({ x: newX, y: newY });
      }
    }
  }, [position]);

  const children = getChildren(task.id);
  const hasChildren = children.length > 0;

  // Calculate completion percentage if has children
  let completionPercentage = null;
  if (hasChildren) {
    const doneChildren = children.filter(c => c.done).length;
    completionPercentage = Math.round((doneChildren / children.length) * 100);
  }

  // Format custom properties for display
  const customProps = task.customProperties || {};
  const displayProps = Object.entries(customProps)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 5); // Show max 5 properties

  // Format time tracking
  const timeTracking = task.timeTracking || { totalSeconds: 0 };
  const totalSeconds = timeTracking.totalSeconds || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const timeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const source = task.source || 'user';
  const isAiSuggested = source === 'ai-suggested';

  return (
    <div
      className="task-hover-card"
      style={{
        left: `${cardPosition.x}px`,
        top: `${cardPosition.y}px`,
      }}
    >
      {/* Header */}
      <div className="hover-card-header">
        <div className="hover-card-title-row">
          {task.emoji && <span className="hover-card-emoji">{task.emoji}</span>}
          <h4 className="hover-card-title">{task.name}</h4>
        </div>
        <button className="hover-card-close" onClick={onClose}>×</button>
      </div>

      {/* Quick Stats */}
      <div className="hover-card-stats">
        <div className="stat-item">
          <span className="stat-label">Status:</span>
          <span className={`stat-value status-${task.done ? 'done' : 'active'}`}>
            {task.done ? '✓ Complete' : '○ Active'}
          </span>
        </div>

        {hasChildren && (
          <div className="stat-item">
            <span className="stat-label">Progress:</span>
            <span className="stat-value">
              {completionPercentage}% ({children.filter(c => c.done).length}/{children.length})
            </span>
          </div>
        )}

        {totalSeconds > 0 && (
          <div className="stat-item">
            <span className="stat-label">Time Spent:</span>
            <span className="stat-value">{timeDisplay}</span>
          </div>
        )}

        {isAiSuggested && (
          <div className="stat-item">
            <span className="stat-label">Source:</span>
            <span className="stat-value stat-ai">AI Suggested</span>
          </div>
        )}
      </div>

      {/* Properties */}
      {displayProps.length > 0 && (
        <div className="hover-card-properties">
          <div className="properties-header">Properties</div>
          {displayProps.map(([key, value]) => (
            <div key={key} className="property-item">
              <span className="property-key">{key}:</span>
              <span className="property-value">
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="hover-card-actions">
        <button
          className="hover-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
            onClose();
          }}
          title="Edit task"
        >
          ✎ Edit
        </button>
        <button
          className="hover-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddSubtask(task);
            onClose();
          }}
          title="Add subtask"
        >
          + Subtask
        </button>
        <button
          className="hover-action-btn danger"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete "${task.name}"?`)) {
              onDelete(task.id);
              onClose();
            }
          }}
          title="Delete task"
        >
          × Delete
        </button>
      </div>

      {/* Timestamps */}
      <div className="hover-card-footer">
        <small>Created: {new Date(task.createdAt).toLocaleDateString()}</small>
        {task.updatedAt && task.updatedAt !== task.createdAt && (
          <small> • Updated: {new Date(task.updatedAt).toLocaleDateString()}</small>
        )}
      </div>
    </div>
  );
};

export default TaskHoverCard;
