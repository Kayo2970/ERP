'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  /** How long the splash stays on screen before onComplete fires, in ms. */
  duration: number;
  subtitle?: string;
  onComplete?: () => void;
}

/**
 * Full-screen branded splash shown during login and dashboard module
 * transitions — a centered LEADS logo with a spinning ring and a progress
 * bar whose fill is timed to `duration`, so it visually finishes exactly
 * when onComplete fires.
 */
export function LoadingScreen({ duration, subtitle, onComplete }: LoadingScreenProps) {
  const [barFilled, setBarFilled] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setBarFilled(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!onComplete) return;
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-space-theme">
      <div className="flex flex-col items-center gap-5 animate-splash-logo">
        <div className="relative h-24 w-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent animate-spin"></div>
          <img
            src="/images/leads-short-logo.png"
            alt="LEADS Logo"
            className="h-13 w-13 object-contain filter drop-shadow-[0_4px_10px_rgba(46,117,182,0.35)]"
          />
        </div>
        <div className="text-center">
          <h1 className="text-sm font-extrabold tracking-wider uppercase text-theme-text-primary">
            LEADS NEXT GEN CENTRE
          </h1>
          {subtitle && (
            <p className="text-[11px] text-theme-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-40 h-1 bg-theme-border/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full"
            style={{ width: barFilled ? '100%' : '0%', transition: `width ${duration}ms linear` }}
          />
        </div>
      </div>
    </div>
  );
}
