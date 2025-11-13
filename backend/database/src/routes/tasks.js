const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const { userId, name, done, customProperties } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        error: 'Missing required fields: userId, name'
      });
    }

    const task = await Task.create({
      userId,
      name,
      done: done || false,
      customProperties: customProperties || {}
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * GET /api/tasks/:id
 * Get task by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * PUT /api/tasks/:id
 * Update task
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const task = await Task.update(req.params.id, updates);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete task
 */
router.delete('/:id', async (req, res) => {
  try {
    await Task.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

/**
 * POST /api/tasks/:id/subtasks
 * Add a subtask relationship
 * Body: { childId: <task-id> }
 */
router.post('/:id/subtasks', async (req, res) => {
  try {
    const { childId } = req.body;

    if (!childId) {
      return res.status(400).json({
        error: 'Missing required field: childId'
      });
    }

    const result = await Task.addSubtask(req.params.id, childId);

    if (!result) {
      return res.status(404).json({
        error: 'Parent or child task not found'
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error adding subtask:', error);
    res.status(500).json({ error: 'Failed to add subtask' });
  }
});

/**
 * DELETE /api/tasks/:id/subtasks/:childId
 * Remove a subtask relationship
 */
router.delete('/:id/subtasks/:childId', async (req, res) => {
  try {
    await Task.removeSubtask(req.params.id, req.params.childId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing subtask:', error);
    res.status(500).json({ error: 'Failed to remove subtask' });
  }
});

/**
 * GET /api/tasks/:id/subtasks
 * Get all subtasks of a task
 */
router.get('/:id/subtasks', async (req, res) => {
  try {
    const subtasks = await Task.getSubtasks(req.params.id);
    res.json(subtasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

/**
 * GET /api/tasks/:id/parents
 * Get all parent tasks of a task
 */
router.get('/:id/parents', async (req, res) => {
  try {
    const parents = await Task.getParents(req.params.id);
    res.json(parents);
  } catch (error) {
    console.error('Error fetching parent tasks:', error);
    res.status(500).json({ error: 'Failed to fetch parent tasks' });
  }
});

/**
 * GET /api/tasks/:id/hierarchy
 * Get task with full hierarchy (subtasks recursively)
 */
router.get('/:id/hierarchy', async (req, res) => {
  try {
    const maxDepth = parseInt(req.query.maxDepth) || 10;
    const hierarchy = await Task.getHierarchy(req.params.id, maxDepth);

    if (!hierarchy) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching task hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch task hierarchy' });
  }
});

/**
 * GET /api/tasks/:id/owner
 * Get the owner of a task
 */
router.get('/:id/owner', async (req, res) => {
  try {
    const owner = await Task.getOwner(req.params.id);

    if (!owner) {
      return res.status(404).json({ error: 'Task or owner not found' });
    }

    res.json(owner);
  } catch (error) {
    console.error('Error fetching task owner:', error);
    res.status(500).json({ error: 'Failed to fetch task owner' });
  }
});

module.exports = router;
