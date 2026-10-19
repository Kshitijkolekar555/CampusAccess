# CampusAccess — Exhaustive Audit Issue Register & Diagnostic Report

This report catalogs all identified bugs, routing collisions, test failures, architectural desynchronizations, and deployment risks discovered during the end-to-end health audit of the **CampusAccess** platform.

---

## Issue Summary Matrix

| Issue ID | Module / Component | Severity | Category | Status |
| :--- | :--- | :---: | :--- | :---: |
| **ISSUE-01** | `HostelOutpassController.java` | **High** | Backend Routing Collision | **Confirmed** |
| **ISSUE-02** | `StudentGatePassController.java` | **High** | Backend Routing Collision | **Confirmed** |
| **ISSUE-03** | `AuthController.java` (`/verify-prn`) | **Medium** | API Contract Mismatch | **Confirmed** |
| **ISSUE-04** | `AuthServiceImplTest` & `DashboardServiceImplTest` | **Medium** | Unit Test Suite Regressions | **Confirmed** |
| **ISSUE-05** | Database Architecture (`H2` vs `SQLite`) | **Critical** | State Desynchronization & Data Loss | **Confirmed** |
| **ISSUE-06** | Frontend Webcam Components & Dev Server | **High** | Browser Security & Permissions | **Confirmed** |
| **ISSUE-07** | Spring Security Configuration (`application.yml`) | **High** | Security / Secret Exposure | **Confirmed** |
| **ISSUE-08** | Face Recognition Microservice (`app.py`) | **Medium** | Concurrency / SQLite File Locking | **Confirmed** |
| **ISSUE-09** | Face Recognition Microservice CORS (`app.py`) | **Low** | Security / Overly Permissive CORS | **Confirmed** |
| **ISSUE-10** | Spring Mail Configuration (`application.yml`) | **Low** | External Service Configuration | **Confirmed** |
| **ISSUE-11** | Face Embedding Identifier Linking | **Medium** | Biometric Identifier Mapping | **Confirmed** |
| **ISSUE-12** | Multi-Process Orchestration (`start-gate-station.bat`) | **Medium** | Startup & Process Lifecycle | **Confirmed** |

---

## Detailed Issue Catalog

---

