const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');

// Note: These routes assume authentication middleware is applied at the app level
// and req.user is populated with the authenticated user's information

/**
 * GET /api/subscriptions/plans
 * List all available subscription plans
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json({ plans });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      error: 'Failed to retrieve subscription plans',
      message: error.message,
    });
  }
});

/**
 * GET /api/subscriptions/current
 * Get current user's subscription
 */
router.get('/current', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await subscriptionService.getUserSubscription(req.user.userId);

    if (!subscription) {
      return res.status(404).json({
        error: 'No subscription found',
        message: 'You do not have an active subscription',
      });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({
      error: 'Failed to retrieve subscription',
      message: error.message,
    });
  }
});

/**
 * POST /api/subscriptions/create
 * Create a new subscription
 * Body: { planId: string, paymentMethodId?: string }
 */
router.post('/create', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { planId, paymentMethodId } = req.body;

    if (!planId) {
      return res.status(400).json({
        error: 'Missing required field: planId',
      });
    }

    const subscription = await subscriptionService.createSubscription(
      req.user.userId,
      planId,
      paymentMethodId
    );

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);

    if (error.message === 'User already has an active subscription') {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to create subscription',
      message: error.message,
    });
  }
});

/**
 * PUT /api/subscriptions/update
 * Update subscription (upgrade/downgrade)
 * Body: { newPlanId: string }
 */
router.put('/update', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { newPlanId } = req.body;

    if (!newPlanId) {
      return res.status(400).json({
        error: 'Missing required field: newPlanId',
      });
    }

    // Get current subscription
    const currentSubscription = await subscriptionService.getUserSubscription(req.user.userId);

    if (!currentSubscription) {
      return res.status(404).json({
        error: 'No active subscription found',
      });
    }

    const updatedSubscription = await subscriptionService.updateSubscription(
      currentSubscription.subscription.subscriptionId,
      newPlanId
    );

    res.json(updatedSubscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      error: 'Failed to update subscription',
      message: error.message,
    });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel subscription
 * Body: { immediate?: boolean }
 */
router.post('/cancel', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { immediate } = req.body;

    // Get current subscription
    const currentSubscription = await subscriptionService.getUserSubscription(req.user.userId);

    if (!currentSubscription) {
      return res.status(404).json({
        error: 'No active subscription found',
      });
    }

    const canceledSubscription = await subscriptionService.cancelSubscription(
      currentSubscription.subscription.subscriptionId,
      immediate || false
    );

    res.json({
      message: immediate
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at the end of the billing period',
      subscription: canceledSubscription,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error.message,
    });
  }
});

/**
 * POST /api/subscriptions/reactivate
 * Reactivate a canceled subscription
 */
router.post('/reactivate', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get current subscription
    const currentSubscription = await subscriptionService.getUserSubscription(req.user.userId);

    if (!currentSubscription) {
      return res.status(404).json({
        error: 'No subscription found',
      });
    }

    const reactivatedSubscription = await subscriptionService.reactivateSubscription(
      currentSubscription.subscription.subscriptionId
    );

    res.json({
      message: 'Subscription reactivated successfully',
      subscription: reactivatedSubscription,
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);

    if (error.message === 'Subscription is not set to cancel') {
      return res.status(400).json({
        error: 'Bad request',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to reactivate subscription',
      message: error.message,
    });
  }
});

/**
 * GET /api/subscriptions/usage
 * Get usage statistics for the current user
 */
router.get('/usage', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await subscriptionService.getUserSubscription(req.user.userId);

    if (!subscription) {
      return res.status(404).json({
        error: 'No subscription found',
      });
    }

    const tasks = await subscriptionService.checkUsageLimit(req.user.userId, 'tasks');
    const projects = await subscriptionService.checkUsageLimit(req.user.userId, 'projects');
    const timeEntries = await subscriptionService.checkUsageLimit(req.user.userId, 'timeEntries');

    res.json({
      plan: subscription.plan,
      usage: {
        tasks,
        projects,
        timeEntries,
      },
    });
  } catch (error) {
    console.error('Error getting usage:', error);
    res.status(500).json({
      error: 'Failed to retrieve usage statistics',
      message: error.message,
    });
  }
});

module.exports = router;
