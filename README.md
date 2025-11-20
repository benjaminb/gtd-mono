# GTD Task Management System

A modern Getting Things Done (GTD) task management system with Neo4j graph database, subscription billing via Stripe, AI-powered features with comprehensive security, and native mobile apps for iOS and Android.

## 🚀 Quick Start

### Backend API

Get up and running in 3 steps:

```bash
# 1. Clone and setup
git clone <your-repo-url>
cd gtd-mono

# 2. Run setup script
./scripts/setup-local.sh

# 3. Start developing
cd backend/database
npm install
npm start
```

**Access:**
- 🌐 API Server: http://localhost:3000
- 🗄️ Neo4j Browser: http://localhost:7474 (neo4j / password123)
- 🤖 Ollama API: http://localhost:11434 (if enabled)

### Mobile Apps (iOS/Android)

For Apple Silicon Macs:

```bash
# 1. Run mobile setup script
./scripts/setup-mobile.sh

# 2. Start backend API first
cd backend/database && npm start

# 3. Start mobile app
cd mobile && npm start

# 4. Press 'i' for iOS or 'a' for Android
```

See [Mobile Development Guide](docs/MOBILE_DEVELOPMENT.md) for detailed instructions.

## 📋 What's Inside

### Core Features

- **Task Management** - Full GTD workflow with projects, tasks, and subtasks
- **Neo4j Graph Database** - Flexible task relationships and hierarchies
- **Subscription Billing** - Stripe integration with Free/Pro/Enterprise tiers
- **AI Suggestions** - Task insights and recommendations (OpenAI/Anthropic/Ollama)
- **Security** - Comprehensive anti-jailbreaking for LLM integrations
- **RESTful API** - Well-documented endpoints with Express.js

### Tech Stack

- **Database:** Neo4j 5.15
- **Backend:** Node.js + Express
- **Mobile:** React Native + Expo (iOS/Android)
- **Payments:** Stripe
- **AI:** OpenAI / Anthropic / Ollama (configurable)
- **Infrastructure:** Docker Compose

## 🎯 AI Provider Options

Choose your AI setup based on your needs:

### 1. Ollama (Self-Hosted) - Recommended for Development

```bash
# Start with Ollama
docker-compose --profile ollama up -d

# Pull a model
docker exec -it gtd-ollama ollama pull llama2

# Configure .env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama2
```

**Pros:**
- ✅ Free and private
- ✅ Works offline
- ✅ No API keys needed
- ✅ Great for development

**Cons:**
- ⚠️ Slower than cloud APIs
- ⚠️ Requires decent hardware

### 2. OpenAI - Best for Production

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4
```

**Pros:**
- ✅ Fast and accurate
- ✅ Production-ready
- ✅ Latest models

**Cons:**
- ⚠️ Costs money
- ⚠️ Requires API key

### 3. Anthropic (Claude) - Best for Complex Tasks

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

### 4. Disabled - No AI Features

```env
AI_PROVIDER=disabled
```

## 🗄️ Database Architecture

### Node Types

- **User** - User accounts with preferences
- **Task** - Tasks with hierarchical relationships
- **TaskField** - Dynamic fields for tasks
- **TimeEntry** - Time tracking
- **SubscriptionPlan** - Available subscription tiers
- **Subscription** - User subscriptions
- **PaymentMethod** - Saved payment methods
- **Invoice** - Billing invoices

### Key Relationships

```cypher
(User)-[:HAS_TASK]->(Task)
(Task)-[:HAS_SUBTASK]->(Task)
(User)-[:HAS_SUBSCRIPTION]->(Subscription)
(Subscription)-[:FOR_PLAN]->(SubscriptionPlan)
```

See [docs/database.md](backend/database/docs/database.md) for full schema.

## 🔒 Security Features

### Anti-Jailbreaking for AI

All AI integrations include comprehensive security:

- **5-layer defense** against prompt injection
- **Pattern-based detection** with risk scoring
- **Input sanitization** and validation
- **Response verification** for safety
- **Configurable security levels**

See [docs/AI_SECURITY_GUIDE.md](backend/database/docs/AI_SECURITY_GUIDE.md)

## 📦 Project Structure

```
gtd-mono/
├── backend/
│   └── database/
│       ├── src/
│       │   ├── index.js           # Entry point
│       │   ├── server.js          # Express server
│       │   ├── routes/            # API routes
│       │   │   ├── subscriptions.js
│       │   │   ├── paymentMethods.js
│       │   │   ├── invoices.js
│       │   │   └── webhooks.js
│       │   ├── services/          # Business logic
│       │   │   ├── stripeService.js
│       │   │   ├── subscriptionService.js
│       │   │   ├── paymentService.js
│       │   │   ├── invoiceService.js
│       │   │   └── aiSuggestionService.js
│       │   ├── middleware/        # Middleware
│       │   │   └── subscription.js
│       │   └── utils/
│       │       ├── database.js    # Neo4j connection
│       │       └── ai/            # AI utilities
│       │           ├── promptSecurity.js
│       │           ├── llmClient.js
│       │           ├── examples.js
│       │           └── __tests__/
│       ├── setup/                 # Database setup
│       │   ├── constraints.cypher
│       │   ├── indexes.cypher
│       │   ├── enums.csv
│       │   └── subscriptionPlans.csv
│       └── docs/                  # Documentation
├── mobile/
│   ├── App.js                    # React Navigation setup
│   ├── src/
│   │   ├── config/
│   │   │   └── api.js            # API configuration
│   │   ├── services/
│   │   │   └── api.js            # API client
│   │   └── screens/
│   │       ├── HomeScreen.js
│   │       └── SubscriptionPlansScreen.js
│   └── .env                      # Mobile config (gitignored)
├── scripts/
│   ├── setup-local.sh            # Local dev setup
│   └── setup-mobile.sh           # Mobile setup (Apple Silicon)
├── docs/
│   ├── LOCAL_DEVELOPMENT.md      # Backend development guide
│   └── MOBILE_DEVELOPMENT.md     # Mobile development guide
├── docker-compose.yml            # Docker services
└── .env.local.example           # Quick config
```

## 🛠️ Development

### Available Commands

From the monorepo root:

```bash
# Setup
npm run setup:local    # Backend setup wizard
npm run setup:mobile   # Mobile setup wizard (Apple Silicon)

