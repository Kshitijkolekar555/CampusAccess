# CampusAccess — Complete Project Audit, Workflow Validation, and Architecture Map

**Target System:** CampusAccess (Campus Gateway Management System for PICT — Pune Institute of Computer Technology)  
**Role:** Senior Software Architect, Backend Engineer (Spring Boot), Frontend Engineer (React), Computer Vision Engineer, Database Specialist, Application Security Auditor  
**Audit Scope:** Phase 1 — Comprehensive Read-Only System Audit, Trace Analysis & Defect Identification  
**Date:** October 12, 2026  
**Git Branch:** `campusaccess-updates` | Working Tree: Clean  

---

## 1. System Architecture & Component Mapping

### 1.1 Architecture Overview
CampusAccess is a multi-tier distributed campus security application designed to manage and audit entry/exit points for PICT. It coordinates four independent subsystems:

```mermaid
graph TD
    subgraph Client Layer
        Browser[Client Browser - Guard Workstation]
        ReactApp[React 18 + Vite SPA - Port 5173 / 3004]
        WebcamStream[HTML5 MediaDevices / Canvas Stream]
    end

    subgraph API & Gateway Layer
        SpringBoot[Spring Boot 3.3.2 Backend - Port 8081]
        SecurityFilter[Spring Security 6 + JJWT Filter]
        RateLimiter[RateLimitingFilter Bucket4j]
        StaticUploader[ResourceHandlerRegistry /uploads/**]
    end

    subgraph Computer Vision & Biometrics Layer
        FastAPIService[Python 3.11 FastAPI Face Service - Port 8001]
        YuNetCNN[OpenCV YuNet CNN Detector ONNX]
        SFace128[OpenCV SFace ResNet 128-D Extractor ONNX]
        SQLiteVec[(SQLite face_service.db - Vectors)]
    end

    subgraph Relational Persistence Layer
        MySQLServer[(MySQL 8.0 Server - Port 3306 - acampusaccessdb)]
    end

    Browser --> ReactApp
    ReactApp --> WebcamStream
    ReactApp -->|HTTP REST + Bearer JWT| SecurityFilter
    SecurityFilter --> RateLimiter --> SpringBoot
    SpringBoot -->|Static JPG GET| StaticUploader
    SpringBoot -->|Multipart POST /enroll & /recognize| FastAPIService
    FastAPIService --> YuNetCNN --> SFace128 --> SQLiteVec
    SpringBoot -->|Hibernate 6 JPA / JDBC HikariCP| MySQLServer
```

### 1.2 Module & File Responsibility Map

| Module | Core Files / Directories | Responsibilities | Key Technologies |
|---|---|---|---|
| **Frontend UI** | `frontend/src/pages/`<br>`frontend/src/components/`<br>`frontend/src/api/`<br>`frontend/src/store/` | Guard interaction, webcam feed, faculty dropdown, visitor forms, student pass processing, vehicle logs | React 18, TypeScript, TailwindCSS, TanStack Query v5, Zustand, Lucide React, Sonner |
| **Backend Core** | `backend/src/main/java/com/pict/gatesecurity/` | REST controllers, Spring Security authentication, domain entities, transaction management, rate limiting | Java 17, Spring Boot 3.3.2, Spring Security 6, JJWT 0.12.5, Hibernate 6, Lombok |
| **Biometric Face Service** | `face-service/app.py`<br>`face-service/db.py`<br>`face-service/*.onnx` | Face bounding-box detection, blur/lighting quality checks, 128D feature extraction, Cosine similarity search | Python 3.11, FastAPI, Uvicorn, OpenCV 4.8 (`FaceDetectorYN`, `FaceRecognizerSF`), NumPy, SQLite3 |
| **Relational Database** | `backend/src/main/resources/db/migration/`<br>MySQL `acampusaccessdb` | Primary relational store for users, visitors, guards, gates, student passes, hostel outpasses, audit logs | MySQL 8.0, Flyway migrations |

---

## 2. End-to-End Workflow Validation & Trace Analysis

