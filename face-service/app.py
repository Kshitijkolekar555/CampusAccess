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
    version="1.0.0"
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

# Load OpenCV Face Detector safely
face_cascade = None
try:
    local_xml = os.path.join(os.path.dirname(__file__), 'haarcascade_frontalface_default.xml')
    if os.path.exists(local_xml):
        face_cascade = cv2.CascadeClassifier(local_xml)
        logger.info(f"Loaded local CascadeClassifier from {local_xml}")
    elif hasattr(cv2, 'CascadeClassifier'):
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        if os.path.exists(cascade_path):
            face_cascade = cv2.CascadeClassifier(cascade_path)
            logger.info("Loaded CascadeClassifier from cv2.data.haarcascades")
except Exception as e:
    logger.warning(f"Could not initialize CascadeClassifier: {e}")

# Try importing face_recognition if available
HAVE_FACE_RECOGNITION = False
try:
    import face_recognition
    HAVE_FACE_RECOGNITION = True
    logger.info("dlib / face_recognition package is available and loaded.")
except ImportError:
    logger.info("face_recognition package not found. Using OpenCV facial feature extractor fallback.")


def extract_face_embedding(image_bytes: bytes) -> np.ndarray:
    """
    Extracts normalized facial embedding vector from image bytes.
    Uses face_recognition library if available; otherwise uses spatial & intensity representation.
    """
    # Load image with PIL / OpenCV
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        # Retry with PIL
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_rgb = np.array(pil_img)
            img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file format")
    else:
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    if HAVE_FACE_RECOGNITION:
        # Use face_recognition library
        boxes = face_recognition.face_locations(img_rgb)
        if not boxes and face_cascade is not None:
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
            if len(faces) > 0:
                x, y, w, h = faces[0]
                boxes = [(y, x + w, y + h, x)]
            else:
                h, w, _ = img_rgb.shape
                boxes = [(0, w, h, 0)]

        encodings = face_recognition.face_encodings(img_rgb, known_face_locations=boxes)
        if encodings:
            return encodings[0]

    # Fallback Feature Embedding Extraction
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    face_roi = None

    if face_cascade is not None and h > 0 and w > 0:
        try:
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))
            if len(faces) > 0:
                faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
                fx, fy, fw, fh = faces[0]
                face_roi = gray[fy:fy+fh, fx:fx+fw]
        except Exception as e:
            logger.warning(f"Cascade detection failed: {e}")

    if face_roi is None or face_roi.size == 0 or face_roi.shape[0] == 0 or face_roi.shape[1] == 0:
        if h > 0 and w > 0:
            cy, cx = h // 2, w // 2
            dw, dh = max(10, min(w, 200) // 2), max(10, min(h, 200) // 2)
            face_roi = gray[max(0, cy-dh):min(h, cy+dh), max(0, cx-dw):min(w, cx+dw)]
        else:
            face_roi = np.zeros((128, 128), dtype=np.uint8)

    if face_roi.size == 0 or face_roi.shape[0] == 0 or face_roi.shape[1] == 0:
        face_roi = np.zeros((128, 128), dtype=np.uint8)

    # Resize ROI to standard 128x128 grid
    face_resized = cv2.resize(face_roi, (128, 128))

    # Generate 128-dimensional normalized histogram / spatial embedding vector
    hist = cv2.calcHist([face_resized], [0], None, [128], [0, 256]).flatten()
    spatial = cv2.resize(face_resized, (16, 8)).flatten()

    combined = np.concatenate([hist, spatial]).astype(np.float32)
    norm = np.linalg.norm(combined)
    if norm > 0:
        combined = combined / norm

    return combined


@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "face-recognition-service",
        "have_face_recognition_lib": HAVE_FACE_RECOGNITION,
        "have_face_cascade": face_cascade is not None
    }


@app.post("/enroll")
async def enroll_face(file: UploadFile = File(...)):
    """
    Enroll a new face from photo upload. Returns a unique faceId.
    """
    try:
        contents = await file.read()
        embedding = extract_face_embedding(contents)
        face_id = str(uuid.uuid4())
        db.save_embedding(face_id, embedding)
        logger.info(f"Enrolled face successfully. Generated faceId: {face_id}")
        return {"faceId": face_id, "enrolled": True}
    except Exception as e:
        logger.error(f"Error during face enrollment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")


@app.post("/recognize")
async def recognize_face(
    file: UploadFile = File(...),
    threshold: float = Form(0.50)
):
    """
    Recognize a face from uploaded photo.
    Returns { "matched": true/false, "faceId": "...", "distance": 0.42 }
    """
    try:
        contents = await file.read()
        query_embedding = extract_face_embedding(contents)

        matched_face_id, min_distance = db.find_best_match(query_embedding, threshold=threshold)
        logger.info(f"Face recognition query completed. Best distance: {min_distance:.4f}, Matched faceId: {matched_face_id}")

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
    except Exception as e:
        logger.error(f"Error during face recognition: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