# API Server
npm run start:api      # Start API server
npm run dev:api        # Start with hot reload

# Mobile App
npm run start:mobile   # Start Expo dev server
npm run mobile:ios     # Run on iOS Simulator
npm run mobile:android # Run on Android Emulator

# Docker
npm run docker:up      # Start all services
npm run docker:down    # Stop all services
```

From backend/database:

```bash
npm start              # Start server
npm run dev            # Start with hot reload
npm test               # Run security tests
npm run test:ai        # Test AI connection
npm run db:setup       # Initialize database
```

From mobile:

```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS Simulator
npm run android        # Run on Android Emulator
```

### API Endpoints

#### Subscriptions
```bash
GET    /api/subscriptions/plans       # List plans
GET    /api/subscriptions/current     # Current subscription
POST   /api/subscriptions/create      # Create subscription
PUT    /api/subscriptions/update      # Update plan
POST   /api/subscriptions/cancel      # Cancel subscription
GET    /api/subscriptions/usage       # Usage statistics
```

#### Payment Methods
```bash
GET    /api/payment-methods           # List payment methods
POST   /api/payment-methods           # Add payment method
DELETE /api/payment-methods/:id       # Remove payment method
PUT    /api/payment-methods/:id/default  # Set default
```

#### Invoices
```bash
GET    /api/invoices                  # List invoices
GET    /api/invoices/upcoming         # Upcoming invoice
GET    /api/invoices/:id              # Get invoice
GET    /api/invoices/:id/pdf          # Download PDF
```

#### Webhooks
```bash
POST   /api/webhooks/stripe           # Stripe webhook endpoint
```

## 📚 Documentation

### Getting Started
- **[Local Development Guide](docs/LOCAL_DEVELOPMENT.md)** - Backend setup instructions
- **[Mobile Development Guide](docs/MOBILE_DEVELOPMENT.md)** - iOS/Android setup for Apple Silicon

### Backend
- **[AI Security Guide](backend/database/docs/AI_SECURITY_GUIDE.md)** - Anti-jailbreaking documentation
- **[Subscription Setup](backend/database/SUBSCRIPTION_SETUP.md)** - Stripe configuration
- **[Database Schema](backend/database/docs/database.md)** - Neo4j schema details
- **[System Design](backend/database/docs/subscription-system-design.md)** - Architecture overview

## 🔑 Configuration

### Minimal Configuration

For quick local testing:

```env
# .env (in backend/database/)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123
AI_PROVIDER=disabled
```

### Full Configuration

See [.env.example](backend/database/.env.example) for all options.

## 🧪 Testing

### Test AI Security

```bash
cd backend/database

# Run security test suite
npm test

# Run AI examples
npm run examples:ai

# Test LLM connection
npm run test:ai
```

### Manual Testing

```bash
# Health check
curl http://localhost:3000

# List subscription plans
curl http://localhost:3000/api/subscriptions/plans

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/subscriptions/current
```

## 🚢 Deployment

### Production Checklist

- [ ] Set strong Neo4j password
- [ ] Configure production Stripe keys
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Set strong JWT secret
- [ ] Configure CORS for your domain
- [ ] Set up monitoring and logging
- [ ] Review security settings
- [ ] Test webhook endpoints
- [ ] Set up backup strategy

See [SUBSCRIPTION_SETUP.md](backend/database/SUBSCRIPTION_SETUP.md) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

- **Issues:** Report bugs via GitHub Issues
- **Documentation:** Check `/docs` folder
- **Security:** Report security issues privately

---

**Built with ❤️ for productivity enthusiasts**
