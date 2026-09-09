'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  CameraOff,
  RefreshCw,
  Zap,
  ZapOff,
  User,
  Ticket,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  MapPin,
  Tag,
} from 'lucide-react';
import { EventPassItem, updateEventPassStatus } from '@/lib/local-data';

interface EventPassScannerProps {
  currentUserName: string;
  onPassCheckedIn?: (pass: EventPassItem) => void;
}

export function EventPassScanner({
  currentUserName,
  onPassCheckedIn,
}: EventPassScannerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    pass?: EventPassItem;
    status?: string;
    isAlreadyCheckedIn?: boolean;
    reason?: string;
  } | null>(null);

  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Live Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setTorchOn(false);
    setHasTorch(false);
  };

  // Start Camera Stream
  const startCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    stopCamera();
    setCameraError('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported on this browser or environment.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);

      // Check for torch & multi-camera availability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) setHasTorch(true);
      }

      const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      if (videoInputs.length > 1) setHasMultipleCameras(true);

      // Start continuous scanning loop
      startScanningLoop();
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Unable to start camera stream. Please check camera permissions.');
      }
      setIsCameraActive(false);
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  const switchCamera = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Continuous frame detection using native BarcodeDetector or fallback
  const startScanningLoop = () => {
    if (typeof window === 'undefined') return;

    const hasBarcodeDetector = 'BarcodeDetector' in window;
    let detector: any = null;

    if (hasBarcodeDetector) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'pdf417'],
        });
      } catch (e) {
        detector = null;
      }
    }

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !detector) return;

      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue?.trim();
          if (rawValue) {
            handleScannedValue(rawValue);
          }
        }
      } catch (e) {
        // Frame scan drop is normal on fast movement
      }
    }, 250);
  };

  // Parse scanned raw value (JSON payload, URL param, or direct serial)
  const handleScannedValue = (raw: string) => {
    const now = Date.now();
    // 2.5 second cooldown per identical scan to avoid rapid duplicate triggers
    if (lastScannedRef.current.code === raw && now - lastScannedRef.current.time < 2500) {
      return;
    }

    lastScannedRef.current = { code: raw, time: now };

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch (e) {}
    }

    let parsedQuery = raw;

    // Check if it's a JSON string
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const json = JSON.parse(raw);
        if (json.serial) parsedQuery = json.serial;
        else if (json.passId) parsedQuery = json.passId;
      } catch (e) {}
    } else if (raw.includes('pass=')) {
      // Check if it's a URL with ?pass=LEADS-EVT-XXXX
      const match = raw.match(/pass=([^&]+)/);
      if (match && match[1]) parsedQuery = decodeURIComponent(match[1]);
    }

    setSearchQuery(parsedQuery);
    handleVerify(parsedQuery);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleVerify = async (queryToUse?: string) => {
    const q = (queryToUse || searchQuery).trim();
    if (!q) return;

    setIsVerifying(true);
    setVerificationResult(null);
    setCheckInSuccess(false);

    try {
      const res = await fetch('/api/events/all/passes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setVerificationResult({
          valid: true,
          pass: data.pass,
          status: data.status,
          isAlreadyCheckedIn: data.isAlreadyCheckedIn,
        });
      } else {
        setVerificationResult({
          valid: false,
          reason: data.reason || 'Invalid or unrecognized event pass.',
        });
      }
    } catch (err: any) {
      setVerificationResult({
        valid: false,
        reason: 'Verification request failed. Please check network connection.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckIn = () => {
    if (!verificationResult?.pass) return;
    const updated = updateEventPassStatus(verificationResult.pass.id, 'Checked In', currentUserName);
    if (updated) {
      setVerificationResult({
        ...verificationResult,
        pass: updated,
        status: 'Checked In',
        isAlreadyCheckedIn: true,
      });
      setCheckInSuccess(true);
      if (onPassCheckedIn) onPassCheckedIn(updated);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-6 border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#0D1F38]/95 shadow-2xl max-w-2xl mx-auto text-xs">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Turnstile Camera & QR Scanner
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Scan passes via smartphone camera or enter serial ID for instant admission.
            </p>
          </div>
        </div>

        {/* Live Camera Scanner Button */}
        <button
          type="button"
          onClick={() => (isCameraActive ? stopCamera() : startCamera())}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
            isCameraActive
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-accent text-white hover:bg-accent/90 shadow-accent/25'
          }`}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="h-4 w-4" /> Stop Camera
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> Open Camera Scanner
            </>
          )}
        </button>
      </div>

      {/* CAMERA ERROR BANNER */}
      {cameraError && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* LIVE CAMERA VIEWFINDER WITH HUD & RETICLE */}
      {isCameraActive && (
        <div className="relative w-full aspect-[4/3] max-h-80 rounded-2xl overflow-hidden bg-black border-2 border-accent shadow-2xl animate-in zoom-in-95 duration-200">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />

          {/* Top Camera Controls Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-md flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Scanning Turnstile QR
            </span>

            <div className="flex items-center gap-1.5">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                    torchOn
                      ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/40'
                      : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                  }`}
                  title="Toggle Flashlight / Torch"
                >
                  {torchOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                </button>
              )}

              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-2 rounded-xl bg-black/60 text-white border border-white/20 hover:bg-black/80 backdrop-blur-md transition-all cursor-pointer"
                  title="Switch Camera"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Viewfinder Target Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-accent rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-accent rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-accent rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-accent rounded-br-lg" />

              {/* Animated Laser Scanning Line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-[bounce_2s_infinite]" />
            </div>
          </div>

          {/* Bottom Hint */}
          <div className="absolute bottom-3 inset-x-0 text-center z-20">
            <span className="text-[10px] font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              Align event pass QR code within the target
            </span>
          </div>
        </div>
      )}

      {/* MANUAL SEARCH / SCAN INPUT (FOR HANDHELD GUNS OR SERIAL ENTRY) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Scan barcode/QR payload or enter serial ID (e.g. LEADS-EVT-2026-XXXX)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-medium focus:outline-none focus:border-accent text-xs"
          />
        </div>
        <button
          type="submit"
          disabled={isVerifying || !searchQuery.trim()}
          className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white font-extrabold rounded-xl transition-all shadow-md shadow-accent/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider"
        >
          {isVerifying ? (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Verify Pass'
          )}
        </button>
      </form>

      {/* VERIFICATION RESULT CARD */}
      {verificationResult && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {verificationResult.valid && verificationResult.pass ? (
            <div
              className={`p-6 rounded-2xl border space-y-4 ${
                verificationResult.isAlreadyCheckedIn
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}
            >
              {/* Header Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {verificationResult.isAlreadyCheckedIn ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                      <span className="font-bold text-amber-300 text-sm">
                        {checkInSuccess ? 'Checked In Successfully!' : 'Pass Already Checked In'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span className="font-bold text-emerald-300 text-sm">Genuine & Verified Pass</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-white font-bold">
                  {verificationResult.pass.serialNumber}
                </span>
              </div>

              {/* Attendee Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-black/30 border border-white/10 text-white">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Attendee</span>
                  <span className="text-sm font-extrabold block">{verificationResult.pass.attendeeName}</span>
                  {verificationResult.pass.guestCategory && (
                    <span className="inline-block text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 mt-0.5">
                      {verificationResult.pass.guestCategory}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Assigned Room / Venue</span>
                  <span className="text-xs font-bold text-sky-300 block flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-sky-400 shrink-0" />
                    {verificationResult.pass.roomOrVenue || verificationResult.pass.eventVenue || 'Main Auditorium'}
                  </span>
                  <span className="text-[10.5px] text-slate-300 block">
                    Tier: {verificationResult.pass.passType}
                  </span>
                </div>

                <div className="space-y-0.5 pt-2 border-t border-white/10">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Event</span>
                  <span className="text-xs font-semibold block truncate">{verificationResult.pass.eventName}</span>
                </div>

                <div className="space-y-0.5 pt-2 border-t border-white/10">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Validity / Issued</span>
                  <span className="text-xs text-slate-300 block">
                    {verificationResult.pass.validityDate || verificationResult.pass.eventDate || '2026'}
                  </span>
                </div>
              </div>

              {/* Check-in timestamp if already checked in */}
              {verificationResult.pass.checkedInAt && (
                <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 shrink-0" /> Checked in at{' '}
                  {new Date(verificationResult.pass.checkedInAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  by {verificationResult.pass.checkedInBy || 'Staff'}
                </div>
              )}

              {/* Action */}
              {!verificationResult.isAlreadyCheckedIn && (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Admit & Mark Checked In
                </button>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
              <div>
                <div className="font-bold text-rose-200">Verification Failed</div>
                <div className="text-xs text-rose-300/80">{verificationResult.reason}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EventPassScanner;
