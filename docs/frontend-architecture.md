# Frontend Architecture Documentation

Complete reference for the GTD Task Manager frontend built with React 19, Vite, and Context API.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [Components](#components)
5. [Context Providers](#context-providers)
6. [Services](#services)
7. [Hooks](#hooks)
8. [Styling](#styling)
9. [State Management](#state-management)
10. [Testing Strategy](#testing-strategy)

## Overview

The frontend is a single-page React application that provides an intuitive interface for managing hierarchical tasks with AI-powered suggestions, advanced search, and analytics visualization.

### Technology Stack

- **Framework**: React 19 (functional components with hooks)
- **Build Tool**: Vite
- **State Management**: React Context API
- **Routing**: None (single page with view switching)
- **Styling**: CSS modules + traditional CSS files
- **API Client**: Custom fetch-based service

### Key Features

- Dual view modes (List and Graph visualization)
- Real-time task synchronization
- AI suggestion workflow (accept/reject)
- Boolean expression search with natural language conversion
- Interactive analytics charts
- Property schema management
- Responsive design

## Project Structure

```
frontend/
├── src/
│   ├── components/                # React components
│   │   ├── Auth.jsx              # Login/register interface
│   │   ├── TaskTree.jsx          # Main task list view
│   │   ├── TaskNode.jsx          # Individual task item
│   │   ├── TaskForm.jsx          # Task create/edit form
│   │   ├── GraphView.jsx         # Visual graph representation
│   │   ├── SearchView.jsx        # Search interface
│   │   ├── SearchBar.jsx         # Search input component
│   │   ├── SearchResults.jsx     # Search results display
│   │   ├── FilterPanel.jsx       # Task filtering controls
│   │   ├── ReportsView.jsx       # Analytics dashboard
│   │   ├── PropertyEditor.jsx    # Property editing UI
│   │   ├── PropertySchemaManager.jsx  # Schema management
│   │   ├── SuggestionsPanel.jsx  # AI suggestions panel
│   │   └── charts/               # Chart components
│   │       ├── BarChart.jsx
│   │       ├── PieChart.jsx
│   │       └── TimelineChart.jsx
│   │
│   ├── context/                  # Context providers
│   │   ├── AuthContext.jsx      # User authentication state
│   │   ├── TaskContext.jsx      # Task data and operations
│   │   └── PropertySchemaContext.jsx  # Property schemas
│   │
│   ├── services/                 # API and external services
│   │   └── api.js               # Centralized API client
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── useAutoSuggestions.js # Debounced AI suggestions
│   │
│   ├── utils/                    # Utility functions
│   │   └── search.js            # Search/filter utilities
│   │
│   ├── App.jsx                  # Root application component
│   ├── App.css                  # Global styles
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Base CSS reset/variables
│
├── public/                       # Static assets
├── index.html                    # HTML template
├── vite.config.js               # Vite configuration
└── package.json
```

## Core Concepts

### Component Architecture

All components follow functional component patterns with hooks:

```javascript
// Component pattern
import { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';

const MyComponent = ({ prop1, prop2 }) => {
  // Local state
  const [localState, setLocalState] = useState(initialValue);

  // Context consumption
  const { tasks, updateTask } = useTask();

  // Side effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };

  // Render
  return (
    <div className="my-component">
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Context Method (API call)
    ↓
Backend API
    ↓
Context State Update
    ↓
Component Re-render
```

### View Modes

The application supports multiple view modes accessible via navigation:

1. **Tasks View** - List or graph visualization
2. **Search View** - Advanced search interface
3. **Reports View** - Analytics and charts

## Components

### App Components

#### App.jsx

**Purpose**: Root component with authentication guard and navigation

**Structure**:
```javascript
<AuthProvider>
  <AppContent>
    {isAuthenticated ? (
      <>
        <header>Navigation</header>
        <main>
          <PropertySchemaProvider>
            <TaskProvider userId={user.id}>
              {currentView === 'tasks' && <TaskTree />}
              {currentView === 'search' && <SearchView />}
              {currentView === 'reports' && <ReportsView />}
            </TaskProvider>
          </PropertySchemaProvider>
        </main>
      </>
    ) : (
      <Auth />
    )}
  </AppContent>
</AuthProvider>
```

**State**:
- `currentView` - Active view ('tasks', 'search', 'reports')

**Features**:
- View switching via navigation buttons
- User welcome message
- Logout functionality
- Conditional rendering based on authentication

#### Auth.jsx

**Purpose**: Login and registration interface

**Features**:
- Toggle between login/register modes
- Form validation
- Error display
- Auto-login after registration

**State**:
- `mode` - 'login' or 'register'
- `email`, `password`, `username` - Form fields
- `error` - Validation/API errors

### Task Components

#### TaskTree.jsx

**Purpose**: Main task management interface with list and graph views

**Features**:
- View mode toggle (list/graph)
- Task creation/editing
- Search bar integration
- Filter panel
- Suggestions panel
- Property schema management

**State**:
- `viewMode` - 'list' or 'graph'
- `showForm` - Boolean for task form modal
- `editingTask` - Task being edited
- `parentForNewTask` - Parent for new subtask
- `searchResults` - Search results from TaskContext
- `showSchemaManager` - Boolean for schema manager modal

**Key Handlers**:
```javascript
handleAddTask()           // Open form for new root task
handleEditTask(task)      // Open form to edit task
handleAddSubtask(parent)  // Open form for new subtask
handleSearch(query)       // Execute search
handleFilterChange(filters) // Update filters
```

#### TaskNode.jsx

**Purpose**: Render individual task in list view

**Features**:
- Expandable/collapsible subtasks
- Done checkbox
- Edit/delete actions
- Add subtask button
- AI suggestion indicator
- Custom properties display

**Props**:
- `task` - Task object
- `level` - Depth level for indentation
- `onEdit`, `onDelete`, `onAddSubtask` - Action callbacks

**State**:
- `isExpanded` - Show/hide subtasks
- `isHovered` - Show action buttons

**Visual Indicators**:
```javascript
// AI suggestions have different styling
className={`task-node ${task.source === 'ai-suggested' ? 'ai-suggested' : ''}`}

// Completion badge
{task.subtaskCount > 0 && (
  <span className="completion-badge">
    {task.completedCount}/{task.subtaskCount}
  </span>
)}
```

#### TaskForm.jsx

**Purpose**: Create or edit task with property management

**Features**:
- Name input
- Done checkbox
- Custom property editing
- Property schema integration
- Type-aware property inputs
- Validation feedback

**Props**:
- `task` - Task to edit (null for new task)
- `parent` - Parent task for new subtask
- `onClose` - Close callback
- `onSave` - Save callback

**State**:
- `name` - Task name
- `done` - Completion status
- `customProperties` - Object of custom properties
- `errors` - Validation errors

**Property Input Types**:
```javascript
// Text
<input type="text" value={value} onChange={...} />

// Number
<input type="number" min={min} max={max} value={value} onChange={...} />

// Date
<input type="date" value={value} onChange={...} />

// Boolean
<select value={value} onChange={...}>
  <option value="true">True</option>
  <option value="false">False</option>
</select>

// Dropdown (select type)
<select value={value} onChange={...}>
  {options.map(opt => <option value={opt}>{opt}</option>)}
</select>
```

#### GraphView.jsx

**Purpose**: Visual graph representation of task hierarchy

**Features**:
- SVG-based rendering
- Node positioning algorithm
- Click to focus task
- Zoom/pan controls
- Thermometer-style completion indicators
- Relationship lines

**Props**:
- `tasks` - Array of all tasks
- `taskRelationships` - Task hierarchy map

**State**:
- `focusedTask` - Currently selected task
- `transform` - Pan/zoom transformation
- `dimensions` - SVG viewport size

**Layout Algorithm**:
```javascript
// Tree layout with depth-based positioning
function calculateNodePositions(rootTasks, relationships) {
  const positions = {};
  let yOffset = 0;

  function positionNode(task, depth, xPosition) {
    positions[task.id] = {
      x: depth * HORIZONTAL_SPACING,
      y: yOffset
    };
    yOffset += VERTICAL_SPACING;

    const children = getChildren(task.id);
    children.forEach(child => positionNode(child, depth + 1, xPosition));
  }

  rootTasks.forEach(task => positionNode(task, 0, 0));
  return positions;
}
```

### Search Components

#### SearchView.jsx

**Purpose**: Advanced search interface with multiple modes

**Features**:
- Natural language mode
- Boolean expression mode
- Expression validation
- AI-powered conversion
- Results display
- Example queries

**State**:
- `mode` - 'natural' or 'expression'
- `naturalLanguageInput` - Natural language query
- `expressionInput` - Boolean expression
- `parsedExpression` - AI-converted expression
- `searchResults` - API response with matching tasks
- `loading`, `error`, `expressionError` - UI states

**Modes**:

1. **Natural Language**:
```javascript
// User types: "high priority tasks that aren't done"
// Click "Convert to Expression"
// AI returns: "priority = high AND done = false"
// Expression automatically fills expression input
// User clicks "Search" to execute
```

2. **Boolean Expression**:
```javascript
// User types expression directly
// Real-time validation shows syntax errors
// Click "Search" to execute
```

**Search Result Display**:
```javascript
<div className="search-results">
  <div className="results-stats">
    Found {results.matchingTasks} of {results.totalTasks} tasks
  </div>
  {results.tasks.map(task => (
    <div className="result-item">
      <input type="checkbox" checked={task.done} readOnly />
      <div className="task-name">{task.name}</div>
      {task.source !== 'user' && (
        <span className="source-badge">{task.source}</span>
      )}
      <div className="task-properties">
        {Object.entries(task.customProperties).map(([key, value]) => (
          <div className="property-item">
            <span className="property-key">{key}:</span>
            <span className="property-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

#### SearchBar.jsx

**Purpose**: Search input with autocomplete

**Props**:
- `onSearch` - Search callback
- `onClear` - Clear callback

**State**:
- `query` - Search input value
- `suggestions` - Autocomplete suggestions from TaskContext

**Features**:
- Debounced suggestion fetching
- Keyboard navigation (arrow keys, enter)
- Clear button
- Suggestion dropdown with categories

#### SearchResults.jsx

**Purpose**: Display search results based on mode

**Props**:
- `results` - Search results object
- `onClear` - Clear callback

**Result Modes**:
1. `task-list` - List of matching tasks
2. `property-view` - Tasks grouped by property value
3. `property-filter` - Tasks filtered by specific property value

### Analytics Components

#### ReportsView.jsx

**Purpose**: Analytics dashboard with charts and filters

**Features**:
- Multiple report types
- Boolean expression filtering
- Natural language filter conversion
- Chart rendering
- Time range selection
- Property selection for distribution

**State**:
- `reportType` - Selected report
- `timeRange` - Date range filter
- `selectedProperty` - Property for distribution
- `chartData` - Data for current chart
- `filterMode` - 'none', 'natural', 'expression'
- `filterExpression` - Active boolean filter
- `loading`, `error` - UI states

**Report Types**:
```javascript
const reportTypes = [
  { value: 'completion-by-parent', label: 'Task Completion by Parent' },
  { value: 'completion-by-property', label: 'Completion by Property' },
  { value: 'property-distribution', label: 'Property Distribution' },
  { value: 'timeline', label: 'Activity Timeline' },
  { value: 'inactive-projects', label: 'Inactive Projects' }
];
```

**Filter Integration**:
```javascript
// Apply filter before loading report
const filter = filterExpression.trim() || null;

const result = await api.getCompletionAnalytics(user.id, {
  startDate,
  endDate,
  groupBy: 'parent',
  filter  // Boolean expression
});

// Chart title shows filter status
setChartData({
  type: 'bar',
  title: 'Task Completion by Parent' + (filter ? ' (Filtered)' : ''),
  data: result.data
});
```

#### Chart Components

##### BarChart.jsx

**Purpose**: Render bar charts for completion and distribution data

**Props**:
- `title` - Chart title
- `data` - Array of `{ label, value, completed }` objects

**Features**:
- SVG-based rendering
- Automatic scaling
- Hover tooltips
- Stacked bars for completion data

##### PieChart.jsx

**Purpose**: Render pie charts for property distribution

**Props**:
- `title` - Chart title
- `data` - Array of `{ label, value }` objects

**Features**:
- SVG arc paths
- Percentage labels
- Color coding
- Legend

##### TimelineChart.jsx

**Purpose**: Render timeline of task activity

**Props**:
- `title` - Chart title
- `data` - Array of `{ date, created, completed }` objects

**Features**:
- Dual-line chart
- Date axis
- Gridlines
- Interactive hover

### Property Components

#### PropertyEditor.jsx

**Purpose**: Inline property editing in task form

**Props**:
- `customProperties` - Current properties object
- `onChange` - Change callback
- `schemas` - Available property schemas

**Features**:
- Add new properties
- Remove properties
- Type-aware inputs
- Schema integration
- Validation feedback

**State**:
- `newPropertyName` - Name for new property
- `newPropertyValue` - Value for new property
- `selectedType` - Type for new property

#### PropertySchemaManager.jsx

**Purpose**: Manage property schema definitions

**Features**:
- View all schemas
- Create new schemas
- Edit existing schemas
- Delete schemas
- Update dropdown options
- Validation

**State**:
- `schemas` - Array of all schemas
- `editingSchema` - Schema being edited
- `showForm` - Boolean for form modal

**Schema Form**:
```javascript
<form onSubmit={handleSave}>
  <input name="propertyName" placeholder="Property name" />

  <select name="dataType">
    <option value="text">Text</option>
    <option value="number">Number</option>
    <option value="date">Date</option>
    <option value="boolean">True/False</option>
    <option value="select">Dropdown</option>
  </select>

  {/* Conditional constraints based on dataType */}
  {dataType === 'number' && (
    <>
      <input name="min" type="number" placeholder="Min" />
      <input name="max" type="number" placeholder="Max" />
      <label>
        <input type="checkbox" name="integer" />
        Integers only
      </label>
    </>
  )}

  {dataType === 'select' && (
    <input name="options" placeholder="Options (comma-separated)" />
  )}

  <button type="submit">Save</button>
</form>
```

### Suggestions Components

#### SuggestionsPanel.jsx

**Purpose**: Display and manage AI-generated suggestions

**Features**:
- Show subtask suggestions
- Accept/reject individual suggestions
- Batch accept/reject all
- Confidence scores
- Reasoning display

**Props**:
- `taskId` - Parent task ID
- `suggestions` - Array of suggested tasks

**State**:
- `loading` - Fetching suggestions
- `error` - Error state

**Suggestion Item**:
```javascript
<div className="suggestion-item">
  <div className="suggestion-header">
    <div className="suggestion-name">{suggestion.name}</div>
    <div className="confidence-badge">
      {Math.round(suggestion.confidence * 100)}%
    </div>
  </div>

  <div className="suggestion-reasoning">
    {suggestion.reasoning}
  </div>

  {suggestion.customProperties && (
    <div className="suggested-properties">
      {Object.entries(suggestion.customProperties).map(([key, val]) => (
        <span className="property-tag">{key}: {val}</span>
      ))}
    </div>
  )}

  <div className="suggestion-actions">
    <button onClick={() => handleAccept(suggestion.id)}>✓ Accept</button>
    <button onClick={() => handleReject(suggestion.id)}>× Reject</button>
  </div>
</div>
```

## Context Providers

### AuthContext

**Purpose**: Manage user authentication state

**State**:
```javascript
{
  user: { id, username, email } | null,
  isAuthenticated: boolean,
  loading: boolean,
  error: string | null
}
```

**Methods**:
```javascript
login(email, password)       // Authenticate user
logout()                     // Clear user session
register(username, email, password)  // Create new account
```

**Usage**:
```javascript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user.username}!</div>;
};
```

### TaskContext

**Purpose**: Centralized task data and operations

**State**:
```javascript
{
  tasks: Task[],              // All user tasks
  loading: boolean,
  error: string | null,
  taskRelationships: {        // taskId -> [childIds]
    [taskId]: string[]
  },
  filters: {                  // Current filters
    name: string,
    done: 'all' | 'done' | 'notDone',
    customProperties: { [key]: string }
  },
  availableProperties: string[]  // Known property names
}
```

**Methods**:
```javascript
// Task operations
createTask(taskData): Promise<Task>
updateTask(taskId, updates): Promise<Task>
deleteTask(taskId): Promise<void>

// Hierarchy
addSubtask(parentId, childId): Promise<void>
removeSubtask(parentId, childId): Promise<void>
getRootTasks(): Task[]
getChildren(taskId): Task[]

// Filtering/Search
setFilters(filters)
search(query): SearchResults
getSuggestions(query, limit): Suggestion[]

// AI suggestions
acceptSuggestion(taskId): Promise<Task>
rejectSuggestion(taskId): Promise<void>

// Utilities
loadAllTasks(): Promise<void>
addCustomProperty(propertyName)
getAllPropertyNames(): string[]
```

**Implementation Details**:

1. **Loading All Tasks**:
```javascript
const loadAllTasks = async () => {
  // Get all tasks
  const allTasks = await api.getUserTasks(userId);

  // Build relationships
  const relationships = {};
  for (const task of allTasks) {
    const subtasks = await api.getSubtasks(task.id);
    relationships[task.id] = subtasks.map(st => st.id);
  }

  setTasks(allTasks);
  setTaskRelationships(relationships);
};
```

2. **Filtering Tasks**:
```javascript
const getRootTasks = () => {
  // Find tasks with no parents
  const childIds = new Set(Object.values(taskRelationships).flat());
  const rootTasks = tasks.filter(task => !childIds.has(task.id));

  // Filter: show if task OR any descendant matches
  return rootTasks.filter(task => taskOrDescendantsMatch(task));
};
```

3. **Search Modes**:
```javascript
const search = (query) => {
  // Detect query type
  if (isPropertyQuery(query)) {
    return searchByPropertyValue(property, value);
  }

  if (isPropertyName(query)) {
    return searchByProperty(propertyName);  // Group by property
  }

  return searchByTaskName(query);  // Fuzzy match
};
```

### PropertySchemaContext

**Purpose**: Manage property type definitions

**State**:
```javascript
{
  schemas: PropertySchema[],
  loading: boolean,
  error: string | null
}
```

**Methods**:
```javascript
createSchema(schemaData): Promise<PropertySchema>
updateSchema(schemaId, updates): Promise<PropertySchema>
deleteSchema(schemaId): Promise<void>
loadSchemas(): Promise<void>
getSchemaByName(propertyName): PropertySchema | null
```

**Schema Object**:
```javascript
{
  id: string,
  propertyName: string,
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'select',
  constraints: {
    // For number
    min?: number,
    max?: number,
    integer?: boolean,

    // For text
    maxLength?: number,

    // For date
    minDate?: string,
    maxDate?: string,

    // For select
    options?: string[]
  }
}
```

## Services

### API Service (`api.js`)

**Purpose**: Centralized API client with typed methods

**Architecture**: Singleton class with method chaining

**Base Configuration**:
```javascript
const API_BASE = '/api';  // Vite proxy handles this
```

**Method Pattern**:
```javascript
async methodName(params) {
  const response = await fetch(`${API_BASE}/endpoint`, {
    method: 'GET|POST|PUT|DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)  // For POST/PUT
  });

  if (!response.ok) {
    throw new Error('Error message');
  }

  return response.json();  // Or void for DELETE
}
```

**Complete API**:

```javascript
// Users
createUser(userData)
login(email, password)
getUser(userId)
getUserTasks(userId)

// Tasks
createTask(taskData)
getTask(taskId)
updateTask(taskId, updates)
deleteTask(taskId)
addSubtask(parentId, childId)
removeSubtask(parentId, childId)
getSubtasks(taskId)
getParents(taskId)
getTaskHierarchy(taskId, maxDepth)
acceptSuggestion(taskId)
rejectSuggestion(taskId)

// Suggestions
getSuggestionsSubtasks(taskId, userId)
getSuggestionsProperties(taskId, allPropertyNames)
getSuggestionsRelatedTasks(taskId, userId)
convertNaturalLanguageToExpression(query, userId)
getLLMStatus()

// Property Schemas
createPropertySchema(schemaData)
getPropertySchemas(userId)
getPropertySchema(schemaId)
updatePropertySchema(schemaId, updates)
deletePropertySchema(schemaId)
validatePropertyValue(userId, propertyName, value)
updateSchemaOptions(schemaId, options)
deleteSchemaOption(schemaId, option)

// Analytics
getCompletionAnalytics(userId, options)  // options: { startDate, endDate, groupBy, filter }
getInactiveProjects(userId, options)     // options: { daysSinceUpdate, minSubtasks, filter }
getTimelineAnalytics(userId, options)    // options: { startDate, endDate, filter }
getPropertyDistribution(userId, propertyName, filter)

// Search
searchTasks(userId, expression)
validateExpression(expression)
```

## Hooks

### useAutoSuggestions

**Purpose**: Debounced AI suggestion fetching

**Location**: `hooks/useAutoSuggestions.js`

**Usage**:
```javascript
import useAutoSuggestions from '../hooks/useAutoSuggestions';

const MyComponent = () => {
  const [focusedTask, setFocusedTask] = useState(null);

  const { suggestions, loading, error } = useAutoSuggestions(
    focusedTask,
    {
      suggestionType: 'subtasks',  // or 'properties', 'related-tasks'
      debounceMs: 1500,            // Wait before fetching
      enabled: true                // Can disable
    }
  );

  return (
    <div>
      {suggestions.map(s => <div key={s.id}>{s.name}</div>)}
    </div>
  );
};
```

**Implementation**:
```javascript
function useAutoSuggestions(task, options = {}) {
  const {
    suggestionType = 'subtasks',
    debounceMs = 1500,
    enabled = true
  } = options;

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !task || task.source === 'ai-suggested') {
      return;
    }

    // Debounce timer
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await fetchSuggestions(task, suggestionType);
        setSuggestions(results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [task?.id, suggestionType, debounceMs, enabled]);

  return { suggestions, loading, error };
}
```

## Styling

### CSS Architecture

**Pattern**: Component-scoped CSS files

**Example**:
```
TaskTree.jsx  →  TaskTree.css
SearchView.jsx  →  SearchView.css
```

**Global Styles** (`App.css`, `index.css`):
- CSS reset
- Typography
- Color variables
- Layout utilities

**Component Styles**:
```css
/* TaskTree.css */
.task-tree {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.task-tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.add-task-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.add-task-btn:hover {
  background: #5568d3;
}
```

### Color Scheme

```css
:root {
  --primary: #667eea;
  --primary-dark: #5568d3;
  --secondary: #764ba2;
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --text-primary: #333;
  --text-secondary: #666;
  --border: #ddd;
  --background: #f5f5f5;
  --card-bg: white;
}
```

## State Management

### Global State (Context API)

**Hierarchy**:
```javascript
<AuthProvider>
  <PropertySchemaProvider>
    <TaskProvider>
      <Components />
    </TaskProvider>
  </PropertySchemaProvider>
</AuthProvider>
```

**Data Flow**:
1. User action triggers event handler
2. Handler calls context method
3. Context method calls API
4. API response updates context state
5. All consuming components re-render

### Local State (useState)

Used for:
- Form inputs
- UI toggles (modals, dropdowns)
- Temporary data (search query, filter inputs)

**Example**:
```javascript
const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState({ name: '', done: false });
```

### Derived State

Computed from context or props:
```javascript
const { tasks, taskRelationships } = useTask();

// Derived: root tasks
const rootTasks = getRootTasks();

// Derived: completed percentage
const completedCount = tasks.filter(t => t.done).length;
const completionRate = (completedCount / tasks.length) * 100;
```

## Testing Strategy

### Component Tests
- Render tests
- Event handler tests
- Prop validation
- Conditional rendering

### Context Tests
- State initialization
- Method behavior
- API integration
- Error handling

### Integration Tests
- User workflows
- Multi-component interactions
- API call sequences

### E2E Tests (Recommended)
- Complete user journeys
- Authentication flows
- Task creation/editing
- Search and filtering

## Performance Optimizations

### Current Optimizations

1. **In-Memory Task Storage**:
   - All tasks loaded once
   - No re-fetching on navigation
   - Fast filtering and search

2. **Debounced Suggestions**:
   - 1.5-2 second delay
   - Prevents excessive API calls
   - Cancels on unmount

3. **Lazy Chart Rendering**:
   - Charts only render when report selected
   - Data fetched on-demand

4. **Conditional Rendering**:
   - Components mount/unmount based on view
   - Modals rendered only when open

### Future Optimizations

1. **React.memo** for expensive components
2. **useMemo** for derived computations
3. **Virtual scrolling** for large task lists
4. **Code splitting** for routes
5. **Service worker** for offline support

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env`:
```bash
VITE_API_URL=http://localhost:3000
```

Access in code:
```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

### Vite Configuration

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

## Extension Points

### Adding New View

1. Create component in `components/`
2. Add navigation button in `App.jsx`
3. Add view case in App render logic

### Adding New Chart Type

1. Create chart component in `components/charts/`
2. Add report type to `ReportsView.jsx`
3. Implement data fetching
4. Add to report type selector

### Adding New Context

1. Create context file in `context/`
2. Define provider component
3. Export custom hook
4. Wrap app in provider
5. Consume via hook in components
