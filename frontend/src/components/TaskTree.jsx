import { useState } from 'react';
import { useTask } from '../context/TaskContext';
import TaskNode from './TaskNode';
import TaskForm from './TaskForm';
import FilterPanel from './FilterPanel';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import GraphView from './GraphView';
import SuggestionsPanel from './SuggestionsPanel';
import './TaskTree.css';

const TaskTree = () => {
  const { getRootTasks, loading, error, tasks, setFilters, search } = useTask();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [parentForNewTask, setParentForNewTask] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'graph'

  const rootTasks = getRootTasks();

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query) => {
    const results = search(query);
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
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
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰ List
            </button>
            <button
              className={`view-btn ${viewMode === 'graph' ? 'active' : ''}`}
              onClick={() => setViewMode('graph')}
              title="Graph view"
            >
              ◉ Graph
            </button>
          </div>
          <button className="add-task-btn" onClick={handleAddTask}>
            + Add Task
          </button>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

      <SuggestionsPanel />

      {searchResults ? (
        <SearchResults
          searchResults={searchResults}
          onEditTask={handleEditTask}
          onAddSubtask={handleAddSubtask}
        />
      ) : viewMode === 'graph' ? (
        <GraphView
          onEditTask={handleEditTask}
          onAddSubtask={handleAddSubtask}
        />
      ) : (
        <>
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
        </>
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
