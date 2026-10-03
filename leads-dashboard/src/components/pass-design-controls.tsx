'use client';

import React from 'react';
import { Calendar, Palette, Sparkles } from 'lucide-react';
import { PassTheme, expandDateRange } from '@/lib/local-data';

export const PASS_COLOR_PRESETS = [
  { name: 'Obsidian Black', hex: '#0b1526', ring: 'ring-slate-500' },
  { name: 'Sapphire Navy', hex: '#0d2342', ring: 'ring-sky-500' },
  { name: 'Emerald Forest', hex: '#063024', ring: 'ring-emerald-500' },
  { name: 'Amethyst Purple', hex: '#2b124c', ring: 'ring-purple-500' },
  { name: 'Burgundy Wine', hex: '#3e0f1e', ring: 'ring-rose-500' },
  { name: 'Amber Bronze', hex: '#3a2408', ring: 'ring-amber-500' },
  { name: 'Titanium Slate', hex: '#1e2530', ring: 'ring-slate-400' },
];

export const PASS_GRADIENT_PRESETS = [
  { name: 'Deep Sapphire', value: 'linear-gradient(145deg, #0d2342 0%, #030712 100%)', baseColor: '#0d2342', endColor: '#030712' },
  { name: 'Royal Emerald', value: 'linear-gradient(145deg, #063024 0%, #021a14 100%)', baseColor: '#063024', endColor: '#021a14' },
  { name: 'Ruby Crimson', value: 'linear-gradient(145deg, #3e0f1e 0%, #150207 100%)', baseColor: '#3e0f1e', endColor: '#150207' },
  { name: 'Obsidian Gold', value: 'linear-gradient(145deg, #1f1f23 0%, #78350f 100%)', baseColor: '#18181b', endColor: '#78350f' },
  { name: 'Amethyst Night', value: 'linear-gradient(145deg, #2b124c 0%, #0d0617 100%)', baseColor: '#2b124c', endColor: '#0d0617' },
  { name: 'Ocean Cyan', value: 'linear-gradient(145deg, #0369a1 0%, #082f49 100%)', baseColor: '#0369a1', endColor: '#082f49' },
  { name: 'Sunset Bronze', value: 'linear-gradient(145deg, #7c2d12 0%, #1c1917 100%)', baseColor: '#7c2d12', endColor: '#1c1917' },
  { name: 'Titanium Slate', value: 'linear-gradient(145deg, #334155 0%, #0f172a 100%)', baseColor: '#1e293b', endColor: '#0f172a' },
];

