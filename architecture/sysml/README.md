# SysML Architecture Diagrams

This directory contains SysML (Systems Modeling Language) architecture diagrams for the School Attendance System.

## Diagrams Overview

### 1. Block Definition Diagram (BDD)
**File:** `block-definition-diagram.puml`

Shows the structural decomposition of the system into blocks and their relationships. Defines:
- System components and their interfaces
- User interface blocks (Kiosk, Manager, Admin)
- Core service blocks (Attendance, Automation, Notification, etc.)
- Data layer and external system blocks
- Infrastructure blocks (Kubernetes, Helm)

### 2. Internal Block Diagram (IBD)
**File:** `internal-block-diagram.puml`

Shows the internal structure and connections between components:
- Frontend layer with different user interfaces
- API Gateway for request routing
- Application layer with REST APIs
- Business logic services
- Data access layer
- Deployment mapping to Kubernetes pods

### 3. Activity Diagram - Daily Automation
**File:** `activity-diagram-daily-automation.puml`

Models the daily automation business process:
- Morning permanent absence processing
- 09:30 WhatsApp reminder sending
- 10:00-10:30 automatic lateness marking
- 10:30+ automatic absence marking
- 16:00 automatic day closure
- Monthly statistics calculation
- Threshold checking and claims creation

### 4. Sequence Diagram - Student Check-in
**File:** `sequence-diagram-student-checkin.puml`

Shows the interaction flow for student check-in:
- Student search on kiosk tablet
- API calls through gateway
- Database operations
- Audit logging
- Response flow back to user

### 5. Sequence Diagram - Manager Override
**File:** `sequence-diagram-manager-override.puml`

Shows the manager override process:
- Daily attendance viewing
- Record editing and validation
- Override locking mechanism
- Audit trail creation
- Error handling for locked records

### 6. Deployment Diagram
**File:** `deployment-diagram.puml`

Shows the physical deployment architecture:
- Kubernetes cluster structure
- Pod distribution across namespaces
- Network connections and load balancing
- External service integrations (WhatsApp API)
- Monitoring setup (Prometheus, Grafana)

### 7. Data Model Diagram
**File:** `data-model-diagram.puml`

Shows the database schema and relationships:
- All database tables with fields and types
- Primary and foreign key relationships
- Unique constraints
- Enum value definitions
- Entity relationships and cardinalities

## Viewing the Diagrams

These diagrams are written in PlantUML format. To view them:

1. **VS Code Extension:** Install "PlantUML" extension
2. **Online Viewer:** Copy content to http://www.plantuml.com/plantuml/
3. **Local PlantUML:** Install PlantUML locally with Java

## Architecture Principles

The diagrams reflect the following architectural principles from the requirements:

- **Containerization:** All components run in Docker containers
- **Kubernetes Deployment:** Using Helm charts for orchestration
- **Microservices:** Separated concerns with dedicated services
- **Database-Centric:** PostgreSQL as primary data store
- **Automation-First:** Built-in scheduling and automation
- **Audit Trail:** Complete logging of all system changes
- **Override Capability:** Manager can override any automated decision
- **External Integration:** WhatsApp API for notifications

## Technology Stack

- **Frontend:** React.js with responsive design
- **Backend:** Python FastAPI
- **Database:** PostgreSQL
- **Container:** Docker
- **Orchestration:** Kubernetes + Helm
- **Monitoring:** Prometheus + Grafana
- **External API:** WhatsApp Business API