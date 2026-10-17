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
    title="CampusAccess Neural Face Recognition Microservice",
    description="High-accuracy microservice using OpenCV YuNet (detection) and SFace (128-D Deep Cosine Recognition)",
    version="2.1.0"
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

# Model file paths
YUNET_PATH = os.path.join(os.path.dirname(__file__), "face_detection_yunet_2023mar.onnx")
SFACE_PATH = os.path.join(os.path.dirname(__file__), "face_recognition_sface_2021dec.onnx")
HAAR_PATH = os.path.join(os.path.dirname(__file__), "haarcascade_frontalface_default.xml")

detector = None
recognizer = None
haar_cascade = None  # fallback when ONNX models are absent

def init_models():
    global detector, recognizer, haar_cascade

    # Try primary ONNX-based models first
    if os.path.exists(YUNET_PATH) and os.path.exists(SFACE_PATH):
        try:
            detector = cv2.FaceDetectorYN.create(YUNET_PATH, "", (320, 320), 0.70, 0.30, 5000)
            recognizer = cv2.FaceRecognizerSF.create(SFACE_PATH, "")
            logger.info("Loaded OpenCV YuNet & SFace ONNX models (full recognition mode).")
        except Exception as e:
            logger.error(f"Failed to load ONNX models: {e}")
    else:
        logger.warning("YuNet/SFace ONNX models not found — face recognition (embedding) unavailable.")

    # Always try to load the Haar cascade as a fallback face detector
    if os.path.exists(HAAR_PATH):
        try:
            haar_cascade = cv2.CascadeClassifier(HAAR_PATH)
            logger.info("Loaded Haar cascade fallback detector for face presence detection.")
        except Exception as e:
            logger.error(f"Failed to load Haar cascade: {e}")
    else:
        logger.warning("Haar cascade XML not found — face detection will be unavailable in fallback mode.")

init_models()

def check_image_quality(img_bgr: np.ndarray, face_box=None) -> dict:
    """
    Validates face image quality before recognition:
    - Blurriness via Laplacian variance
    - Exposure / lighting (mean luminance)
    - Face bounding box dimensions
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # If face bounding box is provided, assess the face region specifically
    if face_box is not None:
        fx, fy, fw, fh = map(int, face_box[:4])
        h, w = gray.shape
        fx = max(0, fx)
        fy = max(0, fy)
        fw = min(w - fx, fw)
        fh = min(h - fy, fh)
        if fw > 10 and fh > 10:
            roi = gray[fy:fy+fh, fx:fx+fw]
        else:
            roi = gray
    else:
        roi = gray

    # 1. Blur check (Tuned for real-world handheld mobile cameras: threshold 16.0)
    lap_var = cv2.Laplacian(roi, cv2.CV_64F).var()
    # 2. Illumination check
    mean_val = np.mean(roi)

    issues = []
    if lap_var < 16.0:
        issues.append("Image is too blurry. Please hold steady.")
    if mean_val < 30.0:
        issues.append("Lighting is too dark / underexposed. Please face the light.")
    elif mean_val > 235.0:
        issues.append("Lighting is overexposed / too bright.")

    if face_box is not None:
        if fw < 50 or fh < 50:
            issues.append("Face is too far from camera. Please move closer.")

    return {
        "suitable": len(issues) == 0,
        "blur_score": round(float(lap_var), 2),
        "brightness": round(float(mean_val), 2),
        "issues": issues
    }

def process_and_extract_face(image_bytes: bytes):
    """
    Decodes image, detects face, and extracts 128-D embedding (if ONNX models loaded).
    Falls back to Haar cascade for face-presence detection when ONNX unavailable.
    Returns: (embedding or None, quality_info, num_faces)
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_rgb = np.array(pil_img)
            img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file format")

    ih, iw, _ = img_bgr.shape

    # ── Path A: ONNX YuNet + SFace (full recognition) ─────────────────────────────
    if detector is not None and recognizer is not None:
        detector.setInputSize((iw, ih))
        _, faces = detector.detect(img_bgr)

        if faces is None or len(faces) == 0:
            q_info = check_image_quality(img_bgr, None)
            return None, q_info, 0

        num_faces = len(faces)
        best_face = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
        q_info = check_image_quality(img_bgr, best_face)

        # Proceed with embedding extraction if a clear face was detected;
        # only reject if severely unreadable (lap_var < 10.0 or no landmarks)
        lap_var = q_info.get("blur_score", 50.0)
        if lap_var < 10.0:
            return None, q_info, num_faces

        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) on L-channel
        # to normalize harsh shadows, direct sun exposure, and fluorescent gate lights
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l_chan, a_chan, b_chan = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_clahe = clahe.apply(l_chan)
        enhanced_bgr = cv2.cvtColor(cv2.merge((l_clahe, a_chan, b_chan)), cv2.COLOR_LAB2BGR)

        # Precise 5-point affine crop and alignment using enhanced luminance
        aligned_face = recognizer.alignCrop(enhanced_bgr, best_face)
        embedding = recognizer.feature(aligned_face)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        return embedding, q_info, num_faces

    # ── Path B: Haar cascade fallback (detect presence only, no embedding) ───────
    if haar_cascade is not None:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces_haar = haar_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
        )
        num_faces = len(faces_haar) if len(faces_haar) > 0 else 0
        q_info = check_image_quality(img_bgr, None)
        # Return None embedding — caller will report no match without 503
        return None, q_info, num_faces

    # No detection capability available at all
    raise HTTPException(
        status_code=503,
        detail="Face detection unavailable: neural models and Haar cascade not loaded"
    )

