import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Camera, RefreshCw, CheckCircle2, UserCheck, UserPlus,
  AlertCircle, Video, ScanFace, Sparkles, AlertTriangle,
  ShieldCheck, WifiOff, CameraOff, XCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { visitorApi } from '../../api/visitors';
import { VisitorRecognitionResponse } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CameraState =
  | 'idle'
  | 'requesting'
  | 'streaming'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface VisitorWebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when a recognised returning visitor is confirmed */
  onRecognized: (matchData: VisitorRecognitionResponse, capturedBlob: Blob | null) => void;
  /** Called when no match found or user chooses manual registration */
  onRegisterNew: (capturedBlob: Blob | null) => void;
  /** Optional custom title for public or guard portal */
  title?: string;
  /** Optional custom subtitle */
  subtitle?: string;
  /** Optional flag to render inline without wrapping in a modal dialog */
  inline?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function stopStream(video: HTMLVideoElement | null) {
  if (video && video.srcObject) {
    (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  }
}

function classifyError(err: unknown): { state: CameraState; message: string } {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return { state: 'denied', message: 'Camera permission was denied. Allow camera access in your browser settings and try again.' };
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return { state: 'unavailable', message: 'No camera device was found. Connect a webcam and try again.' };
    }
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return { state: 'error', message: 'Camera is in use by another application. Close it and try again.' };
    }
    if (err.name === 'OverconstrainedError') {
      return { state: 'error', message: 'The selected camera does not support the required resolution. Try a different camera.' };
    }
  }
  return { state: 'error', message: 'Camera could not be started. Check device connection and permissions.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const VisitorWebcamModal: React.FC<VisitorWebcamModalProps> = ({
  isOpen,
  onClose,
  onRecognized,
  onRegisterNew,
  title = 'Visitor Face Identification',
  subtitle = 'Biometric check to identify returning visitors — guard must review before confirming',
  inline = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [cameraError, setCameraError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<VisitorRecognitionResponse | null>(null);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopStream(videoRef.current);
    };
  }, []);

  // ── React to modal open / close ───────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      resetState();
      startCamera();
    } else {
      stopStream(videoRef.current);
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Camera helpers ────────────────────────────────────────────────────────

  const enumerateDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = all.filter((d) => d.kind === 'videoinput');
      if (mountedRef.current) {
        setDevices(videoDevices);
      }
    } catch {
      // enumerateDevices failure is non-fatal
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string, targetFacingMode?: 'user' | 'environment') => {
    // Stop any existing stream first
    stopStream(videoRef.current);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      setCameraError('Your browser does not support camera access. Use a modern browser like Chrome or Firefox.');
      return;
    }

    setCameraState('requesting');
    setCameraError('');

    const currentFacing = targetFacingMode || facingMode;
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        facingMode: deviceId ? undefined : { ideal: currentFacing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback for strict constraints on mobile devices
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (mountedRef.current) {
        setCameraState('streaming');
      }

      // Enumerate after permission granted — labels are now available
      await enumerateDevices();
    } catch (err) {
      if (!mountedRef.current) return;
      const { state, message } = classifyError(err);
      setCameraState(state);
      setCameraError(message);
      console.error('[VisitorWebcam] Camera start error:', err);
    }
  }, [enumerateDevices, facingMode]);

  const toggleFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    setSelectedDeviceId('');
    startCamera(undefined, next);
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDeviceId(id);
    setCapturedImage(null);
    setCapturedBlob(null);
    setRecognitionResult(null);
    setQualityIssues([]);
    startCamera(id);
  };

  // ── Capture ───────────────────────────────────────────────────────────────

  const capturePhoto = (): Promise<{ dataUrl: string; blob: Blob }> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return reject(new Error('Video or canvas element unavailable'));

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to obtain 2D canvas context'));

      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ dataUrl, blob });
          else reject(new Error('Failed to create image blob from canvas'));
        },
        'image/jpeg',
        0.92
      );
    });
  };

  // ── Scan & Recognise ──────────────────────────────────────────────────────

  const handleScanAndRecognise = async () => {
    if (isRecognizing) return; // prevent double-submit

    let blob = capturedBlob;
    let dataUrl = capturedImage;

    // If no photo yet, capture one now
    if (!capturedImage || !capturedBlob) {
      if (cameraState !== 'streaming') {
        toast.error('Camera is not active. Start the camera first.');
        return;
      }
      try {
        const captured = await capturePhoto();
        blob = captured.blob;
        dataUrl = captured.dataUrl;
        if (mountedRef.current) {
          setCapturedImage(dataUrl);
          setCapturedBlob(blob);
        }
      } catch (err: any) {
        toast.error(`Capture failed: ${err?.message || 'Unknown error'}`);
        return;
      }
    }

    if (!blob) {
      toast.error('No captured image available. Please capture a photo first.');
      return;
    }

    setIsRecognizing(true);
    setRecognitionResult(null);
    setQualityIssues([]);

    try {
      const result = await visitorApi.recognizeFace(blob);

      if (!mountedRef.current) return;

      setRecognitionResult(result);

      // Surface quality issues as guidance (not errors)
      const issues: string[] = result.quality?.issues ?? [];
      if (issues.length > 0) setQualityIssues(issues);

      // Announce outcome — but never claim more certainty than the backend provides
      if (result.matched && result.visitorName) {
        toast.success(`Potential match: ${result.visitorName}. Review the details below before confirming.`);
      } else if (result.isAmbiguous) {
        toast.warning(result.message || 'Multiple similar facial records found. Manual verification required.');
      } else if (result.numFaces === 0) {
        toast.error('No face detected in the frame. Ensure the visitor faces the camera and try again.');
      } else {
        toast.info(result.message || 'No matching visitor record found. Proceed to manual registration.');
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
      const isOffline = err?.code === 'ERR_NETWORK' || err?.response?.status >= 500;

      if (isOffline) {
        toast.error('Face recognition service is unreachable. Proceed with manual visitor check-in.');
      } else {
        toast.error(serverMsg ? `Recognition error: ${serverMsg}` : 'Face recognition failed. Proceed with manual check-in.');
      }
      console.error('[VisitorWebcam] Recognition error:', err);
    } finally {
      if (mountedRef.current) setIsRecognizing(false);
    }
  };

  // ── Proceed / Retake ──────────────────────────────────────────────────────

  const handleProceedWithResult = () => {
    if (!recognitionResult) return;
    stopStream(videoRef.current);
    if (recognitionResult.matched) {
      onRecognized(recognitionResult, capturedBlob);
    } else {
      onRegisterNew(capturedBlob);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setRecognitionResult(null);
    setQualityIssues([]);
    if (cameraState !== 'streaming') {
      startCamera(selectedDeviceId || undefined);
    }
  };

  const handleManualEntry = () => {
    stopStream(videoRef.current);
    onRegisterNew(capturedBlob);
  };

  const resetState = () => {
    setCameraState('idle');
    setCameraError('');
    setCapturedImage(null);
    setCapturedBlob(null);
    setRecognitionResult(null);
    setQualityIssues([]);
    setIsRecognizing(false);
  };

  const handleClose = () => {
    stopStream(videoRef.current);
    onClose();
  };

  // ── Derived booleans ──────────────────────────────────────────────────────

  const isStreaming = cameraState === 'streaming';
  const isRequesting = cameraState === 'requesting';
  const hasCapture = !!capturedImage;
  const canScan = (isStreaming || hasCapture) && !isRecognizing;

  // ── Render ────────────────────────────────────────────────────────────────

  const content = (
    <div className="space-y-4">

        {/* ── Device selector & Camera Flip ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50 p-2.5 sm:p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
              <Video className="w-4 h-4 text-indigo-600" />
              <span>Camera Source:</span>
            </div>

            {/* Mobile / Quick Flip FacingMode button */}
            <button
              type="button"
              onClick={toggleFacingMode}
              className="sm:hidden flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
              title="Flip between front and rear cameras"
            >
              <RefreshCw className="w-3 h-3 text-indigo-600" />
              <span>Flip ({facingMode === 'user' ? 'Front' : 'Back'})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {devices.length > 0 && (
              <select
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                className="w-full sm:w-auto px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={toggleFacingMode}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition shrink-0"
              title="Flip between front and rear cameras"
            >
              <RefreshCw className="w-3 h-3 text-indigo-600" />
              <span>{facingMode === 'user' ? 'Front' : 'Rear'} Cam</span>
            </button>
          </div>
        </div>

        {/* ── Quality guidance (from backend response) ── */}
        {qualityIssues.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Image Quality Issues:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                {qualityIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Camera viewport ── */}
        <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-xl">

          {/* Live video feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${hasCapture ? 'hidden' : 'block'}`}
          />

          {/* Captured snapshot */}
          {hasCapture && (
            <img
              src={capturedImage!}
              alt="Captured visitor"
              className="w-full h-full object-cover"
            />
          )}

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Face alignment guide overlay */}
          {isStreaming && !hasCapture && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-36 sm:w-48 h-48 sm:h-60 max-w-[65vw] max-h-[75%] border-2 border-dashed border-indigo-400/50 rounded-full animate-pulse flex flex-col items-center justify-center bg-indigo-500/5">
                <ScanFace className="w-8 sm:w-10 h-8 sm:h-10 text-indigo-400/80 mb-1.5" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-200 uppercase tracking-wider bg-slate-900/60 px-2 py-0.5 rounded-full text-center">
                  Align Face Inside Oval
                </span>
              </div>
            </div>
          )}

          {/* Requesting permission spinner */}
          {isRequesting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Requesting camera access…</p>
              <p className="text-xs text-slate-500">Check the browser permission prompt</p>
            </div>
          )}

          {/* Permission denied */}
          {cameraState === 'denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-slate-950/95">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
                <CameraOff className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">Camera Permission Denied</p>
                <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => startCamera(selectedDeviceId || undefined)}>
                Try Again
              </Button>
            </div>
          )}

          {/* No camera hardware */}
          {cameraState === 'unavailable' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-slate-950/95">
              <div className="w-14 h-14 bg-slate-500/10 border border-slate-500/20 rounded-2xl flex items-center justify-center">
                <CameraOff className="w-7 h-7 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">No Camera Available</p>
                <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
              </div>
              <Button variant="secondary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={handleManualEntry}>
                Manual Registration
              </Button>
            </div>
          )}

          {/* Generic camera error */}
          {cameraState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-slate-950/95">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">Camera Error</p>
                <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startCamera(selectedDeviceId || undefined)}>
                  Retry
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={handleManualEntry}>
                  Manual Entry
                </Button>
              </div>
            </div>
          )}

          {/* Idle (not yet started) */}
          {cameraState === 'idle' && !hasCapture && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-slate-950/90">
              <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                <Camera className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">Camera Offline</p>
                <p className="text-xs text-slate-400">Click Start Camera to open the live preview</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Camera className="w-4 h-4" />}
                onClick={() => startCamera(selectedDeviceId || undefined)}
              >
                Start Camera
              </Button>
            </div>
          )}

          {/* Recognition result overlay (shown over captured image) */}
          {recognitionResult && hasCapture && (
            <div className="absolute bottom-3 left-3 right-3 p-4 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700/80 text-white shadow-2xl">
              {recognitionResult.matched ? (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30 shrink-0">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] uppercase font-extrabold text-emerald-400 tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Returning Visitor Recognised!
                      </span>
                      {recognitionResult.similarity !== undefined && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold">
                          {(recognitionResult.similarity * 100).toFixed(0)}% Match
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-base text-white truncate">
                      {recognitionResult.visitorName}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {recognitionResult.mobileNumber} · {recognitionResult.hostPersonOrDepartment || 'Previous visitor record found'}
                    </p>
                    <p className="text-xs text-emerald-300 mt-1.5 font-medium flex items-center gap-1">
                      ✓ Profile details will be auto-filled automatically.
                    </p>
                  </div>
                </div>
              ) : recognitionResult.isAmbiguous ? (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider block mb-0.5">
                      Ambiguous Face Match
                    </span>
                    <p className="font-semibold text-xs text-slate-200">Manual verification required</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Multiple records share similar features. Please continue with manual registration.
                    </p>
                  </div>
                </div>
              ) : recognitionResult.numFaces === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-xl text-red-400 border border-red-500/30 shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-red-400 tracking-wider block mb-0.5">
                      No Face Detected
                    </span>
                    <p className="text-xs text-slate-300">
                      {recognitionResult.message || 'Ensure your face is centered and clearly lit.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-amber-950/40 p-3 rounded-lg border border-amber-500/40">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30 shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block mb-0.5">
                      No Existing Record Found in Dataset
                    </span>
                    <p className="text-sm font-semibold text-white">
                      Please go for Registration first.
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Your photo has been captured and will be saved for fast automatic recognition on your next visit!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Action bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">

          {/* Left: start / retake */}
          <div className="flex items-center gap-2">
            {cameraState === 'idle' && !hasCapture ? (
              <Button
                variant="primary"
                leftIcon={<Camera className="w-4 h-4" />}
                onClick={() => startCamera(selectedDeviceId || undefined)}
              >
                Start Camera
              </Button>
            ) : (
              <Button
                variant="outline"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRetake}
                disabled={isRecognizing}
              >
                Retake
              </Button>
            )}

            {/* Manual entry shortcut removed as requested */}
          </div>

          {/* Right: scan / proceed */}
          <div className="flex items-center gap-2">
            {canScan && (
              <Button
                variant="primary"
                leftIcon={<ScanFace className="w-4 h-4" />}
                isLoading={isRecognizing}
                onClick={handleScanAndRecognise}
              >
                {hasCapture ? 'Recognise' : 'Capture & Scan'}
              </Button>
            )}

            {/* Proceed buttons — only shown after a result */}
            {recognitionResult && (
              <>
                {recognitionResult.matched ? (
                  <Button
                    variant="primary"
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                    onClick={handleProceedWithResult}
                  >
                    Confirm & Auto-Fill Details
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    leftIcon={<UserPlus className="w-4 h-4" />}
                    onClick={handleManualEntry}
                    className="!bg-amber-600 hover:!bg-amber-700 text-white shadow-sm"
                  >
                    Go to Registration
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Privacy / security notice ── */}
        <p className="text-[10px] text-slate-400 text-center leading-relaxed border-t border-slate-100 pt-3">
          Face recognition is an identification aid only. The guard must verify identity and approve entry.
          No access is granted automatically based on a facial match.
        </p>
      </div>
  );

  if (inline) {
    if (!isOpen) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        {title && (
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-base text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        )}
        {content}
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      maxWidth="lg"
    >
      {content}
    </Modal>
  );
};