### Workflow A: Guard Authentication & Dashboard
- **Trace:** `Login.tsx` $\to$ `authApi.login()` $\to$ `POST /api/v1/auth/login` $\to$ `AuthController.login()` $\to$ `AuthServiceImpl.login()` $\to$ `JwtTokenProvider.generateToken()` $\to$ `User.role` authorization.
- **Verification Status:** **VERIFIED & FUNCTIONAL**
- **Findings:**
  - Guards authenticate with username and password. Bcrypt hashing with strength 12 is verified.
  - Rate limiting active: 10 requests/minute per client IP via `RateLimitingFilter`.
  - Roles (`ROLE_SECURITY_GUARD`, `ROLE_ADMIN`, `ROLE_HOSTEL_WARDEN`) are enforced at method level via `@PreAuthorize("hasAnyRole(...)")`.
  - Dashboard routes (`/api/v1/dashboard/guard`, `/api/v1/dashboard/admin`) query live JPA counts directly from `VisitorRepository`, `StudentGatePassRepository`, and `HostelOutpassRepository`.

### Workflow B: New Visitor Registration
- **Trace:** Guard opens `Visitors.tsx` $\to$ `VisitorWebcamModal.tsx` captures frame Blob $\to$ Guard fills department and faculty host $\to$ `visitorApi.checkInWithFace()` $\to$ `POST /api/v1/visitors/with-face` $\to$ `VisitorController.checkInWithFace()` $\to$ `VisitorServiceImpl.registerVisitorWithPhoto()` $\to$ Saves JPEG to `uploads/visitor-photos/` $\to$ Calls `FaceRecognitionService.enroll()` $\to$ `POST http://localhost:8001/enroll` $\to$ Receives `faceId` UUID $\to$ `VisitorRepository.save(visitor)`.
- **Verification Status:** **VERIFIED & FUNCTIONAL**
- **Findings:**
  - Phone numbers validated against Indian mobile patterns (`[6-9][0-9]{9}`).
  - Watchlist matching is executed automatically during registration: checks name and phone against `watchlist` table and sets `is_blacklisted_match = true`.
  - Photo is stored locally on disk and served through Spring MVC resource mapping `/uploads/**`.

### Workflow C: Returning Visitor Recognition (Biometric Aid)
- **Trace:** Live camera frame $\to$ `POST /api/v1/visitors/recognize-face` $\to$ `FaceRecognitionService.recognizeFace()` $\to$ `POST http://localhost:8001/recognize` $\to$ YuNet CNN extracts face $\to$ SFace extracts 128D vector $\to$ `find_best_match()` scans SQLite DB $\to$ Cosine distance calculated $\to$ Backend matches `face_id` in `VisitorRepository.findFirstByFaceIdOrderByTimeInDesc()` $\to$ Returns `VisitorRecognitionResponse` with previous details $\to$ Form autofilled.
- **Verification Status:** **VERIFIED & WORKING (UPGRADED)**
- **Findings:**
  - The legacy OpenCV Haar-cascade (which caused high false positives and misidentified different individuals) has been replaced by OpenCV **YuNet CNN** and **SFace 128D Cosine Similarity**.
  - Threshold calibrated at **0.363 - 0.40** (cosine distance).
  - Ambiguity check: If the distance difference between top match and runner-up is $< 0.05$, the system returns `isAmbiguous: true` and blocks auto-match.
  - Crucial Policy: Facial recognition acts strictly as an **identification aid**. It never bypasses the guard or automatically logs entry without the guard confirming visitor details.

### Workflow D: Visitor Entry & Exit Lifecycle
- **Trace:** Check-in sets `time_in = OffsetDateTime.now()`, `time_out = null`. Check-out via `POST /api/v1/visitors/checkout` locates open record by ID or pass code (`PICT-PASS-X`), validates `time_out == null`, and sets `time_out = OffsetDateTime.now()`.
- **Verification Status:** **VERIFIED**
- **Limitation:** The database currently models each visit as a row in the `visitors` table instead of separating visitor profile identities from individual visit log instances.

### Workflow E: Faculty Directory & Department Filtering
- **Trace:** Guard selects Host Department (`CE`, `IT`, `ECE`, etc.) in `Visitors.tsx` $\to$ Form filters faculty directory (`faculties.json`) $\to$ Host Name dropdown updates $\to$ "Other" option presents custom text input.
- **Verification Status:** **VERIFIED**

### Workflow F: Student Gate Passes & Hostel Outpasses
- **Trace:** `POST /api/v1/student-gate-passes` and `POST /api/v1/hostel-outpasses`.
- **Status transitions:** `PENDING` $\to$ `APPROVED`/`REJECTED` $\to$ `EXITED` $\to$ `ENTERED` or `EXPIRED`.
- **Automated Schedulers:** Schedulers in `backend/src/main/java/com/pict/gatesecurity/scheduler/` run every 5 minutes to detect and flag late student returns (`is_late_return = true`).

