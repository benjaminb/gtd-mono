# GTD Task Manager - Frontend

A React-based single-page application for graph-based task management.

## 🚀 Running the Full Stack

**⚠️ This frontend requires the backend API and Neo4j database to be running.**

For complete setup instructions, see the main [README.md](../README.md#-running-the-full-stack-locally) in the project root.

### Quick Start (assumes backend is running)

```bash
npm install
npm run dev
```

The app will open at `http://localhost:5173`

### Running Everything

If you need to start the entire stack:

```bash
# Terminal 1: Start Neo4j
cd .. && ./scripts/setup-local.sh

# Terminal 2: Start backend
cd ../backend/database && npm install && npm start

# Terminal 3: Start frontend (this)
npm install && npm run dev
```

## Features

- **Tree View Interface**: Visual hierarchical display of tasks and subtasks
- **Expandable/Collapsible**: Click to expand/collapse task details and subtasks
- **Custom Properties**: Define and manage your own task properties
- **Real-time Updates**: All tasks loaded into memory for instant interactions
- **User Authentication**: Simple login/register system

## Usage

### Getting Started

1. Register/login with your account
2. Click "+ Add Task" to create your first task
3. Click "+" on any task to add subtasks
4. Click task names to view/edit properties

### Features

- **Tree View**: Hierarchical task display like a file explorer
- **Custom Properties**: Add any properties you need (priority, due date, tags, etc.)
- **Expand/Collapse**: Show/hide task details and subtasks
- **Edit/Delete**: Manage tasks with simple controls

See full documentation for detailed usage instructions.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # UI components
│   ├── context/        # State management
│   ├── services/       # API client
│   └── App.jsx         # Main app
├── package.json
└── vite.config.js
```

## License

ISC
