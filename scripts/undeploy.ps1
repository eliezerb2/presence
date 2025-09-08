# School Presence System Undeployment Script
# This script removes the school presence system from Kubernetes

param(
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "presence-system",
    
    [Parameter(Mandatory=$false)]
    [switch]$DeleteNamespace = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DeletePVCs = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false,
    
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

function Confirm-Action {
    param([string]$Message)
    
    if ($Force) {
        return $true
    }
    
    Write-Warning $Message
    $response = Read-Host "Are you sure? (y/N)"
    return $response -eq "y" -or $response -eq "Y"
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

function Show-Current-Resources {
    Write-Step "Current resources in namespace '$Namespace':"
    
    $namespaceExists = kubectl get namespace $Namespace 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Namespace '$Namespace' does not exist"
        return
    }
    
    Write-Host ""
    Write-ColorOutput "Helm Releases:" $Blue
    helm list --namespace=$Namespace
    
    Write-Host ""
    Write-ColorOutput "Pods:" $Blue
    kubectl get pods --namespace=$Namespace
    
    Write-Host ""
    Write-ColorOutput "Services:" $Blue
    kubectl get services --namespace=$Namespace
    
    Write-Host ""
    Write-ColorOutput "PersistentVolumeClaims:" $Blue
    kubectl get pvc --namespace=$Namespace
    
    Write-Host ""
}

function Remove-Helm-Release {
    Write-Step "Removing Helm release..."
    
    $releaseExists = helm list --namespace=$Namespace --short | Select-String "presence-system"
    if (-not $releaseExists) {
        Write-Warning "Helm release 'presence-system' not found in namespace '$Namespace'"
        return
    }
    
    if (-not (Confirm-Action "This will remove the Helm release 'presence-system' from namespace '$Namespace'")) {
        Write-Warning "Helm release removal cancelled"
        return
    }
    
    if ($DryRun) {
        Write-Warning "DRY RUN: Would remove Helm release 'presence-system'"
        return
    }
    
    helm uninstall presence-system --namespace=$Namespace
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to remove Helm release"
        exit 1
    }
    
    Write-Success "Helm release removed"
}

function Remove-PVCs {
    if (-not $DeletePVCs) {
        Write-Warning "Skipping PVC deletion (use -DeletePVCs to remove persistent data)"
        return
    }
    
    Write-Step "Removing PersistentVolumeClaims..."
    
    $pvcs = kubectl get pvc --namespace=$Namespace --no-headers -o custom-columns=":metadata.name" 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $pvcs) {
        Write-Warning "No PVCs found in namespace '$Namespace'"
        return
    }
    
    if (-not (Confirm-Action "This will PERMANENTLY DELETE all persistent data (databases, etc.) in namespace '$Namespace'")) {
        Write-Warning "PVC deletion cancelled"
        return
    }
    
    if ($DryRun) {
        Write-Warning "DRY RUN: Would delete PVCs: $($pvcs -join ', ')"
        return
    }
    
    foreach ($pvc in $pvcs) {
        if ($pvc.Trim()) {
            kubectl delete pvc $pvc.Trim() --namespace=$Namespace
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Deleted PVC: $($pvc.Trim())"
            } else {
                Write-Warning "Failed to delete PVC: $($pvc.Trim())"
            }
        }
    }
}

function Remove-Namespace {
    if (-not $DeleteNamespace) {
        Write-Warning "Keeping namespace '$Namespace' (use -DeleteNamespace to remove it)"
        return
    }
    
    Write-Step "Removing namespace..."
    
    $namespaceExists = kubectl get namespace $Namespace 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Namespace '$Namespace' does not exist"
        return
    }
    
    if (-not (Confirm-Action "This will delete the entire namespace '$Namespace' and all its resources")) {
        Write-Warning "Namespace deletion cancelled"
        return
    }
    
    if ($DryRun) {
        Write-Warning "DRY RUN: Would delete namespace '$Namespace'"
        return
    }
    
    kubectl delete namespace $Namespace
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to delete namespace '$Namespace'"
        exit 1
    }
    
    Write-Success "Namespace '$Namespace' deleted"
}

function Wait-For-Cleanup {
    if ($DryRun) {
        Write-Warning "DRY RUN: Would wait for cleanup"
        return
    }
    
    Write-Step "Waiting for resources to be cleaned up..."
    
    # Wait for pods to terminate
    $timeout = 60
    $elapsed = 0
    
    while ($elapsed -lt $timeout) {
        $pods = kubectl get pods --namespace=$Namespace --no-headers 2>$null
        if ($LASTEXITCODE -ne 0 -or -not $pods) {
            Write-Success "All pods terminated"
            break
        }
        
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    
    if ($elapsed -ge $timeout) {
        Write-Warning "Timeout waiting for pods to terminate"
    }
    
    Write-Host ""
}

function Show-Cleanup-Summary {
    Write-Step "Cleanup Summary:"
    Write-Host ""
    
    if ($DryRun) {
        Write-Warning "This was a DRY RUN - no actual changes were made"
        return
    }
    
    $namespaceExists = kubectl get namespace $Namespace 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "Remaining resources in namespace '$Namespace':" $Blue
        kubectl get all --namespace=$Namespace
        
        $pvcs = kubectl get pvc --namespace=$Namespace --no-headers 2>$null
        if ($LASTEXITCODE -eq 0 -and $pvcs) {
            Write-Host ""
            Write-ColorOutput "Remaining PVCs (persistent data):" $Yellow
            kubectl get pvc --namespace=$Namespace
            Write-Warning "Use -DeletePVCs flag to remove persistent data"
        }
    } else {
        Write-Success "Namespace '$Namespace' has been completely removed"
    }
}

function Main {
    Write-ColorOutput "🗑️  School Presence System Undeployment" $Red
    Write-Host "Namespace: $Namespace"
    Write-Host "Delete Namespace: $DeleteNamespace"
    Write-Host "Delete PVCs: $DeletePVCs"
    if ($DryRun) { Write-Host "Mode: DRY RUN" }
    Write-Host ""
    
    try {
        Test-Prerequisites
        Show-Current-Resources
        Remove-Helm-Release
        Wait-For-Cleanup
        Remove-PVCs
        Remove-Namespace
        Show-Cleanup-Summary
        
        Write-Host ""
        if ($DryRun) {
            Write-Success "🔍 Dry run completed - no changes were made"
        } else {
            Write-Success "🧹 Undeployment completed"
        }
        
        if (-not $DeletePVCs -and -not $DryRun) {
            Write-Warning "⚠️  Database and other persistent data were preserved"
            Write-Host "   Use -DeletePVCs flag to remove all data permanently"
        }
    }
    catch {
        Write-Error "Undeployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Main