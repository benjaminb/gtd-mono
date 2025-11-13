# GTD Task Management API

A graph-based task management backend built with Node.js, Express, and Neo4j.

## Features

- **Graph-based task structure**: Tasks can have subtasks, forming a hierarchical graph
- **User management**: Create users, authenticate, manage profiles
- **Custom properties**: Add any custom properties to tasks
- **RESTful API**: Clean REST endpoints for all operations
- **Neo4j database**: Leverages graph database for efficient hierarchical queries

## Architecture

### Database Schema

**Node Types:**
- `User`: User accounts with authentication
- `Task`: Tasks, projects, or goals (can be any level in the hierarchy)

**Relationships:**
- `(:User)-[:OWNS]->(:Task)`: User owns a task
- `(:Task)-[:HAS_SUBTASK]->(:Task)`: Parent-child task relationship

**Task Properties:**
- `id`: Unique identifier (UUID)
- `name`: Task name
- `done`: Boolean completion status
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `customProperties`: JSON object for user-defined properties

**User Properties:**
- `id`: Unique identifier (UUID)
- `username`: Unique username
- `email`: Unique email address
- `passwordHash`: Bcrypt hashed password
- `createdAt`: Account creation timestamp

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Neo4j database (v4 or higher)

### Installation

1. Navigate to the database directory:
```bash
cd backend/database
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your Neo4j connection details:
```
DB_URI=neo4j://localhost:7687
DB_USERNAME=neo4j
DB_PASSWORD=your_password
PORT=3000
```

4. Initialize the database (creates constraints and indexes):
```bash
npm run init-db
```

5. Start the server:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Users

#### Create User
```
POST /api/users
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login
```
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Get User
```
GET /api/users/:id
```

#### Update User
```
PUT /api/users/:id
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

#### Delete User
```
DELETE /api/users/:id
```

#### Get User's Tasks
```
GET /api/users/:id/tasks
```

### Tasks

#### Create Task
```
POST /api/tasks
Content-Type: application/json

{
  "userId": "user-uuid",
  "name": "Complete project",
  "done": false,
  "customProperties": {
    "priority": "high",
    "dueDate": "2024-12-31",
    "tags": ["work", "urgent"]
  }
}
```

#### Get Task
```
GET /api/tasks/:id
```

#### Update Task
```
PUT /api/tasks/:id
Content-Type: application/json

{
  "name": "Updated task name",
  "done": true,
  "customProperties": {
    "priority": "medium",
    "notes": "Additional notes"
  }
}
```

#### Delete Task
```
DELETE /api/tasks/:id
```

#### Add Subtask Relationship
```
POST /api/tasks/:id/subtasks
Content-Type: application/json

{
  "childId": "child-task-uuid"
}
```

#### Remove Subtask Relationship
```
DELETE /api/tasks/:id/subtasks/:childId
```

#### Get Subtasks
```
GET /api/tasks/:id/subtasks
```

#### Get Parent Tasks
```
GET /api/tasks/:id/parents
```

#### Get Task Hierarchy
Get a task with all its subtasks (recursive):
```
GET /api/tasks/:id/hierarchy?maxDepth=10
```

#### Get Task Owner
```
GET /api/tasks/:id/owner
```

## Usage Examples

### Creating a Project with Subtasks

1. Create a user:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"password123"}'
```

2. Create a project task:
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"<user-id>",
    "name":"Build Website",
    "customProperties":{"type":"project","dueDate":"2024-12-31"}
  }'
```

3. Create subtasks:
```bash
# Design subtask
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"<user-id>",
    "name":"Design mockups",
    "customProperties":{"priority":"high"}
  }'

# Development subtask
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"<user-id>",
    "name":"Implement frontend",
    "customProperties":{"priority":"medium"}
  }'
```

4. Link subtasks to project:
```bash
curl -X POST http://localhost:3000/api/tasks/<project-id>/subtasks \
  -H "Content-Type: application/json" \
  -d '{"childId":"<design-task-id>"}'

curl -X POST http://localhost:3000/api/tasks/<project-id>/subtasks \
  -H "Content-Type: application/json" \
  -d '{"childId":"<dev-task-id>"}'
```

5. View full hierarchy:
```bash
curl http://localhost:3000/api/tasks/<project-id>/hierarchy
```

## Custom Properties

Tasks support custom properties through the `customProperties` field. This allows you to add any metadata you need:

```javascript
{
  "customProperties": {
    "priority": "high",
    "dueDate": "2024-12-31",
    "tags": ["work", "urgent"],
    "estimatedHours": 5,
    "assignee": "John Doe",
    "status": "in-progress",
    // ... any other properties
  }
}
```

## Future Enhancements

The current implementation is a simple, functional v1. Future enhancements could include:

- Authentication with JWT tokens
- Task search and filtering
- Time tracking (TimeEntry nodes)
- Task templates
- Sharing and collaboration features
- More complex custom field definitions with validation
- Task dependencies and blocking relationships
- Notifications and reminders
- Task history and audit logs

## Project Structure

```
backend/database/
├── src/
│   ├── models/
│   │   ├── User.js          # User model with CRUD operations
│   │   └── Task.js          # Task model with graph operations
│   ├── routes/
│   │   ├── users.js         # User API routes
│   │   └── tasks.js         # Task API routes
│   ├── utils/
│   │   ├── database.js      # Neo4j driver setup
│   │   └── initDatabase.js  # Database initialization
│   ├── server.js            # Express server setup
│   └── index.js             # Application entry point
├── docs/
│   └── database.md          # Database design documentation
├── .env.example             # Environment variables template
├── package.json
└── README.md
```

## License

ISC
