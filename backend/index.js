#!/usr/bin/env node

/**
 * ProfitPath Backend Server Entry Point
 * 
 * This file serves as the main entry point for the ProfitPath backend server.
 * It imports and starts the Express server with all necessary configurations.
 */

const { startServer } = require('./server');

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start ProfitPath backend server:', error);
  process.exit(1);
});