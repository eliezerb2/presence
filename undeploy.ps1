$ErrorActionPreference = "Stop"

try {
    Write-Host "Starting undeployment of Attendance System..." -ForegroundColor Yellow
    
    # Uninstall Helm chart
    Write-Host "Uninstalling Helm chart..." -ForegroundColor Cyan
    helm uninstall attendance-system -n attendance-system
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Helm uninstall failed or chart not found" -ForegroundColor Yellow
    }
    
    # Wait for pods to terminate
    Write-Host "Waiting for pods to terminate..." -ForegroundColor Cyan
    $timeout = 60
    $elapsed = 0
    do {
        Start-Sleep -Seconds 5
        $elapsed += 5
        $pods = kubectl get pods -n attendance-system --no-headers 2>$null
        if (-not $pods) { break }
        Write-Host "Still waiting for pods to terminate... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
    } while ($elapsed -lt $timeout)
    
    # Force delete remaining resources if any
    $remainingPods = kubectl get pods -n attendance-system --no-headers 2>$null
    if ($remainingPods) {
        Write-Host "Force deleting remaining pods..." -ForegroundColor Yellow
        kubectl delete pods --all -n attendance-system --force --grace-period=0 2>$null
    }
    
    # Delete PVCs
    Write-Host "Deleting persistent volume claims..." -ForegroundColor Cyan
    kubectl delete pvc --all -n attendance-system 2>$null
    
    # Delete namespace
    Write-Host "Deleting namespace..." -ForegroundColor Cyan
    kubectl delete namespace attendance-system 2>$null
    
    # Verify cleanup
    Write-Host "Verifying cleanup..." -ForegroundColor Cyan
    $namespace = kubectl get namespace attendance-system --no-headers 2>$null
    if ($namespace) {
        Write-Host "Namespace still exists, waiting for deletion..." -ForegroundColor Yellow
        $timeout = 60
        $elapsed = 0
        do {
            Start-Sleep -Seconds 5
            $elapsed += 5
            $namespace = kubectl get namespace attendance-system --no-headers 2>$null
            if (-not $namespace) { break }
            Write-Host "Still waiting for namespace deletion... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
        } while ($elapsed -lt $timeout)
    }
    
    # Final verification
    $finalCheck = kubectl get all -n attendance-system 2>$null
    if ($finalCheck) {
        Write-Host "Warning: Some resources may still exist:" -ForegroundColor Yellow
        Write-Host $finalCheck -ForegroundColor Yellow
    } else {
        Write-Host "All application resources have been successfully removed!" -ForegroundColor Green
    }
    
    # Check for any remaining Docker containers
    Write-Host "Checking for any remaining containers..." -ForegroundColor Cyan
    $containers = docker ps -a --filter "name=attendance" --format "table {{.Names}}\t{{.Status}}"
    if ($containers -and $containers.Count -gt 1) {
        Write-Host "Found containers:" -ForegroundColor Yellow
        Write-Host $containers -ForegroundColor Yellow
    } else {
        Write-Host "No related containers found" -ForegroundColor Green
    }
    
    Write-Host "Undeployment completed!" -ForegroundColor Green
    
} catch {
    Write-Host "Undeployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to manually clean up remaining resources" -ForegroundColor Yellow
    exit 1
}