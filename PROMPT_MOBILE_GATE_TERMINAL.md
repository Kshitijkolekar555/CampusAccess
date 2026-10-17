# Production Implementation Prompt: Single Mobile Device Gate Terminal & Biometric System

Copy and paste the prompt below into any AI agent, coding assistant, or deployment script to execute or replicate the complete setup:

```markdown
Please implement and finalize the complete Single-Device Mobile Gate Terminal and Biometric Facial Recognition pipeline for CampusAccess:

### 1. Single Mobile Device Gate Operations (UX & Camera Hardware)
- Target Environment: Guard operating a single Android/iOS smartphone or tablet at the campus entry gate for both taking photos and filling visitor details.
- Rear Camera Defaulting:
  - In `frontend/src/components/visitor/VisitorWebcamModal.tsx`, detect mobile user agents (`/Mobi|Android|iPhone|iPad/i`) and default the video stream `facingMode` to `'environment'` (rear camera) with a fallback to `'user'`.
  - Maintain a one-tap "Front / Rear Cam" switch button for handheld flexibility.
- Native Mobile File / Camera Fallback:
  - In `Visitors.tsx` and `VisitorWebcamModal.tsx`, integrate a hidden `<input type="file" accept="image/*" capture="environment" />` fallback triggered whenever browser `getUserMedia` permissions are blocked or restricted on mobile browsers.
- Embedded Form Photo Management:
  - Inside the check-in modal in `frontend/src/pages/Visitors.tsx`, display a dedicated thumbnail preview of the attached photo.
  - If a photo was already captured during the facial scan, auto-attach it seamlessly so guards never have to re-photograph the visitor.
  - If the guard opened the form directly, provide a 1-tap "Take Photo" button that launches the camera modal or native mobile camera.

### 2. Best-of-3 Multi-Frame Capture & Blur Rejection
- In `frontend/src/utils/imageCompression.ts`:
  - Implement `calculateCanvasSharpness` using a gradient Laplacian variance approximation computed over a downsampled 160x120 patch (<5ms computation time).
  - Implement `captureBestOfNFrames` to sample 3 rapid frames across 200ms from the video stream, compare sharpness scores, and select the crispest frame to eliminate handheld shake and eye-blink artifacts.
  - Downscale the winning frame to a max bounding box of 800x800 at 0.78 quality (`image/jpeg`), reducing payload to ~60KB-80KB for fast 4G/gate Wi-Fi transmission.

### 3. Multi-Template Storage & Appearance-Shift Adaptation (Beards / Shaving / Glasses)
- Microservice Vector Engine (`face-service/db.py` & `app.py`):
  - Update `face_embeddings` table to support multiple 128-D embedding vectors per visitor `face_id` linked with an `appearance_tag` (e.g. 'standard', 'appearance_shift') and indexed on `face_id`.
  - In `find_best_match`, compare query vectors against all enrolled appearance templates for each subject and take the maximum cosine similarity.
  - Configure dual-threshold decision logic:
    - `similarity >= 0.65` (`distance <= 0.35`): Instant verified match.
    - `0.52 <= similarity < 0.65` (`0.35 < distance <= 0.48`): Flag as `appearance_shift` (e.g., beard growth, clean-shaven, glasses).
  - Dynamic Self-Learning: When an appearance-shift match is confirmed by the guard, automatically save the query embedding as an additional template for that `face_id` so future visits recognize both styles instantly.

### 4. Non-Face Database Lookup Fallback
- Backend Controller & Service (`VisitorController.java`, `VisitorServiceImpl.java`, `VisitorRepository.java`):
  - Expose `GET /api/v1/visitors/lookup/mobile?mobile={mobile}` (accessible by `SECURITY_GUARD`, `GUARD`, `ADMIN`).
  - Retrieve the most recent completed or active visitor profile for clean 10-digit Indian mobile numbers.
- Frontend Client Integration (`frontend/src/api/visitors.ts`, `VisitorWebcamModal.tsx`, `Visitors.tsx`):
  - Add `visitorApi.lookupByMobile(mobile: string)`.
  - In `VisitorWebcamModal.tsx`, when no face is recognized or when the guard toggles "Lookup by Mobile", render a 10-digit mobile lookup bar that immediately fetches visitor records.
  - In `Visitors.tsx`, bind `onBlur` of the Mobile Number field to query the database and auto-fill Visitor Name, ID Proof, Vehicle Number, and Host Department if the visitor has visited before.

### 5. Mobile Network Access & LAN Configuration
- Configure Vite (`frontend/vite.config.ts`) to serve on `host: '0.0.0.0'` and port `3002`.
- In `application.yml` and CORS configuration, ensure origins allow local campus LAN subnets (`http://192.168.*.*:3002`, `http://10.*.*.*:3002`).
- Verify clean compilation with `npx tsc --noEmit` and backend tests.
```
