#!/bin/bash

# Start the entire GTD stack (Neo4j + Backend + Frontend)

set -e

echo "🚀 Starting GTD Full Stack"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get absolute path to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend/database"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if Neo4j is running, start if not
if ! docker ps | grep -q gtd-neo4j; then
    echo "🐳 Starting Neo4j..."
    cd "$PROJECT_ROOT"
    ./scripts/setup-local.sh
else
    echo -e "${GREEN}✓ Neo4j already running${NC}"
fi

echo ""
echo "📦 Installing dependencies..."

# Install backend dependencies
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
fi

# Install frontend dependencies
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
fi

echo ""
echo "🚀 Starting services..."
echo ""

# Start backend in background
cd "$BACKEND_DIR"
npm start &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait a moment for backend to start
sleep 3

# Start frontend in background
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ GTD Stack is running!${NC}"
echo "=========================================="
echo ""
echo "🌐 Access your app:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3000"
echo "   Neo4j:     http://localhost:7474 (neo4j/password123)"
echo ""
echo "📝 Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running
wait
