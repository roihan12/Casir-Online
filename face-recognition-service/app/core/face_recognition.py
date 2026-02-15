import numpy as np
from insightface.app import FaceAnalysis
from PIL import Image
import io
import cv2
from typing import Optional, Tuple, List
from pathlib import Path
from loguru import logger

from app.config.settings import settings


class FaceRecognitionService:
    """Service for face detection and recognition using InsightFace"""

    def __init__(self):
        self.model: Optional[FaceAnalysis] = None
        self._initialize_model()

    def _initialize_model(self):
        """Initialize the InsightFace model"""
        try:
            logger.info(f"Initializing face recognition model: {settings.FACE_MODEL}")

            # Initialize FaceAnalysis with buffalo_l model
            self.model = FaceAnalysis(
                name=settings.FACE_MODEL,
                providers=['CPUExecutionProvider']  # Use CUDAExecutionProvider if GPU available
            )

            # Prepare the model
            self.model.prepare(ctx_id=-1, det_size=(640, 640))  # ctx_id=-1 for CPU

            logger.info("Face recognition model initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize face recognition model: {e}")
            raise

    def detect_faces(self, image: np.ndarray) -> List[dict]:
        """
        Detect faces in an image

        Args:
            image: Input image as numpy array (BGR format)

        Returns:
            List of detected faces with attributes
        """
        try:
            # Detect faces
            faces = self.model.get(image)

            results = []
            for face in faces:
                results.append({
                    "bbox": face.bbox.tolist(),
                    "landmarks": face.landmark_2d_106.tolist(),
                    "det_score": float(face.det_score),
                    "embedding": face.embedding,
                    "age": int(face.age) if face.age is not None else None,
                    "gender": int(face.gender) if face.gender is not None else None,
                    "gender_label": "Male" if face.gender == 1 else "Female" if face.gender == 0 else "Unknown"
                })

            logger.info(f"Detected {len(results)} face(s)")
            return results

        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            raise

    def extract_embedding(self, image_data: bytes) -> dict:
        """
        Extract face embedding from image data

        Args:
            image_data: Image bytes

        Returns:
            Dict containing face embedding and metadata
        """
        try:
            # Convert bytes to numpy array
            image = self._bytes_to_image(image_data)

            # Detect face and extract embedding
            faces = self.detect_faces(image)

            if not faces:
                raise ValueError("No face detected in image")

            if len(faces) > 1:
                logger.warning(f"Multiple faces detected ({len(faces)}), using the first one")

            face = faces[0]

            # Check face quality
            if face["det_score"] < 0.7:
                raise ValueError(f"Face detection score too low: {face['det_score']:.3f}")

            return {
                "embedding": face["embedding"].tolist(),
                "bbox": face["bbox"],
                "landmarks": face["landmarks"],
                "det_score": face["det_score"],
                "age": face["age"],
                "gender": face["gender_label"]
            }

        except Exception as e:
            logger.error(f"Embedding extraction failed: {e}")
            raise

    def verify_faces(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray
    ) -> dict:
        """
        Compare two face embeddings

        Args:
            embedding1: First face embedding
            embedding2: Second face embedding

        Returns:
            Dict with match result and similarity score
        """
        try:
            # Calculate cosine similarity
            similarity = self._cosine_similarity(embedding1, embedding2)

            # Determine if match based on threshold
            is_match = similarity >= (1 - settings.SIMILARITY_THRESHOLD)

            result = {
                "is_match": is_match,
                "similarity": float(similarity),
                "distance": float(1 - similarity),
                "threshold": settings.SIMILARITY_THRESHOLD
            }

            logger.info(f"Face verification: similarity={similarity:.4f}, match={is_match}")

            return result

        except Exception as e:
            logger.error(f"Face verification failed: {e}")
            raise

    def verify_face_from_images(
        self,
        stored_embedding: List[float],
        new_image_data: bytes
    ) -> dict:
        """
        Verify a face from new image against stored embedding

        Args:
            stored_embedding: Stored face embedding
            new_image_data: New image bytes

        Returns:
            Verification result
        """
        try:
            # Extract embedding from new image
            result = self.extract_embedding(new_image_data)
            new_embedding = np.array(result["embedding"])

            # Convert stored embedding to numpy array
            stored_embedding_array = np.array(stored_embedding)

            # Verify faces
            return self.verify_faces(stored_embedding_array, new_embedding)

        except Exception as e:
            logger.error(f"Face verification from images failed: {e}")
            raise

    @staticmethod
    def _bytes_to_image(image_data: bytes) -> np.ndarray:
        """Convert bytes to numpy array (BGR format)"""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)

            # Decode to BGR image
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                raise ValueError("Failed to decode image")

            return image

        except Exception as e:
            logger.error(f"Image conversion failed: {e}")
            raise

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            dot_product = np.dot(a, b)
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)

            if norm_a == 0 or norm_b == 0:
                return 0.0

            return float(dot_product / (norm_a * norm_b))

        except Exception as e:
            logger.error(f"Cosine similarity calculation failed: {e}")
            raise


# Singleton instance
face_service = FaceRecognitionService()
