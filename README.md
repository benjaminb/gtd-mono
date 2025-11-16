# GTD Task Manager

A comprehensive Getting Things Done (GTD) task management application with AI-powered suggestions, custom property schemas, boolean search, and advanced analytics. Built with Neo4j graph database, Node.js, and React.

## Features

### Core Task Management
- **Graph-Based Architecture** - Tasks as nodes with `HAS_SUBTASK` relationships
- **Flexible Hierarchy** - Organize goals, projects, and actionable items in a tree structure
- **Custom Properties** - Define task properties with full type enforcement
- **Property Schema System** - Create reusable property definitions (text, number, date, boolean, dropdown)
- **Time Tracking** - Track time spent on tasks with play/pause controls, session history, and analytics
- **Visual Displays** - Tree view and thermometer-style graph view with time tracking UI
- **Real-time Sync** - Changes immediately persisted to Neo4j
- **Cross-Platform** - Web app (React) and mobile apps (React Native for iOS/Android)

### AI Integration
- **Smart Suggestions** - AI suggests subtasks, properties, and related tasks automatically
- **Natural Language Search** - Convert plain English queries to boolean expressions
- **Multiple LLM Providers** - Support for OpenAI (GPT-4), Anthropic (Claude), and Ollama (local models)
- **Confidence Scoring** - AI provides confidence levels for all suggestions
- **Accept/Reject Workflow** - Review and manage AI-generated content
- **Contextual Prompts** - AI aware of your custom properties and task context

### Advanced Search & Filtering
- **Boolean Expression Engine** - Powerful query language with operators (=, !=, <, >, <=, >=, contains, AND, OR, NOT)
- **Natural Language Queries** - "show me high priority tasks that aren't done"
- **Real-time Validation** - Expression syntax checking with error messages
- **Search Results View** - Dedicated interface for exploring filtered tasks
- **Filter-aware Analytics** - Apply filters before running reports

### Reports & Analytics
- **Task Completion by Parent** - Bar charts showing completion rates across projects
- **Property Distribution** - Visualize task breakdown by custom properties
- **Activity Timeline** - Track task creation and completion trends over time
- **Inactive Projects** - Find stale projects needing attention
- **Filterable Reports** - Apply boolean expressions to all analytics for targeted insights
- **Interactive Charts** - SVG-based bar charts, pie charts, and timeline visualizations

## Architecture

### System Overview

```
┌──────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  React Frontend  │ ─HTTP─> │  Express Backend │ ─────>  │   Neo4j DB  │
│   (Port 5173)    │ <─────  │   (Port 3000)    │ <─────  │             │
└──────────────────┘         └──────────────────┘         └─────────────┘
         │                            │
         │                            │
         │                            └──────────> LLM APIs
┌──────────────────┐                              (OpenAI/Anthropic/Ollama)
│ React Native App │                  │
│  (Expo Mobile)   │ ─HTTP─> ─────────┘
└──────────────────┘
         │
         │ (uses shared @gtd/core package)
         │
         └─────> Search/Reports/AI Features
```

### Monorepo Structure

This project uses a **monorepo** architecture to share code between web and mobile platforms. The shared business logic lives in `packages/core` and is used by both frontends.

**Code Sharing Breakdown:**
- ~100% of business logic shared (API client, state management, utilities)
- ~75% overall code sharing between web and mobile
- Platform-specific: UI components, navigation, native features

**Benefits:**
- Single source of truth for types and API client
- Consistent behavior across platforms
- Faster development (write once, use everywhere)
- Easier maintenance

### Database Schema

**Nodes:**
- `User` - User accounts with authentication
  - `id` (UUID), `username`, `email`, `passwordHash`
- `Task` - Tasks/projects/goals with custom properties
  - `id` (UUID), `name`, `done`, `source`, `customProperties` (JSON)
  - `suggestionMetadata` (JSON), `createdAt`, `updatedAt`
- `PropertySchema` - Custom property type definitions
  - `id` (UUID), `propertyName`, `dataType`, `constraints` (JSON)

**Relationships:**
- `(:User)-[:OWNS]->(:Task)` - User owns a task
- `(:Task)-[:HAS_SUBTASK]->(:Task)` - Parent-child task hierarchy
- `(:User)-[:HAS_PROPERTY_SCHEMA]->(:PropertySchema)` - User-defined property schemas

