# School Presence System Backup Script
# This script creates backups of the database and configuration

param(
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "presence-system",
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = "./backups",
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeDatabase = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeConfig = $true,
    
    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 30
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
    
    try {
        kubectl version --client --short | Out-Null
        Write-Success "kubectl is installed"
    }
    catch {
        Write-Error "kubectl is not installed or not in PATH"
        exit 1
    }
    
    try {
        kubectl cluster-info --request-timeout=5s | Out-Null
        Write-Success "Connected to Kubernetes cluster"
    }
    catch {
        Write-Error "Cannot connect to Kubernetes cluster"
        exit 1
    }
    
    # Check if namespace exists
    $namespaceExists = kubectl get namespace $Namespace 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Namespace '$Namespace' does not exist"
        exit 1
    }
    Write-Success "Namespace '$Namespace' exists"
}

function Initialize-BackupDirectory {
    Write-Step "Initializing backup directory..."
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupDir = Join-Path $BackupPath $timestamp
    
    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
        Write-Success "Created backup root directory: $BackupPath"
    }
    
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Success "Created backup directory: $backupDir"
    
    return $backupDir
}

function Backup-Database {
    param([string]$BackupDir)
    
    if (-not $IncludeDatabase) {
        Write-Warning "Skipping database backup"
        return
    }
    
    Write-Step "Backing up PostgreSQL database..."
    
    # Find PostgreSQL pod
    $pgPods = kubectl get pods --namespace=$Namespace --selector="app.kubernetes.io/name=postgresql" --output=json | ConvertFrom-Json
    if ($pgPods.items.Count -eq 0) {
        Write-Warning "No PostgreSQL pods found"
        return
    }
    
    $pgPod = $pgPods.items[0].metadata.name
    Write-Step "Using PostgreSQL pod: $pgPod"
    
    # Get database credentials from secret
    $dbUser = kubectl get secret --namespace=$Namespace presence-system-postgresql -o jsonpath='{.data.postgres-user}' | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
    $dbPassword = kubectl get secret --namespace=$Namespace presence-system-postgresql -o jsonpath='{.data.postgres-password}' | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
    $dbName = "presence"
    
    if (-not $dbUser -or -not $dbPassword) {
        Write-Warning "Could not retrieve database credentials"
        return
    }
    
    # Create database dump
    $dumpFile = Join-Path $BackupDir "database-dump.sql"
    $dumpCommand = "PGPASSWORD='$dbPassword' pg_dump -h localhost -U $dbUser -d $dbName --clean --if-exists"
    
    kubectl exec $pgPod --namespace=$Namespace -- bash -c $dumpCommand > $dumpFile
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $dumpFile).Length
        Write-Success "Database backup created: $dumpFile ($([math]::Round($fileSize/1MB, 2)) MB)"
    } else {
        Write-Error "Database backup failed"
        Remove-Item $dumpFile -ErrorAction SilentlyContinue
    }
}

function Backup-Configuration {
    param([string]$BackupDir)
    
    if (-not $IncludeConfig) {
        Write-Warning "Skipping configuration backup"
        return
    }
    
    Write-Step "Backing up Kubernetes configuration..."
    
    $configDir = Join-Path $BackupDir "config"
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    
    # Backup ConfigMaps
    $configMaps = kubectl get configmaps --namespace=$Namespace --output=json | ConvertFrom-Json
    if ($configMaps.items.Count -gt 0) {
        $configMapsFile = Join-Path $configDir "configmaps.yaml"
        kubectl get configmaps --namespace=$Namespace --output=yaml > $configMapsFile
        Write-Success "ConfigMaps backed up: $configMapsFile"
    }
    
    # Backup Secrets (excluding sensitive data)
    $secrets = kubectl get secrets --namespace=$Namespace --output=json | ConvertFrom-Json
    if ($secrets.items.Count -gt 0) {
        $secretsFile = Join-Path $configDir "secrets-metadata.yaml"
        kubectl get secrets --namespace=$Namespace --output=yaml | ForEach-Object {
            # Remove sensitive data from backup
            $_ -replace 'data:.*?(?=\n\w|\n$|\Z)', 'data: {}'
        } > $secretsFile
        Write-Success "Secrets metadata backed up: $secretsFile"
    }
    
    # Backup PersistentVolumeClaims
    $pvcs = kubectl get pvc --namespace=$Namespace --output=json | ConvertFrom-Json
    if ($pvcs.items.Count -gt 0) {
        $pvcsFile = Join-Path $configDir "pvcs.yaml"
        kubectl get pvc --namespace=$Namespace --output=yaml > $pvcsFile
        Write-Success "PVCs backed up: $pvcsFile"
    }
    
    # Backup Services
    $services = kubectl get services --namespace=$Namespace --output=json | ConvertFrom-Json
    if ($services.items.Count -gt 0) {
        $servicesFile = Join-Path $configDir "services.yaml"
        kubectl get services --namespace=$Namespace --output=yaml > $servicesFile
        Write-Success "Services backed up: $servicesFile"
    }
    
    # Backup Ingresses
    $ingresses = kubectl get ingress --namespace=$Namespace --output=json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -eq 0 -and $ingresses.items.Count -gt 0) {
        $ingressFile = Join-Path $configDir "ingresses.yaml"
        kubectl get ingress --namespace=$Namespace --output=yaml > $ingressFile
        Write-Success "Ingresses backed up: $ingressFile"
    }
    
    # Backup Helm values
    $helmValues = helm get values presence-system --namespace=$Namespace --output=yaml 2>$null
    if ($LASTEXITCODE -eq 0 -and $helmValues) {
        $valuesFile = Join-Path $configDir "helm-values.yaml"
        $helmValues > $valuesFile
        Write-Success "Helm values backed up: $valuesFile"
    }
}

