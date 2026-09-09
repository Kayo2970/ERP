'use client';

import React, { useState } from 'react';
import {
  Mail,
  X,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  CheckSquare,
  Square,
  Users,
  Tag,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { EventItem, EventPassItem, authHeaders } from '@/lib/local-data';

interface EventPassEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  selectedEventId: string;
  passes: EventPassItem[];
  currentUserName: string;
  currentUserEmail?: string;
  onEmailsDispatched?: (count: number) => void;
}

const PLACEHOLDERS = [
  { tag: '@name', desc: 'Attendee Name' },
  { tag: '@pass_type', desc: 'Pass Tier' },
  { tag: '@guest_category', desc: 'Category' },
  { tag: '@room_or_venue', desc: 'Assigned Room' },
  { tag: '@event_name', desc: 'Event Title' },
  { tag: '@event_date', desc: 'Event Date' },
  { tag: '@serial_number', desc: 'Pass Serial ID' },
  { tag: '@pass_link', desc: 'Pass Link' },
];

export function EventPassEmailModal({
  isOpen,
  onClose,
  events,
  selectedEventId,
  passes,
  currentUserName,
  currentUserEmail,
  onEmailsDispatched,
}: EventPassEmailModalProps) {
  const [activeEventId, setActiveEventId] = useState(selectedEventId || 'ALL');
  const [subjectTemplate, setSubjectTemplate] = useState('Your Official Pass for @event_name — @pass_type');
  const [bodyTemplate, setBodyTemplate] = useState(
    `Dear @name,\n\nWe are delighted to welcome you to @event_name. Your official credential has been issued by the LEADS Next Gen Centre.\n\n• Pass Tier: @pass_type\n• Guest Category: @guest_category\n• Assigned Venue / Room: @room_or_venue\n• Event Date & Validity: @event_date\n• Pass Serial ID: @serial_number\n\nYou can access your verified digital pass, save it to Apple Wallet / Google Wallet, or view check-in details via the link below:\n@pass_link\n\nPlease present your digital pass or QR code at official event turnstiles upon arrival.\n\nWarm regards,\nLEADS Next Gen Centre • RUAS`
  );

  const [selectedPassIds, setSelectedPassIds] = useState<string[]>([]);
  const [previewPassIndex, setPreviewPassIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Filter passes that have valid emails
  const eventPasses = passes.filter((p) => {
    if (activeEventId !== 'ALL' && p.eventId !== activeEventId) return false;
    return Boolean(p.attendeeEmail);
  });

  // Auto select all eligible on open / filter change
  React.useEffect(() => {
    setSelectedPassIds(eventPasses.map((p) => p.id));
    setPreviewPassIndex(0);
  }, [activeEventId, passes]);

  const toggleSelectAll = () => {
    if (selectedPassIds.length === eventPasses.length) {
      setSelectedPassIds([]);
    } else {
      setSelectedPassIds(eventPasses.map((p) => p.id));
    }
  };

  const togglePassSelect = (id: string) => {
    if (selectedPassIds.includes(id)) {
      setSelectedPassIds(selectedPassIds.filter((pId) => pId !== id));
    } else {
      setSelectedPassIds([...selectedPassIds, id]);
    }
  };

  const insertPlaceholder = (tag: string) => {
    setBodyTemplate((prev) => prev + ' ' + tag);
  };

  // Compute mail-merged preview
  const previewPass = eventPasses[previewPassIndex] || eventPasses[0];

  const renderMailMerge = (template: string, pass?: EventPassItem) => {
    if (!pass) return template;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://leadsnextgencentre.online';
    const passUrl = `${origin}/pass/${pass.serialNumber}`;

    return template
      .replace(/@name|\{\{name\}\}/gi, pass.attendeeName)
      .replace(/@pass_type|\{\{pass_type\}\}/gi, pass.passType)
      .replace(/@guest_category|\{\{guest_category\}\}/gi, pass.guestCategory || 'Guest Attendee')
      .replace(/@room_or_venue|\{\{room_or_venue\}\}/gi, pass.roomOrVenue || pass.eventVenue || 'Main Auditorium')
      .replace(/@event_name|\{\{event_name\}\}/gi, pass.eventName)
      .replace(/@event_date|\{\{event_date\}\}/gi, pass.validityDate || pass.eventDate || '2026')
      .replace(/@serial_number|\{\{serial_number\}\}/gi, pass.serialNumber)
      .replace(/@pass_link|\{\{pass_link\}\}/gi, passUrl);
  };

  const handleSendEmails = async () => {
    const targets = eventPasses.filter((p) => selectedPassIds.includes(p.id));
    if (targets.length === 0) {
      setErrorMessage('No recipients selected with a valid email address.');
      return;
    }

    setIsSending(true);
    setErrorMessage('');

    try {
      let sentCount = 0;
      let failCount = 0;

      for (const pass of targets) {
        if (!pass.attendeeEmail) continue;

        const personalizedSubject = renderMailMerge(subjectTemplate, pass);
        const personalizedBody = renderMailMerge(bodyTemplate, pass);

        try {
          const res = await fetch('/api/email/send', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              scope: 'SINGLE',
              recipientEmail: pass.attendeeEmail,
              to: pass.attendeeEmail,
              subject: personalizedSubject,
              bodyText: personalizedBody,
              category: 'EVENT_INVITATION',
              badgeText: 'Official Event Pass',
              badgeColor: '#0284c7',
              metadata: {
                passId: pass.id,
                serialNumber: pass.serialNumber,
                eventId: pass.eventId,
                eventName: pass.eventName,
              },
            }),
          });

          if (!res.ok) {
            failCount++;
            const errData = await res.json().catch(() => ({}));
            console.warn(`Failed to dispatch email to ${pass.attendeeEmail}:`, errData.error);
          } else {
            sentCount++;
          }
        } catch (subErr) {
          failCount++;
          console.warn(`Network error dispatching email to ${pass.attendeeEmail}:`, subErr);
        }
      }

      if (sentCount > 0) {
        setSuccessToast(`Dispatched ${sentCount} personalized pass emails successfully!${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        if (onEmailsDispatched) onEmailsDispatched(sentCount);
        setTimeout(() => {
          onClose();
          setSuccessToast('');
        }, 2000);
      } else {
        setErrorMessage('Failed to send pass emails. Please check your SMTP settings in Settings > Email.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to dispatch pass emails.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-4xl rounded-3xl p-6 md:p-8 space-y-6 relative border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#0D1F38]/95 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Mail-Merge Event Pass Dispatch
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Send personalized invitations & turnstile pass links with dynamic `@placeholders`.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {successToast && (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1 pr-1 text-xs">
          {/* LEFT: TEMPLATE EDITOR & PLACEHOLDERS */}
          <div className="lg:col-span-7 space-y-4">
            {/* Event Filter */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Target Event
              </label>
              <select
                value={activeEventId}
                onChange={(e) => setActiveEventId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-accent text-xs"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Events</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id} className="bg-slate-900 text-white">
                    {evt.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Line */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Email Subject Line *
              </label>
              <input
                type="text"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-accent text-xs"
              />
            </div>

            {/* Placeholder Chip Tags */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Click to Insert Placeholders:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((ph) => (
                  <button
                    type="button"
                    key={ph.tag}
                    onClick={() => insertPlaceholder(ph.tag)}
                    className="px-2 py-0.5 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-[10.5px] font-mono font-bold cursor-pointer transition-colors"
                  >
                    + {ph.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Editor */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Personalized Email Body *
              </label>
              <textarea
                rows={9}
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-accent leading-relaxed"
              />
            </div>
          </div>

          {/* RIGHT: RECIPIENTS SELECTION & LIVE PREVIEW */}
          <div className="lg:col-span-5 space-y-4 flex flex-col">
            {/* Recipients Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  Recipients ({selectedPassIds.length}/{eventPasses.length})
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                >
                  {selectedPassIds.length === eventPasses.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl divide-y divide-slate-100 dark:divide-white/5 bg-slate-50/50 dark:bg-white/5 p-1">
                {eventPasses.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-[11px]">
                    No issued passes with email addresses found.
                  </div>
                ) : (
                  eventPasses.map((pass, idx) => {
                    const isChecked = selectedPassIds.includes(pass.id);
                    return (
                      <div
                        key={pass.id}
                        className="flex items-center justify-between p-1.5 hover:bg-white/10 rounded-lg cursor-pointer text-[11px]"
                        onClick={() => togglePassSelect(pass.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-accent shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {pass.attendeeName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {pass.attendeeEmail}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPassIndex(idx);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${
                            previewPassIndex === idx
                              ? 'bg-accent text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Preview
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Live Rendered Email Preview */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-accent" /> Live Mail-Merge Output
                </span>
                <span className="text-[10px] text-accent font-semibold truncate max-w-[160px]">
                  {previewPass?.attendeeName || 'No recipient'}
                </span>
              </div>

              <div className="flex-1 p-3.5 rounded-2xl bg-white dark:bg-[#071324] border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-200 text-[11px] overflow-y-auto space-y-2 shadow-inner">
                <div className="border-b border-slate-200 dark:border-white/10 pb-2">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Subject</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {renderMailMerge(subjectTemplate, previewPass)}
                  </span>
                </div>
                <div className="whitespace-pre-line leading-relaxed">
                  {renderMailMerge(bodyTemplate, previewPass)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200/80 dark:border-white/10 pt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSending || selectedPassIds.length === 0}
            onClick={handleSendEmails}
            className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-accent/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Dispatching Pass Emails...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Dispatch {selectedPassIds.length} Personalized Passes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventPassEmailModal;
