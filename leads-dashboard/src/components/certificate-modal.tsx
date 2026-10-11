'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, X, Send, RefreshCw, CheckCircle2, AlertCircle, CheckSquare, Square, ImagePlus, Trash2 } from 'lucide-react';
import { EventItem, authHeaders } from '@/lib/local-data';

interface Attendee { passId: string; name: string; email: string; serial: string; status: string; sentAt?: string; error?: string }
interface Template { title: string; bodyText: string; signatoryName: string; signatoryTitle: string; textColor: string }

const field = 'w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-accent text-xs';
const label = 'block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  initialEventId?: string;
  canEditDesign: boolean;
}

export function CertificateModal({ isOpen, onClose, events, initialEventId, canEditDesign }: Props) {
  const [eventId, setEventId] = useState('');
  const [tab, setTab] = useState<'send' | 'design'>('send');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [eventOver, setEventOver] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState<Template | null>(null);
  const [preview, setPreview] = useState('');
  const [background, setBackground] = useState<string | null | undefined>(undefined); // undefined = keep, null = remove
  const [hasBackground, setHasBackground] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const endedEvents = events.filter((e) => !e.datesTBD && !e.isHoliday && e.status !== 'archived' && (e.endDate || e.startDate) && (e.endDate || e.startDate) < new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isOpen) return;
    const preferred = initialEventId && initialEventId !== 'ALL' ? initialEventId : '';
    setEventId(preferred || endedEvents[0]?.id || events[0]?.id || '');
    setTab('send');
    setMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const load = useCallback(async () => {
    if (!eventId) return;
    setBusy(true);
    try {
      const [a, t] = await Promise.all([
        fetch(`/api/events/${eventId}/certificates`, { headers: authHeaders() }),
        fetch(`/api/events/${eventId}/certificate-template`, { headers: authHeaders() }),
      ]);
      const aj = await a.json();
      if (!a.ok) throw new Error(aj.error || 'Could not load attendees.');
      setAttendees(aj.attendees);
      setEventOver(!!aj.eventOver);
      setSelected(new Set(aj.attendees.filter((x: Attendee) => x.status !== 'Sent').map((x: Attendee) => x.passId)));
      if (t.ok) {
        const tj = await t.json();
        setTemplate(tj.template);
        setPreview(tj.preview);
        setHasBackground(tj.hasBackground);
        setBackground(undefined);
      }
      setMsg(null);
    } catch (e: any) {
      setMsg({ kind: 'err', text: e.message || 'Could not load certificates.' });
    } finally {
      setBusy(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;

  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const send = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(`Email ${ids.length} certificate${ids.length === 1 ? '' : 's'}?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates`, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ passIds: ids }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send.');
      setMsg({ kind: data.failed ? 'err' : 'ok', text: `Sent ${data.sent} certificate${data.sent === 1 ? '' : 's'}${data.failed ? `, ${data.failed} failed (see the list)` : ''}.` });
      await load();
    } catch (e: any) {
      setMsg({ kind: 'err', text: e.message });
      setBusy(false);
    }
  };

  const saveDesign = async () => {
    if (!template) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/certificate-template`, { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ ...template, background }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      setTemplate(data.template);
      setPreview(data.preview);
      setHasBackground(data.hasBackground);
      setBackground(undefined);
      setMsg({ kind: 'ok', text: 'Certificate design saved.' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const pickArtwork = (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return setMsg({ kind: 'err', text: 'Artwork must be under 8 MB.' });
    const reader = new FileReader();
    reader.onload = () => { setBackground(String(reader.result)); setHasBackground(true); };
    reader.readAsDataURL(file);
  };

  const pending = attendees.filter((a) => a.status !== 'Sent').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-4xl rounded-3xl p-5 md:p-7 space-y-4 border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#0D1F38]/95 shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent"><Award className="h-5 w-5" /></div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Attendance Certificates</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">Email a PDF certificate to everyone who checked in.</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 cursor-pointer"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-wrap items-end gap-3 text-xs">
          <div className="flex-1 min-w-[220px]">
            <label className={label}>Event</label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={field}>
              {events.filter((e) => !e.isHoliday).map((e) => (
                <option key={e.id} value={e.id} className="bg-slate-900 text-white">{e.title}{endedEvents.some((x) => x.id === e.id) ? '' : ' (not ended)'}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1">
            {(['send', 'design'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-2 rounded-xl font-bold cursor-pointer ${tab === t ? 'bg-accent text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white'}`}>
                {t === 'send' ? 'Send' : 'Design'}
              </button>
            ))}
          </div>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 p-3 rounded-2xl text-xs border ${msg.kind === 'ok' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'}`}>
            {msg.kind === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        <div className="overflow-y-auto flex-1 text-xs pr-1">
          {tab === 'send' && (
            <div className="space-y-3">
              {!eventOver && <p className="text-amber-500 font-semibold">This event has not ended yet — certificates can be sent once it has.</p>}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 dark:text-white">Attendees ({selected.size}/{attendees.length} selected · {pending} not yet sent)</span>
                <button type="button" className="font-bold text-accent hover:underline cursor-pointer" onClick={() => setSelected(selected.size === attendees.length ? new Set() : new Set(attendees.map((a) => a.passId)))}>
                  {selected.size === attendees.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="border border-slate-200 dark:border-white/10 rounded-xl divide-y divide-slate-100 dark:divide-white/5 max-h-[46vh] overflow-y-auto">
                {attendees.length === 0 && <div className="py-6 text-center text-slate-400">{busy ? 'Loading…' : 'No checked-in attendees with an email address for this event.'}</div>}
                {attendees.map((a) => (
                  <div key={a.passId} onClick={() => toggle(a.passId)} className="flex items-center justify-between gap-2 p-2 hover:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2 min-w-0">
                      {selected.has(a.passId) ? <CheckSquare className="h-4 w-4 text-accent shrink-0" /> : <Square className="h-4 w-4 text-slate-400 shrink-0" />}
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">{a.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{a.email}</span>
                      </div>
                    </div>
                    <span title={a.error} className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${a.status === 'Sent' ? 'bg-emerald-500/15 text-emerald-400' : a.status === 'Failed' ? 'bg-rose-500/15 text-rose-400' : 'bg-slate-500/15 text-slate-400'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'design' && template && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5">
              <div className="space-y-3">
                {!canEditDesign && <p className="text-amber-500 font-semibold">You can preview the design but not change it.</p>}
                <div><label className={label}>Heading</label><input className={field} value={template.title} onChange={(e) => setTemplate({ ...template, title: e.target.value })} disabled={!canEditDesign} /></div>
                <div>
                  <label className={label}>Wording</label>
                  <textarea rows={4} className={field} value={template.bodyText} onChange={(e) => setTemplate({ ...template, bodyText: e.target.value })} disabled={!canEditDesign} />
                  <p className="text-[10px] text-slate-500 mt-1">Use <code>@event_name</code> and <code>@event_date</code>. The attendee&apos;s name is printed above this text.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={label}>Signatory</label><input className={field} value={template.signatoryName} onChange={(e) => setTemplate({ ...template, signatoryName: e.target.value })} disabled={!canEditDesign} /></div>
                  <div><label className={label}>Designation</label><input className={field} value={template.signatoryTitle} onChange={(e) => setTemplate({ ...template, signatoryTitle: e.target.value })} disabled={!canEditDesign} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <label className={`${label} mb-0`}>Text colour</label>
                  <input type="color" value={template.textColor} onChange={(e) => setTemplate({ ...template, textColor: e.target.value })} disabled={!canEditDesign} />
                </div>
                <div className="space-y-1.5">
                  <label className={label}>Artwork (A4 landscape)</label>
                  <div className="flex items-center gap-2">
                    <label className={`px-3 py-2 rounded-xl bg-accent/15 text-accent border border-accent/30 font-bold flex items-center gap-1.5 ${canEditDesign ? 'cursor-pointer' : 'opacity-50'}`}>
                      <ImagePlus className="h-3.5 w-3.5" /> {hasBackground ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={!canEditDesign} onChange={(e) => pickArtwork(e.target.files?.[0])} />
                    </label>
                    {hasBackground && canEditDesign && (
                      <button type="button" className="px-3 py-2 rounded-xl text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1.5 cursor-pointer" onClick={() => { setBackground(null); setHasBackground(false); }}>
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">Leave the middle free: the heading, name and wording are centred, signatory bottom-left, QR bottom-right. Without artwork a simple framed design is used.</p>
                </div>
                {canEditDesign && (
                  <button type="button" disabled={busy} onClick={saveDesign} className="px-4 py-2 bg-accent text-white font-extrabold rounded-xl cursor-pointer disabled:opacity-50">
                    Save &amp; refresh preview
                  </button>
                )}
              </div>
              <div>
                <label className={label}>Preview (sample name)</label>
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Certificate preview" className="w-full rounded-xl border border-slate-200 dark:border-white/15" />
                )}
                {background && <p className="text-[10px] text-amber-500 mt-1">New artwork selected — save to see it in the preview.</p>}
              </div>
            </div>
          )}
        </div>

        {tab === 'send' && (
          <div className="border-t border-slate-200/80 dark:border-white/10 pt-3 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl text-xs font-bold cursor-pointer">Close</button>
            <button type="button" disabled={busy || !eventOver || selected.size === 0} onClick={send} className="px-6 py-2.5 bg-accent text-white font-extrabold rounded-xl text-xs shadow-lg shadow-accent/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send {selected.size} certificate{selected.size === 1 ? '' : 's'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CertificateModal;
