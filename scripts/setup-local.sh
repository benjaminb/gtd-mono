#!/bin/bash

# GTD Local Development Setup Script
# Simple setup: Start Neo4j, initialize database, create .env

set -e  # Exit on error

echo "🚀 GTD Local Development Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f backend/database/.env ]; then
    echo "📝 Creating .env file..."
    cp backend/database/.env.example backend/database/.env
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""

# Start Neo4j
echo "🐳 Starting Neo4j..."
docker-compose up -d neo4j

echo ""
echo -e "${GREEN}✓ Neo4j container started${NC}"
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

# Print access information
echo "📍 Access Information"
echo "===================="
echo ""
echo -e "${GREEN}Neo4j Browser:${NC}  http://localhost:7474"
echo "  Username: neo4j"
echo "  Password: password123"
echo ""

# Print next steps
echo "🎯 Next Steps"
echo "============="
echo ""
echo "1. Install dependencies:"
echo -e "   ${YELLOW}cd backend/database && npm install${NC}"
echo ""
echo "2. Start the API server:"
echo -e "   ${YELLOW}npm start${NC}"
echo ""
echo "3. (Optional) Configure AI features in backend/database/.env:"
echo "   - Set AI_PROVIDER to 'openai', 'anthropic', 'ollama', or 'disabled'"
echo "   - Add your API key if using external providers"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
