# Subscription Charging System Design

## Overview

This document outlines the design for a subscription-based charging system for the GTD application. The system will integrate with Stripe for payment processing and use Neo4j to store subscription and billing data.

## Architecture Components

### 1. Database Schema (Neo4j)

#### New Node Types

**`SubscriptionPlan` Node**
- `planId: string` (UUID, unique)
- `name: string` (e.g., "Free", "Pro", "Enterprise")
- `price: float` (monthly price in USD)
- `currency: string` (default: "usd")
- `interval: string` (enum: "month", "year")
- `maxTasks: int` (maximum tasks allowed, -1 for unlimited)
- `maxProjects: int` (maximum projects allowed, -1 for unlimited)
- `maxTimeEntries: int` (maximum time entries per month, -1 for unlimited)
- `features: array[string]` (list of feature flags)
- `stripePriceId: string` (Stripe Price ID)
- `stripeProductId: string` (Stripe Product ID)
- `active: bool` (whether plan is available for new subscriptions)
- `createdAt: datetime`
- `updatedAt: datetime`

**`Subscription` Node**
- `subscriptionId: string` (UUID, unique)
- `stripeSubscriptionId: string` (Stripe Subscription ID)
- `status: string` (enum: "active", "past_due", "canceled", "incomplete", "trialing")
- `currentPeriodStart: datetime`
- `currentPeriodEnd: datetime`
- `cancelAtPeriodEnd: bool`
- `trialStart: datetime` (nullable)
- `trialEnd: datetime` (nullable)
- `canceledAt: datetime` (nullable)
- `createdAt: datetime`
- `updatedAt: datetime`

**`PaymentMethod` Node**
- `paymentMethodId: string` (UUID, unique)
- `stripePaymentMethodId: string` (Stripe Payment Method ID)
- `type: string` (enum: "card", "bank_account")
- `last4: string` (last 4 digits of card/account)
- `brand: string` (e.g., "visa", "mastercard")
- `expiryMonth: int` (for cards)
- `expiryYear: int` (for cards)
- `isDefault: bool`
- `createdAt: datetime`
- `updatedAt: datetime`

**`Invoice` Node**
- `invoiceId: string` (UUID, unique)
- `stripeInvoiceId: string` (Stripe Invoice ID)
- `amount: float`
- `currency: string`
- `status: string` (enum: "draft", "open", "paid", "void", "uncollectible")
- `invoiceNumber: string`
- `invoicePdf: string` (URL to PDF)
- `hostedInvoiceUrl: string` (Stripe hosted page URL)
- `periodStart: datetime`
- `periodEnd: datetime`
- `paid: bool`
- `paidAt: datetime` (nullable)
- `createdAt: datetime`

**`Payment` Node**
- `paymentId: string` (UUID, unique)
- `stripeChargeId: string` (Stripe Charge ID)
- `amount: float`
- `currency: string`
- `status: string` (enum: "succeeded", "pending", "failed")
- `failureCode: string` (nullable)
- `failureMessage: string` (nullable)
- `receiptUrl: string` (Stripe receipt URL)
- `createdAt: datetime`

#### New Relationships

- `(User)-[:HAS_SUBSCRIPTION]->(Subscription)`
- `(Subscription)-[:FOR_PLAN]->(SubscriptionPlan)`
- `(User)-[:HAS_PAYMENT_METHOD]->(PaymentMethod)`
- `(User)-[:HAS_INVOICE]->(Invoice)`
- `(Invoice)-[:FOR_SUBSCRIPTION]->(Subscription)`
- `(Invoice)-[:PAID_WITH]->(Payment)`
- `(Payment)-[:USING_METHOD]->(PaymentMethod)`

#### Constraints and Indexes

```cypher
// Unique constraints
CREATE CONSTRAINT subscription_plan_id IF NOT EXISTS FOR (sp:SubscriptionPlan) REQUIRE sp.planId IS UNIQUE;
CREATE CONSTRAINT subscription_id IF NOT EXISTS FOR (s:Subscription) REQUIRE s.subscriptionId IS UNIQUE;
CREATE CONSTRAINT payment_method_id IF NOT EXISTS FOR (pm:PaymentMethod) REQUIRE pm.paymentMethodId IS UNIQUE;
CREATE CONSTRAINT invoice_id IF NOT EXISTS FOR (i:Invoice) REQUIRE i.invoiceId IS UNIQUE;
CREATE CONSTRAINT payment_id IF NOT EXISTS FOR (p:Payment) REQUIRE p.paymentId IS UNIQUE;

// Indexes for performance
CREATE INDEX subscription_status IF NOT EXISTS FOR (s:Subscription) ON (s.status);
CREATE INDEX subscription_stripe_id IF NOT EXISTS FOR (s:Subscription) ON (s.stripeSubscriptionId);
CREATE INDEX invoice_status IF NOT EXISTS FOR (i:Invoice) ON (i.status);
```

