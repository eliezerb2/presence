Write-Host "Deploying to Kubernetes..." -ForegroundColor Green

Write-Host "Uninstalling existing deployments from all namespaces..." -ForegroundColor Yellow
helm uninstall presence -n presence --wait 2>$null
helm uninstall presence -n default --wait 2>$null

Write-Host "Deleting namespace to ensure complete cleanup..." -ForegroundColor Yellow
kubectl delete namespace presence --ignore-not-found

Write-Host "Waiting for namespace to be deleted..." -ForegroundColor Yellow
do {
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 3
    $nsCheck = kubectl get ns presence 2>$null
    $nsExists = $LASTEXITCODE -eq 0
} while ($nsExists)

Write-Host ""
Write-Host "Namespace deleted." -ForegroundColor Green

Write-Host "Additional cleanup wait..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Verifying all resources are cleaned up..." -ForegroundColor Yellow
kubectl get all --all-namespaces | Select-String "presence" 2>$null
if ($?) {
    Write-Host "Warning: Some presence resources may still exist" -ForegroundColor Red
}

Write-Host "Final pause before install..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Installing Helm chart..." -ForegroundColor Green
helm install presence ./helm/presence --create-namespace -n presence

Write-Host "Checking deployment status..." -ForegroundColor Yellow
kubectl get pods -n presence

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Access the application at: http://localhost" -ForegroundColor Cyan