@echo off
echo Building Docker images...

echo Building backend...
docker build -t presence-backend:latest ./backend

echo Building frontend...
docker build -t presence-frontend:latest ./frontend

echo Build complete!