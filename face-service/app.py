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

detector = None
recognizer = None

def init_models():
    global detector, recognizer
    if os.path.exists(YUNET_PATH) and os.path.exists(SFACE_PATH):
        try:
            # Score threshold: 0.70, NMS threshold: 0.30, top_k: 5000
            detector = cv2.FaceDetectorYN.create(YUNET_PATH, "", (320, 320), 0.70, 0.30, 5000)
            recognizer = cv2.FaceRecognizerSF.create(SFACE_PATH, "")
            logger.info("Successfully loaded OpenCV YuNet & SFace neural models!")
        except Exception as e:
            logger.error(f"Failed to load ONNX models: {e}")
    else:
        logger.warning("YuNet or SFace ONNX models not found in face-service root.")

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

    # 1. Blur check
    lap_var = cv2.Laplacian(roi, cv2.CV_64F).var()
    # 2. Illumination check
    mean_val = np.mean(roi)

    issues = []
    if lap_var < 35.0:
        issues.append("Image is too blurry. Please hold steady.")
    if mean_val < 40.0:
        issues.append("Lighting is too dark / underexposed. Please face the light.")
    elif mean_val > 220.0:
        issues.append("Lighting is overexposed / too bright.")

    if face_box is not None:
        if fw < 60 or fh < 60:
            issues.append("Face is too far from camera. Please move closer.")

    return {
        "suitable": len(issues) == 0,
        "blur_score": round(float(lap_var), 2),
        "brightness": round(float(mean_val), 2),
        "issues": issues
    }

def process_and_extract_face(image_bytes: bytes):
    """
    Decodes image, detects face with YuNet, aligns with SFace, and extracts 128-D embedding.
    Returns: (embedding, quality_info, num_faces)
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

    if detector is None or recognizer is None:
        raise HTTPException(status_code=503, detail="Face recognition neural models are not initialized")

    # Set dynamic input size for YuNet
    detector.setInputSize((iw, ih))
    _, faces = detector.detect(img_bgr)

    if faces is None or len(faces) == 0:
        # Check overall image illumination to give helpful guidance
        q_info = check_image_quality(img_bgr, None)
        return None, q_info, 0

    num_faces = len(faces)
    # Pick the largest face (closest to camera)
    best_face = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]

    q_info = check_image_quality(img_bgr, best_face)
    if not q_info["suitable"]:
        return None, q_info, num_faces

    # SFace Face alignment and 128-D feature extraction
    aligned_face = recognizer.alignCrop(img_bgr, best_face)
    embedding = recognizer.feature(aligned_face)

    # Unit-normalize embedding
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm

    return embedding, q_info, num_faces

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "neural-face-recognition-service",
        "models_loaded": detector is not None and recognizer is not None,
        "detector": "OpenCV YuNet (CNN)",
        "recognizer": "SFace (ResNet-like 128D Cosine)"
    }

@app.post("/enroll")
async def enroll_face(file: UploadFile = File(...)):
    """
    Enrolls a new face from a visitor photo.
    Returns unique faceId upon high-quality extraction.
    """
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

        matched_face_id, min_distance, is_ambiguous = db.find_best_match(embedding, threshold=threshold)
        similarity = round(1.0 - min_distance, 4)
        logger.info(f"Recognition: distance={min_distance:.4f}, similarity={similarity:.4f}, matched={matched_face_id}, ambiguous={is_ambiguous}")

        if matched_face_id and not is_ambiguous:
            return {
                "matched": True,
                "faceId": matched_face_id,
                "distance": round(float(min_distance), 4),
                "similarity": similarity,
                "numFaces": num_faces,
                "quality": q_info,
                "isAmbiguous": False
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
                "message": "First-time visitor. No matching registered face found."
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
