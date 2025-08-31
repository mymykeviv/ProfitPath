#!/bin/bash

echo "Stopping development environment..."

# Kill backend and frontend processes by name
pkill -f nodemon
pkill -f react-scripts

echo "Development environment stopped."
