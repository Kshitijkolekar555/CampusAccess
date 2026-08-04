# CampusAccess: Smart Campus Operations & Access Management System (SCOAMS)

[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/JDK-21-orange.svg)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**CampusAccess** is an enterprise-grade digital access control, visitor pre-registration, faculty host tracking, student outpass management, security guard shift scheduling, and campus gate orchestration platform designed for educational institutions and corporate campuses.

Built with **Spring Boot 3 (Java 21)** and **React 18 (Vite + TypeScript + Tailwind CSS)**, CampusAccess replaces legacy paper registers with real-time digital check-ins, encrypted QR passes, instant watchlist screening, role-based dashboards, and automated email/SMS audit notifications.

---

## Table of Contents
1. [Executive Overview & Purpose](#executive-overview--purpose)
2. [Key Features & Modules](#key-features--modules)
3. [Digital QR Gate Pass System](#digital-qr-gate-pass-system)
4. [Roles & Permissions Matrix](#roles--permissions-matrix)
5. [System Architecture](#system-architecture)
6. [Teacher & Faculty Host Reflections](#teacher--faculty-host-reflections)
7. [System Notifications & Audit Log](#system-notifications--audit-log)
8. [Installation & Setup Guide](#installation--setup-guide)
9. [Pre-configured Default Credentials](#pre-configured-default-credentials)
10. [REST API Endpoint Directory](#rest-api-endpoint-directory)
11. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## Executive Overview & Purpose

Educational institutions manage hundreds of daily visitors, faculty members, delivery personnel, and thousands of residing students. Traditional paper logbooks at entrance gates introduce long queues, identity spoofing risk, lost records, and lack of real-time visibility for campus authorities.

**CampusAccess** solves these challenges by providing:
- **Instant Gate Check-in & Digital QR Passes**: Paperless visitor pre-registration and instant entrance logging.
- **Automated Blacklist / Watchlist Cross-Referencing**: Automatic screening of visitor mobile numbers and names against campus security watchlists.
- **Teacher & Faculty Host Visibility**: Live breakdown of visitors visiting specific teachers, department HODs, or administrative staff.
- **Student Gate Pass & Hostel Outpass Verification**: Automated workflow for student outpasses, warden approvals, and gate check-out validation.
- **Real-Time Guard Duty Terminal**: Dynamic guard shift dashboards polling live metrics on active visitors, vehicles, and campus traffic.
- **Centralized System Audit & Notifications**: Comprehensive trail of system events, email notifications, and automated retries for failed dispatches.

---

## Key Features & Modules

### 1. Visitor Management (`/visitors`)
- **Digital Registration**: Captures visitor name, mobile, purpose, host teacher/department, vehicle number, and photo ID.
- **Digital QR Gate Pass**: Generates a unique Base64 QR code (`PICT-VISITOR:<ID>:<Mobile>:<PassNumber>`) upon check-in.
- **Host Category Filtering**: Filter visitor logs by **Teachers / Faculty**, **Department HOD**, **Admin Staff**, **Students**, or **Vendors**.
- **1-Click Gate Exit**: Guards can check out visitors by scanning their QR pass, entering their Pass Number, or searching by mobile number.

### 2. Guard Duty Terminal & Shift Operations (`/guards` & `/shifts`)
- **Live Terminal Metrics**: Real-time stats on visitors entered/exited, active visitors inside, vehicles logged, and student passes processed.
- **Gate Duty Assignment**: Maps security guards to specific entrance locations (Main Gate, Hostel Gate, Back Gate).
- **Shift Roster Management**: Scheduling and tracking of morning, evening, and night guard shifts.

### 3. Student Gate Passes & Hostel Outpasses (`/student-passes` & `/hostel-outpasses`)
- **Outpass Applications**: Students submit outpass requests with destination, reason, out-time, and expected return time.
- **Hostel Warden Approval Workflow**: Wardens approve or reject outpasses with reason tracking.
- **Gate Verification**: Guards verify approved outpasses at the gate before allowing student exit/entry.

### 4. Vehicle & Vendor Entry Log (`/vehicles` & `/vendors`)
- **Vehicle Access Control**: Track student, staff, visitor, and delivery vehicles entering campus.
- **Inward Material Logs**: Vendor and delivery tracking for inward goods and campus services.

### 5. System Notifications & Audit Logs (`/notifications`)
- **Automated Dispatches**: Dispatches email alerts for outpass approvals, security alerts, and account creation.
- **Retry Mechanism**: Scheduled background cron job retries failed notification attempts automatically every 15 minutes.
- **Cross-Role Access**: Accessible to Admins, Security Officers, Guards, Wardens, and Staff.

---

## Digital QR Gate Pass System

### How the Visitor QR Pass Works:
1. **Pass Generation**: When a visitor is checked in by a guard or pre-registers online, the backend `VisitorMapper` creates a unique digital pass identifier (e.g., `PICT-PASS-000123`).
2. **Encrypted QR Payload**: The QR code encodes: `PICT-VISITOR:<VisitorID>:<MobileNumber>:<PassNumber>`.
3. **Verification & Exit**: At campus exit checkpoints, the security guard scans the visitor's QR code or inputs the pass number. The backend instantly validates the active status and logs the exit timestamp (`timeOut`).
4. **Reflection in Guard Panel**: Active visitors inside campus remain visible on both the Guard Duty Terminal and Admin Dashboard until checked out.

---

## Roles & Permissions Matrix

The system features **10 granular User Roles**. Below is the comparative permission matrix:

| Feature / Action | ADMIN | SECURITY_OFFICER | SECURITY_GUARD / GUARD | STAFF / FACULTY | HOSTEL_WARDEN | STUDENT | VISITOR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Dashboard** | Admin Control | Master View | Guard Terminal | Staff Portal | Warden View | Student View | Token View |
| **Visitor Check-In / Out** | ✅ | ✅ | ✅ | Check-In Only | ❌ | ❌ | Pre-register |
| **View Visitor Logs** | ✅ | ✅ | ✅ | Own Visitors | ❌ | ❌ | Own Pass |
| **Scan / Verify QR Pass** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Show Pass |
| **Guard Profile Config** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Shift Management** | ✅ | ✅ | View Shift | ❌ | ❌ | ❌ | ❌ |
| **User Account Control** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Approve Outpasses** | ✅ | ❌ | Verify Gate Exit | ❌ | ✅ | ❌ | ❌ |
| **Apply Outpass** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **View Notifications** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Staff Break Logging** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

### Frequently Asked Role Questions:
- **Is there only one Admin?**
  - **No.** The system initializes a default master administrator account (`admin`), but admins can create **unlimited Admin user accounts** via the User Management panel (`/users`).
- **What is the difference between Guard and Admin?**
  - **Admin**: Full administrative authority over users, gate configurations, shift rosters, system security policies, global analytics, and full audit logs.
  - **Guard**: Gate operations role focused on live visitor processing, QR verification, vehicle logging, and student outpass verification at entrance gates. Guards cannot alter user accounts or system setup.

---

## System Architecture

```
                                  [ Client Browser ]
                                          │
                            (HTTPS / REST APIs / JSON)
                                          │
                                          ▼
                       [ React 18 SPA (Vite + Tailwind CSS) ]
                                          │
                                          ▼
                      [ Spring Security 6 & JWT Filter Chain ]
                                          │
                                          ▼
                        [ REST Controllers (/api/v1/*) ]
                                          │
                                          ▼
                         [ Service Layer & Audit Logger ]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     [ Spring Data JPA Repositories ]               [ Async Notification Executor ]
                  │                                               │
                  ▼                                               ▼
         [ PostgreSQL DB ]                              [ JavaMail SMTP Server ]
```

---

## Teacher & Faculty Host Reflections

When visitors arrive to meet faculty members or department heads:
1. The host category is specified as **`FACULTY`** or **`HOD`** alongside their specific department (**CE, IT, ENTC, AIDS, AM, FE, AS, ADMIN**).
2. The **Visitor Management (`/visitors`)** table provides a **Host Category** filter allowing guards and administrators to filter for teacher visitors specifically.
3. The **Guard Terminal** and **Admin Dashboard** reflect real-time counts for **Faculty / Teacher Visitors** currently inside campus.

---

## System Notifications & Audit Log

The notification service handles automated communications across all campus operations:
- **Triggers**: Password resets, account creation, outpass approvals/rejections, security alerts, and visitor check-ins.
- **Asynchronous Execution**: Sent in non-blocking thread pools via `@Async("notificationExecutor")`.
- **Scheduled Retries**: An automatic background cron job runs every 15 minutes (`0 */15 * * * *`) to re-attempt failed email dispatches (up to 3 retries).
- **Access**: Available under `/notifications` for Admins, Security Officers, Guards, Wardens, and Staff.

---

## Installation & Setup Guide

### Prerequisites
- **Java JDK**: 21 or higher
- **Node.js**: v18.x or higher
- **Package Manager**: npm v9+
- **Database**: PostgreSQL 15+ (or Docker)

---

### Step 1: Database Setup (PostgreSQL)

Create a PostgreSQL database named `campusaccess_db`:

```sql
CREATE DATABASE campusaccess_db;
CREATE USER campus_user WITH ENCRYPTED PASSWORD 'campus_pass123';
GRANT ALL PRIVILEGES ON DATABASE campusaccess_db TO campus_user;
```

*Alternatively, run PostgreSQL via Docker:*

```bash
docker run --name campusaccess-postgres -e POSTGRES_DB=campusaccess_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

---

### Step 2: Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Verify `src/main/resources/application.properties` database settings:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/campusaccess_db
   spring.datasource.username=postgres
   spring.datasource.password=postgres
   spring.jpa.hibernate.ddl-auto=update
   ```
3. Build and run the Spring Boot application:
   ```bash
   ./mvnw clean spring-boot:run
   ```
   *The backend server starts on `http://localhost:8080`.*

---

### Step 3: Frontend Setup (React Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the local Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend web application runs at `http://localhost:5173`.*

---

## Pre-configured Default Credentials

The system automatically seeds demo accounts upon database startup:

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | Full system control & user management |
| **Security Guard** | `guard1` | `guard123` | Gate terminal check-ins & QR pass verification |
| **Staff / Faculty** | `staff1` | `staff123` | Faculty portal & staff break logging |
| **Hostel Warden** | `warden1` | `warden123` | Hostel outpass approvals |
| **Student** | `student1` | `student123` | Outpass applications & student portal |

---

## REST API Endpoint Directory

OpenAPI / Swagger documentation is available interactively when running the backend at:
`http://localhost:8080/swagger-ui.html`

### Key Endpoints Summary:

#### Authentication & Account (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Authenticate user and receive JWT access token.
- `POST /api/v1/auth/refresh`: Refresh expired JWT token.

#### Visitor Management (`/api/v1/visitors`)
- `POST /api/v1/visitors/check-in`: Register new visitor and generate QR pass.
- `POST /api/v1/visitors/check-out`: Log visitor departure by ID, pass code, or mobile.
- `GET /api/v1/visitors`: Paginated search with host category & department filtering.
- `GET /api/v1/visitors/inside`: List all active visitors currently on campus.

#### Dashboard & Monitoring (`/api/v1/dashboard`)
- `GET /api/v1/dashboard/admin`: Global KPI metrics, visitor traffic, and analytics.
- `GET /api/v1/dashboard/guard`: Guard self-duty terminal stats (polling every 10s).
- `GET /api/v1/dashboard/warden`: Hostel outpass statistics.

#### System Notifications (`/api/v1/notifications`)
- `GET /api/v1/notifications`: List notifications with status and date filters.
- `POST /api/v1/notifications/resend/{id}`: Trigger manual resend for failed alerts.

#### Hostel Outpasses (`/api/v1/hostel-outpasses`)
- `POST /api/v1/hostel-outpasses`: Submit new student outpass application.
- `PUT /api/v1/hostel-outpasses/{id}/approve`: Warden approval endpoint.
- `PUT /api/v1/hostel-outpasses/{id}/verify-exit`: Security guard exit logging.

---

## Troubleshooting & FAQs

### 1. Notifications Page Returns 403 Forbidden
* **Fix**: Ensure you are logged in as an authorized role (`ADMIN`, `SECURITY_OFFICER`, `SECURITY_GUARD`, `GUARD`, `STAFF`, or `HOSTEL_WARDEN`). All these roles are now explicitly granted access in both Spring Security `@PreAuthorize` and React Router layout.

### 2. QR Code Does Not Render
* **Fix**: Check that the visitor record contains valid data. QR Base64 string generation uses `QrCodeGenerator` with standard ZXing library.

### 3. Teachers / Faculty Visitor Logs Not Appearing
* **Fix**: Select **Teachers / Faculty** from the **Host Category** filter dropdown on the Visitors page (`/visitors`) to narrow logs specifically to faculty visitors.

---

*CampusAccess Security Orchestration System • Built with Spring Boot & React*
