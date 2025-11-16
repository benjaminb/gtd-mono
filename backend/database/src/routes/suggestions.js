const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const llmService = require('../services/llm/LLMService');

/**
 * POST /api/suggestions/subtasks
 * Generate subtask suggestions for a given task
 * Body: { taskId: string, userId: string }
 */
router.post('/subtasks', async (req, res) => {
  try {
    const { taskId, userId } = req.body;

    if (!taskId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: taskId, userId'
      });
    }

    // Get the parent task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get existing subtasks
    const existingSubtasks = await Task.getSubtasks(taskId);

    // Generate suggestions using LLM
    const suggestions = await llmService.suggestSubtasks(task, existingSubtasks);

    // Create suggested tasks in the database
    const createdSuggestions = [];
    for (const suggestion of suggestions) {
      const newTask = await Task.create({
        userId,
        name: suggestion.name,
        done: false,
        source: 'ai-suggested',
        suggestionMetadata: suggestion.suggestionMetadata,
        customProperties: suggestion.customProperties
      });

      // Add as subtask
      await Task.addSubtask(taskId, newTask.id);

      createdSuggestions.push(newTask);
    }

    res.json({
      parentTaskId: taskId,
      suggestions: createdSuggestions,
      count: createdSuggestions.length
    });
  } catch (error) {
    console.error('Error generating subtask suggestions:', error);
    res.status(500).json({
      error: 'Failed to generate suggestions',
      message: error.message
    });
  }
});

/**
 * POST /api/suggestions/properties
 * Generate property suggestions for a given task
 * Body: { taskId: string, allPropertyNames: string[] }
 */
router.post('/properties', async (req, res) => {
  try {
    const { taskId, allPropertyNames = [] } = req.body;

    if (!taskId) {
      return res.status(400).json({
        error: 'Missing required field: taskId'
      });
    }

    // Get the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Generate property suggestions using LLM
    const suggestions = await llmService.suggestProperties(task, allPropertyNames);

    res.json({
      taskId,
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error('Error generating property suggestions:', error);
    res.status(500).json({
      error: 'Failed to generate property suggestions',
      message: error.message
    });
  }
});

/**
 * POST /api/suggestions/related-tasks
 * Generate related task suggestions (siblings) for a given task
 * Body: { taskId: string, userId: string }
 */
router.post('/related-tasks', async (req, res) => {
  try {
    const { taskId, userId } = req.body;

    if (!taskId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: taskId, userId'
      });
    }

    // Get the current task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get sibling tasks (tasks with the same parent)
    const parents = await Task.getParents(taskId);
    let siblingTasks = [];

    if (parents.length > 0) {
      // Has parents - get siblings
      const parentId = parents[0].id;
      const allSubtasks = await Task.getSubtasks(parentId);
      siblingTasks = allSubtasks.filter(t => t.id !== taskId);
    } else {
      // Root task - get other root tasks
      const owner = await Task.getOwner(taskId);
      if (owner) {
        const allUserTasks = await User.getTasks(owner.id);
        // Filter for root tasks (those that don't have parents)
        // This is a simplified approach - in production you'd want a more efficient query
        siblingTasks = allUserTasks.filter(t => t.id !== taskId);
      }
    }

    // Generate suggestions using LLM
    const suggestions = await llmService.suggestRelatedTasks(task, siblingTasks);

    // Create suggested tasks in the database
    const createdSuggestions = [];
    for (const suggestion of suggestions) {
      const newTask = await Task.create({
        userId,
        name: suggestion.name,
        done: false,
        source: 'ai-suggested',
        suggestionMetadata: suggestion.suggestionMetadata,
        customProperties: {}
      });

      // If original task has a parent, add suggestion as sibling
      if (parents.length > 0) {
        await Task.addSubtask(parents[0].id, newTask.id);
      }

      createdSuggestions.push(newTask);
    }

    res.json({
      relatedToTaskId: taskId,
      suggestions: createdSuggestions,
      count: createdSuggestions.length
    });
  } catch (error) {
    console.error('Error generating related task suggestions:', error);
    res.status(500).json({
      error: 'Failed to generate related task suggestions',
      message: error.message
    });
  }
});

/**
 * GET /api/suggestions/status
 * Check LLM service status and configuration
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      configured: llmService.isConfigured(),
      provider: llmService.getProviderName()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check status' });
  }
});

module.exports = router;
