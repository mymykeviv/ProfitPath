#!/bin/bash

echo "Starting development environment..."

# Start backend server in background
cd backend
npx nodemon index.js &
BACKEND_PID=$!

# Start frontend React app in background
cd ../app
npm start &
FRONTEND_PID=$!

# Wait for both to exit (or Ctrl+C)
wait $BACKEND_PID $FRONTEND_PID
