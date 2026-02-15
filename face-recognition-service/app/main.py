from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from loguru import logger
import sys
from contextlib import asynccontextmanager

from app.config.settings import settings
from app.api.routes import face


# Configure loguru
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting Face Recognition Service...")
    logger.info(f"Model: {settings.FACE_MODEL}")
    logger.info(f"Liveness detection: {'enabled' if settings.LIVENESS_ENABLED else 'disabled'}")

    yield

    # Shutdown
    logger.info("Shutting down Face Recognition Service...")


# Create FastAPI application
app = FastAPI(
    title=settings.API_NAME,
    version=settings.API_VERSION,
    lifespan=lifespan
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation error",
            "errors": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc)
        }
    )


# Include routers
app.include_router(face.router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.API_NAME,
        "version": settings.API_VERSION,
        "status": "running"
    }


# Startup event to log configuration
@app.get("/info")
async def info():
    """Get service information"""
    return {
        "service": settings.API_NAME,
        "version": settings.API_VERSION,
        "model": settings.FACE_MODEL,
        "liveness_enabled": settings.LIVENESS_ENABLED,
        "similarity_threshold": settings.SIMILARITY_THRESHOLD,
        "endpoints": {
            "register": "POST /api/face/register",
            "verify": "POST /api/face/verify",
            "liveness_check": "POST /api/face/liveness/check",
            "liveness_video": "POST /api/face/liveness/check-video",
            "health": "GET /api/face/health"
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
