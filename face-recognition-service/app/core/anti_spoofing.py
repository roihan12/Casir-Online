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

    # InsightFace 106-point model - correct eye indices
    LEFT_EYE_INDICES  = [33, 34, 35, 36, 37, 38]   # 6 points
    RIGHT_EYE_INDICES = [42, 43, 44, 45, 46, 47]   # 6 points

    def __init__(self):
        self.ear_threshold    = settings.BLINK_THRESHOLD
        self.consec_frames    = settings.BLINK_CONSEC_FRAMES
        self.texture_threshold = settings.TEXTURE_THRESHOLD
        self.liveness_threshold = settings.LIVENESS_THRESHOLD

    # ------------------------------------------------------------------ #
    #  Public API                                                          #
    # ------------------------------------------------------------------ #

    def detect_liveness_from_image(
        self,
        image_data: bytes,
        landmarks: Optional[List[List[float]]] = None
    ) -> dict:
        """
        Detect liveness from a single image.

        Args:
            image_data: Image bytes
            landmarks:  Optional facial landmarks (106 points from InsightFace)

        Returns:
            Liveness detection result dict
        """
        try:
            image = self._bytes_to_image(image_data)

            texture_score  = self._analyze_texture(image)
            quality_score  = self._analyze_image_quality(image)
            lighting_score = self._analyze_lighting(image)

            liveness_score = (
                texture_score  * 0.5 +
                quality_score  * 0.3 +
                lighting_score * 0.2
            )

            is_live = liveness_score >= self.liveness_threshold

            result = {
                "is_live":        is_live,
                "liveness_score": float(liveness_score),
                "texture_score":  float(texture_score),
                "quality_score":  float(quality_score),
                "lighting_score": float(lighting_score),
                "threshold":      self.liveness_threshold,
                "details": {
                    "texture_pass":  texture_score  >= 0.5,
                    "quality_pass":  quality_score  >= 0.5,
                    "lighting_pass": lighting_score >= 0.5,
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
        Detect liveness from multiple frames (video).

        Args:
            frames:         List of image bytes (video frames)
            landmarks_list: Optional list of facial landmarks per frame

        Returns:
            Liveness detection result with blink detection
        """
        try:
            if len(frames) < 3:
                raise ValueError("At least 3 frames required for blink detection")

            frame_scores = []
            ear_values   = []

            for i, frame in enumerate(frames):
                image         = self._bytes_to_image(frame)
                texture_score = self._analyze_texture(image)
                frame_scores.append(texture_score)

                if landmarks_list and i < len(landmarks_list):
                    ear = self._calculate_eye_aspect_ratio(landmarks_list[i])
                    ear_values.append(ear)

            avg_texture_score = float(np.mean(frame_scores))

            # FIX #1: use corrected blink detection (consecutive frames)
            blink_detected = self._detect_blink(ear_values) if ear_values else False

            best_frame_idx = int(np.argmax(frame_scores))
            best_frame     = self._bytes_to_image(frames[best_frame_idx])
            quality_score  = self._analyze_image_quality(best_frame)
            lighting_score = self._analyze_lighting(best_frame)

            # FIX #4: no-blink contributes 0.0 instead of 0.3
            liveness_score = (
                avg_texture_score              * 0.40 +
                (1.0 if blink_detected else 0.0) * 0.30 +
                quality_score                  * 0.15 +
                lighting_score                 * 0.15
            )

            is_live = liveness_score >= self.liveness_threshold

            result = {
                "is_live":           is_live,
                "liveness_score":    float(liveness_score),
                "blink_detected":    blink_detected,
                "avg_texture_score": avg_texture_score,
                "quality_score":     float(quality_score),
                "lighting_score":    float(lighting_score),
                "threshold":         self.liveness_threshold,
                "frames_analyzed":   len(frames),
            }

            logger.info(
                f"Multi-frame liveness: score={liveness_score:.3f}, "
                f"blink={blink_detected}, live={is_live}"
            )
            return result

        except Exception as e:
            logger.error(f"Multi-frame liveness detection failed: {e}")
            raise

    # ------------------------------------------------------------------ #
    #  Private helpers                                                     #
    # ------------------------------------------------------------------ #

    def _analyze_texture(self, image: np.ndarray) -> float:
        """
        Analyze image texture to detect photo spoofs.
        Real faces have more complex texture patterns than printed photos.
        """
        try:
            gray      = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)

            # FIX #5: clamp before combining so individual scores stay in [0, 1]
            texture_score = min(1.0, float(np.std(laplacian) / 100.0))

            grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            gradient_magnitude = np.sqrt(grad_x ** 2 + grad_y ** 2)
            gradient_score = min(1.0, float(np.mean(gradient_magnitude) / 255.0))

            combined = (texture_score + gradient_score) / 2.0
            return float(min(1.0, combined))

        except Exception as e:
            logger.error(f"Texture analysis failed: {e}")
            return 0.0

    def _analyze_image_quality(self, image: np.ndarray) -> float:
        """
        Analyze image quality metrics.
        Real photos typically have better quality characteristics.
        """
        try:
            gray           = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            laplacian_var  = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness      = min(1.0, float(laplacian_var / 200.0))

            kernel   = np.ones((5, 5), np.float32) / 25
            filtered = cv2.filter2D(gray, -1, kernel)
            noise    = float(
                np.mean(np.abs(gray.astype(float) - filtered.astype(float))) / 255.0
            )

            quality = sharpness * 0.7 + (1.0 - min(1.0, noise * 2)) * 0.3
            return float(max(0.0, min(1.0, quality)))

        except Exception as e:
            logger.error(f"Quality analysis failed: {e}")
            return 0.0

    def _analyze_lighting(self, image: np.ndarray) -> float:
        """
        Analyze lighting conditions.
        Real faces have more natural lighting variations.
        """
        try:
            lab       = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l_channel = lab[:, :, 0]

            mean_brightness = float(np.mean(l_channel) / 255.0)
            std_brightness  = float(np.std(l_channel)  / 255.0)

            brightness_score = max(0.0, 1.0 - abs(mean_brightness - 0.5) * 2.0)
            contrast_score   = min(1.0, std_brightness * 3.0)

            return float((brightness_score + contrast_score) / 2.0)

        except Exception as e:
            logger.error(f"Lighting analysis failed: {e}")
            return 0.0

    def _calculate_eye_aspect_ratio(self, landmarks: List[List[float]]) -> float:
        """
        Calculate Eye Aspect Ratio (EAR) for blink detection.

        FIX #2: Use correct InsightFace 106-point eye indices.
        FIX #3: Pass exactly 6 points to _eye_aspect_ratio.
        """
        try:
            # Left eye  — 6 points
            left_eye = [landmarks[i] for i in self.LEFT_EYE_INDICES]
            # Right eye — 6 points
            right_eye = [landmarks[i] for i in self.RIGHT_EYE_INDICES]

            left_ear  = self._eye_aspect_ratio(left_eye)
            right_ear = self._eye_aspect_ratio(right_eye)

            return float((left_ear + right_ear) / 2.0)

        except Exception as e:
            logger.error(f"EAR calculation failed: {e}")
            return 0.0

    def _eye_aspect_ratio(self, eye_points: List[List[float]]) -> float:
        """
        Calculate EAR for a single eye using exactly 6 points.

        Point order (standard 6-point EAR):
            0 = left  corner
            1 = top-left
            2 = top-right
            3 = right corner
            4 = bottom-right
            5 = bottom-left

        FIX #3: expects 6 points, matching LEFT/RIGHT_EYE_INDICES length.
        """
        try:
            A = euclidean(eye_points[1], eye_points[5])  # vertical
            B = euclidean(eye_points[2], eye_points[4])  # vertical
            C = euclidean(eye_points[0], eye_points[3])  # horizontal

            if C == 0:
                return 0.0

            return float((A + B) / (2.0 * C))

        except Exception as e:
            logger.error(f"Single eye EAR calculation failed: {e}")
            return 0.0

    def _detect_blink(self, ear_values: List[float]) -> bool:
        """
        Detect a complete blink (open → closed → open) from EAR sequence.

        FIX #1: Check for *consecutive* frames below threshold, then confirm
                the eyes re-opened — instead of just counting total low frames.

        Returns True only when a full blink cycle is confirmed.
        """
        try:
            if not ear_values:
                return False

            consecutive_closed = 0
            eyes_were_closed   = False  # Flag: we saw enough consecutive closed frames

            for ear in ear_values:
                if ear < self.ear_threshold:
                    # Eyes closed
                    consecutive_closed += 1
                    if consecutive_closed >= self.consec_frames:
                        eyes_were_closed = True
                else:
                    # Eyes open
                    if eyes_were_closed:
                        # Confirmed: open → closed (>= consec_frames) → open
                        return True
                    # Reset if closed frames were too few (noise)
                    consecutive_closed = 0

            # Edge case: frames ended while still closed — not a confirmed blink
            return False

        except Exception as e:
            logger.error(f"Blink detection failed: {e}")
            return False

    @staticmethod
    def _bytes_to_image(image_data: bytes) -> np.ndarray:
        """Convert bytes to numpy array (BGR format)."""
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