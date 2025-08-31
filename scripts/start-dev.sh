#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting ProfitPath Development Environment...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development environment...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    # Kill any remaining processes
    pkill -f nodemon 2>/dev/null
    pkill -f react-scripts 2>/dev/null
    echo -e "${GREEN}✅ Development environment stopped.${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ and try again.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi

# Check if ports are available
if port_in_use 3000; then
    echo -e "${RED}❌ Port 3000 is already in use. Please free the port and try again.${NC}"
    exit 1
fi

if port_in_use 3001; then
    echo -e "${RED}❌ Port 3001 is already in use. Please free the port and try again.${NC}"
    exit 1
fi

# Check if dependencies are installed
echo -e "${BLUE}📦 Checking dependencies...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd backend && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies.${NC}"
        exit 1
    fi
    cd ..
fi

if [ ! -d "app/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd app && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install frontend dependencies.${NC}"
        exit 1
    fi
    cd ..
fi

# Start backend server
echo -e "${BLUE}🔧 Starting backend server on port 3001...${NC}"
cd backend
npx nodemon index.js &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend React app
echo -e "${BLUE}⚛️  Starting frontend React app on port 3000...${NC}"
cd app
npm start &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

echo -e "${GREEN}✅ Development environment started successfully!${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:3001${NC}"
echo -e "${YELLOW}💡 Press Ctrl+C to stop the development environment${NC}"

# Wait for both processes to exit (or Ctrl+C)
wait $BACKEND_PID $FRONTEND_PID
