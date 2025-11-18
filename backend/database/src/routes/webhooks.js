const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const subscriptionService = require('../services/subscriptionService');
const invoiceService = require('../services/invoiceService');
const { driver } = require('../utils/database');

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 *
 * Important: This endpoint should receive the raw request body, not JSON parsed
 * Configure Express to use express.raw() for this route before json parsing
 */
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripeService.verifyWebhookSignature(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  console.log(`Received webhook event: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      case 'payment_method.attached':
        console.log('Payment method attached:', event.data.object.id);
        break;

      case 'payment_method.detached':
        console.log('Payment method detached:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle subscription created/updated events
 */
async function handleSubscriptionUpdate(subscription) {
  try {
    await subscriptionService.syncSubscriptionFromStripe(subscription);
    console.log(`Subscription ${subscription.id} synced successfully`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    await subscriptionService.syncSubscriptionFromStripe(subscription);
    console.log(`Subscription ${subscription.id} deleted`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

/**
 * Handle invoice payment succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice) {
  const session = driver.session();

  try {
    // Find the user by Stripe customer ID
    const userResult = await session.run(
      `MATCH (u:User {stripeCustomerId: $customerId}) RETURN u.userId as userId`,
      { customerId: invoice.customer }
    );

    if (userResult.records.length === 0) {
      console.error(`User not found for customer ${invoice.customer}`);
      return;
    }

    const userId = userResult.records[0].get('userId');

    // Sync or create the invoice
    await invoiceService.syncInvoiceFromStripe(invoice.id, userId);

    console.log(`Invoice ${invoice.id} payment succeeded`);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Handle invoice payment failed event
 */
async function handleInvoicePaymentFailed(invoice) {
  const session = driver.session();

  try {
    // Find the user by Stripe customer ID
    const userResult = await session.run(
      `MATCH (u:User {stripeCustomerId: $customerId}) RETURN u.userId as userId, u.email as email`,
      { customerId: invoice.customer }
    );

    if (userResult.records.length === 0) {
      console.error(`User not found for customer ${invoice.customer}`);
      return;
    }

    const userId = userResult.records[0].get('userId');
    const userEmail = userResult.records[0].get('email');

    // Sync the invoice
    await invoiceService.syncInvoiceFromStripe(invoice.id, userId);

    // TODO: Send email notification to user about failed payment
    console.log(`Invoice ${invoice.id} payment failed for user ${userEmail}`);
    console.log('TODO: Send payment failed notification email');
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Handle trial will end event (3 days before trial ends)
 */
async function handleTrialWillEnd(subscription) {
  const session = driver.session();

  try {
    // Find the user by Stripe subscription ID
    const userResult = await session.run(
      `MATCH (u:User)-[:HAS_SUBSCRIPTION]->(s:Subscription {stripeSubscriptionId: $subscriptionId})
       RETURN u.userId as userId, u.email as email`,
      { subscriptionId: subscription.id }
    );

    if (userResult.records.length === 0) {
      console.error(`User not found for subscription ${subscription.id}`);
      return;
    }

    const userEmail = userResult.records[0].get('email');
    const trialEnd = new Date(subscription.trial_end * 1000);

    // TODO: Send email notification to user about trial ending
    console.log(`Trial ending soon for user ${userEmail} on ${trialEnd.toISOString()}`);
    console.log('TODO: Send trial ending notification email');
  } catch (error) {
    console.error('Error handling trial will end:', error);
    throw error;
  } finally {
    await session.close();
  }
}

module.exports = router;
