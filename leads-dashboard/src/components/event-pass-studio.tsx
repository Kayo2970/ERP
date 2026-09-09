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
  CheckCircle2,
  ShieldCheck,
  RotateCw,
  Copy,
  MapPin,
  Clock,
  QrCode,
  Tag,
  Share2,
  ExternalLink,
  Layers,
  Upload,
  Download,
  Send,
  Smartphone,
  Eye,
  Palette,
} from 'lucide-react';
import {
  EventItem,
  EventPassItem,
  EventPassType,
  EventGuestCategory,
  addEventPass,
  getEventPasses,
  dispatchPassEmail,
} from '@/lib/local-data';
import styles from './event-pass-card.module.css';
import { AppleWalletPassPreview } from './apple-wallet-pass-preview';
import { EventPassBulkModal } from './event-pass-bulk-modal';
import { EventPassEmailModal } from './event-pass-email-modal';

interface EventPassStudioProps {
  events: EventItem[];
  currentUserId?: string;
  currentUserName: string;
  currentUserEmail?: string;
  onPassIssued?: (pass: EventPassItem) => void;
}

export const PASS_COLOR_PRESETS = [
  { name: 'Obsidian Black', hex: '#0b1526', ring: 'ring-slate-500' },
  { name: 'Sapphire Navy', hex: '#0d2342', ring: 'ring-sky-500' },
  { name: 'Emerald Forest', hex: '#063024', ring: 'ring-emerald-500' },
  { name: 'Amethyst Purple', hex: '#2b124c', ring: 'ring-purple-500' },
  { name: 'Burgundy Wine', hex: '#3e0f1e', ring: 'ring-rose-500' },
  { name: 'Amber Bronze', hex: '#3a2408', ring: 'ring-amber-500' },
  { name: 'Titanium Slate', hex: '#1e2530', ring: 'ring-slate-400' },
];

const PASS_TYPES: {
  type: EventPassType;
  label: string;
  colorClass: string;
  badge: string;
}[] = [
  {
    type: 'VIP Pass',
    label: 'VIP Pass',
    colorClass: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    badge: 'VIP ACCESS',
  },
  {
    type: 'Keynote Speaker',
    label: 'Keynote Speaker',
    colorClass: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    badge: 'KEYNOTE SPEAKER',
  },
  {
    type: 'Executive Delegate',
    label: 'Executive Delegate',
    colorClass: 'bg-sky-500/15 border-sky-400/40 text-sky-300',
    badge: 'EXECUTIVE',
  },
  {
    type: 'Student Delegate',
    label: 'Student Delegate',
    colorClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    badge: 'STUDENT DELEGATE',
  },
  {
    type: 'Guest Pass',
    label: 'Guest Pass',
    colorClass: 'bg-slate-500/15 border-slate-400/40 text-slate-300',
    badge: 'GUEST PASS',
  },
  {
    type: 'Press / Media',
    label: 'Press / Media',
    colorClass: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
    badge: 'PRESS & MEDIA',
  },
  {
    type: 'Organizer',
    label: 'Organizer / Crew',
    colorClass: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
    badge: 'CREW / ORGANIZER',
  },
];

const GUEST_CATEGORIES: { category: EventGuestCategory; label: string; icon: string }[] = [
  { category: 'Keynote Speaker', label: 'Keynote Speaker', icon: '🎙️' },
  { category: 'VIP Dignitary', label: 'VIP Dignitary', icon: '⭐' },
  { category: 'Faculty', label: 'Faculty / Academic', icon: '🏛️' },
  { category: 'Student', label: 'Student / Scholar', icon: '🎓' },
  { category: 'Industry Partner', label: 'Industry Partner', icon: '💼' },
  { category: 'Alumni', label: 'Alumni Network', icon: '🌟' },
  { category: 'Organizer / Crew', label: 'Organizer / Crew', icon: '🛡️' },
  { category: 'Press / Media', label: 'Press / Media', icon: '📸' },
  { category: 'Special Guest', label: 'Special Guest', icon: '✨' },
];

