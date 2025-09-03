# This script deploys the application to Kubernetes using Helm.

$chartPath = "c:\Users\eliezerb\git\presence\helm\presence"
$releaseName = "presence"
$namespace = "presence"

# Uninstall existing release
$existingRelease = helm list -n $namespace -q | Where-Object { $_ -eq $releaseName }
if ($existingRelease) {
    Write-Host "Uninstalling existing release '$releaseName'..."
    # The undeploy script is in the same directory as this script.
    $PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
    & "$PSScriptRoot\undeploy.ps1"
}

# Create namespace if it doesn't exist
if (-not (kubectl get namespace $namespace -o name)) {
    Write-Host "Creating namespace $namespace..."
    kubectl create namespace $namespace
}


# Add bitnami repo
Write-Host "Adding bitnami repo..."
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Update chart dependencies
Write-Host "Updating helm dependencies..."
helm dependency update $chartPath

# Install the chart
Write-Host "Installing helm chart..."
helm install $releaseName $chartPath --namespace $namespace --debug
