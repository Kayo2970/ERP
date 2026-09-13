'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Check,
  Move,
  Sparkles,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  fileName?: string;
  title?: string;
  description?: string;
  outputSize?: number;
  onCropComplete: (file: File, dataUrl: string) => void;
  onClose: () => void;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  fileName = 'cropped-photo.jpg',
  title = 'Crop & Frame Photo',
  description = 'Drag to reposition and zoom to perfectly frame your photo.',
  outputSize = 640,
  onCropComplete,
  onClose,
}: ImageCropModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // Crop transformations
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview / Viewport DOM refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);

  // Reset transforms whenever modal opens with a new image
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageSrc]);

  // Handle image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalWidth(img.naturalWidth);
    setNaturalHeight(img.naturalHeight);
    setImageLoaded(true);
  };

  // Drag / Pan Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    if (viewportRef.current) {
      viewportRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      if (viewportRef.current && viewportRef.current.hasPointerCapture(e.pointerId)) {
        viewportRef.current.releasePointerCapture(e.pointerId);
      }
    }
  };

  // Wheel zoom inside viewport
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.8), 4));
  };

  const rotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetTransforms = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Generate cropped output canvas
  const handleApplyCrop = useCallback(async () => {
    if (!imageRef.current || !imageLoaded) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Fill canvas background with clean transparent / dark
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Viewport container measurement
      const viewportEl = viewportRef.current;
      const viewportWidth = viewportEl ? viewportEl.clientWidth : 300;
      const viewportHeight = viewportEl ? viewportEl.clientHeight : 300;

      // Crop box in viewport is centered square with width = viewportWidth
      const cropSize = Math.min(viewportWidth, viewportHeight);

      // Base scaling to fit viewport
      const fitScale = Math.max(cropSize / img.naturalWidth, cropSize / img.naturalHeight);
      const effectiveScale = fitScale * zoom;

      // Translate canvas center
      ctx.save();
      ctx.translate(outputSize / 2, outputSize / 2);

      // Scale factor from viewport pixels to target canvas pixels
      const scaleMultiplier = outputSize / cropSize;

      // Apply offset scaled to target size
      ctx.translate(offset.x * scaleMultiplier, offset.y * scaleMultiplier);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw image centered
      const drawW = img.naturalWidth * effectiveScale * scaleMultiplier;
      const drawH = img.naturalHeight * effectiveScale * scaleMultiplier;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Convert canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });

      if (!blob) {
        throw new Error('Failed to generate image file');
      }

      const croppedFile = new File([blob], fileName.replace(/\.[^/.]+$/, '') + '-cropped.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedFile, dataUrl);
      onClose();
    } catch (err) {
      console.error('Error cropping image:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [imageLoaded, outputSize, zoom, offset, rotation, fileName, onCropComplete, onClose]);

  // Live mini preview rendering
  useEffect(() => {
    if (!miniCanvasRef.current || !imageRef.current || !imageLoaded) return;
    const miniCanvas = miniCanvasRef.current;
    const ctx = miniCanvas.getContext('2d');
    if (!ctx) return;

    const size = 96;
    miniCanvas.width = size;
    miniCanvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;

    const img = imageRef.current;
    const viewportEl = viewportRef.current;
    const cropSize = viewportEl ? Math.min(viewportEl.clientWidth, viewportEl.clientHeight) : 300;

    const fitScale = Math.max(cropSize / img.naturalWidth, cropSize / img.naturalHeight);
    const effectiveScale = fitScale * zoom;
    const scaleMultiplier = size / cropSize;

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.translate(offset.x * scaleMultiplier, offset.y * scaleMultiplier);
    ctx.rotate((rotation * Math.PI) / 180);

    const drawW = img.naturalWidth * effectiveScale * scaleMultiplier;
    const drawH = img.naturalHeight * effectiveScale * scaleMultiplier;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [zoom, offset, rotation, imageLoaded]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-theme-card-bg border border-theme-card-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme-card-border flex items-center justify-between bg-theme-header-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-theme-text-primary">{title}</h3>
              <p className="text-xs text-theme-text-secondary">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-theme-text-secondary hover:text-theme-text-primary rounded-lg hover:bg-theme-card-border/50 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Workspace */}
        <div className="p-4 sm:p-6 flex flex-col items-center gap-5 overflow-y-auto">
          {/* Viewport Area */}
          <div className="relative flex flex-col items-center w-full">
            <div
              ref={viewportRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              className={`relative w-72 h-72 sm:w-80 sm:h-80 rounded-2xl overflow-hidden bg-neutral-950 border-2 border-accent/40 shadow-inner select-none touch-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Hidden raw image for measurements */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview source"
                onLoad={handleImageLoad}
                className="hidden"
                crossOrigin="anonymous"
              />

              {/* Positioned transformed image view */}
              {imageLoaded && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Transforming image"
                    className="max-w-none pointer-events-none"
                    style={{
                      width:
                        naturalWidth >= naturalHeight
                          ? 'auto'
                          : `${320}px`,
                      height:
                        naturalWidth >= naturalHeight
                          ? `${320}px`
                          : 'auto',
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Circular Avatar / Card Framing Mask & Rule of Thirds Grid */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Dark Vignette outside circular target */}
                <div
                  className="w-full h-full"
                  style={{
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                    borderRadius: '50%',
                  }}
                />

                {/* Circular Boundary Ring */}
                <div className="absolute inset-0 rounded-full border border-white/40 shadow-sm" />

                {/* Subtle Grid Guidelines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              </div>

              {/* Drag Hint Badge */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white/80 font-medium flex items-center gap-1 pointer-events-none">
                <Move className="h-3 w-3" />
                Drag to frame
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full max-w-md flex flex-col gap-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3 bg-theme-background/50 p-2.5 rounded-xl border border-theme-card-border">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 0.15, 0.8))}
                className="p-1 text-theme-text-secondary hover:text-theme-text-primary rounded hover:bg-white/5 cursor-pointer transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min="0.8"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-accent h-1.5 bg-theme-card-border rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 0.15, 3.5))}
                className="p-1 text-theme-text-secondary hover:text-theme-text-primary rounded hover:bg-white/5 cursor-pointer transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono font-medium text-theme-text-secondary w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Actions & Live Mini Preview */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={rotate90}
                  className="px-3 py-1.5 rounded-xl bg-theme-card-border/40 hover:bg-theme-card-border border border-theme-card-border text-xs font-medium text-theme-text-primary flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Rotate
                </button>
                <button
                  type="button"
                  onClick={resetTransforms}
                  className="px-3 py-1.5 rounded-xl bg-theme-card-border/40 hover:bg-theme-card-border border border-theme-card-border text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Reset alignment"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>

              {/* Side-by-side Mini Previews (Circular Avatar & Card Badge) */}
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-theme-text-secondary">Preview</p>
                </div>
                {/* Circular preview */}
                <div
                  className="h-10 w-10 rounded-full overflow-hidden border-2 border-accent/60 bg-black shadow-md flex items-center justify-center shrink-0"
                  title="Avatar framing"
                >
                  <canvas ref={miniCanvasRef} className="h-full w-full object-cover" />
                </div>
                {/* Card-rounded preview */}
                <div
                  className="h-10 w-10 rounded-xl overflow-hidden border border-white/20 bg-black shadow-md flex items-center justify-center shrink-0"
                  title="Visiting Card badge framing"
                >
                  <canvas
                    ref={(canvas) => {
                      if (!canvas || !miniCanvasRef.current) return;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        canvas.width = 96;
                        canvas.height = 96;
                        ctx.drawImage(miniCanvasRef.current, 0, 0);
                      }
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-theme-card-border flex items-center justify-end gap-3 bg-theme-header-bg/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-card-border/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={!imageLoaded || isProcessing}
            className="px-5 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Apply & Use Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
