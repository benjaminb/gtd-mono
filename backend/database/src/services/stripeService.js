const Stripe = require('stripe');

class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not configured. Stripe functionality will be disabled.');
      this.stripe = null;
      return;
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  /**
   * Create a Stripe customer for a user
   * @param {Object} user - User object with email, firstName, lastName
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(user) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.userId,
        },
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Get a Stripe customer by ID
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Stripe customer object
   */
  async getCustomer(customerId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} priceId - Stripe price ID
   * @param {string} paymentMethodId - Stripe payment method ID (optional)
   * @returns {Promise<Object>} Stripe subscription object
   */
  async createSubscription(customerId, priceId, paymentMethodId = null) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const subscriptionData = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (paymentMethodId) {
        subscriptionData.default_payment_method = paymentMethodId;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update a subscription (e.g., upgrade/downgrade)
   * @param {string} subscriptionId - Stripe subscription ID
   * @param {string} newPriceId - New Stripe price ID
   * @returns {Promise<Object>} Updated subscription object
   */
  async updateSubscription(subscriptionId, newPriceId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Stripe subscription ID
   * @param {boolean} immediate - Cancel immediately or at period end
   * @returns {Promise<Object>} Canceled subscription object
   */
  async cancelSubscription(subscriptionId, immediate = false) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      if (immediate) {
        return await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate a subscription that was set to cancel at period end
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Reactivated subscription object
   */
  async reactivateSubscription(subscriptionId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Attach a payment method to a customer
   * @param {string} paymentMethodId - Stripe payment method ID
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Payment method object
   */
  async attachPaymentMethod(paymentMethodId, customerId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw error;
    }
  }

  /**
   * Detach a payment method from a customer
   * @param {string} paymentMethodId - Stripe payment method ID
   * @returns {Promise<Object>} Detached payment method object
   */
  async detachPaymentMethod(paymentMethodId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      console.error('Error detaching payment method:', error);
      throw error;
    }
  }

  /**
   * Set default payment method for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} paymentMethodId - Stripe payment method ID
   * @returns {Promise<Object>} Updated customer object
   */
  async setDefaultPaymentMethod(customerId, paymentMethodId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }

  /**
   * List payment methods for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} type - Payment method type (default: 'card')
   * @returns {Promise<Array>} Array of payment methods
   */
  async listPaymentMethods(customerId, type = 'card') {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type,
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error listing payment methods:', error);
      throw error;
    }
  }

  /**
   * Get an invoice by ID
   * @param {string} invoiceId - Stripe invoice ID
   * @returns {Promise<Object>} Invoice object
   */
  async getInvoice(invoiceId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return await this.stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      console.error('Error retrieving invoice:', error);
      throw error;
    }
  }

  /**
   * List invoices for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {number} limit - Number of invoices to retrieve (default: 10)
   * @returns {Promise<Array>} Array of invoices
   */
  async listInvoices(customerId, limit = 10) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: limit,
      });

      return invoices.data;
    } catch (error) {
      console.error('Error listing invoices:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Stripe signature header
   * @param {string} webhookSecret - Webhook secret from Stripe
   * @returns {Object} Verified webhook event
   */
  verifyWebhookSignature(payload, signature, webhookSecret) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent
   * @param {number} amount - Amount in cents
   * @param {string} currency - Currency code (default: 'usd')
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Payment intent object
   */
  async createPaymentIntent(amount, currency = 'usd', customerId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      return await this.stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new StripeService();