@app.get("/health")
def health_check():
    onnx_ready = detector is not None and recognizer is not None
    haar_ready = haar_cascade is not None
    mode = "full-onnx" if onnx_ready else ("haar-fallback" if haar_ready else "unavailable")
    return {
        "status": "UP",
        "service": "neural-face-recognition-service",
        "mode": mode,
        "models_loaded": onnx_ready,
        "onnx_models_loaded": onnx_ready,
        "haar_fallback_loaded": haar_ready,
        "recognition_capable": onnx_ready,
        "detection_capable": onnx_ready or haar_ready,
    }

@app.post("/enroll")
async def enroll_face(file: UploadFile = File(...)):
    """
    Enrolls a new face from a visitor photo.
    Requires ONNX models (YuNet + SFace) to be loaded — returns 503 in Haar-only fallback mode.
    """
    if detector is None or recognizer is None:
        raise HTTPException(
            status_code=503,
            detail="Face enrollment requires ONNX neural models (YuNet + SFace) which are not loaded. "
                   "Download face_detection_yunet_2023mar.onnx and face_recognition_sface_2021dec.onnx "
                   "into the face-service directory."
        )
    try:
        contents = await file.read()
        embedding, q_info, num_faces = process_and_extract_face(contents)

        if num_faces == 0:
            raise HTTPException(status_code=400, detail="No face detected in photo. Please ensure face is clearly visible.")
        if embedding is None:
            issue_str = ", ".join(q_info.get("issues", []))
            raise HTTPException(status_code=400, detail=f"Image quality insufficient for biometric enrollment: {issue_str}")

        face_id = str(uuid.uuid4())
        db.save_embedding(face_id, embedding)
        logger.info(f"Enrolled face successfully: faceId={face_id}")
        return {
            "faceId": face_id,
            "enrolled": True,
            "numFaces": num_faces,
            "quality": q_info
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during face enrollment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")

@app.post("/recognize")
async def recognize_face(
    file: UploadFile = File(...),
    threshold: float = Form(0.40)
):
    """
    Recognizes a face from captured camera photo.
    Returns:
    {
      "matched": bool,
      "faceId": str or null,
      "distance": float,
      "similarity": float,
      "numFaces": int,
      "quality": dict,
      "isAmbiguous": bool
    }
    """
    try:
        contents = await file.read()
        embedding, q_info, num_faces = process_and_extract_face(contents)

        if num_faces == 0:
            return {
                "matched": False,
                "faceId": None,
                "distance": 1.0,
                "similarity": 0.0,
                "numFaces": 0,
                "message": "No face detected in camera frame. Please face the camera.",
                "quality": q_info
            }

        if embedding is None:
            return {
                "matched": False,
                "faceId": None,
                "distance": 1.0,
                "similarity": 0.0,
                "numFaces": num_faces,
                "message": ", ".join(q_info.get("issues", ["Low image quality"])),
                "quality": q_info
            }

        matched_face_id, min_distance, is_ambiguous, match_type = db.find_best_match(embedding)
        similarity = round(1.0 - min_distance, 4)
        logger.info(f"Recognition: distance={min_distance:.4f}, similarity={similarity:.4f}, type={match_type}, matched={matched_face_id}, ambiguous={is_ambiguous}")

        if matched_face_id and not is_ambiguous:
            # If appearance shift confirmed (e.g. beard growth or shaved), auto-enroll new template for this faceId
            if match_type == 'appearance_shift':
                try:
                    db.save_embedding(matched_face_id, embedding, appearance_tag='appearance_shift')
                    logger.info(f"Auto-saved secondary appearance template for faceId={matched_face_id}")
                except Exception as ex:
                    logger.warning(f"Failed to auto-save secondary appearance template: {ex}")

            return {
                "matched": True,
                "faceId": matched_face_id,
                "distance": round(float(min_distance), 4),
                "similarity": similarity,
                "numFaces": num_faces,
                "quality": q_info,
                "isAmbiguous": False,
                "matchType": match_type,
                "message": "Appearance variation recognized (beard/glasses/shaven)" if match_type == 'appearance_shift' else "Exact facial match verified"
            }
        elif is_ambiguous:
            return {
                "matched": False,
                "faceId": matched_face_id,
                "distance": round(float(min_distance), 4),
                "similarity": similarity,
                "numFaces": num_faces,
                "quality": q_info,
                "isAmbiguous": True,
                "matchType": "ambiguous",
                "message": "Multiple registered visitors share similar facial similarity. Manual verification required."
            }
        else:
            return {
                "matched": False,
                "faceId": None,
                "distance": round(float(min_distance), 4),
                "similarity": similarity,
                "numFaces": num_faces,
                "quality": q_info,
                "isAmbiguous": False,
                "matchType": "none",
                "message": "First-time visitor or face not recognized. Auto-lookup available by mobile."
            }
    except Exception as e:
        logger.error(f"Error during face recognition: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")

@app.delete("/embedding/{face_id}")
async def delete_face_embedding(face_id: str):
    """
    Deletes a stored face embedding by faceId.
    Called when a visitor is deleted from the main system.
    """
    deleted = db.delete_embedding(face_id)
    if deleted:
        logger.info(f"Deleted face embedding for faceId={face_id}")
        return {"deleted": True, "faceId": face_id}
    else:
        raise HTTPException(status_code=404, detail=f"No embedding found for faceId={face_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
