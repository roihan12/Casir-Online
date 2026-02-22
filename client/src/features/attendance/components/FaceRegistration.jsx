import React, { useState } from 'react';
import { Camera, User, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import AttendanceCamera from './AttendanceCamera';
import { registerFace } from '../services/attendanceService';

/**
 * FaceRegistration Component
 * Handles face registration flow with camera capture and upload
 *
 * @param {Object} props
 * @param {string} props.userId - User ID to register face for
 * @param {string} props.userName - User name for display
 * @param {boolean} props.hasExistingFace - Whether user already has registered face
 * @param {Function} props.onSuccess - Callback after successful registration
 * @param {Function} props.onCancel - Callback when user cancels
 * @param {boolean} props.showButton - Show trigger button (default: true)
 * @param {string} props.buttonText - Custom button text
 * @param {string} props.buttonClassName - Custom button classes
 */
const FaceRegistration = ({
  userId,
  userName = 'User',
  hasExistingFace = false,
  onSuccess,
  onCancel,
  showButton = true,
  buttonText,
  buttonClassName = ''
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [faceData, setFaceData] = useState(null);

  /**
   * Handle photo capture and registration
   */
  const handlePhotoCapture = async (capturedData) => {
    try {
      setIsRegistering(true);
      setError(null);
      setShowCamera(false);

      // AttendanceCamera returns { frames, mainPhoto } — extract mainPhoto
      const rawPhoto = typeof capturedData === 'object' && capturedData.mainPhoto
        ? capturedData.mainPhoto
        : capturedData;

      // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
      const base64Photo = typeof rawPhoto === 'string' && rawPhoto.includes(',')
        ? rawPhoto.split(',')[1]
        : rawPhoto;

      // Call registration API
      const result = await registerFace(userId, base64Photo);

      setFaceData(result);
      setSuccess(true);

      // Notify parent component
      if (onSuccess) {
        onSuccess(result);
      }

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (err) {
      const errorMessage = err.message || 'Face registration failed';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * Handle camera cancel
   */
  const handleCameraCancel = () => {
    setShowCamera(false);
    if (onCancel) {
      onCancel();
    }
  };

  /**
   * Reset to show camera again
   */
  const handleRetake = () => {
    setSuccess(false);
    setFaceData(null);
    setShowCamera(true);
  };

  // Default button text based on state
  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (hasExistingFace) return 'Update Face Data';
    if (isRegistering) return 'Registering...';
    return 'Register Face';
  };

  return (
    <>
      {/* Trigger Button */}
      {showButton && (
        <button
          onClick={() => setShowCamera(true)}
          disabled={isRegistering}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
            hasExistingFace
              ? 'bg-gray-600 text-white hover:bg-gray-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
        >
          {isRegistering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              {getButtonText()}
            </>
          )}
        </button>
      )}

      {/* Success Message */}
      {success && faceData && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900">Face Registered Successfully!</p>
              <p className="text-sm text-green-700 mt-1">
                Face data for {userName} has been registered.
              </p>
              {faceData.faceImageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-green-600 mb-2">Registered face:</p>
                  <img
                    src={faceData.faceImageUrl}
                    alt="Registered face"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-green-300"
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleRetake}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">Registration Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={handleRetake}
                className="mt-3 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <FaceRegistrationCamera
          userName={userName}
          hasExistingFace={hasExistingFace}
          onCapture={handlePhotoCapture}
          onCancel={handleCameraCancel}
        />
      )}
    </>
  );
};

/**
 * Face Registration Camera Component
 * Specialized camera with registration instructions
 */
const FaceRegistrationCamera = ({ userName, hasExistingFace, onCapture, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">Face Registration</h2>
              <p className="text-sm text-blue-100">
                {hasExistingFace ? `Update face data for ${userName}` : `Register face for ${userName}`}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <p className="text-sm font-medium text-blue-900 mb-2">Follow these tips for best results:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Position face centrally in the frame</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Ensure good, even lighting on face</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Look directly at the camera</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Remove glasses if possible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Keep neutral expression</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Aose hats or head coverings</span>
            </li>
          </ul>
        </div>

        {/* Camera */}
        <AttendanceCamera
          onCapture={onCapture}
          onCancel={onCancel}
          showPreview={true}
        />
      </div>
    </div>
  );
};

export default FaceRegistration;
