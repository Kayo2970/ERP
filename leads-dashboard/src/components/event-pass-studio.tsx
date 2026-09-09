'use client';

import React, { useState } from 'react';
import {
  Ticket,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Sparkles,
  Printer,
  Send,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { EventItem, EventPassItem, EventPassType, addEventPass } from '@/lib/local-data';

interface EventPassStudioProps {
  events: EventItem[];
  currentUserId?: string;
  currentUserName: string;
  currentUserEmail?: string;
  onPassIssued?: (pass: EventPassItem) => void;
}

const PASS_TYPES: { type: EventPassType; label: string; color: string; badge: string }[] = [
  { type: 'VIP Pass', label: 'VIP Pass', color: 'from-amber-500/20 to-amber-700/20 border-amber-500/40 text-amber-300', badge: 'VIP ACCESS' },
  { type: 'Keynote Speaker', label: 'Keynote Speaker', color: 'from-purple-500/20 to-purple-700/20 border-purple-500/40 text-purple-300', badge: 'SPEAKER' },
  { type: 'Executive Delegate', label: 'Executive Delegate', color: 'from-sky-500/20 to-blue-700/20 border-sky-500/40 text-sky-300', badge: 'EXECUTIVE' },
  { type: 'Student Delegate', label: 'Student Delegate', color: 'from-emerald-500/20 to-teal-700/20 border-emerald-500/40 text-emerald-300', badge: 'STUDENT' },
  { type: 'Guest Pass', label: 'Guest Pass', color: 'from-slate-500/20 to-slate-700/20 border-slate-500/40 text-slate-300', badge: 'GUEST' },
  { type: 'Press / Media', label: 'Press / Media', color: 'from-rose-500/20 to-red-700/20 border-rose-500/40 text-rose-300', badge: 'PRESS' },
  { type: 'Organizer', label: 'Organizer / Crew', color: 'from-indigo-500/20 to-indigo-700/20 border-indigo-500/40 text-indigo-300', badge: 'CREW' },
];

export function EventPassStudio({
  events,
  currentUserName,
  currentUserEmail,
  onPassIssued,
}: EventPassStudioProps) {
  const activeEvents = events.filter((e) => e.status !== 'completed' && e.status !== 'archived');
  const defaultEvent = activeEvents[0] || events[0];

  const [selectedEventId, setSelectedEventId] = useState(defaultEvent?.id || '');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [attendeeOrg, setAttendeeOrg] = useState('');
  const [passType, setPassType] = useState<EventPassType>('VIP Pass');
  const [seatOrZone, setSeatOrZone] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedPass, setIssuedPass] = useState<EventPassItem | null>(null);
  const [successToast, setSuccessToast] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || defaultEvent;
  const currentPassMeta = PASS_TYPES.find((p) => p.type === passType) || PASS_TYPES[0];

  // Dynamic preview serial & QR sample
  const previewSerial = `LEADS-EVT-2026-${(attendeeName || 'GUEST').slice(0, 3).toUpperCase()}-99`;
  const formattedEventDate = selectedEvent
    ? selectedEvent.datesTBD
      ? 'Dates TBD'
      : `${selectedEvent.startDate}${selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate ? ` – ${selectedEvent.endDate}` : ''}`
    : '2026';

  const handleIssuePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName.trim() || !selectedEvent) return;

    setIsSubmitting(true);
    try {
      const newPass = addEventPass({
        eventId: selectedEvent.id,
        eventName: selectedEvent.title,
        eventDate: formattedEventDate,
        eventVenue: selectedEvent.location || 'LEADS Next Gen Centre Auditorium',
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim() || undefined,
        attendeePhone: attendeePhone.trim() || undefined,
        attendeeOrg: attendeeOrg.trim() || undefined,
        passType,
        accessTier: passType === 'VIP Pass' ? 'All Access VIP' : 'General Admission',
        validityDate: formattedEventDate,
        seatOrZone: seatOrZone.trim() || undefined,
        notes: notes.trim() || undefined,
        issuedBy: currentUserName,
        issuedByEmail: currentUserEmail,
      });

      setIssuedPass(newPass);
      setSuccessToast(`Pass ${newPass.serialNumber} issued successfully!`);
      if (onPassIssued) onPassIssued(newPass);

      // Reset form fields
      setAttendeeName('');
      setAttendeeEmail('');
      setAttendeePhone('');
      setAttendeeOrg('');
      setSeatOrZone('');
      setNotes('');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: LIVE ENTRY FORM */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 md:p-8 space-y-6 border border-white/15 bg-theme-card/90 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text-primary">On-the-Spot Pass Studio</h2>
              <p className="text-xs text-theme-text-secondary">
                Issue verified event passes live at reception or helpdesks.
              </p>
            </div>
          </div>

          <form onSubmit={handleIssuePass} className="space-y-4 text-xs">
            {/* Event Selection */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                Select Event *
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-theme-background/50 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id} className="bg-slate-900 text-white">
                    {evt.title} ({evt.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Pass Type Pills */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                Pass Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PASS_TYPES.map((pt) => {
                  const isSelected = passType === pt.type;
                  return (
                    <button
                      type="button"
                      key={pt.type}
                      onClick={() => setPassType(pt.type)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                        isSelected
                          ? 'bg-accent text-white border-accent shadow-md shadow-accent/30'
                          : 'bg-theme-background/30 text-theme-text-secondary border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span>{pt.label}</span>
                      {isSelected && <Sparkles className="h-3 w-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attendee Name */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                Guest / Attendee Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-theme-text-secondary" />
                <input
                  type="text"
                  required
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="e.g. Dr. Raghavendra Rao / Alex Johnson"
                  className="w-full pl-10 pr-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
                />
              </div>
            </div>

            {/* Contact Grid: Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                  Email ID (optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-theme-text-secondary" />
                  <input
                    type="email"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    placeholder="attendee@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                  Mobile Number (optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-theme-text-secondary" />
                  <input
                    type="tel"
                    value={attendeePhone}
                    onChange={(e) => setAttendeePhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full pl-10 pr-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Org + Seat/Zone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                  Organization / Affiliation
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-theme-text-secondary" />
                  <input
                    type="text"
                    value={attendeeOrg}
                    onChange={(e) => setAttendeeOrg(e.target.value)}
                    placeholder="e.g. Ramaiah University / Google"
                    className="w-full pl-10 pr-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                  Seat / Zone / Tier
                </label>
                <input
                  type="text"
                  value={seatOrZone}
                  onChange={(e) => setSeatOrZone(e.target.value)}
                  placeholder="e.g. VIP Front Row / Hall A"
                  className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !attendeeName.trim()}
              className="w-full py-3.5 bg-accent hover:bg-primary-light text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-accent/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-xs"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Issue Live Verified Pass
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME PASS PREVIEW */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-4">
          <div className="flex items-center justify-between w-full max-w-sm px-2">
            <span className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" /> Live Pass Preview
            </span>
            <span className="text-[10px] font-semibold text-accent bg-accent/15 px-2.5 py-1 rounded-full border border-accent/30">
              Interactive
            </span>
          </div>

          {/* LUXURY PASS CARD */}
          <div className="w-full max-w-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 text-white relative p-6 space-y-5">
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <img src="/card/leads-logo.png" alt="LEADS Logo" className="h-8 w-auto object-contain" />
                <div>
                  <div className="text-[11px] font-extrabold tracking-wider uppercase text-white">
                    LEADS Next Gen Centre
                  </div>
                  <div className="text-[9px] text-sky-400 font-semibold">Official Event Access Pass</div>
                </div>
              </div>
              <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border ${currentPassMeta.color}`}>
                {currentPassMeta.badge}
              </span>
            </div>

            {/* Event Info */}
            <div className="space-y-1">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Event</div>
              <div className="text-sm font-extrabold text-white line-clamp-1">
                {selectedEvent?.title || 'Selected Event Name'}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-300">
                <Calendar className="h-3 w-3 text-sky-400" />
                <span>{formattedEventDate}</span>
              </div>
            </div>

            {/* Attendee Details Card */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div>
                <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Attendee</div>
                <div className="text-base font-extrabold text-white">
                  {attendeeName.trim() || 'Attendee Name'}
                </div>
              </div>

              {(attendeeOrg || seatOrZone) && (
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-white/10">
                  {attendeeOrg && (
                    <div>
                      <span className="text-[8px] text-slate-400 block">Affiliation</span>
                      <span className="font-semibold text-slate-200 truncate block">{attendeeOrg}</span>
                    </div>
                  )}
                  {seatOrZone && (
                    <div>
                      <span className="text-[8px] text-slate-400 block">Zone/Seat</span>
                      <span className="font-semibold text-sky-300 truncate block">{seatOrZone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QR Code & Turnstile Details */}
            <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-2xl text-slate-900 shadow-md">
              <div className="space-y-1 flex-1">
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Pass Serial ID</div>
                <div className="text-[11px] font-mono font-bold text-slate-900">
                  {issuedPass ? issuedPass.serialNumber : previewSerial}
                </div>
                <div className="text-[8.5px] font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Signed & Verified
                </div>
              </div>
              <div className="h-16 w-16 p-1 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                <img src="/card/leads-qr-code.png" alt="Pass QR" className="h-full w-full object-contain" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[8.5px] text-slate-400 pt-1 border-t border-white/10">
              <span>LEADS Next Gen Centre • RUAS</span>
              <span>Non-transferable</span>
            </div>
          </div>

          {/* PRINT & SHARE ACTIONS (when pass is issued) */}
          {issuedPass && (
            <div className="flex items-center gap-3 w-full max-w-sm animate-in fade-in duration-300">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/15"
              >
                <Printer className="h-3.5 w-3.5" /> Print Badge
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(issuedPass.serialNumber);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="py-2.5 px-4 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-sky-500/30"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedLink ? 'Copied ID' : 'Copy Serial'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventPassStudio;
