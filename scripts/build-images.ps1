# This script builds the Docker images for the application.

Write-Host "Building api image..."
docker build --no-cache -t presence-api:latest -f c:\Users\eliezerb\git\presence\src\api\Dockerfile c:\Users\eliezerb\git\presence\src\api

Write-Host "Building kiosk image..."
docker build -t presence-kiosk:latest -f c:\Users\eliezerb\git\presence\src\kiosk\Dockerfile c:\Users\eliezerb\git\presence\src\kiosk

Write-Host "Building manager image..."
docker build -t presence-manager:latest -f c:\Users\eliezerb\git\presence\src\manager\Dockerfile c:\Users\eliezerb\git\presence\src\manager

Write-Host "Images built successfully."
