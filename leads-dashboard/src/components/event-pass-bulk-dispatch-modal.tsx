'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Send, Mail, CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { PassEmailComposer, usePassEmailTemplate } from '@/components/pass-email-composer';
import {
  EventPassItem,
  buildPassEmail,
  dispatchPassEmail,
  getPassValidDays,
  formatValidDaysLabel,
} from '@/lib/local-data';

interface Props {
  isOpen: boolean;
  passes: EventPassItem[]; // the selected passes, in table order
  onClose: () => void;
  onDone: () => void; // refresh the table after sending
}

type SendState = 'idle' | 'sending' | 'ok' | 'failed';

/**
 * Review each selected pass and its exact email (← → to move), untick the ones to skip, then send them all.
 * The email preview comes from buildPassEmail(), the same builder dispatchPassEmail() sends.
 */
export function EventPassBulkDispatchModal({ isOpen, passes: livePasses, onClose, onDone }: Props) {
  // Snapshot the selection when the modal opens so table refreshes after sending don't reset the review state
  const [passes, setPasses] = useState<EventPassItem[]>([]);
  const [index, setIndex] = useState(0);
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, { state: SendState; error?: string }>>({});
  const [isSending, setIsSending] = useState(false);
  const [template, setTemplate] = usePassEmailTemplate(isOpen);
  const [showEditor, setShowEditor] = useState(false);
  const stopRef = useRef(false);

  // Reset whenever the modal is (re)opened with a new selection
  const livePassesRef = useRef(livePasses);
  livePassesRef.current = livePasses;
  useEffect(() => {
    if (!isOpen) return;
    const snap = livePassesRef.current;
    setPasses(snap);
    setIndex(0);
    setStatus({});
    setIsSending(false);
    stopRef.current = false;
    setIncluded(Object.fromEntries(snap.map((p) => [p.id, true])));
    setEmails(Object.fromEntries(snap.map((p) => [p.id, p.attendeeEmail || ''])));
  }, [isOpen]);

  const total = passes.length;
  const safeIndex = Math.min(index, Math.max(0, total - 1));
  const pass = passes[safeIndex];

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(total - 1, Math.max(0, i + delta))),
    [total]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Escape' && !isSending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, go, isSending, onClose]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const preview = useMemo(() => (pass ? buildPassEmail(pass, origin, { forPreview: true, subjectTemplate: template.subject, bodyTemplate: template.body }) : null), [pass, origin, template]);

  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const toSend = passes.filter((p) => included[p.id] && validEmail(emails[p.id] || ''));
  const skippedNoEmail = passes.filter((p) => included[p.id] && !validEmail(emails[p.id] || '')).length;
  const allIncluded = passes.length > 0 && passes.every((p) => included[p.id]);

  const send = async (only?: EventPassItem[]) => {
    const list = only || toSend;
    if (list.length === 0) return;
    if (!only && !window.confirm(`Send ${list.length} pass email${list.length === 1 ? '' : 's'} now? They enter the normal 10-minute email hold before delivery.`)) return;
    setIsSending(true);
    stopRef.current = false;
    for (const p of list) {
      if (stopRef.current) break;
      setStatus((s) => ({ ...s, [p.id]: { state: 'sending' } }));
      try {
        const res = await dispatchPassEmail(p, emails[p.id].trim(), { subjectTemplate: template.subject, bodyTemplate: template.body });
        setStatus((s) => ({ ...s, [p.id]: res.success ? { state: 'ok' } : { state: 'failed', error: res.error } }));
      } catch (err: any) {
        setStatus((s) => ({ ...s, [p.id]: { state: 'failed', error: err?.message || 'Network error' } }));
      }
      await new Promise((r) => setTimeout(r, 250)); // gentle pacing
    }
    setIsSending(false);
    onDone();
  };

  if (!isOpen || !pass) return null;

  const failed = passes.filter((p) => status[p.id]?.state === 'failed');
  const sentCount = passes.filter((p) => status[p.id]?.state === 'ok').length;
  const days = getPassValidDays(pass);
  const st = status[pass.id];

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 xl:p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-[1760px] h-[94vh] flex flex-col rounded-3xl border border-white/15 bg-[#0D1F38] text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="h-4 w-4 text-sky-400 shrink-0" />
            <h3 className="text-sm font-black truncate">Preview &amp; dispatch passes</h3>
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">{safeIndex + 1} of {total}</span>
          </div>
          <button type="button" onClick={onClose} disabled={isSending} className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-40 cursor-pointer" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-1.5 overflow-x-auto px-5 py-2.5 border-b border-white/10 bg-black/20">
          {passes.map((p, i) => {
            const s = status[p.id]?.state;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setIndex(i)}
                title={p.attendeeName}
                className={`shrink-0 max-w-[150px] truncate px-2.5 py-1 rounded-lg text-[10.5px] font-bold border cursor-pointer transition-all ${
                  i === safeIndex ? 'bg-sky-500/25 border-sky-400 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30'
                } ${!included[p.id] ? 'opacity-45 line-through' : ''}`}
              >
                {s === 'ok' ? '✓ ' : s === 'failed' ? '✗ ' : ''}
                {p.attendeeName}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className={`flex-1 min-h-0 overflow-y-auto grid grid-cols-1 gap-5 p-5 ${showEditor ? 'xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_minmax(0,4fr)]' : 'xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'}`}>
          {/* Pass */}
          <div className="space-y-3 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">The pass</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={pass.id} src={`/api/pass/${encodeURIComponent(pass.serialNumber)}/image`} alt={`Ticket for ${pass.attendeeName}`} className="w-full rounded-2xl border border-white/10 bg-slate-800" />
            <div className="grid grid-cols-2 gap-2 text-[11.5px]">
              {([
                ['Attendee', pass.attendeeName],
                ['Category', pass.guestCategory || '—'],
                ['Pass type', String(pass.passType)],
                ['Venue', pass.roomOrVenue || pass.eventVenue || '—'],
                ['Event', pass.eventName],
                ['Valid', days.length ? formatValidDaysLabel(days) : pass.validityDate || pass.eventDate || '—'],
              ] as const).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 min-w-0">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{k}</div>
                  <div className="font-bold truncate" title={String(v)}>{v}</div>
                </div>
              ))}
            </div>
            <a href={`/pass/${pass.serialNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-400 hover:underline">
              Open the pass page <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Email */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">The email</div>
              <label className="flex items-center gap-2 text-[11px] font-bold cursor-pointer">
                <input type="checkbox" checked={!!included[pass.id]} onChange={(e) => setIncluded((m) => ({ ...m, [pass.id]: e.target.checked }))} className="h-4 w-4 accent-sky-500" />
                Include in dispatch
              </label>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2 text-[11.5px]">
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-slate-400 font-semibold">To</span>
                <input
                  type="email"
                  value={emails[pass.id] || ''}
                  onChange={(e) => setEmails((m) => ({ ...m, [pass.id]: e.target.value }))}
                  placeholder="recipient@email.com"
                  className={`flex-1 min-w-0 px-2.5 py-1.5 bg-black/30 border rounded-lg text-white focus:outline-none ${validEmail(emails[pass.id] || '') ? 'border-white/15 focus:border-sky-400' : 'border-amber-500/60'}`}
                />
              </div>
              <div className="flex items-start gap-2">
                <span className="w-14 shrink-0 text-slate-400 font-semibold">Subject</span>
                <span className="font-bold">{preview?.subject}</span>
              </div>
              {!validEmail(emails[pass.id] || '') && (
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Add a valid email to include this pass.</div>
              )}
              {st?.state === 'failed' && <div className="text-rose-400 font-semibold">✗ {st.error || 'Failed to send.'}</div>}
              {st?.state === 'ok' && <div className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Queued for delivery.</div>}
            </div>
            <iframe
              key={pass.id}
              title={`Email preview for ${pass.attendeeName}`}
              sandbox=""
              srcDoc={`<html><body style="margin:0;padding:12px;background:#e2e8f0;">${preview?.bodyHtml || ''}</body></html>`}
              className="w-full h-[calc(94vh-390px)] min-h-[420px] rounded-xl border border-white/10 bg-slate-200"
            />
          </div>

          {/* Message editor (same template as Mail-Merge Dispatch) */}
          {showEditor && (
            <div className="space-y-3 min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Edit the message (applies to all)</div>
              <PassEmailComposer template={template} onChange={setTemplate} bodyRows={16} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => go(-1)} disabled={safeIndex === 0} className="p-2 rounded-xl border border-white/15 hover:bg-white/10 disabled:opacity-30 cursor-pointer" aria-label="Previous pass">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => go(1)} disabled={safeIndex >= total - 1} className="p-2 rounded-xl border border-white/15 hover:bg-white/10 disabled:opacity-30 cursor-pointer" aria-label="Next pass">
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="hidden sm:inline text-[10.5px] text-slate-500">← → to navigate</span>
            <button type="button" onClick={() => setShowEditor((v) => !v)} className="ml-2 px-3 py-1.5 rounded-lg border border-white/15 text-[11px] font-bold hover:bg-white/10 cursor-pointer">
              {showEditor ? 'Hide message editor' : 'Edit message'}
            </button>
            <button type="button" onClick={() => setIncluded(Object.fromEntries(passes.map((p) => [p.id, !allIncluded])))} className="ml-2 text-[11px] font-bold text-sky-400 hover:underline cursor-pointer">
              {allIncluded ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <span className="text-[11px] text-slate-300">
              {isSending || sentCount > 0
                ? `${sentCount} sent${failed.length ? ` · ${failed.length} failed` : ''}`
                : `${toSend.length} ready${skippedNoEmail ? ` · ${skippedNoEmail} need an email` : ''}`}
            </span>
            {failed.length > 0 && !isSending && (
              <button type="button" onClick={() => send(failed.filter((p) => validEmail(emails[p.id] || '')))} className="px-3 py-2 rounded-xl border border-rose-400/50 text-rose-300 text-xs font-bold hover:bg-rose-500/10 cursor-pointer">
                Retry failed
              </button>
            )}
            {isSending ? (
              <button type="button" onClick={() => (stopRef.current = true)} className="px-4 py-2.5 rounded-xl bg-white/10 text-xs font-bold cursor-pointer flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Stop after this one
              </button>
            ) : (
              <button type="button" disabled={toSend.length === 0} onClick={() => send()} className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                <Send className="h-4 w-4" /> Dispatch {toSend.length} email{toSend.length === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventPassBulkDispatchModal;
