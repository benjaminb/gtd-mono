const { v4: uuidv4 } = require('uuid');
const { driver } = require('../utils/database');
const stripeService = require('./stripeService');

class SubscriptionService {
  /**
   * Get all available subscription plans
   * @param {boolean} activeOnly - Return only active plans (default: true)
   * @returns {Promise<Array>} Array of subscription plans
   */
  async getPlans(activeOnly = true) {
    const session = driver.session();

    try {
      const query = activeOnly
        ? `MATCH (sp:SubscriptionPlan {active: true}) RETURN sp ORDER BY sp.price ASC`
        : `MATCH (sp:SubscriptionPlan) RETURN sp ORDER BY sp.price ASC`;

      const result = await session.run(query);
      return result.records.map(record => record.get('sp').properties);
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a specific plan by ID
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Subscription plan
   */
  async getPlanById(planId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (sp:SubscriptionPlan {planId: $planId}) RETURN sp`,
        { planId }
      );

      if (result.records.length === 0) {
        throw new Error('Subscription plan not found');
      }

      return result.records[0].get('sp').properties;
    } catch (error) {
      console.error('Error getting subscription plan:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get user's current subscription
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User's subscription or null
   */
  async getUserSubscription(userId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:HAS_SUBSCRIPTION]->(s:Subscription)-[:FOR_PLAN]->(p:SubscriptionPlan)
         RETURN s, p
         ORDER BY s.createdAt DESC
         LIMIT 1`,
        { userId }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      return {
        subscription: record.get('s').properties,
        plan: record.get('p').properties,
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a new subscription for a user
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @param {string} paymentMethodId - Stripe payment method ID (optional)
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(userId, planId, paymentMethodId = null) {
    const session = driver.session();

    try {
      // Check if user already has an active subscription
      const existing = await this.getUserSubscription(userId);
      if (existing && existing.subscription.status === 'active') {
        throw new Error('User already has an active subscription');
      }

      // Get the plan
      const plan = await this.getPlanById(planId);

      // Get user details
      const userResult = await session.run(
        `MATCH (u:User {userId: $userId}) RETURN u`,
        { userId }
      );

      if (userResult.records.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.records[0].get('u').properties;

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(user);
        stripeCustomerId = customer.id;

        // Update user with Stripe customer ID
        await session.run(
          `MATCH (u:User {userId: $userId})
           SET u.stripeCustomerId = $stripeCustomerId`,
          { userId, stripeCustomerId }
        );
      }

      // Create subscription in Stripe (if not free plan)
      let stripeSubscription = null;
      if (plan.price > 0) {
        stripeSubscription = await stripeService.createSubscription(
          stripeCustomerId,
          plan.stripePriceId,
          paymentMethodId
        );
      }

      // Create subscription in database
      const subscriptionId = uuidv4();
      const now = new Date().toISOString();

      const subscriptionData = {
        subscriptionId,
        stripeSubscriptionId: stripeSubscription?.id || null,
        stripeCustomerId,
        status: plan.price === 0 ? 'active' : (stripeSubscription?.status || 'incomplete'),
        currentPeriodStart: plan.price === 0 ? now : stripeSubscription.current_period_start * 1000,
        currentPeriodEnd: plan.price === 0
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year for free
          : stripeSubscription.current_period_end * 1000,
        cancelAtPeriodEnd: false,
        trialStart: stripeSubscription?.trial_start ? stripeSubscription.trial_start * 1000 : null,
        trialEnd: stripeSubscription?.trial_end ? stripeSubscription.trial_end * 1000 : null,
        canceledAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const result = await session.run(
        `MATCH (u:User {userId: $userId})
         MATCH (p:SubscriptionPlan {planId: $planId})
         CREATE (s:Subscription $subscriptionData)
         CREATE (u)-[:HAS_SUBSCRIPTION]->(s)
         CREATE (s)-[:FOR_PLAN]->(p)
         RETURN s, p`,
        { userId, planId, subscriptionData }
      );

      const record = result.records[0];
      return {
        subscription: record.get('s').properties,
        plan: record.get('p').properties,
        clientSecret: stripeSubscription?.latest_invoice?.payment_intent?.client_secret,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update a subscription (upgrade/downgrade)
   * @param {string} subscriptionId - Subscription ID
   * @param {string} newPlanId - New plan ID
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, newPlanId) {
    const session = driver.session();

    try {
      // Get current subscription
      const currentResult = await session.run(
        `MATCH (s:Subscription {subscriptionId: $subscriptionId})-[:FOR_PLAN]->(p:SubscriptionPlan)
         RETURN s, p`,
        { subscriptionId }
      );

      if (currentResult.records.length === 0) {
        throw new Error('Subscription not found');
      }

      const currentSubscription = currentResult.records[0].get('s').properties;
      const currentPlan = currentResult.records[0].get('p').properties;

      // Get new plan
      const newPlan = await this.getPlanById(newPlanId);

      // Update in Stripe if both plans are paid
      if (currentPlan.price > 0 && newPlan.price > 0) {
        await stripeService.updateSubscription(
          currentSubscription.stripeSubscriptionId,
          newPlan.stripePriceId
        );
      }

      // Update in database
      await session.run(
        `MATCH (s:Subscription {subscriptionId: $subscriptionId})-[r:FOR_PLAN]->(:SubscriptionPlan)
         DELETE r
         WITH s
         MATCH (newPlan:SubscriptionPlan {planId: $newPlanId})
         CREATE (s)-[:FOR_PLAN]->(newPlan)
         SET s.updatedAt = datetime()
         RETURN s, newPlan`,
        { subscriptionId, newPlanId }
      );

      return await this.getSubscriptionById(subscriptionId);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {boolean} immediate - Cancel immediately or at period end
   * @returns {Promise<Object>} Canceled subscription
   */
  async cancelSubscription(subscriptionId, immediate = false) {
    const session = driver.session();

    try {
      // Get subscription
      const result = await session.run(
        `MATCH (s:Subscription {subscriptionId: $subscriptionId}) RETURN s`,
        { subscriptionId }
      );

      if (result.records.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = result.records[0].get('s').properties;

      // Cancel in Stripe if it's a paid subscription
      if (subscription.stripeSubscriptionId) {
        await stripeService.cancelSubscription(subscription.stripeSubscriptionId, immediate);
      }

      // Update in database
      const updateData = immediate
        ? {
            status: 'canceled',
            canceledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : {
            cancelAtPeriodEnd: true,
            updatedAt: new Date().toISOString(),
          };

      await session.run(
        `MATCH (s:Subscription {subscriptionId: $subscriptionId})
         SET s += $updateData
         RETURN s`,
        { subscriptionId, updateData }
      );

      return await this.getSubscriptionById(subscriptionId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Reactivate a canceled subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Reactivated subscription
   */
  async reactivateSubscription(subscriptionId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (s:Subscription {subscriptionId: $subscriptionId}) RETURN s`,
        { subscriptionId }
      );

      if (result.records.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = result.records[0].get('s').properties;

      if (!subscription.cancelAtPeriodEnd) {
        throw new Error('Subscription is not set to cancel');
      }

      // Reactivate in Stripe
      if (subscription.stripeSubscriptionId) {
        await stripeService.reactivateSubscription(subscription.stripeSubscriptionId);
      }

      // Update in database
      await session.run(
        `MATCH (s:Subscription {subscriptionId: $subscriptionId})
         SET s.cancelAtPeriodEnd = false, s.updatedAt = datetime()
         RETURN s`,
        { subscriptionId }
      );

      return await this.getSubscriptionById(subscriptionId);
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get subscription by ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Subscription with plan
   */
  async getSubscriptionById(subscriptionId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (s:Subscription {subscriptionId: $subscriptionId})-[:FOR_PLAN]->(p:SubscriptionPlan)
         RETURN s, p`,
        { subscriptionId }
      );

      if (result.records.length === 0) {
        throw new Error('Subscription not found');
      }

      const record = result.records[0];
      return {
        subscription: record.get('s').properties,
        plan: record.get('p').properties,
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update subscription from Stripe webhook
   * @param {Object} stripeSubscription - Stripe subscription object
   * @returns {Promise<void>}
   */
  async syncSubscriptionFromStripe(stripeSubscription) {
    const session = driver.session();

    try {
      const updateData = {
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
          : null,
        updatedAt: new Date().toISOString(),
      };

      await session.run(
        `MATCH (s:Subscription {stripeSubscriptionId: $stripeSubscriptionId})
         SET s += $updateData`,
        { stripeSubscriptionId: stripeSubscription.id, updateData }
      );
    } catch (error) {
      console.error('Error syncing subscription from Stripe:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Check if user has access to a feature
   * @param {string} userId - User ID
   * @param {string} feature - Feature name
   * @returns {Promise<boolean>} Whether user has access
   */
  async hasFeature(userId, feature) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:HAS_SUBSCRIPTION]->(s:Subscription)-[:FOR_PLAN]->(p:SubscriptionPlan)
         WHERE s.status = 'active' AND $feature IN p.features
         RETURN p`,
        { userId, feature }
      );

      return result.records.length > 0;
    } catch (error) {
      console.error('Error checking feature access:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get resource usage count for a user
   * @param {string} userId - User ID
   * @param {string} resourceType - Resource type (tasks, projects, timeEntries)
   * @returns {Promise<number>} Resource count
   */
  async getResourceCount(userId, resourceType) {
    const session = driver.session();

    try {
      let query;
      switch (resourceType) {
        case 'tasks':
          query = `MATCH (u:User {userId: $userId})-[:HAS_TASK]->(t:Task) RETURN count(t) as count`;
          break;
        case 'projects':
          // Projects are tasks without parents
          query = `MATCH (u:User {userId: $userId})-[:HAS_TASK]->(t:Task)
                   WHERE NOT EXISTS { (t)<-[:HAS_SUBTASK]-(:Task) }
                   RETURN count(t) as count`;
          break;
        case 'timeEntries':
          query = `MATCH (u:User {userId: $userId})<-[:LOGGED_BY]-(te:TimeEntry)
                   WHERE te.start >= datetime() - duration('P1M')
                   RETURN count(te) as count`;
          break;
        default:
          throw new Error('Invalid resource type');
      }

      const result = await session.run(query, { userId });
      return result.records[0].get('count').toNumber();
    } catch (error) {
      console.error('Error getting resource count:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Check if user can create more of a resource
   * @param {string} userId - User ID
   * @param {string} resourceType - Resource type
   * @returns {Promise<Object>} { allowed: boolean, limit: number, current: number }
   */
  async checkUsageLimit(userId, resourceType) {
    const session = driver.session();

    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription || subscription.subscription.status !== 'active') {
        return { allowed: false, limit: 0, current: 0, reason: 'No active subscription' };
      }

      const plan = subscription.plan;
      const limitKey = `max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`;
      const limit = plan[limitKey];

      // -1 means unlimited
      if (limit === -1) {
        return { allowed: true, limit: -1, current: 0 };
      }

      const current = await this.getResourceCount(userId, resourceType);

      return {
        allowed: current < limit,
        limit,
        current,
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}

module.exports = new SubscriptionService();
