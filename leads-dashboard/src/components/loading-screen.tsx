'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingScreenProps {
  /** How long the splash stays on screen before onComplete fires, in ms. */
  duration: number;
  subtitle?: string;
  onComplete?: () => void;
}

/**
 * HeroUI Full-Screen Loading Screen
 * Renders a full-width dashboard wireframe skeleton in the background with continuous
 * HeroUI shimmer wave animations, layered directly underneath the elevated centered
 * LEADS spinning badge and synchronized progress indicator.
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-space-theme overflow-hidden select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. Background Skeleton Wireframe Layout (Directly Behind)     */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 w-full h-full p-4 md:p-8 flex flex-col justify-between gap-6 pointer-events-none opacity-45 dark:opacity-35 overflow-hidden">
        
        {/* Top Header / Nav Skeleton */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Skeleton animationType="shimmer" className="h-10 w-10 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton animationType="shimmer" className="h-4 w-40 rounded-lg" />
              <Skeleton animationType="shimmer" className="h-2.5 w-24 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton animationType="shimmer" className="h-9 w-48 rounded-xl hidden sm:block" />
            <Skeleton animationType="shimmer" className="h-9 w-9 rounded-xl" />
            <Skeleton animationType="shimmer" className="h-9 w-9 rounded-xl" />
            <Skeleton animationType="shimmer" className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* Hero Banner Skeleton */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
          <Skeleton animationType="shimmer" className="h-6 w-72 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-3.5 w-96 rounded-lg max-w-full" />
          <div className="flex gap-2 pt-2">
            <Skeleton animationType="shimmer" className="h-8 w-28 rounded-xl" />
            <Skeleton animationType="shimmer" className="h-8 w-32 rounded-xl" />
          </div>
        </div>

        {/* 4 Metric KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <Skeleton animationType="shimmer" className="h-3 w-20 rounded" />
                <Skeleton animationType="shimmer" className="h-6 w-6 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton animationType="shimmer" className="h-7 w-24 rounded-lg" />
                <Skeleton animationType="shimmer" className="h-2 w-32 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid (Chart + Activity Feed) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full flex-1 min-h-0">
          {/* Chart Wireframe (2 cols) */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton animationType="shimmer" className="h-4 w-44 rounded-lg" />
              <Skeleton animationType="shimmer" className="h-7 w-24 rounded-xl" />
            </div>
            <div className="h-36 w-full flex items-end justify-between gap-2.5 pt-4 px-2 border-b border-white/10">
              {[35, 60, 40, 85, 50, 95, 75, 45, 90, 65, 80, 100].map((val, idx) => (
                <div
                  key={idx}
                  className="w-full bg-accent/25 rounded-t-md transition-all"
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
          </div>

          {/* Activity Feed Wireframe (1 col) */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col space-y-3">
            <Skeleton animationType="shimmer" className="h-4 w-32 rounded-lg" />
            <div className="space-y-2.5 pt-1 flex-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <Skeleton animationType="shimmer" className="h-8 w-8 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton animationType="shimmer" className="h-3 w-3/4 rounded" />
                    <Skeleton animationType="shimmer" className="h-2 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Frosted Dim Layer Behind Foreground Card                   */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[4px] z-10 pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* 3. Foreground Elevated Centered Loading Badge (Directly On Top) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 flex flex-col items-center justify-center p-4">
        <div className="glass-panel rounded-3xl p-8 md:p-10 flex flex-col items-center gap-6 border border-white/25 shadow-2xl backdrop-blur-2xl animate-splash-logo max-w-sm w-full text-center">
          
          {/* Central Logo with Spinning Rings */}
          <div className="relative h-24 w-24 flex items-center justify-center">
            {/* Outer soft glow ring */}
            <div className="absolute inset-0 rounded-full bg-accent/25 blur-lg animate-pulse"></div>
            
            {/* Rotating outer border ring */}
            <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent border-r-accent/70 animate-spin"></div>
            
            {/* Inner dashed ring */}
            <div className="absolute inset-2 rounded-full border border-dashed border-white/30"></div>

            <img
              src="/images/leads-short-logo.png"
              alt="LEADS Logo"
              className="h-13 w-13 object-contain filter drop-shadow-[0_4px_14px_rgba(46,117,182,0.5)]"
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
            <div className="w-full h-1.5 bg-theme-background/70 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-accent via-primary-light to-accent transition-all duration-75 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-theme-text-secondary font-mono">
              <span className="tracking-wider">INITIALIZING</span>
              <span>{progress}%</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
