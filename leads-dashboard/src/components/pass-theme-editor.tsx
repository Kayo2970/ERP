'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, Save, Palette } from 'lucide-react';
import { DEFAULT_PASS_THEME, PassTheme, authHeaders } from '@/lib/local-data';
import { passThemeStyle } from '@/lib/pass-theme-style';
import { AppleWalletPosterPreview } from './apple-wallet-poster-preview';

interface Props {
  eventId: string;
  eventName: string;
  /** Called after a successful save/load so previews elsewhere (wallet card, keycard) can use it. */
  onThemeChange?: (theme: PassTheme) => void;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read file'));
    r.readAsDataURL(file);
  });

/** Event-level pass look: background artwork, logo, colours. Applies to the keycard, wallet pass and emailed boarding pass. */
export function PassThemeEditor({ eventId, eventName, onThemeChange }: Props) {
  const [theme, setTheme] = useState<PassTheme>({});
  const [draft, setDraft] = useState<PassTheme>({});
  const [pendingBg, setPendingBg] = useState<string | null | undefined>(undefined); // undefined = unchanged, null = remove
  const [pendingLogo, setPendingLogo] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const bgInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const eligible = Boolean(eventId) && eventId !== 'standalone' && !eventId.startsWith('custom-');

  const load = useCallback(async () => {
    if (!eligible) return;
    try {
      const res = await fetch(`/api/events/${eventId}/pass-theme`, { headers: authHeaders() });
      if (!res.ok) return;
      const data: PassTheme = await res.json();
      setTheme(data);
      setDraft(data);
      setPendingBg(undefined);
      setPendingLogo(undefined);
      onThemeChange?.(data);
    } catch {
      /* ignore */
    }
  }, [eventId, eligible, onThemeChange]);

  useEffect(() => {
    load();
  }, [load]);

  if (!eligible) {
    return (
      <p className="text-[11px] text-slate-500">
        Select an existing event to customise its pass background, logo and colours.
      </p>
    );
  }

  const merged: PassTheme = {
    ...draft,
    backgroundUrl: pendingBg === null ? undefined : pendingBg || draft.backgroundUrl,
    logoUrl: pendingLogo === null ? undefined : pendingLogo || draft.logoUrl,
  };
  const val = {
    bg: draft.backgroundColor || DEFAULT_PASS_THEME.backgroundColor,
    fg: draft.foregroundColor || DEFAULT_PASS_THEME.foregroundColor,
    label: draft.labelColor || DEFAULT_PASS_THEME.labelColor,
    overlay: typeof draft.overlay === 'number' ? draft.overlay : DEFAULT_PASS_THEME.overlay,
  };

  const pick = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'bg' | 'logo') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('Please choose an image file.');
    if (file.size > 12 * 1024 * 1024) return setMessage('Image is too large (max 12 MB).');
    const url = await readAsDataUrl(file);
    if (kind === 'bg') setPendingBg(url);
    else setPendingLogo(url);
    setMessage('');
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${eventId}/pass-theme`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          backgroundColor: val.bg,
          foregroundColor: val.fg,
          labelColor: val.label,
          overlay: val.overlay,
          ...(pendingBg !== undefined ? { background: pendingBg === null ? null : { dataUrl: pendingBg } } : {}),
          ...(pendingLogo !== undefined ? { logo: pendingLogo === null ? null : { dataUrl: pendingLogo } } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setTheme(data);
      setDraft(data);
      setPendingBg(undefined);
      setPendingLogo(undefined);
      onThemeChange?.(data);
      setMessage(
        data.walletErrors?.length
          ? `Saved, but WalletWallet rejected the update: ${data.walletErrors[0]} (background/logo need a Pro key and a publicly reachable portal URL).`
          : data.walletUpdated
          ? `Saved. ${data.walletUpdated} wallet pass(es) updated live.`
          : 'Saved. New passes, emails and wallet cards will use this look.'
      );
    } catch (e: any) {
      setMessage(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    pendingBg !== undefined ||
    pendingLogo !== undefined ||
    val.bg !== (theme.backgroundColor || DEFAULT_PASS_THEME.backgroundColor) ||
    val.fg !== (theme.foregroundColor || DEFAULT_PASS_THEME.foregroundColor) ||
    val.label !== (theme.labelColor || DEFAULT_PASS_THEME.labelColor) ||
    val.overlay !== (typeof theme.overlay === 'number' ? theme.overlay : DEFAULT_PASS_THEME.overlay);

  const colourField = (label: string, key: 'backgroundColor' | 'foregroundColor' | 'labelColor', value: string) => (
    <label className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
      {label}
      <input
        type="color"
        value={value}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        className="h-7 w-10 rounded border border-slate-300 dark:border-white/20 bg-transparent cursor-pointer"
      />
    </label>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        <Palette className="h-3.5 w-3.5 text-accent" /> Pass look for “{eventName}”
      </div>

      {/* Wallet preview: exactly what iOS 27 draws from the portrait 690×1010 crop WalletWallet receives */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Apple / Google Wallet (iOS 27 poster)</div>
          <div style={{ zoom: 0.8 }}>
            <AppleWalletPosterPreview
              attendeeName="Attendee Name"
              guestCategory="VIP Dignitary"
              passType="VIP Pass"
              roomOrVenue="Main Auditorium"
              eventName={eventName}
              validity="10 Oct – 12 Oct 2026"
              serialNumber="LEADS-EVT-2026-XXXXXX"
              validDaysCount={3}
              logoUrl={merged.logoUrl || '/card/leads-logo.png'}
              backgroundUrl={pendingBg || draft.walletBackgroundUrl}
              baseColor={val.bg}
            />
          </div>
        </div>
        <ul className="text-[10.5px] text-slate-500 space-y-1.5 list-disc pl-4 pt-5">
          <li>Artwork is cropped to <strong>portrait 690×1010</strong> (centre crop) — keep faces/logos in the middle.</li>
          <li>Apple dims the image and prints <strong>white text</strong> over it: top = logo, middle = details, bottom = QR. Avoid busy detail there.</li>
          <li>Older iPhones / Android show the classic card with your base colour; the artwork shows on iOS 27+.</li>
          <li>The image is sent to WalletWallet as a public URL on this portal and re-hosted by them once; re-uploading creates a new URL and updates installed passes.</li>
        </ul>
      </div>

      {/* Live boarding-pass preview (email + portal ticket) */}
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 -mb-1">Emailed boarding pass &amp; portal card</div>
      <div
        className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg"
        style={{ ...passThemeStyle(merged, `linear-gradient(145deg, ${val.bg} 0%, #030712 100%)`), aspectRatio: '1200 / 460' }}
      >
        <div className="absolute inset-0 flex">
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div className="flex items-center gap-2">
              {merged.logoUrl && <img src={merged.logoUrl} alt="" className="h-6 w-auto object-contain" />}
              <div>
                <div className="text-[9px] font-black tracking-widest" style={{ color: val.label }}>LEADS NEXT GEN CENTRE • RUAS</div>
                <div className="text-[8px]" style={{ color: val.label }}>OFFICIAL EVENT PASS</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-black truncate" style={{ color: val.fg }}>{eventName}</div>
              <div className="text-[8px] mt-1" style={{ color: val.label }}>VIP DIGNITARY</div>
              <div className="text-xs font-bold" style={{ color: val.fg }}>Attendee Name</div>
            </div>
          </div>
          <div className="w-[26%] bg-white/95 flex flex-col items-center justify-center border-l-2 border-dashed border-slate-400/50">
            <div className="h-10 w-10 bg-slate-900 rounded-sm" />
            <div className="text-[7px] font-bold text-slate-700 mt-1">SCAN AT ENTRY</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => bgInput.current?.click()}
          className="py-2 px-3 rounded-xl border border-dashed border-slate-400 dark:border-white/25 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:border-accent cursor-pointer"
        >
          <ImagePlus className="h-3.5 w-3.5" /> {merged.backgroundUrl ? 'Replace background' : 'Upload background'}
        </button>
        <button
          type="button"
          onClick={() => logoInput.current?.click()}
          className="py-2 px-3 rounded-xl border border-dashed border-slate-400 dark:border-white/25 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:border-accent cursor-pointer"
        >
          <ImagePlus className="h-3.5 w-3.5" /> {merged.logoUrl ? 'Replace logo' : 'Upload logo'}
        </button>
        <input ref={bgInput} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e, 'bg')} />
        <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e, 'logo')} />
        {merged.backgroundUrl && (
          <button type="button" onClick={() => setPendingBg(null)} className="text-[10px] text-rose-400 hover:underline flex items-center justify-center gap-1 cursor-pointer">
            <Trash2 className="h-3 w-3" /> Remove background
          </button>
        )}
        {merged.logoUrl && (
          <button type="button" onClick={() => setPendingLogo(null)} className="text-[10px] text-rose-400 hover:underline flex items-center justify-center gap-1 cursor-pointer">
            <Trash2 className="h-3 w-3" /> Remove logo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {colourField('Base colour', 'backgroundColor', val.bg)}
        {colourField('Text colour', 'foregroundColor', val.fg)}
        {colourField('Label colour', 'labelColor', val.label)}
      </div>

      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        Darken artwork for legibility: {Math.round(val.overlay * 100)}%
        <input
          type="range"
          min={0}
          max={0.9}
          step={0.05}
          value={val.overlay}
          onChange={(e) => setDraft((d) => ({ ...d, overlay: Number(e.target.value) }))}
          className="w-full accent-sky-500"
        />
      </label>

      <button
        type="button"
        onClick={save}
        disabled={saving || !dirty}
        className="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save pass look'}
      </button>
      <p className="text-[10.5px] text-slate-500">
        Applies to the portal keycard, the emailed boarding pass and the Apple/Google Wallet pass. Text/label colours below affect the portal card and email only — Apple draws wallet text in white.
      </p>
      {message && <p className="text-[11px] font-semibold text-accent">{message}</p>}
    </div>
  );
}
