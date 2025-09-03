@echo off
echo Deploying to Kubernetes...

echo Uninstalling existing deployment...
helm uninstall presence -n presence 2>nul

echo Waiting for cleanup...
timeout /t 10 /nobreak >nul

echo Installing Helm chart...
helm install presence ./helm/presence --create-namespace

echo Checking deployment status...
kubectl get pods -n presence

echo Deployment complete!
echo Access the application at: http://localhost