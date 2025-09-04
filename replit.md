# School Attendance System

## Overview

This is a Hebrew-language school attendance management system designed for small schools (<100 students). The system provides a comprehensive solution with three main interfaces: a kiosk for student self-check-in, a manager dashboard for attendance monitoring, and an admin panel for system configuration. Students can check in and out without individual authentication using student numbers, nicknames, or names. The system automatically processes various attendance statuses and generates reports for school administrators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming, including RTL support for Hebrew
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API structure with organized route handlers
- **Middleware**: Custom logging middleware for API request tracking
- **Error Handling**: Centralized error handling with structured error responses

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless driver for cloud deployment
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema**: Well-structured schema with enums for status types, proper foreign key relationships, and unique constraints
- **Migrations**: Drizzle Kit for database schema migrations and version control

### Authentication and Authorization
- **Student Access**: Kiosk mode operates without authentication for easy student access
- **Manager Access**: Session-based authentication for administrative functions
- **Role-based Access**: Three distinct access levels (kiosk, manager, admin) with appropriate UI switching

### External Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Session Storage**: PostgreSQL session store using connect-pg-simple
- **UI Framework**: Radix UI for accessible component primitives
- **Fonts**: Google Fonts integration (Inter, Hebrew fonts) for proper Hebrew text rendering
- **Development Tools**: Replit-specific plugins for development environment integration
- **Date Handling**: date-fns library with Hebrew locale support for proper date formatting

### Key Features
- **Multi-interface Design**: Kiosk for students, manager dashboard for daily operations, admin panel for configuration
- **Hebrew Language Support**: Full RTL support with proper Hebrew date formatting and status translations
- **Automated Scheduling**: Background services for processing attendance rules, late marking, and day closure
- **Flexible Status System**: Comprehensive status tracking including present, absent, late, and various excuse types
- **Permanent Absences**: Support for recurring weekly absences with proper scheduling
- **Claims System**: Automated claim generation for attendance violations with management workflow
- **Export Functionality**: CSV export capabilities for attendance reporting
- **Real-time Updates**: Live attendance updates with automatic refresh capabilities

### Database Schema Design
The system uses a normalized schema with proper relationships:
- **Students**: Core student information with unique identifiers
- **Attendance**: Daily attendance records with comprehensive status tracking
- **Permanent Absences**: Weekly recurring absence patterns
- **School Holidays**: System-wide holiday management
- **Claims**: Automated violation tracking and management
- **Audit Log**: Complete action history for accountability
- **Settings**: Configurable system parameters

The architecture emphasizes type safety, maintainability, and scalability while providing a user-friendly interface for Hebrew-speaking users in an educational environment.