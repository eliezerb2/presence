# School Attendance System Deployment Script
# This script deploys the application to Rancher Desktop Kubernetes

param(
    [string]$Action = "deploy",
    [string]$Namespace = "attendance",
    [switch]$SkipTests = $false,
    [switch]$Force = $false
)

Write-Host "School Attendance System Deployment Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if kubectl is available
try {
    $kubectlVersion = kubectl version --client --short
    Write-Host "✓ kubectl found: $kubectlVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ kubectl not found. Please install kubectl and ensure it's in your PATH." -ForegroundColor Red
    exit 1
}

# Check if helm is available
try {
    $helmVersion = helm version --short
    Write-Host "✓ Helm found: $helmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Helm not found. Please install Helm and ensure it's in your PATH." -ForegroundColor Red
    exit 1
}

# Check if Docker is available
try {
    $dockerVersion = docker version --format "{{.Server.Version}}"
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop and ensure it's running." -ForegroundColor Red
    exit 1
}

# Check Kubernetes cluster status
Write-Host "`nChecking Kubernetes cluster status..." -ForegroundColor Yellow
try {
    $clusterInfo = kubectl cluster-info
    Write-Host "✓ Kubernetes cluster is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Cannot access Kubernetes cluster. Please ensure Rancher Desktop is running." -ForegroundColor Red
    exit 1
}

# Check if namespace exists
$namespaceExists = kubectl get namespace $Namespace 2>$null
if ($namespaceExists) {
    Write-Host "✓ Namespace '$Namespace' already exists" -ForegroundColor Green
} else {
    Write-Host "Namespace '$Namespace' does not exist" -ForegroundColor Yellow
}

