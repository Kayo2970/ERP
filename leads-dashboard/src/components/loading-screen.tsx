'use client';

import React, { useEffect } from 'react';
import { GhostFibers } from '@/components/ui/ghost-fibers';

interface LoadingScreenProps {
  /** How long the splash stays on screen before onComplete fires, in ms. */
  duration?: number;
  subtitle?: string;
  onComplete?: () => void;
}

/**
 * Full-screen branded splash shown during login and dashboard module transitions
 * with the animated LEADS GhostFibers WebGL backdrop behind the rotating logo badge.
 */
export function LoadingScreen({ duration = 2000, subtitle, onComplete }: LoadingScreenProps) {
  useEffect(() => {
    if (!onComplete) return;
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-space-theme overflow-hidden select-none">
      {/* Background Animated GhostFibers WebGL Shader with LEADS Palette */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-75 dark:opacity-90">
        <GhostFibers
          lineColor="#0F2A47"
          glowColor="#2E75B6"
          speed={0.2}
          scale={2.2}
          rotation={15}
          rotationSpeed={0.18}
          layers={5}
          waveAmplitude={0.018}
          waveFrequency={3.2}
          waveSpeed={0.15}
          layerSpeed={0.07}
          twist={0.12}
          twistFrequency={4.5}
          twistSpeed={0.9}
          lineFrequency={5.5}
          lineSpacing={2}
          lineSharpness={18}
          glowFalloff={8}
          glowIntensity={1.8}
          brightness={1.9}
          blueBoost={1.35}
          vignette={0.8}
          grain={0.04}
          dpr={1}
        />
      </div>

      {/* Subtle Frosted Radial Glass Layer */}
      <div className="absolute inset-0 bg-space-theme/40 backdrop-blur-[2px] pointer-events-none z-[1]" />

      {/* Centered Elevated LEADS Logo Badge */}
      <div className="relative z-10 flex flex-col items-center gap-5 animate-splash-logo p-6 rounded-3xl glass-panel border border-white/20 shadow-2xl backdrop-blur-md">
        <div className="relative h-24 w-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent animate-spin"></div>
          <img
            src="/images/leads-short-logo.png"
            alt="LEADS Logo"
            className="h-13 w-13 object-contain filter drop-shadow-[0_4px_12px_rgba(46,117,182,0.45)]"
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
      </div>
    </div>
  );
}
