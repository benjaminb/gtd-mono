const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

// Note: These routes assume authentication middleware is applied at the app level
// and req.user is populated with the authenticated user's information

/**
 * GET /api/payment-methods
 * List all payment methods for the current user
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const paymentMethods = await paymentService.getPaymentMethods(req.user.userId);
    res.json({ paymentMethods });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      error: 'Failed to retrieve payment methods',
      message: error.message,
    });
  }
});

/**
 * POST /api/payment-methods
 * Add a new payment method
 * Body: { stripePaymentMethodId: string }
 */
router.post('/', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { stripePaymentMethodId } = req.body;

    if (!stripePaymentMethodId) {
      return res.status(400).json({
        error: 'Missing required field: stripePaymentMethodId',
      });
    }

    const paymentMethod = await paymentService.addPaymentMethod(
      req.user.userId,
      stripePaymentMethodId
    );

    res.status(201).json({
      message: 'Payment method added successfully',
      paymentMethod,
    });
  } catch (error) {
    console.error('Error adding payment method:', error);

    if (error.message === 'User does not have a Stripe customer ID') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Please create a subscription first',
      });
    }

    res.status(500).json({
      error: 'Failed to add payment method',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/payment-methods/:id
 * Remove a payment method
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id: paymentMethodId } = req.params;

    await paymentService.removePaymentMethod(req.user.userId, paymentMethodId);

    res.json({
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    console.error('Error removing payment method:', error);

    if (error.message === 'Payment method not found') {
      return res.status(404).json({
        error: 'Not found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to remove payment method',
      message: error.message,
    });
  }
});

/**
 * PUT /api/payment-methods/:id/default
 * Set a payment method as default
 */
router.put('/:id/default', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id: paymentMethodId } = req.params;

    const paymentMethod = await paymentService.setDefaultPaymentMethod(
      req.user.userId,
      paymentMethodId
    );

    res.json({
      message: 'Default payment method updated',
      paymentMethod,
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);

    if (error.message === 'Payment method not found') {
      return res.status(404).json({
        error: 'Not found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to set default payment method',
      message: error.message,
    });
  }
});

/**
 * GET /api/payment-methods/default
 * Get the default payment method
 */
router.get('/default', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const paymentMethod = await paymentService.getDefaultPaymentMethod(req.user.userId);

    if (!paymentMethod) {
      return res.status(404).json({
        error: 'No default payment method found',
      });
    }

    res.json({ paymentMethod });
  } catch (error) {
    console.error('Error getting default payment method:', error);
    res.status(500).json({
      error: 'Failed to retrieve default payment method',
      message: error.message,
    });
  }
});

module.exports = router;
