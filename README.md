# GTD Task Manager

A graph-based task management system built with Neo4j, Node.js, and React. Tasks are represented as nodes in a graph with hierarchical relationships, allowing you to organize goals, projects, and actionable items in a flexible tree structure.

## Overview

This is a monorepo containing both the backend API and frontend web application for managing tasks using graph theory principles.

### Key Features

- **Graph-Based Architecture**: Tasks as nodes with `HAS_SUBTASK` relationships
- **Flexible Hierarchy**: Tasks can represent goals, projects, or individual to-dos
- **Custom Properties**: Define any properties you want to track on your tasks
- **Tree View Interface**: Visual hierarchical display like a file explorer
- **In-Memory State**: Fast interactions with all tasks loaded at session start
- **Real-time Sync**: Changes immediately persisted to Neo4j database

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  React Frontend │ ─HTTP─> │  Express Backend │ ─────> │   Neo4j DB  │
│   (Port 5173)   │ <─────  │   (Port 3000)    │ <─────  │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

### Database Schema

**Nodes:**
- `User`: User accounts with authentication
- `Task`: Tasks/projects/goals with custom properties

**Relationships:**
- `(:User)-[:OWNS]->(:Task)`: User owns a task
- `(:Task)-[:HAS_SUBTASK]->(:Task)`: Parent-child task relationship

## Project Structure

```
gtd-mono/
├── backend/
│   └── database/
│       ├── src/
│       │   ├── models/          # User & Task models
│       │   ├── routes/          # API endpoints
│       │   ├── utils/           # Database setup
│       │   └── server.js        # Express server
│       ├── package.json
│       └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── context/             # State management
│   │   ├── services/            # API client
│   │   └── App.jsx
│   ├── package.json
│   └── README.md
├── package.json
└── README.md
```

## Quick Start

### Prerequisites

- **Node.js** v14 or higher
- **Neo4j** v4 or higher (local or cloud instance)

### 1. Set Up Neo4j Database

Option A: **Neo4j Desktop** (recommended for local development)
1. Download [Neo4j Desktop](https://neo4j.com/download/)
2. Create a new database
3. Start the database
4. Note the URI (usually `neo4j://localhost:7687`), username, and password

Option B: **Neo4j Aura** (cloud)
1. Sign up at [Neo4j Aura](https://neo4j.com/cloud/aura/)
2. Create a free instance
3. Note the connection URI, username, and password

### 2. Set Up Backend

```bash
cd backend/database
npm install
```

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your Neo4j credentials:
```
DB_URI=neo4j://localhost:7687
DB_USERNAME=neo4j
DB_PASSWORD=your_password
PORT=3000
```

Initialize the database:
```bash
npm run init-db
```

Start the backend:
```bash
npm run dev
```

Backend will be running at `http://localhost:3000`

### 3. Set Up Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will open at `http://localhost:5173`

### 4. Use the Application

1. **Register** a new account
2. **Create** your first task
3. **Add subtasks** by clicking the "+" button on any task
4. **Edit** tasks by clicking the pencil icon
5. **Add custom properties** when creating/editing tasks
6. **Expand/collapse** tasks to view the hierarchy

## Usage Examples

### Creating a Project Hierarchy

```
Launch New Product (Goal)
  ├─ Market Research (Project)
  │   ├─ Survey customers (Task)
  │   └─ Analyze competitors (Task)
  ├─ Product Development (Project)
  │   ├─ Design mockups (Task)
  │   ├─ Build prototype (Task)
  │   └─ User testing (Task)
  └─ Marketing Campaign (Project)
      ├─ Create landing page (Task)
      └─ Social media strategy (Task)
```

### Using Custom Properties

Tasks can have any properties you define:

```json
{
  "name": "Design mockups",
  "done": false,
  "customProperties": {
    "priority": "high",
    "dueDate": "2024-12-31",
    "assignee": "Alice",
    "status": "in-progress",
    "tags": "design, ui, urgent",
    "estimatedHours": "8"
  }
}
```

## API Documentation

See [backend/database/README.md](backend/database/README.md) for full API documentation.

**Key Endpoints:**

- `POST /api/users` - Register user
- `POST /api/users/login` - Login
- `GET /api/users/:id/tasks` - Get all user's tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/subtasks` - Add subtask relationship
- `GET /api/tasks/:id/hierarchy` - Get task with all subtasks

## Development

### Backend Development

```bash
cd backend/database
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Starts Vite dev server with HMR
```

### Testing the API

You can test endpoints with curl:

```bash
# Register
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"password123"}'

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"userId":"<user-id>","name":"My Task","customProperties":{"priority":"high"}}'
```

## Design Decisions

### Why Graph Database?

Traditional hierarchical data structures (parent_id foreign keys) make queries like "get all ancestors" or "get full subtree" expensive. Neo4j's graph model makes these queries natural and performant.

### Why Load All Tasks in Memory?

For typical users with hundreds to low thousands of tasks, loading everything once provides:
- Instant UI updates
- No loading spinners when navigating
- Easy client-side filtering/search
- Simplified state management

For users with 10,000+ tasks, this approach would need revision.

### Simplified v1 Design

We chose simplicity for v1:
- Custom properties as JSON (vs. separate nodes)
- No authentication middleware (basic login only)
- No search/filtering yet
- No real-time collaboration

These can be added later without major refactoring.

## Future Enhancements

**Near-term:**
- Search and filtering
- Task dependencies and blocking relationships
- Time tracking
- Task templates
- Keyboard shortcuts

**Long-term:**
- Mobile apps (iOS/Android using React Native)
- Real-time collaboration
- AI-powered task suggestions
- Notifications and reminders
- Calendar integration
- Export/import functionality

## Technology Stack

**Backend:**
- Node.js + Express
- Neo4j (graph database)
- bcrypt (password hashing)

**Frontend:**
- React 19
- Vite (build tool)
- Context API (state management)

**Database:**
- Neo4j 5.x

## Contributing

This is a learning project. Contributions welcome!

## License

ISC
