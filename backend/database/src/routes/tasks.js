const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');
const aiSuggestionService = require('../services/aiSuggestionService');

// Note: These routes assume authentication middleware is applied at the app level
// and req.user is populated with the authenticated user's information

/**
 * GET /api/tasks
 * Get all tasks for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await taskService.getUserTasks(req.user.userId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ tasks: result.tasks });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({
      error: 'Failed to retrieve tasks',
      message: error.message,
    });
  }
});

/**
 * GET /api/tasks/:id
 * Get a specific task by ID
 */
router.get('/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await taskService.getTask(req.params.id, req.user.userId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({
      error: 'Failed to retrieve task',
      message: error.message,
    });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, description, done } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Task name is required' });
    }

    const result = await taskService.createTask({
      userId: req.user.userId,
      name: name.trim(),
      description: description || '',
      done: done || false,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      error: 'Failed to create task',
      message: error.message,
    });
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task
 */
router.put('/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, done } = req.body;

    const result = await taskService.updateTask({
      taskId: req.params.id,
      userId: req.user.userId,
      name,
      done,
    });

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      error: 'Failed to update task',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await taskService.deleteTask(req.params.id, req.user.userId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      error: 'Failed to delete task',
      message: error.message,
    });
  }
});

/**
 * POST /api/tasks/:id/make-subtask
 * Make an existing task a subtask of another task
 * Enforces one-to-one parent relationship and prevents cycles
 */
router.post('/:childId/make-subtask', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { parentId } = req.body;

    if (!parentId) {
      return res.status(400).json({ error: 'Parent task ID is required' });
    }

    const result = await taskService.makeSubtask({
      parentId,
      childId: req.params.childId,
      userId: req.user.userId,
    });

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        details: result.details,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error making subtask:', error);
    res.status(500).json({
      error: 'Failed to create subtask relationship',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/tasks/:id/subtask-relationship
 * Remove subtask relationship (make task independent)
 */
router.delete('/:id/subtask-relationship', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await taskService.removeSubtaskRelationship({
      childId: req.params.id,
      userId: req.user.userId,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error removing subtask relationship:', error);
    res.status(500).json({
      error: 'Failed to remove subtask relationship',
      message: error.message,
    });
  }
});

/**
 * GET /api/tasks/:id/parent
 * Get the parent task of a subtask
 */
router.get('/:id/parent', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await taskService.getParentTask(req.params.id, req.user.userId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting parent task:', error);
    res.status(500).json({
      error: 'Failed to retrieve parent task',
      message: error.message,
    });
  }
});

/**
 * POST /api/tasks/:id/suggest-fields
 * Get AI suggestions for task fields
 */
router.post('/:id/suggest-fields', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the task first
    const taskResult = await taskService.getTask(req.params.id, req.user.userId);

    if (!taskResult.success) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { task, fields } = taskResult;

    // Get AI suggestions
    const result = await aiSuggestionService.suggestTaskFields({
      taskName: task.name,
      taskDescription: fields.find(f => f.field?.properties?.name === 'notes')?.field?.properties?.value || '',
      existingFields: fields.map(f => f.field?.properties?.name).filter(Boolean),
      userId: req.user.userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error suggesting task fields:', error);
    res.status(500).json({
      error: 'Failed to generate field suggestions',
      message: error.message,
    });
  }
});

/**
 * POST /api/tasks/:id/suggest-subtasks
 * Get AI suggestions for breaking down a task into subtasks
 */
router.post('/:id/suggest-subtasks', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the task first
    const taskResult = await taskService.getTask(req.params.id, req.user.userId);

    if (!taskResult.success) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { task, fields } = taskResult;

    // Get AI suggestions
    const result = await aiSuggestionService.suggestSubtasks({
      taskName: task.name,
      taskDescription: fields.find(f => f.field?.properties?.name === 'notes')?.field?.properties?.value || '',
      userId: req.user.userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error suggesting subtasks:', error);
    res.status(500).json({
      error: 'Failed to generate subtask suggestions',
      message: error.message,
    });
  }
});

/**
 * POST /api/tasks/insights
 * Get AI-powered insights about user's tasks
 */
router.post('/insights', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get all user tasks
    const tasksResult = await taskService.getUserTasks(req.user.userId);

    if (!tasksResult.success) {
      return res.status(500).json({ error: tasksResult.error });
    }

    // Generate insights
    const result = await aiSuggestionService.generateTaskInsights({
      tasks: tasksResult.tasks,
      userId: req.user.userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      message: error.message,
    });
  }
});

module.exports = router;
