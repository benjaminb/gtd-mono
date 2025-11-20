CREATE INDEX enum_name_index IF NOT EXISTS
FOR (e:Enum) ON (e.name);

CREATE INDEX taskField_value_index IF NOT EXISTS
FOR (f:TaskField) ON (f.value);

// Subscription & Billing Indexes
CREATE INDEX subscription_status_index IF NOT EXISTS
FOR (s:Subscription) ON (s.status);

CREATE INDEX subscription_stripe_id_index IF NOT EXISTS
FOR (s:Subscription) ON (s.stripeSubscriptionId);

CREATE INDEX subscription_customer_id_index IF NOT EXISTS
FOR (s:Subscription) ON (s.stripeCustomerId);

CREATE INDEX invoice_status_index IF NOT EXISTS
FOR (i:Invoice) ON (i.status);

CREATE INDEX invoice_stripe_id_index IF NOT EXISTS
FOR (i:Invoice) ON (i.stripeInvoiceId);

CREATE INDEX payment_status_index IF NOT EXISTS
FOR (p:Payment) ON (p.status);

CREATE INDEX subscription_plan_active_index IF NOT EXISTS
FOR (sp:SubscriptionPlan) ON (sp.active);