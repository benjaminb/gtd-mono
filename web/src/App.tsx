import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommandBar } from './components/CommandBar';
import { TaskItem } from './components/TaskItem';
import { TaskDetailModal } from './components/TaskDetailModal';
import { apiClient } from './api/client';
import type { Task } from './types';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      const response = await apiClient.getTasks();
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Global keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // If not typing and not a modifier key, open command bar
      if (!isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Ignore special keys
        if (
          e.key.length === 1 &&
          !isCommandBarOpen &&
          !isTaskDetailOpen
        ) {
          e.preventDefault();
          setIsCommandBarOpen(true);
        }
      }

      // CMD/CTRL + K to open command bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandBarOpen, isTaskDetailOpen]);

  // Create task
  const handleCreateTask = async (name: string) => {
    try {
      const response = await apiClient.createTask({
        name,
        description: '',
      });

      if (response.success && response.task) {
        setTasks((prev) => [response.task, ...prev]);
        // Open detail modal for new task
        setSelectedTask(response.task);
        setIsCreatingTask(true);
        setIsTaskDetailOpen(true);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  // Update task
  const handleUpdateTask = async (
    taskId: string,
    updates: { name?: string; done?: boolean }
  ) => {
    try {
      const response = await apiClient.updateTask(taskId, updates);

      if (response.success && response.task) {
        setTasks((prev) =>
          prev.map((t) => (t.taskId === taskId ? response.task : t))
        );
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await apiClient.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Select task
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setIsCreatingTask(false);
    setIsTaskDetailOpen(true);
  };

  // Close task detail
  const handleCloseTaskDetail = () => {
    setIsTaskDetailOpen(false);
    setIsCreatingTask(false);
    setTimeout(() => setSelectedTask(null), 200);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">GTD Tasks</h1>
              <p className="text-sm text-slate-400 mt-1">
                Press any key to search, or{' '}
                <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">⌘K</kbd> to
                open command bar
              </p>
            </div>
            <button
              onClick={() => setIsCommandBarOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Task
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 2 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">
              No tasks yet
            </h2>
            <p className="text-slate-500 mb-6">
              Start by creating your first task
            </p>
            <button
              onClick={() => setIsCommandBarOpen(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Task
            </button>
          </motion.div>
        ) : (
          <>
            {/* Task Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700"
              >
                <div className="text-sm text-slate-400 mb-1">Total Tasks</div>
                <div className="text-2xl font-bold text-slate-100">{tasks.length}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700"
              >
                <div className="text-sm text-slate-400 mb-1">Completed</div>
                <div className="text-2xl font-bold text-green-400">
                  {tasks.filter((t) => t.done).length}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700"
              >
                <div className="text-sm text-slate-400 mb-1">In Progress</div>
                <div className="text-2xl font-bold text-blue-400">
                  {tasks.filter((t) => !t.done).length}
                </div>
              </motion.div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              <AnimatePresence>
                {tasks.map((task) => (
                  <TaskItem
                    key={task.taskId}
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onSelect={handleSelectTask}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Command Bar */}
      <CommandBar
        tasks={tasks}
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onSelectTask={handleSelectTask}
        onCreateTask={handleCreateTask}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskDetailOpen}
        isCreating={isCreatingTask}
        onClose={handleCloseTaskDetail}
        onRefresh={loadTasks}
      />
    </div>
  );
}

export default App;
