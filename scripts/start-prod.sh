#!/bin/bash

echo "Starting production application..."

# Start Electron app
npm run electron:prod &

ELECTRON_PID=$!

wait $ELECTRON_PID
