#!/bin/bash

# GTD Local Development Setup Script
# This script helps you quickly set up the GTD application for local development

set -e  # Exit on error

echo "🚀 GTD Local Development Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available${NC}"
    echo "Please install Docker Compose"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose is available${NC}"
echo ""

# Ask user what they want to set up
echo "What would you like to set up?"
echo "1) Neo4j only (use external LLM provider)"
echo "2) Neo4j + Ollama (self-hosted LLM)"
echo "3) Everything (Neo4j + Ollama + API server)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        PROFILE=""
        SERVICES="neo4j"
        ;;
    2)
        PROFILE="--profile ollama"
        SERVICES="neo4j ollama"
        ;;
    3)
        PROFILE="--profile ollama --profile api"
        SERVICES="neo4j ollama api"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "📋 Setting up: $SERVICES"
echo ""

# Create .env file if it doesn't exist
if [ ! -f backend/database/.env ]; then
    echo "Creating .env file from .env.example..."
    cp backend/database/.env.example backend/database/.env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/database/.env with your configuration${NC}"
else
    echo -e "${YELLOW}ℹ️  .env file already exists${NC}"
fi

echo ""

# Start Docker containers
echo "🐳 Starting Docker containers..."
echo ""

if [ "$choice" == "3" ]; then
    docker-compose up $PROFILE -d
else
    docker-compose up -d $SERVICES
fi

echo ""
echo -e "${GREEN}✅ Docker containers started!${NC}"
echo ""

# Wait for Neo4j to be ready
echo "⏳ Waiting for Neo4j to be ready..."
timeout=60
counter=0

while ! docker exec gtd-neo4j cypher-shell -u neo4j -p password123 "RETURN 1" &> /dev/null; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}❌ Neo4j failed to start within $timeout seconds${NC}"
        exit 1
    fi
    echo -n "."
done

echo ""
echo -e "${GREEN}✓ Neo4j is ready${NC}"
echo ""

# Initialize database
echo "🗄️  Initializing database..."
echo ""

# Copy setup files to Neo4j import directory
docker cp backend/database/setup/. gtd-neo4j:/var/lib/neo4j/import/

# Run initialization scripts
echo "Creating constraints..."
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 < backend/database/setup/constraints.cypher 2>/dev/null || true

echo "Creating indexes..."
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 < backend/database/setup/indexes.cypher 2>/dev/null || true

echo "Loading enums..."
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 "
LOAD CSV WITH HEADERS FROM 'file:///enums.csv' AS row
MERGE (e:Enum {name: row.name})
SET e.values = split(row.values, '|')
" 2>/dev/null || true

echo "Loading subscription plans..."
docker exec gtd-neo4j cypher-shell -u neo4j -p password123 "
LOAD CSV WITH HEADERS FROM 'file:///subscriptionPlans.csv' AS row
MERGE (sp:SubscriptionPlan {planId: row.planId})
SET sp.name = row.name,
    sp.price = toFloat(row.price),
    sp.currency = row.currency,
    sp.interval = row.interval,
    sp.maxTasks = toInteger(row.maxTasks),
    sp.maxProjects = toInteger(row.maxProjects),
    sp.maxTimeEntries = toInteger(row.maxTimeEntries),
    sp.features = split(row.features, '|'),
    sp.stripePriceId = row.stripePriceId,
    sp.stripeProductId = row.stripeProductId,
    sp.active = row.active = 'true',
    sp.createdAt = datetime(),
    sp.updatedAt = datetime()
" 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Database initialized!${NC}"
echo ""

# If Ollama is selected, provide instructions
if [ "$choice" == "2" ] || [ "$choice" == "3" ]; then
    echo "🤖 Ollama Setup"
    echo "==============="
    echo ""
    echo "Ollama is starting up. To use it, you need to pull a model:"
    echo ""
    echo -e "${YELLOW}  docker exec -it gtd-ollama ollama pull llama2${NC}"
    echo ""
    echo "Or pull other models:"
    echo "  - llama2 (7B) - Good for general tasks"
    echo "  - mistral (7B) - Fast and efficient"
    echo "  - codellama (7B) - Good for code tasks"
    echo "  - phi (2.7B) - Very fast, smaller model"
    echo ""
    echo "Then update your .env file:"
    echo "  AI_PROVIDER=ollama"
    echo "  OLLAMA_MODEL=llama2"
    echo ""
fi

# Print access information
echo "📍 Access Information"
echo "===================="
echo ""
echo -e "${GREEN}Neo4j Browser:${NC}  http://localhost:7474"
echo "  Username: neo4j"
echo "  Password: password123"
echo ""

if [ "$choice" == "2" ] || [ "$choice" == "3" ]; then
    echo -e "${GREEN}Ollama API:${NC}     http://localhost:11434"
    echo ""
fi

if [ "$choice" == "3" ]; then
    echo -e "${GREEN}API Server:${NC}     http://localhost:3000"
    echo ""
fi

# Print next steps
echo "🎯 Next Steps"
echo "============="
echo ""
echo "1. Configure your .env file in backend/database/.env"
echo ""

if [ "$choice" == "1" ]; then
    echo "2. Set up your AI provider (optional):"
    echo "   - For OpenAI: Set OPENAI_API_KEY"
    echo "   - For Anthropic: Set ANTHROPIC_API_KEY"
    echo "   - Or leave AI_PROVIDER=disabled"
    echo ""
    echo "3. Start the API server:"
    echo -e "   ${YELLOW}cd backend/database && npm install && npm start${NC}"
elif [ "$choice" == "2" ]; then
    echo "2. Pull an Ollama model (see instructions above)"
    echo ""
    echo "3. Start the API server:"
    echo -e "   ${YELLOW}cd backend/database && npm install && npm start${NC}"
else
    echo "2. Pull an Ollama model (see instructions above)"
    echo ""
    echo "3. Check API server logs:"
    echo -e "   ${YELLOW}docker-compose logs -f api${NC}"
fi

echo ""
echo "📚 View the full local development guide:"
echo -e "   ${YELLOW}cat docs/LOCAL_DEVELOPMENT.md${NC}"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
