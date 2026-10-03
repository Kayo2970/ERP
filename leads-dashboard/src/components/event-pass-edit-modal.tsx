'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Ticket,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  Palette,
  Eye,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import {
  EventItem,
  EventPassItem,
  EventPassType,
  EventGuestCategory,
  PassTheme,
  authHeaders,
  expandDateRange,
  formatValidDaysLabel,
  updateEventPass,
} from '@/lib/local-data';
import { EventPassKeycard } from './event-pass-keycard';
import { PassColorControls, PassTextColorControls, PassValidityPicker } from './pass-design-controls';

interface EventPassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pass: EventPassItem | null;
  events?: EventItem[];
  currentUserName: string;
  onPassUpdated: (updatedPass: EventPassItem) => void;
}

const PASS_TYPES: EventPassType[] = [
  'VIP Pass',
  'Keynote Speaker',
  'Executive Delegate',
  'Student Delegate',
  'Guest Pass',
  'Press / Media',
  'Organizer',
  'Other',
];

const GUEST_CATEGORIES: EventGuestCategory[] = [
  'VIP Dignitary',
  'Keynote Speaker',
  'Faculty',
  'Student',
  'Industry Partner',
  'Alumni',
  'Press / Media',
  'Organizer / Crew',
  'Special Guest',
  'Other',
];

