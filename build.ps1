Write-Host "Building Docker images..."

Write-Host "Building backend..."
docker build -t presence-backend:latest ./backend

Write-Host "Building frontend..."
docker build -t presence-frontend:latest ./frontend

Write-Host "Build complete!"