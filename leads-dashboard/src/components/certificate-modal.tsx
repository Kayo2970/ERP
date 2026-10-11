'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Award, X, Send, RefreshCw, CheckCircle2, AlertCircle, CheckSquare, Square, ImagePlus, Trash2 } from 'lucide-react';
import { EventItem, authHeaders } from '@/lib/local-data';
import { CertBox, CertBoxKey, CertLayout, CERT_BOX_LABELS, CERT_FONT_OPTIONS } from '@/lib/certificate-layout';

interface Attendee { passId: string; name: string; email: string; serial: string; status: string; sentAt?: string; error?: string }
interface Template { title: string; introText: string; bodyText: string; signatoryName: string; signatoryTitle: string; textColor: string; layout: CertLayout }

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
  const [activeBox, setActiveBox] = useState<CertBoxKey>('name');
  const stageRef = useRef<HTMLDivElement>(null);
  const [customFonts, setCustomFonts] = useState<Array<{ id: string; label: string }>>([]);
  const [googleLink, setGoogleLink] = useState('');
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

  const loadFonts = useCallback(async () => {
    try {
      const r = await fetch('/api/certificate-fonts', { headers: authHeaders() });
      if (r.ok) setCustomFonts((await r.json()).fonts || []);
    } catch { /* built-in fonts still work */ }
  }, []);

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
    if (isOpen) { load(); loadFonts(); }
  }, [isOpen, load, loadFonts]);

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

  const patchBox = (key: CertBoxKey, patch: Partial<CertBox>) =>
    setTemplate((t) => (t ? { ...t, layout: { ...t.layout, [key]: { ...t.layout[key], ...patch } } } : t));

  const clampBox = (b: CertBox): Partial<CertBox> => {
    const x = Math.min(Math.max(0, b.x), 98);
    const y = Math.min(Math.max(0, b.y), 98);
    return { x, y, w: Math.min(Math.max(2, b.w), 100 - x), h: Math.min(Math.max(1, b.h), 100 - y) };
  };

  /** Drag the box (mode 'move') or its bottom-right handle (mode 'size') on the preview. */
  const startDrag = (e: React.PointerEvent, key: CertBoxKey, mode: 'move' | 'size') => {
    if (!canEditDesign || !template || !stageRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveBox(key);
    const rect = stageRef.current.getBoundingClientRect();
    const start = template.layout[key];
    const sx = e.clientX;
    const sy = e.clientY;
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - sx) / rect.width) * 100;
      const dy = ((ev.clientY - sy) / rect.height) * 100;
      const next = mode === 'move' ? { ...start, x: start.x + dx, y: start.y + dy } : { ...start, w: start.w + dx, h: key === 'qr' ? start.h : start.h + dy };
      // The QR is a square sized by its width
      const clamped = clampBox(key === 'qr' && mode === 'size' ? { ...next, h: ((start.w + dx) / 100) * (rect.width / rect.height) * 100 } : next);
      patchBox(key, mode === 'move' ? { x: clamped.x, y: clamped.y } : { w: clamped.w, h: clamped.h });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const copyLayoutFrom = async (otherId: string) => {
    if (!otherId || !template) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${otherId}/certificate-template`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load that design.');
      setTemplate({ ...template, layout: data.template.layout, textColor: data.template.textColor });
      setMsg({ kind: 'ok', text: 'Layout copied — save to apply it to this event.' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const addFont = async (payload: { googleUrl?: string; name?: string; dataUrl?: string }, applyTo: CertBoxKey) => {
    setBusy(true);
    try {
      const res = await fetch('/api/certificate-fonts', { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add the font.');
      setCustomFonts(data.fonts || []);
      patchBox(applyTo, { fontFamily: `custom:${data.id}` });
      setGoogleLink('');
      setMsg({ kind: 'ok', text: 'Font added and selected — save to see it in the preview.' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const pickFont = (file: File | undefined, applyTo: CertBoxKey) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return setMsg({ kind: 'err', text: 'Font must be under 8 MB.' });
    const reader = new FileReader();
    reader.onload = () => addFont({ name: file.name, dataUrl: String(reader.result) }, applyTo);
    reader.readAsDataURL(file);
  };

  const removeFont = async (id: string) => {
    if (!window.confirm('Delete this font? Boxes using it fall back to the default serif.')) return;
    const res = await fetch(`/api/certificate-fonts?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) setCustomFonts((await res.json()).fonts || []);
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

          {tab === 'design' && template && (() => {
            const box = template.layout[activeBox];
            const num = 'w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-lg text-slate-900 dark:text-white text-xs';
            const numField = (lab: string, v: number, onChange: (n: number) => void, step = 0.5) => (
              <div><label className={label}>{lab}</label><input type="number" step={step} className={num} value={Math.round(v * 10) / 10} disabled={!canEditDesign} onChange={(e) => onChange(Number(e.target.value))} /></div>
            );
            return (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5">
                <div className="space-y-3">
                  {!canEditDesign && <p className="text-amber-500 font-semibold">You can preview the design but not change it.</p>}
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10">
                    <label className={label}>Include on the certificate</label>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {(Object.keys(CERT_BOX_LABELS) as CertBoxKey[]).map((k) => (
                        <label key={k} className={`flex items-center gap-2 font-bold cursor-pointer ${activeBox === k ? 'text-accent' : 'text-slate-700 dark:text-slate-200'}`}>
                          <input type="checkbox" checked={template.layout[k].enabled} disabled={!canEditDesign} onChange={(e) => { patchBox(k, { enabled: e.target.checked }); if (e.target.checked) setActiveBox(k); }} />
                          <span onClick={(e) => { e.preventDefault(); setActiveBox(k); }}>{CERT_BOX_LABELS[k]}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">Untick anything you don&apos;t want printed. Click a name to edit its box.</p>
                  </div>
                  <div><label className={label}>Heading</label><input className={field} value={template.title} onChange={(e) => setTemplate({ ...template, title: e.target.value })} disabled={!canEditDesign} /></div>
                  <div><label className={label}>Intro line (above the name)</label><input className={field} value={template.introText} onChange={(e) => setTemplate({ ...template, introText: e.target.value })} disabled={!canEditDesign} /></div>
                  <div>
                    <label className={label}>Content</label>
                    <textarea rows={4} className={field} value={template.bodyText} onChange={(e) => setTemplate({ ...template, bodyText: e.target.value })} disabled={!canEditDesign} />
                    <p className="text-[10px] text-slate-500 mt-1">Use <code>@name</code>, <code>@event_name</code> and <code>@event_date</code>.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={label}>Signatory</label><input className={field} value={template.signatoryName} onChange={(e) => setTemplate({ ...template, signatoryName: e.target.value })} disabled={!canEditDesign} /></div>
                    <div><label className={label}>Designation</label><input className={field} value={template.signatoryTitle} onChange={(e) => setTemplate({ ...template, signatoryTitle: e.target.value })} disabled={!canEditDesign} /></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={`${label} mb-0`}>Default text colour</label>
                    <input type="color" value={template.textColor} onChange={(e) => setTemplate({ ...template, textColor: e.target.value })} disabled={!canEditDesign} />
                  </div>

                  <div className="space-y-2 p-3 rounded-2xl border border-accent/30 bg-accent/5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-800 dark:text-white">Text box: {CERT_BOX_LABELS[activeBox]}</span>
                      <label className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                        <input type="checkbox" checked={box.enabled} disabled={!canEditDesign} onChange={(e) => patchBox(activeBox, { enabled: e.target.checked })} /> Show
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {numField('X %', box.x, (n) => patchBox(activeBox, clampBox({ ...box, x: n })))}
                      {numField('Y %', box.y, (n) => patchBox(activeBox, clampBox({ ...box, y: n })))}
                      {numField('Width %', box.w, (n) => patchBox(activeBox, clampBox({ ...box, w: n })))}
                      {numField('Height %', box.h, (n) => patchBox(activeBox, clampBox({ ...box, h: n })))}
                    </div>
                    {activeBox !== 'qr' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={label}>Font</label>
                            <select className={field} value={box.fontFamily} disabled={!canEditDesign} onChange={(e) => patchBox(activeBox, { fontFamily: e.target.value as CertBox['fontFamily'] })}>
                              {CERT_FONT_OPTIONS.map((f) => <option key={f.id} value={f.id} className="bg-slate-900 text-white">{f.label}</option>)}
                              {customFonts.map((f) => <option key={f.id} value={`custom:${f.id}`} className="bg-slate-900 text-white">{f.label} (custom)</option>)}
                              {box.fontFamily.startsWith('custom:') && !customFonts.some((f) => `custom:${f.id}` === box.fontFamily) && <option value={box.fontFamily} className="bg-slate-900 text-white">{box.fontFamily.slice(7)} (missing)</option>}
                            </select>
                          </div>
                          {numField('Font size (px)', box.fontSize, (n) => patchBox(activeBox, { fontSize: n }), 1)}
                        </div>
                        {canEditDesign && (
                          <div className="space-y-1.5 p-2 rounded-xl bg-slate-500/5 border border-slate-300/40 dark:border-white/10">
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="px-3 py-1.5 rounded-lg bg-accent/15 text-accent border border-accent/30 font-bold cursor-pointer">
                                Upload font (.ttf .otf .woff)
                                <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" disabled={busy} onChange={(e) => { pickFont(e.target.files?.[0], activeBox); e.target.value = ''; }} />
                              </label>
                              {box.fontFamily.startsWith('custom:') && (
                                <button type="button" className="px-3 py-1.5 rounded-lg text-rose-400 border border-rose-500/30 font-bold cursor-pointer" onClick={() => removeFont(box.fontFamily.slice(7))}>Delete this font</button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input className={field} placeholder="Google Fonts link, e.g. https://fonts.google.com/specimen/Great+Vibes" value={googleLink} onChange={(e) => setGoogleLink(e.target.value)} />
                              <button type="button" disabled={busy || !googleLink.trim()} onClick={() => addFont({ googleUrl: googleLink }, activeBox)} className="px-3 py-1.5 rounded-lg bg-accent text-white font-bold cursor-pointer disabled:opacity-50 shrink-0">Import</button>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3">
                          {([['bold', 'Bold'], ['italic', 'Italic'], ['autoFit', 'Shrink to fit box'], ['underline', 'Underline']] as const).map(([k, lab]) => (
                            <label key={k} className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                              <input type="checkbox" checked={box[k]} disabled={!canEditDesign} onChange={(e) => patchBox(activeBox, { [k]: e.target.checked })} /> {lab}
                            </label>
                          ))}
                        </div>
                        {activeBox === 'name' && <p className="text-[10px] text-slate-500">The name is always centred horizontally and vertically in its box.</p>}
                        <div className={`grid grid-cols-3 gap-2 ${activeBox === 'name' ? 'hidden' : ''}`}>
                          <div>
                            <label className={label}>Align</label>
                            <select className={field} value={box.align} disabled={!canEditDesign} onChange={(e) => patchBox(activeBox, { align: e.target.value as CertBox['align'] })}>
                              <option value="left" className="bg-slate-900">Left</option><option value="center" className="bg-slate-900">Centre</option><option value="right" className="bg-slate-900">Right</option>
                            </select>
                          </div>
                          <div>
                            <label className={label}>Vertical</label>
                            <select className={field} value={box.valign} disabled={!canEditDesign} onChange={(e) => patchBox(activeBox, { valign: e.target.value as CertBox['valign'] })}>
                              <option value="top" className="bg-slate-900">Top</option><option value="middle" className="bg-slate-900">Middle</option><option value="bottom" className="bg-slate-900">Bottom</option>
                            </select>
                          </div>
                          {numField('Max lines (0 = any)', box.maxLines, (n) => patchBox(activeBox, { maxLines: Math.round(n) }), 1)}
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <label className={`${label} mb-0`}>Box colour</label>
                      <input type="color" value={box.color || template.textColor} disabled={!canEditDesign} onChange={(e) => patchBox(activeBox, { color: e.target.value })} />
                      {box.color && <button type="button" className="text-[11px] font-bold text-accent hover:underline cursor-pointer" disabled={!canEditDesign} onClick={() => patchBox(activeBox, { color: '' })}>Use default</button>}
                    </div>
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
                  </div>
                  {canEditDesign && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" disabled={busy} onClick={saveDesign} className="px-4 py-2 bg-accent text-white font-extrabold rounded-xl cursor-pointer disabled:opacity-50">
                        Save &amp; refresh preview
                      </button>
                      <select className={`${field} !w-auto`} value="" disabled={busy} onChange={(e) => copyLayoutFrom(e.target.value)}>
                        <option value="" className="bg-slate-900 text-white">Copy layout from event…</option>
                        {events.filter((e) => !e.isHoliday && e.id !== eventId).map((e) => <option key={e.id} value={e.id} className="bg-slate-900 text-white">{e.title}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className={label}>Preview (sample name) — drag a box to move it, drag its corner to resize</label>
                  <div ref={stageRef} className="relative w-full select-none touch-none">
                    {preview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="Certificate preview" draggable={false} className="w-full rounded-xl border border-slate-200 dark:border-white/15" />
                    )}
                    {(Object.keys(template.layout) as CertBoxKey[]).filter((k) => template.layout[k].enabled).map((k) => {
                      const b = template.layout[k];
                      const on = k === activeBox;
                      return (
                        <div
                          key={k}
                          onPointerDown={(e) => startDrag(e, k, 'move')}
                          title={CERT_BOX_LABELS[k]}
                          style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                          className={`absolute border ${on ? 'border-accent bg-accent/10 border-2 z-10' : 'border-dashed border-sky-400/60 hover:border-accent'} ${canEditDesign ? 'cursor-move' : ''}`}
                        >
                          <span className={`absolute -top-4 left-0 px-1 text-[9px] font-bold rounded-t ${on ? 'bg-accent text-white' : 'bg-sky-500/70 text-white'}`}>{CERT_BOX_LABELS[k]}</span>
                          {canEditDesign && <span onPointerDown={(e) => startDrag(e, k, 'size')} className="absolute -right-1.5 -bottom-1.5 h-3 w-3 rounded-sm bg-accent border border-white cursor-nwse-resize" />}
                        </div>
                      );
                    })}
                  </div>
                  {background && <p className="text-[10px] text-amber-500 mt-1">New artwork selected — save to see it in the preview.</p>}
                  <p className="text-[10px] text-slate-500 mt-1">The boxes show where text goes; click &ldquo;Save &amp; refresh preview&rdquo; to see the exact rendering. Every certificate is created as a PDF with each attendee&apos;s name in the name box and emailed to them.</p>
                </div>
              </div>
            );
          })()}
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
