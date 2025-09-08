# School Presence System Deployment Script
# This script deploys the complete school presence system to Kubernetes

param(
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "presence-system",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🔄 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

function Test-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    # Check if kubectl is installed
    try {
        kubectl version --client --short | Out-Null
        Write-Success "kubectl is installed"
    }
    catch {
        Write-Error "kubectl is not installed or not in PATH"
        exit 1
    }
    
    # Check if helm is installed
    try {
        helm version --short | Out-Null
        Write-Success "Helm is installed"
    }
    catch {
        Write-Error "Helm is not installed or not in PATH"
        exit 1
    }
    
    # Check if docker is installed (if not skipping build)
    if (-not $SkipBuild) {
        try {
            docker version --format '{{.Client.Version}}' | Out-Null
            Write-Success "Docker is installed"
        }
        catch {
            Write-Error "Docker is not installed or not running"
            exit 1
        }
    }
    
    # Check if kubectl can connect to cluster
    try {
        kubectl cluster-info --request-timeout=5s | Out-Null
        Write-Success "Connected to Kubernetes cluster"
    }
    catch {
        Write-Error "Cannot connect to Kubernetes cluster"
        exit 1
    }
}

function Build-Images {
    if ($SkipBuild) {
        Write-Warning "Skipping image build as requested"
        return
    }
    
    Write-Step "Building Docker images..."
    
    $images = @(
        @{Name="presence/backend"; Path="./backend"},
        @{Name="presence/kiosk"; Path="./frontend/kiosk"},
        @{Name="presence/manager"; Path="./frontend/manager"},
        @{Name="presence/admin"; Path="./frontend/admin"}
    )
    
    foreach ($image in $images) {
        Write-Step "Building $($image.Name)..."
        if ($DryRun) {
            Write-Warning "DRY RUN: Would build $($image.Name)"
        } else {
            docker build -t "$($image.Name):latest" $image.Path
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to build $($image.Name)"
                exit 1
            }
            Write-Success "Built $($image.Name)"
        }
    }
}

function Create-Namespace {
    Write-Step "Creating namespace '$Namespace'..."
    
    if ($DryRun) {
        Write-Warning "DRY RUN: Would create namespace $Namespace"
        return
    }
    
    $namespaceExists = kubectl get namespace $Namespace 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Warning "Namespace '$Namespace' already exists"
    } else {
        kubectl create namespace $Namespace
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to create namespace '$Namespace'"
            exit 1
        }
        Write-Success "Created namespace '$Namespace'"
    }
}

function Deploy-Helm-Chart {
    Write-Step "Deploying Helm chart..."
    
    $helmArgs = @(
        "upgrade", "--install", "presence-system",
        "./helm/presence-system",
        "--namespace", $Namespace,
        "--set", "image.tag=latest",
        "--set", "backend.env.SECRET_KEY=$(New-Guid)",
        "--timeout", "10m",
        "--wait"
    )
    
    if ($Environment -eq "development") {
        $helmArgs += @("--set", "postgresql.auth.postgresPassword=dev_password")
        $helmArgs += @("--set", "postgresql.auth.password=dev_password")
    }
    
    if ($DryRun) {
        $helmArgs += @("--dry-run")
        Write-Warning "DRY RUN: Would deploy with Helm"
    }
    
    & helm $helmArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Helm deployment failed"
        exit 1
    }
    
    if (-not $DryRun) {
        Write-Success "Helm chart deployed successfully"
    }
}

function Wait-For-Deployment {
    if ($DryRun) {
        Write-Warning "DRY RUN: Would wait for deployment"
        return
    }
    
    Write-Step "Waiting for deployment to be ready..."
    
    $deployments = @(
        "presence-system-backend",
        "presence-system-kiosk",
        "presence-system-manager",
        "presence-system-admin",
        "presence-system-celery-worker",
        "presence-system-celery-beat"
    )
    
    foreach ($deployment in $deployments) {
        Write-Step "Waiting for $deployment..."
        kubectl rollout status deployment/$deployment --namespace=$Namespace --timeout=300s
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Deployment $deployment failed to become ready"
            exit 1
        }
        Write-Success "$deployment is ready"
    }
}

function Show-Deployment-Info {
    if ($DryRun) {
        Write-Warning "DRY RUN: Would show deployment info"
        return
    }
    
    Write-Step "Deployment Information:"
    Write-Host ""
    
    # Show pods
    Write-ColorOutput "Pods:" $Blue
    kubectl get pods --namespace=$Namespace
    Write-Host ""
    
    # Show services
    Write-ColorOutput "Services:" $Blue
    kubectl get services --namespace=$Namespace
    Write-Host ""
    
    # Show ingress
    Write-ColorOutput "Ingress:" $Blue
    kubectl get ingress --namespace=$Namespace
    Write-Host ""
    
    # Show application URLs
    $ingressHost = kubectl get ingress presence-system --namespace=$Namespace -o jsonpath='{.spec.rules[0].host}' 2>$null
    if ($ingressHost) {
        Write-ColorOutput "Application URLs:" $Green
        Write-Host "  Kiosk:   http://$ingressHost/"
        Write-Host "  Manager: http://$ingressHost/manager"
        Write-Host "  Admin:   http://$ingressHost/admin"
        Write-Host "  API:     http://$ingressHost/api"
    } else {
        Write-Warning "Ingress not configured. Use port-forward to access services:"
        Write-Host "  kubectl port-forward svc/presence-system-kiosk 3000:80 --namespace=$Namespace"
        Write-Host "  kubectl port-forward svc/presence-system-manager 3001:80 --namespace=$Namespace"
        Write-Host "  kubectl port-forward svc/presence-system-admin 3002:80 --namespace=$Namespace"
        Write-Host "  kubectl port-forward svc/presence-system-backend 8000:8000 --namespace=$Namespace"
    }
}

function Main {
    Write-ColorOutput "🚀 School Presence System Deployment" $Green
    Write-Host "Environment: $Environment"
    Write-Host "Namespace: $Namespace"
    if ($DryRun) { Write-Host "Mode: DRY RUN" }
    Write-Host ""
    
    try {
        Test-Prerequisites
        Build-Images
        Create-Namespace
        Deploy-Helm-Chart
        Wait-For-Deployment
        Show-Deployment-Info
        
        Write-Host ""
        Write-Success "🎉 Deployment completed successfully!"
        
        if ($Environment -eq "production") {
            Write-Warning "⚠️  Remember to:"
            Write-Host "  1. Update WhatsApp API credentials in the deployment"
            Write-Host "  2. Configure proper ingress with SSL certificates"
            Write-Host "  3. Set up monitoring and alerting"
            Write-Host "  4. Configure database backups"
        }
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Main