import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import {
  fuzzyMatch,
  scoreTaskMatch,
  isProbablyPropertyName,
  parsePropertyQuery
} from '../utils/search';

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

  // Get all unique custom property names from all tasks
  const getAllPropertyNames = () => {
    const propNames = new Set();
    tasks.forEach(task => {
      Object.keys(task.customProperties || {}).forEach(key => {
        propNames.add(key);
      });
    });
    return Array.from(propNames);
  };

  // Universal search function
  const search = (query) => {
    if (!query || !query.trim()) {
      return null;
    }

    const q = query.trim();

    // Check if it's a property:value pattern
    const propertyQuery = parsePropertyQuery(q);
    if (propertyQuery) {
      return searchByPropertyValue(propertyQuery.propertyName, propertyQuery.propertyValue);
    }

    // Check if it's a property name (for organized view)
    const allPropertyNames = getAllPropertyNames();
    const propertyCheck = isProbablyPropertyName(q, allPropertyNames);
    if (propertyCheck.match) {
      return searchByProperty(propertyCheck.propertyName);
    }

    // Default: search by task name
    return searchByTaskName(q);
  };

  // Search tasks by name (with fuzzy matching)
  const searchByTaskName = (query) => {
    const matches = [];

    tasks.forEach(task => {
      // Fuzzy match on task name
      if (fuzzyMatch(task.name, query)) {
        const score = scoreTaskMatch(task, query);
        matches.push({ task, score });
      }
    });

    // Sort by relevance score (highest first)
    matches.sort((a, b) => b.score - a.score);

    return {
      mode: 'task-list',
      data: matches.map(m => m.task),
      query,
      matchCount: matches.length
    };
  };

  // Search by property value
  const searchByPropertyValue = (propertyName, propertyValue) => {
    const matchedTasks = [];

    tasks.forEach(task => {
      const taskPropValue = task.customProperties?.[propertyName];
      if (taskPropValue) {
        // Fuzzy match on property value
        if (fuzzyMatch(String(taskPropValue), propertyValue)) {
          matchedTasks.push(task);
        }
      }
    });

    return {
      mode: 'property-filter',
      data: {
        propertyName,
        propertyValue,
        tasks: matchedTasks
      },
      query: `${propertyName}:${propertyValue}`,
      matchCount: matchedTasks.length
    };
  };

  // Organize tasks by property (smart grouping)
  const searchByProperty = (propertyName) => {
    const tasksByValue = new Map();
    let totalCount = 0;

    tasks.forEach(task => {
      const value = task.customProperties?.[propertyName];
      if (value !== undefined && value !== null && value !== '') {
        const key = String(value);
        if (!tasksByValue.has(key)) {
          tasksByValue.set(key, []);
        }
        tasksByValue.get(key).push(task);
        totalCount++;
      }
    });

    // Convert to array and sort groups
    const groups = Array.from(tasksByValue.entries()).map(([value, tasks]) => ({
      value,
      tasks
    }));

    // Smart sorting based on value type
    groups.sort((a, b) => {
      // Try to parse as numbers
      const numA = parseFloat(a.value);
      const numB = parseFloat(b.value);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA; // Descending order for numbers
      }

      // Try to parse as dates
      const dateA = new Date(a.value);
      const dateB = new Date(b.value);

      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateB - dateA; // Most recent first
      }

      // Default: alphabetical
      return a.value.localeCompare(b.value);
    });

    return {
      mode: 'property-view',
      data: {
        propertyName,
        groups
      },
      query: propertyName,
      matchCount: totalCount
    };
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
    matchesFilters,
    search
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
