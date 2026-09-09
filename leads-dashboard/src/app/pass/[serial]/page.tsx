'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Ticket,
  ChevronRight,
  ExternalLink,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { EventPassItem } from '@/lib/local-data';
import { InteractiveKeycardHolder } from '@/components/interactive-keycard-holder';
import { CardQrModal } from '@/components/card-qr-modal';

export default function PublicEventPassPage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = use(params);

  const [pass, setPass] = useState<EventPassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [walletLoadingMsg, setWalletLoadingMsg] = useState('');
  const [walletError, setWalletError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pass/${serial}`)
      .then((res) => {
        if (!res.ok) throw new Error('Pass not found');
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data.pass) {
          setPass(data.pass);
        } else if (!cancelled) {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serial]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://leadsnextgencentre.online';
  const passUrl = pass ? `${origin}/pass/${pass.serialNumber}` : '';

  // Generate & Download Apple Wallet Pass (.pkpass)
  const handleAddToAppleWallet = async () => {
    if (!pass) return;
    setWalletError('');
    setWalletLoadingMsg('Please wait, processing... Creating your Apple Wallet pass');

    try {
      const res = await fetch(`/api/events/${pass.eventId}/passes/${pass.id}/wallet`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Apple Wallet pass.');
      }

      if (data.appleUrl) {
        // Trigger download of the .pkpass file
        const a = document.createElement('a');
        a.href = data.appleUrl;
        a.download = `${pass.serialNumber}.pkpass`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error('No Apple Wallet pass file returned.');
      }
    } catch (err: any) {
      console.error('Apple Wallet error:', err);
      setWalletError(err.message || 'Unable to generate Apple Wallet pass.');
    } finally {
      setWalletLoadingMsg('');
    }
  };

  // Generate & Redirect to Google Wallet
  const handleAddToGoogleWallet = async () => {
    if (!pass) return;
    setWalletError('');
    setWalletLoadingMsg('Please wait, processing... Creating your Google Wallet pass');

    try {
      const res = await fetch(`/api/events/${pass.eventId}/passes/${pass.id}/wallet`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Google Wallet pass.');
      }

      if (data.googleSaveUrl) {
        window.open(data.googleSaveUrl, '_blank');
      } else {
        throw new Error('No Google Wallet save link available.');
      }
    } catch (err: any) {
      console.error('Google Wallet error:', err);
      setWalletError(err.message || 'Unable to generate Google Wallet pass.');
    } finally {
      setWalletLoadingMsg('');
    }
  };

  // Download .ics calendar invite
  const handleAddToCalendar = () => {
    if (!pass) return;
    const title = `${pass.eventName} (${pass.passType})`;
    const location = pass.roomOrVenue || pass.eventVenue || 'Main Auditorium, RUAS GG Campus';
    const description = `Official admission pass for ${pass.attendeeName}.\nPass Serial: ${pass.serialNumber}\nView digital pass: ${passUrl}`;
    
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endTime = new Date(now.getTime() + 28 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LEADS Next Gen Centre//Official Event Pass//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `UID:${pass.id}@leads-centre.org`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pass.serialNumber}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Share Pass link
  const handleSharePass = async () => {
    if (!pass) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Official Pass for ${pass.eventName}`,
          text: `Here is the official digital pass for ${pass.attendeeName} (${pass.passType}) at LEADS Next Gen Centre.`,
          url: passUrl,
        });
        return;
      } catch (e) {}
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(passUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-space-theme flex flex-col items-center justify-center p-4 relative z-0 overflow-hidden">
        <div className="glass-panel rounded-3xl px-8 py-6 flex items-center gap-3 border border-white/15 shadow-2xl backdrop-blur-2xl text-white">
          <div className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Loading Official Event Pass…</span>
        </div>
      </div>
    );
  }

  if (notFound || !pass) {
    return (
      <div className="min-h-screen bg-space-theme text-theme-text-primary flex flex-col items-center justify-center p-4 relative z-0 overflow-hidden">
        <div className="glass-panel w-full max-w-md rounded-3xl p-8 flex flex-col items-center text-center space-y-4 border border-white/20 dark:border-white/15 shadow-2xl backdrop-blur-2xl bg-slate-900/90 text-white">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold">Event Pass Not Found</h1>
          <p className="text-xs text-slate-300">
            This event pass does not exist or may have been revoked. Please check your invitation email or contact the event organizers.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all inline-flex items-center gap-2"
            >
              <span>Return to Centre</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCheckedIn = pass.status === 'Checked In';

  return (
    <div className="min-h-screen bg-space-theme text-theme-text-primary flex flex-col items-center p-4 sm:p-6 md:p-8 relative z-0 overflow-x-hidden">
      {/* Top Floating Branding */}
      <div className="w-full max-w-2xl flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-xs font-black tracking-wider uppercase text-white flex items-center gap-1.5">
              LEADS Next Gen Centre
              <span className="text-[10px] text-accent font-normal">• RUAS</span>
            </div>
            <p className="text-[10.5px] text-slate-400">Official Digital Turnstile Credential</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCheckedIn ? (
            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Checked In
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified Pass
            </span>
          )}
        </div>
      </div>

      {/* Main 3D Leather Card Holder Presentation */}
      <div className="w-full max-w-2xl flex flex-col items-center justify-center my-2 overflow-visible">
        <InteractiveKeycardHolder
          memberName={pass.attendeeName}
          memberRole={`${pass.passType}${pass.guestCategory ? ` • ${pass.guestCategory}` : ''}`}
          phone={pass.attendeePhone || ''}
          email={pass.attendeeEmail || ''}
          serialNumber={pass.serialNumber}
          accessLevel={`${pass.passType} — ${pass.roomOrVenue || pass.eventVenue || 'Main Auditorium'}`}
          validityPeriod={pass.validityDate || pass.eventDate || '2026'}
          issuingAuthority={pass.eventName || 'LEADS Next Gen Centre • RUAS'}
          cardUrl={passUrl}
          qrUrl="/card/leads-qr-code.png"
          showActions={true}
          autoOpen={true}
          isGeneratingWallet={Boolean(walletLoadingMsg)}
          walletError={walletError}
          onAddToAppleWallet={handleAddToAppleWallet}
          onAddToGoogleWallet={handleAddToGoogleWallet}
          onSaveContact={handleAddToCalendar}
        />
      </div>

      {/* Wallet Loading Banner */}
      {walletLoadingMsg && (
        <div className="w-full max-w-md my-3 p-3.5 bg-accent/20 border border-accent/40 rounded-2xl text-accent text-xs font-semibold flex items-center justify-center gap-2.5 animate-in fade-in zoom-in-95 shadow-lg shadow-accent/15">
          <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
          <span>{walletLoadingMsg}</span>
        </div>
      )}

      {/* Actions & Digital Wallet Suite */}
      <div className="w-full max-w-md space-y-3 mt-4">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleAddToAppleWallet}
            disabled={Boolean(walletLoadingMsg)}
            className="py-3 px-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/15 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Smartphone className="h-4 w-4 text-slate-300" />
            <span>Apple Wallet</span>
          </button>

          <button
            type="button"
            onClick={handleAddToGoogleWallet}
            disabled={Boolean(walletLoadingMsg)}
            className="py-3 px-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/15 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <ExternalLink className="h-4 w-4 text-emerald-400" />
            <span>Google Wallet</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleAddToCalendar}
            className="py-2.5 px-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl border border-white/10 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-sky-400" />
            <span>Add to Calendar</span>
          </button>

          <button
            type="button"
            onClick={handleSharePass}
            className="py-2.5 px-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl border border-white/10 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-amber-400" />
            <span>{copiedLink ? 'Link Copied!' : 'Share Pass'}</span>
          </button>
        </div>

        {/* Turnstile Access Summary Card */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-slate-950/60 backdrop-blur-xl text-white space-y-2.5 mt-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 border-b border-white/10 pb-2">
            <span>Event Turnstile Entry Guidelines</span>
            <span className="font-mono text-accent">{pass.serialNumber}</span>
          </div>

          <div className="space-y-1 text-[11.5px] text-slate-300">
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span><strong>Assigned Venue:</strong> {pass.roomOrVenue || pass.eventVenue || 'Main Auditorium'}</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Date &amp; Schedule:</strong> {pass.validityDate || pass.eventDate || '2026'}</span>
            </div>
            <div className="flex items-start gap-2">
              <QrCode className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Present this QR code or your Apple/Google Wallet pass at official turnstiles for high-speed automated check-in.</span>
            </div>
          </div>
        </div>
      </div>

      <CardQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={passUrl}
        title="Event Admission QR Code"
        subtitle={pass.attendeeName}
      />
    </div>
  );
}
