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

  // Get root tasks (tasks with no parents)
  const getRootTasks = () => {
    const childIds = new Set(
      Object.values(taskRelationships).flat()
    );
    return tasks.filter(task => !childIds.has(task.id));
  };

  // Get children of a task
  const getChildren = (taskId) => {
    const childIds = taskRelationships[taskId] || [];
    return childIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
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
    addCustomProperty
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
