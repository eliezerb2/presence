# School Presence System Monitoring Script
# This script monitors the health and status of the school presence system

param(
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "presence-system",
    
    [Parameter(Mandatory=$false)]
    [switch]$Watch = $false,
    
    [Parameter(Mandatory=$false)]
    [int]$RefreshInterval = 30,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowLogs = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$Component = ""
)

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Write-Header {
    param([string]$Message)
    Write-ColorOutput "═══ $Message ═══" $Cyan
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
    try {
        kubectl version --client --short | Out-Null
        helm version --short | Out-Null
        kubectl cluster-info --request-timeout=5s | Out-Null
    }
    catch {
        Write-Error "Prerequisites not met. Ensure kubectl and helm are installed and cluster is accessible."
        exit 1
    }
}

function Get-SystemStatus {
    Write-Header "System Status - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    
    # Check if namespace exists
    $namespaceExists = kubectl get namespace $Namespace 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Namespace '$Namespace' does not exist"
        return $false
    }
    
    Write-Success "Namespace '$Namespace' exists"
    return $true
}

function Show-HelmStatus {
    Write-Header "Helm Release Status"
    
    $releases = helm list --namespace=$Namespace --output=json | ConvertFrom-Json
    if ($releases.Count -eq 0) {
        Write-Warning "No Helm releases found in namespace '$Namespace'"
        return
    }
    
    foreach ($release in $releases) {
        $status = $release.status
        $color = switch ($status) {
            "deployed" { $Green }
            "failed" { $Red }
            "pending-install" { $Yellow }
            "pending-upgrade" { $Yellow }
            default { $Reset }
        }
        
        Write-ColorOutput "Release: $($release.name) | Status: $status | Chart: $($release.chart) | Revision: $($release.revision)" $color
    }
}

function Show-PodStatus {
    Write-Header "Pod Status"
    
    $pods = kubectl get pods --namespace=$Namespace --output=json | ConvertFrom-Json
    if ($pods.items.Count -eq 0) {
        Write-Warning "No pods found in namespace '$Namespace'"
        return
    }
    
    $podStats = @{
        Running = 0
        Pending = 0
        Failed = 0
        Succeeded = 0
        Unknown = 0
    }
    
    foreach ($pod in $pods.items) {
        $name = $pod.metadata.name
        $status = $pod.status.phase
        $ready = "0/0"
        
        if ($pod.status.containerStatuses) {
            $readyCount = ($pod.status.containerStatuses | Where-Object { $_.ready -eq $true }).Count
            $totalCount = $pod.status.containerStatuses.Count
            $ready = "$readyCount/$totalCount"
        }
        
        $restarts = 0
        if ($pod.status.containerStatuses) {
            $restarts = ($pod.status.containerStatuses | Measure-Object -Property restartCount -Sum).Sum
        }
        
        $age = ""
        if ($pod.metadata.creationTimestamp) {
            $created = [DateTime]::Parse($pod.metadata.creationTimestamp)
            $age = (Get-Date) - $created
            $age = "{0}d{1}h{2}m" -f $age.Days, $age.Hours, $age.Minutes
        }
        
        $color = switch ($status) {
            "Running" { $Green }
            "Pending" { $Yellow }
            "Failed" { $Red }
            "Succeeded" { $Green }
            default { $Reset }
        }
        
        $podStats[$status]++
        
        Write-ColorOutput "Pod: $name | Status: $status | Ready: $ready | Restarts: $restarts | Age: $age" $color
    }
    
    Write-Host ""
    Write-ColorOutput "Pod Summary:" $Blue
    foreach ($status in $podStats.Keys) {
        if ($podStats[$status] -gt 0) {
            Write-Host "  $status`: $($podStats[$status])"
        }
    }
}

function Show-ServiceStatus {
    Write-Header "Service Status"
    
    $services = kubectl get services --namespace=$Namespace --output=json | ConvertFrom-Json
    if ($services.items.Count -eq 0) {
        Write-Warning "No services found in namespace '$Namespace'"
        return
    }
    
    foreach ($service in $services.items) {
        $name = $service.metadata.name
        $type = $service.spec.type
        $clusterIP = $service.spec.clusterIP
        $ports = $service.spec.ports | ForEach-Object { "$($_.port):$($_.targetPort)/$($_.protocol)" }
        $portsStr = $ports -join ", "
        
        $externalIP = "None"
        if ($service.status.loadBalancer.ingress) {
            $externalIP = $service.status.loadBalancer.ingress[0].ip
        }
        
        Write-ColorOutput "Service: $name | Type: $type | ClusterIP: $clusterIP | Ports: $portsStr | External: $externalIP" $Green
    }
}

function Show-IngressStatus {
    Write-Header "Ingress Status"
    
    $ingresses = kubectl get ingress --namespace=$Namespace --output=json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0 -or $ingresses.items.Count -eq 0) {
        Write-Warning "No ingresses found in namespace '$Namespace'"
        return
    }
    
    foreach ($ingress in $ingresses.items) {
        $name = $ingress.metadata.name
        $hosts = $ingress.spec.rules | ForEach-Object { $_.host }
        $hostsStr = $hosts -join ", "
        
        $addresses = "None"
        if ($ingress.status.loadBalancer.ingress) {
            $addresses = $ingress.status.loadBalancer.ingress | ForEach-Object { $_.ip -or $_.hostname }
            $addresses = $addresses -join ", "
        }
        
        Write-ColorOutput "Ingress: $name | Hosts: $hostsStr | Addresses: $addresses" $Green
    }
}