export function EventPassEditModal({
  isOpen,
  onClose,
  pass,
  events = [],
  currentUserName,
  onPassUpdated,
}: EventPassEditModalProps) {
  const [attendeeName, setAttendeeName] = useState('');
  const [guestCategory, setGuestCategory] = useState<EventGuestCategory>('VIP Dignitary');
  const [passType, setPassType] = useState<EventPassType>('VIP Pass');
  const [attendeeOrg, setAttendeeOrg] = useState('');
  const [roomOrVenue, setRoomOrVenue] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'Checked In' | 'Cancelled'>('Active');
  const [passColor, setPassColor] = useState('#0b1526');
  const [colorMode, setColorMode] = useState<'gradient' | 'solid'>('solid');
  const [passGradient, setPassGradient] = useState('linear-gradient(145deg, #0d2342 0%, #030712 100%)');
  const [gradientEndColor, setGradientEndColor] = useState('#030712');
  const [textColor, setTextColor] = useState('');
  const [labelColor, setLabelColor] = useState('');
  const [eventId, setEventId] = useState('');
  const [validityDate, setValidityDate] = useState('');
  const [selectedValidDays, setSelectedValidDays] = useState<string[] | null>(null);
  const [theme, setTheme] = useState<PassTheme | undefined>(undefined);
  const skipDayReset = useRef(true);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    walletSynced?: boolean;
  } | null>(null);

  useEffect(() => {
    if (pass) {
      setAttendeeName(pass.attendeeName || '');
      setGuestCategory(pass.guestCategory || 'VIP Dignitary');
      setPassType(pass.passType || 'VIP Pass');
      setAttendeeOrg(pass.attendeeOrg || '');
      setRoomOrVenue(pass.roomOrVenue || pass.eventVenue || '');
      setAttendeeEmail(pass.attendeeEmail || '');
      setAttendeePhone(pass.attendeePhone || '');
      setStatus(pass.status || 'Active');
      setPassColor(pass.passColor || '#0b1526');
      const grad = pass.passGradient;
      setColorMode(grad ? 'gradient' : 'solid');
      if (grad) {
        setPassGradient(grad);
        const hexes = grad.match(/#[0-9a-fA-F]{6}/g) || [];
        if (hexes[0]) setPassColor(hexes[0]);
        if (hexes[1]) setGradientEndColor(hexes[1]);
      }
      setTextColor(pass.textColor || '');
      setLabelColor(pass.labelColor || '');
      setEventId(pass.eventId);
      setValidityDate(pass.validityDate || '');
      setSelectedValidDays(pass.validDays && pass.validDays.length > 0 ? pass.validDays : null);
      skipDayReset.current = true;
      setNotes(pass.notes || '');
      setErrorMsg('');
      setSuccessInfo(null);
    }
  }, [pass, isOpen]);

  const selectedEvent = events.find((e) => e.id === eventId);
  const eventChanged = !!pass && eventId !== pass.eventId;

  // Picking a different event resets the valid-day selection to that event's days
  useEffect(() => {
    if (skipDayReset.current) {
      skipDayReset.current = false;
      return;
    }
    setSelectedValidDays(null);
  }, [eventId]);

  // The event's own pass look (artwork, colours) — same data the public pass page uses
  useEffect(() => {
    if (!isOpen || !eventId || eventId === 'standalone' || eventId.startsWith('custom-')) {
      setTheme(undefined);
      return;
    }
    let cancelled = false;
    fetch(`/api/events/${eventId}/pass-theme`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : undefined))
      .then((t) => {
        if (!cancelled) setTheme(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eventId, isOpen]);

  if (!isOpen || !pass) return null;

  const eventDays = selectedEvent && !selectedEvent.datesTBD ? expandDateRange(selectedEvent.startDate, selectedEvent.endDate) : [];
  const originalDays = pass.validDays || [];
  const dayChoices = eventDays.length > 0 ? eventDays : originalDays;
  const effectiveValidDays = selectedValidDays
    ? selectedValidDays.filter((d) => dayChoices.includes(d) || dayChoices.length === 0)
    : eventChanged && eventDays.length > 0
    ? eventDays
    : originalDays.length > 0
    ? originalDays
    : eventDays.length > 1
    ? eventDays
    : validityDate
    ? [validityDate]
    : [];
  const eventDateLabel = selectedEvent
    ? selectedEvent.datesTBD
      ? 'Dates TBD'
      : `${selectedEvent.startDate}${selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate ? ` – ${selectedEvent.endDate}` : ''}`
    : pass.eventDate;
  const displayValidity = effectiveValidDays.length > 0 ? formatValidDaysLabel(effectiveValidDays) : validityDate || eventDateLabel || "";
  const toggleValidDay = (d: string) => {
    const base = selectedValidDays ?? effectiveValidDays;
    const next = base.includes(d) ? base.filter((x) => x !== d) : [...base, d].sort();
    setSelectedValidDays(next.length === 0 ? base : next);
  };
  const resolvedEventName = selectedEvent?.title || pass.eventName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName.trim()) {
      setErrorMsg('Attendee name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessInfo(null);

    try {
      const result = await updateEventPass(
        pass.id,
        {
          attendeeName: attendeeName.trim(),
          guestCategory,
          passType,
          attendeeOrg: attendeeOrg.trim() || undefined,
          roomOrVenue: roomOrVenue.trim() || undefined,
          attendeeEmail: attendeeEmail.trim() || undefined,
          attendeePhone: attendeePhone.trim() || undefined,
          status,
          passColor,
          passGradient: colorMode === 'gradient' ? passGradient : undefined,
          textColor: textColor || undefined,
          labelColor: labelColor || undefined,
          validDays: effectiveValidDays.length > 0 ? effectiveValidDays : undefined,
          validityDate: displayValidity,
          ...(eventChanged && selectedEvent
            ? {
                eventId: selectedEvent.id,
                eventName: selectedEvent.title,
                eventDate: eventDateLabel,
                eventVenue: selectedEvent.location || pass.eventVenue,
              }
            : {}),
          notes: notes.trim() || undefined,
        },
        currentUserName
      );

      if (!result) {
        throw new Error('Failed to update pass. Pass record not found.');
      }

      onPassUpdated(result.pass);
      setSuccessInfo({
        message: 'Pass details updated successfully.',
        walletSynced: result.walletUpdated,
      });

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update pass.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15 border border-accent/30 text-accent">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Edit Event Pass</h3>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold">
                  {pass.serialNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                Event: <span className="text-slate-300 font-semibold">{pass.eventName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <div className="space-y-4 min-w-0">
          {/* Live Wallet Sync Notice Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-500/20 flex items-start gap-2.5">
            <Smartphone className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-bold text-sky-400">Live Apple &amp; Google Wallet Sync:</span>{' '}
              When you save changes, if this pass has been issued or installed on Apple Wallet / Google Wallet, updates will be pushed automatically to the attendee's device lock screen.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {successInfo.message}
                {successInfo.walletSynced ? ' (Apple & Google Wallet pass synced!)' : ''}
              </span>
            </div>
          )}

          {/* Event */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              Event
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
            >
              {!events.some((e) => e.id === pass.eventId) && (
                <option value={pass.eventId} className="bg-slate-900 text-white">{pass.eventName} (current)</option>
              )}
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-slate-900 text-white">{ev.title}</option>
              ))}
            </select>
            {eventChanged && (
              <p className="mt-1 text-[10px] text-amber-400">Moving this pass to another event — name, dates and venue follow the new event.</p>
            )}
          </div>

          {/* Row 1: Attendee Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-accent" />
                Attendee Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                placeholder="e.g. Dr. Jane Smith"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Guest Category
              </label>
              <select
                value={GUEST_CATEGORIES.includes(guestCategory) ? guestCategory : 'Other'}
                onChange={(e) => setGuestCategory(e.target.value as EventGuestCategory)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                {GUEST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
              {(!GUEST_CATEGORIES.includes(guestCategory) || guestCategory === 'Other') && (
                <input
                  type="text"
                  value={guestCategory === 'Other' ? '' : guestCategory}
                  onChange={(e) => setGuestCategory((e.target.value || 'Other') as EventGuestCategory)}
                  placeholder="Specify other guest category"
                  className="mt-2 w-full bg-slate-950/80 border border-accent/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-accent"
                />
              )}
            </div>
          </div>

          {/* Row 2: Pass Tier / Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-accent" />
                Pass Tier / Type
              </label>
              <select
                value={PASS_TYPES.includes(passType) ? passType : 'Other'}
                onChange={(e) => setPassType(e.target.value as EventPassType)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                {PASS_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-white">
                    {t}
                  </option>
                ))}
              </select>
              {(!PASS_TYPES.includes(passType) || passType === 'Other') && (
                <input
                  type="text"
                  value={passType === 'Other' ? '' : passType}
                  onChange={(e) => setPassType((e.target.value || 'Other') as EventPassType)}
                  placeholder="Specify other pass type"
                  className="mt-2 w-full bg-slate-950/80 border border-sky-500/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admission Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="Active" className="bg-slate-900 text-sky-400">Active (Ready for Scan)</option>
                <option value="Checked In" className="bg-slate-900 text-emerald-400">Checked In (Admitted)</option>
                <option value="Cancelled" className="bg-slate-900 text-rose-400">Cancelled / Void</option>
              </select>
            </div>
          </div>

          {/* Row 3: Organization & Assigned Room / Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-accent" />
                Organization / Department
              </label>
              <input
                type="text"
                value={attendeeOrg}
                onChange={(e) => setAttendeeOrg(e.target.value)}
                placeholder="e.g. Faculty of Engineering, RUAS"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                Assigned Room / Venue
              </label>
              <input
                type="text"
                value={roomOrVenue}
                onChange={(e) => setRoomOrVenue(e.target.value)}
                placeholder="e.g. Main Auditorium / Seminar Hall 2"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Row 4: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-accent" />
                Attendee Email
              </label>
              <input
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="guest@domain.com"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-accent" />
                Attendee Phone
              </label>
              <input
                type="tel"
                value={attendeePhone}
                onChange={(e) => setAttendeePhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Validity */}
          {(dayChoices.length > 0 || validityDate) && (
            <PassValidityPicker
              eventDays={dayChoices}
              effectiveValidDays={effectiveValidDays}
              selectedValidDays={selectedValidDays}
              setSelectedValidDays={setSelectedValidDays}
              toggleValidDay={toggleValidDay}
              validityDate={validityDate}
              setValidityDate={setValidityDate}
              displayValidity={displayValidity}
            />
          )}

          {/* Design */}
          <PassColorControls
            colorMode={colorMode}
            setColorMode={setColorMode}
            passColor={passColor}
            setPassColor={setPassColor}
            passGradient={passGradient}
            setPassGradient={setPassGradient}
            gradientEndColor={gradientEndColor}
            setGradientEndColor={setGradientEndColor}
            activeTheme={theme}
          />
          <PassTextColorControls textColor={textColor} setTextColor={setTextColor} labelColor={labelColor} setLabelColor={setLabelColor} />

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Special Instructions / Dietary / Access Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Stage front row seating, special escort required"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-accent hover:bg-accent/90 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-accent/25 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin block" />
                  <span>Updating &amp; Syncing Pass…</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save &amp; Update Pass</span>
                </>
              )}
            </button>
          </div>
          </div>

          {/* Live preview: exactly the pass the recipient receives */}
          <aside className="lg:sticky lg:top-0 self-start space-y-2">
            <p className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-accent" /> Live preview — the issued pass
            </p>
            <EventPassKeycard
              key={pass.id}
              pass={{
                attendeeName: attendeeName || 'Guest / Attendee Name',
                passType,
                guestCategory,
                serialNumber: pass.serialNumber,
                eventName: resolvedEventName,
                eventDate: eventDateLabel,
                eventVenue: selectedEvent?.location || pass.eventVenue,
                roomOrVenue: roomOrVenue || undefined,
                attendeeOrg: attendeeOrg || undefined,
                validityDate: displayValidity,
                validDays: effectiveValidDays,
                passColor,
                passGradient: colorMode === 'gradient' ? passGradient : undefined,
                textColor: textColor || undefined,
                labelColor: labelColor || undefined,
              }}
              theme={theme}
              autoOpen
              autoExtract
              showActions={false}
            />
          </aside>
        </form>
      </div>
    </div>
  );
}
