# Local Development Guide

This guide will help you get the GTD application running locally with minimal setup.

## 🚀 Quick Start (Recommended)

The fastest way to get started:

```bash
# 1. Run the setup script
./scripts/setup-local.sh

# 2. Follow the prompts to choose your setup
# Option 1: Neo4j only (use external LLM)
# Option 2: Neo4j + Ollama (self-hosted LLM)
# Option 3: Everything (ready-to-run stack)

# 3. Start developing!
cd backend/database
npm install
npm start
```

That's it! The script handles Docker setup, database initialization, and configuration.

---

## 📋 Prerequisites

- **Docker Desktop** - https://www.docker.com/products/docker-desktop
- **Node.js 18+** - https://nodejs.org/
- **Git** - https://git-scm.com/

## 🏗️ Architecture Options

You can run the GTD app in several configurations:

### Option 1: Minimal Setup (Neo4j Only)

Perfect for getting started quickly with external AI providers.

```bash
docker-compose up -d neo4j
```

**What you get:**
- ✅ Neo4j database at http://localhost:7474
- ✅ Bolt connection at bolt://localhost:7687
- 🔧 Configure OpenAI or Anthropic for AI features

### Option 2: Self-Hosted AI (Neo4j + Ollama)

Best for privacy-conscious development or offline work.

```bash
docker-compose --profile ollama up -d
```

**What you get:**
- ✅ Neo4j database
- ✅ Ollama for self-hosted LLMs at http://localhost:11434
- 🔧 No external AI API keys needed

### Option 3: Full Stack (Everything)

Complete development environment with all services.

```bash
docker-compose --profile ollama --profile api up -d
```

**What you get:**
- ✅ Neo4j database
- ✅ Ollama for LLMs
- ✅ API server at http://localhost:3000
- 🔧 Ready to go!

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in `backend/database/`:

```bash
# Copy the example
cp backend/database/.env.example backend/database/.env

# Or use the simplified local config
cp .env.local.example .env.local
```

### Database Configuration

**Default credentials** (set by docker-compose):
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123
```

### AI Provider Configuration

#### Using Ollama (Self-Hosted)

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

**Pull a model:**
```bash
# Pull Llama 2 (recommended)
docker exec -it gtd-ollama ollama pull llama2

# Or try other models:
docker exec -it gtd-ollama ollama pull mistral     # Fast & efficient
docker exec -it gtd-ollama ollama pull phi         # Very fast, smaller
docker exec -it gtd-ollama ollama pull codellama   # Good for code
```

**Available models:** https://ollama.com/library

#### Using OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4
```

Get your API key: https://platform.openai.com/api-keys

#### Using Anthropic (Claude)

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

Get your API key: https://console.anthropic.com/

#### Disabling AI Features

```env
AI_PROVIDER=disabled
```

---

## 🗄️ Database Setup

### Initialize Database

The setup script does this automatically, but you can also run manually:

```bash
# Create constraints
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 \
  < backend/database/setup/constraints.cypher

# Create indexes
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 \
  < backend/database/setup/indexes.cypher

# Load enums
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 "
LOAD CSV WITH HEADERS FROM 'file:///enums.csv' AS row
MERGE (e:Enum {name: row.name})
SET e.values = split(row.values, '|')
"

# Load subscription plans
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 "
LOAD CSV WITH HEADERS FROM 'file:///subscriptionPlans.csv' AS row
MERGE (sp:SubscriptionPlan {planId: row.planId})
SET sp += {
  name: row.name,
  price: toFloat(row.price),
  currency: row.currency,
  interval: row.interval,
  maxTasks: toInteger(row.maxTasks),
  maxProjects: toInteger(row.maxProjects),
  maxTimeEntries: toInteger(row.maxTimeEntries),
  features: split(row.features, '|'),
  stripePriceId: row.stripePriceId,
  stripeProductId: row.stripeProductId,
  active: row.active = 'true',
  createdAt: datetime(),
  updatedAt: datetime()
}
"
```

### Access Neo4j Browser

1. Open http://localhost:7474
2. Login with:
   - Username: `neo4j`
   - Password: `password123`

### Useful Cypher Queries

```cypher
// View all subscription plans
MATCH (sp:SubscriptionPlan) RETURN sp

// View all enums
MATCH (e:Enum) RETURN e.name, e.values

// Count nodes by type
MATCH (n) RETURN labels(n) as type, count(*) as count

// Delete all data (careful!)
MATCH (n) DETACH DELETE n
```

---

## 🚀 Running the API Server

### Development Mode (Hot Reload)

```bash
cd backend/database

# Install dependencies
npm install

# Start with nodemon (auto-restart on changes)
npm run dev
```

### Production Mode

```bash
npm start
```

### Test AI Integration

```bash
# Test your LLM connection
node -e "
const llmClient = require('./src/utils/ai/llmClient');
llmClient.test().then(result => {
  console.log('LLM Test Result:', result);
});
"
```

### Run Security Tests

```bash
# Test anti-jailbreaking utilities
node src/utils/ai/__tests__/promptSecurity.test.js

# Run examples
node src/utils/ai/examples.js
```

---

## 📡 API Endpoints

Once running, access the API at http://localhost:3000

