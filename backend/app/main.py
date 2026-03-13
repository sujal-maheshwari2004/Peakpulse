from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "PeakPulse API",
    description = "AI-Powered Customer Intelligence Pipeline",
    version     = "1.0.0",
)


# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins     = [settings.CORS_ORIGIN, "https://peakpulse-pvzx.onrender.com"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(router, prefix="/api")


# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name":    "PeakPulse API",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/docs",
    }
