import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiClient } from '../api/client';
import type { Task, PropertySchema } from '../types';
import {
  fuzzyMatch,
  scoreTaskMatch,
  isProbablyPropertyName,
  parsePropertyQuery
} from '../utils/search';

interface TaskContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  taskRelationships: Record<string, string[]>;
  availableProperties: string[];
  filters: TaskFilters;
  activeTimeTracking: string | null;

  // Task operations
  getRootTasks: () => Task[];
  getChildren: (taskId: string) => Task[];
  createTask: (taskData: any) => Promise<Task>;
  updateTask: (taskId: string, updates: any) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  addSubtask: (parentId: string, childId: string) => Promise<void>;
  removeSubtask: (parentId: string, childId: string) => Promise<void>;
  loadAllTasks: () => Promise<void>;

  // Property operations
  addCustomProperty: (propertyName: string) => void;
  getAllPropertyNames: () => string[];

  // Filter operations
  setFilters: (filters: TaskFilters) => void;
  matchesFilters: (task: Task) => boolean;

  // Search operations
  search: (query: string) => SearchResult | null;
  getSuggestions: (query: string, limit?: number) => Suggestion[];

  // AI suggestion operations
  acceptSuggestion: (taskId: string) => Promise<Task>;
  rejectSuggestion: (taskId: string) => Promise<void>;

  // Time tracking operations
  startTimeTracking: (taskId: string) => Promise<Task>;
  stopTimeTracking: (taskId: string) => Promise<Task>;
  toggleTimeTracking: (taskId: string) => Promise<Task>;
}

interface TaskFilters {
  name: string;
  done: 'all' | 'done' | 'notDone';
  customProperties: Record<string, string>;
}

interface SearchResult {
  mode: 'task-list' | 'property-view' | 'property-filter';
  data: any;
  query: string;
  matchCount: number;
}

interface Suggestion {
  type: 'task' | 'property' | 'property-value';
  text: string;
  label: string;
  category?: string;
  taskId?: string;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
  userId: string;
  apiClient: ApiClient;
}

