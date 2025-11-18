# Subscription System Setup Guide

This guide will help you set up and configure the subscription charging system for the GTD application.

## Overview

The subscription system is built with:
- **Stripe** for payment processing
- **Neo4j** for storing subscription and billing data
- **Express.js** for API endpoints

## Prerequisites

1. **Stripe Account**: Sign up at https://stripe.com
2. **Neo4j Database**: Running instance of Neo4j
3. **Node.js**: Version 14 or higher

## Installation

### 1. Install Dependencies

Dependencies are already installed if you've run `npm install` in the `/backend/database` directory.

If not, run:
```bash
cd backend/database
npm install
```

This installs:
- `stripe` - Stripe Node.js SDK
- `uuid` - For generating unique IDs
- `express` - Web framework
- `neo4j-driver` - Neo4j database driver
- `dotenv` - Environment variable management

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# Stripe Keys (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NODE_ENV=development
PORT=3000
```

### 3. Set Up Stripe

#### Create Products and Prices

In your Stripe Dashboard (https://dashboard.stripe.com/products):

1. **Free Plan**
   - Product name: "Free"
   - Price: $0/month
   - Copy the Price ID and Product ID

2. **Pro Plan**
   - Product name: "Pro"
   - Price: $9.99/month
   - Copy the Price ID and Product ID

3. **Enterprise Plan**
   - Product name: "Enterprise"
   - Price: $29.99/month
   - Copy the Price ID and Product ID

#### Update Subscription Plans Data

Edit `/backend/database/setup/subscriptionPlans.csv` with your Stripe IDs:

```csv
planId,name,price,currency,interval,maxTasks,maxProjects,maxTimeEntries,features,stripePriceId,stripeProductId,active
plan_free_001,Free,0,usd,month,100,5,100,"basic_tasks|basic_time_tracking",price_xxx,prod_xxx,true
plan_pro_001,Pro,9.99,usd,month,1000,50,-1,"basic_tasks|advanced_time_tracking|custom_fields|reports|api_access",price_xxx,prod_xxx,true
plan_enterprise_001,Enterprise,29.99,usd,month,-1,-1,-1,"basic_tasks|advanced_time_tracking|custom_fields|reports|api_access|priority_support|data_export|team_collaboration",price_xxx,prod_xxx,true
```

#### Configure Webhooks

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
   - `payment_method.attached`
   - `payment_method.detached`
5. Copy the "Signing secret" and add it to `.env` as `STRIPE_WEBHOOK_SECRET`

### 4. Initialize Database

Run the database initialization scripts in order:

```bash
# From Neo4j Browser or cypher-shell

# 1. Create constraints
:source /path/to/backend/database/setup/constraints.cypher

# 2. Create indexes
:source /path/to/backend/database/setup/indexes.cypher

# 3. Load enums (if using LOAD CSV)
LOAD CSV WITH HEADERS FROM 'file:///enums.csv' AS row
CREATE (e:Enum {name: row.name, values: split(row.values, '|')});

# 4. Load subscription plans
LOAD CSV WITH HEADERS FROM 'file:///subscriptionPlans.csv' AS row
CREATE (sp:SubscriptionPlan {
  planId: row.planId,
  name: row.name,
  price: toFloat(row.price),
  currency: row.currency,
  interval: row.interval,
  maxTasks: toInteger(row.maxTasks),
  maxProjects: toInteger(row.maxProjects),
  maxTimeEntries: toInteger(row.maxTimeEntries),
  features: split(row.features, '|'),
  stripePriceId: row.stripePriceId,
  stripeProductId: row.stripeProductId,
  active: row.active = 'true',
  createdAt: datetime(),
  updatedAt: datetime()
});
```

### 5. Start the Server

```bash
cd backend/database
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### Authentication

**Important**: All endpoints (except `/api/subscriptions/plans` and `/api/webhooks/stripe`) require authentication.

You need to implement authentication middleware that sets `req.user` with at least:
```javascript
{
  userId: 'user-uuid',
  email: 'user@example.com',
  // ... other user fields
}
```

### Subscription Endpoints

**List Plans**
```http
GET /api/subscriptions/plans
```

**Get Current Subscription**
```http
GET /api/subscriptions/current
Authorization: Bearer {token}
```

**Create Subscription**
```http
POST /api/subscriptions/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "plan_pro_001",
  "paymentMethodId": "pm_xxx" // optional
}
```

**Update Subscription**
```http
PUT /api/subscriptions/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "newPlanId": "plan_enterprise_001"
}
```

**Cancel Subscription**
```http
POST /api/subscriptions/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "immediate": false // true = cancel now, false = cancel at period end
}
```

**Reactivate Subscription**
```http
POST /api/subscriptions/reactivate
Authorization: Bearer {token}
```

