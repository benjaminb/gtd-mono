# GTD Task Manager - Frontend

A React-based single-page application for graph-based task management.

## Features

- **Tree View Interface**: Visual hierarchical display of tasks and subtasks
- **Expandable/Collapsible**: Click to expand/collapse task details and subtasks
- **Custom Properties**: Define and manage your own task properties
- **Real-time Updates**: All tasks loaded into memory for instant interactions
- **User Authentication**: Simple login/register system

## Setup

### Prerequisites

- Node.js (v14+)
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

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