### ISSUE-01: Path Variable Routing Collision on Hostel Outpasses
- **Issue ID:** `ISSUE-01`
- **Module Affected:** Backend — [HostelOutpassController.java](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/backend/src/main/java/com/pict/gatesecurity/controller/HostelOutpassController.java#L47-L55)
- **Problem Observed:** When an authenticated student client calls `GET /api/v1/hostel-outpasses/my-outpasses`, the server crashes with an HTTP 500 Internal Server Error instead of returning the student's outpass list.
- **Evidence:**
  ```text
  org.springframework.web.method.annotation.MethodArgumentTypeMismatchException:
  Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long';
  For input string: "my-outpasses"
    at org.springframework.beans.TypeConverterSupport.convertIfNecessary
    at org.springframework.web.method.annotation.AbstractNamedValueMethodArgumentResolver.resolveArgument
  ```
- **Likely vs. Confirmed Cause:** **Confirmed.** In `HostelOutpassController.java`, the generic `@GetMapping("/{id}")` endpoint precedes or conflicts with the literal endpoint `@GetMapping("/my-outpasses")`. Spring MVC interprets `"my-outpasses"` as the `{id}` parameter and fails while parsing it to a `Long`.
- **Severity:** **High**
- **Impact on Users / Deployment:** Students cannot view their active hostel passes from the student portal.
- **Recommended Fix:** Add regex numeric constraints to the ID endpoint:
  ```java
  @GetMapping("/{id:[0-9]+}")
  public ResponseEntity<HostelOutpassResponse> getOutpassById(@PathVariable Long id) { ... }
  ```
  and ensure `@GetMapping("/my-outpasses")` is distinctly routed.
- **Dependencies & Risks:** Low risk; purely a controller route clarification.

---

### ISSUE-02: Path Variable Routing Collision on Student Gate Passes
- **Issue ID:** `ISSUE-02`
- **Module Affected:** Backend — [StudentGatePassController.java](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/backend/src/main/java/com/pict/gatesecurity/controller/StudentGatePassController.java#L45-L53)
- **Problem Observed:** Calling `GET /api/v1/student-passes/my-passes` throws an HTTP 500 error.
- **Evidence:**
  ```text
  org.springframework.web.method.annotation.MethodArgumentTypeMismatchException:
  Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long';
  For input string: "my-passes"
  ```
- **Likely vs. Confirmed Cause:** **Confirmed.** Exactly identical to ISSUE-01. `@GetMapping("/{id}")` intercepts literal subpath requests such as `/my-passes`.
- **Severity:** **High**
- **Impact on Users / Deployment:** Students cannot fetch their pass history or QR tokens on their dashboards.
- **Recommended Fix:** Change `@GetMapping("/{id}")` to `@GetMapping("/{id:[0-9]+}")` or move `@GetMapping("/my-passes")` above it with distinct prefixing.
- **Dependencies & Risks:** Low risk.

---

### ISSUE-03: Inconsistent Request Binding in PRN Verification Endpoint
- **Issue ID:** `ISSUE-03`
- **Module Affected:** Backend — [AuthController.java](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/backend/src/main/java/com/pict/gatesecurity/controller/AuthController.java) (`POST /api/v1/auth/verify-prn`)
- **Problem Observed:** When the frontend client sends a JSON payload `{"prn": "F24ET034"}` in the request body, the backend rejects it with an HTTP 500 or HTTP 400 `MissingServletRequestParameterException`.
- **Evidence:** The controller method signature is currently:
  ```java
  @PostMapping("/verify-prn")
  public ResponseEntity<?> verifyPrn(@RequestParam String prn)
  ```
  rather than accepting `@RequestParam(required = false)` or an incoming JSON `@RequestBody PrnVerificationRequest request`.
- **Likely vs. Confirmed Cause:** **Confirmed.** The backend expects PRN as a URL query parameter (`?prn=...`) while standard POST requests pass JSON bodies.
- **Severity:** **Medium**
- **Impact on Users / Deployment:** Student registration fails at step 1 during PRN verification if invoked with standard JSON payloads.
- **Recommended Fix:** Accept both query parameter and JSON request body or encapsulate in a DTO `@RequestBody PrnVerifyRequest dto`.
- **Dependencies & Risks:** Minimal.

---

### ISSUE-04: Automated Unit Test Suite Regressions
- **Issue ID:** `ISSUE-04`
- **Module Affected:** Backend Tests — `AuthServiceImplTest.java` & `DashboardServiceImplTest.java`
- **Problem Observed:** Running `mvn test` fails with 4 test errors across authentication and dashboard services:
  1. `AuthServiceImplTest.login_shouldFailWhenDisabled`: expected `UnauthorizedException`, received `ResourceNotFoundException`.
  2. `DashboardServiceImplTest.getAdminDashboard_shouldReturnAllCounts`: expected count `10`, got `0`.
  3. `AuthServiceImplTest.login_shouldSucceed`: Mockito mock mismatch on `findFirstByUsernameIgnoreCase`.
  4. `AuthServiceImplTest.register_shouldSucceed`: NPE because `userRepository.saveAndFlush` is called rather than the mocked `userRepository.save`.
- **Evidence:**
  ```text
  [INFO] Results:
  [ERROR] Failures: 2, Errors: 2, Skipped: 0
  [ERROR] AuthServiceImplTest.login_shouldFailWhenDisabled:66
  [ERROR] DashboardServiceImplTest.getAdminDashboard_shouldReturnAllCounts:64
  ```
- **Likely vs. Confirmed Cause:** **Confirmed.** Service implementations were modernized (introducing `findFirstByUsernameIgnoreCase` and `saveAndFlush`), but test files were not updated to reflect the new repository methods.
- **Severity:** **Medium**
- **Impact on Users / Deployment:** Automated CI/CD build scripts (`mvn clean package`) fail, blocking automated release pipelines unless tests are skipped with `-DskipTests`.
- **Recommended Fix:** Update Mockito `when(...)` stubs in both test classes to reflect the actual method signatures invoked in the production code.
- **Dependencies & Risks:** Low risk; affects test suite only.

---

### ISSUE-05: Ephemeral In-Memory H2 vs. Persistent SQLite Desynchronization
- **Issue ID:** `ISSUE-05`
- **Module Affected:** Database Layer — `backend/src/main/resources/application-h2.yml` & `face-service/face_service.db`
- **Problem Observed:** The backend application is currently launched with `-Dspring-boot.run.profiles=h2`, storing all visitor records and passes in RAM. Every time the backend process stops or restarts, the entire visitor database is emptied. Meanwhile, the Python face recognition service writes facial embeddings to a persistent SQLite file on disk (`face_service.db`).
- **Evidence:** After restarting the backend, a visitor's face is recognized with high similarity (e.g. 83%), but the backend returns a 404 error because the visitor ID no longer exists in H2.
- **Likely vs. Confirmed Cause:** **Confirmed.** Disconnect between ephemeral backend storage and persistent microservice storage.
- **Severity:** **Critical**
- **Impact on Users / Deployment:** Complete loss of visitor passes, audit logs, and attendance records on server restarts, creating ghost records in the face recognition service.
- **Recommended Fix:** Switch backend startup profile from `h2` to `mysql` (connecting to the existing MySQL 8.0.44 instance on port `3306`).
- **Dependencies & Risks:** Requires verifying MySQL database schema creation and table initialization.

---

### ISSUE-06: Mobile Browser Camera Access Blocked over Unencrypted HTTP
- **Issue ID:** `ISSUE-06`
- **Module Affected:** Frontend — [VisitorWebcamModal.tsx](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/frontend/src/components/visitor/VisitorWebcamModal.tsx) and Guard Camera Views
- **Problem Observed:** Accessing the system from a mobile phone browser via `http://<LAN_IP>:3002` fails to activate the camera.
- **Evidence:** Modern browsers (Chrome, Safari, Edge) treat non-localhost HTTP origins as insecure contexts and completely disable `navigator.mediaDevices.getUserMedia`.
  Console error: `TypeError: Cannot read properties of undefined (reading 'getUserMedia')`.
- **Likely vs. Confirmed Cause:** **Confirmed.** Security restriction enforced by mobile browser operating systems.
- **Severity:** **High**
- **Impact on Users / Deployment:** Guards cannot use tablets or smartphones at gate checkpoints over the local area network.
- **Recommended Fix:** Configure an SSL certificate or enable Vite HTTPS development mode (`@vitejs/plugin-basic-ssl`) or deploy behind an HTTPS reverse proxy (Nginx / Caddy).
- **Dependencies & Risks:** Requires certificate installation or browser security exception on client devices.

---

### ISSUE-07: Hardcoded Default JWT Secret Key in Version Control
- **Issue ID:** `ISSUE-07`
- **Module Affected:** Security Configuration — [backend/src/main/resources/application.yml](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/backend/src/main/resources/application.yml#L20-L24)
- **Problem Observed:** The JWT HMAC-SHA key is hardcoded to a static string in source control:
  `local-dev-secret-key-at-least-256-bits-long-pad-if-needed`
- **Evidence:** Visible in plaintext in `application.yml`, `application-h2.yml`, and `application-mysql.yml`.
- **Likely vs. Confirmed Cause:** **Confirmed.** Default development configuration left unexternalized.
- **Severity:** **High**
- **Impact on Users / Deployment:** Anyone with read access to the repository can generate valid authentication tokens for any user (admin, guard, or student), completely bypassing security.
- **Recommended Fix:** Externalize secret to an environment variable:
  ```yaml
  security:
    jwt:
      secret: ${JWT_SECRET:default-must-be-changed-in-production}
  ```
- **Dependencies & Risks:** System administrators must supply the `JWT_SECRET` environment variable in production.

---

### ISSUE-08: SQLite Concurrency Lock Risk in Face Recognition Microservice
- **Issue ID:** `ISSUE-08`
- **Module Affected:** Face Microservice — [face-service/app.py](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/face-service/app.py)
- **Problem Observed:** The Python face microservice uses SQLite without Write-Ahead Logging (WAL) enabled and without connection pooling.
- **Evidence:** Connections are opened per request using `sqlite3.connect(DB_PATH)` with default rollback journal mode.
- **Likely vs. Confirmed Cause:** **Confirmed.** Under concurrent write operations (e.g., multiple visitor registrations enrolling facial photos simultaneously while guards are scanning), SQLite raises `sqlite3.OperationalError: database is locked`.
- **Severity:** **Medium**
- **Impact on Users / Deployment:** Intermittent 500 errors during peak gate entry hours.
- **Recommended Fix:** Add WAL mode and busy timeout during database initialization:
  ```python
  conn = sqlite3.connect(DB_PATH, timeout=10.0)
  conn.execute("PRAGMA journal_mode=WAL;")
  ```
- **Dependencies & Risks:** Low risk; standard SQLite best practice.

---

### ISSUE-09: Permissive CORS Wildcard in Face Recognition Microservice
- **Issue ID:** `ISSUE-09`
- **Module Affected:** Face Microservice — [face-service/app.py](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/face-service/app.py)
- **Problem Observed:** FastAPI microservice is configured with:
  ```python
  allow_origins=["*"]
  allow_credentials=True
  ```
- **Evidence:** Line in `app.py` directly enables any web origin to query the face service.
- **Likely vs. Confirmed Cause:** **Confirmed.** Overly permissive CORS intended for local development.
- **Severity:** **Low**
- **Impact on Users / Deployment:** Potential cross-site request forgery if browser clients communicate directly with the microservice.
- **Recommended Fix:** Restrict `allow_origins` to the specific backend and frontend host addresses.
- **Dependencies & Risks:** Low risk.

---

### ISSUE-10: Placeholder External Service Credentials (SMTP Mail)
- **Issue ID:** `ISSUE-10`
- **Module Affected:** Backend Configuration — [application.yml](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/backend/src/main/resources/application.yml)
- **Problem Observed:** Spring Mail is configured with mock credentials:
  ```yaml
  mail:
    host: smtp.gmail.com
    username: test@gmail.com
    password: testpass
  ```
- **Evidence:** Present in `application.yml`.
- **Likely vs. Confirmed Cause:** **Confirmed.** Placeholder configuration.
- **Severity:** **Low**
- **Impact on Users / Deployment:** When visitor approval or student registration notification triggers an email, Spring Mail throws authentication or connection exceptions in the background.
- **Recommended Fix:** Externalize mail credentials to environment variables or implement a mock mail provider for environments without an active SMTP server.
- **Dependencies & Risks:** Low risk.

---

### ISSUE-11: Face Embedding Identifier Linking Robustness
- **Issue ID:** `ISSUE-11`
- **Module Affected:** Integration — [VisitorServiceImpl.java](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/backend/src/main/java/com/pict/gatesecurity/service/impl/VisitorServiceImpl.java) & [FaceRecognitionServiceImpl.java](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/backend/src/main/java/com/pict/gatesecurity/service/impl/FaceRecognitionServiceImpl.java)
- **Problem Observed:** When enrolling a face, the face service generates an internal `face_id` string (e.g. `visitor_1792387071192_aef83a0f`). If the backend stores this as `faceEmbeddingId` but looks up the visitor solely by numeric `id`, a mismatch occurs if the mapping is broken.
- **Evidence:** Historical bug reports where "Exact match found" was reported by the camera, but the visitor card was empty. Currently mitigated by searching by both `faceEmbeddingId` and `id`, but needs unified validation.
- **Likely vs. Confirmed Cause:** **Confirmed.** Dual-identifier convention between Python microservice (string ID) and Spring Boot JPA entity (auto-increment `Long id`).
- **Severity:** **Medium**
- **Impact on Users / Deployment:** If a visitor's `faceEmbeddingId` column is null or desynchronized, camera matching fails to resolve the visitor record.
- **Recommended Fix:** Enforce a strict transactional guarantee that writes the Python `face_id` into `visitor.setFaceEmbeddingId()` upon successful enrollment.
- **Dependencies & Risks:** Low risk.

---

### ISSUE-12: Multi-Process Orchestration & Startup Order Fragility
- **Issue ID:** `ISSUE-12`
- **Module Affected:** Deployment Scripts — [start-gate-station.bat](file:///c:/Users/Trupti/Desktop/CampussAccess_updates/CampusAccess/start-gate-station.bat) & `docker-compose.yml`
- **Problem Observed:** `start-gate-station.bat` launches 3 separate command prompts asynchronously without verifying if dependencies are ready:
  1. Frontend (port 3002)
  2. Backend (port 8081)
  3. Face Service (port 8001)
- **Evidence:** If the backend starts faster than the face service or MySQL, initial health checks or early visitor recognition calls fail with socket connection errors.
- **Likely vs. Confirmed Cause:** **Confirmed.** Absence of startup readiness polling (`wait-for-it` or curl polling loops).
- **Severity:** **Medium**
- **Impact on Users / Deployment:** Inconvenience on system boot; guards opening the browser before the backend has finished initialization encounter network connection errors.
- **Recommended Fix:** Add startup readiness polling in the startup script or use Docker Compose with `depends_on: { condition: service_healthy }`.
- **Dependencies & Risks:** Low risk.

---

## Prioritized Remediation Roadmap

1. **Phase 1 (Critical):** Fix Spring Boot routes (ISSUE-01, ISSUE-02) and switch to MySQL persistence (ISSUE-05).
2. **Phase 2 (High):** Update unit tests to unblock builds (ISSUE-04), secure JWT tokens (ISSUE-07), and enable HTTPS (ISSUE-06).
3. **Phase 3 (Medium):** Enhance SQLite resilience (ISSUE-08), fix PRN input mapping (ISSUE-03), and harden startup orchestration (ISSUE-12).
4. **Phase 4 (Low):** Restrict CORS (ISSUE-09) and configure real SMTP credentials (ISSUE-10).
