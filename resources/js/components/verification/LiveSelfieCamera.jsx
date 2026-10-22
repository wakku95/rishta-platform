import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, Upload } from 'lucide-react';
import Button from '../ui/Button';

export default function LiveSelfieCamera({ onCapture, onClear, initialPreview = null }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(initialPreview);
  const [cameraError, setCameraError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setVideoReady(false);
  }, []);

  // Progressive constraints fetcher for front/webcam
  const acquireCameraStream = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported on this browser. Please use Chrome, Safari, or Edge.');
    }

    // Try 1: User facing camera with ideal resolution
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1) {
      console.warn('Ideal user camera failed, trying basic user facing:', err1);
    }

    // Try 2: Basic facingMode
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
    } catch (err2) {
      console.warn('Basic user camera failed, trying generic video:', err2);
    }

    // Try 3: Any video device
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  };

  // Start front camera stream
  const startCamera = async () => {
    setIsStarting(true);
    setCameraError(null);
    setVideoReady(false);

    // Stop existing stream first
    stopCamera();

    try {
      const stream = await acquireCameraStream();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setVideoReady(true))
            .catch((err) => {
              console.warn('Video play caught:', err);
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(console.error);
              }
            });
        }
      }

      setStreamActive(true);
    } catch (err) {
      console.error('Camera initialization error:', err);
      let msg = 'Could not access camera. Please allow camera permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser site settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application. Please close other camera apps and retry.';
      }
      setCameraError(msg);
      setStreamActive(false);
    } finally {
      setIsStarting(false);
    }
  };

  // Re-attach stream whenever videoRef is mounted
  useEffect(() => {
    if (streamActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.play().then(() => setVideoReady(true)).catch(console.warn);
      }
    }
  }, [streamActive]);

  useEffect(() => {
    if (!capturedPreview) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, []);

  // Take live snapshot from video element
  const takeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    
    // Draw horizontal mirror for natural selfie feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedPreview(previewUrl);
        stopCamera();

        if (onCapture) {
          onCapture(blob, previewUrl);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedPreview && capturedPreview.startsWith('blob:')) {
      try { URL.revokeObjectURL(capturedPreview); } catch (_) {}
    }
    setCapturedBlob(null);
    setCapturedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) onClear();
    startCamera();
  };

  // Upload photo from device/gallery fallback
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      setCameraError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCameraError('Selected photo exceeds 5 MB limit. Please select a smaller photo.');
      return;
    }

    stopCamera();
    setCameraError(null);
    setCapturedBlob(file);
    const previewUrl = URL.createObjectURL(file);
    setCapturedPreview(previewUrl);

    if (onCapture) {
      onCapture(file, previewUrl);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      {/* Header instructions */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Live Selfie / Face Photo (تصویر لازمی ہے)</span>
        </span>
        <span className="text-[11px] text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Required / لازمی
        </span>
      </div>

      {/* Hidden File Input for Device / Gallery Fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-750 flex items-center justify-center h-52 sm:h-60 w-full">
        {/* State 1: Captured photo preview */}
        {capturedPreview ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <img
              src={capturedPreview}
              alt="Face Photo Preview"
              className="max-h-[190px] sm:max-h-[220px] w-auto object-contain rounded-xl shadow-lg border border-emerald-500/50"
            />
            <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Photo Attached</span>
            </div>
          </div>
        ) : (
          <>
            {/* State 2: Video Stream element (ALWAYS mounted in DOM to prevent ref null bugs) */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              onPlaying={() => setVideoReady(true)}
              onLoadedMetadata={(e) => {
                e.target.play().then(() => setVideoReady(true)).catch(console.warn);
              }}
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                streamActive && videoReady ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
            />

            {/* Face Guide Oval Overlay */}
            {streamActive && videoReady && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-36 h-44 sm:w-40 sm:h-48 rounded-[50%] border-2 border-dashed border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                  <div className="text-[10px] text-emerald-300 font-bold bg-navy-950/80 px-2 py-0.5 rounded-full border border-emerald-400/40">
                    Align Face
                  </div>
                </div>
              </div>
            )}

            {/* Loading Spinner while camera initializes */}
            {(!streamActive || !videoReady) && !cameraError && (
              <div className="flex flex-col items-center justify-center p-4 space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <p className="text-xs font-medium">Connecting to camera...</p>
                <p className="text-[11px] text-slate-500">Or use Upload Photo below</p>
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && (
              <div className="p-4 text-center space-y-2.5 max-w-sm mx-auto">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs text-rose-300 font-medium leading-relaxed">
                  {cameraError}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    icon={RefreshCw}
                    onClick={startCamera}
                    loading={isStarting}
                  >
                    Retry
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={Upload}
                    onClick={triggerFileSelect}
                  >
                    Upload Photo from Device
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-navy-850 p-3 rounded-xl border border-slate-750">
        <div className="text-[11px] text-slate-300 space-y-0.5">
          <p className="font-semibold text-white flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Face Photo Verification:</span>
          </p>
          <p className="text-slate-400 text-[10.5px]">
            Take live camera selfie or upload clear face photo.
          </p>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 justify-end shrink-0">
          {capturedPreview ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={RefreshCw}
              onClick={handleRetake}
              className="text-xs font-semibold"
            >
              Change Photo / دوبارہ لیں
            </Button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={Upload}
                onClick={triggerFileSelect}
                className="text-xs text-slate-300 hover:text-white"
              >
                Upload Photo
              </Button>
              {streamActive && videoReady && (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  icon={Camera}
                  onClick={takeSnapshot}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20"
                >
                  Take Photo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
