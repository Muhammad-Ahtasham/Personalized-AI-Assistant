"use client";
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

interface FaceAuthProps {
  mode: 'register' | 'login';
  onFaceDetected: (embedding: number[]) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

const FaceAuth: React.FC<FaceAuthProps> = ({ 
  mode, 
  onFaceDetected, 
  onError, 
  isLoading = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading face-api models...');
        
        // Set the model path
        const MODEL_URL = '/models';
        
        // Wait a bit for browser to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Load models one by one with better error handling
        console.log('Loading tiny face detector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        
        console.log('Loading face landmark model...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        
        console.log('Loading face recognition model...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        setIsModelLoaded(true);
        console.log('All face-api models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        
        // More detailed error handling
        if (error instanceof Error) {
          if (error.message.includes('fetch')) {
            onError('Failed to load models: Network error. Please check your internet connection.');
          } else if (error.message.includes('404')) {
            onError('Failed to load models: Model files not found. Please contact support.');
          } else if (error.message.includes('TensorFlow')) {
            onError('Failed to load models: TensorFlow.js not available. Please refresh the page.');
          } else {
            onError(`Failed to load face recognition models: ${error.message}`);
          }
        } else {
          onError('Failed to load face recognition models: Unknown error');
        }
      }
    };

    loadModels();
  }, [onError]);

  // Start video stream
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          setIsStreamActive(true);
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          onError('Failed to load video stream');
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      onError('Failed to access camera. Please check permissions.');
    }
  };

  // Stop video stream
  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreamActive(false);
    }
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
    setRetryCount(0);
  };

  // Start face detection
  const startDetection = () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded) return;

    const interval = setInterval(async () => {
      try {
        // Check if video is ready and has valid dimensions
        const video = videoRef.current;
        if (!video || video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
          // Increment retry count and stop if too many retries
          setRetryCount(prev => {
            if (prev > 50) { // 5 seconds of retries
              console.error('Video not ready after multiple attempts');
              stopVideo();
              onError('Failed to initialize video stream. Please refresh the page.');
            }
            return prev + 1;
          });
          return;
        }

        // Reset retry count when video is ready
        setRetryCount(0);

        // Ensure video is playing and has valid data
        if (video.paused || video.ended) {
          return;
        }

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          // Get the first detected face
          const face = detections[0];
          const embedding = Array.from(face.descriptor);
          
          // Stop detection and video
          stopVideo();
          
          // Call the callback with the embedding
          onFaceDetected(embedding);
        }
      } catch (error) {
        console.error('Error during face detection:', error);
        // Don't throw the error to prevent the interval from stopping
        // Just log it and continue
      }
    }, 100); // Check every 100ms

    setDetectionInterval(interval);
  };

  // Start video and detection when component mounts
  useEffect(() => {
    if (isModelLoaded) {
      startVideo();
    }

    return () => {
      stopVideo();
    };
  }, [isModelLoaded]);

  // Start detection when stream is active
  useEffect(() => {
    if (isStreamActive && isModelLoaded) {
      // Add a small delay to ensure video is fully ready
      const timer = setTimeout(() => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          startDetection();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isStreamActive, isModelLoaded]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-96 h-72 border-2 border-gray-300 rounded-lg"
          onLoadedData={() => {
            console.log('Video data loaded, ready state:', videoRef.current?.readyState);
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-96 h-72"
        />
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          {mode === 'register' 
            ? 'Position your face in the camera and hold still for registration'
            : 'Position your face in the camera for login'
          }
        </p>
        
        {isLoading && (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">
              {mode === 'register' ? 'Processing registration...' : 'Processing login...'}
            </span>
          </div>
        )}
        
        {!isModelLoaded && (
          <div className="space-y-2">
            <p className="text-sm text-yellow-600">Loading face recognition models...</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Click here if models fail to load
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceAuth; 