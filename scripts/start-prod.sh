#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting ProfitPath Production Application...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down production application...${NC}"
    if [ ! -z "$ELECTRON_PID" ]; then
        kill $ELECTRON_PID 2>/dev/null
    fi
    pkill -f electron 2>/dev/null
    echo -e "${GREEN}✅ Production application stopped.${NC}"
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

# Check if production build exists
if [ ! -d "app/build" ]; then
    echo -e "${YELLOW}⚠️  Production build not found. Building frontend...${NC}"
    cd app && npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to build frontend for production.${NC}"
        exit 1
    fi
    cd ..
fi

# Check if dependencies are installed
echo -e "${BLUE}📦 Checking dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Root dependencies not found. Installing...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install root dependencies.${NC}"
        exit 1
    fi
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd backend && npm install --production
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies.${NC}"
        exit 1
    fi
    cd ..
fi

# Start Electron app
echo -e "${BLUE}⚡ Starting Electron application...${NC}"
npm run electron:dev &
ELECTRON_PID=$!

# Wait a moment for Electron to start
sleep 3

echo -e "${GREEN}✅ Production application started successfully!${NC}"
echo -e "${YELLOW}💡 Press Ctrl+C to stop the application${NC}"

# Wait for Electron to exit (or Ctrl+C)
wait $ELECTRON_PID
