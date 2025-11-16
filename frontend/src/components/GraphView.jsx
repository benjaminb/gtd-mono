import { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { useAutoSuggestions } from '../hooks/useAutoSuggestions';
import './GraphView.css';

const GraphView = ({ onEditTask, onAddSubtask }) => {
  const { tasks, getRootTasks, getChildren } = useTask();
  const [selectedTask, setSelectedTask] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const svgRef = useRef(null);

  // Auto-generate subtask suggestions when user selects a task
  const isUserTask = selectedTask && (selectedTask.source === 'user' || selectedTask.source === 'ai-accepted');
  useAutoSuggestions(
    isUserTask ? selectedTask : null,
    { suggestionType: 'subtasks', debounceMs: 2000 }
  );

  // Build graph structure and calculate positions
  useEffect(() => {
    const nodes = [];
    const edges = [];

    const NODE_WIDTH = 190; // Circle (50) + Rectangle (140)
    const NODE_HEIGHT = 40;
    const HORIZONTAL_SPACING = 250; // Increased for wider nodes
    const VERTICAL_SPACING = 120;

    // Calculate positions using tree layout
    const calculatePositions = (task, depth = 0, index = 0, parentX = null, parentY = null) => {
      const children = getChildren(task.id);
      const totalChildren = children.length;

      // Calculate this node's position
      const y = depth * VERTICAL_SPACING + 50;

      // For root nodes, distribute horizontally
      // For child nodes, center under parent
      let x;
      if (depth === 0) {
        x = index * HORIZONTAL_SPACING * 2 + 100;
      } else {
        // Center children under parent
        const totalWidth = (totalChildren - 1) * HORIZONTAL_SPACING;
        x = parentX - totalWidth / 2 + index * HORIZONTAL_SPACING;
      }

      // Add node
      nodes.push({
        id: task.id,
        task: task,
        x: x,
        y: y,
        depth: depth
      });

      // Add edge from parent if exists
      if (parentX !== null && parentY !== null) {
        edges.push({
          from: { x: parentX, y: parentY },
          to: { x: x, y: y },
          taskId: task.id
        });
      }

      // Recursively process children
      children.forEach((child, childIndex) => {
        calculatePositions(child, depth + 1, childIndex, x, y);
      });
    };

    // Process all root tasks
    const rootTasks = getRootTasks();
    rootTasks.forEach((task, index) => {
      calculatePositions(task, 0, index);
    });

    setGraphData({ nodes, edges });
  }, [tasks, getRootTasks, getChildren]);

  // Calculate SVG viewBox based on node positions
  const getViewBox = () => {
    if (graphData.nodes.length === 0) return '0 0 800 600';

    const padding = 50;
    const xs = graphData.nodes.map(n => n.x);
    const ys = graphData.nodes.map(n => n.y);

    const minX = Math.min(...xs) - padding - 30; // Extra for circle on left
    const maxX = Math.max(...xs) + padding + 190; // Circle (50) + Rectangle (140)
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding + 40; // Node height

    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  };

  const handleNodeClick = (node) => {
    setSelectedTask(node.task);
  };

  const handleCloseDetails = () => {
    setSelectedTask(null);
  };

  const handlePropertyChange = (key, value) => {
    if (!selectedTask) return;

    const updatedProperties = { ...selectedTask.customProperties, [key]: value };
    // This will be handled by the detail panel
    setSelectedTask({
      ...selectedTask,
      customProperties: updatedProperties
    });
  };

  if (graphData.nodes.length === 0) {
    return (
      <div className="graph-view-empty">
        <p>No tasks to display in graph view</p>
      </div>
    );
  }

  return (
    <div className="graph-view">
      <svg
        ref={svgRef}
        className="graph-svg"
        viewBox={getViewBox()}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Define arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#667eea" />
          </marker>
        </defs>

        {/* Draw edges first (so they appear behind nodes) */}
        {graphData.edges.map((edge, index) => (
          <line
            key={index}
            x1={edge.from.x}
            y1={edge.from.y + 25} // Offset from bottom of parent circle
            x2={edge.to.x}
            y2={edge.to.y - 25} // Offset to top of child circle
            stroke="#667eea"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Draw nodes */}
        {graphData.nodes.map((node) => {
          const source = node.task.source || 'user';
          const isAiSuggested = source === 'ai-suggested';
          const isAiAccepted = source === 'ai-accepted';

          let fillColor = '#667eea'; // default
          let strokeDasharray = 'none';

          if (node.task.done) {
            fillColor = '#4CAF50';
          } else if (isAiSuggested) {
            fillColor = '#667eea';
            strokeDasharray = '5,5';
          } else if (isAiAccepted) {
            fillColor = '#4CAF50';
          }

          // Thermometer shape constants
          const circleRadius = 25;
          const rectWidth = 140;
          const rectHeight = 40;
          const rectX = node.x + circleRadius;
          const rectY = node.y - rectHeight / 2;

          // Get first letter of task name
          const firstLetter = node.task.name.charAt(0).toUpperCase();

          // Truncate task name for display
          const displayName = node.task.name.length > 20
            ? node.task.name.substring(0, 20) + '...'
            : node.task.name;

          return (
            <g
              key={node.id}
              className={`graph-node ${selectedTask?.id === node.id ? 'selected' : ''} ${node.task.done ? 'done' : ''} ${isAiSuggested ? 'ai-suggested' : ''} ${isAiAccepted ? 'ai-accepted' : ''}`}
              onClick={() => handleNodeClick(node)}
              style={{ cursor: 'pointer' }}
            >
              {/* Rectangle (body of thermometer) */}
              <rect
                x={rectX}
                y={rectY}
                width={rectWidth}
                height={rectHeight}
                fill="white"
                stroke={selectedTask?.id === node.id ? '#ff9800' : '#5568d3'}
                strokeWidth={selectedTask?.id === node.id ? '3' : '2'}
                strokeDasharray={strokeDasharray}
                rx="4"
              />

              {/* Circle (bulb of thermometer) */}
              <circle
                cx={node.x}
                cy={node.y}
                r={circleRadius}
                fill={fillColor}
                fillOpacity={isAiSuggested ? 0.7 : 1}
                stroke={selectedTask?.id === node.id ? '#ff9800' : '#5568d3'}
                strokeWidth={selectedTask?.id === node.id ? '3' : '2'}
                strokeDasharray={strokeDasharray}
              />

              {/* First letter in circle */}
              <text
                x={node.x}
                y={node.y + 8}
                textAnchor="middle"
                fontSize="20"
                fill="white"
                fontWeight="bold"
              >
                {firstLetter}
              </text>

              {/* Task name in rectangle */}
              <text
                x={rectX + 10}
                y={node.y + 5}
                textAnchor="start"
                fontSize="13"
                fill="#333"
                fontWeight="500"
              >
                {displayName}
              </text>

              {/* AI badge in rectangle if applicable */}
              {isAiSuggested && (
                <text
                  x={rectX + rectWidth - 30}
                  y={node.y + 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#667eea"
                  fontWeight="bold"
                >
                  AI
                </text>
              )}
              {isAiAccepted && (
                <text
                  x={rectX + rectWidth - 30}
                  y={node.y + 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#4CAF50"
                  fontWeight="bold"
                >
                  ✓ AI
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={handleCloseDetails}
          onEdit={onEditTask}
          onAddSubtask={onAddSubtask}
        />
      )}
    </div>
  );
};

// Task detail panel component
const TaskDetailPanel = ({ task, onClose, onEdit, onAddSubtask }) => {
  const { updateTask, acceptSuggestion, rejectSuggestion } = useTask();
  const [editingProperty, setEditingProperty] = useState(null);
  const [propertyValue, setPropertyValue] = useState('');

  const handleEditProperty = (key, currentValue) => {
    setEditingProperty(key);
    setPropertyValue(String(currentValue));
  };

  const handleSaveProperty = async (key) => {
    try {
      const updates = {
        customProperties: {
          ...task.customProperties,
          [key]: propertyValue
        }
      };
      await updateTask(task.id, updates);
      setEditingProperty(null);
    } catch (err) {
      console.error('Error updating property:', err);
    }
  };

  const handleToggleDone = async () => {
    try {
      await updateTask(task.id, { done: !task.done });
    } catch (err) {
      console.error('Error toggling done:', err);
    }
  };

  const handleAcceptSuggestion = async () => {
    try {
      await acceptSuggestion(task.id);
      onClose(); // Close panel after accepting
    } catch (err) {
      console.error('Error accepting suggestion:', err);
    }
  };

  const handleRejectSuggestion = async () => {
    if (window.confirm(`Reject suggestion "${task.name}"?`)) {
      try {
        await rejectSuggestion(task.id);
        onClose(); // Close panel after rejecting
      } catch (err) {
        console.error('Error rejecting suggestion:', err);
      }
    }
  };

  const customProps = task.customProperties || {};
  const source = task.source || 'user';
  const isAiSuggested = source === 'ai-suggested';
  const isAiAccepted = source === 'ai-accepted';

  return (
    <div className="task-detail-panel">
      <div className="panel-header">
        <h3>
          {task.name}
          {isAiSuggested && <span className="ai-badge ai-suggested-badge" style={{ marginLeft: '8px' }}>AI</span>}
          {isAiAccepted && <span className="ai-badge ai-accepted-badge" style={{ marginLeft: '8px' }}>✓ AI</span>}
        </h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        {isAiSuggested && (
          <div className="suggestion-actions" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
            <button onClick={handleAcceptSuggestion} className="accept-btn" style={{
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              ✓ Accept Suggestion
            </button>
            <button onClick={handleRejectSuggestion} className="reject-btn" style={{
              padding: '8px 16px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              × Reject
            </button>
          </div>
        )}

        <div className="task-status">
          <label>
            <input
              type="checkbox"
              checked={task.done}
              onChange={handleToggleDone}
            />
            {' '}Completed
          </label>
        </div>

        <div className="task-meta">
          <div className="meta-item">
            <strong>Created:</strong> {new Date(task.createdAt).toLocaleDateString()}
          </div>
          {task.updatedAt && (
            <div className="meta-item">
              <strong>Updated:</strong> {new Date(task.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {Object.keys(customProps).length > 0 && (
          <div className="custom-properties">
            <h4>Properties</h4>
            {Object.entries(customProps).map(([key, value]) => (
              <div key={key} className="property-row">
                <strong>{key}:</strong>
                {editingProperty === key ? (
                  <div className="property-edit">
                    <input
                      type="text"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveProperty(key);
                        }
                      }}
                      autoFocus
                    />
                    <button onClick={() => handleSaveProperty(key)}>✓</button>
                    <button onClick={() => setEditingProperty(null)}>✗</button>
                  </div>
                ) : (
                  <span
                    className="property-value"
                    onClick={() => handleEditProperty(key, value)}
                  >
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="panel-actions">
          <button onClick={() => onEdit(task)} className="edit-btn">
            Edit Task
          </button>
          <button onClick={() => onAddSubtask(task)} className="add-subtask-btn">
            Add Subtask
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphView;
