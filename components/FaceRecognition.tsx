"use client";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

interface FaceRecognitionProps {
  onFaceDetected: (embedding: number[]) => void;
  onError: (error: string) => void;
  mode: "register" | "login";
  isActive: boolean;
}

export default function FaceRecognition({ onFaceDetected, onError, mode, isActive }: FaceRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const loadModels = async () => {
      try {
        setIsLoading(true);
        
        // Use CDN models for better reliability
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        // Load models one by one to handle errors better
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading face-api models:', error);
        onError('Failed to load face recognition models. Please refresh the page and try again.');
        setIsLoading(false);
      }
    };

    loadModels();
  }, [isActive, onError]);

  useEffect(() => {
    if (!isActive || isLoading) return;

    const startVideo = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        onError('Camera access denied. Please allow camera permissions.');
      }
    };

    startVideo();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, isLoading, onError]);

  useEffect(() => {
    if (!isActive || isLoading || !stream) return;

    const detectFace = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      setIsDetecting(true);
      
      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          const face = detections[0];
          const embedding = Array.from(face.descriptor);
          onFaceDetected(embedding);
        }
      } catch (error) {
        console.error('Error detecting face:', error);
        onError('Face detection failed. Please try again.');
      } finally {
        setIsDetecting(false);
      }
    };

    const interval = setInterval(detectFace, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isActive, isLoading, stream, onFaceDetected, onError]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="relative">
      <div className="relative w-full max-w-md mx-auto">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg border-2 border-gray-300"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Loading face recognition...</p>
            </div>
          </div>
        )}
        
        {!isLoading && isDetecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
            <div className="text-white text-center">
              <div className="animate-pulse">
                <p className="text-lg font-semibold">
                  {mode === "register" ? "Registering face..." : "Recognizing face..."}
                </p>
                <p className="text-sm">Please look at the camera</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {mode === "register" 
            ? "Position your face in the center and look directly at the camera"
            : "Look at the camera to sign in with your face"
          }
        </p>
      </div>
    </div>
  );
} 