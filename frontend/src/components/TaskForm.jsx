import { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import './TaskForm.css';

const TaskForm = ({ task, parentTask, onClose }) => {
  const { createTask, updateTask, addSubtask, availableProperties, addCustomProperty } = useTask();

  const [name, setName] = useState(task?.name || '');
  const [done, setDone] = useState(task?.done || false);
  const [customProperties, setCustomProperties] = useState(task?.customProperties || {});
  const [newPropertyName, setNewPropertyName] = useState('');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!task;
  const title = isEditing
    ? `Edit Task: ${task.name}`
    : parentTask
    ? `Add Subtask to: ${parentTask.name}`
    : 'Add New Task';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);

      if (isEditing) {
        // Update existing task
        await updateTask(task.id, {
          name,
          done,
          customProperties
        });
      } else {
        // Create new task
        const newTask = await createTask({
          name,
          done,
          customProperties
        });

        // If this is a subtask, link it to parent
        if (parentTask) {
          await addSubtask(parentTask.id, newTask.id);
        }
      }

      onClose();
    } catch (err) {
      setError(err.message);
      console.error('Error saving task:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddProperty = (propertyName) => {
    if (!propertyName.trim()) return;

    // Add to available properties if new
    addCustomProperty(propertyName);

    // Add to this task's properties with empty value
    setCustomProperties(prev => ({
      ...prev,
      [propertyName]: ''
    }));

    setNewPropertyName('');
    setShowAddProperty(false);
  };

  const handlePropertyChange = (key, value) => {
    setCustomProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRemoveProperty = (key) => {
    setCustomProperties(prev => {
      const newProps = { ...prev };
      delete newProps[key];
      return newProps;
    });
  };

  const handleAddExistingProperty = (propertyName) => {
    if (!customProperties.hasOwnProperty(propertyName)) {
      setCustomProperties(prev => ({
        ...prev,
        [propertyName]: ''
      }));
    }
  };

  const unusedProperties = availableProperties.filter(
    prop => !customProperties.hasOwnProperty(prop)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="task-name">Task Name *</label>
            <input
              id="task-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => setDone(e.target.checked)}
              />
              {' '}Mark as done
            </label>
          </div>

          <div className="form-section">
            <h4>Custom Properties</h4>

            {Object.keys(customProperties).length > 0 ? (
              <div className="properties-list">
                {Object.entries(customProperties).map(([key, value]) => (
                  <div key={key} className="property-row">
                    <label>{key}</label>
                    <div className="property-input-group">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handlePropertyChange(key, e.target.value)}
                        placeholder={`Enter ${key}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProperty(key)}
                        className="remove-btn"
                        title="Remove property"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-properties">No custom properties set</p>
            )}

            {unusedProperties.length > 0 && (
              <div className="add-existing-property">
                <label>Add existing property:</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddExistingProperty(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">-- Select --</option>
                  {unusedProperties.map(prop => (
                    <option key={prop} value={prop}>{prop}</option>
                  ))}
                </select>
              </div>
            )}

            {!showAddProperty ? (
              <button
                type="button"
                onClick={() => setShowAddProperty(true)}
                className="add-property-btn"
              >
                + Create New Property
              </button>
            ) : (
              <div className="new-property-input">
                <input
                  type="text"
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  placeholder="Property name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProperty(newPropertyName);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddProperty(newPropertyName)}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProperty(false);
                    setNewPropertyName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" disabled={saving} className="save-btn">
              {saving ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
