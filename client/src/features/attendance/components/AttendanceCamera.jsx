import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, AlertCircle, Eye } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import * as faceapi from '@vladmandic/face-api';

/**
 * AttendanceCamera Component
 * Provides camera access, live preview, and liveness detection (blink)
 */
const AttendanceCamera = ({
  onCapture,
  onCancel,
  showPreview = true,
  className = ''
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState('initializing'); // initializing, detecting_face, waiting_for_blink, verifying, success
  const [livenessMessage, setLivenessMessage] = useState('Loading face models...');
  
  // Ref to track detection loop
  const detectionRef = useRef(null);
  const blinkHistoryRef = useRef([]);

  const {
    isStreamActive,
    error: cameraError,
    startCamera,
    stopCamera,
    capturePhoto,
    clearPhoto
  } = useCamera({ videoRef, autoStart: true });

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        setLivenessStatus('detecting_face');
        setLivenessMessage('Position your face in the frame');
      } catch (err) {
        console.error('Failed to load face models', err);
        setLivenessMessage('Error loading AI models. Please refresh.');
      }
    };
    loadModels();
  }, []);

  console.log("modelsLoaded", modelsLoaded);
  console.log("isStreamActive", isStreamActive);
  console.log("videoRef", videoRef.current);
  // console.log("livenessStatus", videoRef.current.paused);
  // console.log("livenessMessage", videoRef.current.ended);

  // Use Effect to handle detection loop
 useEffect(() => {
  // ✅ Guard: jangan mulai sebelum semuanya siap
  if (!isStreamActive || !modelsLoaded || !videoRef.current) return;

  let isCancelled = false; // ✅ Flag untuk mencegah race condition

  const detect = async () => {
    if (isCancelled) return;

    const video = videoRef.current;

    // ✅ Pastikan video sudah benar-benar playing dan punya frame
    if (
      !video ||
      video.readyState < 2 ||   // HAVE_CURRENT_DATA
      video.paused ||
      video.ended ||
      video.videoWidth === 0
    ) {
      detectionRef.current = requestAnimationFrame(detect);
      return;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        )
        .withFaceLandmarks();

      if (isCancelled) return; // ✅ Cek lagi setelah async selesai

      console.log("detection", detection);

      if (detection) {
        if (livenessStatus === 'detecting_face') {
          setLivenessStatus('waiting_for_blink');
          setLivenessMessage('Please BLINK to verify liveness');
        }

        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const ear = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2;

        if (livenessStatus === 'waiting_for_blink' && !isCapturing) {
          if (ear < 0.25) {
            setLivenessStatus('verifying');
            setLivenessMessage('Blink Detected!');
            handleCapture();
            return; // ✅ Stop loop setelah capture
          }
        }
      } else {
        if (livenessStatus !== 'detecting_face') {
          setLivenessStatus('detecting_face');
          setLivenessMessage('Looking for face...');
        }
      }
    } catch (err) {
      console.error('Detection error:', err);
    }

    // ✅ Lanjut loop hanya jika belum capture
    if (!previewPhoto && !isCapturing && !isCancelled) {
      detectionRef.current = requestAnimationFrame(detect);
    }
  };

  detect();

  return () => {
    isCancelled = true; // ✅ Cancel flag saat cleanup
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }
  };
}, [isStreamActive, modelsLoaded, livenessStatus, isCapturing, previewPhoto]);


  // Helper: Calculate Eye Aspect Ratio
  const calculateEAR = (eye) => {
    // euclidean distance
    const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    
    // Vertical distances
    const A = dist(eye[1], eye[5]);
    const B = dist(eye[2], eye[4]);
    
    // Horizontal distance
    const C = dist(eye[0], eye[3]);
    
    if (C === 0) return 0;
    return (A + B) / (2.0 * C);
  };


  /**
   * Handle photo/sequence capture
   */
  const handleCapture = async () => {
    try {
      setIsCapturing(true);

      // Capture sequence (5 frames)
      const frames = [];
      for (let i = 0; i < 5; i++) {
        const photo = await capturePhoto({
          width: 640,
          height: 480,
          format: 'base64',
          quality: 0.7
        });
        frames.push(photo);
        
        // Wait 150ms between frames
        if (i < 4) await new Promise(r => setTimeout(r, 150));
      }

      // Use the middle frame as the preview/main photo
      const mainPhoto = frames[2]; 
      setPreviewPhoto(mainPhoto);
      setLivenessStatus('success');
      setLivenessMessage('Liveness Confirmed');

      // Pass all frames
      if (onCapture) {
        onCapture({ frames, mainPhoto });
        stopCamera();
      }

    } catch (err) {
      console.error('Capture failed:', err);
      // Reset
      setLivenessStatus('waiting_for_blink');
      setIsCapturing(false);
    } 
  };

  /**
   * Manual Retake
   */
  const handleRetake = () => {
    setPreviewPhoto(null);
    setIsCapturing(false);
    setLivenessStatus('detecting_face');
    setLivenessMessage('Position your face in the frame');
    clearPhoto();
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    stopCamera();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden relative">
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-semibold">
              {previewPhoto ? 'Liveness Checked' : 'Liveness Verification'}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera/Preview Area */}
        <div className="relative bg-black aspect-[4/3] sm:aspect-video">
          
          {/* Status Overlay */}
          {!previewPhoto && (
             <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                <div className={`px-4 py-2 rounded-full font-bold text-white shadow-lg backdrop-blur-sm transition-all duration-300 text-sm sm:text-base ${
                  livenessStatus === 'waiting_for_blink' ? 'bg-blue-600/80 animate-pulse' :
                  livenessStatus === 'verifying' ? 'bg-green-600/90' :
                  'bg-gray-800/70'
                }`}>
                   <div className="flex items-center gap-2">
                     <Eye className="w-4 h-4" />
                     {livenessMessage}
                   </div>
                </div>
             </div>
          )}

          {/* Video Stream */}
          {isStreamActive && !previewPhoto && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
              />
              <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none transform scale-x-[-1]" />
              
              {/* Face Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 {/* Only show guide frame if looking for face */}
                 <div className={`w-48 h-56 sm:w-64 sm:h-72 border-4 rounded-3xl transition-all duration-500 ${
                    livenessStatus === 'waiting_for_blink' ? 'border-green-400 border-opacity-70' :
                    livenessStatus === 'detecting_face' ? 'border-white border-opacity-30 border-dashed' :
                    'border-blue-500'
                 }`} />
              </div>
            </>
          )}

          {/* Photo Preview */}
          {previewPhoto && (
            <img
              src={`data:image/jpeg;base64,${previewPhoto}`}
              alt="Captured"
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          )}

           {/* Loading / Error States */}
           {!modelsLoaded && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
                 <div className="text-center text-white">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p>Loading AI Models...</p>
                 </div>
              </div>
           )}
        </div>

        {/* Controls (Hidden during auto-process, shown if review needed) */}
         {/* We only really need a Cancel button if stuck, which is in header. 
             But if user wants to retry after success? */}
         {previewPhoto && (
            <div className="bg-gray-100 px-4 py-4 flex justify-between">
               <span className="text-green-700 font-medium flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Processed
               </span>
               <button
                  onClick={handleRetake} // Only for debugging really, usually it closes automatically
                   className="text-sm text-gray-500 underline"
               >
                  Retake
               </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default AttendanceCamera;
