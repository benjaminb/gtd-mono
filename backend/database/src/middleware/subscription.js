const subscriptionService = require('../services/subscriptionService');

/**
 * Middleware to check if user has an active subscription
 */
async function requireActiveSubscription(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const subscription = await subscriptionService.getUserSubscription(req.user.userId);

    if (!subscription) {
      return res.status(403).json({
        error: 'No subscription found',
        code: 'NO_SUBSCRIPTION',
        message: 'Please subscribe to a plan to access this feature',
      });
    }

    if (subscription.subscription.status !== 'active' && subscription.subscription.status !== 'trialing') {
      return res.status(403).json({
        error: 'Active subscription required',
        code: 'INACTIVE_SUBSCRIPTION',
        subscriptionStatus: subscription.subscription.status,
        message: 'Your subscription is not active. Please update your payment method or renew your subscription.',
      });
    }

    // Attach subscription to request for use in route handlers
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({
      error: 'Failed to check subscription status',
      code: 'SUBSCRIPTION_CHECK_FAILED',
    });
  }
}

/**
 * Middleware factory to check if user has access to a specific feature
 * @param {string} featureName - Name of the feature to check
 * @returns {Function} Express middleware function
 */
function requireFeature(featureName) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const hasAccess = await subscriptionService.hasFeature(req.user.userId, featureName);

      if (!hasAccess) {
        const subscription = await subscriptionService.getUserSubscription(req.user.userId);

        return res.status(403).json({
          error: `Feature '${featureName}' not available in your plan`,
          code: 'FEATURE_NOT_AVAILABLE',
          currentPlan: subscription?.plan?.name || 'None',
          upgradeRequired: true,
          message: 'Please upgrade your plan to access this feature',
        });
      }

      next();
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({
        error: 'Failed to check feature access',
        code: 'FEATURE_CHECK_FAILED',
      });
    }
  };
}

/**
 * Middleware factory to check if user can create more of a resource
 * @param {string} resourceType - Type of resource (tasks, projects, timeEntries)
 * @returns {Function} Express middleware function
 */
function checkUsageLimit(resourceType) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const usage = await subscriptionService.checkUsageLimit(req.user.userId, resourceType);

      if (!usage.allowed) {
        const subscription = await subscriptionService.getUserSubscription(req.user.userId);

        return res.status(403).json({
          error: `${resourceType} limit reached`,
          code: 'USAGE_LIMIT_EXCEEDED',
          resourceType,
          limit: usage.limit,
          current: usage.current,
          currentPlan: subscription?.plan?.name || 'None',
          upgradeRequired: true,
          message: usage.reason || `You have reached your ${resourceType} limit. Please upgrade your plan to create more.`,
        });
      }

      // Attach usage info to request for potential use in route handlers
      req.usage = usage;
      next();
    } catch (error) {
      console.error('Error checking usage limit:', error);
      res.status(500).json({
        error: 'Failed to check usage limit',
        code: 'USAGE_CHECK_FAILED',
      });
    }
  };
}

/**
 * Middleware to attach subscription info to request without blocking
 * Useful for routes that should work with or without a subscription
 */
async function attachSubscription(req, res, next) {
  try {
    if (req.user && req.user.userId) {
      const subscription = await subscriptionService.getUserSubscription(req.user.userId);
      req.subscription = subscription;
    }
    next();
  } catch (error) {
    // Don't block the request if subscription check fails
    console.error('Error attaching subscription:', error);
    next();
  }
}

/**
 * Middleware to check if user is on a paid plan
 */
async function requirePaidPlan(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const subscription = await subscriptionService.getUserSubscription(req.user.userId);

    if (!subscription) {
      return res.status(403).json({
        error: 'No subscription found',
        code: 'NO_SUBSCRIPTION',
        message: 'Please subscribe to a paid plan to access this feature',
      });
    }

    if (subscription.plan.price === 0) {
      return res.status(403).json({
        error: 'Paid plan required',
        code: 'PAID_PLAN_REQUIRED',
        currentPlan: subscription.plan.name,
        upgradeRequired: true,
        message: 'This feature is only available on paid plans. Please upgrade to continue.',
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error checking paid plan:', error);
    res.status(500).json({
      error: 'Failed to check plan status',
      code: 'PLAN_CHECK_FAILED',
    });
  }
}

module.exports = {
  requireActiveSubscription,
  requireFeature,
  checkUsageLimit,
  attachSubscription,
  requirePaidPlan,
};