if ($Action -eq "deploy" -or $Action -eq "redeploy") {
    
    if ($Action -eq "redeploy" -or $Force) {
        Write-Host "`nUninstalling existing deployment..." -ForegroundColor Yellow
        try {
            helm uninstall attendance -n $Namespace 2>$null
            Write-Host "✓ Existing deployment uninstalled" -ForegroundColor Green
        } catch {
            Write-Host "No existing deployment to uninstall" -ForegroundColor Yellow
        }
        
        # Wait for resources to be cleaned up
        Write-Host "Waiting for resources to be cleaned up..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Verify cleanup
        $remainingResources = kubectl get all -n $Namespace 2>$null
        if ($remainingResources) {
            Write-Host "Warning: Some resources still exist in namespace" -ForegroundColor Yellow
        }
    }
    
    # Build Docker images
    Write-Host "`nBuilding Docker images..." -ForegroundColor Yellow
    
    Write-Host "Building backend image..." -ForegroundColor Cyan
    docker build -t attendance-backend:latest ./backend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to build backend image" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Backend image built successfully" -ForegroundColor Green
    
    Write-Host "Building frontend image..." -ForegroundColor Cyan
    docker build -t attendance-frontend:latest ./frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to build frontend image" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Frontend image built successfully" -ForegroundColor Green
    
    # Deploy with Helm
    Write-Host "`nDeploying with Helm..." -ForegroundColor Yellow
    try {
        helm install attendance ./helm/attendance -n $Namespace --create-namespace
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Helm deployment successful" -ForegroundColor Green
        } else {
            Write-Host "✗ Helm deployment failed" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "✗ Helm deployment failed: $_" -ForegroundColor Red
        exit 1
    }
    
    # Wait for deployment to be ready
    Write-Host "`nWaiting for deployment to be ready..." -ForegroundColor Yellow
    $timeout = 120  # 2 minutes
    $elapsed = 0
    $interval = 5
    
    while ($elapsed -lt $timeout) {
        $pods = kubectl get pods -n $Namespace -o json | ConvertFrom-Json
        $readyPods = ($pods.items | Where-Object { 
            $_.status.phase -eq "Running" -and 
            $_.status.containerStatuses -and 
            ($_.status.containerStatuses | Where-Object { $_.ready -eq $true }).Count -eq $_.status.containerStatuses.Count
        }).Count
        $totalPods = $pods.items.Count
        
        # Check for error states and fail fast
        $errorPods = 0
        foreach ($pod in $pods.items) {
            if ($pod.status.phase -eq "Failed" -or $pod.status.phase -eq "Error") {
                $errorPods++
            } elseif ($pod.status.containerStatuses) {
                foreach ($container in $pod.status.containerStatuses) {
                    if ($container.state.waiting -and $container.state.waiting.reason -eq "CrashLoopBackOff") {
                        $errorPods++
                    }
                }
            }
        }
        
        if ($errorPods -gt 0) {
            Write-Host "✗ Found $errorPods pods in error state. Deployment failed." -ForegroundColor Red
            kubectl get pods -n $Namespace
            kubectl describe pods -n $Namespace
            exit 1
        }
        
        if ($readyPods -eq $totalPods -and $totalPods -gt 0) {
            Write-Host "✓ All pods are running and ready" -ForegroundColor Green
            break
        }
        
        Write-Host "Waiting... $readyPods/$totalPods pods ready" -ForegroundColor Yellow
        if ($totalPods -gt 0) {
            Write-Host "Pod statuses:" -ForegroundColor Cyan
            foreach ($pod in $pods.items) {
                $containerStatus = if ($pod.status.containerStatuses) { 
                    ($pod.status.containerStatuses | Where-Object { $_.ready -eq $true }).Count 
                } else { 0 }
                $totalContainers = if ($pod.status.containerStatuses) { $pod.status.containerStatuses.Count } else { 0 }
                Write-Host "  $($pod.metadata.name): Phase=$($pod.status.phase), Containers=$containerStatus/$totalContainers ready" -ForegroundColor Cyan
            }
        }
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }
    
    if ($elapsed -ge $timeout) {
        Write-Host "✗ Deployment timeout. Some pods may not be ready." -ForegroundColor Red
    }
    
    # Show deployment status
    Write-Host "`nDeployment Status:" -ForegroundColor Green
    kubectl get all -n $Namespace
    
    # Show service endpoints
    Write-Host "`nService Endpoints:" -ForegroundColor Green
    kubectl get svc -n $Namespace
    
    Write-Host "`n✓ Deployment completed!" -ForegroundColor Green
    Write-Host "To access the application:" -ForegroundColor Cyan
    Write-Host "  Frontend: kubectl port-forward -n $Namespace svc/attendance-frontend 3000:80" -ForegroundColor White
    Write-Host "  Backend:  kubectl port-forward -n $Namespace svc/attendance-backend 8000:80" -ForegroundColor White
    Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
    
} elseif ($Action -eq "uninstall") {
    
    Write-Host "`nUninstalling deployment..." -ForegroundColor Yellow
    try {
        helm uninstall attendance -n $Namespace
        Write-Host "✓ Deployment uninstalled successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to uninstall deployment: $_" -ForegroundColor Red
        exit 1
    }
    
    # Optionally delete namespace
    $deleteNamespace = Read-Host "Do you want to delete the namespace '$Namespace'? (y/N)"
    if ($deleteNamespace -eq "y" -or $deleteNamespace -eq "Y") {
        kubectl delete namespace $Namespace
        Write-Host "✓ Namespace deleted" -ForegroundColor Green
    }
    
} elseif ($Action -eq "status") {
    
    Write-Host "`nDeployment Status:" -ForegroundColor Green
    kubectl get all -n $Namespace
    
    Write-Host "`nPod Details:" -ForegroundColor Green
    kubectl get pods -n $Namespace -o wide
    
    Write-Host "`nService Details:" -ForegroundColor Green
    kubectl get svc -n $Namespace -o wide
    
    Write-Host "`nHelm Release Status:" -ForegroundColor Green
    helm status attendance -n $Namespace
    
} elseif ($Action -eq "logs") {
    
    Write-Host "`nBackend Logs:" -ForegroundColor Green
    kubectl logs -n $Namespace -l app.kubernetes.io/component=backend --tail=50
    
    Write-Host "`nFrontend Logs:" -ForegroundColor Green
    kubectl logs -n $Namespace -l app.kubernetes.io/component=frontend --tail=50
    
} elseif ($Action -eq "test") {
    
    if ($SkipTests) {
        Write-Host "Skipping tests as requested" -ForegroundColor Yellow
    } else {
        Write-Host "`nRunning tests..." -ForegroundColor Yellow
        
        # Run backend tests
        Write-Host "Running backend tests..." -ForegroundColor Cyan
        try {
            kubectl exec -n $Namespace deployment/attendance-backend -- python -m pytest /app/tests/ -v
        } catch {
            Write-Host "✗ Backend tests failed: $_" -ForegroundColor Red
        }
        
        # Run frontend tests
        Write-Host "`nRunning frontend tests..." -ForegroundColor Cyan
        try {
            kubectl exec -n $Namespace deployment/attendance-frontend -- npm test -- --watchAll=false
        } catch {
            Write-Host "✗ Frontend tests failed: $_" -ForegroundColor Red
        }
    }
    
} else {
    
    Write-Host "Usage: .\deploy.ps1 [Action] [Options]" -ForegroundColor Yellow
    Write-Host "`nActions:" -ForegroundColor Cyan
    Write-Host "  deploy     - Deploy the application (default)" -ForegroundColor White
    Write-Host "  redeploy   - Uninstall and redeploy the application" -ForegroundColor White
    Write-Host "  uninstall  - Uninstall the application" -ForegroundColor White
    Write-Host "  status     - Show deployment status" -ForegroundColor White
    Write-Host "  logs       - Show application logs" -ForegroundColor White
    Write-Host "  test       - Run tests" -ForegroundColor White
    Write-Host "`nOptions:" -ForegroundColor Cyan
    Write-Host "  -Namespace  - Kubernetes namespace (default: attendance)" -ForegroundColor White
    Write-Host "  -SkipTests  - Skip running tests" -ForegroundColor White
    Write-Host "  -Force      - Force redeployment without confirmation" -ForegroundColor White
    Write-Host "`nExamples:" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1" -ForegroundColor White
    Write-Host "  .\deploy.ps1 redeploy" -ForegroundColor White
    Write-Host "  .\deploy.ps1 status" -ForegroundColor White
    Write-Host "  .\deploy.ps1 test" -ForegroundColor White
}
