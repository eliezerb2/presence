# School Presence System - Management Scripts

This directory contains PowerShell scripts for managing the School Presence System deployment on Kubernetes.

## Prerequisites

Before using these scripts, ensure you have:

1. **PowerShell 7+** installed
2. **kubectl** installed and configured to access your Kubernetes cluster
3. **Helm 3+** installed
4. **Docker** installed (for building images)
5. Proper permissions to manage resources in your Kubernetes cluster

## Scripts Overview

### 1. deploy.ps1 - Deployment Script

Deploys the complete School Presence System to Kubernetes.

**Usage:**
```powershell
# Basic deployment
.\deploy.ps1

# Deploy to specific namespace
.\deploy.ps1 -Namespace "my-presence-system"

# Deploy to development environment
.\deploy.ps1 -Environment "development"

# Skip building Docker images
.\deploy.ps1 -SkipBuild

# Dry run (preview changes without applying)
.\deploy.ps1 -DryRun
```

**Parameters:**
- `-Namespace`: Target Kubernetes namespace (default: "presence-system")
- `-Environment`: Deployment environment - "production" or "development" (default: "production")
- `-SkipBuild`: Skip building Docker images
- `-DryRun`: Preview changes without applying them

**What it does:**
1. Checks prerequisites (kubectl, helm, docker)
2. Builds Docker images for all components
3. Creates Kubernetes namespace
4. Deploys using Helm chart
5. Waits for all deployments to be ready
6. Shows deployment information and access URLs

### 2. undeploy.ps1 - Undeployment Script

Removes the School Presence System from Kubernetes.

**Usage:**
```powershell
# Basic undeployment (keeps namespace and persistent data)
.\undeploy.ps1

# Remove everything including namespace
.\undeploy.ps1 -DeleteNamespace

# Remove persistent data (DANGEROUS - deletes database)
.\undeploy.ps1 -DeletePVCs

# Force removal without confirmation prompts
.\undeploy.ps1 -Force

# Dry run to see what would be removed
.\undeploy.ps1 -DryRun
```

**Parameters:**
- `-Namespace`: Target Kubernetes namespace (default: "presence-system")
- `-DeleteNamespace`: Delete the entire namespace
- `-DeletePVCs`: Delete persistent volume claims (removes all data)
- `-Force`: Skip confirmation prompts
- `-DryRun`: Preview changes without applying them

**What it does:**
1. Shows current resources in the namespace
2. Removes Helm release
3. Optionally removes persistent volume claims
4. Optionally removes the namespace
5. Shows cleanup summary

### 3. monitor.ps1 - Monitoring Script

Monitors the health and status of the School Presence System.

**Usage:**
```powershell
# One-time status check
.\monitor.ps1

# Continuous monitoring (refreshes every 30 seconds)
.\monitor.ps1 -Watch

# Monitor with custom refresh interval
.\monitor.ps1 -Watch -RefreshInterval 60

# Show logs for specific component
.\monitor.ps1 -ShowLogs -Component "backend"
```

**Parameters:**
- `-Namespace`: Target Kubernetes namespace (default: "presence-system")
- `-Watch`: Enable continuous monitoring mode
- `-RefreshInterval`: Refresh interval in seconds for watch mode (default: 30)
- `-ShowLogs`: Show recent logs
- `-Component`: Specific component to show logs for

**What it shows:**
1. Helm release status
2. Pod health and status
3. Service endpoints
4. Ingress configuration
5. Persistent volume claims
6. Resource usage (if metrics server available)
7. Recent events
8. Component logs (if requested)

### 4. backup.ps1 - Backup Script

Creates backups of the database and configuration.

**Usage:**
```powershell
# Full backup (database + configuration)
.\backup.ps1

# Database only
.\backup.ps1 -IncludeConfig:$false

# Configuration only
.\backup.ps1 -IncludeDatabase:$false

# Custom backup location
.\backup.ps1 -BackupPath "C:\Backups\PresenceSystem"

# Custom retention period
.\backup.ps1 -RetentionDays 60
```