### Project Structure

```
gtd-mono/                         # Monorepo root
├── packages/                     # Shared packages
│   └── core/                     # Shared business logic
│       ├── src/
│       │   ├── api/              # API client (fetch-based)
│       │   ├── state/            # TaskContext (works on web + mobile)
│       │   ├── types/            # TypeScript definitions
│       │   └── utils/            # Search, time formatting, etc.
│       ├── package.json
│       └── tsconfig.json
├── backend/
│   └── database/
│       ├── src/
│       │   ├── models/           # Data models (Task, User, PropertySchema)
│       │   ├── routes/           # API endpoints
│       │   │   ├── tasks.js      # Task CRUD + search + time tracking
│       │   │   ├── users.js      # Auth endpoints
│       │   │   ├── suggestions.js # AI suggestions
│       │   │   ├── analytics.js  # Reports/analytics
│       │   │   └── propertySchemas.js
│       │   ├── services/         # Business logic
│       │   │   └── llm/          # LLM provider implementations
│       │   ├── utils/
│       │   │   ├── expressionParser.js  # Boolean expression engine
│       │   │   └── database.js   # Neo4j connection
│       │   └── server.js         # Express app
│       └── package.json
├── frontend/                     # React web app
│   └── src/
│       ├── components/           # React components
│       │   ├── TaskTree.jsx      # Hierarchical task list
│       │   ├── GraphView.jsx     # Visual graph display with time tracking
│       │   ├── SearchView.jsx    # Boolean search interface
│       │   ├── ReportsView.jsx   # Analytics dashboard
│       │   ├── PropertyEditor.jsx # Property schema editing
│       │   └── charts/           # Chart components
│       ├── context/              # Global state
│       │   ├── AuthContext.jsx
│       │   ├── TaskContext.jsx
│       │   └── PropertySchemaContext.jsx
│       ├── services/
│       │   └── api.js            # API client
│       ├── hooks/
│       │   └── useAutoSuggestions.js
│       └── App.jsx
├── mobile/                       # React Native app (Expo)
│   ├── src/
│   │   ├── components/           # React Native components
│   │   │   └── TaskCard.tsx      # Task display with haptics
│   │   ├── screens/              # Screen components
│   │   │   └── TaskListScreen.tsx
│   │   ├── navigation/           # React Navigation setup
│   │   │   └── AppNavigator.tsx
│   │   └── config/
│   │       └── api.ts            # API configuration
│   ├── App.tsx
│   ├── package.json
│   └── README.md
├── docs/                         # Additional documentation
│   ├── backend-architecture.md
│   ├── frontend-architecture.md
│   ├── api-reference.md
│   ├── mobile-architecture.md
│   ├── mobile-implementation-guide.md
│   ├── llm-integration-guide.md
│   ├── property-schema-guide.md
│   └── expression-syntax.md
├── package.json                  # Monorepo root config with workspaces
└── README.md
```

## Quick Start

### Prerequisites

- **Node.js** v16 or higher
- **Neo4j** v4.4 or higher (local or cloud instance)
- **(Optional)** OpenAI API key for AI features
- **(Optional)** Anthropic API key for Claude
- **(Optional)** Ollama for local LLM

### 1. Set Up Neo4j Database

