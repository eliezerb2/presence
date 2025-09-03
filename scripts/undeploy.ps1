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

function Check-KubernetesResources {
    param(
        [string]$Namespace, 
        [string]$ReleaseName
    )
    Write-Host "Checking for remaining Kubernetes resources in namespace '$Namespace'..."
    $resources = @(
        "deployments",
        "services",
        "pods",
        "ingresses",
        "configmaps",
        "secrets",
        "persistentvolumeclaims"
    )
    $foundResources = @()

    foreach ($resourceType in $resources) {
        $output = kubectl get $resourceType -n $Namespace -l "app.kubernetes.io/instance=$ReleaseName" -o json 2>$null
        if ($LASTEXITCODE -eq 0 -and $output | ConvertFrom-Json | Select-Object -ExpandProperty items | Measure-Object).Count -gt 0) {
            $foundResources += "$resourceType"
        }
    }

    if ($foundResources.Count -eq 0) {
        Write-Host "No application resources found in namespace '$Namespace'. Undeployment successful." -ForegroundColor Green
        return $true
    } else {
        Write-Warning "Found remaining application resources in namespace '$Namespace': $($foundResources -join ", ")."
        Write-Host "Please check manually: kubectl get all -n $Namespace -l app.kubernetes.io/instance=$ReleaseName" -ForegroundColor Yellow
        return $false
    }
}

try {
    Write-Host "Starting undeployment of Helm release '$ReleaseName' in namespace '$Namespace'."

    # Check if kubectl and helm are installed
    if (-not (Test-CommandExists "kubectl")) {
        throw "kubectl is not installed or not in PATH. Please install it."
    }
    if (-not (Test-CommandExists "helm")) {
        throw "Helm is not installed or not in PATH. Please install it."
    }

    # Check if the namespace exists
    $namespaceExists = (kubectl get namespace $Namespace -o jsonpath='{.metadata.name}' 2>$null) -eq $Namespace
    if (-not $namespaceExists) {
        Write-Host "Namespace '$Namespace' does not exist. Assuming no resources to undeploy." -ForegroundColor Yellow
        exit 0
    }

    # Check if the Helm release exists
    $releaseExists = (helm status $ReleaseName -n $Namespace 2>$null) -ne $null
    if (-not $releaseExists) {
        Write-Host "Helm release '$ReleaseName' not found in namespace '$Namespace'. Assuming no deployment to undeploy." -ForegroundColor Yellow
        exit 0
    }

    # Uninstall the Helm chart
    Write-Host "Uninstalling Helm release '$ReleaseName'..."
    helm uninstall $ReleaseName -n $Namespace -wait
    if ($LASTEXITCODE -ne 0) {
        throw "Helm uninstall failed with exit code $LASTEXITCODE."
    }
    Write-Host "Helm release '$ReleaseName' uninstalled successfully."

    # Verify resource deletion
    $maxRetries = 10
    $retryIntervalSeconds = 5
    $resourcesDeleted = $false

    for ($i = 0; $i -lt $maxRetries; $i++) {
        Write-Host "Attempt $($i + 1)/$maxRetries: Verifying resource deletion..."
        if (Check-KubernetesResources -Namespace $Namespace -ReleaseName $ReleaseName) {
            $resourcesDeleted = $true
            break
        }
        Start-Sleep -Seconds $retryIntervalSeconds
    }

    if (-not $resourcesDeleted) {
        throw "Failed to verify complete resource deletion after multiple retries."
    }

    Write-Host "Undeployment process completed successfully." -ForegroundColor Green

} catch {
    Write-Error "An error occurred during undeployment: $($_.Exception.Message)"
    exit 1
}
