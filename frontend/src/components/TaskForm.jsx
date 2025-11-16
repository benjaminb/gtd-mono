import { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import PropertyEditor from './PropertyEditor';
import './TaskForm.css';

const TaskForm = ({ task, parentTask, onClose }) => {
  const { createTask, updateTask, addSubtask } = useTask();

  const [name, setName] = useState(task?.name || '');
  const [done, setDone] = useState(task?.done || false);
  const [customProperties, setCustomProperties] = useState(task?.customProperties || {});
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

          <PropertyEditor
            properties={customProperties}
            onChange={setCustomProperties}
          />

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