### 2. Subscription Plans

#### Default Plans

**Free Tier**
- Price: $0/month
- Max Tasks: 100
- Max Projects: 5
- Max Time Entries: 100/month
- Features: ["basic_tasks", "basic_time_tracking"]

**Pro Tier**
- Price: $9.99/month
- Max Tasks: 1000
- Max Projects: 50
- Max Time Entries: -1 (unlimited)
- Features: ["basic_tasks", "advanced_time_tracking", "custom_fields", "reports", "api_access"]

**Enterprise Tier**
- Price: $29.99/month
- Max Tasks: -1 (unlimited)
- Max Projects: -1 (unlimited)
- Max Time Entries: -1 (unlimited)
- Features: ["basic_tasks", "advanced_time_tracking", "custom_fields", "reports", "api_access", "priority_support", "data_export", "team_collaboration"]

### 3. API Endpoints

All endpoints require authentication (JWT token).

**Subscription Management**
- `GET /api/subscription/plans` - List all available subscription plans
- `GET /api/subscription/current` - Get current user's subscription
- `POST /api/subscription/create` - Create a new subscription
- `POST /api/subscription/update` - Update subscription (upgrade/downgrade)
- `POST /api/subscription/cancel` - Cancel subscription
- `POST /api/subscription/reactivate` - Reactivate canceled subscription

**Payment Methods**
- `GET /api/payment-methods` - List user's payment methods
- `POST /api/payment-methods` - Add new payment method
- `DELETE /api/payment-methods/:id` - Remove payment method
- `PUT /api/payment-methods/:id/default` - Set default payment method

**Billing**
- `GET /api/invoices` - List user's invoices
- `GET /api/invoices/:id` - Get specific invoice
- `GET /api/invoices/:id/pdf` - Download invoice PDF

**Webhooks**
- `POST /api/webhooks/stripe` - Stripe webhook endpoint for payment events

### 4. Stripe Integration

**Events to Handle**
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed
- `customer.subscription.trial_will_end` - Trial ending soon (3 days)
- `payment_method.attached` - Payment method added
- `payment_method.detached` - Payment method removed

**Webhook Security**
- Verify webhook signatures using Stripe signature verification
- Use environment variable for webhook secret

### 5. Access Control Middleware

**Subscription Check Middleware**
```javascript
// Pseudo-code
function requireActiveSubscription(req, res, next) {
  const user = req.user;
  const subscription = getUserSubscription(user);

  if (!subscription || subscription.status !== 'active') {
    return res.status(403).json({
      error: 'Active subscription required',
      subscriptionStatus: subscription?.status || 'none'
    });
  }

  next();
}

function requireFeature(featureName) {
  return (req, res, next) => {
    const user = req.user;
    const subscription = getUserSubscription(user);
    const plan = getSubscriptionPlan(subscription);

    if (!plan.features.includes(featureName)) {
      return res.status(403).json({
        error: `Feature '${featureName}' not available in your plan`,
        currentPlan: plan.name,
        upgradeRequired: true
      });
    }

    next();
  };
}

function checkUsageLimit(resourceType) {
  return async (req, res, next) => {
    const user = req.user;
    const subscription = getUserSubscription(user);
    const plan = getSubscriptionPlan(subscription);

    const currentUsage = await getResourceCount(user, resourceType);
    const limit = plan[`max${resourceType}`];

    if (limit !== -1 && currentUsage >= limit) {
      return res.status(403).json({
        error: `${resourceType} limit reached`,
        limit: limit,
        current: currentUsage,
        upgradeRequired: true
      });
    }

    next();
  };
}
```

### 6. Service Layer

**SubscriptionService**
- `createSubscription(userId, planId, paymentMethodId)`
- `getSubscription(userId)`
- `updateSubscription(subscriptionId, newPlanId)`
- `cancelSubscription(subscriptionId, immediate = false)`
- `reactivateSubscription(subscriptionId)`
- `checkSubscriptionStatus(userId)`

**PaymentService**
- `addPaymentMethod(userId, stripePaymentMethodId)`
- `removePaymentMethod(paymentMethodId)`
- `setDefaultPaymentMethod(userId, paymentMethodId)`
- `getPaymentMethods(userId)`

