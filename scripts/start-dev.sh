#!/bin/bash
# Shell Script to initialize local development servers

echo "🚀 Launching local environment configurations..."

# Run database instances in background
docker-compose -f docker/docker-compose.dev.yml up -d

# Concurrently run frontend and backend node layers
npm run dev:backend & npm run dev:frontend