**Parameters:**
- `-Namespace`: Target Kubernetes namespace (default: "presence-system")
- `-BackupPath`: Local path to store backups (default: "./backups")
- `-IncludeDatabase`: Include database backup (default: true)
- `-IncludeConfig`: Include configuration backup (default: true)
- `-RetentionDays`: Number of days to keep old backups (default: 30)

**What it backs up:**
1. PostgreSQL database dump
2. Kubernetes ConfigMaps
3. Secrets metadata (without sensitive data)
4. PersistentVolumeClaims configuration
5. Services configuration
6. Ingress configuration
7. Helm values
8. Backup manifest with file checksums

## Common Workflows

### Initial Deployment

1. **Deploy the system:**
   ```powershell
   .\deploy.ps1 -Environment "production"
   ```

2. **Monitor the deployment:**
   ```powershell
   .\monitor.ps1 -Watch
   ```

3. **Create initial backup:**
   ```powershell
   .\backup.ps1
   ```

### Regular Maintenance

1. **Check system health:**
   ```powershell
   .\monitor.ps1
   ```

2. **Create regular backups:**
   ```powershell
   .\backup.ps1
   ```

3. **Update deployment:**
   ```powershell
   .\deploy.ps1 -SkipBuild  # If using existing images
   ```

### Troubleshooting

1. **Check pod logs:**
   ```powershell
   .\monitor.ps1 -ShowLogs -Component "backend"
   ```

2. **Continuous monitoring:**
   ```powershell
   .\monitor.ps1 -Watch -RefreshInterval 10
   ```

3. **Check recent events:**
   ```powershell
   kubectl get events --namespace=presence-system --sort-by='.lastTimestamp'
   ```

### Complete Removal

1. **Preview what will be removed:**
   ```powershell
   .\undeploy.ps1 -DryRun -DeleteNamespace -DeletePVCs
   ```

2. **Remove everything (DANGEROUS):**
   ```powershell
   .\undeploy.ps1 -DeleteNamespace -DeletePVCs -Force
   ```

## Security Considerations

1. **Backup Security**: Backups contain sensitive data. Store them securely and encrypt if necessary.

2. **Database Credentials**: The backup script retrieves database credentials from Kubernetes secrets. Ensure proper RBAC permissions.

3. **Network Access**: Scripts require network access to the Kubernetes API server and container registry.

4. **Permissions**: Ensure the user running these scripts has appropriate Kubernetes permissions.

## Customization

### Environment-Specific Values

Create custom Helm values files for different environments:

```yaml
# values-production.yaml
postgresql:
  auth:
    postgresPassword: "secure-production-password"
backend:
  env:
    SECRET_KEY: "production-secret-key"
    WHATSAPP_API_TOKEN: "production-whatsapp-token"
```

Then deploy with:
```powershell
helm upgrade --install presence-system ./helm/presence-system -f values-production.yaml
```

### Custom Monitoring

Extend the monitoring script to include custom health checks or integrate with external monitoring systems.

### Automated Backups

Set up scheduled tasks or cron jobs to run the backup script automatically:

```powershell
# Windows Task Scheduler
schtasks /create /tn "PresenceSystemBackup" /tr "powershell.exe -File C:\path\to\backup.ps1" /sc daily /st 02:00
```

## Troubleshooting

### Common Issues

1. **kubectl not found**: Ensure kubectl is installed and in PATH
2. **Permission denied**: Check Kubernetes RBAC permissions
3. **Image pull errors**: Verify Docker images are built and accessible
4. **Database connection issues**: Check PostgreSQL pod status and credentials
5. **Ingress not working**: Verify ingress controller is installed and configured

### Getting Help

1. Check script output for detailed error messages
2. Use `-DryRun` flag to preview changes
3. Monitor system status with `.\monitor.ps1 -Watch`
4. Check Kubernetes events: `kubectl get events --namespace=presence-system`
5. Review pod logs: `kubectl logs <pod-name> --namespace=presence-system`

## Support

For additional support or questions about these scripts, please refer to the main project documentation or contact the development team.