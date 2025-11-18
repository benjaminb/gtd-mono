const { v4: uuidv4 } = require('uuid');
const { driver } = require('../utils/database');
const stripeService = require('./stripeService');
const paymentService = require('./paymentService');

class InvoiceService {
  /**
   * Get invoices for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of invoices to return
   * @returns {Promise<Array>} Array of invoices
   */
  async getUserInvoices(userId, limit = 10) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:HAS_INVOICE]->(i:Invoice)
         OPTIONAL MATCH (i)-[:FOR_SUBSCRIPTION]->(s:Subscription)-[:FOR_PLAN]->(p:SubscriptionPlan)
         OPTIONAL MATCH (i)-[:PAID_WITH]->(pay:Payment)
         RETURN i, s, p, pay
         ORDER BY i.createdAt DESC
         LIMIT $limit`,
        { userId, limit }
      );

      return result.records.map(record => ({
        invoice: record.get('i').properties,
        subscription: record.get('s')?.properties || null,
        plan: record.get('p')?.properties || null,
        payment: record.get('pay')?.properties || null,
      }));
    } catch (error) {
      console.error('Error getting user invoices:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a specific invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice with related data
   */
  async getInvoice(invoiceId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (i:Invoice {invoiceId: $invoiceId})
         OPTIONAL MATCH (i)-[:FOR_SUBSCRIPTION]->(s:Subscription)-[:FOR_PLAN]->(p:SubscriptionPlan)
         OPTIONAL MATCH (i)-[:PAID_WITH]->(pay:Payment)
         RETURN i, s, p, pay`,
        { invoiceId }
      );

      if (result.records.length === 0) {
        throw new Error('Invoice not found');
      }

      const record = result.records[0];
      return {
        invoice: record.get('i').properties,
        subscription: record.get('s')?.properties || null,
        plan: record.get('p')?.properties || null,
        payment: record.get('pay')?.properties || null,
      };
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create an invoice from a Stripe invoice object
   * @param {Object} stripeInvoice - Stripe invoice object
   * @param {string} userId - User ID
   * @param {string} subscriptionId - Subscription ID (optional)
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoiceFromStripe(stripeInvoice, userId, subscriptionId = null) {
    const session = driver.session();

    try {
      const invoiceId = uuidv4();

      const invoiceData = {
        invoiceId,
        stripeInvoiceId: stripeInvoice.id,
        amount: stripeInvoice.amount_due / 100, // Convert from cents
        currency: stripeInvoice.currency,
        status: stripeInvoice.status,
        invoiceNumber: stripeInvoice.number || '',
        invoicePdf: stripeInvoice.invoice_pdf || null,
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url || null,
        periodStart: new Date(stripeInvoice.period_start * 1000).toISOString(),
        periodEnd: new Date(stripeInvoice.period_end * 1000).toISOString(),
        paid: stripeInvoice.paid,
        paidAt: stripeInvoice.status_transitions?.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000).toISOString()
          : null,
        createdAt: new Date(stripeInvoice.created * 1000).toISOString(),
      };

      let query = `MATCH (u:User {userId: $userId})
                   CREATE (i:Invoice $invoiceData)
                   CREATE (u)-[:HAS_INVOICE]->(i)`;

      if (subscriptionId) {
        query += `
          WITH i
          MATCH (s:Subscription {subscriptionId: $subscriptionId})
          CREATE (i)-[:FOR_SUBSCRIPTION]->(s)`;
      }

      query += ` RETURN i`;

      const result = await session.run(query, { userId, subscriptionId, invoiceData });
      return result.records[0].get('i').properties;
    } catch (error) {
      console.error('Error creating invoice from Stripe:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update an invoice from a Stripe invoice object
   * @param {Object} stripeInvoice - Stripe invoice object
   * @returns {Promise<void>}
   */
  async updateInvoiceFromStripe(stripeInvoice) {
    const session = driver.session();

    try {
      const updateData = {
        status: stripeInvoice.status,
        invoiceNumber: stripeInvoice.number || '',
        invoicePdf: stripeInvoice.invoice_pdf || null,
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url || null,
        paid: stripeInvoice.paid,
        paidAt: stripeInvoice.status_transitions?.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000).toISOString()
          : null,
      };

      await session.run(
        `MATCH (i:Invoice {stripeInvoiceId: $stripeInvoiceId})
         SET i += $updateData`,
        { stripeInvoiceId: stripeInvoice.id, updateData }
      );

      // If the invoice was paid, record the payment
      if (stripeInvoice.paid && stripeInvoice.charge) {
        const charge = await stripeService.stripe.charges.retrieve(stripeInvoice.charge);

        // Get the invoice ID
        const invoiceResult = await session.run(
          `MATCH (i:Invoice {stripeInvoiceId: $stripeInvoiceId}) RETURN i.invoiceId as invoiceId`,
          { stripeInvoiceId: stripeInvoice.id }
        );

        if (invoiceResult.records.length > 0) {
          const invoiceId = invoiceResult.records[0].get('invoiceId');
          await paymentService.recordPayment(charge, invoiceId);
        }
      }
    } catch (error) {
      console.error('Error updating invoice from Stripe:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Sync invoice from Stripe by invoice ID
   * @param {string} stripeInvoiceId - Stripe invoice ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Synced invoice
   */
  async syncInvoiceFromStripe(stripeInvoiceId, userId) {
    const session = driver.session();

    try {
      // Check if invoice exists
      const existingResult = await session.run(
        `MATCH (i:Invoice {stripeInvoiceId: $stripeInvoiceId}) RETURN i`,
        { stripeInvoiceId }
      );

      const stripeInvoice = await stripeService.getInvoice(stripeInvoiceId);

      if (existingResult.records.length === 0) {
        // Create new invoice
        // Find the subscription ID if it exists
        let subscriptionId = null;
        if (stripeInvoice.subscription) {
          const subResult = await session.run(
            `MATCH (s:Subscription {stripeSubscriptionId: $stripeSubscriptionId})
             RETURN s.subscriptionId as subscriptionId`,
            { stripeSubscriptionId: stripeInvoice.subscription }
          );

          if (subResult.records.length > 0) {
            subscriptionId = subResult.records[0].get('subscriptionId');
          }
        }

        return await this.createInvoiceFromStripe(stripeInvoice, userId, subscriptionId);
      } else {
        // Update existing invoice
        await this.updateInvoiceFromStripe(stripeInvoice);
        const result = await session.run(
          `MATCH (i:Invoice {stripeInvoiceId: $stripeInvoiceId}) RETURN i`,
          { stripeInvoiceId }
        );
        return result.records[0].get('i').properties;
      }
    } catch (error) {
      console.error('Error syncing invoice from Stripe:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get upcoming invoice for a user's subscription
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Upcoming invoice or null
   */
  async getUpcomingInvoice(userId) {
    const session = driver.session();

    try {
      // Get user's active subscription
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:HAS_SUBSCRIPTION]->(s:Subscription)
         WHERE s.status = 'active'
         RETURN u.stripeCustomerId as customerId, s.stripeSubscriptionId as subscriptionId
         LIMIT 1`,
        { userId }
      );

      if (result.records.length === 0) {
        return null;
      }

      const customerId = result.records[0].get('customerId');
      const subscriptionId = result.records[0].get('subscriptionId');

      if (!customerId || !subscriptionId) {
        return null;
      }

      // Get upcoming invoice from Stripe
      const upcomingInvoice = await stripeService.stripe.invoices.retrieveUpcoming({
        customer: customerId,
        subscription: subscriptionId,
      });

      return {
        amount: upcomingInvoice.amount_due / 100,
        currency: upcomingInvoice.currency,
        periodStart: new Date(upcomingInvoice.period_start * 1000).toISOString(),
        periodEnd: new Date(upcomingInvoice.period_end * 1000).toISOString(),
        nextPaymentAttempt: upcomingInvoice.next_payment_attempt
          ? new Date(upcomingInvoice.next_payment_attempt * 1000).toISOString()
          : null,
      };
    } catch (error) {
      if (error.code === 'invoice_upcoming_none') {
        return null;
      }
      console.error('Error getting upcoming invoice:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}

module.exports = new InvoiceService();
