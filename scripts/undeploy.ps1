# This script undeploys the application from Kubernetes.

$releaseName = "presence"
$namespace = "presence"

# Uninstall the chart
helm uninstall $releaseName --namespace $namespace

# Delete remaining resources that helm might not remove (like PVCs)
Write-Host "Deleting remaining resources..."
kubectl delete pvc -l "app.kubernetes.io/instance=$releaseName" -n $namespace --ignore-not-found=true
kubectl delete all -l "app.kubernetes.io/instance=$releaseName" -n $namespace --ignore-not-found=true

# Verify that all resources are deleted
Write-Host "Verifying that all resources are deleted..."
$resources = kubectl get all,ingress,pvc,secrets,configmaps -n $namespace -l "app.kubernetes.io/instance=$releaseName" -o name
if ($resources) {
    Write-Host "The following resources still exist:"
    $resources
} else {
    Write-Host "All resources have been deleted."
}
