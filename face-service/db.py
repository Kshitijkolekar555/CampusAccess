import sqlite3
import json
import os
import uuid
import numpy as np

DB_PATH = os.path.join(os.path.dirname(__file__), "face_service.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS face_embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            face_id TEXT UNIQUE NOT NULL,
            embedding TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_embedding(face_id: str, embedding: np.ndarray):
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    emb_list = embedding.flatten().tolist()
    cursor.execute(
        "INSERT INTO face_embeddings (face_id, embedding) VALUES (?, ?)",
        (face_id, json.dumps(emb_list))
    )
    conn.commit()
    conn.close()

def get_all_embeddings():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT face_id, embedding FROM face_embeddings")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        face_id = row["face_id"]
        raw = json.loads(row["embedding"])
        # Only load genuine 128-D SFace neural embeddings; ignore legacy histogram vectors
        if len(raw) == 128:
            emb = np.array(raw, dtype=np.float32).reshape(1, -1)
            result.append((face_id, emb))
    return result

def find_best_match(query_embedding: np.ndarray, threshold: float = 0.363):
    """
    Compares query_embedding against all stored embeddings using Cosine Similarity.
    For unit-norm embeddings, cosine_similarity = dot(A, B).
    Distance = 1.0 - cosine_similarity.
    A match occurs if distance <= threshold (i.e. similarity >= 1.0 - threshold).
    Standard threshold: 0.40 (similarity >= 0.60, or 0.363 recommended by SFace).
    Also detects ambiguous matches where the runner-up is too close to the top match.
    """
    all_embeddings = get_all_embeddings()
    if not all_embeddings:
        return None, 1.0, False

    best_match_id = None
    min_distance = 1.0
    second_min_distance = 1.0

    q_flat = query_embedding.flatten()
    q_norm = np.linalg.norm(q_flat)
    if q_norm > 0:
        q_flat = q_flat / q_norm

    for face_id, stored_emb in all_embeddings:
        s_flat = stored_emb.flatten()
        if len(q_flat) != len(s_flat):
            continue
        s_norm = np.linalg.norm(s_flat)
        if s_norm > 0:
            s_flat = s_flat / s_norm

        # Cosine similarity
        cos_sim = float(np.dot(q_flat, s_flat))
        # Clamp to [-1, 1]
        cos_sim = max(-1.0, min(1.0, cos_sim))
        dist = 1.0 - cos_sim

        if dist < min_distance:
            second_min_distance = min_distance
            min_distance = dist
            best_match_id = face_id
        elif dist < second_min_distance:
            second_min_distance = dist

    # Ambiguity check: if best and runner up are within 0.05 distance of each other and both below threshold
    is_ambiguous = False
    if min_distance <= threshold and (second_min_distance - min_distance) < 0.05 and second_min_distance <= threshold:
        is_ambiguous = True

    if min_distance <= threshold and best_match_id is not None and not is_ambiguous:
        return best_match_id, min_distance, False
    elif is_ambiguous:
        return best_match_id, min_distance, True
    else:
        return None, min_distance, False

def delete_embedding(face_id: str) -> bool:
    """
    Deletes a face embedding by face_id.
    Returns True if a record was deleted, False if not found.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM face_embeddings WHERE face_id = ?", (face_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
