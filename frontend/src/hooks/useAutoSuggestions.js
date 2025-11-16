import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import api from '../services/api';

/**
 * Custom hook for automatic AI suggestions
 * Triggers suggestions when a task is focused, with debouncing to avoid excessive API calls
 */
export function useAutoSuggestions(focusedTask, options = {}) {
  const {
    debounceMs = 2000, // Wait 2 seconds after focus before generating suggestions
    enabled = true,
    suggestionType = 'subtasks', // 'subtasks', 'properties', or 'both'
    onSuggestionsGenerated = null // Callback when suggestions are created
  } = options;

  const { user } = useAuth();
  const { loadAllTasks } = useTask();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const lastGeneratedRef = useRef(new Set()); // Track which tasks we've generated suggestions for

  useEffect(() => {
    if (!enabled || !focusedTask || !user) {
      return;
    }

    // Check if we've already generated suggestions for this task in this session
    if (lastGeneratedRef.current.has(focusedTask.id)) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for generating suggestions
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsGenerating(true);
        setError(null);

        // Mark this task as processed
        lastGeneratedRef.current.add(focusedTask.id);

        let result = null;

        if (suggestionType === 'subtasks' || suggestionType === 'both') {
          result = await api.getSuggestionsSubtasks(focusedTask.id, user.id);
          console.log(`Generated ${result.count} subtask suggestions for task: ${focusedTask.name}`);
        }

        // Note: Property suggestions are returned but not auto-applied
        // They could be shown in a separate UI element if needed
        if (suggestionType === 'properties' || suggestionType === 'both') {
          result = await api.getSuggestionsProperties(focusedTask.id, []);
        }

        // Reload all tasks to include the new suggestions
        await loadAllTasks();

        // Trigger callback if provided
        if (onSuggestionsGenerated && result) {
          onSuggestionsGenerated(result);
        }
      } catch (err) {
        console.error('Error generating suggestions:', err);
        setError(err.message);
        // Remove from processed set so we can retry later
        lastGeneratedRef.current.delete(focusedTask.id);
      } finally {
        setIsGenerating(false);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [focusedTask, user, enabled, debounceMs, suggestionType, loadAllTasks, onSuggestionsGenerated]);

  return {
    isGenerating,
    error,
    clearHistory: () => lastGeneratedRef.current.clear()
  };
}
