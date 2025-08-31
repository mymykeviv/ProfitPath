#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Installing ProfitPath Dependencies...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

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

echo -e "${GREEN}✅ Prerequisites check passed.${NC}"

# Install root dependencies
echo -e "${BLUE}📦 Installing root dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install root dependencies.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Root dependencies installed.${NC}"

# Install backend dependencies
echo -e "${BLUE}🔧 Installing backend dependencies...${NC}"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install backend dependencies.${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✅ Backend dependencies installed.${NC}"

# Install frontend dependencies
echo -e "${BLUE}⚛️  Installing frontend dependencies...${NC}"
cd app
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install frontend dependencies.${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✅ Frontend dependencies installed.${NC}"

echo -e "${GREEN}🎉 All dependencies installed successfully!${NC}"
echo -e "${BLUE}💡 You can now start development with: npm run start:dev${NC}"