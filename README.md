# AI Video Knowledge Assistant

Phase 01 provides the minimum runnable FastAPI backend and React frontend.

## Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e '.[test]'
.venv/bin/uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

## Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite. The page calls `/api/v1/health` through the development proxy and displays loading, success, or failure state. Set `VITE_API_BASE_URL` when the backend is hosted at a different origin.

Production build:

```bash
npm run build
```
