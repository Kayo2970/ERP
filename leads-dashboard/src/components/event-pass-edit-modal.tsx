'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import {
  EventPassItem,
  EventPassType,
  EventGuestCategory,
  updateEventPass,
} from '@/lib/local-data';
import { PASS_COLOR_PRESETS } from './event-pass-studio';

interface EventPassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pass: EventPassItem | null;
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
];

export function EventPassEditModal({
  isOpen,
  onClose,
  pass,
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
      setNotes(pass.notes || '');
      setErrorMsg('');
      setSuccessInfo(null);
    }
  }, [pass, isOpen]);

  if (!isOpen || !pass) return null;

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
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
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
                value={guestCategory}
                onChange={(e) => setGuestCategory(e.target.value as EventGuestCategory)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                {GUEST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
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
                value={passType}
                onChange={(e) => setPassType(e.target.value as EventPassType)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                {PASS_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-white">
                    {t}
                  </option>
                ))}
              </select>
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

          {/* Color Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-accent" />
              Pass Color / Theme Preset
            </label>
            <div className="flex flex-wrap gap-2">
              {PASS_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setPassColor(preset.hex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                    passColor === preset.hex
                      ? 'border-accent bg-accent/20 text-white shadow-lg shadow-accent/20 scale-105'
                      : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/30"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

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
        </form>
      </div>
    </div>
  );
}
