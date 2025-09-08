# School Presence Management System

A comprehensive school attendance management system designed for schools with up to 100 students. The system provides tablet kiosk interfaces for student check-in/out and web interfaces for attendance oversight and administration, all with Hebrew language support.

## 🎯 Features

### Core Functionality
- **Student Check-in/Out**: Tablet kiosk interface for easy student attendance tracking
- **Real-time Monitoring**: Live attendance dashboard for managers
- **Automated Business Logic**: Complex rules for late marking, day closure, and claim processing
- **WhatsApp Integration**: Automated reminders and notifications
- **Hebrew Interface**: Full RTL support for Hebrew language
- **Multi-role Access**: Separate interfaces for kiosk, managers, and administrators

### Business Logic
- **Permanent Absence Management**: Configure recurring absences for specific weekdays
- **School Holiday Support**: Automatic handling of school holidays
- **Late Threshold Monitoring**: Automatic claim generation when students exceed monthly late limits
- **"Yom Lo Ba Li" Tracking**: Special handling for "didn't feel like it" absences
- **Automated Notifications**: WhatsApp reminders for non-reported attendance
- **Monthly Statistics**: Comprehensive reporting and analytics

## 🏗️ Architecture

### Backend (FastAPI)
- **RESTful API**: Complete CRUD operations for all entities
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Background Tasks**: Celery with Redis for automated processes
- **Business Services**: Automation, notification, and audit services
- **Scheduler**: Automated daily tasks and reminders

### Frontend (React)
- **Kiosk Interface**: Touch-friendly student check-in/out
- **Manager Dashboard**: Daily attendance oversight and claims management
- **Admin Panel**: System configuration and student management
- **Hebrew RTL Support**: Full right-to-left language support

### Infrastructure
- **Containerized**: Docker containers for all components
- **Kubernetes Ready**: Helm charts for production deployment
- **Database**: PostgreSQL with persistent storage
- **Cache/Queue**: Redis for caching and task queuing

## 📁 Project Structure

```
presence/
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   ├── core/              # Core configuration and database
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic schemas for API
│   │   └── services/          # Business logic services
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── kiosk/                 # Student check-in/out interface
│   ├── manager/               # Attendance management dashboard
│   └── admin/                 # System administration interface
├── helm/                      # Kubernetes Helm charts
│   └── presence-system/
├── scripts/                   # PowerShell management scripts
│   ├── deploy.ps1            # Deployment script
│   ├── undeploy.ps1          # Undeployment script
│   ├── monitor.ps1           # Monitoring script
│   └── backup.ps1            # Backup script
├── tests/                     # Comprehensive test suite
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── docker-compose.yml         # Local development setup
└── requirements.md           # Original requirements document
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Kubernetes cluster (for production)
- Helm 3+ (for production)
- PowerShell 7+ (for management scripts)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd presence
   ```

2. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access the applications:**
   - Kiosk Interface: http://localhost:3000
   - Manager Dashboard: http://localhost:3001
   - Admin Panel: http://localhost:3002
   - API Documentation: http://localhost:8000/docs

### Production Deployment

1. **Deploy to Kubernetes:**
   ```powershell
   .\scripts\deploy.ps1 -Environment production
   ```

2. **Monitor the deployment:**
   ```powershell
   .\scripts\monitor.ps1 -Watch
   ```

3. **Create backups:**
   ```powershell
   .\scripts\backup.ps1
   ```

## 🔧 Configuration

### Environment Variables

#### Backend Configuration
```env
DATABASE_URL=postgresql://user:password@localhost:5432/presence
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_TOKEN=your-whatsapp-token
```

#### Frontend Configuration
```env
REACT_APP_API_URL=http://localhost:8000/api
```

### System Settings

Configure the following through the admin interface:
- **Late Threshold**: Monthly limit for late arrivals before claim generation
- **"Yom Lo Ba Li" Threshold**: Monthly limit for "didn't feel like it" absences
- **Court Chair Details**: Contact information for claim notifications
- **WhatsApp Integration**: API credentials and message templates

## 📊 Database Schema

### Core Tables
- **students**: Student information and status
- **attendance**: Daily attendance records
- **permanent_absences**: Recurring absence patterns
- **school_holidays**: School calendar holidays
- **settings**: System configuration
- **claims**: Automated claim generation
- **audit_log**: System activity tracking