**InvoiceService**
- `getInvoices(userId)`
- `getInvoice(invoiceId)`
- `recordInvoice(stripeInvoice)`

**StripeService**
- `createCustomer(user)`
- `createSubscription(customerId, priceId, paymentMethodId)`
- `updateSubscription(subscriptionId, newPriceId)`
- `cancelSubscription(subscriptionId)`
- `createPaymentIntent(amount, customerId)`
- `handleWebhook(payload, signature)`

### 7. Database Queries

**Get User's Active Subscription**
```cypher
MATCH (u:User {userId: $userId})-[:HAS_SUBSCRIPTION]->(s:Subscription)-[:FOR_PLAN]->(p:SubscriptionPlan)
WHERE s.status = 'active'
RETURN s, p
```

**Check Feature Access**
```cypher
MATCH (u:User {userId: $userId})-[:HAS_SUBSCRIPTION]->(s:Subscription)-[:FOR_PLAN]->(p:SubscriptionPlan)
WHERE s.status = 'active' AND $feature IN p.features
RETURN p
```

**Get Resource Usage Count**
```cypher
MATCH (u:User {userId: $userId})-[:HAS_TASK]->(t:Task)
RETURN count(t) as taskCount
```

**Create Subscription**
```cypher
MATCH (u:User {userId: $userId})
MATCH (p:SubscriptionPlan {planId: $planId})
CREATE (s:Subscription {
  subscriptionId: randomUUID(),
  stripeSubscriptionId: $stripeSubscriptionId,
  status: $status,
  currentPeriodStart: datetime($currentPeriodStart),
  currentPeriodEnd: datetime($currentPeriodEnd),
  cancelAtPeriodEnd: false,
  createdAt: datetime(),
  updatedAt: datetime()
})
CREATE (u)-[:HAS_SUBSCRIPTION]->(s)
CREATE (s)-[:FOR_PLAN]->(p)
RETURN s, p
```

### 8. Environment Variables

Required environment variables:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret
```

### 9. Error Handling

**Subscription Errors**
- Insufficient payment method
- Payment declined
- Subscription already exists
- Plan not found
- Usage limit exceeded

**HTTP Status Codes**
- 200: Success
- 201: Created
- 400: Bad request (invalid input)
- 403: Forbidden (no access/limit exceeded)
- 404: Not found
- 409: Conflict (duplicate subscription)
- 500: Server error

### 10. Security Considerations

1. **Authentication**: All subscription endpoints require JWT authentication
2. **Webhook Verification**: Verify Stripe webhook signatures
3. **PCI Compliance**: Never store raw credit card data (use Stripe tokens)
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Input Validation**: Validate all user inputs
6. **Access Control**: Users can only access their own subscriptions/invoices

### 11. Testing Strategy

**Unit Tests**
- Service layer methods
- Middleware functions
- Database queries

**Integration Tests**
- Stripe API integration
- Webhook processing
- End-to-end subscription flow

**Test Scenarios**
- Create subscription with valid payment method
- Upgrade/downgrade subscription
- Handle failed payments
- Process webhook events
- Check usage limits
- Feature access control

## Implementation Phases

### Phase 1: Database Schema
- Add new node types and relationships
- Create constraints and indexes
- Seed default subscription plans

### Phase 2: Stripe Integration
- Set up Stripe SDK
- Implement StripeService
- Configure webhook endpoint

### Phase 3: Service Layer
- Implement SubscriptionService
- Implement PaymentService
- Implement InvoiceService

### Phase 4: API Endpoints
- Create subscription routes
- Create payment method routes
- Create invoice routes
- Add webhook handler

### Phase 5: Access Control
- Implement authentication middleware
- Implement subscription check middleware
- Implement feature access middleware
- Implement usage limit middleware

### Phase 6: Testing & Documentation
- Write unit and integration tests
- Update API documentation
- Create user guides

## Future Enhancements

1. **Usage-Based Billing**: Charge based on actual usage (tasks created, time tracked)
2. **Proration**: Handle mid-cycle upgrades/downgrades with prorated charges
3. **Discounts & Coupons**: Support promotional codes and discounts
4. **Team Plans**: Support for team subscriptions with multiple users
5. **Annual Billing**: Offer annual plans with discounts
6. **Free Trials**: Automatic trial period for new users
7. **Dunning Management**: Automated retry logic for failed payments
8. **Analytics**: Track subscription metrics (MRR, churn, LTV)
