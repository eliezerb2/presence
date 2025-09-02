# School Attendance System - Project Structure

## Overview
This is a comprehensive school attendance management system built with modern technologies, designed for schools with up to 100 students. The system provides automated attendance tracking, WhatsApp notifications, and a court system for disciplinary management.

## Architecture

### Technology Stack
- **Backend**: FastAPI with Python 3.11
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL
- **Containerization**: Docker
- **Orchestration**: Kubernetes with Helm
- **Testing**: pytest with comprehensive test coverage
- **Deployment**: Rancher Desktop Kubernetes

### System Components
1. **Student Kiosk**: Tablet interface for check-in/out
2. **Manager Dashboard**: Web interface for attendance officers
3. **Admin Panel**: System administration interface
4. **Automation Engine**: Scheduled attendance processing
5. **WhatsApp Integration**: Automated notifications
6. **Court System**: Disciplinary claims management

## Project Structure

```
school-attendance/
├── README.md                           # Project overview and setup
├── requirements.md                     # Hebrew requirements specification
├── PROJECT_STRUCTURE.md               # This file - detailed structure
├── deploy.ps1                         # PowerShell deployment script
│
├── backend/                           # FastAPI backend application
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Backend container definition
│   ├── app/                          # Application source code
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI application entry point
│   │   ├── database.py               # Database configuration
│   │   ├── models.py                 # SQLAlchemy data models
│   │   ├── schemas.py                # Pydantic schemas
│   │   ├── api/                      # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── kiosk.py             # Student kiosk API
│   │   │   ├── manager.py            # Manager dashboard API
│   │   │   └── admin.py              # Admin panel API
│   │   └── services/                 # Business logic services
│   │       ├── __init__.py
│   │       ├── attendance_service.py # Attendance management
│   │       ├── student_service.py    # Student management
│   │       ├── claims_service.py     # Court system
│   │       ├── audit_service.py      # Audit logging
│   │       └── whatsapp_service.py   # WhatsApp integration
│   └── tests/                        # Test suite
│       ├── __init__.py
│       ├── conftest.py               # Test configuration and fixtures
│       ├── test_attendance_service.py # Unit tests
│       └── test_integration.py       # Integration tests
│
├── frontend/                          # React frontend application
│   ├── package.json                  # Node.js dependencies
│   ├── Dockerfile                    # Frontend container definition
│   ├── nginx.conf                    # Nginx configuration
│   ├── public/                       # Static assets
│   ├── src/                          # React source code
│   │   ├── App.tsx                   # Main application component
│   │   ├── components/               # React components
│   │   │   ├── Kiosk.tsx            # Student kiosk interface
│   │   │   ├── ManagerDashboard.tsx # Manager dashboard
│   │   │   ├── AdminPanel.tsx       # Admin panel
│   │   │   └── Navigation.tsx       # Navigation component
│   │   ├── services/                 # API service layer
│   │   │   └── api.ts               # HTTP client and API calls
│   │   └── styles/                   # CSS and styling
│   └── tests/                        # Frontend tests
│
└── helm/                              # Kubernetes Helm charts
    └── attendance/                    # Main chart
        ├── Chart.yaml                 # Chart metadata
        ├── values.yaml                # Configurable values
        ├── templates/                 # Kubernetes manifests
        │   ├── _helpers.tpl          # Template helper functions
        │   ├── namespace.yaml         # Namespace definition
        │   ├── postgresql.yaml        # PostgreSQL deployment
        │   ├── backend.yaml           # Backend deployment
        │   └── frontend.yaml          # Frontend deployment
        └── charts/                    # Sub-charts (if any)
```

## Database Schema

### Core Tables
- **students**: Student information and status
- **attendance**: Daily attendance records
- **permanent_absences**: Approved permanent absences
- **school_holidays**: School calendar
- **settings**: System configuration
- **student_monthly_overrides**: Monthly thresholds per student
- **claims**: Disciplinary claims
- **audit_log**: System audit trail

### Key Features
- **Unique Constraints**: Student number, nickname, daily attendance
- **Audit Logging**: All changes tracked with before/after states
- **Override System**: Manager can override automated decisions
- **Hebrew Support**: Full RTL and Hebrew text support

## API Endpoints