### Key Relationships
- Students have multiple attendance records
- Students can have multiple permanent absences
- Claims are generated based on attendance patterns
- All changes are logged in the audit trail

## 🧪 Testing

### Run Tests
```bash
# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run specific test categories
pytest tests/unit/          # Unit tests
pytest tests/integration/   # Integration tests
pytest tests/e2e/          # End-to-end tests

# Run with coverage
pytest --cov=backend/app --cov-report=html
```

### Test Categories
- **Unit Tests**: Model validation, service logic, utilities
- **Integration Tests**: API endpoints, database operations
- **End-to-End Tests**: Complete user workflows

## 🔐 Security

### Authentication & Authorization
- Role-based access control (RBAC)
- Secure API endpoints
- Input validation and sanitization

### Data Protection
- Encrypted database connections
- Secure password handling
- Audit logging for all operations

### Network Security
- HTTPS/TLS encryption
- Network policies in Kubernetes
- Secure container configurations

## 📈 Monitoring & Observability

### Health Checks
- Application health endpoints
- Database connectivity checks
- External service availability

### Logging
- Structured logging with correlation IDs
- Centralized log aggregation
- Error tracking and alerting

### Metrics
- Application performance metrics
- Business metrics (attendance rates, claims)
- Infrastructure metrics

## 🔄 Business Processes

### Daily Workflow
1. **Morning Setup**: System automatically prepares daily attendance records
2. **Student Check-in**: Students use kiosk to check in
3. **Late Marking**: System automatically marks late arrivals after threshold
4. **Manager Oversight**: Managers monitor and adjust attendance as needed
5. **Reminders**: System sends WhatsApp reminders for non-reported students
6. **Day Closure**: System automatically closes day and marks absent students

### Monthly Processes
1. **Threshold Monitoring**: System tracks monthly late and "yom lo ba li" counts
2. **Claim Generation**: Automatic claims when students exceed thresholds
3. **Notifications**: WhatsApp notifications to parents and court chair
4. **Reporting**: Monthly statistics and analytics generation

## 🛠️ Management Scripts

### Deployment
```powershell
# Deploy to production
.\scripts\deploy.ps1 -Environment production

# Deploy to development
.\scripts\deploy.ps1 -Environment development -Namespace dev-presence
```

### Monitoring
```powershell
# One-time status check
.\scripts\monitor.ps1

# Continuous monitoring
.\scripts\monitor.ps1 -Watch -RefreshInterval 30
```

### Backup & Recovery
```powershell
# Create full backup
.\scripts\backup.ps1

# Database only backup
.\scripts\backup.ps1 -IncludeConfig:$false
```

### Undeployment
```powershell
# Remove application (keep data)
.\scripts\undeploy.ps1

# Complete removal (DANGEROUS)
.\scripts\undeploy.ps1 -DeleteNamespace -DeletePVCs -Force
```

## 🌐 API Documentation

### Interactive Documentation
- Swagger UI: `/docs`
- ReDoc: `/redoc`
- OpenAPI Spec: `/openapi.json`

### Key Endpoints
- **Students**: `/api/students` - CRUD operations
- **Attendance**: `/api/attendance` - Attendance management
- **Kiosk**: `/api/kiosk` - Check-in/out operations
- **Manager**: `/api/manager` - Management dashboard
- **Claims**: `/api/claims` - Claim management
- **Settings**: `/api/settings` - System configuration

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- Follow PEP 8 for Python code
- Use ESLint/Prettier for JavaScript/React
- Write comprehensive tests
- Document API changes
- Update README for significant changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- [API Documentation](http://localhost:8000/docs)
- [Management Scripts Guide](./scripts/README.md)
- [Requirements Document](./requirements.md)

### Getting Help
1. Check the troubleshooting section in script documentation
2. Review application logs using monitoring scripts
3. Check Kubernetes events and pod status
4. Contact the development team

### Common Issues
- **Database Connection**: Verify PostgreSQL pod status and credentials
- **WhatsApp Integration**: Check API token and endpoint configuration
- **Hebrew Display**: Ensure proper font support and RTL CSS
- **Performance**: Monitor resource usage and scale as needed

## 🎉 Acknowledgments

Built with modern technologies:
- **FastAPI** - High-performance Python web framework
- **React** - User interface library
- **PostgreSQL** - Reliable database system
- **Redis** - In-memory data structure store
- **Kubernetes** - Container orchestration platform
- **Helm** - Kubernetes package manager

Designed for educational institutions with love ❤️
