# Database Design

## Node labels


**System-wide**
* `Enum`: a single node representing an enum with properties:


**User-specific**
* `Task`: nodes representing tasks
* `User`: stores account information for a user

**Task-specific**
* `TaskField`

**Subscription & Billing**
* `SubscriptionPlan`: available subscription plans
* `Subscription`: user subscriptions
* `PaymentMethod`: user payment methods
* `Invoice`: billing invoices
* `Payment`: payment records

## Tasks

### Entities
* `(:Task)`: the base node for a task. Its metadata comes from relations to `TaskProperty` nodes
    * `id`
    * `done: bool`
    * `name: str`
* `(:TaskProperty)`: a task property which can be system-defined, user-defined, or AI-suggested
    * `name`: name of the property (e.g. "due date")
    * `dtype`: one of the currently supported data types
    * `origin`: `{'user', 'base', 'auto'}`
* `[:HAS_PROP]`: relation from `Task` to `TaskProperty`
    * `value`: the value for the given property. Must match the property's `dtype`!

Example:
```cypher
(:Task {
    name: "mow the lawn"
})-[:HAS_PROP {
    value: "6-19-25 12:00:00 PM"
}]->(:TaskProperty {
    name: "deadline",
    dtype: "datetime"
})
```

Here we see the task "mow the lawn" has a relationship to the "dealine" task property, which expects to have a datetime property. We see the deadline on the `HAS_PROP` relationship.

## System Node Types

### `Enum`

Nodes with `Enum` label store allowable values for a particular property. 

#### `Enum` Node Properties
* `name: str!`
* `values: array`

#### `Enum` Nodes In Use
* `Countries: ['United States', 'Canada', ...]`
* `Langauges: ['English']` supported languages
* `TaskFieldDtypes: ['string', 'int', 'float', 'datetime', ...]` supported data types for task fields
* `UserRoles: ['user', 'admin']`
* `Timezones: [...]`

## User Node Types

### `Task` Nodes
`Task` nodes contain a few properties necessary for all tasks, listed below. 

#### Properties
* `taskId: randomUUID()!`
* `name: text`
* `done: bool`


#### Edges

`Task` nodes use `HAS_SUBTASK` edges to denote children, e.g. an individual task contributing to a project or a project contributing to a goal. Note that `Task` nodes can serve any heirarchy: a goal, a project, subproject, etc. Tasks with no `HAS_SUBTASK` relationships are therefore leaf nodes, most likely to be the next actionable items.

* `(:Task)-[:HAS_SUBTASK]->(:Task)` 
* `(:Task)-[:HAS_BASE_FIELD]->[:TaskField]` These associate Task nodes with system-defined fields. A use can hide these but not delete them. 
* `(:Task)-[:HAS_USER_FIELD]->[:TaskField]` For user-defined task fields
* `(:Task)-[:HAS_SUGG_FIELD]->[:TaskField]` For suggested fields that are not in use

### `TaskField` Nodes

Factoring out these 'fields' into their own nodes allows them to have any 
#### Properties
* `name: str`
* `value (index)` must match the datatype noted in the related `UserDefinedField` node

#### Edges
`(f:TaskField)-[:DEFINED_BY]->(udf:UserDefinedField)`
* `(:Task)-[:HAS_*_FIELD]->(:TaskField)`

In the application and at query time, we must ensure that the `value` set for any `TaskField` matches the value stored in the user's `UserDefinedField` node. For instance, if a user intends a `priority` property to have an `int` value it would cause errors to insert the string `"high priority"`.

When created, a task property should link to its defining node. This way on updates to the task property's value we can validate the data in constant time. NOTE: does creating an index on TaskPropertyDefinition.name obviate this?


#### Base `TaskField` Nodes

Predefined task properties. A user may or may not wish to use these properties, but they are either exceedingly common or useful to the suggestion engine to generate quality completions and insights.

* `notes: string`
* `Done At: datetime | null`
* `Created At: datetime`
* `Start After: datetime` -- user can choose to hide this task until this datetime
* `Last Modified: datetime`
* `Time Estimate: duration` estimated time to complete this action
* `Estimated Time Remaining: duration` calculated based on time estimate and logged TimeEntry nodes
* `tags: [string]` every Task would have an associated TaskField node with name 'tags' whose value is an array of strings

### `TimeEntry` Nodes
#### Properties
* `uuid: randomUUID()` (primary key)
* `start: datetime`
* `end: datetime`
* `duration: duration` compute this anyway, it will generally be useful

#### Edges
`(te:TimeEntry)-[:LOGGED_FOR]->(t:Task)`
`(te:TimeEntry)-[:LOGGED_BY]->(u:User)`

### `UserDefinedField` Nodes

#### Properties
`name: str`
`dtype: enum`
`createdAt: datetime`
`lastModified: datetime`

## User Node Types

### `User` node
Core data stored on the node. Preferences such as UI settings and task property visibility stored on `UserPreference` nodes.
* `userName: string`
* `firstName: string`
* `lastName: string`
* `password: string`
* `email: string`
* `phone: string` -- E.164 format
* `profileImage: string` (url)
* `createdAt: datetime`
* `lastLogin: datetime`
* `role: string` enum 
* `status: string` enum
* `address: string`
* `city: string`
* `country: string` enum
* `timezone: string` enum
* `language: string` enum


