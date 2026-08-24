'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Copy, Printer, CheckCircle2, QrCode, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { PublicFormItem } from '@/lib/local-data';

interface FormQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: PublicFormItem | null;
}

export function FormQrModal({ isOpen, onClose, form }: FormQrModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const getFullUrl = () => {
    if (!form) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/forms/${form.slug}`;
    }
    return `/forms/${form.slug}`;
  };

  const fullUrl = getFullUrl();

  useEffect(() => {
    if (!isOpen || !form || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      fullUrl,
      {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) console.error('Failed to generate QR Code:', error);
      }
    );
  }, [isOpen, form, fullUrl]);

  if (!isOpen || !form) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    setIsGenerating(true);
    try {
      // Create a high-res printable canvas for poster export
      const downloadCanvas = document.createElement('canvas');
      const ctx = downloadCanvas.getContext('2d');
      if (!ctx) return;

      const width = 600;
      const height = 750;
      downloadCanvas.width = width;
      downloadCanvas.height = height;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Top Accent Bar
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(0.5, '#4f46e5');
      gradient.addColorStop(1, '#059669');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 12);

      // Border frame
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Brand Header
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MSRUAS LEADS — OFFICIAL REGISTRATION FORM', width / 2, 55);

      // Form Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      
      // Wrap Title text if long
      const words = form.title.split(' ');
      let line = '';
      let y = 95;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 500 && n > 0) {
          ctx.fillText(line.trim(), width / 2, y);
          line = words[n] + ' ';
          y += 32;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), width / 2, y);
      y += 20;

      // Subtitle / Event name
      if (form.eventName) {
        ctx.fillStyle = '#2563eb';
        ctx.font = '600 14px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Event: ${form.eventName}`, width / 2, y);
        y += 24;
      }

      // Draw QR Code
      if (canvasRef.current) {
        const qrSize = 340;
        const qrX = (width - qrSize) / 2;
        const qrY = y + 10;
        
        // Draw white card behind QR with shadow box
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 4;
        ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
        ctx.shadowColor = 'transparent'; // reset

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);

        ctx.drawImage(canvasRef.current, qrX, qrY, qrSize, qrSize);
        y = qrY + qrSize + 40;
      }

      // Scan Call to Action
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('Scan QR Code with camera to fill out form', width / 2, y);
      y += 24;

      // Public URL Text
      ctx.fillStyle = '#2563eb';
      ctx.font = '13px monospace';
      ctx.fillText(fullUrl, width / 2, y);
      y += 36;

      // Footer notice
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillText('Powered by MSRUAS LEADS Operations Portal', width / 2, height - 35);

      // Trigger Download
      const dataUrl = downloadCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${form.slug}-qr-code.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating printable QR card:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrDataUrl = canvasRef.current ? canvasRef.current.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${form.title}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              padding: 20px;
              color: #0f172a;
            }
            .poster {
              border: 2px solid #e2e8f0;
              border-radius: 20px;
              padding: 40px;
              text-align: center;
              max-width: 480px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            }
            h1 { margin: 0 0 10px 0; font-size: 22px; }
            p { margin: 4px 0; color: #64748b; font-size: 13px; }
            .url { font-family: monospace; color: #2563eb; font-weight: bold; margin-top: 15px; word-break: break-all; }
            img { margin: 25px 0; width: 280px; height: 280px; }
            @media print {
              body { padding: 0; }
              .poster { border: 1px solid #ccc; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="poster">
            <p><strong>MSRUAS LEADS &bull; PUBLIC REGISTRATION FORM</strong></p>
            <h1>${form.title}</h1>
            ${form.eventName ? `<p>Event: <strong>${form.eventName}</strong></p>` : ''}
            <img src="${qrDataUrl}" alt="Form QR Code" />
            <p><strong>Scan QR code to open form</strong></p>
            <p class="url">${fullUrl}</p>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col items-center text-center space-y-5 relative border border-white/20 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-xl hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center space-y-1.5 pt-2">
          <div className="h-12 w-12 bg-accent/15 border border-accent/30 rounded-2xl flex items-center justify-center text-accent shadow-inner">
            <QrCode className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-theme-text-primary">Form QR Code Preview</h2>
          <p className="text-xs text-theme-text-secondary max-w-xs line-clamp-1">
            {form.title}
          </p>
        </div>

        {/* Canvas Display Frame */}
        <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200/80 flex flex-col items-center justify-center space-y-2">
          <canvas ref={canvasRef} className="rounded-lg shadow-inner max-w-full" />
          <span className="text-[10px] text-slate-500 font-mono tracking-tight break-all px-2 max-w-[260px]">
            {fullUrl}
          </span>
        </div>

        <p className="text-[11px] text-theme-text-secondary max-w-xs">
          Scan this QR code with any smartphone camera to open and complete the registration form.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all border border-theme-border/40 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print Poster
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-theme-border/20 hover:bg-theme-border/40 text-theme-text-secondary hover:text-theme-text-primary text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Link Copied!' : 'Copy Form URL'}
            </button>

            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-theme-border/20 hover:bg-theme-border/40 text-theme-text-secondary hover:text-theme-text-primary rounded-xl transition-all"
              title="Open Form in New Tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
