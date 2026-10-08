import os
import uuid
import io
import logging
import numpy as np
import cv2
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("face-service")

app = FastAPI(
    title="CampusAccess Face Recognition Microservice",
    description="Microservice for visitor face detection, embedding extraction, enrollment, and recognition",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
db.init_db()

# ── Cascade Classifiers ──────────────────────────────────────────────────────
face_cascade = None
eye_cascade = None
profile_cascade = None

def _load_cascade(filename: str):
    local = os.path.join(os.path.dirname(__file__), filename)
    if os.path.exists(local):
        c = cv2.CascadeClassifier(local)
        if not c.empty():
            logger.info(f"Loaded cascade: {local}")
            return c
    if hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
        path = cv2.data.haarcascades + filename
        if os.path.exists(path):
            c = cv2.CascadeClassifier(path)
            if not c.empty():
                logger.info(f"Loaded cascade from cv2.data: {path}")
                return c
    logger.warning(f"Could not load cascade: {filename}")
    return None

face_cascade    = _load_cascade('haarcascade_frontalface_default.xml')
eye_cascade     = _load_cascade('haarcascade_eye.xml')
profile_cascade = _load_cascade('haarcascade_profileface.xml')

# ── Deep Learning Library Detection ─────────────────────────────────────────
HAVE_FACE_RECOGNITION = False
HAVE_INSIGHTFACE      = False

try:
    import face_recognition as fr_lib
    HAVE_FACE_RECOGNITION = True
    logger.info("dlib/face_recognition library loaded — HIGH ACCURACY MODE.")
except ImportError:
    logger.info("face_recognition not found.")

if not HAVE_FACE_RECOGNITION:
    try:
        import insightface
        from insightface.app import FaceAnalysis
        _insightface_app = FaceAnalysis(name='buffalo_sc', providers=['CPUExecutionProvider'])
        _insightface_app.prepare(ctx_id=0, det_size=(160, 160))
        HAVE_INSIGHTFACE = True
        logger.info("InsightFace library loaded — HIGH ACCURACY MODE.")
    except Exception as ie:
        logger.info(f"InsightFace not available: {ie}")


# ── Helper: decode image bytes → BGR ndarray ─────────────────────────────────
def _decode_image(image_bytes: bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_rgb = np.array(pil_img)
            img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file format")
    return img_bgr


# ── Helper: detect faces with multiple strategies ────────────────────────────
def _detect_face_roi(gray: np.ndarray, img_bgr: np.ndarray):
    """
    Multi-strategy frontal + profile face detection.
    Returns grayscale face ROI (or None on failure).
    """
    h, w = gray.shape

    # Strategy 1: standard frontal
    for (sf, mn, ms) in [(1.05, 3, 40), (1.1, 2, 30), (1.2, 1, 20)]:
        try:
            faces = face_cascade.detectMultiScale(
                gray, scaleFactor=sf, minNeighbors=mn,
                minSize=(ms, ms), flags=cv2.CASCADE_SCALE_IMAGE
            )
            if len(faces) > 0:
                faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
                fx, fy, fw, fh = faces[0]
                pad_x = int(fw * 0.15)
                pad_y = int(fh * 0.15)
                x1 = max(0, fx - pad_x)
                y1 = max(0, fy - pad_y)
                x2 = min(w, fx + fw + pad_x)
                y2 = min(h, fy + fh + pad_y)
                return gray[y1:y2, x1:x2]
        except Exception:
            pass

    # Strategy 2: profile face
    if profile_cascade is not None:
        try:
            faces = profile_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=2, minSize=(30, 30))
            if len(faces) > 0:
                fx, fy, fw, fh = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
                return gray[fy:fy+fh, fx:fx+fw]
        except Exception:
            pass

    # Strategy 3: equalize then retry frontal
    eq = cv2.equalizeHist(gray)
    try:
        faces = face_cascade.detectMultiScale(eq, scaleFactor=1.1, minNeighbors=2, minSize=(25, 25))
        if len(faces) > 0:
            fx, fy, fw, fh = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
            return gray[fy:fy+fh, fx:fx+fw]
    except Exception:
        pass

    # Fallback: centre crop (upper 60% likely to contain face)
    cy = int(h * 0.30)
    half = min(h, w) // 2
    return gray[max(0, cy - half // 2):min(h, cy + half // 2),
                max(0, w // 2 - half // 2):min(w, w // 2 + half // 2)]


# ── LBP helper ───────────────────────────────────────────────────────────────
def _compute_lbp(gray_img: np.ndarray) -> np.ndarray:
    padded = np.pad(gray_img, pad_width=1, mode='edge').astype(np.int32)
    center = padded[1:-1, 1:-1]
    lbp = np.zeros(gray_img.shape, dtype=np.uint8)
    for dy, dx, bit in [(-1,-1,0),(-1,0,1),(-1,1,2),(0,1,3),(1,1,4),(1,0,5),(1,-1,6),(0,-1,7)]:
        neighbor = padded[1+dy:padded.shape[0]-1+dy, 1+dx:padded.shape[1]-1+dx]
        lbp += ((neighbor >= center).astype(np.uint8) << bit)
    return lbp


# ── OpenCV-based embedding (fallback) ────────────────────────────────────────
def _opencv_embedding(img_bgr: np.ndarray) -> np.ndarray:
    """320-dim LBP + HOG-like embedding with alignment & CLAHE."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    face_roi = _detect_face_roi(gray, img_bgr)

    if face_roi is None or face_roi.size == 0:
        face_roi = gray

    # Resize to standard 128×128
    face_resized = cv2.resize(face_roi, (128, 128), interpolation=cv2.INTER_AREA)

    # Eye-based roll alignment
    if eye_cascade is not None:
        try:
            eyes = eye_cascade.detectMultiScale(face_resized[:80, :], scaleFactor=1.1,
                                                 minNeighbors=2, minSize=(12, 12))
            if len(eyes) >= 2:
                eyes = sorted(eyes, key=lambda e: e[0])[:2]
                (ex1,ey1,ew1,eh1), (ex2,ey2,ew2,eh2) = eyes[0], eyes[1]
                c1 = (ex1 + ew1/2.0, ey1 + eh1/2.0)
                c2 = (ex2 + ew2/2.0, ey2 + eh2/2.0)
                angle = np.degrees(np.arctan2(c2[1]-c1[1], c2[0]-c1[0]))
                if abs(angle) < 25.0:
                    M = cv2.getRotationMatrix2D((64, 64), angle, 1.0)
                    face_resized = cv2.warpAffine(face_resized, M, (128, 128),
                                                   flags=cv2.INTER_CUBIC,
                                                   borderMode=cv2.BORDER_REFLECT)
        except Exception:
            pass

    # CLAHE illumination normalization
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    norm_face = clahe.apply(face_resized)

    # 1. LBP histogram — 4×4 grid → 16 blocks × 32 bins = 512 dims
    lbp_map = _compute_lbp(norm_face)
    lbp_features = []
    bh, bw = 32, 32
    for r in range(4):
        for c in range(4):
            block = lbp_map[r*bh:(r+1)*bh, c*bw:(c+1)*bw]
            hist, _ = np.histogram(block, bins=32, range=(0, 256))
            hist = hist.astype(np.float32)
            n = np.linalg.norm(hist)
            if n > 0: hist /= n
            lbp_features.extend(hist)
    lbp_features = np.array(lbp_features, dtype=np.float32)  # 512

    # 2. HOG-like gradient (4-quadrant × 8 bins = 32 dims)
    gx = cv2.Sobel(norm_face, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(norm_face, cv2.CV_32F, 0, 1, ksize=3)
    mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)
    aq = (ang / 45.0).astype(np.uint8) % 8
    grad_features = []
    for r in range(2):
        for c in range(2):
            ab = aq[r*64:(r+1)*64, c*64:(c+1)*64]
            mb = mag[r*64:(r+1)*64, c*64:(c+1)*64]
            ah = np.array([np.sum(mb[ab == i]) for i in range(8)], dtype=np.float32)
            n = np.linalg.norm(ah)
            if n > 0: ah /= n
            grad_features.extend(ah)
    grad_features = np.array(grad_features, dtype=np.float32)  # 32

    # 3. Spatial intensity (8×4 = 32 dims)
    spatial = cv2.resize(norm_face, (8, 4), interpolation=cv2.INTER_AREA).flatten().astype(np.float32)
    n = np.linalg.norm(spatial)
    if n > 0: spatial /= n

    combined = np.concatenate([lbp_features, grad_features, spatial]).astype(np.float32)
    n = np.linalg.norm(combined)
    if n > 0: combined /= n
    return combined


# ── Main embedding extractor ─────────────────────────────────────────────────
def extract_face_embedding(image_bytes: bytes) -> np.ndarray:
    """
    Extracts the best available facial embedding vector.
    Priority: InsightFace > dlib face_recognition > OpenCV LBP fallback.
    """
    img_bgr = _decode_image(image_bytes)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # ── Priority 1: InsightFace (ArcFace 512-D)
    if HAVE_INSIGHTFACE:
        try:
            faces = _insightface_app.get(img_bgr)
            if faces:
                emb = faces[0].embedding.astype(np.float32)
                n = np.linalg.norm(emb)
                if n > 0: emb /= n
                logger.info(f"InsightFace embedding extracted ({len(emb)}-D)")
                return emb
            else:
                logger.warning("InsightFace found no face — falling through to next method")
        except Exception as e:
            logger.warning(f"InsightFace error: {e}")

    # ── Priority 2: dlib face_recognition (128-D ResNet)
    if HAVE_FACE_RECOGNITION:
        try:
            # Try HOG first, then CNN-like fallback via model='large'
            boxes = fr_lib.face_locations(img_rgb, model='hog', number_of_times_to_upsample=2)
            if not boxes:
                boxes = fr_lib.face_locations(img_rgb, model='hog', number_of_times_to_upsample=3)
            if not boxes and face_cascade is not None:
                gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
                detected = face_cascade.detectMultiScale(gray, 1.05, 3, minSize=(40, 40))
                if len(detected) > 0:
                    x, y, w, h = detected[0]
                    boxes = [(y, x + w, y + h, x)]
                else:
                    hh, ww, _ = img_rgb.shape
                    boxes = [(0, ww, hh, 0)]

            encodings = fr_lib.face_encodings(img_rgb, known_face_locations=boxes, num_jitters=2, model='large')
            if encodings:
                emb = encodings[0].astype(np.float32)
                n = np.linalg.norm(emb)
                if n > 0: emb /= n
                logger.info("dlib face_recognition embedding extracted (128-D)")
                return emb
        except Exception as e:
            logger.warning(f"face_recognition error: {e}")

    # ── Fallback: OpenCV LBP (576-D)
    logger.info("Using OpenCV LBP fallback embedding")
    return _opencv_embedding(img_bgr)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "face-recognition-service",
        "version": "2.0",
        "engine": (
            "InsightFace (ArcFace)" if HAVE_INSIGHTFACE
            else "dlib face_recognition" if HAVE_FACE_RECOGNITION
            else "OpenCV LBP"
        ),
        "have_face_cascade": face_cascade is not None and not face_cascade.empty(),
    }


@app.post("/enroll")
async def enroll_face(file: UploadFile = File(...)):
    """
    Enroll a new face from a photo upload.
    Returns a unique faceId that identifies this person's face embedding.
    For best accuracy, the photo should be a clear frontal face shot.
    """
    try:
        contents = await file.read()
        embedding = extract_face_embedding(contents)
        face_id = str(uuid.uuid4())

        # Check if a near-identical face already exists (prevents double-enrollment)
        existing_id, existing_dist = db.find_best_match(embedding, threshold=0.30)
        if existing_id:
            logger.info(f"Near-duplicate face detected during enrollment (dist={existing_dist:.4f}). "
                        f"Updating embedding for faceId={existing_id}")
            db.update_embedding(existing_id, embedding)
            return {"faceId": existing_id, "enrolled": True, "updated": True}

        db.save_embedding(face_id, embedding)
        logger.info(f"Enrolled new face. faceId={face_id}, embedding_dim={len(embedding)}")
        return {"faceId": face_id, "enrolled": True, "updated": False}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during face enrollment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")


@app.post("/recognize")
async def recognize_face(
    file: UploadFile = File(...),
    threshold: float = Form(0.45)
):
    """
    Recognize a face from an uploaded photo.
    
    Threshold guide (cosine distance — lower = more similar):
      - dlib/InsightFace: use 0.40–0.50  (default 0.45)
      - OpenCV LBP:       use 0.50–0.60  (auto-adjusted)
    
    Returns { "matched": bool, "faceId": str | null, "distance": float }
    """
    try:
        contents = await file.read()
        query_embedding = extract_face_embedding(contents)

        # Auto-adjust threshold for OpenCV fallback (less discriminative)
        effective_threshold = threshold
        if not HAVE_FACE_RECOGNITION and not HAVE_INSIGHTFACE:
            effective_threshold = min(threshold + 0.12, 0.65)

        matched_face_id, min_distance = db.find_best_match(query_embedding, threshold=effective_threshold)
        logger.info(
            f"Recognize: best_dist={min_distance:.4f}, threshold={effective_threshold:.2f}, "
            f"matched_id={matched_face_id}, engine={'dlib' if HAVE_FACE_RECOGNITION else 'insightface' if HAVE_INSIGHTFACE else 'opencv'}"
        )

        if matched_face_id:
            return {
                "matched": True,
                "faceId": matched_face_id,
                "distance": round(float(min_distance), 4)
            }
        else:
            return {
                "matched": False,
                "faceId": None,
                "distance": round(float(min_distance), 4)
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during face recognition: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


@app.delete("/face/{face_id}")
async def delete_face(face_id: str):
    """Remove a face embedding from the database."""
    try:
        deleted = db.delete_embedding(face_id)
        if deleted:
            return {"deleted": True, "faceId": face_id}
        raise HTTPException(status_code=404, detail=f"Face ID not found: {face_id}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
def get_stats():
    """Return database stats."""
    count = db.count_embeddings()
    return {"enrolledFaces": count}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
