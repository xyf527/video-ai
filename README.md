# AI Video Knowledge Assistant

Phase 01 provides the minimum local frontend and backend bootstrap.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
python -m compileall app
uvicorn app.main:app --reload
```

The health endpoint is `GET http://127.0.0.1:8000/api/v1/health`.

## Frontend

In another terminal:

```bash
cd frontend
npm install
npm run build
npm run dev
```

The frontend uses `VITE_API_BASE_URL` when provided. It defaults to
`http://127.0.0.1:8000/api/v1` and displays loading, success, and failure states
for the health request.
