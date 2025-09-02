# School Attendance Application

A comprehensive school attendance management system built with modern technologies.

## Features

- **Student Kiosk**: Tablet interface for students to check in/out without login
- **Manager Interface**: Web-based management interface for attendance officers
- **Admin Panel**: Complete system administration
- **Automated Workflows**: Automatic attendance processing and notifications
- **WhatsApp Integration**: Automated reminders and notifications
- **Court System**: Automated claims and disciplinary tracking

## Architecture

- **Backend**: FastAPI with PostgreSQL
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL with comprehensive schema
- **Deployment**: Kubernetes with Helm
- **Containerization**: Docker
- **Testing**: Unit, integration, and end-to-end tests

## Quick Start

### Prerequisites
- Docker Desktop with Rancher Desktop Kubernetes
- Helm 3.x

### Deployment
```bash
# Deploy to Kubernetes
helm install attendance ./helm/attendance

# Check status
kubectl get pods -n attendance

# Access the application
kubectl port-forward -n attendance svc/attendance-frontend 3000:80
kubectl port-forward -n attendance svc/attendance-backend 8000:80
```

### Development
```bash
# Build and deploy
docker build -t attendance-backend ./backend
docker build -t attendance-frontend ./frontend

# Run tests
kubectl exec -n attendance deployment/attendance-backend -- python -m pytest
```

## System Components

1. **Student Kiosk**: Simple interface for daily check-in/out
2. **Manager Dashboard**: Daily attendance overview and manual overrides
3. **Admin Panel**: Student management, settings, and system configuration
4. **Automation Engine**: Scheduled tasks for attendance processing
5. **Notification System**: WhatsApp integration for reminders

## Database Schema

The system uses a comprehensive PostgreSQL schema with tables for:
- Students and their information
- Daily attendance records
- Permanent absence approvals
- School holidays and settings
- Monthly overrides and claims
- Audit logging

## Testing Strategy

- **Unit Tests**: All methods and functions
- **Integration Tests**: Service layer and database operations
- **End-to-End Tests**: Complete user workflows
- **Test Data**: Generated test data for comprehensive testing

## License

MIT License
