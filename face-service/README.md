# CampusAccess Face Recognition Microservice

FastAPI microservice for visitor face detection, face embedding extraction, enrollment, and recognition.

## Requirements

- Python 3.9+
- pip

## Quick Start (Local Setup)

```bash
cd face-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

## API Endpoints

- `GET /health` - Service health check
- `POST /enroll` - Accepts multipart `file`, extracts face embedding, stores in SQLite DB, returns `{"faceId": "<uuid>"}`
- `POST /recognize` - Accepts multipart `file`, matches face against stored database embeddings, returns `{"matched": true/false, "faceId": "<uuid>", "distance": float}`