function Show-PVCStatus {
    Write-Header "Persistent Volume Claims"
    
    $pvcs = kubectl get pvc --namespace=$Namespace --output=json | ConvertFrom-Json
    if ($pvcs.items.Count -eq 0) {
        Write-Warning "No PVCs found in namespace '$Namespace'"
        return
    }
    
    foreach ($pvc in $pvcs.items) {
        $name = $pvc.metadata.name
        $status = $pvc.status.phase
        $capacity = $pvc.status.capacity.storage
        $storageClass = $pvc.spec.storageClassName
        
        $color = switch ($status) {
            "Bound" { $Green }
            "Pending" { $Yellow }
            "Lost" { $Red }
            default { $Reset }
        }
        
        Write-ColorOutput "PVC: $name | Status: $status | Capacity: $capacity | StorageClass: $storageClass" $color
    }
}

function Show-ResourceUsage {
    Write-Header "Resource Usage"
    
    try {
        $metrics = kubectl top pods --namespace=$Namespace --no-headers 2>$null
        if ($LASTEXITCODE -eq 0 -and $metrics) {
            Write-ColorOutput "Pod Resource Usage:" $Blue
            $metrics | ForEach-Object {
                Write-Host "  $_"
            }
        } else {
            Write-Warning "Metrics server not available or no metrics found"
        }
    }
    catch {
        Write-Warning "Could not retrieve resource usage metrics"
    }
}

function Show-Events {
    Write-Header "Recent Events"
    
    $events = kubectl get events --namespace=$Namespace --sort-by='.lastTimestamp' --output=json | ConvertFrom-Json
    if ($events.items.Count -eq 0) {
        Write-Warning "No events found in namespace '$Namespace'"
        return
    }
    
    # Show last 10 events
    $recentEvents = $events.items | Select-Object -Last 10
    
    foreach ($event in $recentEvents) {
        $time = $event.lastTimestamp
        $type = $event.type
        $reason = $event.reason
        $object = "$($event.involvedObject.kind)/$($event.involvedObject.name)"
        $message = $event.message
        
        $color = switch ($type) {
            "Normal" { $Green }
            "Warning" { $Yellow }
            "Error" { $Red }
            default { $Reset }
        }
        
        Write-ColorOutput "$time | $type | $reason | $object | $message" $color
    }
}

function Show-ComponentLogs {
    param([string]$ComponentName)
    
    Write-Header "Logs for $ComponentName"
    
    $pods = kubectl get pods --namespace=$Namespace --selector="app.kubernetes.io/component=$ComponentName" --output=json | ConvertFrom-Json
    if ($pods.items.Count -eq 0) {
        Write-Warning "No pods found for component '$ComponentName'"
        return
    }
    
    foreach ($pod in $pods.items) {
        $podName = $pod.metadata.name
        Write-ColorOutput "Logs from pod: $podName" $Blue
        kubectl logs $podName --namespace=$Namespace --tail=20
        Write-Host ""
    }
}

function Show-HealthChecks {
    Write-Header "Health Checks"
    
    $components = @("backend", "kiosk", "manager", "admin")
    
    foreach ($component in $components) {
        $pods = kubectl get pods --namespace=$Namespace --selector="app.kubernetes.io/component=$component" --output=json | ConvertFrom-Json
        
        if ($pods.items.Count -eq 0) {
            Write-Warning "No pods found for component '$component'"
            continue
        }
        
        $healthyPods = 0
        $totalPods = $pods.items.Count
        
        foreach ($pod in $pods.items) {
            $ready = $true
            if ($pod.status.containerStatuses) {
                $ready = ($pod.status.containerStatuses | Where-Object { $_.ready -eq $false }).Count -eq 0
            }
            
            if ($ready) {
                $healthyPods++
            }
        }
        
        $color = if ($healthyPods -eq $totalPods) { $Green } else { $Red }
        Write-ColorOutput "Component: $component | Healthy: $healthyPods/$totalPods" $color
    }
}

function Show-AllStatus {
    Clear-Host
    
    if (-not (Get-SystemStatus)) {
        return
    }
    
    Show-HelmStatus
    Write-Host ""
    
    Show-HealthChecks
    Write-Host ""
    
    Show-PodStatus
    Write-Host ""
    
    Show-ServiceStatus
    Write-Host ""
    
    Show-IngressStatus
    Write-Host ""
    
    Show-PVCStatus
    Write-Host ""
    
    Show-ResourceUsage
    Write-Host ""
    
    Show-Events
    
    if ($ShowLogs -and $Component) {
        Write-Host ""
        Show-ComponentLogs $Component
    }
}

function Main {
    Write-ColorOutput "📊 School Presence System Monitor" $Cyan
    Write-Host "Namespace: $Namespace"
    if ($Watch) { Write-Host "Watch Mode: Enabled (refresh every $RefreshInterval seconds)" }
    if ($ShowLogs -and $Component) { Write-Host "Showing logs for: $Component" }
    Write-Host ""
    
    Test-Prerequisites
    
    if ($Watch) {
        while ($true) {
            Show-AllStatus
            Write-Host ""
            Write-ColorOutput "Press Ctrl+C to exit. Next refresh in $RefreshInterval seconds..." $Yellow
            Start-Sleep -Seconds $RefreshInterval
        }
    } else {
        Show-AllStatus
    }
}

# Run main function
Main