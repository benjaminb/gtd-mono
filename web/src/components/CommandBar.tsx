import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import type { Task, SearchResult } from '../types';

interface CommandBarProps {
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
  onCreateTask: (name: string) => void;
}

export function CommandBar({
  tasks,
  isOpen,
  onClose,
  onSelectTask,
  onCreateTask,
}: CommandBarProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fuzzy search configuration
  const fuse = useRef(
    new Fuse(tasks, {
      keys: ['name', 'fields.field.properties.value'],
      threshold: 0.4,
      includeScore: true,
    })
  );

  // Update fuse index when tasks change
  useEffect(() => {
    fuse.current = new Fuse(tasks, {
      keys: ['name', 'fields.field.properties.value'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [tasks]);

  // Perform fuzzy search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchResults = fuse.current.search(query);
    const taskResults: SearchResult[] = searchResults.slice(0, 5).map((result) => ({
      type: 'task',
      id: result.item.taskId,
      title: result.item.name,
      subtitle: result.item.done ? '✓ Completed' : 'In Progress',
      data: result.item,
      score: result.score,
    }));

    // Check if query closely matches any existing task
    const hasCloseMatch = searchResults.length > 0 && (searchResults[0].score || 1) < 0.3;

    // Add "create new task" option if no close match
    const finalResults: SearchResult[] = [];

    if (!hasCloseMatch && query.trim().length > 0) {
      finalResults.push({
        type: 'create',
        title: `Create task: "${query}"`,
        subtitle: 'Press Enter to create',
      });
    }

    finalResults.push(...taskResults);
    setResults(finalResults);
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (results.length > 0) {
            const selected = results[selectedIndex];
            if (selected.type === 'create') {
              onCreateTask(query);
              onClose();
            } else if (selected.type === 'task' && selected.data) {
              onSelectTask(selected.data);
              onClose();
            }
          }
          break;
      }
    },
    [results, selectedIndex, query, onClose, onSelectTask, onCreateTask]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Command Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl mx-4"
        >
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tasks or type to create..."
                className="w-full bg-transparent px-12 py-4 text-slate-100 placeholder-slate-500 focus:outline-none text-lg"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Results */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="border-t border-slate-700"
                >
                  <div className="max-h-96 overflow-y-auto py-2">
                    {results.map((result, index) => (
                      <motion.button
                        key={`${result.type}-${result.id || index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => {
                          if (result.type === 'create') {
                            onCreateTask(query);
                          } else if (result.type === 'task' && result.data) {
                            onSelectTask(result.data);
                          }
                          onClose();
                        }}
                        className={`w-full px-4 py-3 flex items-start gap-3 transition-colors text-left ${
                          index === selectedIndex
                            ? 'bg-blue-600/20 border-l-4 border-blue-500'
                            : 'border-l-4 border-transparent hover:bg-slate-700/50'
                        }`}
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {result.type === 'create' ? (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div
                              className={`w-5 h-5 rounded ${
                                result.subtitle?.includes('Completed')
                                  ? 'bg-green-500'
                                  : 'bg-slate-600'
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-100 font-medium truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-sm text-slate-400 truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>

                        {/* Keyboard hint */}
                        {index === selectedIndex && (
                          <div className="flex-shrink-0 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                            ↵
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer with hints */}
            <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <div className="flex gap-4">
                <span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded">↑↓</kbd> Navigate
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded">↵</kbd> Select
                </span>
                <span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded">ESC</kbd> Close
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
