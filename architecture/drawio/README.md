# Draw.io Architecture Diagrams

This directory contains draw.io format architecture diagrams for the School Attendance System.

## Available Diagrams

### 1. Block Definition Diagram
**File:** `block-definition-diagram.drawio`

Shows the structural decomposition of the system:
- System components and their relationships
- User interface blocks (Kiosk, Manager, Admin)
- Core service blocks (Attendance, Automation, Notification, etc.)
- Data layer and external system blocks
- Infrastructure blocks (Kubernetes, Helm)

### 2. Deployment Diagram
**File:** `deployment-diagram.drawio`

Shows the physical deployment architecture:
- Kubernetes cluster structure with namespaces
- Pod distribution and services
- Network connections and load balancing
- External service integrations (WhatsApp API)
- Infrastructure components (Rancher Desktop)

### 3. Data Model Diagram
**File:** `data-model-diagram.drawio`

Shows the database schema and relationships:
- All database tables with fields and types
- Primary and foreign key relationships
- Unique constraints and enum definitions
- Entity relationships with cardinalities

### 4. Activity Diagram - Daily Automation
**File:** `activity-diagram-daily-automation.drawio`

Models the daily automation business process:
- School day validation
- Morning permanent absence processing
- Timed automation steps (09:30, 10:00-10:30, 16:00)
- Monthly statistics and threshold checking
- Claims creation and notifications

## How to Use

### Opening the Diagrams

1. **Online (Recommended):**
   - Go to https://app.diagrams.net/
   - Click "Open Existing Diagram"
   - Select the .drawio file from this directory

2. **VS Code Extension:**
   - Install "Draw.io Integration" extension
   - Open the .drawio file directly in VS Code

3. **Desktop Application:**
   - Download draw.io desktop app
   - Open the .drawio files directly

### Editing the Diagrams

- All diagrams are fully editable in draw.io
- Use the shape libraries and formatting tools
- Export to various formats (PNG, PDF, SVG, etc.)
- Save changes back to .drawio format

## Diagram Features

### Color Coding
- **Blue (dae8fc):** Main system components
- **Yellow (fff2cc):** User interface elements
- **Purple (e1d5e7):** Core services
- **Green (d5e8d4):** Data layer components
- **Orange (ffe6cc):** External systems
- **Gray (f5f5f5):** Infrastructure components
- **Red (f8cecc):** Critical processes/alerts

### Shapes Used
- **Rectangles:** Components and services
- **Cylinders:** Databases
- **Clouds:** External services
- **Diamonds:** Decision points
- **Ellipses:** Start/end points
- **Arrows:** Relationships and flow

## Architecture Alignment

These diagrams are consistent with:
- Requirements in `requirements.md`
- Deployment guidelines in `README.md`
- SysML diagrams in `../sysml/` directory

## Export Options

From draw.io, you can export to:
- **PNG/JPG:** For documentation and presentations
- **PDF:** For formal documentation
- **SVG:** For web integration
- **XML:** For programmatic processing
- **Visio:** For Microsoft environments