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
    emb_list = embedding.tolist()
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
        emb = np.array(json.loads(row["embedding"]), dtype=np.float32)
        result.append((face_id, emb))
    return result

def find_best_match(query_embedding: np.ndarray, threshold: float = 0.50):
    all_embeddings = get_all_embeddings()
    if not all_embeddings:
        return None, 1.0

    best_match_id = None
    min_distance = 1.0

    for face_id, stored_emb in all_embeddings:
        # Compute normalized Euclidean distance or cosine distance
        if len(query_embedding) != len(stored_emb):
            continue
        dist = float(np.linalg.norm(query_embedding - stored_emb))
        if dist < min_distance:
            min_distance = dist
            best_match_id = face_id

    if min_distance <= threshold and best_match_id is not None:
        return best_match_id, min_distance
    else:
        return None, min_distance