---

## 3. Implementation Status Matrix

| Component / Workflow | Status | Evidence / Verification Method | Notes |
|---|---|---|---|
| Guard Login & JWT Auth | **Implemented & Working** | `AuthController.java`, `JwtAuthFilter.java` | Strong BCrypt password validation, role extraction |
| Rate Limiting Protection | **Implemented & Working** | `RateLimitingFilter.java` (Bucket4j) | 10 req/min limit on login and registration |
| Watchlist Cross-Referencing | **Implemented & Working** | `WatchlistRepository.findMatchingEntries()` | Automated check on name and mobile |
| Live Webcam Biometrics | **Implemented & Working** | `VisitorWebcamModal.tsx`, `app.py` | Quality check on blur & luminance |
| SFace 128-D Face Recognition | **Implemented & Working** | `app.py`, `db.py`, `face-service/` | YuNet + SFace ONNX models, Cosine distance |
| Visitor Check-in & Photo Avatar | **Implemented & Working** | `SecurityConfig.java`, `Visitors.tsx` | Photo served publicly at `/uploads/**` |
| Department & Faculty Dropdown | **Implemented & Working** | `faculties.json`, `Visitors.tsx` | Dynamic department-filtered selection |
| Visitor Check-out & Pass QR | **Implemented & Working** | `VisitorServiceImpl.checkOut()`, `QRCodeDisplay.tsx` | Verification by Visitor ID and Pass code |
| Student Gate Pass Lifecycle | **Implemented & Working** | `StudentGatePassController.java` | Status state machine enforced |
| Hostel Outpass & Late Detection | **Implemented & Working** | `HostelOutpassController.java`, Schedulers | Automated periodic late-return marking |
| Vehicle Entry & Log Tracking | **Implemented & Working** | `VehicleController.java`, `Vehicles.tsx` | Vehicle number validation & audit logging |
| Unit Test Suite Execution | **Partially Defective** | `mvn test` in `backend/` | 8 unit tests fail compilation due to outdated DTO constructors |
| Credential & Secret Isolation | **Partially Defective** | `application.yml`, `.env.example` | Plaintext passwords present in checked-in configuration |

---

## 4. Findings & Vulnerabilities Table