**Option A: Neo4j Desktop** (recommended for local development)
1. Download [Neo4j Desktop](https://neo4j.com/download/)
2. Create a new database
3. Start the database
4. Note the URI (usually `bolt://localhost:7687`), username, and password

**Option B: Neo4j Aura** (cloud)
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

Edit `.env` with your configuration:
```env
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# Server Configuration
PORT=3000

# LLM Configuration (optional - choose one)
LLM_PROVIDER=openai              # or 'anthropic' or 'ollama'

# OpenAI (if using)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic (if using)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Ollama (if using local model)
OLLAMA_MODEL=llama3.1
OLLAMA_BASE_URL=http://localhost:11434
```

Start the backend:
```bash
npm start
```

Backend will be running at `http://localhost:3000`

### 3. Set Up Frontend

```bash
cd frontend
npm install
```

Create `.env` (if needed):
```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:
```bash
npm run dev
```

Frontend will open at `http://localhost:5173`

### 4. Set Up Mobile App (Optional)

The mobile app requires the backend to be running.

**Initial Setup:**
```bash
# From monorepo root
npm install
```

**Run on iOS Simulator (Mac only):**
```bash
npm run dev:mobile
# Then press 'i' in the terminal
```

**Run on Android Emulator:**
```bash
npm run dev:mobile
# Then press 'a' in the terminal
```

**Run on Physical Device:**
1. Install Expo Go app on your phone
2. Run `npm run dev:mobile`
3. Scan the QR code with Expo Go (Android) or Camera (iOS)

**Configure API URL:**

Edit `mobile/src/config/api.ts` to point to your backend:
- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical Device: `http://YOUR_COMPUTER_IP:3000/api`

See `mobile/README.md` for detailed mobile setup instructions.

### 5. Use the Application

1. **Register** a new account
2. **Create** your first task
3. **Add subtasks** by clicking the "+" button on any task
4. **Add custom properties** with the Property Editor
5. **Search** tasks using boolean expressions or natural language
6. **View Analytics** in the Reports tab
7. **Try AI suggestions** - focus on a task to get AI-generated subtasks

## Usage Examples

### Creating a Project Hierarchy

```
Launch New Product (Goal)
  ├─ Market Research (Project)
  │   ├─ Survey customers (Task)
  │   └─ Analyze competitors (Task)
  ├─ Product Development (Project)
  │   ├─ Design mockups (Task) [priority: high, status: in-progress]
  │   ├─ Build prototype (Task) [estimatedHours: 40]
  │   └─ User testing (Task)
  └─ Marketing Campaign (Project)
      ├─ Create landing page (Task)
      └─ Social media strategy (Task)
```

### Defining Property Schemas

Create reusable property definitions with type enforcement:

**Priority (Dropdown)**
- Type: `select`
- Options: `["low", "medium", "high", "urgent"]`

**Estimated Hours (Number)**
- Type: `number`
- Constraints: `min: 0, max: 200, integer: false`

**Due Date (Date)**
- Type: `date`
- Constraints: `minDate: today`

**Blocking (Boolean)**
- Type: `boolean`

### Boolean Search Examples

```
# Simple equality
done = true
priority = high

# Numeric comparison
estimatedHours > 5
priority = 1

# Date queries
dueDate = today
dueDate < tomorrow

# Text search
name contains meeting
status != blocked

# Complex boolean logic
priority = high AND done = false
(priority = 1 OR priority = 2) AND status != blocked
done = false AND (location = office OR location = home)

# AI-generated tasks
source = ai-suggested
source = ai-accepted OR source = user
```

### Analytics with Filters

Apply filters before running analytics:

1. **Filtered Timeline** - Show activity for `priority = high` tasks only
2. **Completion by Parent** - See completion rates for `done = false` tasks
3. **Inactive Projects** - Find stale projects where `priority != low`
4. **Property Distribution** - See status breakdown for `location = office AND done = false`

## Data Models

### Task
```javascript
{
  id: "uuid",
  name: "Task description",
  done: false,
  source: "user" | "ai-suggested" | "ai-accepted",
  customProperties: {
    priority: "high",
    dueDate: "2024-12-31",
    estimatedHours: 8
  },
  suggestionMetadata: {
    generatedBy: "gpt-4o-mini",
    generatedAt: "2024-11-16T10:00:00Z",
    confidence: 0.85,
    reasoning: "..."
  },
  createdAt: "2024-11-15T...",
  updatedAt: "2024-11-16T..."
}
```

### PropertySchema
```javascript
{
  id: "uuid",
  propertyName: "priority",
  dataType: "select",
  constraints: {
    options: ["low", "medium", "high", "urgent"]
  },
  userId: "uuid"
}
```

## API Documentation

See [backend/database/README.md](backend/database/README.md) for complete API reference.

### Key Endpoints

**Authentication:**
- `POST /api/users` - Register user
- `POST /api/users/login` - Login

**Tasks:**
- `GET /api/users/:userId/tasks` - Get all user tasks
- `POST /api/tasks` - Create a task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `POST /api/tasks/search` - Search tasks with boolean expression
- `POST /api/tasks/:id/subtasks` - Add subtask relationship

**Property Schemas:**
- `GET /api/property-schemas/user/:userId` - Get user's schemas
- `POST /api/property-schemas` - Create a schema
- `PUT /api/property-schemas/:id` - Update a schema
- `POST /api/property-schemas/validate` - Validate property value

**AI Suggestions:**
- `POST /api/suggestions/subtasks` - Generate subtask suggestions
- `POST /api/suggestions/properties` - Generate property suggestions
- `POST /api/suggestions/convert-to-expression` - Natural language → expression

**Analytics:**
- `GET /api/analytics/completion?filter=...` - Task completion stats
- `GET /api/analytics/timeline?filter=...` - Activity timeline
- `GET /api/analytics/inactive-projects?filter=...` - Find stale projects
- `GET /api/analytics/property-distribution?filter=...` - Property values

## Boolean Expression Syntax

Full documentation: [docs/expression-syntax.md](docs/expression-syntax.md)

**Operators:**
- Comparison: `=`, `!=`, `<`, `>`, `<=`, `>=`, `contains`, `not contains`
- Boolean: `AND`, `OR`, `NOT`
- Grouping: `( )`
- Special values: `today`, `yesterday`, `tomorrow`, `null`

**Property Types:**
- Built-in: `name`, `done`, `source`
- Custom: Any user-defined property from PropertySchema

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

### Code Architecture

**Backend:**
- `models/` - Data access layer with Neo4j Cypher queries
- `routes/` - Express route handlers, RESTful endpoints
- `services/llm/` - LLM provider pattern (OpenAI, Anthropic, Ollama)
- `utils/expressionParser.js` - Boolean expression tokenizer, parser, and evaluator

**Frontend:**
- `components/` - React components (functional with hooks)
- `context/` - Context API providers for global state
- `services/api.js` - Single API client class
- `hooks/` - Custom hooks (auto-suggestions with debouncing)

## Technology Stack

**Backend:**
- Node.js + Express
- Neo4j graph database
- OpenAI SDK, Anthropic SDK, Ollama
- bcrypt (password hashing)

**Frontend:**
- React 19
- Vite (build tool)
- Context API (state management)
- SVG (visualizations)

**Database:**
- Neo4j 5.x with APOC plugin

## Design Decisions

### Why Graph Database?
Neo4j makes hierarchical queries natural and performant. Getting all ancestors or full subtrees is expensive with traditional parent_id foreign keys, but trivial in a graph.

### Why Load All Tasks in Memory?
For typical users (hundreds to low thousands of tasks):
- Instant UI updates
- No loading spinners
- Easy client-side filtering/search
- Simplified state management

For 10,000+ tasks, this would need revision.

### Why Custom Properties as JSON?
Simpler for v1. Querying within JSON is limited, but acceptable for current feature set. Could be refactored to property nodes later if needed.

### Provider Pattern for LLMs
Allows easy swapping between OpenAI, Anthropic, and local models without changing application code. All providers implement the same interface.

## Performance Considerations

- **Client-side filtering** - Fast search with all tasks in memory
- **Debounced auto-suggestions** - 2-second delay prevents excessive API calls
- **Session-based caching** - Prevents duplicate AI calls for same task
- **Lazy chart rendering** - Charts only rendered when report selected
- **Efficient aggregations** - JavaScript-based analytics avoid complex Cypher queries

## Security

- **Password hashing** - bcrypt with salt
- **Input validation** - Both client and server-side
- **Parameterized queries** - All Cypher queries use parameters
- **XSS prevention** - React escapes by default
- **Type enforcement** - Property schemas validate all custom property values

## Troubleshooting

### Neo4j Connection Issues
- Verify Neo4j is running
- Check credentials in `.env` match Neo4j user
- Ensure bolt port 7687 is accessible

### LLM API Errors
- Verify API key is correctly set in `.env`
- Check API quota/billing status
- Try switching to a different provider

### Expression Parser Errors
- Check syntax against documentation
- Use real-time validation in Search/Reports UI
- Remember: property names are case-insensitive

## Additional Documentation

- [Backend API Reference](backend/database/README.md)
- [Frontend Architecture](frontend/README.md)
- [LLM Integration Guide](docs/llm-integration-guide.md)
- [Property Schema Guide](docs/property-schema-guide.md)
- [Expression Syntax Reference](docs/expression-syntax.md)

## Contributing

Contributions welcome! Please ensure:
1. New features include tests
2. Documentation is updated
3. Code follows existing patterns
4. Commit messages are clear

## License

ISC