### Health Check
```bash
curl http://localhost:3000
```

### Subscription Endpoints
```bash
# List plans
curl http://localhost:3000/api/subscriptions/plans

# Get current subscription (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/subscriptions/current
```

### AI Test Endpoint (Add This)

Create a test endpoint to verify AI integration:

```javascript
// In src/routes/ai.js (create this file)
router.get('/test', async (req, res) => {
  const llmClient = require('../utils/ai/llmClient');
  const test = await llmClient.test();
  res.json(test);
});
```

---

## 🛠️ Development Workflow

### Typical Development Flow

1. **Start services:**
   ```bash
   docker-compose --profile ollama up -d
   ```

2. **Install dependencies:**
   ```bash
   cd backend/database && npm install
   ```

3. **Start API in dev mode:**
   ```bash
   npm run dev
   ```

4. **Make changes** - Files auto-reload

5. **Test changes:**
   ```bash
   curl http://localhost:3000/your-endpoint
   ```

### Viewing Logs

```bash
# Neo4j logs
docker-compose logs -f neo4j

# Ollama logs
docker-compose logs -f ollama

# API logs (if using Docker)
docker-compose logs -f api

# Or just watch your terminal if running npm start
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Neo4j Won't Start

**Problem:** Container starts but Neo4j isn't accessible

```bash
# Check Neo4j logs
docker-compose logs neo4j

# Verify Neo4j is running
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 "RETURN 1"

# Restart Neo4j
docker-compose restart neo4j
```

### Ollama Connection Errors

**Problem:** Can't connect to Ollama

```bash
# Check if Ollama is running
docker-compose ps

# Test Ollama directly
curl http://localhost:11434/api/tags

# View Ollama logs
docker-compose logs ollama

# Restart Ollama
docker-compose restart ollama
```

### Port Already in Use

**Problem:** Port 7474, 7687, or 11434 is already in use

```bash
# Find what's using the port
lsof -i :7474
lsof -i :7687
lsof -i :11434

# Kill the process or change ports in docker-compose.yml
```

### LLM Client Not Initializing

**Problem:** AI features not working

```bash
# Check your .env file
cat backend/database/.env | grep AI_PROVIDER

# Test LLM connection
node -e "
const llm = require('./backend/database/src/utils/ai/llmClient');
console.log('Provider:', llm.provider);
console.log('Available:', llm.isAvailable());
llm.test().then(r => console.log('Test:', r));
"
```

### Database Connection Issues

**Problem:** Can't connect to Neo4j from API

```bash
# Verify Neo4j is accessible
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 "RETURN 1"

# Check network
docker network inspect gtd-mono_gtd-network

# Restart everything
docker-compose down && docker-compose --profile ollama up -d
```

---

## 🧪 Testing

### Manual API Testing

```bash
# Using curl
curl -X POST http://localhost:3000/api/subscriptions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"planId": "plan_pro_001"}'

# Using HTTPie (if installed)
http POST localhost:3000/api/subscriptions/create \
  planId=plan_pro_001 \
  Authorization:"Bearer YOUR_TOKEN"
```

### Testing AI Security

```bash
# Run the full test suite
cd backend/database
node src/utils/ai/__tests__/promptSecurity.test.js

# Run specific examples
node src/utils/ai/examples.js
```

---

## 📦 Package Scripts

Add these to `backend/database/package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "node src/utils/ai/__tests__/promptSecurity.test.js",
    "test:ai": "node -e \"require('./src/utils/ai/llmClient').test().then(r => console.log(r))\"",
    "examples": "node src/utils/ai/examples.js",
    "db:setup": "docker exec gtd-neo4j cypher-shell -u neo4j -p password123 < setup/constraints.cypher && docker exec gtd-neo4j cypher-shell -u neo4j -p password123 < setup/indexes.cypher"
  }
}
```

---

## 🔐 Security Notes

### For Local Development

- Default Neo4j password is `password123` - **Change this for production!**
- Ollama has no authentication by default - **Don't expose to the internet!**
- `.env` file is gitignored - **Never commit secrets!**

### For Production

- Use strong, random passwords
- Enable SSL/TLS for Neo4j
- Use environment-specific secrets
- Implement proper authentication
- See `SUBSCRIPTION_SETUP.md` for production checklist

---

## 🆘 Getting Help

1. **Check the logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Verify configuration:**
   ```bash
   cat backend/database/.env
   ```

3. **Test individual components:**
   ```bash
   npm run test:ai
   ```

4. **Review documentation:**
   - `/docs/AI_SECURITY_GUIDE.md` - AI integration
   - `/backend/database/SUBSCRIPTION_SETUP.md` - Subscription system
   - `/backend/database/docs/database.md` - Database schema

---

## 🎯 Next Steps

Once you have everything running:

1. **Explore the API** - http://localhost:3000
2. **Check Neo4j Browser** - http://localhost:7474
3. **Test AI features** - Try the suggestion service
4. **Read the guides** - Understand the architecture
5. **Start building!** - Add your features

---

## 📚 Additional Resources

- [Neo4j Documentation](https://neo4j.com/docs/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Docker Compose](https://docs.docker.com/compose/)

Happy coding! 🚀