### Kiosk API (`/api/v1/kiosk/`)
- `POST /search` - Search for students
- `POST /check-in` - Student check-in
- `POST /check-out` - Student check-out
- `GET /status/{student_id}` - Get student status

### Manager API (`/api/v1/manager/`)
- `GET /attendance/daily/{date}` - Daily attendance
- `GET /attendance/summary/{date}` - Daily summary
- `PUT /attendance/{id}` - Update attendance
- `GET /students` - List students
- `GET /statistics/monthly/{year-month}` - Monthly statistics
- `GET /claims` - List claims
- `GET /dashboard/today` - Today's dashboard

### Admin API (`/api/v1/admin/`)
- `POST /students` - Create student
- `PUT /students/{id}` - Update student
- `DELETE /students/{id}` - Delete student
- `POST /permanent-absences` - Create permanent absence
- `POST /holidays` - Create school holiday
- `PUT /settings` - Update system settings
- `POST /monthly-overrides` - Create monthly override

## Business Logic

### Automated Workflows
1. **09:00** - Process permanent absences
2. **09:30** - Send WhatsApp reminders
3. **10:00** - Mark late students
4. **10:30** - Mark "yom lo ba li" students
5. **16:00** - End of day processing
6. **Monthly** - Process claims and statistics

### Override System
- Managers can override any automated decision
- Overrides are locked and audited
- Future automation respects overrides

### Court System
- Automatic claim generation based on thresholds
- WhatsApp notifications to stakeholders
- Claim lifecycle management

## Testing Strategy

### Test Types
1. **Unit Tests**: Individual service methods
2. **Integration Tests**: Service interactions
3. **End-to-End Tests**: Complete user workflows
4. **Performance Tests**: System load testing

### Test Data
- Comprehensive fixtures for all entities
- Realistic Hebrew names and data
- Edge case scenarios

### Test Execution
- Backend: `pytest` with SQLite in-memory database
- Frontend: Jest with React Testing Library
- Integration: Full system testing in Kubernetes

## Deployment

### Prerequisites
- Docker Desktop with Rancher Desktop
- Kubernetes cluster running
- Helm 3.x installed
- PowerShell (Windows)

### Deployment Commands
```powershell
# Deploy the system
.\deploy.ps1

# Redeploy (clean install)
.\deploy.ps1 redeploy

# Check status
.\deploy.ps1 status

# View logs
.\deploy.ps1 logs

# Run tests
.\deploy.ps1 test

# Uninstall
.\deploy.ps1 uninstall
```

### Access Points
- **Frontend**: http://localhost:3000 (after port-forward)
- **Backend API**: http://localhost:8000 (after port-forward)
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Security Features

### Container Security
- Non-root user execution
- Read-only filesystem
- Minimal base images
- Security context restrictions

### API Security
- Input validation with Pydantic
- SQL injection prevention
- Audit logging of all changes
- Rate limiting (configurable)

### Data Protection
- Encrypted database connections
- Secure credential management
- Audit trail for compliance
- Data backup capabilities

## Monitoring and Observability

### Health Checks
- Liveness probes for all services
- Readiness probes for dependencies
- Health endpoint monitoring

### Logging
- Structured logging throughout
- Audit trail for all operations
- Error tracking and reporting

### Metrics
- Performance monitoring
- Resource utilization
- Business metrics tracking

## Scalability

### Horizontal Scaling
- Multiple backend replicas
- Load balancing across pods
- Auto-scaling capabilities

### Database Optimization
- Connection pooling
- Query optimization
- Indexing strategy

### Caching
- Redis for session management
- In-memory caching for frequent queries
- CDN for static assets

## Maintenance

### Backup Strategy
- Automated database backups
- Configuration backups
- Disaster recovery procedures

### Update Process
- Rolling updates with zero downtime
- Database migration support
- Rollback capabilities

### Monitoring
- Resource monitoring
- Performance alerts
- Error tracking

## Future Enhancements

### Planned Features
- Mobile applications
- Advanced analytics dashboard
- Integration with school management systems
- Multi-language support
- Advanced reporting

### Technical Improvements
- GraphQL API
- Real-time notifications
- Advanced caching strategies
- Microservices architecture
- Cloud-native deployment options
