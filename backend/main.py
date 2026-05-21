import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv

from routers import predict, history, stats, consultation, management
from schemas.prediction import ErrorResponse
from utils.model_loader import load_all_models

# Load environment variables
load_dotenv()


# ─── Lifespan: Muat semua model ML saat startup ───────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: Load semua asset ML (model, scaler) ke memory.
    Shutdown: Cleanup (tidak diperlukan untuk in-memory models).
    """
    try:
        load_all_models()
    except FileNotFoundError as e:
        import logging
        logging.getLogger("uvicorn.error").critical(
            f"[STARTUP FAILED] {e}\n"
            "Salin file .pkl dari notebook ke backend/models/ dan backend/scalers/ "
            "sebelum menjalankan server."
        )
        # Tetap jalankan server — endpoint /predict akan return 503
    yield


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=os.getenv("APP_NAME", "Hippo Academy — YouTube Analytics API"),
    description=(
        "Backend API untuk prediksi performa YouTube, deteksi anomali views, "
        "AI Consultation berbasis RAG Hippo Academy, dan pengelolaan konten kreator."
    ),
    version=os.getenv("APP_VERSION", "2.0.0"),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(predict.router)
app.include_router(history.router)
app.include_router(stats.router)
app.include_router(consultation.router)
app.include_router(management.router)

# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    from utils.model_loader import _is_loaded
    return {
        "status": "ok",
        "models_loaded": _is_loaded,
        "version": os.getenv("APP_VERSION", "2.0.0"),
    }

# ─── Global Exception Handlers ────────────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error="HTTP Exception", detail=exc.detail).model_dump(mode="json"),
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(error="Validation Error", detail=str(exc.errors())).model_dump(mode="json"),
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("DEBUG", "False").lower() == "true",
    )