/** Gradient / solid colour design of the pass card. Shared by the Studio and the Edit Pass dialog. */
export function PassColorControls({
  colorMode, setColorMode, passColor, setPassColor, passGradient, setPassGradient, gradientEndColor, setGradientEndColor, activeTheme,
}: {
  colorMode: 'gradient' | 'solid';
  setColorMode: (m: 'gradient' | 'solid') => void;
  passColor: string;
  setPassColor: (c: string) => void;
  passGradient: string;
  setPassGradient: (g: string) => void;
  gradientEndColor: string;
  setGradientEndColor: (c: string) => void;
  activeTheme?: PassTheme;
}) {
  return (
    <>
            {/* 4.5. Pass Color & Gradient Customization */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-accent" />
                  <span>Pass Color &amp; Gradient Customization</span>
                </label>
              {activeTheme?.backgroundUrl && (
                <p className="text-[10.5px] text-sky-400">Event background image is active on the card — the colour/gradient below is only the fallback.</p>
              )}
                <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-white/10 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setColorMode('gradient')}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      colorMode === 'gradient'
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    Gradient
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('solid')}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      colorMode === 'solid'
                        ? 'bg-accent text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    Solid
                  </button>
                </div>
              </div>

              {colorMode === 'gradient' ? (
                <div className="space-y-2.5">
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Select a luxury dual-tone gradient preset or customize both gradient stops:
                  </div>
                  {/* Gradient Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {PASS_GRADIENT_PRESETS.map((gp) => {
                      const isSelected = passGradient === gp.value;
                      return (
                        <button
                          type="button"
                          key={gp.name}
                          onClick={() => {
                            setPassGradient(gp.value);
                            setPassColor(gp.baseColor);
                            setGradientEndColor(gp.endColor);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex items-center justify-between ${
                            isSelected
                              ? 'ring-2 ring-accent border-white shadow-md'
                              : 'border-white/15 opacity-85 hover:opacity-100'
                          }`}
                          style={{ background: gp.value }}
                        >
                          <span className="text-[10px] font-extrabold text-white drop-shadow truncate">
                            {gp.name}
                          </span>
                          {isSelected && <Sparkles className="h-3 w-3 text-white drop-shadow shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dual Tone Color Pickers */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Start Color:</span>
                      <label className="relative cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/15 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                        <div className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner" style={{ backgroundColor: passColor }} />
                        <span>{passColor}</span>
                        <input
                          type="color"
                          value={passColor}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setPassColor(newStart);
                            setPassGradient(`linear-gradient(145deg, ${newStart} 0%, ${gradientEndColor} 100%)`);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">End Color:</span>
                      <label className="relative cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/15 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                        <div className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner" style={{ backgroundColor: gradientEndColor }} />
                        <span>{gradientEndColor}</span>
                        <input
                          type="color"
                          value={gradientEndColor}
                          onChange={(e) => {
                            const newEnd = e.target.value;
                            setGradientEndColor(newEnd);
                            setPassGradient(`linear-gradient(145deg, ${passColor} 0%, ${newEnd} 100%)`);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Solid pass theme (applied directly to digital card &amp; Apple Wallet pass):
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {PASS_COLOR_PRESETS.map((cp) => {
                      const isSelected = passColor.toLowerCase() === cp.hex.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={cp.hex}
                          onClick={() => {
                            setPassColor(cp.hex);
                            setPassGradient(`linear-gradient(145deg, ${cp.hex} 0%, #030712 100%)`);
                          }}
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

                    <div className="flex items-center gap-1.5 ml-auto">
                      <label className="relative cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 border border-slate-300 dark:border-white/15 text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-all">
                        <span>Custom</span>
                        <input
                          type="color"
                          value={passColor}
                          onChange={(e) => {
                            setPassColor(e.target.value);
                            setPassGradient(`linear-gradient(145deg, ${e.target.value} 0%, #030712 100%)`);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

    </>
  );
}

/** Text + label colour overrides (blank = automatic). */
export function PassTextColorControls({
  textColor, setTextColor, labelColor, setLabelColor,
}: {
  textColor: string;
  setTextColor: (c: string) => void;
  labelColor: string;
  setLabelColor: (c: string) => void;
}) {
  return (
    <>
            {/* 4.6 Text colours */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Pass Text Colours</span>
                {(textColor || labelColor) && (
                  <button type="button" onClick={() => { setTextColor(''); setLabelColor(''); }} className="text-[10px] text-sky-400 hover:underline">
                    Reset to auto
                  </button>
                )}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['Text (name, event)', textColor, setTextColor, '#ffffff'],
                  ['Labels & accents', labelColor, setLabelColor, '#38bdf8'],
                ] as const).map(([lbl, val, set, fallback]) => (
                  <label key={lbl} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {lbl}
                    <input type="color" value={val || fallback} onChange={(e) => set(e.target.value)} className="h-7 w-10 rounded border border-slate-300 dark:border-white/20 bg-transparent cursor-pointer" />
                  </label>
                ))}
              </div>
              <p className="text-[10.5px] text-slate-500">
                Applies to the pass card, the public pass page and the emailed ticket. Apple/Google Wallet draws its own white text on poster backgrounds.
              </p>
            </div>

    </>
  );
}

/** One pass, one QR, many days: pick which of the event's days this pass is valid on. */
export function PassValidityPicker({
  eventDays, effectiveValidDays, selectedValidDays, setSelectedValidDays, toggleValidDay, validityDate, setValidityDate, displayValidity,
}: {
  eventDays: string[];
  effectiveValidDays: string[];
  selectedValidDays: string[] | null;
  setSelectedValidDays: (d: string[] | null) => void;
  toggleValidDay: (d: string) => void;
  validityDate: string;
  setValidityDate: (v: string) => void;
  displayValidity: string;
}) {
  return (
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Valid On (one pass, one QR for all selected days)</span>
                  {selectedValidDays && (
                    <button
                      type="button"
                      onClick={() => setSelectedValidDays(null)}
                      className="text-[10px] text-sky-400 hover:underline"
                    >
                      All event days
                    </button>
                  )}
                </label>
                {eventDays.length > 1 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {eventDays.map((d) => {
                      const on = effectiveValidDays.includes(d);
                      return (
                        <button
                          type="button"
                          key={d}
                          onClick={() => toggleValidDay(d)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                            on
                              ? 'bg-sky-500/20 border-sky-400 text-sky-600 dark:text-sky-200'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-white/15 text-slate-500 line-through'
                          }`}
                        >
                          {new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-accent text-xs"
                    />
                  </div>
                )}
                <p className="text-[10.5px] text-slate-500">
                  Valid: <strong>{displayValidity}</strong>
                  {effectiveValidDays.length > 1 ? ` · ${effectiveValidDays.length} days` : ''}
                </p>
              </div>
  );
}

export { expandDateRange };
