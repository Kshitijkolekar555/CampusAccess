# CampusAccess — Complete System Workflow & Architecture Guide

This guide breaks down how the entire **CampusAccess Gate Security Platform** works from end to end in simple, practical terms.

---

## 1. High-Level Architecture (The 3 Core Pillars)

The platform is built with three specialized services collaborating in real-time:

```mermaid
graph LR
    subgraph Client ["1. Frontend (Vite + React)"]
        UI["Gate Terminal & Guard Dashboard (Port 3002)"]
        Cam["Webcam + Laplacian Sharpness Filter"]
    end

    subgraph Core ["2. Core Backend (Spring Boot)"]
        API["REST API & Security Policies (Port 8081)"]
        DB[(PostgreSQL / H2 Database)]
    end

    subgraph AI ["3. Biometric Engine (Python FastAPI)"]
        FastAPI["Face Microservice (Port 8001)"]
        ONNX["YuNet Face Detect + SFace (128-D Vectors)"]
        SQLite[(Multi-Template Vector DB)]
    end

    Cam -->|1. Compress 800x800 JPEG| UI
    UI -->|2. Multipart Photo / API Call| API
    API -->|3. Forward Image Bytes| FastAPI
    FastAPI -->|4. Detect & Match Embedding| ONNX
    ONNX <-->|5. Cosine Similarity Query| SQLite
    FastAPI -->|6. Return Match & Confidence| API
    API <-->|7. Visitor Records & Watchlist| DB
    API -->|8. Pre-filled Profile & Pass| UI
```

---

## 2. The Core Workflows Explained Simply

### Workflow A: Visitor Arrival & Check-In (Biometric-First)

When a visitor arrives at the PICT campus main gate:

```mermaid
sequenceDiagram
    autonumber
    actor Guard as Security Guard / Kiosk
    participant Web as Terminal UI (React)
    participant Spring as Core Backend (Spring Boot)
    participant FaceAI as Face Microservice (FastAPI)
    participant DB as System Database

    Guard->>Web: Clicks "Scan Face (Webcam)"
    Note over Web: Oval guide aligns visitor face.<br/>Takes 3 rapid frames across 200ms.<br/>Picks sharpest frame & compresses to ~70KB.
    Web->>Spring: POST /api/v1/visitors/recognize (photo)
    Spring->>FaceAI: POST /recognize (photo bytes)
    FaceAI->>FaceAI: Extract 128-D vector & check against stored templates
    
    alt Exact Match (Similarity >= 65%)
        FaceAI-->>Spring: matched=true, faceId=xxx (exact)
        Spring->>DB: Find latest visitor record by faceId
        DB-->>Spring: Visitor Name, Mobile, Host, Dept, Vehicle
        Spring-->>Web: Returning Visitor Profile
        Web-->>Guard: Green Badge: "Returning Visitor Recognised" -> 1-Click Check-In!
    else Appearance Shift (Beard / Glasses / Shaven: 52% to 64%)
        FaceAI-->>Spring: matched=true, matchType='appearance_shift'
        FaceAI->>FaceAI: Auto-enrolls this 2nd look as a new template!
        Spring-->>Web: Visitor Details + "Appearance Shift Detected"
        Web-->>Guard: Amber Alert: Guard verifies & confirms with 1 click.
    else No Face Match (First-time visitor)
        FaceAI-->>Spring: matched=false
        Spring-->>Web: matched=false
        Web-->>Guard: Prompt: "Lookup by Mobile" OR "Register New Visitor"
    end
```

---

### Workflow B: The Database Fallback (When Face Doesn't Match)

If a visitor is visiting again but the camera doesn't recognize them (e.g. heavy mask, bad lighting, or camera offline):

1. **Guard enters visitor's 10-digit mobile number** in the webcam popup or check-in form.
2. **Instant Lookup (`GET /api/v1/visitors/lookup/mobile?mobile=...`)**:
   - The backend searches the database for prior visits with that mobile number.
3. **Auto-Fill**:
   - The visitor's Name, Vehicle Number, ID Proof (Aadhaar/PAN), and previous Host Department are instantly auto-populated.
   - The guard only needs to ask: *"Are you visiting the same department today?"*, select gate pass type, and click **Submit**.
4. **New Photo Attachment**:
   - The photo captured during check-in is linked to this visitor's profile and enrolled into the AI facial database so the camera recognizes them next time!

---

### Workflow C: Digital Pass & Real-Time Checkout

1. **Pass Generation**:
   - Once admitted, a digital gate pass is issued with a unique QR code and pass number.
2. **Active Inside Tracking**:
   - The dashboard updates the **"Visitors Currently Inside Campus"** counter in real time.
3. **Checkout**:
   - When the visitor leaves through Gate 1 or Gate 2, the guard scans the QR code or clicks **Checkout**.
   - The system stamps the checkout time, calculates the total duration of the visit, and frees campus occupancy.

---

### Workflow D: Other Integrated Campus Operations

In addition to visitors, the system manages the rest of the campus ecosystem:

| Module | What It Does | Key Feature |
| :--- | :--- | :--- |
| **Hostel Outpasses** | Students apply for night/day outpasses approved digitally by Wardens. | Guards verify student PRN and digital outpass status before exit. Late alerts are flagged automatically. |
| **Vehicle Access & ANPR** | Campus staff, student, and visitor vehicles are cataloged with parking zones. | Blacklisted or unauthorized vehicles trigger instant guard alerts at the barrier gate. |
| **Security Watchlist** | Blacklisted individuals or barred contractors are tracked in the database. | Every check-in automatically cross-checks against the blacklist before a pass can be issued. |
| **Guard Duty Shifts** | Guards log check rounds, incidents, and shift handovers with automated timestamps. | Complete audit trail for security officers and campus administration. |

---

## 3. Summary of How Everything Connects

```
Visitor at Gate ──► Best-of-3 Camera Snap ──► AI Multi-Template Match
                          │                               │
             ┌────────────┴────────────┐                  ├─► Exact Match (>=65%): Auto-Fill
             ▼                         ▼                  ├─► Beard/Clean (52-65%): Auto-Learn
      Webcam Offline           Face Not Matched           └─► First Time: Guard Registers
             │                         │
             └────────► Mobile ◄───────┘
                     Lookup Fallback
                            │
                            ▼
                  Instant Database Fetch
                            │
                            ▼
                   1-Click Digital Pass
```
