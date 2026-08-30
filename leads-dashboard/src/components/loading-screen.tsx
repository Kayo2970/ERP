'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingScreenProps {
  /** How long the splash stays on screen before onComplete fires, in ms. */
  duration: number;
  subtitle?: string;
  route?: string;
  onComplete?: () => void;
}

/**
 * Module-Specific Wireframe Renderers
 * Each component accurately represents the exact visual structure, cards, grids,
 * headers, and tables of its corresponding dashboard module.
 */

// 1. Events Module Skeleton (/dashboard/events)
function EventsSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-full">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-white/10">
        <div className="space-y-1.5">
          <Skeleton animationType="shimmer" className="h-6 w-48 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-3.5 w-64 rounded-lg" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton animationType="shimmer" className="h-9 w-40 rounded-xl hidden sm:block" />
          <Skeleton animationType="shimmer" className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Filter Tabs & Campus Pills */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {['All', 'Ongoing', 'Completed', 'Archived'].map((tab, idx) => (
            <Skeleton key={idx} animationType="shimmer" className="h-8 w-20 rounded-xl" />
          ))}
        </div>
        <Skeleton animationType="shimmer" className="h-8 w-32 rounded-xl" />
      </div>

      {/* 3-Column Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between space-y-3">
            <Skeleton animationType="shimmer" className="h-28 w-full rounded-2xl" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton animationType="shimmer" className="h-4 w-20 rounded-md" />
                <Skeleton animationType="shimmer" className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton animationType="shimmer" className="h-5 w-4/5 rounded-lg" />
              <Skeleton animationType="shimmer" className="h-3 w-full rounded" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <div className="flex -space-x-1.5">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} animationType="shimmer" className="h-6 w-6 rounded-full" />
                ))}
              </div>
              <Skeleton animationType="shimmer" className="h-7 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Tasks Desk Skeleton (/dashboard/tasks)
function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-full">
      {/* Header & Controls */}
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="space-y-1.5">
          <Skeleton animationType="shimmer" className="h-6 w-44 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-3.5 w-60 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton animationType="shimmer" className="h-9 w-48 rounded-xl hidden sm:block" />
          <Skeleton animationType="shimmer" className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Priority Filter Bar */}
      <div className="flex gap-2">
        {['All Tasks', 'To Do', 'In Progress', 'Under Review', 'Completed'].map((tab, idx) => (
          <Skeleton key={idx} animationType="shimmer" className="h-8 w-24 rounded-xl" />
        ))}
      </div>

      {/* 4-Column Kanban Board Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {['To Do (4)', 'In Progress (3)', 'Under Review (2)', 'Completed (6)'].map((col, idx) => (
          <div key={idx} className="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <Skeleton animationType="shimmer" className="h-4 w-24 rounded" />
              <Skeleton animationType="shimmer" className="h-5 w-5 rounded-full" />
            </div>
            {[...Array(2)].map((_, j) => (
              <div key={j} className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <Skeleton animationType="shimmer" className="h-4 w-16 rounded-full" />
                  <Skeleton animationType="shimmer" className="h-3 w-12 rounded" />
                </div>
                <Skeleton animationType="shimmer" className="h-4 w-full rounded" />
                <Skeleton animationType="shimmer" className="h-3 w-3/4 rounded" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton animationType="shimmer" className="h-6 w-6 rounded-full" />
                  <Skeleton animationType="shimmer" className="h-3 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Members Directory Skeleton (/dashboard/directory)
function DirectorySkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="space-y-1.5">
          <Skeleton animationType="shimmer" className="h-6 w-52 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-3.5 w-64 rounded-lg" />
        </div>
        <div className="flex gap-2.5">
          <Skeleton animationType="shimmer" className="h-9 w-32 rounded-xl hidden sm:block" />
          <Skeleton animationType="shimmer" className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2">
          {['All Members', 'Faculty Leadership', 'Core Committee', 'Training Associates'].map((t, idx) => (
            <Skeleton key={idx} animationType="shimmer" className="h-8 w-28 rounded-xl" />
          ))}
        </div>
        <Skeleton animationType="shimmer" className="h-8 w-48 rounded-xl" />
      </div>

      {/* Members Roster Table */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 flex-1 flex flex-col justify-between space-y-3 min-h-0">
        <div className="grid grid-cols-12 gap-3 pb-3 border-b border-white/10 px-2">
          <Skeleton animationType="shimmer" className="col-span-4 h-3.5 rounded" />
          <Skeleton animationType="shimmer" className="col-span-3 h-3.5 rounded" />
          <Skeleton animationType="shimmer" className="col-span-2 h-3.5 rounded" />
          <Skeleton animationType="shimmer" className="col-span-2 h-3.5 rounded" />
          <Skeleton animationType="shimmer" className="col-span-1 h-3.5 rounded" />
        </div>
        <div className="space-y-2.5 flex-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/5 items-center">
              <div className="col-span-4 flex items-center gap-3">
                <Skeleton animationType="shimmer" className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton animationType="shimmer" className="h-3.5 w-3/4 rounded" />
                  <Skeleton animationType="shimmer" className="h-2.5 w-1/2 rounded" />
                </div>
              </div>
              <div className="col-span-3">
                <Skeleton animationType="shimmer" className="h-4 w-28 rounded-md" />
              </div>
              <div className="col-span-2">
                <Skeleton animationType="shimmer" className="h-4 w-20 rounded" />
              </div>
              <div className="col-span-2">
                <Skeleton animationType="shimmer" className="h-5 w-16 rounded-full" />
              </div>
              <div className="col-span-1 flex justify-end gap-1.5">
                <Skeleton animationType="shimmer" className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 4. Calendar Skeleton (/dashboard/calendar)
function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Month Picker Header */}
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Skeleton animationType="shimmer" className="h-7 w-7 rounded-lg" />
          <Skeleton animationType="shimmer" className="h-6 w-44 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-7 w-7 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {['All Campuses', 'GG Campus', 'RTC Campus'].map((c, i) => (
            <Skeleton key={i} animationType="shimmer" className="h-8 w-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
          <div key={i} className="text-center py-1">
            <Skeleton animationType="shimmer" className="h-4 w-12 mx-auto rounded" />
          </div>
        ))}
      </div>

      {/* 5x7 Month Grid */}
      <div className="grid grid-cols-7 gap-2.5 flex-1 min-h-0">
        {[...Array(28)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-2 flex flex-col justify-between min-h-[48px]">
            <Skeleton animationType="shimmer" className="h-3 w-5 rounded" />
            {i % 3 === 0 && (
              <Skeleton animationType="shimmer" className="h-3 w-full rounded bg-accent/25" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Budget & Finance Skeleton (/dashboard/budget)
function BudgetSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="space-y-1.5">
          <Skeleton animationType="shimmer" className="h-6 w-48 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-3.5 w-60 rounded-lg" />
        </div>
        <Skeleton animationType="shimmer" className="h-9 w-36 rounded-xl" />
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['Total Allocation', 'Total Utilized', 'Remaining Balance', 'Sponsorship Funds'].map((_, idx) => (
          <div key={idx} className="h-28 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
            <Skeleton animationType="shimmer" className="h-3 w-24 rounded" />
            <Skeleton animationType="shimmer" className="h-7 w-28 rounded-lg" />
            <Skeleton animationType="shimmer" className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* 2-Column Split: Allocations & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-3">
          <Skeleton animationType="shimmer" className="h-4 w-36 rounded-lg" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-2xl bg-white/5 space-y-2">
              <div className="flex justify-between">
                <Skeleton animationType="shimmer" className="h-3.5 w-32 rounded" />
                <Skeleton animationType="shimmer" className="h-3.5 w-16 rounded" />
              </div>
              <Skeleton animationType="shimmer" className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-3">
          <Skeleton animationType="shimmer" className="h-4 w-40 rounded-lg" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-white/5">
              <div className="space-y-1.5">
                <Skeleton animationType="shimmer" className="h-3.5 w-28 rounded" />
                <Skeleton animationType="shimmer" className="h-2.5 w-20 rounded" />
              </div>
              <Skeleton animationType="shimmer" className="h-5 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 6. Reimbursements Skeleton (/dashboard/reimbursements)
function ReimbursementsSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-full">
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="space-y-1.5">
          <Skeleton animationType="shimmer" className="h-6 w-52 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-3.5 w-64 rounded-lg" />
        </div>
        <Skeleton animationType="shimmer" className="h-9 w-36 rounded-xl" />
      </div>

      {/* 4 Pipeline Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
            <Skeleton animationType="shimmer" className="h-3 w-28 rounded" />
            <Skeleton animationType="shimmer" className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Claims Table */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 flex-1 flex flex-col justify-between space-y-2.5 min-h-0">
        <div className="grid grid-cols-12 gap-3 pb-3 border-b border-white/10 px-2">
          <Skeleton animationType="shimmer" className="col-span-2 h-3.5 rounded" />
          <Skeleton animationType="shimmer" className="col-span-3 h-3.5 rounded" />
          <Skeleton animationType="shimmer" className="col-span-2 h-3.5 rounded" />
          <Skeleton animationType="shimmer" className="col-span-2 h-3.5 rounded" />
          <Skeleton animationType="shimmer" className="col-span-3 h-3.5 rounded" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 p-2.5 rounded-2xl bg-white/5 items-center">
            <Skeleton animationType="shimmer" className="col-span-2 h-3.5 rounded" />
            <Skeleton animationType="shimmer" className="col-span-3 h-3.5 rounded" />
            <Skeleton animationType="shimmer" className="col-span-2 h-4 w-16 rounded" />
            <Skeleton animationType="shimmer" className="col-span-2 h-5 w-20 rounded-full" />
            <Skeleton animationType="shimmer" className="col-span-3 h-7 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 7. Design Portal Skeleton (/dashboard/designs)
function DesignsSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-full">
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="space-y-1.5">
          <Skeleton animationType="shimmer" className="h-6 w-44 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-3.5 w-60 rounded-lg" />
        </div>
        <Skeleton animationType="shimmer" className="h-9 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between space-y-3">
            <Skeleton animationType="shimmer" className="h-36 w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton animationType="shimmer" className="h-4 w-3/4 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton animationType="shimmer" className="h-4 w-20 rounded-md" />
                <Skeleton animationType="shimmer" className="h-4 w-24 rounded-md" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <Skeleton animationType="shimmer" className="h-6 w-6 rounded-full" />
              <Skeleton animationType="shimmer" className="h-7 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. Performance Ratings Skeleton (/dashboard/ratings)
function RatingsSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-full">
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="space-y-1.5">
          <Skeleton animationType="shimmer" className="h-6 w-52 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-3.5 w-64 rounded-lg" />
        </div>
        <Skeleton animationType="shimmer" className="h-9 w-40 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
          <Skeleton animationType="shimmer" className="h-4 w-36 rounded-lg" />
          <div className="h-48 w-full flex items-center justify-center">
            <Skeleton animationType="shimmer" className="h-36 w-36 rounded-full" />
          </div>
        </div>
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-5 space-y-3">
          <Skeleton animationType="shimmer" className="h-4 w-44 rounded-lg" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-2xl bg-white/5 space-y-2">
              <div className="flex justify-between">
                <Skeleton animationType="shimmer" className="h-3.5 w-40 rounded" />
                <Skeleton animationType="shimmer" className="h-3.5 w-12 rounded" />
              </div>
              <Skeleton animationType="shimmer" className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 9. Default Dashboard Home / General Overview Skeleton (/dashboard/home or default)
function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-full">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Skeleton animationType="shimmer" className="h-10 w-10 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton animationType="shimmer" className="h-4 w-40 rounded-lg" />
            <Skeleton animationType="shimmer" className="h-2.5 w-24 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton animationType="shimmer" className="h-9 w-40 rounded-xl hidden sm:block" />
          <Skeleton animationType="shimmer" className="h-9 w-9 rounded-xl" />
          <Skeleton animationType="shimmer" className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Hero Banner */}
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
            <div className="space-y-1.5">
              <Skeleton animationType="shimmer" className="h-7 w-24 rounded-lg" />
              <Skeleton animationType="shimmer" className="h-2 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Split Grid: Chart + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full flex-1 min-h-0">
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between space-y-3">
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

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 flex flex-col space-y-3">
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
  );
}

/**
 * Route-Aware Loading Screen
 */
export function LoadingScreen({ duration, subtitle, route, onComplete }: LoadingScreenProps) {
  const currentPath = usePathname();
  const activeRoute = (route || currentPath || '').toLowerCase();
  const [progress, setProgress] = useState(0);

  // Dynamic subtitle based on target module
  let displaySubtitle = subtitle;
  if (!displaySubtitle) {
    if (activeRoute.includes('events')) displaySubtitle = 'Loading Events Workspace...';
    else if (activeRoute.includes('tasks')) displaySubtitle = 'Loading Tasks Desk...';
    else if (activeRoute.includes('directory')) displaySubtitle = 'Loading Member Directory...';
    else if (activeRoute.includes('calendar')) displaySubtitle = 'Loading Inter-Campus Calendar...';
    else if (activeRoute.includes('budget')) displaySubtitle = 'Loading Finance & Budgets...';
    else if (activeRoute.includes('reimbursements')) displaySubtitle = 'Loading Claims Pipeline...';
    else if (activeRoute.includes('designs')) displaySubtitle = 'Loading Design & Media Portal...';
    else if (activeRoute.includes('ratings')) displaySubtitle = 'Loading Performance Evaluations...';
    else if (activeRoute.includes('forms')) displaySubtitle = 'Loading Public Forms Engine...';
    else if (activeRoute.includes('reports')) displaySubtitle = 'Loading Analytics & Reports...';
    else displaySubtitle = 'Loading LEADS Portal...';
  }

  useEffect(() => {
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

  // Select module-specific skeleton
  const renderModuleSkeleton = () => {
    if (activeRoute.includes('events')) return <EventsSkeleton />;
    if (activeRoute.includes('tasks')) return <TasksSkeleton />;
    if (activeRoute.includes('directory')) return <DirectorySkeleton />;
    if (activeRoute.includes('calendar')) return <CalendarSkeleton />;
    if (activeRoute.includes('budget')) return <BudgetSkeleton />;
    if (activeRoute.includes('reimbursements')) return <ReimbursementsSkeleton />;
    if (activeRoute.includes('designs')) return <DesignsSkeleton />;
    if (activeRoute.includes('ratings')) return <RatingsSkeleton />;
    return <HomeSkeleton />;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-space-theme overflow-hidden select-none">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. Real Module-Specific Skeleton Wireframe (Behind)            */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 w-full h-full p-4 md:p-8 pointer-events-none opacity-45 dark:opacity-35 overflow-hidden">
        {renderModuleSkeleton()}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Frosted Dim Layer Behind Foreground Card                   */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 bg-black/25 dark:bg-black/45 backdrop-blur-[5px] z-10 pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* 3. Foreground Elevated Centered Loading Badge (Directly On Top) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 flex flex-col items-center justify-center p-4">
        <div className="glass-panel rounded-3xl p-8 md:p-10 flex flex-col items-center gap-6 border border-white/25 shadow-2xl backdrop-blur-2xl animate-splash-logo max-w-sm w-full text-center">
          
          {/* Central Logo with Spinning Rings */}
          <div className="relative h-24 w-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-accent/25 blur-lg animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent border-r-accent/70 animate-spin"></div>
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
              {displaySubtitle}
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
