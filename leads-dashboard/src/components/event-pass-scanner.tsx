'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Ticket,
  Calendar,
  Building2,
  Clock,
  Sparkles,
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
    <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-6 border border-white/15 bg-theme-card/90 shadow-2xl max-w-2xl mx-auto text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-theme-text-primary">Pass & QR Turnstile Verifier</h2>
            <p className="text-xs text-theme-text-secondary">
              Scan or enter serial ID to verify genuineness and check in attendees.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH / SCAN INPUT */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-theme-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Scan barcode/QR payload or paste serial (e.g. LEADS-EVT-2026-XXXX)"
            className="w-full pl-10 pr-4 py-2.5 bg-theme-background/50 border border-theme-card-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:border-accent text-xs"
          />
        </div>
        <button
          type="submit"
          disabled={isVerifying || !searchQuery.trim()}
          className="px-5 py-2.5 bg-accent hover:bg-primary-light text-white font-bold rounded-xl transition-all shadow-md shadow-accent/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                      <span className="font-bold text-amber-300 text-sm">
                        {checkInSuccess ? 'Checked In Successfully!' : 'Pass Already Checked In'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="font-bold text-emerald-300 text-sm">Genuine & Verified Pass</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-black/40 border border-white/10">
                  {verificationResult.pass.serialNumber}
                </span>
              </div>

              {/* Attendee Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-black/30 border border-white/10 text-white">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Attendee</span>
                  <span className="text-sm font-bold block">{verificationResult.pass.attendeeName}</span>
                  {verificationResult.pass.attendeeOrg && (
                    <span className="text-[11px] text-slate-300 block">{verificationResult.pass.attendeeOrg}</span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Pass Type</span>
                  <span className="text-xs font-bold text-sky-300 block">{verificationResult.pass.passType}</span>
                  {verificationResult.pass.seatOrZone && (
                    <span className="text-[11px] text-slate-300 block">Zone: {verificationResult.pass.seatOrZone}</span>
                  )}
                </div>

                <div className="space-y-0.5 pt-2 border-t border-white/10">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Event</span>
                  <span className="text-xs font-semibold block truncate">{verificationResult.pass.eventName}</span>
                </div>

                <div className="space-y-0.5 pt-2 border-t border-white/10">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Issued At</span>
                  <span className="text-xs text-slate-300 block">
                    {new Date(verificationResult.pass.issuedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Check-in timestamp if already checked in */}
              {verificationResult.pass.checkedInAt && (
                <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Checked in at{' '}
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
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer text-xs"
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
