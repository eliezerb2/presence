Write-Host "Undeploying from Kubernetes..." -ForegroundColor Yellow

Write-Host "Uninstalling Helm chart..." -ForegroundColor Yellow
helm uninstall presence -n presence --wait

Write-Host "Deleting namespace..." -ForegroundColor Yellow
kubectl delete namespace presence --ignore-not-found

Write-Host "Cleaning up test resources..." -ForegroundColor Yellow
kubectl delete namespace presence-test --ignore-not-found

Write-Host "Waiting for complete cleanup..." -ForegroundColor Yellow
do {
    $presenceResources = kubectl get all --all-namespaces | Select-String "presence" 2>$null
    if ($presenceResources) { Start-Sleep -Seconds 3 }
} while ($presenceResources)

Write-Host "Verifying no presence resources exist..." -ForegroundColor Yellow
$remainingResources = kubectl get all --all-namespaces | Select-String "presence" 2>$null
if ($remainingResources) {
    Write-Host "Warning: Some presence resources still exist:" -ForegroundColor Red
    $remainingResources
    exit 1
} else {
    Write-Host "Undeploy complete! No presence resources found." -ForegroundColor Green
}