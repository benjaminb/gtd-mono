const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: username, email, password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        error: 'Username already taken'
      });
    }

    const user = await User.create({ username, email, password });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * POST /api/users/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: email, password'
      });
    }

    const user = await User.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.update(req.params.id, updates);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', async (req, res) => {
  try {
    await User.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/users/:id/tasks
 * Get all tasks for a user
 */
router.get('/:id/tasks', async (req, res) => {
  try {
    const tasks = await User.getTasks(req.params.id);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

module.exports = router;
