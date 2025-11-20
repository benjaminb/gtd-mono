import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onUpdate: (taskId: string, updates: { name?: string; done?: boolean }) => void;
  onDelete: (taskId: string) => void;
  onSelect: (task: Task) => void;
}

export function TaskItem({ task, onUpdate, onDelete, onSelect }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      // ESC saves changes and exits edit mode
      if (editValue.trim() && editValue !== task.name) {
        onUpdate(task.taskId, { name: editValue.trim() });
      }
      setIsEditing(false);
    } else if (e.key === 'Enter') {
      // Enter also saves and exits
      if (editValue.trim() && editValue !== task.name) {
        onUpdate(task.taskId, { name: editValue.trim() });
      }
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    // Save changes when input loses focus
    if (editValue.trim() && editValue !== task.name) {
      onUpdate(task.taskId, { name: editValue.trim() });
    }
    setIsEditing(false);
  };

  const toggleDone = () => {
    onUpdate(task.taskId, { done: !task.done });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="group"
    >
      <div className="bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
        <div className="p-4 flex items-center gap-3">
          {/* Checkbox */}
          <button
            onClick={toggleDone}
            className="flex-shrink-0 w-5 h-5 rounded border-2 border-slate-600 hover:border-blue-500 transition-colors flex items-center justify-center"
          >
            {task.done && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            )}
          </button>

          {/* Task name */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="w-full bg-slate-700 px-2 py-1 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className={`text-left w-full ${
                  task.done ? 'text-slate-500 line-through' : 'text-slate-100'
                } hover:text-blue-400 transition-colors`}
              >
                {task.name}
              </button>
            )}
          </div>

          {/* Subtask count */}
          {(task.subtaskCount ?? 0) > 0 && (
            <div className="flex-shrink-0 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
              {task.subtaskCount} subtask{task.subtaskCount !== 1 ? 's' : ''}
            </div>
          )}

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onSelect(task)}
              className="text-slate-400 hover:text-blue-400 transition-colors"
              title="View details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.taskId)}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Delete task"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Task fields preview */}
        {task.fields && task.fields.length > 0 && (
          <div className="px-4 pb-3 pt-0">
            <div className="flex flex-wrap gap-2">
              {task.fields.slice(0, 3).map((field, index) => (
                <div
                  key={index}
                  className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded"
                >
                  <span className="text-slate-500">{field.field.properties.name}:</span>{' '}
                  {field.field.properties.value.substring(0, 30)}
                  {field.field.properties.value.length > 30 ? '...' : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