const ROOM_PRESETS = [
  'Main Auditorium - VIP Box',
  'Main Auditorium - Front Row',
  'Seminar Hall A - Room 102',
  'Seminar Hall B - Room 204',
  'Incubation Centre - Lab 1',
  'Executive Boardroom',
  'Exhibition Ground - Stall A1',
  'Media Briefing Room',
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
  const [guestCategory, setGuestCategory] = useState<EventGuestCategory>('VIP Dignitary');
  const [passType, setPassType] = useState<EventPassType>('VIP Pass');
  const [passColor, setPassColor] = useState<string>('#0b1526');
  const [roomOrVenue, setRoomOrVenue] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [attendeeOrg, setAttendeeOrg] = useState('');
  const [brandHeader, setBrandHeader] = useState('LEADS Next Gen Centre');
  const [validityDate, setValidityDate] = useState('');
  const [notes, setNotes] = useState('');

  // Modals & Preview mode
  const [previewMode, setPreviewMode] = useState<'luxury' | 'apple-wallet'>('luxury');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedPass, setIssuedPass] = useState<EventPassItem | null>(null);
  const [isDispatchingEmail, setIsDispatchingEmail] = useState(false);
  const [emailDispatchStatus, setEmailDispatchStatus] = useState<string>('');
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [showManualEmailPrompt, setShowManualEmailPrompt] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [copiedSerial, setCopiedSerial] = useState(false);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || defaultEvent;
  const currentPassMeta = PASS_TYPES.find((p) => p.type === passType) || PASS_TYPES[0];

  const formattedEventDate = selectedEvent
    ? selectedEvent.datesTBD
      ? 'Dates TBD'
      : `${selectedEvent.startDate}${
          selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate
            ? ` – ${selectedEvent.endDate}`
            : ''
        }`
    : '2026';

  const previewSerial = `LEADS-EVT-2026-${(attendeeName || 'GUEST').slice(0, 3).toUpperCase()}-99`;
  const displayRoom = roomOrVenue.trim() || selectedEvent?.location || 'Main Auditorium';
  const displayValidity = validityDate.trim() || formattedEventDate;

  const handleIssuePass = async (e: React.FormEvent) => {
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
        guestCategory,
        roomOrVenue: displayRoom,
        attendeeEmail: attendeeEmail.trim() || undefined,
        attendeePhone: attendeePhone.trim() || undefined,
        attendeeOrg: attendeeOrg.trim() || undefined,
        passType,
        accessTier: passType === 'VIP Pass' ? 'All Access VIP' : 'General Admission',
        validityDate: displayValidity,
        seatOrZone: displayRoom,
        passColor,
        notes: notes.trim() || undefined,
        issuedBy: currentUserName,
        issuedByEmail: currentUserEmail,
      });

      setIssuedPass(newPass);
      setSuccessToast(`Pass ${newPass.serialNumber} issued successfully for ${newPass.attendeeName}!`);
      if (onPassIssued) onPassIssued(newPass);

      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err: any) {
      console.error('Error issuing event pass:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatchIssuedPass = async (targetEmailOverride?: string) => {
    if (!issuedPass) return;
    const recipient = targetEmailOverride || issuedPass.attendeeEmail || manualEmailInput.trim();
    if (!recipient) {
      setShowManualEmailPrompt(true);
      return;
    }

    setIsDispatchingEmail(true);
    setEmailDispatchStatus('');

    try {
      const res = await dispatchPassEmail(issuedPass, recipient);
      if (res.success) {
        setEmailDispatchStatus(`Pass dispatched to ${recipient}!`);
        setShowManualEmailPrompt(false);
        setSuccessToast(`Pass ${issuedPass.serialNumber} dispatched to ${recipient}!`);
        setTimeout(() => setEmailDispatchStatus(''), 6000);
      } else {
        setEmailDispatchStatus(`Failed: ${res.error || 'Check SMTP settings'}`);
      }
    } catch (err: any) {
      setEmailDispatchStatus(`Failed: ${err?.message || 'Dispatch error'}`);
    } finally {
      setIsDispatchingEmail(false);
    }
  };

  const handleResetForNext = () => {
    setAttendeeName('');
    setAttendeeEmail('');
    setAttendeePhone('');
    setAttendeeOrg('');
    setRoomOrVenue('');
    setValidityDate('');
    setNotes('');
    setIssuedPass(null);
    setEmailDispatchStatus('');
    setShowManualEmailPrompt(false);
    setManualEmailInput('');
    setIsFlipped(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar: Bulk Import, Mail-Merge, Download Template */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#0D1F38]/95 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Ticket className="h-4 w-4 text-accent" /> Event Pass Actions
          </span>
          <span className="text-[10px] text-slate-500 font-medium hidden md:inline">
            • Design single pass, import CSV rosters, or email attendees
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/35 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Upload className="h-3.5 w-3.5" /> Bulk CSV Import
          </button>
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3.5 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/35 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Send className="h-3.5 w-3.5" /> Mail-Merge Dispatch
          </button>
        </div>
      </div>

      {successToast && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs animate-in fade-in duration-300 shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          {issuedPass && (
            <button
              type="button"
              onClick={handleResetForNext}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-xs font-bold rounded-lg cursor-pointer transition-all"
            >
              Issue Next Pass →
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: LIVE ON-THE-SPOT MANUAL ENTRY FORM */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 md:p-8 space-y-6 border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#0D1F38]/95 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  On-the-Spot Pass Studio
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Self-issue verified luxury passes manually during live events & symposiums.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Sync
            </span>
          </div>

          <form onSubmit={handleIssuePass} className="space-y-4 text-xs">
            {/* 1. Event Selection */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Active Event *
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-accent text-xs"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id} className="bg-slate-900 text-white">
                    {evt.title} ({evt.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Pass Header Branding Customization */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Pass Header Title / Organization</span>
                <span className="text-[10px] text-accent font-semibold lowercase">(branding)</span>
              </label>
              <input
                type="text"
                value={brandHeader}
                onChange={(e) => setBrandHeader(e.target.value)}
                placeholder="LEADS Next Gen Centre"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-accent text-xs"
              />
            </div>

            {/* 2. Guest / Attendee Name */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Guest / Attendee Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="e.g. Dr. Raghavendra Rao / Prof. Ananya Sharma"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-accent text-xs"
                />
              </div>
            </div>

            {/* 3. Guest Category Selector */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Guest Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {GUEST_CATEGORIES.map((gc) => {
                  const isSelected = guestCategory === gc.category;
                  return (
                    <button
                      type="button"
                      key={gc.category}
                      onClick={() => setGuestCategory(gc.category)}
                      className={`px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all border text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-accent text-white border-accent shadow-md shadow-accent/25'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-accent/40'
                      }`}
                    >
                      <span className="truncate">
                        {gc.icon} {gc.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Pass Type / Tier Pills */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Pass Type / Access Tier *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PASS_TYPES.map((pt) => {
                  const isSelected = passType === pt.type;
                  return (
                    <button
                      type="button"
                      key={pt.type}
                      onClick={() => setPassType(pt.type)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-sky-500/40'
                      }`}
                    >
                      <span className="truncate">{pt.label}</span>
                      {isSelected && <Sparkles className="h-3 w-3 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4.5. Pass Color Customization (Live on Card & Apple Wallet) */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-accent" />
                  <span>Pass Color Theme</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full border border-white/30 shadow-inner"
                    style={{ backgroundColor: passColor }}
                  />
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                    {passColor}
                  </span>
                </div>
              </div>

              {/* Color Presets & Custom Native Picker */}
              <div className="flex flex-wrap items-center gap-2">
                {PASS_COLOR_PRESETS.map((cp) => {
                  const isSelected = passColor.toLowerCase() === cp.hex.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={cp.hex}
                      onClick={() => setPassColor(cp.hex)}
                      title={cp.name}
                      className={`h-7 w-7 rounded-xl transition-all cursor-pointer relative flex items-center justify-center border ${
                        isSelected
                          ? 'scale-110 ring-2 ring-accent border-white shadow-md'
                          : 'border-white/20 hover:scale-105 opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: cp.hex }}
                    >
                      {isSelected && <Sparkles className="h-3 w-3 text-white drop-shadow" />}
                    </button>
                  );
                })}

                {/* Custom Color Input */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <label className="relative cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 border border-slate-300 dark:border-white/15 text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-all">
                    <span>Custom</span>
                    <input
                      type="color"
                      value={passColor}
                      onChange={(e) => setPassColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 5. Room / Venue / Hall Allocation */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Room / Venue / Hall Allocation *</span>
                <span className="text-[10px] text-accent font-semibold lowercase">
                  (e.g. Auditorium, VIP Box, Hall A)
                </span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={roomOrVenue}
                  onChange={(e) => setRoomOrVenue(e.target.value)}
                  placeholder="e.g. Main Auditorium - VIP Box 2 / Hall A Room 102"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-accent text-xs"
                />
              </div>
              {/* Quick Preset Badges */}
              <div className="flex flex-wrap gap-1 pt-1">
                {ROOM_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setRoomOrVenue(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-accent/15 text-slate-600 dark:text-slate-400 hover:text-accent border border-slate-200 dark:border-white/10 cursor-pointer transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Contact Details: Org & Structured Date Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Affiliation / Org (Optional)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={attendeeOrg}
                    onChange={(e) => setAttendeeOrg(e.target.value)}
                    placeholder="e.g. RUAS / Intel / IISc"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-accent text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Pass Validity Date</span>
                  {validityDate && (
                    <button
                      type="button"
                      onClick={() => setValidityDate('')}
                      className="text-[10px] text-sky-400 hover:underline"
                    >
                      Reset to Event
                    </button>
                  )}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={validityDate}
                    onChange={(e) => setValidityDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-accent text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 7. Contact Details: Mobile & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Email ID (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    placeholder="guest@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-accent text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Mobile / WhatsApp (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={attendeePhone}
                    onChange={(e) => setAttendeePhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-accent text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting || !attendeeName.trim()}
              className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-extrabold rounded-xl transition-all duration-200 shadow-xl shadow-accent/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-xs tracking-wider uppercase"
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

        {/* RIGHT COLUMN: REAL-TIME INTERACTIVE LIVE PASS PREVIEWS */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-4">
          {/* Dual Preview Switcher: 3D Luxury vs Apple Wallet (98% Match) */}
          <div className="flex items-center justify-between w-full max-w-[380px] px-1">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/15">
              <button
                type="button"
                onClick={() => setPreviewMode('luxury')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewMode === 'luxury'
                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                    : 'text-slate-500 dark:text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-3 w-3" /> 3D Luxury
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('apple-wallet')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewMode === 'apple-wallet'
                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                    : 'text-slate-500 dark:text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-3 w-3" /> Apple Wallet (98%)
              </button>
            </div>

            {previewMode === 'luxury' && (
              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 px-3 py-1 rounded-full border border-sky-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCw className="h-3 w-3" />
                {isFlipped ? 'Front' : 'Back'}
              </button>
            )}
          </div>

          {/* VIEW 1: 3D PHOTOREALISTIC LUXURY PASS CARD */}
          {previewMode === 'luxury' && (
            <div className={`${styles.passContainer} printableBadge`}>
              <div
                className={`${styles.passCardInner} ${isFlipped ? styles.isFlipped : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* FRONT FACE */}
                <div
                  className={`${styles.passFace} ${styles.passFront}`}
                  style={{
                    backgroundImage: `linear-gradient(145deg, ${passColor}ee 0%, #060c18fa 100%), url('/card/dark-blue-leather.jpg')`,
                  }}
                >
                  {/* Lanyard Cut */}
                  <div className={styles.lanyardSlot} />

                  {/* Header */}
                  <div className={styles.passHeader}>
                    <div className={styles.brandWrap}>
                      <img
                        src="/card/leads-logo.png"
                        alt="LEADS Logo"
                        className={styles.leadsLogo}
                      />
                      <div className={styles.brandText}>
                        <span className={styles.brandTitle}>{brandHeader}</span>
                        <span className={styles.brandSubtitle}>RUAS Executive Credential</span>
                      </div>
                    </div>
                    <span className={`${styles.passTypePill} ${currentPassMeta.colorClass}`}>
                      {currentPassMeta.badge}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className={styles.passBody}>
                    {/* Event Info */}
                    <div className={styles.eventRow}>
                      <div className={styles.eventTitleText}>
                        {selectedEvent?.title || 'Selected Event Name'}
                      </div>
                      <div className={styles.eventDateText}>
                        <Calendar className="h-3 w-3 text-sky-400 shrink-0" />
                        <span>{displayValidity}</span>
                      </div>
                    </div>

                    {/* Guest Identity Box */}
                    <div className={styles.guestBox}>
                      <div className={styles.guestCategoryTag}>
                        <Tag className="h-2.5 w-2.5" />
                        <span>{guestCategory}</span>
                      </div>
                      <div className={styles.attendeeNameText}>
                        {attendeeName.trim() || 'Guest / Attendee Name'}
                      </div>

                      <div className={styles.metaGrid}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Assigned Room / Venue</span>
                          <span className={`${styles.metaVal} ${styles.roomVal}`}>
                            📍 {displayRoom}
                          </span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Affiliation / Tier</span>
                          <span className={styles.metaVal}>
                            {attendeeOrg.trim() || 'Guest Invitee'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Turnstile Scanner Box */}
                  <div className={styles.qrModule}>
                    <div className={styles.qrDetails}>
                      <span className={styles.serialText}>
                        {issuedPass ? issuedPass.serialNumber : previewSerial}
                      </span>
                      <span className={styles.verifiedPill}>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Cryptographically Signed
                      </span>
                      <span className="text-[8px] text-slate-500 font-semibold">
                        Valid at all official event turnstiles
                      </span>
                    </div>
                    <div className={styles.qrImageBox}>
                      <img
                        src="/card/leads-qr-code.png"
                        alt="Verified Turnstile QR"
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={styles.passFooter}>
                    <span>{brandHeader} • RUAS</span>
                    <div className={styles.flipHint}>
                      <RotateCw className="h-2.5 w-2.5" />
                      <span>Tap to flip</span>
                    </div>
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  className={`${styles.passFace} ${styles.passBack}`}
                  style={{
                    backgroundImage: `linear-gradient(155deg, ${passColor}f2 0%, #080e1afa 100%), url('/card/dark-blue-leather.jpg')`,
                  }}
                >
                  {/* Lanyard Cut */}
                  <div className={styles.lanyardSlot} />

                  {/* Back Header */}
                  <div className={styles.passHeader}>
                    <div className={styles.brandWrap}>
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        Pass Terms & Protocol
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/30">
                      RUAS SECURE
                    </span>
                  </div>

                  {/* Magnetic Stripe Graphic */}
                  <div className={styles.magneticStripe} />

                  {/* Back Rules Content */}
                  <div className={styles.backContent}>
                    <div className={styles.ruleCard}>
                      <div className="text-[10px] font-extrabold text-white mb-2 uppercase tracking-wide">
                        Access & Security Policy
                      </div>
                      <div className={styles.ruleItem}>
                        <span className={styles.dot} />
                        <span>This pass grants admission to designated event halls, keynotes, and sessions.</span>
                      </div>
                      <div className={styles.ruleItem}>
                        <span className={styles.dot} />
                        <span>Strictly non-transferable. Must be visibly worn or presented at all check-in turnstiles.</span>
                      </div>
                      <div className={styles.ruleItem}>
                        <span className={styles.dot} />
                        <span>Real-time session and venue updates will be delivered via your digital pass.</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 text-[9.5px]">
                      <div className="text-slate-400 font-bold uppercase text-[8px]">Issued Authority</div>
                      <div className="text-white font-extrabold">{brandHeader} • RUAS</div>
                      <div className="text-sky-300 font-mono text-[9px]">
                        Issued By: {currentUserName || 'Staff Reception'}
                      </div>
                    </div>
                  </div>

                  {/* Back Footer */}
                  <div className={styles.passFooter}>
                    <span>Issuing Authority: {brandHeader} • RUAS</span>
                    <div className={styles.flipHint}>
                      <RotateCw className="h-2.5 w-2.5" />
                      <span>Back to front</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: 98% PIXEL-ACCURATE NATIVE APPLE WALLET PREVIEW */}
          {previewMode === 'apple-wallet' && (
            <AppleWalletPassPreview
              attendeeName={attendeeName}
              guestCategory={guestCategory}
              passType={passType}
              roomOrVenue={displayRoom}
              eventName={selectedEvent?.title || 'Official Event'}
              eventDate={formattedEventDate}
              validityDate={displayValidity}
              serialNumber={issuedPass ? issuedPass.serialNumber : previewSerial}
              interactive={true}
              logoText={brandHeader}
              passColor={passColor}
            />
          )}


          {/* POST-ISSUANCE ACTIONS BAR */}
          {issuedPass ? (
            <div className="w-full max-w-[380px] space-y-2.5 animate-in fade-in duration-300">
              {/* Primary 1-Click Dispatch Email Button */}
              <button
                type="button"
                disabled={isDispatchingEmail}
                onClick={() => handleDispatchIssuedPass()}
                className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-accent hover:from-sky-500 hover:to-accent/90 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border border-sky-400/40 shadow-xl shadow-accent/25 cursor-pointer disabled:opacity-50"
              >
                {isDispatchingEmail ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching Pass Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>
                      {issuedPass.attendeeEmail
                        ? `Dispatch Pass to ${issuedPass.attendeeEmail}`
                        : 'Dispatch Pass (Email)'}
                    </span>
                  </>
                )}
              </button>

              {/* Status Banner */}
              {emailDispatchStatus && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border ${
                    emailDispatchStatus.startsWith('Failed')
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{emailDispatchStatus}</span>
                </div>
              )}

              {/* Manual Email Input Prompt if no email stored on pass */}
              {showManualEmailPrompt && (
                <div className="p-3 bg-slate-900/90 border border-sky-500/40 rounded-xl space-y-2">
                  <span className="text-[10.5px] font-bold text-slate-300 block">
                    Enter recipient email for {issuedPass.attendeeName}:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={manualEmailInput}
                      onChange={(e) => setManualEmailInput(e.target.value)}
                      placeholder="attendee@domain.com"
                      className="flex-1 px-3 py-1.5 bg-slate-800 border border-white/15 rounded-lg text-white text-xs focus:outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      disabled={isDispatchingEmail || !manualEmailInput.trim()}
                      onClick={() => handleDispatchIssuedPass(manualEmailInput.trim())}
                      className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 transition-all shrink-0"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/15 cursor-pointer shadow-md"
                >
                  <Printer className="h-4 w-4" /> Print Badge
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(issuedPass.serialNumber);
                    setCopiedSerial(true);
                    setTimeout(() => setCopiedSerial(false), 2000);
                  }}
                  className="py-2.5 px-4 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-sky-500/30 cursor-pointer shadow-md"
                >
                  <Copy className="h-4 w-4" />
                  {copiedSerial ? 'Copied Serial' : 'Copy Serial'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetForNext}
                className="w-full py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                + Issue Another Event Pass
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 text-center max-w-[340px]">
              Tip: Toggle between 3D Luxury and Apple Wallet view above to inspect native wallet rendering.
            </p>
          )}
        </div>
      </div>

      {/* BULK CSV MODAL */}
      <EventPassBulkModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        events={events}
        selectedEventId={selectedEventId}
        currentUserName={currentUserName}
        currentUserEmail={currentUserEmail}
        onPassesImported={() => {
          if (onPassIssued) {
            const all = getEventPasses();
            if (all[0]) onPassIssued(all[0]);
          }
        }}
      />

      {/* MAIL-MERGE EMAIL DISPATCH MODAL */}
      <EventPassEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        events={events}
        selectedEventId={selectedEventId}
        passes={getEventPasses()}
        currentUserName={currentUserName}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}

export default EventPassStudio;
