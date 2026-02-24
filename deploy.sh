#!/bin/bash
echo "🚀 Starting Full Deployment Process..."

# 1. Pull latest changes
git pull origin main

# 2. Build and restart containers in detached mode
docker-compose up -d --build

# 3. Clean up unused images to save disk space
docker image prune -f

echo "✅ System is up and running!"
docker-compose ps