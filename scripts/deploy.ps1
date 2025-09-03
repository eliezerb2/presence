param(
    [string]$ReleaseName = "presence-app",
    [string]$Namespace = "presence-namespace"
)

function Test-CommandExists {
    param(
        [string]$Command
    )
    (Get-Command $Command -ErrorAction SilentlyContinue) -ne $null
}

try {
    Write-Host "Starting deployment of Helm release '$ReleaseName' in namespace '$Namespace'."

    # Check if Docker, kubectl and helm are installed
    if (-not (Test-CommandExists "docker")) {
        throw "Docker is not installed or not in PATH. Please install it."
    }
    if (-not (Test-CommandExists "kubectl")) {
        throw "kubectl is not installed or not in PATH. Please install it."
    }
    if (-not (Test-CommandExists "helm")) {
        throw "Helm is not installed or not in PATH. Please install it."
    }

    # 1. Build Docker images
    Write-Host "Building backend Docker image..."
    docker build -t presence-backend:latest -f backend/Dockerfile .
    if ($LASTEXITCODE -ne 0) {
        throw "Backend Docker image build failed."
    }
    Write-Host "Backend Docker image built successfully."

    Write-Host "Building frontend Docker image..."
    docker build -t presence-frontend:latest -f frontend/Dockerfile .
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend Docker image build failed."
    }
    Write-Host "Frontend Docker image built successfully."

    # 2. Add Bitnami Helm repository
    Write-Host "Adding Bitnami Helm repository..."
    helm repo add bitnami https://charts.bitnami.com/bitnami
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add Bitnami Helm repository."
    }
    helm repo update
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to update Helm repositories."
    }
    Write-Host "Bitnami Helm repository added and updated."

    # 3. Create Kubernetes namespace if it doesn't exist
    Write-Host "Creating Kubernetes namespace '$Namespace' if it doesn't exist..."
    $namespaceExists = (kubectl get namespace $Namespace -o jsonpath='{.metadata.name}' 2>$null) -eq $Namespace
    if ($namespaceExists) {
        Write-Host "Namespace '$Namespace' already exists. Deleting it for a clean deployment..."
        kubectl delete namespace $Namespace --wait=false
        # Wait for namespace to be deleted
        $i = 0
        while ($i -lt 60 -and (kubectl get namespace $Namespace 2>$null)) {
            Write-Host "Waiting for namespace '$Namespace' to terminate..."
            Start-Sleep -Seconds 5
            $i++
        }
        if (kubectl get namespace $Namespace 2>$null) {
            throw "Namespace '$Namespace' did not terminate in time."
        }
    }
    kubectl create namespace $Namespace
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create namespace '$Namespace'."
    }
    Write-Host "Namespace '$Namespace' created."

    # 4. Install the Helm chart
    Write-Host "Building Helm dependencies..."
    helm dependency build ./helm
    if ($LASTEXITCODE -ne 0) {
        throw "Helm dependency build failed."
    }
    Write-Host "Helm dependencies built successfully."

    # Check if the Helm release exists and delete it if it does
    Write-Host "Checking for existing Helm release '$ReleaseName'..."
    $releaseStatus = helm status $ReleaseName -n $Namespace 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Existing Helm release '$ReleaseName' found. Deleting it..."
        helm uninstall $ReleaseName -n $Namespace --wait
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to uninstall existing Helm release '$ReleaseName'."
        }
        Write-Host "Existing Helm release '$ReleaseName' uninstalled successfully."
    } else {
        Write-Host "No existing Helm release '$ReleaseName' found."
    }

    Write-Host "Installing/Upgrading Helm release '$ReleaseName'..."
    helm upgrade --install $ReleaseName ./helm -n $Namespace --wait --timeout 10m
    if ($LASTEXITCODE -ne 0) {
        throw "Helm install/upgrade failed with exit code $LASTEXITCODE."
    }
    Write-Host "Helm release '$ReleaseName' installed/upgraded successfully."

    Write-Host "Deployment process completed successfully." -ForegroundColor Green

} catch {
    Write-Error "An error occurred during deployment: $($_.Exception.Message)"
    exit 1
}
