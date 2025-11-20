# AI Features and Subtask Management Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [AI Configuration](#ai-configuration)
3. [Subtask Management](#subtask-management)
4. [API Endpoints](#api-endpoints)
5. [Examples](#examples)

---

## Quick Start

```bash
# Start the database
docker-compose up -d neo4j

# Start your backend server (AI checks happen automatically)
cd backend/database
npm install
npm run dev
```

The server will check if Ollama is available at startup and let you know the status.

---

## AI Configuration

### Default: Ollama (Local Development)

The system uses **Ollama** by default - no API keys needed. The server will check if it's available and tell you if you need to install or start it.

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral-nemo  # Change this to use a different model
```

**Don't have Ollama?** Install it from https://ollama.ai

### Alternative Providers

**OpenAI:**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key
```

**Anthropic:**
```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

**Disable AI:**
```bash
AI_PROVIDER=disabled
```

---

## Subtask Management

### Overview

The system now supports hierarchical task relationships with:
- **One-to-one parent relationship**: A task can only have ONE parent
- **Multiple children**: A task can have many subtasks
- **Cycle prevention**: System prevents circular dependencies
- **Automatic parent removal**: Setting a new parent removes the old one

### How It Works

```
Project: Build Website
├── Design Phase
│   ├── Create wireframes
│   └── Design mockups
└── Development Phase
    ├── Set up project
    └── Implement features
```

### Rules

1. **One Parent Only**: A task cannot be a subtask of multiple tasks
2. **No Cycles**: Cannot make a parent task a subtask of its child
3. **No Self-Reference**: A task cannot be its own subtask
4. **Automatic Cleanup**: Old parent relationships are removed when creating new ones

### Cycle Prevention Examples

**Prevented:**
- Task A → Task B → Task C, then trying to make Task A a subtask of Task C ❌
- Making a task its own subtask ❌
- Making a parent task a subtask of its child ❌

**Allowed:**
- Task A → Task B, then making Task B independent ✅
- Task A → Task B, then making Task B a child of Task C (removes A→B, creates C→B) ✅
- Task A with multiple children (A→B, A→C, A→D) ✅

---

## API Endpoints

### Task CRUD Operations

#### Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "name": "Write project proposal",
  "description": "Draft initial proposal for new project",
  "done": false
}
```

#### Get All Tasks
```http
GET /api/tasks
```

#### Get Single Task
```http
GET /api/tasks/:id
```

#### Update Task
```http
PUT /api/tasks/:id
Content-Type: application/json

{
  "name": "Updated task name",
  "done": true
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
```

### Subtask Management

#### Make Task a Subtask
```http
POST /api/tasks/:childId/make-subtask
Content-Type: application/json

{
  "parentId": "uuid-of-parent-task"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Subtask relationship created successfully",
  "hadPreviousParent": true,
  "parent": { "taskId": "...", "name": "..." },
  "child": { "taskId": "...", "name": "..." }
}
```

**Response (Cycle Detected):**
```json
{
  "success": false,
  "error": "Cannot create subtask relationship: would create a cycle",
  "details": "The child task is already a parent or ancestor of the target parent task"
}
```

#### Remove Subtask Relationship
```http
DELETE /api/tasks/:id/subtask-relationship
```

#### Get Parent Task
```http
GET /api/tasks/:id/parent
```

**Response:**
```json
{
  "success": true,
  "parent": {
    "taskId": "uuid",
    "name": "Parent Task Name",
    "done": false
  }
}
```

### AI Features

#### Suggest Task Fields
Suggests relevant fields (deadline, priority, tags, etc.) based on task name and description.

```http
POST /api/tasks/:id/suggest-fields
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "name": "deadline",
      "type": "datetime",
      "reason": "Project proposals typically have submission deadlines",
      "priority": "high"
    },
    {
      "name": "priority",
      "type": "string",
      "reason": "Helps organize tasks by importance",
      "priority": "medium"
    }
  ],
  "securityFlags": {
    "jailbreakDetected": false,
    "riskScore": 0,
    "validated": true
  }
}
```

#### Suggest Subtasks
Breaks down a complex task into manageable subtasks.

```http
POST /api/tasks/:id/suggest-subtasks
```

**Response:**
```json
{
  "success": true,
  "subtasks": [
    {
      "name": "Research requirements",
      "description": "Gather all project requirements and constraints",
      "estimatedTime": "120",
      "order": 1
    },
    {
      "name": "Create outline",
      "description": "Structure the proposal document",
      "estimatedTime": "60",
      "order": 2
    }
  ]
}
```

#### Generate Task Insights
Analyzes all tasks and provides productivity insights.

```http
POST /api/tasks/insights
```

**Response:**
```json
{
  "success": true,
  "insights": [
    {
      "type": "pattern",
      "title": "High Task Completion Rate",
      "description": "You've completed 85% of your tasks this week - great job!",
      "actionable": false
    },
    {
      "type": "bottleneck",
      "title": "Many Long-Running Tasks",
      "description": "Several tasks have been open for over 2 weeks. Consider breaking them down.",
      "actionable": true
    }
  ],
  "summary": {
    "totalTasks": 20,
    "completedTasks": 17,
    "completionRate": 0.85
  }
}
```

---

## Examples

### Example 1: Creating a Project with Subtasks

```bash
# 1. Create a parent project
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Build E-commerce Website",
    "description": "Complete e-commerce platform with payment integration"
  }'
# Response: { "success": true, "task": { "taskId": "project-id", ... }}

# 2. Create subtasks
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Set up database schema",
    "description": "Design and implement database structure"
  }'
# Response: { "success": true, "task": { "taskId": "subtask-1-id", ... }}

curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Implement payment gateway",
    "description": "Integrate Stripe payment processing"
  }'
# Response: { "success": true, "task": { "taskId": "subtask-2-id", ... }}

# 3. Make them subtasks of the project
curl -X POST http://localhost:3000/api/tasks/subtask-1-id/make-subtask \
  -H "Content-Type: application/json" \
  -d '{ "parentId": "project-id" }'

curl -X POST http://localhost:3000/api/tasks/subtask-2-id/make-subtask \
  -H "Content-Type: application/json" \
  -d '{ "parentId": "project-id" }'
```

### Example 2: Using AI to Break Down a Complex Task

```bash
# 1. Create a complex task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Launch marketing campaign",
    "description": "Plan and execute Q4 marketing campaign for new product"
  }'
# Response: { "success": true, "task": { "taskId": "campaign-id", ... }}

# 2. Get AI suggestions for subtasks
curl -X POST http://localhost:3000/api/tasks/campaign-id/suggest-subtasks

# Response will include AI-generated subtasks like:
# - Define target audience
# - Create content calendar
# - Design promotional materials
# - Set up email campaigns
# - Schedule social media posts
# - Monitor and analyze metrics
```

### Example 3: Reorganizing Task Hierarchy

```bash
# Move a task from one parent to another
# This automatically removes the old parent relationship

# Task C is currently a subtask of Task A
# Make Task C a subtask of Task B instead

curl -X POST http://localhost:3000/api/tasks/task-c-id/make-subtask \
  -H "Content-Type: application/json" \
  -d '{ "parentId": "task-b-id" }'

# Response indicates the previous parent was removed
# { "success": true, "hadPreviousParent": true, ... }
```

### Example 4: Getting Task Insights

```bash
# Get AI-powered insights about your task management
curl -X POST http://localhost:3000/api/tasks/insights

# Response includes:
# - Completion patterns
# - Productivity bottlenecks
# - Actionable suggestions
# - Task statistics
```

---

## Security Features

All AI interactions include:

- **Jailbreak Detection**: Prevents malicious prompt injection
- **Input Sanitization**: Removes potentially harmful content
- **Response Validation**: Ensures AI responses are safe
- **Security Levels**: Configurable strictness (strict/moderate/minimal)

Configure security in `.env`:
```bash
AI_SECURITY_LEVEL=strict
AI_JAILBREAK_THRESHOLD=70
```

---

## Troubleshooting

**Subtask cycle errors:** Use `GET /api/tasks/:id/parent` to check the current hierarchy before making changes.

**AI not working:** Check the server logs on startup - they'll tell you if Ollama needs to be installed or started.
