CREATE CONSTRAINT unique_task_taskId IF NOT EXISTS
FOR (t:Task)
REQUIRE t.taskId IS UNIQUE;

CREATE CONSTRAINT unique_enum_name IF NOT EXISTS
FOR (e:Enum)
REQUIRE e.name IS UNIQUE;

// Subscription & Billing Constraints
CREATE CONSTRAINT unique_subscription_plan_id IF NOT EXISTS
FOR (sp:SubscriptionPlan)
REQUIRE sp.planId IS UNIQUE;

CREATE CONSTRAINT unique_subscription_id IF NOT EXISTS
FOR (s:Subscription)
REQUIRE s.subscriptionId IS UNIQUE;

CREATE CONSTRAINT unique_subscription_stripe_id IF NOT EXISTS
FOR (s:Subscription)
REQUIRE s.stripeSubscriptionId IS UNIQUE;

CREATE CONSTRAINT unique_payment_method_id IF NOT EXISTS
FOR (pm:PaymentMethod)
REQUIRE pm.paymentMethodId IS UNIQUE;

CREATE CONSTRAINT unique_invoice_id IF NOT EXISTS
FOR (i:Invoice)
REQUIRE i.invoiceId IS UNIQUE;

CREATE CONSTRAINT unique_payment_id IF NOT EXISTS
FOR (p:Payment)
REQUIRE p.paymentId IS UNIQUE;