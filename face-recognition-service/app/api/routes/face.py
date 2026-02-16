from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.security import APIKeyHeader
from typing import Optional, List
from pydantic import BaseModel, Field
from loguru import logger


from app.core.face_recognition import face_service
from app.core.anti_spoofing import liveness_service
from app.config.settings import settings
import numpy as np
import cv2


# API Key authentication
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Depends(API_KEY_HEADER)):
    """Verify API key for authentication"""
    if api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )
    return api_key


# Pydantic models for request/response
class FaceVerifyRequest(BaseModel):
    stored_embedding: List[float] = Field(..., description="Stored face embedding")


class LivenessCheckRequest(BaseModel):
    landmarks: Optional[List[List[float]]] = Field(None, description="Facial landmarks (optional)")


class EmbeddingResponse(BaseModel):
    success: bool
    embedding: List[float]
    bbox: List[float]
    landmarks: List[List[float]]
    det_score: float
    age: Optional[int]
    gender: Optional[str]
    message: str


class VerifyResponse(BaseModel):
    success: bool
    is_match: bool
    similarity: float
    distance: float
    threshold: float
    message: str


class LivenessResponse(BaseModel):
    success: bool
    is_live: bool
    liveness_score: float
    texture_score: Optional[float] = None
    quality_score: Optional[float] = None
    lighting_score: Optional[float] = None
    blink_detected: Optional[bool] = None
    threshold: float
    frames_analyzed: Optional[int] = None
    details: Optional[dict] = None
    message: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool


# Create router
router = APIRouter(prefix="/api/face", tags=["face"])


@router.post("/register", response_model=EmbeddingResponse, status_code=status.HTTP_200_OK)
async def register_face(
    image: UploadFile = File(..., description="Face image file"),
    user_id: str = Form(..., description="User ID for logging"),
    api_key: str = Depends(verify_api_key)
):
    """
    Extract face embedding from an image for registration

    This endpoint detects a face in the uploaded image and extracts
    the face embedding for storage. Returns the embedding vector.
    """
    try:
        logger.info(f"Face registration request for user: {user_id}")

        # Validate image
        if not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Read image data
        image_data = await image.read()

        # Check file size
        if len(image_data) > settings.MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image too large. Maximum size: {settings.MAX_IMAGE_SIZE / 1024 / 1024}MB"
            )

        # Extract embedding
        result = face_service.extract_embedding(image_data)

        logger.info(f"Face registration successful for user: {user_id}")

        return EmbeddingResponse(
            success=True,
            embedding=result["embedding"],
            bbox=result["bbox"],
            landmarks=result["landmarks"],
            det_score=result["det_score"],
            age=result["age"],
            gender=result["gender"],
            message="Face embedding extracted successfully"
        )

    except ValueError as e:
        logger.warning(f"Face registration failed for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Face registration error for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during face registration"
        )


@router.post("/verify", response_model=VerifyResponse, status_code=status.HTTP_200_OK)
async def verify_face(
    image: UploadFile = File(..., description="Face image to verify"),
    stored_embedding: str = Form(..., description="Stored face embedding as JSON array"),
    user_id: str = Form(..., description="User ID for logging"),
    api_key: str = Depends(verify_api_key)
):
    """
    Verify a face against a stored embedding

    This endpoint extracts the face embedding from the uploaded image
    and compares it with the stored embedding to verify identity.
    """
    try:
        logger.info(f"Face verification request for user: {user_id}")

        # Validate image
        if not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Read image data
        image_data = await image.read()

        # Parse stored embedding (JSON string)
        import json
        embedding_array = json.loads(stored_embedding)

        if not isinstance(embedding_array, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="stored_embedding must be a JSON array"
            )

        # Verify face
        result = face_service.verify_face_from_images(embedding_array, image_data)

        message = (
            "Face verified successfully" if result["is_match"]
            else "Face does not match"
        )

        logger.info(f"Face verification for user {user_id}: {message}, similarity={result['similarity']:.4f}")

        return VerifyResponse(
            success=True,
            is_match=result["is_match"],
            similarity=result["similarity"],
            distance=result["distance"],
            threshold=result["threshold"],
            message=message
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON format for stored_embedding"
        )
    except ValueError as e:
        logger.warning(f"Face verification failed for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Face verification error for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during face verification"
        )


