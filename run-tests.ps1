Write-Host "Running all tests..."

Write-Host "Building images..."
& .\build.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!"; exit 1 }

Write-Host "Deploying to test environment..."
& .\deploy.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "Deployment failed!"; exit 1 }

Write-Host "Waiting for services to be ready..."
kubectl wait --for=condition=ready pod --all -n presence --timeout=300s
if ($LASTEXITCODE -ne 0) { Write-Host "Services not ready!"; exit 1 }

Write-Host "Running unit tests..."
$backendPod = kubectl get pod -l app=backend -n presence -o jsonpath='{.items[0].metadata.name}'
kubectl exec -n presence $backendPod -- npm test
if ($LASTEXITCODE -ne 0) { Write-Host "Unit tests failed!"; exit 1 }

Write-Host "Running integration tests..."
kubectl exec -n presence $backendPod -- npm run test -- --testPathPattern=integration
if ($LASTEXITCODE -ne 0) { Write-Host "Integration tests failed!"; exit 1 }

Write-Host "Running end-to-end tests..."
kubectl create namespace presence-test --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f e2e-tests/test-runner.yaml -n presence-test

Write-Host "Waiting for E2E tests to complete..."
kubectl wait --for=condition=complete job/e2e-test -n presence-test --timeout=300s
if ($LASTEXITCODE -ne 0) { Write-Host "E2E tests failed!"; exit 1 }

Write-Host "Getting test results..."
kubectl logs -l app=e2e-test -n presence-test
$e2eSuccess = kubectl get job e2e-test -n presence-test -o jsonpath='{.status.succeeded}'
if ($e2eSuccess -ne "1") { Write-Host "E2E tests failed!"; exit 1 }

Write-Host "Cleaning up test environment..."
kubectl delete namespace presence-test --ignore-not-found=true

Write-Host "All tests completed successfully! Application is ready."