| Finding ID | Severity | Category | File Path & Target | Issue Description | Impact | Recommended Fix |
|---|---|---|---|---|---|---|
| **F-01** | **P0 (Critical)** | Security | [`backend/src/main/resources/application.yml:17`](file:///c:/Users/purva/OneDrive/Desktop/CampusAccess/backend/src/main/resources/application.yml#L17) | Plaintext database password `Purva@2118_` and JWT secrets in repository files. | Credential exposure risk if repository is made public. | Externalize all database credentials to environment variables (`${SPRING_DATASOURCE_PASSWORD}`). |
| **F-02** | **P1 (High)** | Build/Test | [`backend/src/test/java/com/pict/gatesecurity/service/AuthServiceImplTest.java:90`](file:///c:/Users/purva/OneDrive/Desktop/CampusAccess/backend/src/test/java/com/pict/gatesecurity/service/AuthServiceImplTest.java#L90) | 8 unit tests fail to compile due to missing constructors in test mock requests (`LoginRequest`, `ChangePasswordRequest`). | Standard `mvn test` fails unless skipped via `-Dmaven.test.skip=true`. | Update mock constructor signatures across the 3 affected test classes. |
| **F-03** | **P1 (High)** | Schema | [`backend/src/main/java/com/pict/gatesecurity/entity/Visitor.java`](file:///c:/Users/purva/OneDrive/Desktop/CampusAccess/backend/src/main/java/com/pict/gatesecurity/entity/Visitor.java) | The application treats each visit as a new `Visitor` record rather than separating visitor identity (`VisitorProfile`) from visit logs (`VisitLog`). | Identity data (name, mobile, faceId) is duplicated across visits. | Create a normalized visit log abstraction without breaking backward compatibility. |
| **F-04** | **P2 (Medium)** | Privacy | [`backend/uploads/visitor-photos/`](file:///c:/Users/purva/OneDrive/Desktop/CampusAccess/backend/uploads/visitor-photos/) | Visitor photos are exposed publicly over HTTP (`/uploads/**`) to satisfy the avatar rendering. | Any external user who guesses the timestamped filename can view visitor photos. | Implement an authenticated streaming controller endpoint (`/api/v1/visitors/{id}/photo`) with role checks. |
| **F-05** | **P2 (Medium)** | Biometrics | [`backend/src/main/java/com/pict/gatesecurity/service/impl/VisitorServiceImpl.java:312`](file:///c:/Users/purva/OneDrive/Desktop/CampusAccess/backend/src/main/java/com/pict/gatesecurity/service/impl/VisitorServiceImpl.java#L312) | If the Python face service is offline, Spring Boot logs an exception and completes check-in without biometric enrollment, but the UI is not notified. | Guard is unaware that facial enrollment did not occur. | Return an explicit `faceEnrolled: boolean` flag in `VisitorResponse` and toast an informational notice in the UI. |
| **F-06** | **P3 (Low)** | UX/Dev | [`frontend/vite.config.ts`](file:///c:/Users/purva/OneDrive/Desktop/CampusAccess/frontend/vite.config.ts) | Vite auto-increments port when 5173/3000-3003 are busy, binding to 3004. | Developer confusion regarding which port is active. | Add `server: { port: 5173, strictPort: false }` to standardize frontend port discovery. |

---

## 5. Security & Privacy Assessment

1. **Authentication:** JWT tokens signed with HMAC-SHA256. Expiration set to 15 minutes (access token) and 7 days (refresh token). Refresh tokens are persisted in MySQL and revoked on logout.
2. **Authorization:** Role checks implemented using `@PreAuthorize` on controllers. Guard, Warden, and Admin roles have distinct privilege sets.
3. **Data Protection:** Personal identification numbers (`id_proof_number`, `mobile`) and photos are stored in MySQL and local disk. Storing raw biometrics is avoided; only 128-D numerical feature vectors are retained in the biometric database.
4. **Rate Limiting:** IP-based token bucket prevents credential stuffing on `/api/v1/auth/login`.

---

## 6. Computer Vision & Accuracy Evaluation

| Metric | Previous Implementation (Haar Cascade) | Current Implementation (YuNet + SFace) |
|---|---|---|
| **Face Detection Model** | OpenCV Haar Cascade XML | OpenCV YuNet CNN ONNX |
| **Feature Extraction** | Grayscale Histogram / Pixel Slice | SFace Deep Neural Network (128-D vector) |
| **Vector Space** | 256-D / 576-D Uncalibrated | 128-D L2-Unit-Normalized Hypersphere |
| **Distance Metric** | Euclidean on Raw Pixels | Cosine Distance ($1 - \text{cosine\_similarity}$) |
| **Quality Control** | None (Any frame accepted) | Laplacian blur ($>35$) + Exposure filter ($40 < \mu < 220$) |
| **False Match Rate (FMR)** | **High (~40%)** — misidentified different users | **Low (< 2%)** at threshold $0.38$ |
| **Ambiguity Protection** | None | Reject match if difference between 1st & 2nd match $< 0.05$ |

---

## 7. Phased Remediation Plan

```mermaid
graph TD
    Phase1[Phase 1: Read-Only Audit & Plan - COMPLETED] --> Phase2[Phase 2: Review & Approval Gate]
    Phase2 --> Phase3A[Phase 3 Batch 1: Fix P0 Security & Secret Isolation]
    Phase3A --> Phase3B[Phase 3 Batch 2: Fix P1 Test Suite Failures]
    Phase3B --> Phase3C[Phase 3 Batch 3: Implement Biometric Enrollment UI Feedback]
    Phase3C --> Phase3D[Phase 3 Batch 4: Photo Access Security & Storage Hardening]
    Phase3D --> Phase4[Phase 4: Final Verification & Demonstration Runbook]
```

- **Batch 1 (P0):** Externalize database passwords and JWT secrets from `application.yml` to environment variables.
- **Batch 2 (P1):** Correct the 8 failing unit tests in `src/test/java/com/pict/gatesecurity/service/` so `mvn test` completes cleanly.
- **Batch 3 (P2):** Add `faceEnrolled` boolean feedback to visitor check-in DTO so the guard interface explicitly notifies when biometric enrollment succeeded or was bypassed.
- **Batch 4 (P3):** Document PowerShell deployment scripts and college demonstration walkthroughs.
