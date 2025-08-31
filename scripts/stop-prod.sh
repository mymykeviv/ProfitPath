#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping ProfitPath Production Application...${NC}"

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
        
        # Wait up to 15 seconds for graceful shutdown
        local count=0
        while process_running "$process_name" && [ $count -lt 15 ]; do
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

# Stop Electron processes
stop_process "electron" "Electron application"
stop_process "ProfitPath" "ProfitPath application"

# Stop any backend processes that might be running
stop_process "node.*index.js" "Backend server"

echo -e "${GREEN}✅ Production application stopped successfully!${NC}"
echo -e "${BLUE}💡 You can restart with: npm run start:prod${NC}"
