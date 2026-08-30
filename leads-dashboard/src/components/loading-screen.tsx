'use client';

import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  /** How long the splash stays on screen before onComplete fires, in ms. */
  duration: number;
  subtitle?: string;
  onComplete?: () => void;
}

/**
 * Full-screen branded loading screen featuring an animated right-to-left
 * UI skeleton wireframe diagram in the background, overlaid with the
 * signature LEADS spinning ring and synchronized progress indicator.
 */
export function LoadingScreen({ duration, subtitle = 'Loading LEADS Portal...', onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress bar fill timed to duration
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 30);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-space-theme overflow-hidden select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* Background UI Skeleton Diagram with Right-to-Left Shimmer */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 w-full h-full p-4 md:p-6 opacity-35 dark:opacity-25 pointer-events-none overflow-hidden">
        
        {/* Right-to-Left Shimmer Sweep Light Ray */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-l from-transparent via-accent/20 to-transparent animate-shimmer-rtl z-10 pointer-events-none" />

        <div className="flex h-full w-full gap-6">
          {/* Skeleton Left Sidebar */}
          <div className="hidden md:flex w-64 flex-col justify-between p-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-6">
            <div className="space-y-6">
              {/* Brand logo skeleton */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 animate-pulse-subtle" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-3/4 rounded bg-white/20 animate-pulse-subtle" />
                  <div className="h-2 w-1/2 rounded bg-white/10 animate-pulse-subtle" />
                </div>
              </div>

              {/* Navigation items skeleton */}
              <div className="space-y-2 pt-2">
                <div className="h-2 w-1/3 rounded bg-white/15 mb-3" />
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 animate-pulse-subtle">
                    <div className="h-4 w-4 rounded bg-white/20 shrink-0" />
                    <div className="h-2.5 rounded bg-white/15 flex-1" style={{ width: `${60 + (i * 7) % 30}%` }} />
                  </div>
                ))}
              </div>

              {/* Admin section skeleton */}
              <div className="space-y-2 pt-2">
                <div className="h-2 w-1/3 rounded bg-white/15 mb-3" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 animate-pulse-subtle">
                    <div className="h-4 w-4 rounded bg-white/20 shrink-0" />
                    <div className="h-2.5 rounded bg-white/15 flex-1" style={{ width: `${50 + (i * 11) % 40}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom user profile skeleton */}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/10">
              <div className="h-8 w-8 rounded-full bg-white/20" />
              <div className="space-y-1 flex-1">
                <div className="h-2.5 w-3/4 rounded bg-white/20" />
                <div className="h-2 w-1/2 rounded bg-white/10" />
              </div>
            </div>
          </div>

          {/* Skeleton Main Content Area */}
          <div className="flex-1 flex flex-col space-y-6">
            
            {/* Top Navbar Skeleton */}
            <div className="h-16 w-full rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 w-1/3">
                <div className="h-4 w-4 rounded bg-white/20" />
                <div className="h-3 w-40 rounded bg-white/15" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-white/10" />
                <div className="h-8 w-8 rounded-xl bg-white/10" />
                <div className="h-8 w-32 rounded-xl bg-white/15" />
              </div>
            </div>

            {/* Hero Welcome Card Skeleton */}
            <div className="h-32 w-full rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col justify-center space-y-3">
              <div className="h-5 w-1/3 rounded bg-white/20 animate-pulse-subtle" />
              <div className="h-3 w-1/2 rounded bg-white/10 animate-pulse-subtle" />
              <div className="flex gap-2 pt-1">
                <div className="h-7 w-24 rounded-lg bg-accent/20" />
                <div className="h-7 w-28 rounded-lg bg-white/10" />
              </div>
            </div>

            {/* 4 Metrics KPI Grid Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between animate-pulse-subtle">
                  <div className="flex justify-between items-start">
                    <div className="h-2.5 w-16 rounded bg-white/15" />
                    <div className="h-6 w-6 rounded-lg bg-accent/20" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-6 w-20 rounded bg-white/25" />
                    <div className="h-2 w-28 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>

            {/* 2-Column Content Split Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
              {/* Left Chart Skeleton (2 cols) */}
              <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-36 rounded bg-white/20" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded bg-white/10" />
                    <div className="h-6 w-16 rounded bg-white/10" />
                  </div>
                </div>
                {/* Chart wireframe bars */}
                <div className="h-44 w-full flex items-end justify-between gap-3 pt-6 px-2 border-b border-white/10">
                  {[45, 65, 30, 80, 55, 90, 70, 40, 85, 60, 75, 95].map((val, idx) => (
                    <div
                      key={idx}
                      className="w-full bg-accent/20 rounded-t-md transition-all animate-pulse-subtle"
                      style={{ height: `${val}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Right Activity Feed Skeleton (1 col) */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col space-y-4">
                <div className="h-4 w-28 rounded bg-white/20" />
                <div className="space-y-3 pt-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <div className="h-7 w-7 rounded-lg bg-white/15 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-2.5 w-3/4 rounded bg-white/20" />
                        <div className="h-2 w-1/2 rounded bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Frosted Glass Overlay with Centered Elevated Loading Badge */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 flex flex-col items-center">
        <div className="glass-panel rounded-3xl p-8 md:p-10 flex flex-col items-center gap-6 border border-white/25 shadow-2xl backdrop-blur-xl animate-splash-logo max-w-sm w-full mx-4 text-center">
          
          {/* Central Logo with Spinning Rings */}
          <div className="relative h-24 w-24 flex items-center justify-center">
            {/* Outer soft glow ring */}
            <div className="absolute inset-0 rounded-full bg-accent/15 blur-md animate-pulse"></div>
            
            {/* Rotating border ring */}
            <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent border-r-accent/60 animate-spin"></div>
            
            {/* Inner dashed ring */}
            <div className="absolute inset-2 rounded-full border border-dashed border-white/25"></div>

            <img
              src="/images/leads-short-logo.png"
              alt="LEADS Logo"
              className="h-13 w-13 object-contain filter drop-shadow-[0_4px_12px_rgba(46,117,182,0.45)]"
            />
          </div>

          {/* Typography */}
          <div className="space-y-1.5">
            <h1 className="text-sm font-extrabold tracking-wider uppercase text-theme-text-primary">
              LEADS NEXT GEN CENTRE
            </h1>
            <p className="text-xs text-theme-text-secondary font-medium">
              {subtitle}
            </p>
          </div>

          {/* Timed Synchronized Progress Bar */}
          <div className="w-full space-y-1.5">
            <div className="w-full h-1.5 bg-theme-background/60 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-accent to-primary-light transition-all duration-75 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-theme-text-secondary font-mono">
              <span>INITIALIZING</span>
              <span>{progress}%</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
