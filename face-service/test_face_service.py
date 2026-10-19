import os
import cv2
import numpy as np
import app
import db

def create_synthetic_face_image(blur=False, brightness=128):
    """Generates a test image with high contrast landmarks resembling a face"""
    img = np.full((320, 320, 3), brightness, dtype=np.uint8)
    cv2.circle(img, (160, 160), 75, (210, 200, 190), -1)
    cv2.circle(img, (130, 140), 12, (20, 20, 20), -1) # left eye
    cv2.circle(img, (190, 140), 12, (20, 20, 20), -1) # right eye
    cv2.ellipse(img, (160, 195), (25, 10), 0, 0, 180, (40, 40, 120), -1) # mouth
    if blur:
        img = cv2.GaussianBlur(img, (25, 25), 0)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()

def test_models_and_health():
    print("[1/5] Testing Model Initialization & Health...")
    health = app.health_check()
    assert health["status"] == "UP"
    assert health["models_loaded"] is True
    print("  -> PASSED: YuNet & SFace models loaded successfully.")

def test_blur_and_quality_rejection():
    print("[2/5] Testing Quality Check (Blur & Exposure Rejection)...")
    blurred_bytes = create_synthetic_face_image(blur=True)
    nparr = np.frombuffer(blurred_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    q = app.check_image_quality(img_bgr)
    assert q["suitable"] is False, "Expected blurred image to be flagged as unsuitable"
    assert any("blurry" in issue.lower() for issue in q["issues"])
    print(f"  -> PASSED: Low quality correctly rejected (Issues: {q['issues']}, blur_score: {q['blur_score']}).")

def test_face_detection_and_embedding_extraction():
    print("[3/5] Testing Detection, Landmark Alignment & 128-D Embedding...")
    lena_path = os.path.join(os.path.dirname(__file__), "lena.jpg")
    with open(lena_path, "rb") as f:
        img_bytes = f.read()

    emb, q_info, num_faces = app.process_and_extract_face(img_bytes)
    assert num_faces >= 1, "Expected at least 1 detected face"
    assert emb is not None, "Expected valid embedding"
    assert emb.shape == (1, 128), f"Expected (1, 128) embedding shape, got {emb.shape}"
    norm = np.linalg.norm(emb)
    assert abs(norm - 1.0) < 1e-4, "Expected unit-normalized embedding"
    print(f"  -> PASSED: Detected {num_faces} face(s), extracted 128-D normalized embedding vector.")
    return emb, img_bytes

def test_first_time_vs_returning_visitor_lifecycle(emb):
    print("[4/5] Testing First-Time vs. Returning Visitor Lifecycle...")
    # Clean test DB
    conn = db.get_db_connection()
    conn.execute("DELETE FROM face_embeddings WHERE face_id LIKE 'test_%'")
    conn.commit()
    conn.close()

    # Step A: Query before enrollment -> must be unrecognised (First-Time Visitor)
    match_id, dist, is_ambig, match_type = db.find_best_match(emb, threshold=0.40)
    assert match_id is None, "New visitor should not match any registered visitor"
    print("  -> First-Time Visitor correctly classified as Unmatched.")

    # Step B: Enroll visitor with generated face_id
    test_face_id = "test_visitor_001"
    db.save_embedding(test_face_id, emb)
    print("  -> Enrolled test visitor embedding into biometric database.")

    # Step C: Returning visit with identical / minor variation frame
    match_id_returning, dist_ret, is_ambig_ret, match_type_ret = db.find_best_match(emb, threshold=0.40)
    assert match_id_returning == test_face_id, "Returning visitor should match enrolled record"
    assert dist_ret < 0.05, f"Expected near-zero distance on same subject, got {dist_ret}"
    sim_pct = (1.0 - dist_ret) * 100
    print(f"  -> Returning Visitor identified with {sim_pct:.2f}% similarity (Distance: {dist_ret:.4f}). PASSED!")

def test_false_match_rejection(emb):
    print("[5/5] Testing False-Match Rejection on Disparate Subjects...")
    # Generate 50 synthetic distinct facial feature vectors
    np.random.seed(42)
    false_matches = 0
    for i in range(50):
        fake_emb = np.random.randn(1, 128).astype(np.float32)
        fake_emb = fake_emb / np.linalg.norm(fake_emb)
        match_id, dist, is_ambig, match_type = db.find_best_match(fake_emb, threshold=0.40)
        if match_id is not None:
            false_matches += 1

    assert false_matches == 0, f"False match detected: {false_matches}/50 unmatched embeddings triggered positive"
    print(f"  -> Evaluated 50 non-matching subjects: 0 False Positives (False Match Rate: 0.0%). PASSED!")

if __name__ == "__main__":
    test_models_and_health()
    test_blur_and_quality_rejection()
    emb, _ = test_face_detection_and_embedding_extraction()
    test_first_time_vs_returning_visitor_lifecycle(emb)
    test_false_match_rejection(emb)
    print("\nAll 5 biometric verification suites passed with 100% success!")
