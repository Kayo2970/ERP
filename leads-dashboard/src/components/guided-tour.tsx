'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface TourStep {
  target: string; // data-tour attribute value to find on the page
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'brand',
    title: 'Welcome to LEADS Next Gen Centre',
    description: 'This is your operations dashboard. Wherever you see this logo, clicking it always brings you back to your workspace home.',
  },
  {
    target: 'sidebar-nav',
    title: 'Your modules live here',
    description: 'Every part of the Centre you can work with — Events, Tasks, Budget, Reports, and more — is one click away in this list.',
  },
  {
    target: 'menu',
    title: 'Modules, on any screen',
    description: 'On a phone or tablet, tap this menu button any time to reach the same list of modules.',
  },
  {
    target: 'notifications',
    title: 'Stay on top of what needs you',
    description: 'This bell only counts items that genuinely need a decision from you — approvals, pending reviews, that kind of thing. The badge clears the moment you open it.',
  },
  {
    target: 'theme-toggle',
    title: 'Light or dark, your call',
    description: 'Switch between light and dark themes any time — your choice is remembered for next time.',
  },
  {
    target: 'profile',
    title: 'Your account',
    description: 'Your name, role, Settings, and Sign Out all live here — click your name or photo to open it.',
  },
];

function findVisibleTarget(name: string): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return candidates.find(el => el.offsetParent !== null || el.getClientRects().length > 0) || null;
}

const STORAGE_PREFIX = 'leads-tour-seen:';

/** Spotlights real, already-on-screen UI elements one at a time with a short
 *  explanation, instead of just navigating the user to a page and calling it
 *  a tour. Shown automatically once per account (gated by a per-email
 *  localStorage flag, since there's no server-side "first login" flag to
 *  hook into) and re-launchable any time from the profile menu. Steps that
 *  reference an element not present in the current viewport (e.g. the
 *  desktop-only sidebar while on a phone) are skipped automatically. */
export function GuidedTour({ userEmail, forceOpen, onDone }: { userEmail: string | null; forceOpen: boolean; onDone: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (forceOpen) {
      setStepIndex(0);
      setIsOpen(true);
      return;
    }
    if (!userEmail) return;
    const key = STORAGE_PREFIX + userEmail.toLowerCase();
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => { setStepIndex(0); setIsOpen(true); }, 500);
      return () => clearTimeout(t);
    }
  }, [userEmail, forceOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    if (userEmail) localStorage.setItem(STORAGE_PREFIX + userEmail.toLowerCase(), '1');
    onDone();
  }, [userEmail, onDone]);

  // Recompute the target's rect on every step change, resize, and scroll —
  // and re-check a couple times shortly after (fonts/images can shift layout
  // just after mount).
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const step = TOUR_STEPS[stepIndex];
      const el = step ? findVisibleTarget(step.target) : null;
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    update();
    const timers = [setTimeout(update, 120), setTimeout(update, 400)];
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, stepIndex]);

  // If the current step's target isn't on screen at all (e.g. sidebar-nav on
  // mobile), skip straight past it instead of showing a floating tooltip
  // pointing at nothing.
  useEffect(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[stepIndex];
    if (!step) return;
    if (!findVisibleTarget(step.target)) {
      if (stepIndex < TOUR_STEPS.length - 1) {
        setStepIndex(i => i + 1);
      } else {
        close();
      }
    }
  }, [isOpen, stepIndex, close]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const pad = 8;

  // Tooltip placement: below the target if there's room, otherwise above.
  const tooltipWidth = 320;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768;
  let tooltipTop = rect ? rect.bottom + 16 : viewportH / 2 - 80;
  let placeAbove = false;
  if (rect && tooltipTop + 220 > viewportH) {
    tooltipTop = Math.max(16, rect.top - 220 - 16);
    placeAbove = true;
  }
  let tooltipLeft = rect ? Math.min(Math.max(16, rect.left), viewportW - tooltipWidth - 16) : viewportW / 2 - tooltipWidth / 2;

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Guided workspace tour">
      {/* Dimmed backdrop with a cut-out "spotlight" hole around the target,
          via a giant box-shadow — no SVG mask needed. */}
      {rect ? (
        <div
          className="absolute rounded-xl transition-all duration-300 ease-out pointer-events-none ring-2 ring-accent"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/65" />
      )}

      {/* Click-through-blocking layer for everything except the tooltip itself */}
      <button
        type="button"
        aria-label="Skip tour"
        onClick={close}
        className="absolute inset-0 w-full h-full cursor-default"
        style={{ background: 'transparent' }}
      />

      <div
        className="absolute glass-panel bg-theme-sidebar/95 rounded-2xl shadow-2xl border border-white/20 p-5 w-[min(320px,calc(100vw-2rem))] space-y-3 animate-in fade-in zoom-in-95 duration-200"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Step {stepIndex + 1} of {TOUR_STEPS.length}</span>
          </div>
          <button
            type="button"
            onClick={close}
            className="h-6 w-6 flex items-center justify-center rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-border/20 transition-all cursor-pointer shrink-0"
            title="Skip tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div>
          <h3 className="text-sm font-bold text-theme-text-primary">{step.title}</h3>
          <p className="text-xs text-theme-text-secondary mt-1 leading-relaxed">{step.description}</p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            className="text-[11px] font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex(i => Math.max(0, i - 1))}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-theme-text-primary hover:bg-theme-border/20 rounded-lg transition-all cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={() => { if (isLast) { close(); } else { setStepIndex(i => i + 1); } }}
              className="flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-primary-light text-white text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
            >
              {isLast ? 'Finish' : 'Next'} {!isLast && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
