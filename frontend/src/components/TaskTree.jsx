import { useState } from 'react';
import { useTask } from '../context/TaskContext';
import TaskNode from './TaskNode';
import TaskForm from './TaskForm';
import FilterPanel from './FilterPanel';
import './TaskTree.css';

const TaskTree = () => {
  const { getRootTasks, loading, error, tasks, setFilters } = useTask();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [parentForNewTask, setParentForNewTask] = useState(null);

  const rootTasks = getRootTasks();

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setParentForNewTask(null);
    setShowForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setParentForNewTask(null);
    setShowForm(true);
  };

  const handleAddSubtask = (parentTask) => {
    setEditingTask(null);
    setParentForNewTask(parentTask);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setParentForNewTask(null);
  };

  if (loading) {
    return <div className="task-tree-loading">Loading tasks...</div>;
  }

  if (error) {
    return <div className="task-tree-error">Error: {error}</div>;
  }

  return (
    <div className="task-tree">
      <div className="task-tree-header">
        <h2>Tasks</h2>
        <button className="add-task-btn" onClick={handleAddTask}>
          + Add Task
        </button>
      </div>

      <FilterPanel
        onFilterChange={handleFilterChange}
        allTasks={tasks}
      />

      {rootTasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks match the current filters.</p>
        </div>
      ) : (
        <div className="task-list">
          {rootTasks.map(task => (
            <TaskNode
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onAddSubtask={handleAddSubtask}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editingTask}
          parentTask={parentForNewTask}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default TaskTree;