export const TaskProvider = ({ children, userId, apiClient }: TaskProviderProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskRelationships, setTaskRelationships] = useState<Record<string, string[]>>({});
  const [availableProperties, setAvailableProperties] = useState<string[]>([
    'priority', 'dueDate', 'tags', 'notes', 'status'
  ]);
  const [filters, setFilters] = useState<TaskFilters>({
    name: '',
    done: 'all',
    customProperties: {}
  });
  const [activeTimeTracking, setActiveTimeTracking] = useState<string | null>(null);

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

      const allTasks = await apiClient.getUserTasks(userId);

      // Build relationships by fetching subtasks for each task
      const relationships: Record<string, string[]> = {};
      for (const task of allTasks) {
        try {
          const subtasks = await apiClient.getSubtasks(task.id);
          relationships[task.id] = subtasks.map(st => st.id);
        } catch (err) {
          relationships[task.id] = [];
        }
      }

      setTasks(allTasks);
      setTaskRelationships(relationships);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if a task matches current filters
  const matchesFilters = (task: Task): boolean => {
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
      if (!filterValue) continue;

      const taskPropValue = task.customProperties?.[propName];
      if (!taskPropValue) {
        return false;
      }

      if (!String(taskPropValue).toLowerCase().includes(filterValue.toLowerCase())) {
        return false;
      }
    }

    return true;
  };

  // Check if a task or any of its descendants match filters
  const taskOrDescendantsMatch = (task: Task): boolean => {
    if (matchesFilters(task)) {
      return true;
    }

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
  const getRootTasks = (): Task[] => {
    const childIds = new Set(
      Object.values(taskRelationships).flat()
    );
    const rootTasks = tasks.filter(task => !childIds.has(task.id));
    return rootTasks.filter(task => taskOrDescendantsMatch(task));
  };

  // Get children of a task
  const getChildren = (taskId: string): Task[] => {
    const childIds = taskRelationships[taskId] || [];
    const children = childIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[];
    return children.filter(task => taskOrDescendantsMatch(task));
  };

  // Create a new task
  const createTask = async (taskData: any): Promise<Task> => {
    try {
      const newTask = await apiClient.createTask({
        userId,
        ...taskData
      });

      setTasks(prev => [...prev, newTask]);
      setTaskRelationships(prev => ({
        ...prev,
        [newTask.id]: []
      }));

      return newTask;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Update a task
  const updateTask = async (taskId: string, updates: any): Promise<Task> => {
    try {
      const updated = await apiClient.updateTask(taskId, updates);

      setTasks(prev => prev.map(task =>
        task.id === taskId ? updated : task
      ));

      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      await apiClient.deleteTask(taskId);

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
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Add subtask relationship
  const addSubtask = async (parentId: string, childId: string): Promise<void> => {
    try {
      await apiClient.addSubtask(parentId, childId);

      setTaskRelationships(prev => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), childId]
      }));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Remove subtask relationship
  const removeSubtask = async (parentId: string, childId: string): Promise<void> => {
    try {
      await apiClient.removeSubtask(parentId, childId);

      setTaskRelationships(prev => ({
        ...prev,
        [parentId]: (prev[parentId] || []).filter(id => id !== childId)
      }));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Add a new custom property to the available list
  const addCustomProperty = (propertyName: string) => {
    if (!availableProperties.includes(propertyName)) {
      setAvailableProperties(prev => [...prev, propertyName]);
    }
  };

  // Get all unique custom property names from all tasks
  const getAllPropertyNames = (): string[] => {
    const propNames = new Set<string>();
    tasks.forEach(task => {
      Object.keys(task.customProperties || {}).forEach(key => {
        propNames.add(key);
      });
    });
    return Array.from(propNames);
  };

  // Universal search function
  const search = (query: string): SearchResult | null => {
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
  const searchByTaskName = (query: string): SearchResult => {
    const matches: Array<{ task: Task; score: number }> = [];

    tasks.forEach(task => {
      if (fuzzyMatch(task.name, query)) {
        const score = scoreTaskMatch(task, query);
        matches.push({ task, score });
      }
    });

    matches.sort((a, b) => b.score - a.score);

    return {
      mode: 'task-list',
      data: matches.map(m => m.task),
      query,
      matchCount: matches.length
    };
  };

  // Search by property value
  const searchByPropertyValue = (propertyName: string, propertyValue: string): SearchResult => {
    const matchedTasks: Task[] = [];

    tasks.forEach(task => {
      const taskPropValue = task.customProperties?.[propertyName];
      if (taskPropValue) {
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
  const searchByProperty = (propertyName: string): SearchResult => {
    const tasksByValue = new Map<string, Task[]>();
    let totalCount = 0;

    tasks.forEach(task => {
      const value = task.customProperties?.[propertyName];
      if (value !== undefined && value !== null && value !== '') {
        const key = String(value);
        if (!tasksByValue.has(key)) {
          tasksByValue.set(key, []);
        }
        tasksByValue.get(key)!.push(task);
        totalCount++;
      }
    });

    const groups = Array.from(tasksByValue.entries()).map(([value, tasks]) => ({
      value,
      tasks
    }));

    // Smart sorting based on value type
    groups.sort((a, b) => {
      const numA = parseFloat(a.value);
      const numB = parseFloat(b.value);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA;
      }

      const dateA = new Date(a.value);
      const dateB = new Date(b.value);

      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateB.getTime() - dateA.getTime();
      }

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

  // Accept an AI suggestion
  const acceptSuggestion = async (taskId: string): Promise<Task> => {
    try {
      const updated = await apiClient.acceptSuggestion(taskId);

      setTasks(prev => prev.map(task =>
        task.id === taskId ? updated : task
      ));

      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Reject an AI suggestion
  const rejectSuggestion = async (taskId: string): Promise<void> => {
    try {
      await apiClient.rejectSuggestion(taskId);

      setTasks(prev => prev.filter(task => task.id !== taskId));

      setTaskRelationships(prev => {
        const newRel = { ...prev };
        delete newRel[taskId];

        Object.keys(newRel).forEach(parentId => {
          newRel[parentId] = newRel[parentId].filter(id => id !== taskId);
        });

        return newRel;
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Get autocomplete suggestions based on query
  const getSuggestions = (query: string, limit: number = 10): Suggestion[] => {
    if (!query || query.length < 2) {
      return [];
    }

    const suggestions: Suggestion[] = [];
    const q = query.toLowerCase();

    const propertyQuery = parsePropertyQuery(query);

    if (propertyQuery) {
      const allPropertyNames = getAllPropertyNames();

      if (allPropertyNames.includes(propertyQuery.propertyName)) {
        const valueSet = new Set<string>();
        tasks.forEach(task => {
          const value = task.customProperties?.[propertyQuery.propertyName];
          if (value && fuzzyMatch(String(value), propertyQuery.propertyValue)) {
            valueSet.add(String(value));
          }
        });

        Array.from(valueSet).slice(0, limit).forEach(value => {
          suggestions.push({
            type: 'property-value',
            text: `${propertyQuery.propertyName}:${value}`,
            label: value,
            category: propertyQuery.propertyName
          });
        });
      }
    } else {
      // Suggest task names
      const taskMatches: Array<{ task: Task; score: number }> = [];
      tasks.forEach(task => {
        if (fuzzyMatch(task.name, query)) {
          const score = scoreTaskMatch(task, query);
          taskMatches.push({ task, score });
        }
      });

      taskMatches.sort((a, b) => b.score - a.score);
      taskMatches.slice(0, 5).forEach(({ task }) => {
        suggestions.push({
          type: 'task',
          text: task.name,
          label: task.name,
          taskId: task.id
        });
      });

      // Suggest property names
      const allPropertyNames = getAllPropertyNames();
      allPropertyNames.forEach(propName => {
        if (fuzzyMatch(propName, query)) {
          suggestions.push({
            type: 'property',
            text: propName,
            label: propName,
            category: 'property'
          });
        }
      });

      // Suggest common property:value combinations
      allPropertyNames.forEach(propName => {
        if (fuzzyMatch(propName, query)) {
          const valueSet = new Set<string>();
          tasks.forEach(task => {
            const value = task.customProperties?.[propName];
            if (value) {
              valueSet.add(String(value));
            }
          });

          Array.from(valueSet).slice(0, 2).forEach(value => {
            suggestions.push({
              type: 'property-value',
              text: `${propName}:${value}`,
              label: value,
              category: propName
            });
          });
        }
      });
    }

    // Remove duplicates and limit
    const seen = new Set<string>();
    return suggestions.filter(s => {
      if (seen.has(s.text)) return false;
      seen.add(s.text);
      return true;
    }).slice(0, limit);
  };

  // Start time tracking for a task
  const startTimeTracking = async (taskId: string): Promise<Task> => {
    try {
      // Stop any currently active tracking first
      if (activeTimeTracking && activeTimeTracking !== taskId) {
        await stopTimeTracking(activeTimeTracking);
      }

      const updatedTask = await apiClient.startTimeTracking(taskId);

      setTasks(prev => prev.map(t =>
        t.id === taskId ? updatedTask : t
      ));

      setActiveTimeTracking(taskId);
      return updatedTask;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Stop time tracking for a task
  const stopTimeTracking = async (taskId: string): Promise<Task> => {
    try {
      const updatedTask = await apiClient.stopTimeTracking(taskId);

      setTasks(prev => prev.map(t =>
        t.id === taskId ? updatedTask : t
      ));

      if (activeTimeTracking === taskId) {
        setActiveTimeTracking(null);
      }

      return updatedTask;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Toggle time tracking for a task
  const toggleTimeTracking = async (taskId: string): Promise<Task> => {
    if (activeTimeTracking === taskId) {
      return await stopTimeTracking(taskId);
    } else {
      return await startTimeTracking(taskId);
    }
  };

  const value: TaskContextValue = {
    tasks,
    loading,
    error,
    taskRelationships,
    availableProperties,
    filters,
    activeTimeTracking,
    getRootTasks,
    getChildren,
    createTask,
    updateTask,
    deleteTask,
    addSubtask,
    removeSubtask,
    loadAllTasks,
    addCustomProperty,
    getAllPropertyNames,
    setFilters,
    matchesFilters,
    search,
    getSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    startTimeTracking,
    stopTimeTracking,
    toggleTimeTracking
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
