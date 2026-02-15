import numpy as np
import cv2
from scipy.spatial.distance import euclidean
from typing import List, Dict, Optional
from loguru import logger
from PIL import Image
import io

from app.config.settings import settings


class LivenessDetector:
    """Service for detecting liveness to prevent photo spoofing"""

    # Eye landmarks (68-point model indices)
    LEFT_EYE_INDICES = [36, 37, 38, 39, 40, 41]
    RIGHT_EYE_INDICES = [42, 43, 44, 45, 46, 47]

    def __init__(self):
        self.ear_threshold = settings.BLINK_THRESHOLD
        self.consec_frames = settings.BLINK_CONSEC_FRAMES
        self.texture_threshold = settings.TEXTURE_THRESHOLD
        self.liveness_threshold = settings.LIVENESS_THRESHOLD

    def detect_liveness_from_image(
        self,
        image_data: bytes,
        landmarks: Optional[List[List[float]]] = None
    ) -> dict:
        """
        Detect liveness from a single image

        Args:
            image_data: Image bytes
            landmarks: Optional facial landmarks (106 points from InsightFace)

        Returns:
            Liveness detection result
        """
        try:
            # Convert image to numpy array
            image = self._bytes_to_image(image_data)

            # Perform multiple liveness checks
            texture_score = self._analyze_texture(image)
            quality_score = self._analyze_image_quality(image)
            lighting_score = self._analyze_lighting(image)

            # Calculate overall liveness score
            # Combine multiple factors for better accuracy
            liveness_score = (
                texture_score * 0.5 +
                quality_score * 0.3 +
                lighting_score * 0.2
            )

            is_live = liveness_score >= self.liveness_threshold

            result = {
                "is_live": is_live,
                "liveness_score": float(liveness_score),
                "texture_score": float(texture_score),
                "quality_score": float(quality_score),
                "lighting_score": float(lighting_score),
                "threshold": self.liveness_threshold,
                "details": {
                    "texture_pass": texture_score >= 0.5,
                    "quality_pass": quality_score >= 0.5,
                    "lighting_pass": lighting_score >= 0.5
                }
            }

            logger.info(f"Liveness detection: score={liveness_score:.3f}, live={is_live}")

            return result

        except Exception as e:
            logger.error(f"Liveness detection failed: {e}")
            raise

    def detect_liveness_from_frames(
        self,
        frames: List[bytes],
        landmarks_list: Optional[List[List[List[float]]]] = None
    ) -> dict:
        """
        Detect liveness from multiple frames (video)

        Args:
            frames: List of image bytes (video frames)
            landmarks_list: Optional list of facial landmarks for each frame

        Returns:
            Liveness detection result with blink detection
        """
        try:
            if len(frames) < 3:
                raise ValueError("At least 3 frames required for blink detection")

            # Analyze each frame
            frame_scores = []
            ear_values = []

            for i, frame in enumerate(frames):
                # Convert image
                image = self._bytes_to_image(frame)

                # Texture analysis
                texture_score = self._analyze_texture(image)
                frame_scores.append(texture_score)

                # Blink detection if landmarks available
                if landmarks_list and i < len(landmarks_list):
                    ear = self._calculate_eye_aspect_ratio(landmarks_list[i])
                    ear_values.append(ear)

            # Average texture score
            avg_texture_score = np.mean(frame_scores)

            # Blink detection
            blink_detected = False
            if ear_values:
                blink_detected = self._detect_blink(ear_values)

            # Quality and lighting from best frame
            best_frame_idx = int(np.argmax(frame_scores))
            best_frame = self._bytes_to_image(frames[best_frame_idx])
            quality_score = self._analyze_image_quality(best_frame)
            lighting_score = self._analyze_lighting(best_frame)

            # Calculate overall score
            liveness_score = (
                avg_texture_score * 0.4 +
                (1.0 if blink_detected else 0.3) * 0.3 +
                quality_score * 0.15 +
                lighting_score * 0.15
            )

            is_live = liveness_score >= self.liveness_threshold

            result = {
                "is_live": is_live,
                "liveness_score": float(liveness_score),
                "blink_detected": blink_detected,
                "avg_texture_score": float(avg_texture_score),
                "quality_score": float(quality_score),
                "lighting_score": float(lighting_score),
                "threshold": self.liveness_threshold,
                "frames_analyzed": len(frames)
            }

            logger.info(f"Multi-frame liveness: score={liveness_score:.3f}, blink={blink_detected}, live={is_live}")

            return result

        except Exception as e:
            logger.error(f"Multi-frame liveness detection failed: {e}")
            raise

    def _analyze_texture(self, image: np.ndarray) -> float:
        """
        Analyze image texture to detect photo spoofs

        Real faces have more complex texture patterns than photos
        """
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Calculate Local Binary Pattern variance
            # High variance indicates natural texture
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            texture_score = np.std(laplacian) / 100.0  # Normalize

            # Add gradient analysis
            grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
            gradient_score = np.mean(gradient_magnitude) / 255.0

            # Combine scores
            combined = min(1.0, (texture_score + gradient_score) / 2.0)

            return float(combined)

        except Exception as e:
            logger.error(f"Texture analysis failed: {e}")
            return 0.0

    def _analyze_image_quality(self, image: np.ndarray) -> float:
        """
        Analyze image quality metrics

        Real photos typically have better quality characteristics
        """
        try:
            # Calculate sharpness using Laplacian variance
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Normalize (typical range 0-500)
            sharpness = min(1.0, laplacian_var / 200.0)

            # Check for noise patterns (photos of screens have Moire patterns)
            # High frequency noise check
            kernel = np.ones((5, 5), np.float32) / 25
            filtered = cv2.filter2D(gray, -1, kernel)
            noise = np.mean(np.abs(gray.astype(float) - filtered.astype(float))) / 255.0

            # Combine: we want good sharpness but not too much noise
            quality = sharpness * 0.7 + (1.0 - min(1.0, noise * 2)) * 0.3

            return float(max(0.0, min(1.0, quality)))

        except Exception as e:
            logger.error(f"Quality analysis failed: {e}")
            return 0.0

    def _analyze_lighting(self, image: np.ndarray) -> float:
        """
        Analyze lighting conditions

        Real faces have more natural lighting variations
        """
        try:
            # Convert to LAB color space for better lighting analysis
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l_channel = lab[:, :, 0]

            # Calculate statistics
            mean_brightness = np.mean(l_channel) / 255.0
            std_brightness = np.std(l_channel) / 255.0

            # Check for natural lighting range (not too dark, not too bright)
            brightness_score = 1.0 - abs(mean_brightness - 0.5) * 2.0
            brightness_score = max(0.0, brightness_score)

            # Check for good contrast
            contrast_score = min(1.0, std_brightness * 3.0)

            # Combine scores
            lighting = (brightness_score + contrast_score) / 2.0

            return float(lighting)

        except Exception as e:
            logger.error(f"Lighting analysis failed: {e}")
            return 0.0

    def _calculate_eye_aspect_ratio(self, landmarks: List[List[float]]) -> float:
        """
        Calculate Eye Aspect Ratio (EAR) for blink detection

        Using InsightFace 106-point landmarks:
        - Left eye: points around left eye region
        - Right eye: points around right eye region
        """
        try:
            # For 106-point model, approximate eye regions
            # Left eye approximate indices
            left_eye = [
                landmarks[60], landmarks[64], landmarks[67], landmarks[71],
                landmarks[63], landmarks[68], landmarks[66], landmarks[70]
            ]

            # Right eye approximate indices
            right_eye = [
                landmarks[74], landmarks[78], landmarks[81], landmarks[85],
                landmarks[77], landmarks[82], landmarks[80], landmarks[84]
            ]

            # Calculate EAR for left eye
            left_ear = self._eye_aspect_ratio(left_eye)

            # Calculate EAR for right eye
            right_ear = self._eye_aspect_ratio(right_eye)

            # Average
            ear = (left_ear + right_ear) / 2.0

            return float(ear)

        except Exception as e:
            logger.error(f"EAR calculation failed: {e}")
            return 0.0

    def _eye_aspect_ratio(self, eye_points: List[List[float]]) -> float:
        """Calculate EAR for a single eye"""
        try:
            # Vertical eye landmarks
            A = euclidean(eye_points[1], eye_points[5])
            B = euclidean(eye_points[2], eye_points[4])

            # Horizontal eye landmark
            C = euclidean(eye_points[0], eye_points[3])

            # Eye aspect ratio
            ear = (A + B) / (2.0 * C)

            return float(ear)

        except Exception as e:
            logger.error(f"Single eye EAR calculation failed: {e}")
            return 0.0

    def _detect_blink(self, ear_values: List[float]) -> bool:
        """
        Detect blink from EAR values over time

        Returns True if blink detected
        """
        try:
            if not ear_values:
                return False

            # Check if EAR drops below threshold for consecutive frames
            blink_frames = [ear for ear in ear_values if ear < self.ear_threshold]

            return len(blink_frames) >= self.consec_frames

        except Exception as e:
            logger.error(f"Blink detection failed: {e}")
            return False

    @staticmethod
    def _bytes_to_image(image_data: bytes) -> np.ndarray:
        """Convert bytes to numpy array (BGR format)"""
        try:
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                raise ValueError("Failed to decode image")

            return image

        except Exception as e:
            logger.error(f"Image conversion failed: {e}")
            raise


# Singleton instance
liveness_service = LivenessDetector()
