from fastapi import FastAPI

from app.api.v1 import router as api_router
from app.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(api_router)
