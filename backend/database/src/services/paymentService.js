const { v4: uuidv4 } = require('uuid');
const { driver } = require('../utils/database');
const stripeService = require('./stripeService');

class PaymentService {
  /**
   * Add a payment method for a user
   * @param {string} userId - User ID
   * @param {string} stripePaymentMethodId - Stripe payment method ID
   * @returns {Promise<Object>} Created payment method
   */
  async addPaymentMethod(userId, stripePaymentMethodId) {
    const session = driver.session();

    try {
      // Get user's Stripe customer ID
      const userResult = await session.run(
        `MATCH (u:User {userId: $userId}) RETURN u`,
        { userId }
      );

      if (userResult.records.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.records[0].get('u').properties;

      if (!user.stripeCustomerId) {
        throw new Error('User does not have a Stripe customer ID');
      }

      // Attach payment method to customer in Stripe
      const stripePaymentMethod = await stripeService.attachPaymentMethod(
        stripePaymentMethodId,
        user.stripeCustomerId
      );

      // Check if this should be the default payment method
      const existingMethods = await this.getPaymentMethods(userId);
      const isDefault = existingMethods.length === 0;

      // Create payment method in database
      const paymentMethodId = uuidv4();
      const now = new Date().toISOString();

      const paymentMethodData = {
        paymentMethodId,
        stripePaymentMethodId: stripePaymentMethod.id,
        type: stripePaymentMethod.type,
        last4: stripePaymentMethod.card?.last4 || stripePaymentMethod.us_bank_account?.last4 || '',
        brand: stripePaymentMethod.card?.brand || stripePaymentMethod.type,
        expiryMonth: stripePaymentMethod.card?.exp_month || 0,
        expiryYear: stripePaymentMethod.card?.exp_year || 0,
        isDefault,
        createdAt: now,
        updatedAt: now,
      };

      const result = await session.run(
        `MATCH (u:User {userId: $userId})
         CREATE (pm:PaymentMethod $paymentMethodData)
         CREATE (u)-[:HAS_PAYMENT_METHOD]->(pm)
         RETURN pm`,
        { userId, paymentMethodData }
      );

      // If this is the default, set it in Stripe
      if (isDefault) {
        await stripeService.setDefaultPaymentMethod(user.stripeCustomerId, stripePaymentMethodId);
      }

      return result.records[0].get('pm').properties;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get all payment methods for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of payment methods
   */
  async getPaymentMethods(userId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:HAS_PAYMENT_METHOD]->(pm:PaymentMethod)
         RETURN pm
         ORDER BY pm.isDefault DESC, pm.createdAt DESC`,
        { userId }
      );

      return result.records.map(record => record.get('pm').properties);
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Remove a payment method
   * @param {string} userId - User ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<void>}
   */
  async removePaymentMethod(userId, paymentMethodId) {
    const session = driver.session();

    try {
      // Get the payment method
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:HAS_PAYMENT_METHOD]->(pm:PaymentMethod {paymentMethodId: $paymentMethodId})
         RETURN pm`,
        { userId, paymentMethodId }
      );

      if (result.records.length === 0) {
        throw new Error('Payment method not found');
      }

      const paymentMethod = result.records[0].get('pm').properties;

      // Detach from Stripe
      await stripeService.detachPaymentMethod(paymentMethod.stripePaymentMethodId);

      // Delete from database
      await session.run(
        `MATCH (u:User {userId: $userId})-[r:HAS_PAYMENT_METHOD]->(pm:PaymentMethod {paymentMethodId: $paymentMethodId})
         DELETE r, pm`,
        { userId, paymentMethodId }
      );

      // If this was the default, set another one as default
      if (paymentMethod.isDefault) {
        const remaining = await this.getPaymentMethods(userId);
        if (remaining.length > 0) {
          await this.setDefaultPaymentMethod(userId, remaining[0].paymentMethodId);
        }
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Set a payment method as default
   * @param {string} userId - User ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Updated payment method
   */
  async setDefaultPaymentMethod(userId, paymentMethodId) {
    const session = driver.session();

    try {
      // Get user and payment method
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:HAS_PAYMENT_METHOD]->(pm:PaymentMethod {paymentMethodId: $paymentMethodId})
         RETURN u, pm`,
        { userId, paymentMethodId }
      );

      if (result.records.length === 0) {
        throw new Error('Payment method not found');
      }

      const user = result.records[0].get('u').properties;
      const paymentMethod = result.records[0].get('pm').properties;

      // Update in Stripe
      await stripeService.setDefaultPaymentMethod(
        user.stripeCustomerId,
        paymentMethod.stripePaymentMethodId
      );

      // Unset all other payment methods as default
      await session.run(
        `MATCH (u:User {userId: $userId})-[:HAS_PAYMENT_METHOD]->(pm:PaymentMethod)
         SET pm.isDefault = false, pm.updatedAt = datetime()`,
        { userId }
      );

      // Set this one as default
      const updateResult = await session.run(
        `MATCH (pm:PaymentMethod {paymentMethodId: $paymentMethodId})
         SET pm.isDefault = true, pm.updatedAt = datetime()
         RETURN pm`,
        { paymentMethodId }
      );

      return updateResult.records[0].get('pm').properties;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get default payment method for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Default payment method or null
   */
  async getDefaultPaymentMethod(userId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:HAS_PAYMENT_METHOD]->(pm:PaymentMethod {isDefault: true})
         RETURN pm`,
        { userId }
      );

      if (result.records.length === 0) {
        return null;
      }

      return result.records[0].get('pm').properties;
    } catch (error) {
      console.error('Error getting default payment method:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Record a payment in the database
   * @param {Object} stripeCharge - Stripe charge object
   * @param {string} invoiceId - Invoice ID (optional)
   * @param {string} paymentMethodId - Payment method ID (optional)
   * @returns {Promise<Object>} Created payment
   */
  async recordPayment(stripeCharge, invoiceId = null, paymentMethodId = null) {
    const session = driver.session();

    try {
      const paymentId = uuidv4();

      const paymentData = {
        paymentId,
        stripeChargeId: stripeCharge.id,
        amount: stripeCharge.amount / 100, // Convert from cents
        currency: stripeCharge.currency,
        status: stripeCharge.status,
        failureCode: stripeCharge.failure_code || null,
        failureMessage: stripeCharge.failure_message || null,
        receiptUrl: stripeCharge.receipt_url || null,
        createdAt: new Date(stripeCharge.created * 1000).toISOString(),
      };

      let query = `CREATE (p:Payment $paymentData)`;

      if (invoiceId) {
        query = `MATCH (i:Invoice {invoiceId: $invoiceId})
                 CREATE (p:Payment $paymentData)
                 CREATE (i)-[:PAID_WITH]->(p)`;
      }

      if (paymentMethodId) {
        query += `
          WITH p
          MATCH (pm:PaymentMethod {paymentMethodId: $paymentMethodId})
          CREATE (p)-[:USING_METHOD]->(pm)`;
      }

      query += ` RETURN p`;

      const result = await session.run(query, { paymentData, invoiceId, paymentMethodId });
      return result.records[0].get('p').properties;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment
   */
  async getPayment(paymentId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (p:Payment {paymentId: $paymentId})
         OPTIONAL MATCH (p)-[:USING_METHOD]->(pm:PaymentMethod)
         RETURN p, pm`,
        { paymentId }
      );

      if (result.records.length === 0) {
        throw new Error('Payment not found');
      }

      const record = result.records[0];
      return {
        payment: record.get('p').properties,
        paymentMethod: record.get('pm')?.properties || null,
      };
    } catch (error) {
      console.error('Error getting payment:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}

module.exports = new PaymentService();
