import sqlite3
import json
import os
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def save_embedding(face_id: str, embedding: np.ndarray):
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    emb_list = embedding.tolist()
    cursor.execute(
        "INSERT INTO face_embeddings (face_id, embedding) VALUES (?, ?)",
        (face_id, json.dumps(emb_list))
    )
    conn.commit()
    conn.close()


def update_embedding(face_id: str, embedding: np.ndarray):
    """Update an existing face embedding (e.g. on re-enrollment)."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    emb_list = embedding.tolist()
    cursor.execute(
        "UPDATE face_embeddings SET embedding = ?, updated_at = CURRENT_TIMESTAMP WHERE face_id = ?",
        (json.dumps(emb_list), face_id)
    )
    conn.commit()
    conn.close()


def delete_embedding(face_id: str) -> bool:
    """Delete a face embedding. Returns True if deleted, False if not found."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM face_embeddings WHERE face_id = ?", (face_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def count_embeddings() -> int:
    """Return total number of enrolled faces."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM face_embeddings")
    count = cursor.fetchone()[0]
    conn.close()
    return count


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
        try:
            emb = np.array(json.loads(row["embedding"]), dtype=np.float32)
            result.append((face_id, emb))
        except Exception:
            pass
    return result


def find_best_match(query_embedding: np.ndarray, threshold: float = 0.45):
    """
    Find the closest matching face embedding using cosine similarity.

    Returns (face_id, distance) if distance <= threshold, else (None, min_distance).
    Cosine distance ranges 0 (identical) → 2 (opposite).
    Typical thresholds:
      - dlib/InsightFace:  0.40–0.50
      - OpenCV LBP:        0.55–0.65
    """
    all_embeddings = get_all_embeddings()
    if not all_embeddings:
        return None, 1.0

    best_match_id = None
    min_distance = 1.0

    q_norm = np.linalg.norm(query_embedding)
    query_normalized = query_embedding / q_norm if q_norm > 0 else query_embedding

    for face_id, stored_emb in all_embeddings:
        if len(query_embedding) != len(stored_emb):
            # Dimension mismatch — skip (happens if engine changed after enrollment)
            continue

        s_norm = np.linalg.norm(stored_emb)
        stored_normalized = stored_emb / s_norm if s_norm > 0 else stored_emb

        # Cosine distance: 1 - dot(a, b)   [both unit vectors]
        similarity = float(np.dot(query_normalized, stored_normalized))
        dist = float(max(0.0, 1.0 - similarity))

        if dist < min_distance:
            min_distance = dist
            best_match_id = face_id

    if min_distance <= threshold and best_match_id is not None:
        return best_match_id, min_distance
    return None, min_distance
