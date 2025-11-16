# Backend Architecture Documentation

Complete reference for the GTD Task Manager backend implementation built with Node.js, Express, and Neo4j.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Data Models](#data-models)
5. [API Routes](#api-routes)
6. [Services](#services)
7. [Utilities](#utilities)
8. [Database Design](#database-design)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)

## Overview

The backend provides a RESTful API for managing tasks in a hierarchical graph structure with AI-powered suggestions, custom properties with type enforcement, and boolean expression search.

### Technology Stack

- **Runtime**: Node.js v16+
- **Framework**: Express.js
- **Database**: Neo4j 5.x (graph database)
- **AI**: OpenAI, Anthropic, or Ollama (configurable)
- **Security**: bcrypt for password hashing
- **Validation**: Custom property schema validation

### Key Features

- Graph-based task hierarchy using Neo4j relationships
- AI suggestions for subtasks, properties, and related tasks
- Property schema system with type enforcement
- Boolean expression parser for advanced search
- Analytics engine with filtering capabilities
- Natural language to expression conversion

## Project Structure

```
backend/database/
├── src/
│   ├── models/                  # Data models (Task, User, PropertySchema)
│   │   ├── Task.js             # Task model with graph operations
│   │   ├── User.js             # User authentication and management
│   │   └── PropertySchema.js   # Property type definitions
│   │
│   ├── routes/                  # API endpoint handlers
│   │   ├── tasks.js            # Task CRUD + search + hierarchy
│   │   ├── users.js            # Authentication endpoints
│   │   ├── suggestions.js      # AI suggestion endpoints
│   │   ├── analytics.js        # Reporting and analytics
│   │   └── propertySchemas.js  # Property schema management
│   │
│   ├── services/                # Business logic and external integrations
│   │   └── llm/
│   │       ├── LLMService.js        # Main LLM service (singleton)
│   │       ├── LLMProvider.js       # Base provider interface
│   │       ├── OpenAIProvider.js    # OpenAI implementation
│   │       ├── AnthropicProvider.js # Anthropic implementation
│   │       ├── OllamaProvider.js    # Ollama implementation
│   │       └── prompts.js           # Prompt templates
│   │
│   ├── utils/                   # Utilities and helpers
│   │   ├── database.js         # Neo4j driver setup
│   │   ├── initDatabase.js     # Database initialization
│   │   └── expressionParser.js # Boolean expression engine
│   │
│   ├── server.js               # Express app configuration
│   └── index.js                # Application entry point
│
├── docs/
│   └── database.md             # Original database design notes
│
├── .env.example                # Environment variables template
├── package.json
└── README.md
```

## Core Components

### 1. Models Layer (`src/models/`)

Models handle all database operations using Cypher queries. They provide an abstraction layer over Neo4j.

#### Task Model (`Task.js`)

**Purpose**: Manages task CRUD operations and graph relationships

**Key Methods**:

```javascript
// Create a new task
static async create({ userId, name, done, source, suggestionMetadata, customProperties })

// Find task by ID
static async findById(id)

// Update task properties
static async update(id, updates)

// Delete task
static async delete(id)

// Hierarchy operations
static async addSubtask(parentId, childId)
static async removeSubtask(parentId, childId)
static async getSubtasks(id)
static async getParents(id)
static async getHierarchy(id, maxDepth = 10)

// User/owner operations
static async getOwner(id)
static async belongsToUser(taskId, userId)

// AI suggestion operations
static async acceptSuggestion(id)
static async rejectSuggestion(id)

// Validation
static async validateCustomProperties(userId, customProperties)
```

**Implementation Details**:
- All custom properties validated against PropertySchema before save
- JSON properties stored as stringified JSON in Neo4j
- Automatic `source` field defaulting for backward compatibility
- Metadata parsing for AI suggestions
- Session management with proper cleanup

#### User Model (`User.js`)

**Purpose**: User authentication and profile management

**Key Methods**:

```javascript
// Create new user (password automatically hashed)
static async create({ username, email, password })

// Find user by ID or email
static async findById(id)
static async findByEmail(email)

// Authentication
static async login(email, password)

// Update user profile
static async update(id, updates)

// Delete user (cascade deletes all owned tasks)
static async delete(id)

// Get user's tasks
static async findByUserId(userId)
```

**Security Features**:
- Passwords hashed with bcrypt (10 rounds)
- Password hash never returned in queries
- Email and username uniqueness enforced by database constraints

#### PropertySchema Model (`PropertySchema.js`)

**Purpose**: Define and validate custom task property types

**Supported Data Types**:
- `text` - String values with optional maxLength
- `number` - Numeric values with optional min/max and integer constraint
- `date` - ISO date strings with optional range
- `boolean` - True/false values
- `select` - Dropdown with predefined options

**Key Methods**:

```javascript
// Create property schema
static async create({ userId, propertyName, dataType, constraints })

// Get all schemas for a user
static async getUserSchemas(userId)

// Update schema
static async update(schemaId, updates)

// Delete schema
static async delete(schemaId)

// Validate value against schema
static validateValue(schema, value)

// Get schema by property name
static async getByPropertyName(userId, propertyName)
```

**Validation Logic**:
```javascript
// Number validation example
if (schema.dataType === 'number') {
  const num = parseFloat(value);
  if (isNaN(num)) return { valid: false, error: 'Must be a number' };
  if (schema.constraints.min !== undefined && num < schema.constraints.min) {
    return { valid: false, error: `Must be at least ${schema.constraints.min}` };
  }
  if (schema.constraints.max !== undefined && num > schema.constraints.max) {
    return { valid: false, error: `Must be at most ${schema.constraints.max}` };
  }
  if (schema.constraints.integer && !Number.isInteger(num)) {
    return { valid: false, error: 'Must be an integer' };
  }
  return { valid: true, value: num };
}
```

### 2. Routes Layer (`src/routes/`)

Express route handlers that implement the REST API.

#### Tasks Routes (`tasks.js`)

**Endpoints**:

```javascript
POST   /api/tasks                    // Create task
GET    /api/tasks/:id                // Get task by ID
PUT    /api/tasks/:id                // Update task
DELETE /api/tasks/:id                // Delete task
POST   /api/tasks/:id/subtasks       // Add subtask relationship
DELETE /api/tasks/:id/subtasks/:childId  // Remove subtask
GET    /api/tasks/:id/subtasks       // Get all subtasks
GET    /api/tasks/:id/parents        // Get parent tasks
GET    /api/tasks/:id/hierarchy      // Get full hierarchy
GET    /api/tasks/:id/owner          // Get task owner
GET    /api/users/:userId/tasks      // Get all user's tasks
POST   /api/tasks/search             // Search with boolean expression
POST   /api/tasks/validate-expression  // Validate expression syntax
```

**Search Endpoint Implementation**:
```javascript
router.post('/search', async (req, res) => {
  const { userId, expression } = req.body;

  // Get all user tasks
  const allTasks = await Task.findByUserId(userId);

  // Filter using expression parser
  const matchingTasks = filterTasksByExpression(allTasks, expression);

  return res.json({
    totalTasks: allTasks.length,
    matchingTasks: matchingTasks.length,
    tasks: matchingTasks
  });
});
```

#### Users Routes (`users.js`)

**Endpoints**:

```javascript
POST   /api/users           // Register new user
POST   /api/users/login     // Login (returns user object)
GET    /api/users/:id       // Get user profile
PUT    /api/users/:id       // Update user profile
DELETE /api/users/:id       // Delete user account
GET    /api/users/:id/tasks // Get user's tasks
```

#### Suggestions Routes (`suggestions.js`)

**Endpoints**:

```javascript
POST /api/suggestions/subtasks          // Generate subtask suggestions
POST /api/suggestions/properties        // Generate property suggestions
POST /api/suggestions/related-tasks     // Generate related task suggestions
POST /api/suggestions/convert-to-expression  // Natural language → expression
POST /api/suggestions/:id/accept        // Accept AI suggestion
POST /api/suggestions/:id/reject        // Reject AI suggestion
GET  /api/suggestions/status            // Check LLM configuration
```

**Subtask Suggestion Flow**:
```javascript
router.post('/subtasks', async (req, res) => {
  const { taskId } = req.body;

  // Get parent task and existing subtasks
  const task = await Task.findById(taskId);
  const existingSubtasks = await Task.getSubtasks(taskId);

  // Generate suggestions via LLM
  const suggestions = await llmService.suggestSubtasks(task, existingSubtasks);

  // Create suggested tasks in database
  const owner = await Task.getOwner(taskId);
  const createdTasks = [];

  for (const suggestion of suggestions) {
    const suggestedTask = await Task.create({
      userId: owner.id,
      name: suggestion.name,
      source: 'ai-suggested',
      suggestionMetadata: suggestion.suggestionMetadata,
      customProperties: suggestion.customProperties || {}
    });

    // Link as subtask
    await Task.addSubtask(taskId, suggestedTask.id);
    createdTasks.push(suggestedTask);
  }

  return res.json(createdTasks);
});
```

#### Analytics Routes (`analytics.js`)

**Endpoints**:

```javascript
GET /api/analytics/completion         // Task completion statistics
GET /api/analytics/inactive-projects  // Find stale projects
GET /api/analytics/timeline           // Activity timeline
GET /api/analytics/property-distribution  // Property value breakdown
```

**All endpoints support optional `filter` parameter**:
```javascript
GET /api/analytics/completion?filter=priority%20%3D%20high%20AND%20done%20%3D%20false
```

**Implementation Pattern**:
```javascript
router.get('/completion', async (req, res) => {
  const { userId, startDate, endDate, groupBy, filter } = req.query;

  // Get all user tasks
  let tasks = await Task.findByUserId(userId);

  // Apply date filtering
  if (startDate) {
    tasks = tasks.filter(t => new Date(t.createdAt) >= new Date(startDate));
  }

  // Apply boolean expression filter
  if (filter && filter.trim()) {
    tasks = filterTasksByExpression(tasks, filter);
  }

  // Run aggregations on filtered tasks
  // ... aggregation logic

  return res.json({ data, filtered: !!filter });
});
```

#### Property Schemas Routes (`propertySchemas.js`)

**Endpoints**:

```javascript
POST   /api/property-schemas             // Create schema
GET    /api/property-schemas/user/:userId  // Get user's schemas
GET    /api/property-schemas/:id         // Get schema by ID
PUT    /api/property-schemas/:id         // Update schema
DELETE /api/property-schemas/:id         // Delete schema
POST   /api/property-schemas/validate    // Validate property value
POST   /api/property-schemas/:id/options // Update dropdown options
DELETE /api/property-schemas/:id/options/:option  // Remove dropdown option
```

### 3. Services Layer (`src/services/`)

Business logic and external service integrations.

#### LLM Service (`services/llm/LLMService.js`)

**Purpose**: Unified interface for AI model providers

**Architecture**: Singleton service with swappable providers

**Provider Pattern**:
```javascript
class LLMProvider {
  constructor(config) {}

  async completeJSON({ prompt, temperature, systemPrompt }) {
    // Must return parsed JSON object
  }

  getName() {
    // Return provider identifier (e.g., "openai-gpt-4o-mini")
  }
}
```

**Providers**:
1. **OpenAIProvider** - Uses OpenAI SDK, supports GPT-4, GPT-4o, GPT-3.5
2. **AnthropicProvider** - Uses Anthropic SDK, supports Claude 3.5 Sonnet, Haiku, Opus
3. **OllamaProvider** - Local models via Ollama API

**Key Methods**:

```javascript
// Generate subtask suggestions
async suggestSubtasks(task, existingSubtasks)

// Generate property suggestions
async suggestProperties(task, allPropertyNames)

// Generate related task suggestions
async suggestRelatedTasks(task, siblingTasks)

// Convert natural language to boolean expression
async convertToExpression(naturalLanguage, availableProperties)

// Check configuration
isConfigured()
getProviderName()

// Runtime provider switching
switchProvider(providerType, config)
```

**Configuration** (via `.env`):
```bash
LLM_PROVIDER=openai  # or 'anthropic' or 'ollama'

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Ollama
OLLAMA_MODEL=llama3.1
OLLAMA_BASE_URL=http://localhost:11434
```

#### Prompts (`services/llm/prompts.js`)

**Purpose**: Centralized prompt templates for LLM requests

**Key Functions**:

```javascript
// Generate subtask suggestions
generateSubtaskSuggestionPrompt(task, existingSubtasks)

// Generate property suggestions
generatePropertySuggestionPrompt(task, allPropertyNames)

// Generate related task suggestions
generateRelatedTaskSuggestionPrompt(task, siblingTasks)

// Convert natural language to expression
generateExpressionConversionPrompt(naturalLanguage, availableProperties)

// Generate emoji prediction
generateEmojiPredictionPrompt(task)
```

**Prompt Structure** (example for subtasks):
```javascript
function generateSubtaskSuggestionPrompt(task, existingSubtasks) {
  return `You are a task management assistant. Given a parent task, suggest 2-4 actionable subtasks.

Parent Task: "${task.name}"

${existingSubtasks.length > 0 ? `Existing Subtasks:\n${existingSubtasks.map(st => `- ${st.name}`).join('\n')}` : 'No existing subtasks.'}

${task.customProperties && Object.keys(task.customProperties).length > 0
  ? `Properties: ${JSON.stringify(task.customProperties)}`
  : ''}

Return JSON in this format:
{
  "suggestions": [
    {
      "name": "Subtask name",
      "reasoning": "Why this subtask is important",
      "confidence": 0.85,
      "customProperties": {}
    }
  ]
}

Guidelines:
- Suggest specific, actionable tasks
- Avoid duplicating existing subtasks
- Confidence: 0.0-1.0 (be honest about uncertainty)
- Keep subtask names clear and concise`;
}
```

### 4. Utilities Layer (`src/utils/`)

#### Database Utility (`database.js`)

**Purpose**: Neo4j driver configuration and connection management

```javascript
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD
  )
);

// Verify connectivity on startup
driver.verifyConnectivity()
  .then(() => console.log('Neo4j connected'))
  .catch(err => console.error('Neo4j connection failed:', err));

module.exports = driver;
```

**Session Pattern**:
```javascript
const session = driver.session();
try {
  const result = await session.run('CYPHER QUERY', params);
  // Process result
} finally {
  await session.close();  // Always close sessions
}
```

#### Database Initialization (`initDatabase.js`)

**Purpose**: Create constraints and indexes for optimal performance

```javascript
async function initDatabase() {
  const session = driver.session();

  try {
    // User constraints
    await session.run(`
      CREATE CONSTRAINT user_id_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.id IS UNIQUE
    `);

    await session.run(`
      CREATE CONSTRAINT user_email_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.email IS UNIQUE
    `);

    // Task constraints
    await session.run(`
      CREATE CONSTRAINT task_id_unique IF NOT EXISTS
      FOR (t:Task) REQUIRE t.id IS UNIQUE
    `);

    // PropertySchema constraints
    await session.run(`
      CREATE CONSTRAINT property_schema_id_unique IF NOT EXISTS
      FOR (p:PropertySchema) REQUIRE p.id IS UNIQUE
    `);

    console.log('Database initialized successfully');
  } finally {
    await session.close();
  }
}
```

#### Expression Parser (`expressionParser.js`)

**Purpose**: Parse and evaluate boolean expressions for task filtering

**Architecture**: Tokenizer → Parser → Evaluator

**Supported Syntax**:
- **Operators**: `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`, `contains`, `not contains`
- **Boolean Logic**: `AND`, `OR`, `NOT`, `&&`, `||`
- **Grouping**: `( )`
- **Data Types**: strings, numbers, booleans, dates, null
- **Special Values**: `today`, `yesterday`, `tomorrow`, `null`, `empty`, `none`

**Main Functions**:

```javascript
// Filter array of tasks by expression
function filterTasksByExpression(tasks, expression)

// Parse expression to AST
function parseExpression(expression)

// Evaluate AST against single task
function evaluateExpression(task, ast)
```

**Implementation Details**:

1. **Tokenizer**: Breaks expression into tokens
```javascript
"priority = high AND done = false"
→ [
  { type: 'IDENTIFIER', value: 'priority' },
  { type: 'OPERATOR', value: '=' },
  { type: 'IDENTIFIER', value: 'high' },
  { type: 'AND', value: 'AND' },
  { type: 'IDENTIFIER', value: 'done' },
  { type: 'OPERATOR', value: '=' },
  { type: 'BOOLEAN', value: 'false' }
]
```

2. **Parser**: Builds Abstract Syntax Tree
```javascript
{
  type: 'AND',
  left: {
    type: 'COMPARISON',
    operator: '=',
    left: { type: 'PROPERTY', name: 'priority' },
    right: { type: 'VALUE', value: 'high' }
  },
  right: {
    type: 'COMPARISON',
    operator: '=',
    left: { type: 'PROPERTY', name: 'done' },
    right: { type: 'VALUE', value: false }
  }
}
```

3. **Evaluator**: Executes AST against task objects
```javascript
function evaluateComparison(task, operator, propertyName, expectedValue) {
  const actualValue = getPropertyValue(task, propertyName);

  switch (operator) {
    case '=':
      return compareValues(actualValue, expectedValue, 'equals');
    case '!=':
    case '<>':
      return !compareValues(actualValue, expectedValue, 'equals');
    case '<':
      return compareValues(actualValue, expectedValue, 'less');
    // ... etc
  }
}
```

**Type-Aware Comparison**:
```javascript
function compareValues(actual, expected, comparison) {
  // Null/undefined handling
  if (actual == null || expected == null) {
    return comparison === 'equals' ? actual == expected : actual != expected;
  }

  // Number comparison
  const actualNum = parseFloat(actual);
  const expectedNum = parseFloat(expected);
  if (!isNaN(actualNum) && !isNaN(expectedNum)) {
    return performNumericComparison(actualNum, expectedNum, comparison);
  }

  // Date comparison
  if (isDate(actual) || isDate(expected)) {
    return performDateComparison(actual, expected, comparison);
  }

  // String comparison (case-insensitive)
  return performStringComparison(String(actual), String(expected), comparison);
}
```

## Database Design

### Node Types

#### User Node
```cypher
(:User {
  id: String,           // UUID
  username: String,     // Unique
  email: String,        // Unique
  passwordHash: String,
  createdAt: String     // ISO date
})
```

#### Task Node
```cypher
(:Task {
  id: String,                  // UUID
  name: String,
  done: Boolean,
  source: String,             // 'user' | 'ai-suggested' | 'ai-accepted'
  suggestionMetadata: String, // JSON string
  customProperties: String,   // JSON string
  createdAt: String,          // ISO date
  updatedAt: String           // ISO date
})
```

#### PropertySchema Node
```cypher
(:PropertySchema {
  id: String,           // UUID
  propertyName: String,
  dataType: String,     // 'text' | 'number' | 'date' | 'boolean' | 'select'
  constraints: String,  // JSON string
  createdAt: String,
  updatedAt: String
})
```

### Relationships

```cypher
(:User)-[:OWNS]->(:Task)
(:Task)-[:HAS_SUBTASK]->(:Task)
(:User)-[:HAS_PROPERTY_SCHEMA]->(:PropertySchema)
```

### Indexes and Constraints

```cypher
// Uniqueness constraints
CREATE CONSTRAINT user_id_unique FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT user_email_unique FOR (u:User) REQUIRE u.email IS UNIQUE;
CREATE CONSTRAINT task_id_unique FOR (t:Task) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT property_schema_id_unique FOR (p:PropertySchema) REQUIRE p.id IS UNIQUE;
```

## Error Handling

### Standard Error Response Format

```javascript
{
  "error": "Human-readable error message",
  "details": "Optional additional context"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

### Error Handling Pattern

```javascript
router.post('/endpoint', async (req, res) => {
  try {
    // Business logic
    const result = await someOperation();
    res.json(result);
  } catch (error) {
    console.error('Error in endpoint:', error);

    if (error.message.includes('Invalid custom properties')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Testing Strategy

### Model Tests
- Unit tests for each CRUD operation
- Graph relationship integrity
- Property validation edge cases
- Concurrent operation handling

### Route Tests
- HTTP endpoint integration tests
- Request validation
- Authentication flows
- Error scenarios

### Service Tests
- LLM provider mocking
- Expression parser edge cases
- Analytics aggregation correctness

### Database Tests
- Constraint enforcement
- Transaction rollback
- Connection pooling

## Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# LLM Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
OLLAMA_MODEL=llama3.1
OLLAMA_BASE_URL=http://localhost:11434
```

## Performance Considerations

1. **Session Management**: Always close Neo4j sessions in `finally` blocks
2. **JSON Parsing**: Cached at model layer to avoid repeated parsing
3. **Batch Operations**: Consider bulk create/update for large datasets
4. **Expression Filtering**: Done in-memory (fast for <10k tasks)
5. **LLM Caching**: Consider implementing request/response caching
6. **Connection Pooling**: Neo4j driver handles automatically

## Security Best Practices

1. **Password Hashing**: Never store plain text passwords
2. **Input Validation**: Validate all user inputs
3. **Parameterized Queries**: All Cypher queries use parameters (prevent injection)
4. **Environment Variables**: Never commit `.env` files
5. **API Keys**: Rotate regularly, use separate keys for dev/prod
6. **Error Messages**: Don't leak sensitive information in errors

## Extension Points

### Adding New Data Types to PropertySchema

1. Add type to `validateValue()` in `PropertySchema.js`
2. Update frontend input component
3. Add type to documentation

### Adding New LLM Provider

1. Create new provider class extending `LLMProvider`
2. Implement `completeJSON()` and `getName()` methods
3. Add to `LLMService.initializeProvider()` switch statement
4. Update `.env.example` with configuration

### Adding New Analytics Report

1. Add endpoint to `routes/analytics.js`
2. Implement aggregation logic
3. Support `filter` parameter
4. Update frontend to call new endpoint