@router.post("/liveness/check", response_model=LivenessResponse, status_code=status.HTTP_200_OK)
async def check_liveness(
    image: UploadFile = File(..., description="Face image for liveness check"),
    api_key: str = Depends(verify_api_key)
):
    """
    Check liveness of a face image

    This endpoint performs various checks to determine if the image
    is from a live person or a spoof (photo, screen, etc.)
    """
    try:
        logger.info("Liveness check request")

        # Validate image
        if not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Read image data
        image_data = await image.read()

        # Check file size
        if len(image_data) > settings.MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image too large. Maximum size: {settings.MAX_IMAGE_SIZE / 1024 / 1024}MB"
            )

        # Perform liveness detection
        result = liveness_service.detect_liveness_from_image(image_data)

        message = (
            "Liveness verified - image appears to be from a live person"
            if result["is_live"]
            else "Liveness check failed - possible spoof detected"
        )

        logger.info(f"Liveness check: {message}, score={result['liveness_score']:.3f}")

        return LivenessResponse(
            success=True,
            is_live=result["is_live"],
            liveness_score=result["liveness_score"],
            texture_score=result.get("texture_score"),
            quality_score=result.get("quality_score"),
            lighting_score=result.get("lighting_score"),
            blink_detected=None,
            threshold=result["threshold"],
            details=result.get("details"),
            message=message
        )

    except Exception as e:
        logger.error(f"Liveness check error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during liveness check"
        )


@router.post("/liveness/check-video", response_model=LivenessResponse, status_code=status.HTTP_200_OK)
async def check_liveness_video(
    images: List[UploadFile] = File(..., description="Multiple video frames"),
    api_key: str = Depends(verify_api_key)
):
    """
    Check liveness from multiple video frames with blink detection

    This endpoint analyzes multiple frames to detect natural eye blinks
    and other liveness indicators. More accurate than single-frame check.
    """
    try:
        logger.info(f"Multi-frame liveness check with {len(images)} frames")

        if len(images) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 3 frames required for video liveness check"
            )

        if len(images) > 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 30 frames allowed"
            )

        # Read all images and extract landmarks
        frames = []
        landmarks_list = []

        for img in images:
            if not img.content_type.startswith("image/"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="All files must be images"
                )
            frame_data = await img.read()

            if len(frame_data) > settings.MAX_IMAGE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="One or more images exceed maximum size"
                )

            frames.append(frame_data)
            
            # Extract landmarks for this frame
            try:
                # We need to convert bytes to numpy array for face service
                nparr = np.frombuffer(frame_data, np.uint8)
                image_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                # Detect face to get landmarks
                faces = face_service.detect_faces(image_np)
                if faces:
                    # Use the first face found
                    landmarks_list.append(faces[0]["landmarks"])
                else:
                    landmarks_list.append([]) # No face detected in this frame
            except Exception as e:
                logger.warning(f"Failed to extract landmarks for frame: {e}")
                landmarks_list.append([])

        # Perform liveness detection with landmarks
        result = liveness_service.detect_liveness_from_frames(frames, landmarks_list)

        message = (
            f"Liveness verified - blink detected: {result['blink_detected']}"
            if result["is_live"]
            else "Liveness check failed - possible spoof detected"
        )

        logger.info(f"Multi-frame liveness: {message}, score={result['liveness_score']:.3f}")

        return LivenessResponse(
            success=True,
            is_live=result["is_live"],
            liveness_score=result["liveness_score"],
            texture_score=result.get("avg_texture_score"),
            quality_score=result.get("quality_score"),
            lighting_score=result.get("lighting_score"),
            blink_detected=result.get("blink_detected"),
            threshold=result["threshold"],
            frames_analyzed=result.get("frames_analyzed"),
            details=None,
            message=message
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multi-frame liveness check error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during liveness check"
        )


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint

    Returns the service status and model availability.
    """
    try:
        model_loaded = face_service.model is not None

        return HealthResponse(
            status="healthy" if model_loaded else "unhealthy",
            service=settings.API_NAME,
            version=settings.API_VERSION,
            model_loaded=model_loaded
        )

    except Exception as e:
        logger.error(f"Health check error: {e}")
        return HealthResponse(
            status="unhealthy",
            service=settings.API_NAME,
            version=settings.API_VERSION,
            model_loaded=False
        )
