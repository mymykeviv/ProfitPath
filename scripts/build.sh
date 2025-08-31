#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Building ProfitPath for Production...${NC}"

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

# Check if dependencies are installed
if [ ! -d "app/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd app && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install frontend dependencies.${NC}"
        exit 1
    fi
    cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd backend && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies.${NC}"
        exit 1
    fi
    cd ..
fi

# Clean previous builds
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
rm -rf app/build
rm -rf dist
echo -e "${GREEN}✅ Previous builds cleaned.${NC}"

# Build frontend
echo -e "${BLUE}⚛️  Building frontend React app...${NC}"
cd app
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build frontend.${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✅ Frontend build completed.${NC}"

# Run tests before building
echo -e "${BLUE}🧪 Running tests...${NC}"
cd app
npm test -- --coverage --watchAll=false
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed, but continuing with build...${NC}"
fi
cd ..

cd backend
npm test
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Some backend tests failed, but continuing with build...${NC}"
fi
cd ..

# Build Electron app
echo -e "${BLUE}⚡ Building Electron application...${NC}"
npm run electron:dist
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build Electron application.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Electron application built successfully.${NC}"

echo -e "${GREEN}🎉 Production build completed successfully!${NC}"
echo -e "${BLUE}📦 Build artifacts are in the 'dist' directory${NC}"
echo -e "${BLUE}💡 You can test the production build with: npm run start:prod${NC}"