## Relations

### `HAS_PREFERENCE`
`(u:User)-[:HAS_PREFERENCE]->(p:UserPreference)`: indicates that user `u` has preference `p`

### `HAS_TASK`
`(u:User)-[:HAS_TASK]->(t:Task)`: indicates user `u` has task `t`

### `DEFINED_TASK_PROPERTY`
`(:User)-[:DEFINED_TASK_PROPERTY]->(:TaskPropertyDefinition)`: indicates user or the suggestion system has defined a task property datatype (e.g. `(d:TaskPropertyDefinition {name: deadline, dtype: datetime})`)

### `UserPreference` node
* `name: str` name of the preference setting
* `value: any`

## Subscription & Billing Node Types

### `SubscriptionPlan` Node

Available subscription tiers for users to purchase.

#### Properties
* `planId: string` (UUID, unique)
* `name: string` (e.g., "Free", "Pro", "Enterprise")
* `price: float` (monthly price in USD)
* `currency: string` (default: "usd")
* `interval: string` (enum: "month", "year")
* `maxTasks: int` (maximum tasks allowed, -1 for unlimited)
* `maxProjects: int` (maximum projects allowed, -1 for unlimited)
* `maxTimeEntries: int` (maximum time entries per month, -1 for unlimited)
* `features: array[string]` (list of feature flags)
* `stripePriceId: string` (Stripe Price ID)
* `stripeProductId: string` (Stripe Product ID)
* `active: bool` (whether plan is available for new subscriptions)
* `createdAt: datetime`
* `updatedAt: datetime`

### `Subscription` Node

User's active or past subscriptions.

#### Properties
* `subscriptionId: string` (UUID, unique)
* `stripeSubscriptionId: string` (Stripe Subscription ID)
* `stripeCustomerId: string` (Stripe Customer ID)
* `status: string` (enum: "active", "past_due", "canceled", "incomplete", "trialing")
* `currentPeriodStart: datetime`
* `currentPeriodEnd: datetime`
* `cancelAtPeriodEnd: bool`
* `trialStart: datetime` (nullable)
* `trialEnd: datetime` (nullable)
* `canceledAt: datetime` (nullable)
* `createdAt: datetime`
* `updatedAt: datetime`

#### Edges
* `(User)-[:HAS_SUBSCRIPTION]->(Subscription)`
* `(Subscription)-[:FOR_PLAN]->(SubscriptionPlan)`

### `PaymentMethod` Node

User's saved payment methods (credit cards, bank accounts, etc.).

#### Properties
* `paymentMethodId: string` (UUID, unique)
* `stripePaymentMethodId: string` (Stripe Payment Method ID)
* `type: string` (enum: "card", "bank_account")
* `last4: string` (last 4 digits of card/account)
* `brand: string` (e.g., "visa", "mastercard")
* `expiryMonth: int` (for cards)
* `expiryYear: int` (for cards)
* `isDefault: bool`
* `createdAt: datetime`
* `updatedAt: datetime`

#### Edges
* `(User)-[:HAS_PAYMENT_METHOD]->(PaymentMethod)`

### `Invoice` Node

Billing invoices for subscriptions.

#### Properties
* `invoiceId: string` (UUID, unique)
* `stripeInvoiceId: string` (Stripe Invoice ID)
* `amount: float`
* `currency: string`
* `status: string` (enum: "draft", "open", "paid", "void", "uncollectible")
* `invoiceNumber: string`
* `invoicePdf: string` (URL to PDF)
* `hostedInvoiceUrl: string` (Stripe hosted page URL)
* `periodStart: datetime`
* `periodEnd: datetime`
* `paid: bool`
* `paidAt: datetime` (nullable)
* `createdAt: datetime`

#### Edges
* `(User)-[:HAS_INVOICE]->(Invoice)`
* `(Invoice)-[:FOR_SUBSCRIPTION]->(Subscription)`
* `(Invoice)-[:PAID_WITH]->(Payment)`

### `Payment` Node

Records of successful or failed payment attempts.

#### Properties
* `paymentId: string` (UUID, unique)
* `stripeChargeId: string` (Stripe Charge ID)
* `amount: float`
* `currency: string`
* `status: string` (enum: "succeeded", "pending", "failed")
* `failureCode: string` (nullable)
* `failureMessage: string` (nullable)
* `receiptUrl: string` (Stripe receipt URL)
* `createdAt: datetime`

#### Edges
* `(Payment)-[:USING_METHOD]->(PaymentMethod)`

### Subscription-related Enums

Additional enum nodes for subscription system:
* `SubscriptionStatus: ['active', 'past_due', 'canceled', 'incomplete', 'trialing']`
* `PaymentMethodType: ['card', 'bank_account']`
* `InvoiceStatus: ['draft', 'open', 'paid', 'void', 'uncollectible']`
* `PaymentStatus: ['succeeded', 'pending', 'failed']`
