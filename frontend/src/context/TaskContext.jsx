import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children, userId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskRelationships, setTaskRelationships] = useState({}); // taskId -> [childIds]
  const [availableProperties, setAvailableProperties] = useState([
    'priority', 'dueDate', 'tags', 'notes', 'status'
  ]); // Available custom properties
  const [filters, setFilters] = useState({
    name: '',
    done: 'all',
    customProperties: {}
  });

  // Load all tasks on mount
  useEffect(() => {
    if (userId) {
      loadAllTasks();
    }
  }, [userId]);

  const loadAllTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const allTasks = await api.getUserTasks(userId);

      // Build task map
      const taskMap = {};
      allTasks.forEach(task => {
        taskMap[task.id] = task;
      });

      // Build relationships by fetching subtasks for each task
      const relationships = {};
      for (const task of allTasks) {
        try {
          const subtasks = await api.getSubtasks(task.id);
          relationships[task.id] = subtasks.map(st => st.id);
        } catch (err) {
          relationships[task.id] = [];
        }
      }

      setTasks(allTasks);
      setTaskRelationships(relationships);
    } catch (err) {
      setError(err.message);
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if a task matches current filters
  const matchesFilters = (task) => {
    // Name filter (case-insensitive)
    if (filters.name && !task.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }

    // Done filter
    if (filters.done === 'done' && !task.done) {
      return false;
    }
    if (filters.done === 'notDone' && task.done) {
      return false;
    }

    // Custom properties filters
    for (const [propName, filterValue] of Object.entries(filters.customProperties)) {
      if (!filterValue) continue; // Skip empty filters

      const taskPropValue = task.customProperties?.[propName];
      if (!taskPropValue) {
        return false; // Task doesn't have this property
      }

      // Case-insensitive substring match
      if (!String(taskPropValue).toLowerCase().includes(filterValue.toLowerCase())) {
        return false;
      }
    }

    return true;
  };

  // Check if a task or any of its descendants match filters
  const taskOrDescendantsMatch = (task) => {
    // If the task itself matches, show it
    if (matchesFilters(task)) {
      return true;
    }

    // Check if any descendants match
    const childIds = taskRelationships[task.id] || [];
    for (const childId of childIds) {
      const childTask = tasks.find(t => t.id === childId);
      if (childTask && taskOrDescendantsMatch(childTask)) {
        return true;
      }
    }

    return false;
  };

  // Get root tasks (tasks with no parents)
  const getRootTasks = () => {
    const childIds = new Set(
      Object.values(taskRelationships).flat()
    );
    const rootTasks = tasks.filter(task => !childIds.has(task.id));

    // Apply filters: show root task if it or any descendant matches
    return rootTasks.filter(task => taskOrDescendantsMatch(task));
  };

  // Get children of a task
  const getChildren = (taskId) => {
    const childIds = taskRelationships[taskId] || [];
    const children = childIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);

    // Apply filters: show child if it or any of its descendants match
    return children.filter(task => taskOrDescendantsMatch(task));
  };

  // Create a new task
  const createTask = async (taskData) => {
    try {
      const newTask = await api.createTask({
        userId,
        ...taskData
      });

      setTasks(prev => [...prev, newTask]);
      setTaskRelationships(prev => ({
        ...prev,
        [newTask.id]: []
      }));

      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update a task
  const updateTask = async (taskId, updates) => {
    try {
      const updated = await api.updateTask(taskId, updates);

      setTasks(prev => prev.map(task =>
        task.id === taskId ? updated : task
      ));

      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);

      setTasks(prev => prev.filter(task => task.id !== taskId));

      // Remove from relationships
      setTaskRelationships(prev => {
        const newRel = { ...prev };
        delete newRel[taskId];

        // Remove as child from any parent
        Object.keys(newRel).forEach(parentId => {
          newRel[parentId] = newRel[parentId].filter(id => id !== taskId);
        });

        return newRel;
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Add subtask relationship
  const addSubtask = async (parentId, childId) => {
    try {
      await api.addSubtask(parentId, childId);

      setTaskRelationships(prev => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), childId]
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Remove subtask relationship
  const removeSubtask = async (parentId, childId) => {
    try {
      await api.removeSubtask(parentId, childId);

      setTaskRelationships(prev => ({
        ...prev,
        [parentId]: (prev[parentId] || []).filter(id => id !== childId)
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Add a new custom property to the available list
  const addCustomProperty = (propertyName) => {
    if (!availableProperties.includes(propertyName)) {
      setAvailableProperties(prev => [...prev, propertyName]);
    }
  };

  const value = {
    tasks,
    loading,
    error,
    getRootTasks,
    getChildren,
    createTask,
    updateTask,
    deleteTask,
    addSubtask,
    removeSubtask,
    loadAllTasks,
    availableProperties,
    addCustomProperty,
    filters,
    setFilters,
    matchesFilters
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