**Get Usage Statistics**
```http
GET /api/subscriptions/usage
Authorization: Bearer {token}
```

### Payment Method Endpoints

**List Payment Methods**
```http
GET /api/payment-methods
Authorization: Bearer {token}
```

**Add Payment Method**
```http
POST /api/payment-methods
Authorization: Bearer {token}
Content-Type: application/json

{
  "stripePaymentMethodId": "pm_xxx"
}
```

**Remove Payment Method**
```http
DELETE /api/payment-methods/{paymentMethodId}
Authorization: Bearer {token}
```

**Set Default Payment Method**
```http
PUT /api/payment-methods/{paymentMethodId}/default
Authorization: Bearer {token}
```

### Invoice Endpoints

**List Invoices**
```http
GET /api/invoices?limit=10
Authorization: Bearer {token}
```

**Get Upcoming Invoice**
```http
GET /api/invoices/upcoming
Authorization: Bearer {token}
```

**Get Specific Invoice**
```http
GET /api/invoices/{invoiceId}
Authorization: Bearer {token}
```

**Get Invoice PDF**
```http
GET /api/invoices/{invoiceId}/pdf
Authorization: Bearer {token}
```

## Using the Middleware

The subscription system includes middleware for access control:

### Require Active Subscription

```javascript
const { requireActiveSubscription } = require('./middleware/subscription');

app.get('/api/premium-feature', requireActiveSubscription, (req, res) => {
  // Only users with active subscriptions can access
  res.json({ data: 'premium content' });
});
```

### Require Specific Feature

```javascript
const { requireFeature } = require('./middleware/subscription');

app.get('/api/reports', requireFeature('reports'), (req, res) => {
  // Only users with 'reports' feature can access
  res.json({ report: 'data' });
});
```

### Check Usage Limits

```javascript
const { checkUsageLimit } = require('./middleware/subscription');

app.post('/api/tasks', checkUsageLimit('tasks'), (req, res) => {
  // Only allow if user hasn't exceeded task limit
  // Create task...
  res.json({ task: 'created' });
});
```

### Require Paid Plan

```javascript
const { requirePaidPlan } = require('./middleware/subscription');

app.get('/api/advanced-analytics', requirePaidPlan, (req, res) => {
  // Only paid plan users can access
  res.json({ analytics: 'data' });
});
```

## Testing

### Test Mode

Use Stripe test mode credentials (keys starting with `sk_test_` and `pk_test_`).

### Test Cards

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

### Webhook Testing

Use Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret and update `.env`.

## Subscription Plans

### Free Plan
- Price: $0/month
- Max Tasks: 100
- Max Projects: 5
- Max Time Entries: 100/month
- Features: Basic tasks, Basic time tracking

### Pro Plan
- Price: $9.99/month
- Max Tasks: 1,000
- Max Projects: 50
- Unlimited Time Entries
- Features: All basic features + Custom fields, Reports, API access

### Enterprise Plan
- Price: $29.99/month
- Unlimited Tasks
- Unlimited Projects
- Unlimited Time Entries
- Features: All Pro features + Priority support, Data export, Team collaboration

## Troubleshooting

### Webhook Signature Verification Fails

- Ensure `STRIPE_WEBHOOK_SECRET` is correctly set
- Check that webhook endpoint receives raw body (not JSON parsed)
- Verify the endpoint URL in Stripe dashboard matches your server

### Subscription Creation Fails

- Check Stripe API keys are correct
- Verify payment method is valid
- Check logs for detailed error messages

### Database Connection Issues

- Verify Neo4j is running
- Check `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD`
- Test connection using Neo4j Browser

## Production Deployment

### Security Checklist

- [ ] Use production Stripe keys (starting with `sk_live_`)
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Enable HTTPS for webhook endpoint
- [ ] Configure CORS for your frontend domain only
- [ ] Set up proper logging and monitoring
- [ ] Implement rate limiting
- [ ] Add authentication middleware to all protected routes

### Environment Variables

Ensure all production credentials are set:
- Production Stripe keys
- Production database credentials
- Strong JWT secret
- Production webhook secret

### Monitoring

Monitor these metrics:
- Subscription creation/cancellation rate
- Failed payment attempts
- Webhook processing errors
- API response times
- Database query performance

## Support

For issues or questions:
1. Check the design document: `/backend/database/docs/subscription-system-design.md`
2. Review Stripe documentation: https://stripe.com/docs
3. Check Neo4j documentation: https://neo4j.com/docs/

## Next Steps

1. Implement user authentication and authorization
2. Add email notifications for subscription events
3. Create frontend components for subscription management
4. Implement dunning management for failed payments
5. Add analytics dashboard for subscription metrics
6. Implement proration for mid-cycle plan changes
7. Add support for coupons and discounts
