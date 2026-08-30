'use client';

import React from 'react';
import { X } from 'lucide-react';

export type ChipVariant = 'solid' | 'flat' | 'bordered' | 'dot';
export type ChipColor = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ChipVariant;
  color?: ChipColor;
  size?: ChipSize;
  avatar?: React.ReactNode;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const COLOR_VARIANTS: Record<ChipColor, Record<ChipVariant, string>> = {
  accent: {
    solid: 'bg-accent text-white border-transparent',
    flat: 'bg-accent/15 text-accent border-accent/25',
    bordered: 'border border-accent text-accent bg-transparent',
    dot: 'bg-accent/10 text-accent border-accent/20',
  },
  primary: {
    solid: 'bg-primary text-white border-transparent',
    flat: 'bg-primary/20 text-theme-text-primary border-primary/30',
    bordered: 'border border-primary text-theme-text-primary bg-transparent',
    dot: 'bg-primary/15 text-theme-text-primary border-primary/20',
  },
  default: {
    solid: 'bg-white/20 text-theme-text-primary border-white/20',
    flat: 'bg-white/10 text-theme-text-secondary border-white/10',
    bordered: 'border border-theme-border text-theme-text-secondary bg-transparent',
    dot: 'bg-white/10 text-theme-text-secondary border-white/10',
  },
  success: {
    solid: 'bg-emerald-600 text-white border-transparent',
    flat: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    bordered: 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-transparent',
    dot: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  warning: {
    solid: 'bg-amber-600 text-white border-transparent',
    flat: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
    bordered: 'border border-amber-500 text-amber-600 dark:text-amber-400 bg-transparent',
    dot: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  danger: {
    solid: 'bg-rose-600 text-white border-transparent',
    flat: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25',
    bordered: 'border border-rose-500 text-rose-600 dark:text-rose-400 bg-transparent',
    dot: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
};

const DOT_COLORS: Record<ChipColor, string> = {
  accent: 'bg-accent animate-pulse',
  primary: 'bg-primary',
  default: 'bg-white/60',
  success: 'bg-emerald-500 animate-pulse',
  warning: 'bg-amber-500 animate-pulse',
  danger: 'bg-rose-500 animate-pulse',
};

const SIZES: Record<ChipSize, string> = {
  sm: 'h-6 px-2 text-[10px] gap-1 rounded-full',
  md: 'h-7 px-2.5 text-xs gap-1.5 rounded-full',
  lg: 'h-8 px-3 text-sm gap-2 rounded-full',
};

/**
 * HeroUI Chip Component
 * Compact interactive badge element for categories, tags, status pills, and counts.
 */
export function Chip({
  variant = 'flat',
  color = 'default',
  size = 'sm',
  avatar,
  startContent,
  endContent,
  onClose,
  className = '',
  children,
  ...props
}: ChipProps) {
  const colorStyle = COLOR_VARIANTS[color]?.[variant] || COLOR_VARIANTS.default.flat;
  const sizeStyle = SIZES[size] || SIZES.sm;
  const dotColor = DOT_COLORS[color] || DOT_COLORS.default;

  return (
    <div
      className={`inline-flex items-center justify-center font-semibold border select-none transition-all ${colorStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {avatar && <span className="-ml-1 mr-0.5 shrink-0">{avatar}</span>}
      {variant === 'dot' && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />}
      {startContent && <span className="shrink-0">{startContent}</span>}
      <span>{children}</span>
      {endContent && <span className="shrink-0">{endContent}</span>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
