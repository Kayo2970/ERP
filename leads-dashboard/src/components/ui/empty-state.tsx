'use client';

import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-theme-border/50 bg-theme-background/20 space-y-3.5 my-3">
      <div className="p-3.5 bg-theme-border/20 rounded-2xl text-theme-text-secondary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="max-w-sm space-y-1">
        <h4 className="text-sm font-semibold text-theme-text-primary">{title}</h4>
        <p className="text-xs text-theme-text-secondary leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