function Create-BackupManifest {
    param([string]$BackupDir)
    
    Write-Step "Creating backup manifest..."
    
    $manifest = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        namespace = $Namespace
        components = @{
            database = $IncludeDatabase
            configuration = $IncludeConfig
        }
        files = @()
    }
    
    # List all files in backup
    $files = Get-ChildItem -Path $BackupDir -Recurse -File
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($BackupDir.Length + 1)
        $manifest.files += @{
            path = $relativePath
            size = $file.Length
            hash = (Get-FileHash $file.FullName -Algorithm SHA256).Hash
        }
    }
    
    $manifestFile = Join-Path $BackupDir "backup-manifest.json"
    $manifest | ConvertTo-Json -Depth 10 | Out-File -FilePath $manifestFile -Encoding UTF8
    
    Write-Success "Backup manifest created: $manifestFile"
}

function Cleanup-OldBackups {
    Write-Step "Cleaning up old backups..."
    
    if (-not (Test-Path $BackupPath)) {
        Write-Warning "Backup path does not exist: $BackupPath"
        return
    }
    
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $oldBackups = Get-ChildItem -Path $BackupPath -Directory | Where-Object { $_.CreationTime -lt $cutoffDate }
    
    if ($oldBackups.Count -eq 0) {
        Write-Success "No old backups to clean up"
        return
    }
    
    foreach ($backup in $oldBackups) {
        try {
            Remove-Item -Path $backup.FullName -Recurse -Force
            Write-Success "Removed old backup: $($backup.Name)"
        }
        catch {
            Write-Warning "Failed to remove old backup: $($backup.Name)"
        }
    }
    
    Write-Success "Cleaned up $($oldBackups.Count) old backup(s)"
}

function Show-BackupSummary {
    param([string]$BackupDir)
    
    Write-Step "Backup Summary:"
    Write-Host ""
    
    $totalSize = (Get-ChildItem -Path $BackupDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $fileCount = (Get-ChildItem -Path $BackupDir -Recurse -File).Count
    
    Write-ColorOutput "Backup Location: $BackupDir" $Green
    Write-ColorOutput "Total Files: $fileCount" $Green
    Write-ColorOutput "Total Size: $([math]::Round($totalSize/1MB, 2)) MB" $Green
    
    Write-Host ""
    Write-ColorOutput "Backup Contents:" $Blue
    Get-ChildItem -Path $BackupDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($BackupDir.Length + 1)
        $size = [math]::Round($_.Length/1KB, 2)
        Write-Host "  $relativePath ($size KB)"
    }
}

function Main {
    Write-ColorOutput "💾 School Presence System Backup" $Green
    Write-Host "Namespace: $Namespace"
    Write-Host "Backup Path: $BackupPath"
    Write-Host "Include Database: $IncludeDatabase"
    Write-Host "Include Config: $IncludeConfig"
    Write-Host "Retention Days: $RetentionDays"
    Write-Host ""
    
    try {
        Test-Prerequisites
        $backupDir = Initialize-BackupDirectory
        Backup-Database $backupDir
        Backup-Configuration $backupDir
        Create-BackupManifest $backupDir
        Cleanup-OldBackups
        Show-BackupSummary $backupDir
        
        Write-Host ""
        Write-Success "🎉 Backup completed successfully!"
        Write-ColorOutput "Backup location: $backupDir" $Green
    }
    catch {
        Write-Error "Backup failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Main