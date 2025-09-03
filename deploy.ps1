param(
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"

try {
    Write-Host "Starting deployment of Attendance System..." -ForegroundColor Green
    
    # Build Docker images if not skipped
    if (-not $SkipBuild) {
        Write-Host "Building Docker images..." -ForegroundColor Yellow
        
        # Build backend
        Write-Host "Building backend image..." -ForegroundColor Cyan
        docker build -t attendance-backend:latest ./backend
        if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
        
        # Build frontend
        Write-Host "Building frontend image..." -ForegroundColor Cyan
        docker build -t attendance-frontend:latest ./frontend
        if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
        
        Write-Host "Docker images built successfully" -ForegroundColor Green
    }
    
    # Uninstall existing deployment
    Write-Host "Uninstalling existing deployment..." -ForegroundColor Yellow
    helm uninstall attendance-system -n attendance-system 2>$null
    
    # Wait for cleanup
    Write-Host "Waiting for cleanup..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verify cleanup
    $pods = kubectl get pods -n attendance-system --no-headers 2>$null
    if ($pods) {
        Write-Host "Waiting for pods to terminate..." -ForegroundColor Yellow
        do {
            Start-Sleep -Seconds 5
            $pods = kubectl get pods -n attendance-system --no-headers 2>$null
        } while ($pods)
    }
    
    # Install Helm chart
    Write-Host "Installing Helm chart..." -ForegroundColor Yellow
    helm install attendance-system ./helm/attendance-system
    if ($LASTEXITCODE -ne 0) { throw "Helm install failed" }
    
    # Wait for deployment
    Write-Host "Waiting for deployment to be ready..." -ForegroundColor Yellow
    kubectl wait --for=condition=available --timeout=300s deployment/attendance-system-postgresql -n attendance-system
    kubectl wait --for=condition=available --timeout=300s deployment/backend -n attendance-system
    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n attendance-system
    
    # Check deployment status
    Write-Host "Checking deployment status..." -ForegroundColor Yellow
    kubectl get pods -n attendance-system
    kubectl get services -n attendance-system
    
    # Check logs for errors
    Write-Host "Checking logs for errors..." -ForegroundColor Yellow
    $backendPod = kubectl get pods -n attendance-system -l app=backend -o jsonpath="{.items[0].metadata.name}"
    if ($backendPod) {
        $logs = kubectl logs $backendPod -n attendance-system --tail=20
        if ($logs -match "ERROR|Exception|Failed") {
            Write-Host "Backend logs contain errors:" -ForegroundColor Red
            Write-Host $logs -ForegroundColor Red
        } else {
            Write-Host "Backend logs look good" -ForegroundColor Green
        }
    }
    
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "Frontend available at: http://localhost:30080" -ForegroundColor Cyan
    Write-Host "Backend API available at: http://localhost:30081" -ForegroundColor Cyan
    
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Show logs for debugging
    Write-Host "Showing recent logs for debugging..." -ForegroundColor Yellow
    kubectl get events -n attendance-system --sort-by='.lastTimestamp' | Select-Object -Last 10
    
    exit 1
}