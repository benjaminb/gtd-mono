const express = require('express');
const router = express.Router();
const PropertySchema = require('../models/PropertySchema');

/**
 * POST /api/property-schemas
 * Create a new property schema
 * Body: { userId, propertyName, dataType, constraints }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, propertyName, dataType, constraints } = req.body;

    if (!userId || !propertyName) {
      return res.status(400).json({
        error: 'Missing required fields: userId, propertyName'
      });
    }

    // Check if schema already exists
    const existing = await PropertySchema.findByName(userId, propertyName);
    if (existing) {
      return res.status(409).json({
        error: 'Property schema already exists',
        schema: existing
      });
    }

    const schema = await PropertySchema.create({
      userId,
      propertyName,
      dataType: dataType || 'text',
      constraints: constraints || {}
    });

    res.status(201).json(schema);
  } catch (error) {
    console.error('Error creating property schema:', error);
    res.status(500).json({ error: 'Failed to create property schema' });
  }
});

/**
 * GET /api/property-schemas/:id
 * Get property schema by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const schema = await PropertySchema.findById(req.params.id);
    if (!schema) {
      return res.status(404).json({ error: 'Property schema not found' });
    }
    res.json(schema);
  } catch (error) {
    console.error('Error fetching property schema:', error);
    res.status(500).json({ error: 'Failed to fetch property schema' });
  }
});

/**
 * GET /api/property-schemas/user/:userId
 * Get all property schemas for a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const schemas = await PropertySchema.getUserSchemas(req.params.userId);
    res.json(schemas);
  } catch (error) {
    console.error('Error fetching user property schemas:', error);
    res.status(500).json({ error: 'Failed to fetch property schemas' });
  }
});

/**
 * PUT /api/property-schemas/:id
 * Update property schema
 * Body: { dataType, constraints }
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const schema = await PropertySchema.update(req.params.id, updates);

    if (!schema) {
      return res.status(404).json({ error: 'Property schema not found' });
    }

    res.json(schema);
  } catch (error) {
    console.error('Error updating property schema:', error);
    res.status(500).json({ error: 'Failed to update property schema' });
  }
});

/**
 * DELETE /api/property-schemas/:id
 * Delete property schema
 */
router.delete('/:id', async (req, res) => {
  try {
    await PropertySchema.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting property schema:', error);
    res.status(500).json({ error: 'Failed to delete property schema' });
  }
});

/**
 * POST /api/property-schemas/validate
 * Validate a property value against its schema
 * Body: { userId, propertyName, value }
 */
router.post('/validate', async (req, res) => {
  try {
    const { userId, propertyName, value } = req.body;

    if (!userId || !propertyName) {
      return res.status(400).json({
        error: 'Missing required fields: userId, propertyName'
      });
    }

    const schema = await PropertySchema.findByName(userId, propertyName);
    if (!schema) {
      // No schema defined, allow any value (default to text)
      return res.json({ valid: true });
    }

    const validation = PropertySchema.validateValue(schema, value);
    res.json(validation);
  } catch (error) {
    console.error('Error validating property value:', error);
    res.status(500).json({ error: 'Failed to validate property value' });
  }
});

module.exports = router;
