import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Camera, RefreshCw, CheckCircle2, UserCheck, UserPlus,
  AlertCircle, Video, ScanFace, Sparkles, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { visitorApi } from '../../api/visitors';
import { VisitorRecognitionResponse } from '../../types';

interface VisitorWebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecognized: (matchData: VisitorRecognitionResponse, capturedBlob: Blob | null) => void;
  onRegisterNew: (capturedBlob: Blob | null) => void;
}

export const VisitorWebcamModal: React.FC<VisitorWebcamModalProps> = ({
  isOpen,
  onClose,
  onRecognized,
  onRegisterNew,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognitionResult, setRecognitionResult] = useState<VisitorRecognitionResponse | null>(null);
  const [qualityFeedback, setQualityFeedback] = useState<string[]>([]);

  const getDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((device) => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error listing camera devices:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      getDevices();
      startCamera();
    } else {
      stopCamera();
      resetState();
    }
  }, [isOpen]);

  const startCamera = async (deviceId?: string) => {
    stopCamera();
    try {
      // Enforce high-definition constraints for optimal biometric landmark extraction
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOn(true);
      await getDevices();
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error('Unable to access camera. Please verify device permissions and connection.');
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    startCamera(newDeviceId);
  };

  const capturePhoto = (): Promise<{ dataUrl: string; blob: Blob }> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        return reject(new Error('Video or canvas elements are unavailable'));
      }

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to obtain canvas 2D rendering context'));
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ dataUrl, blob });
          } else {
            reject(new Error('Failed to capture high-resolution image blob'));
          }
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleCaptureAndRecognize = async () => {
    if (isRecognizing) return;
    try {
      let currentBlob = capturedBlob;
      let currentDataUrl = capturedImage;

      if (!capturedImage) {
        const { dataUrl, blob } = await capturePhoto();
        currentDataUrl = dataUrl;
        currentBlob = blob;
        setCapturedImage(dataUrl);
        setCapturedBlob(blob);
      }

      if (!currentBlob) {
        toast.error('Please capture a photo first');
        return;
      }

      setIsRecognizing(true);
      setRecognitionResult(null);
      setQualityFeedback([]);

      const result = await visitorApi.recognizeFace(currentBlob);
      setRecognitionResult(result);
      setIsRecognizing(false);

      if (result.quality?.issues && result.quality.issues.length > 0) {
        setQualityFeedback(result.quality.issues);
      }

      if (result.matched && result.visitorName) {
        toast.success(`Returning Visitor Recognized: ${result.visitorName}!`);
      } else if (result.isAmbiguous) {
        toast.warning(result.message || 'Multiple similar facial candidates found. Manual confirmation required.');
      } else if (result.numFaces === 0) {
        toast.error('No human face detected. Please face the camera and try again.');
      } else {
        toast.info(result.message || 'First-time visitor. Please proceed to entry form.');
      }
    } catch (err: any) {
      setIsRecognizing(false);
      console.error('Recognition error:', err);
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(serverMessage ? `Recognition error: ${serverMessage}` : 'Face recognition service unreachable. Proceeding with manual check-in.');
    }
  };

  const handleProceedWithResult = () => {
    if (!capturedBlob && !recognitionResult) return;
    stopCamera();
    if (recognitionResult?.matched) {
      onRecognized(recognitionResult, capturedBlob);
    } else {
      onRegisterNew(capturedBlob);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setRecognitionResult(null);
    setQualityFeedback([]);
    if (!isCameraOn) {
      startCamera(selectedDeviceId);
    }
  };

  const resetState = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setRecognitionResult(null);
    setQualityFeedback([]);
    setIsRecognizing(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="High-Accuracy Facial Recognition Terminal"
      subtitle="CNN YuNet & SFace 128-D Biometric Gate Verification"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Device Selection Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Video className="w-4 h-4 text-indigo-600" />
            <span>Active Camera Device:</span>
          </div>
          <select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="w-full sm:w-auto px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-800"
          >
            {devices.map((device, idx) => (
              <option key={device.deviceId || idx} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Quality Feedback Alerts */}
        {qualityFeedback.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Camera Quality Guidance:</p>
              <ul className="list-disc list-inside mt-0.5 text-amber-700">
                {qualityFeedback.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Camera Display Box */}
        <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-xl">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
          />

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured Visitor"
              className="w-full h-full object-cover"
            />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Biometric Target Guide Overlay */}
          {isCameraOn && !capturedImage && (
            <div className="pointer-events-none absolute inset-0 border-2 border-indigo-500/20 rounded-2xl flex items-center justify-center">
              <div className="w-56 h-72 border-2 border-dashed border-indigo-400/50 rounded-full animate-pulse flex flex-col items-center justify-center bg-indigo-500/5">
                <ScanFace className="w-12 h-12 text-indigo-400/80 mb-2" />
                <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider bg-slate-900/60 px-2.5 py-0.5 rounded-full">
                  Align Face Inside Oval
                </span>
              </div>
            </div>
          )}

          {!isCameraOn && !capturedImage && (
            <div className="text-center p-6 space-y-3">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 text-indigo-400">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Camera Offline</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click 'Start Camera' to open live preview
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Camera className="w-4 h-4" />}
                onClick={() => startCamera(selectedDeviceId)}
              >
                Start Camera
              </Button>
            </div>
          )}

          {/* Recognition Result Banner */}
          {recognitionResult && (
            <div className="absolute bottom-3 left-3 right-3 p-3.5 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700/80 text-white shadow-2xl flex items-center justify-between">
              {recognitionResult.matched ? (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">
                        <Sparkles className="w-3 h-3" /> Returning Visitor Verified
                      </span>
                      {recognitionResult.similarity !== undefined && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                          {(recognitionResult.similarity * 100).toFixed(1)}% Match
                        </span>
                      )}
                    </div>
                    <h5 className="font-extrabold text-sm text-white">
                      {recognitionResult.visitorName} ({recognitionResult.mobileNumber})
                    </h5>
                    <p className="text-[11px] text-slate-300">
                      Host: {recognitionResult.hostPersonOrDepartment} | Photo On File
                    </p>
                  </div>
                </div>
              ) : recognitionResult.isAmbiguous ? (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      Ambiguous Candidates
                    </span>
                    <h5 className="font-semibold text-xs text-slate-200">
                      Manual Identity Verification Required
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Multiple registered visitors show similar facial features.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                      New Visitor (First Visit)
                    </span>
                    <h5 className="font-semibold text-xs text-slate-200">
                      No matching registered facial record found
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Proceed to enter visitor details and enroll photo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {!isCameraOn && !capturedImage ? (
              <Button
                variant="primary"
                leftIcon={<Camera className="w-4 h-4" />}
                onClick={() => startCamera(selectedDeviceId)}
              >
                Start Camera
              </Button>
            ) : (
              <Button
                variant="outline"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRetake}
              >
                Retake Photo
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(isCameraOn || capturedImage) && (
              <Button
                variant="primary"
                leftIcon={<ScanFace className="w-4 h-4" />}
                isLoading={isRecognizing}
                onClick={handleCaptureAndRecognize}
              >
                Scan & Verify
              </Button>
            )}

            {recognitionResult && (
              <Button
                variant={recognitionResult.matched ? "primary" : "secondary"}
                leftIcon={recognitionResult.matched ? <ShieldCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                onClick={handleProceedWithResult}
              >
                {recognitionResult.matched ? "Confirm & Auto-Fill Form" : "Enroll & Fill Form"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
