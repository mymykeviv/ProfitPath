#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping ProfitPath Development Environment...${NC}"

# Function to check if a process is running
process_running() {
    pgrep -f "$1" >/dev/null 2>&1
}

# Function to gracefully stop a process
stop_process() {
    local process_name="$1"
    local display_name="$2"
    
    if process_running "$process_name"; then
        echo -e "${YELLOW}⏹️  Stopping $display_name...${NC}"
        pkill -f "$process_name"
        
        # Wait up to 10 seconds for graceful shutdown
        local count=0
        while process_running "$process_name" && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if process_running "$process_name"; then
            echo -e "${YELLOW}⚠️  Force stopping $display_name...${NC}"
            pkill -9 -f "$process_name"
        fi
        
        echo -e "${GREEN}✅ $display_name stopped.${NC}"
    else
        echo -e "${BLUE}ℹ️  $display_name is not running.${NC}"
    fi
}

# Stop backend processes
stop_process "nodemon" "Backend server"
stop_process "node.*index.js" "Node.js backend"

# Stop frontend processes
stop_process "react-scripts" "Frontend React app"
stop_process "webpack" "Webpack dev server"

# Stop any remaining Node.js processes on development ports
echo -e "${BLUE}🔍 Checking for processes on development ports...${NC}"

# Kill processes on port 3000 (frontend)
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing process on port 3000...${NC}"
    lsof -ti :3000 | xargs kill -9 2>/dev/null
fi

# Kill processes on port 3001 (backend)
if lsof -i :3001 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing process on port 3001...${NC}"
    lsof -ti :3001 | xargs kill -9 2>/dev/null
fi

echo -e "${GREEN}✅ Development environment stopped successfully!${NC}"
echo -e "${BLUE}💡 You can restart with: npm run start:dev${NC}"
