#!/bin/bash
# Shell Script to launch production orchestration layers

echo "🚀 Deploying stack containers..."

docker-compose -f docker/docker-compose.prod.yml up --build -d

echo "🎉 Autopilot deployment system stands live."
