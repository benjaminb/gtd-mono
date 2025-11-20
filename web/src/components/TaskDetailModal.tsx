import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, TaskFieldSuggestion, SubtaskSuggestion } from '../types';
import { apiClient } from '../api/client';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  isCreating?: boolean;
  onClose: () => void;
  onSave?: (task: Partial<Task>) => void;
  onRefresh?: () => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  isCreating = false,
  onClose,
  onSave,
  onRefresh,
}: TaskDetailModalProps) {
  const [fieldSuggestions, setFieldSuggestions] = useState<TaskFieldSuggestion[]>([]);
  const [subtaskSuggestions, setSubtaskSuggestions] = useState<SubtaskSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'properties' | 'subtasks'>('properties');

  // Fetch AI suggestions when opening an existing task
  useEffect(() => {
    if (isOpen && task && !isCreating) {
      loadSuggestions();
    }
  }, [isOpen, task, isCreating]);

  const loadSuggestions = async () => {
    if (!task) return;

    setIsLoadingSuggestions(true);
    try {
      const [fieldsRes, subtasksRes] = await Promise.all([
        apiClient.suggestFields(task.taskId),
        apiClient.suggestSubtasks(task.taskId),
      ]);

      if (fieldsRes.success) {
        setFieldSuggestions(fieldsRes.suggestions);
      }
      if (subtasksRes.success) {
        setSubtaskSuggestions(subtasksRes.subtasks);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleCreateSubtask = async (suggestion: SubtaskSuggestion) => {
    if (!task) return;

    try {
      const result = await apiClient.createTask({
        name: suggestion.name,
        description: suggestion.description,
      });

      if (result.success && result.task) {
        // Make it a subtask of the current task
        await apiClient.makeSubtask(result.task.taskId, { parentId: task.taskId });
        onRefresh?.();

        // Remove this suggestion
        setSubtaskSuggestions((prev) =>
          prev.filter((s) => s.name !== suggestion.name)
        );
      }
    } catch (error) {
      console.error('Failed to create subtask:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                {isCreating ? 'New Task' : task?.name}
              </h2>
              {task?.done && (
                <span className="inline-flex items-center gap-1 text-sm text-green-400 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Completed
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          {!isCreating && (
            <div className="px-6 pt-4 flex gap-4 border-b border-slate-700">
              <button
                onClick={() => setActiveTab('properties')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'properties'
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActiveTab('subtasks')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'subtasks'
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                Subtasks
                {subtaskSuggestions.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {subtaskSuggestions.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'properties' && (
              <div className="space-y-6">
                {/* Current Fields */}
                {task?.fields && task.fields.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">
                      Current Properties
                    </h3>
                    <div className="space-y-2">
                      {task.fields.map((field, index) => (
                        <div
                          key={index}
                          className="bg-slate-700/50 rounded-lg p-3 flex justify-between items-start"
                        >
                          <div>
                            <div className="text-sm text-slate-400">
                              {field.field.properties.name}
                            </div>
                            <div className="text-slate-100 mt-1">
                              {field.field.properties.value}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              field.type === 'HAS_BASE_FIELD'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {field.type === 'HAS_BASE_FIELD' ? 'System' : 'Custom'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                {fieldSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Suggested Properties
                    </h3>
                    <div className="space-y-2">
                      {fieldSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-slate-700/30 rounded-lg p-3 border border-slate-600 hover:border-blue-500 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="text-slate-100 font-medium flex items-center gap-2">
                                {suggestion.name}
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    suggestion.priority === 'high'
                                      ? 'bg-red-500/20 text-red-300'
                                      : suggestion.priority === 'medium'
                                      ? 'bg-yellow-500/20 text-yellow-300'
                                      : 'bg-green-500/20 text-green-300'
                                  }`}
                                >
                                  {suggestion.priority}
                                </span>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                {suggestion.reason}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Type: {suggestion.type}
                              </div>
                            </div>
                            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors">
                              Add
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {isLoadingSuggestions && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subtasks' && (
              <div className="space-y-6">
                {/* AI Suggested Subtasks */}
                {subtaskSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Suggested Breakdown
                    </h3>
                    <div className="space-y-2">
                      {subtaskSuggestions
                        .sort((a, b) => a.order - b.order)
                        .map((suggestion, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-slate-700/30 rounded-lg p-4 border border-slate-600 hover:border-blue-500 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-medium">
                                {suggestion.order}
                              </div>
                              <div className="flex-1">
                                <div className="text-slate-100 font-medium">
                                  {suggestion.name}
                                </div>
                                <div className="text-sm text-slate-400 mt-1">
                                  {suggestion.description}
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                  Estimated time: {suggestion.estimatedTime} min
                                </div>
                              </div>
                              <button
                                onClick={() => handleCreateSubtask(suggestion)}
                                className="flex-shrink-0 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                              >
                                Create
                              </button>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}

                {subtaskSuggestions.length === 0 && !isLoadingSuggestions && (
                  <div className="text-center py-8 text-slate-400">
                    No subtask suggestions available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
