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
            face_id TEXT NOT NULL,
            embedding TEXT NOT NULL,
            appearance_tag TEXT DEFAULT 'standard',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Migration: add appearance_tag if table existed before multi-template upgrade
    cursor.execute("PRAGMA table_info(face_embeddings)")
    cols = [row[1] for row in cursor.fetchall()]
    if 'appearance_tag' not in cols:
        cursor.execute("ALTER TABLE face_embeddings ADD COLUMN appearance_tag TEXT DEFAULT 'standard'")

    # Index for fast multi-template lookup
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_face_embeddings_face_id ON face_embeddings (face_id)")
    conn.commit()
    conn.close()

def save_embedding(face_id: str, embedding: np.ndarray, appearance_tag: str = 'standard'):
    """
    Saves an embedding. Supports multiple embeddings per face_id (e.g. clean-shaven, beard, glasses).
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    emb_list = embedding.flatten().tolist()
    cursor.execute(
        "INSERT INTO face_embeddings (face_id, embedding, appearance_tag) VALUES (?, ?, ?)",
        (face_id, json.dumps(emb_list), appearance_tag)
    )
    conn.commit()
    conn.close()

def get_all_embeddings():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT face_id, embedding, appearance_tag FROM face_embeddings")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        face_id = row["face_id"]
        raw = json.loads(row["embedding"])
        # Only load genuine 128-D SFace neural embeddings; ignore legacy histogram vectors
        if len(raw) == 128:
            emb = np.array(raw, dtype=np.float32).reshape(1, -1)
            result.append((face_id, emb, row["appearance_tag"]))
    return result

def find_best_match(query_embedding: np.ndarray, threshold: float = 0.35, appearance_shift_threshold: float = 0.48):
    """
    Compares query_embedding against all stored multi-template embeddings using Cosine Similarity.
    
    Dual-threshold classification:
    - distance <= threshold (similarity >= 0.65): High-confidence instant match.
    - threshold < distance <= appearance_shift_threshold (0.52 <= similarity < 0.65):
      Classified as 'appearance_shift' (e.g. beard growth, clean-shaven, glasses variation).
      System flags for guard confirmation and dynamically registers new appearance template.
    - distance > appearance_shift_threshold: First-time visitor.
    """
    all_embeddings = get_all_embeddings()
    if not all_embeddings:
        return None, 1.0, False, 'none'

    best_match_id = None
    min_distance = 1.0
    second_min_distance = 1.0
    best_tag = 'standard'

    q_flat = query_embedding.flatten()
    q_norm = np.linalg.norm(q_flat)
    if q_norm > 0:
        q_flat = q_flat / q_norm

    # 1. Group stored embeddings by subject (face_id) to accurately compare against individuals
    subject_templates: dict[str, list[np.ndarray]] = {}
    for face_id, stored_emb, tag in all_embeddings:
        s_flat = stored_emb.flatten()
        if len(q_flat) != len(s_flat):
            continue
        s_norm = np.linalg.norm(s_flat)
        if s_norm > 0:
            s_flat = s_flat / s_norm
        subject_templates.setdefault(face_id, []).append(s_flat)

    if not subject_templates:
        return None, 1.0, False, 'none'

    # 2. For each subject, find their best template match (maximum cosine similarity)
    subject_scores = []
    for face_id, templates in subject_templates.items():
        min_subj_dist = 1.0
        for t in templates:
            cos_sim = float(np.dot(q_flat, t))
            cos_sim = max(-1.0, min(1.0, cos_sim))
            dist = 1.0 - cos_sim
            if dist < min_subj_dist:
                min_subj_dist = dist
        subject_scores.append((face_id, min_subj_dist))

    # Sort by closest match
    subject_scores.sort(key=lambda x: x[1])

    best_match_id, min_distance = subject_scores[0]
    second_min_distance = subject_scores[1][1] if len(subject_scores) > 1 else 1.0

    # Ambiguity check: ONLY triggers if match is outside exact threshold (> threshold)
    # and two candidates have virtually identical borderline scores
    is_ambiguous = False
    if len(subject_scores) > 1 and min_distance > threshold and min_distance <= appearance_shift_threshold:
        if (second_min_distance - min_distance) < 0.01 and second_min_distance <= appearance_shift_threshold:
            is_ambiguous = True

    if not is_ambiguous:
        if min_distance <= threshold:
            return best_match_id, min_distance, False, 'exact'
        elif min_distance <= appearance_shift_threshold:
            return best_match_id, min_distance, False, 'appearance_shift'

    if is_ambiguous:
        return best_match_id, min_distance, True, 'ambiguous'

    return None, min_distance, False, 'none'

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
