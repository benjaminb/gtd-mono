# API Reference

Complete REST API documentation for the GTD Task Manager backend.

## Table of Contents

1. [Authentication](#authentication)
2. [Task Endpoints](#task-endpoints)
3. [User Endpoints](#user-endpoints)
4. [Suggestion Endpoints](#suggestion-endpoints)
5. [Property Schema Endpoints](#property-schema-endpoints)
6. [Analytics Endpoints](#analytics-endpoints)
7. [Search Endpoints](#search-endpoints)
8. [Error Responses](#error-responses)

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently the API uses a simple user-based authentication model. Future versions will include JWT tokens.

## Task Endpoints

### Create Task

Create a new task.

```http
POST /api/tasks
```

**Request Body**:
```json
{
  "userId": "user-uuid",
  "name": "Complete project documentation",
  "done": false,
  "source": "user",
  "customProperties": {
    "priority": "high",
    "dueDate": "2024-12-31",
    "estimatedHours": 8
  }
}
```

**Response** `201 Created`:
```json
{
  "id": "task-uuid",
  "name": "Complete project documentation",
  "done": false,
  "source": "user",
  "suggestionMetadata": null,
  "customProperties": {
    "priority": "high",
    "dueDate": "2024-12-31",
    "estimatedHours": 8
  },
  "createdAt": "2024-11-16T10:00:00Z",
  "updatedAt": "2024-11-16T10:00:00Z"
}
```

**Validation**:
- `userId` (required): Must be valid user ID
- `name` (required): Task name (non-empty string)
- `done` (optional): Boolean, defaults to `false`
- `source` (optional): `'user'`, `'ai-suggested'`, or `'ai-accepted'`, defaults to `'user'`
- `customProperties` (optional): Object validated against user's property schemas

**Errors**:
- `400`: Invalid custom properties
- `404`: User not found

---

### Get Task

Retrieve a single task by ID.

```http
GET /api/tasks/:id
```

**Parameters**:
- `id`: Task UUID

**Response** `200 OK`:
```json
{
  "id": "task-uuid",
  "name": "Complete project documentation",
  "done": false,
  "source": "user",
  "suggestionMetadata": null,
  "customProperties": {
    "priority": "high"
  },
  "createdAt": "2024-11-16T10:00:00Z",
  "updatedAt": "2024-11-16T10:00:00Z"
}
```

**Errors**:
- `404`: Task not found

---

### Update Task

Update an existing task.

```http
PUT /api/tasks/:id
```

**Request Body** (all fields optional):
```json
{
  "name": "Updated task name",
  "done": true,
  "source": "user",
  "customProperties": {
    "priority": "medium",
    "notes": "Additional context"
  }
}
```

**Response** `200 OK`:
```json
{
  "id": "task-uuid",
  "name": "Updated task name",
  "done": true,
  "source": "user",
  "customProperties": {
    "priority": "medium",
    "notes": "Additional context"
  },
  "updatedAt": "2024-11-16T11:00:00Z",
  ...
}
```

**Errors**:
- `400`: Invalid custom properties
- `404`: Task not found

---

### Delete Task

Delete a task and all its relationships.

```http
DELETE /api/tasks/:id
```

**Response** `200 OK`:
```json
{
  "success": true
}
```

**Errors**:
- `404`: Task not found

---

### Add Subtask Relationship

Link a child task to a parent task.

```http
POST /api/tasks/:id/subtasks
```

**Request Body**:
```json
{
  "childId": "child-task-uuid"
}
```

**Response** `200 OK`:
```json
{
  "parent": { ...parentTask },
  "child": { ...childTask }
}
```

**Errors**:
- `404`: Parent or child task not found

---

### Remove Subtask Relationship

Unlink a child task from a parent task.

```http
DELETE /api/tasks/:id/subtasks/:childId
```

**Response** `200 OK`:
```json
{
  "success": true
}
```

---

### Get Subtasks

Retrieve all direct subtasks of a task.

```http
GET /api/tasks/:id/subtasks
```

**Response** `200 OK`:
```json
[
  {
    "id": "subtask-1-uuid",
    "name": "Design mockups",
    "done": false,
    ...
  },
  {
    "id": "subtask-2-uuid",
    "name": "Implement frontend",
    "done": true,
    ...
  }
]
```

---

### Get Parent Tasks

Retrieve all parent tasks of a task.

```http
GET /api/tasks/:id/parents
```

**Response** `200 OK`:
```json
[
  {
    "id": "parent-uuid",
    "name": "Build Website",
    ...
  }
]
```

---

### Get Task Hierarchy

Retrieve a task with all its subtasks recursively.

```http
GET /api/tasks/:id/hierarchy?maxDepth=10
```

**Query Parameters**:
- `maxDepth` (optional): Maximum depth to traverse, default 10

**Response** `200 OK`:
```json
{
  "id": "task-uuid",
  "name": "Launch Product",
  "subtasks": [
    {
      "id": "subtask-1",
      "name": "Market Research",
      "subtasks": [
        {
          "id": "subtask-1-1",
          "name": "Survey customers",
          "subtasks": []
        }
      ]
    }
  ],
  ...
}
```

---

### Get Task Owner

Get the user who owns a task.

```http
GET /api/tasks/:id/owner
```

**Response** `200 OK`:
```json
{
  "id": "user-uuid",
  "username": "alice",
  "email": "alice@example.com",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Note**: `passwordHash` is never returned.

---

### Accept AI Suggestion

Convert an AI suggestion to accepted status.

```http
POST /api/tasks/:id/accept-suggestion
```

**Response** `200 OK`:
```json
{
  "id": "task-uuid",
  "source": "ai-accepted",
  "suggestionMetadata": {
    "generatedBy": "openai-gpt-4o-mini",
    "generatedAt": "2024-11-16T10:00:00Z",
    "confidence": 0.85,
    "reasoning": "...",
    "acceptedAt": "2024-11-16T11:00:00Z"
  },
  ...
}
```

**Errors**:
- `400`: Task is not an AI suggestion
- `404`: Task not found

---

### Reject AI Suggestion

Delete an AI suggested task.

```http
DELETE /api/tasks/:id/reject-suggestion
```

**Response** `200 OK`:
```json
{
  "success": true
}
```

**Errors**:
- `400`: Task is not an AI suggestion
- `404`: Task not found

## User Endpoints

### Create User (Register)

Register a new user account.

```http
POST /api/users
```

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response** `201 Created`:
```json
{
  "id": "user-uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2024-11-16T10:00:00Z"
}
```

**Validation**:
- `username`: Required, unique
- `email`: Required, unique, valid email format
- `password`: Required, minimum 6 characters

**Errors**:
- `400`: Validation error or duplicate username/email

---

### Login

Authenticate a user.

```http
POST /api/users/login
```

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response** `200 OK`:
```json
{
  "id": "user-uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2024-11-16T10:00:00Z"
}
```

**Errors**:
- `401`: Invalid credentials

---

### Get User

Retrieve user profile.

```http
GET /api/users/:id
```

**Response** `200 OK`:
```json
{
  "id": "user-uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2024-11-16T10:00:00Z"
}
```

**Errors**:
- `404`: User not found

---

### Update User

Update user profile.

```http
PUT /api/users/:id
```

**Request Body** (all optional):
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

**Response** `200 OK`:
```json
{
  "id": "user-uuid",
  "username": "newusername",
  "email": "newemail@example.com",
  ...
}
```

---

### Delete User

Delete user account and all owned tasks.

```http
DELETE /api/users/:id
```

**Response** `200 OK`:
```json
{
  "success": true
}
```

---

### Get User's Tasks

Retrieve all tasks owned by a user.

```http
GET /api/users/:userId/tasks
```

**Response** `200 OK`:
```json
[
  {
    "id": "task-1-uuid",
    "name": "Task 1",
    ...
  },
  {
    "id": "task-2-uuid",
    "name": "Task 2",
    ...
  }
]
```

## Suggestion Endpoints

### Generate Subtask Suggestions

Get AI-generated subtask suggestions for a task.

```http
POST /api/suggestions/subtasks
```

**Request Body**:
```json
{
  "taskId": "parent-task-uuid",
  "userId": "user-uuid"
}
```

**Response** `200 OK`:
```json
[
  {
    "id": "suggested-task-uuid",
    "name": "Research competitors",
    "source": "ai-suggested",
    "suggestionMetadata": {
      "generatedBy": "openai-gpt-4o-mini",
      "generatedAt": "2024-11-16T10:00:00Z",
      "confidence": 0.85,
      "reasoning": "This subtask is important because...",
      "type": "subtask"
    },
    "customProperties": {},
    ...
  }
]
```

**Notes**:
- Suggestions automatically created and linked as subtasks
- Returns created suggestion tasks

**Errors**:
- `500`: LLM provider not configured
- `404`: Task not found

---

### Generate Property Suggestions

Get AI-suggested properties for a task.

```http
POST /api/suggestions/properties
```

**Request Body**:
```json
{
  "taskId": "task-uuid",
  "allPropertyNames": ["priority", "dueDate", "status"]
}
```

**Response** `200 OK`:
```json
[
  {
    "propertyName": "priority",
    "propertyValue": "high",
    "reasoning": "This task seems urgent based on...",
    "confidence": 0.8,
    "suggestionMetadata": {
      "generatedBy": "openai-gpt-4o-mini",
      "generatedAt": "2024-11-16T10:00:00Z",
      "type": "property"
    }
  }
]
```

**Notes**:
- Suggestions NOT automatically applied
- Frontend must handle acceptance/rejection

---

### Generate Related Task Suggestions

Get AI-suggested related tasks (siblings).

```http
POST /api/suggestions/related-tasks
```

**Request Body**:
```json
{
  "taskId": "task-uuid",
  "userId": "user-uuid"
}
```

**Response** `200 OK`:
```json
[
  {
    "name": "Related task name",
    "reasoning": "This task complements the current task by...",
    "confidence": 0.75,
    "source": "ai-suggested",
    ...
  }
]
```

---

### Convert Natural Language to Expression

Convert a natural language query to a boolean expression.

```http
POST /api/suggestions/convert-to-expression
```

**Request Body**:
```json
{
  "naturalLanguage": "show me high priority tasks that aren't done",
  "userId": "user-uuid"
}
```

**Response** `200 OK`:
```json
{
  "expression": "priority = high AND done = false",
  "explanation": "This expression finds tasks with high priority that are not marked as complete",
  "confidence": 0.92,
  "originalQuery": "show me high priority tasks that aren't done"
}
```

**Errors**:
- `500`: LLM provider not configured

---

### Get LLM Status

Check if LLM provider is configured.

```http
GET /api/suggestions/status
```

**Response** `200 OK`:
```json
{
  "configured": true,
  "provider": "openai-gpt-4o-mini"
}
```

## Property Schema Endpoints

### Create Property Schema

Define a new property type.

```http
POST /api/property-schemas
```

**Request Body**:
```json
{
  "userId": "user-uuid",
  "propertyName": "priority",
  "dataType": "number",
  "constraints": {
    "min": 1,
    "max": 5,
    "integer": true
  }
}
```

**Data Types and Constraints**:

**Text**:
```json
{
  "dataType": "text",
  "constraints": {
    "maxLength": 500
  }
}
```

**Number**:
```json
{
  "dataType": "number",
  "constraints": {
    "min": 0,
    "max": 100,
    "integer": false
  }
}
```

**Date**:
```json
{
  "dataType": "date",
  "constraints": {
    "minDate": "2024-01-01",
    "maxDate": "2025-12-31"
  }
}
```

**Boolean**:
```json
{
  "dataType": "boolean",
  "constraints": {}
}
```

**Select (Dropdown)**:
```json
{
  "dataType": "select",
  "constraints": {
    "options": ["todo", "in-progress", "review", "done"]
  }
}
```

**Response** `201 Created`:
```json
{
  "id": "schema-uuid",
  "propertyName": "priority",
  "dataType": "number",
  "constraints": {
    "min": 1,
    "max": 5,
    "integer": true
  },
  "userId": "user-uuid",
  "createdAt": "2024-11-16T10:00:00Z",
  "updatedAt": "2024-11-16T10:00:00Z"
}
```

---

### Get User's Property Schemas

Retrieve all property schemas for a user.

```http
GET /api/property-schemas/user/:userId
```

**Response** `200 OK`:
```json
[
  {
    "id": "schema-1-uuid",
    "propertyName": "priority",
    "dataType": "number",
    ...
  },
  {
    "id": "schema-2-uuid",
    "propertyName": "status",
    "dataType": "select",
    ...
  }
]
```

---

### Get Property Schema

Retrieve a single property schema.

```http
GET /api/property-schemas/:id
```

**Response** `200 OK`:
```json
{
  "id": "schema-uuid",
  "propertyName": "priority",
  "dataType": "number",
  "constraints": { ... },
  ...
}
```

---

### Update Property Schema

Update an existing schema.

```http
PUT /api/property-schemas/:id
```

**Request Body**:
```json
{
  "dataType": "number",
  "constraints": {
    "min": 0,
    "max": 10
  }
}
```

**Response** `200 OK`:
```json
{
  "id": "schema-uuid",
  "propertyName": "priority",
  "dataType": "number",
  "constraints": {
    "min": 0,
    "max": 10
  },
  "updatedAt": "2024-11-16T11:00:00Z",
  ...
}
```

---

### Delete Property Schema

Delete a property schema.

```http
DELETE /api/property-schemas/:id
```

**Response** `200 OK`:
```json
{
  "success": true
}
```

**Note**: Does not delete property values on existing tasks.

---

### Validate Property Value

Validate a property value against a schema.

```http
POST /api/property-schemas/validate
```

**Request Body**:
```json
{
  "userId": "user-uuid",
  "propertyName": "priority",
  "value": 3
}
```

**Response** `200 OK` (valid):
```json
{
  "valid": true,
  "value": 3
}
```

**Response** `200 OK` (invalid):
```json
{
  "valid": false,
  "error": "Value must be at least 1"
}
```

---

### Update Dropdown Options

Update options for a select-type property schema.

```http
POST /api/property-schemas/:id/options
```

**Request Body**:
```json
{
  "options": ["todo", "in-progress", "review", "done", "blocked"]
}
```

**Response** `200 OK`:
```json
{
  "id": "schema-uuid",
  "constraints": {
    "options": ["todo", "in-progress", "review", "done", "blocked"]
  },
  ...
}
```

---

### Delete Dropdown Option

Remove an option from a select-type schema.

```http
DELETE /api/property-schemas/:id/options/:option
```

**Response** `200 OK`:
```json
{
  "success": true
}
```

## Analytics Endpoints

All analytics endpoints support an optional `filter` query parameter with a boolean expression.

### Task Completion Analytics

Get task completion statistics.

```http
GET /api/analytics/completion
```

**Query Parameters**:
- `userId` (required): User ID
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `groupBy` (optional): `'parent'` or `'property'`
- `propertyName` (optional): Property to group by (required if `groupBy='property'`)
- `filter` (optional): Boolean expression (e.g., `priority = high AND done = false`)

**Response** `200 OK`:
```json
{
  "data": [
    {
      "parentName": "Build Website",
      "totalTasks": 10,
      "completedTasks": 7,
      "completionRate": 0.7
    },
    {
      "parentName": "Marketing Campaign",
      "totalTasks": 5,
      "completedTasks": 2,
      "completionRate": 0.4
    }
  ],
  "filtered": true
}
```

---

### Inactive Projects

Find projects with no recent activity.

```http
GET /api/analytics/inactive-projects
```

**Query Parameters**:
- `userId` (required): User ID
- `daysSinceUpdate` (optional): Days threshold, default 30
- `minSubtasks` (optional): Minimum subtask count, default 2
- `filter` (optional): Boolean expression

**Response** `200 OK`:
```json
{
  "data": [
    {
      "taskId": "task-uuid",
      "taskName": "Old Project",
      "lastUpdated": "2024-09-01T00:00:00Z",
      "daysSinceUpdate": 76,
      "subtaskCount": 5,
      "completedCount": 1
    }
  ],
  "filtered": false
}
```

---

### Activity Timeline

Get task creation and completion timeline.

```http
GET /api/analytics/timeline
```

**Query Parameters**:
- `userId` (required): User ID
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `filter` (optional): Boolean expression

**Response** `200 OK`:
```json
{
  "data": [
    {
      "date": "2024-11-15",
      "created": 5,
      "completed": 3
    },
    {
      "date": "2024-11-16",
      "created": 2,
      "completed": 4
    }
  ],
  "filtered": false
}
```

---

### Property Distribution

Get distribution of property values.

```http
GET /api/analytics/property-distribution
```

**Query Parameters**:
- `userId` (required): User ID
- `propertyName` (required): Property to analyze
- `filter` (optional): Boolean expression

**Response** `200 OK`:
```json
{
  "data": [
    {
      "value": "high",
      "count": 15
    },
    {
      "value": "medium",
      "count": 23
    },
    {
      "value": "low",
      "count": 8
    }
  ],
  "filtered": true
}
```

## Search Endpoints

### Search Tasks

Search tasks using boolean expressions.

```http
POST /api/tasks/search
```

**Request Body**:
```json
{
  "userId": "user-uuid",
  "expression": "priority = high AND done = false"
}
```

**Response** `200 OK`:
```json
{
  "totalTasks": 100,
  "matchingTasks": 15,
  "tasks": [
    {
      "id": "task-1-uuid",
      "name": "Important task",
      "done": false,
      "customProperties": {
        "priority": "high"
      },
      ...
    }
  ]
}
```

**Errors**:
- `400`: Invalid expression syntax

---

### Validate Expression

Validate boolean expression syntax.

```http
POST /api/tasks/validate-expression
```

**Request Body**:
```json
{
  "expression": "priority = high AND done = false"
}
```

**Response** `200 OK` (valid):
```json
{
  "valid": true
}
```

**Response** `200 OK` (invalid):
```json
{
  "valid": false,
  "error": "Invalid token at: priorty"
}
```

## Error Responses

### Standard Error Format

All errors return JSON:

```json
{
  "error": "Human-readable error message",
  "details": "Optional additional context"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, invalid data)
- `401` - Unauthorized (invalid credentials)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (unexpected errors)

### Common Error Examples

**Validation Error** `400`:
```json
{
  "error": "Invalid custom properties: {\"priority\":\"Value must be at least 1\"}"
}
```

**Not Found** `404`:
```json
{
  "error": "Task not found"
}
```

**Unauthorized** `401`:
```json
{
  "error": "Invalid credentials"
}
```

**LLM Error** `500`:
```json
{
  "error": "LLM provider not configured"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Future versions will include:
- Per-user rate limits
- Per-endpoint throttling
- LLM request quotas

## Versioning

API version is not currently in the URL. Future versions may use:
```
/api/v1/tasks
/api/v2/tasks
```

## CORS

CORS is enabled for all origins in development. Production should configure specific allowed origins.

## Pagination

Currently no endpoints support pagination. All endpoints return full result sets. For large datasets, consider implementing:

```http
GET /api/users/:userId/tasks?page=1&limit=50
```

Future implementation recommended for tasks and search results.

## WebSocket Support

Not currently implemented. Future enhancement for real-time updates:
- Task changes broadcast to connected clients
- AI suggestion progress notifications
- Collaborative editing support
