'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarRange,
  Calendar,
  MapPin,
  CheckSquare,
  Clock,
  ExternalLink,
  Maximize2,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  EventItem,
  TaskItem,
  getEffectiveEventStatus,
  hasEventPlanningPhase,
  formatEventDateRange,
  formatEventPlanningNote
} from '@/lib/local-data';
import { EventDetailModal } from '@/components/event-detail-modal';

type WindowKey = '14' | '30' | '90' | 'year';

const WINDOW_OPTIONS: { key: WindowKey; label: string; before: number; after: number }[] = [
  { key: '14', label: '2 Weeks', before: 2, after: 14 },
  { key: '30', label: '30 Days', before: 5, after: 30 },
  { key: '90', label: '90 Days', before: 7, after: 90 },
  { key: 'year', label: 'Full Year', before: 30, after: 335 },
];

const DAY_MS = 86400000;
const parseDate = (s: string) => new Date(`${s}T00:00:00`);
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY_MS);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const STATUS_COLORS: Record<EventItem['status'], string> = {
  planned: 'bg-accent',
  active: 'bg-warning',
  completed: 'bg-success',
  archived: 'bg-theme-text-secondary/50',
};

interface GanttTimelineProps {
  /** Already permission-filtered, non-holiday events (see the dashboard home page's visibleEvents). */
  events: EventItem[];
  /** Already permission-filtered tasks (see displayedTasks on the home page). */
  tasks: TaskItem[];
  maxRows?: number;
}

/**
 * Cross-module project timeline: one bar per event spanning its start/end
 * dates, with diamond markers for that event's tasks plotted at their due
 * date, plus a "Other Deliverables" row for tasks not tied to any event.
 * Clicking once previews info on the timeline; clicking again opens a modal
 * window with full event details without leaving the home page.
 */
/** How many events/tasks fall within a given window, without building full row data — used only to decide the auto-widen fallback below. */
function countInWindow(opt: typeof WINDOW_OPTIONS[number], events: EventItem[], tasks: TaskItem[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = toDateStr(addDays(today, -opt.before));
  const end = toDateStr(addDays(today, opt.after));
  const eventCount = events.filter(e => !e.datesTBD && e.startDate && e.endDate && e.endDate >= start && e.startDate <= end).length;
  const taskCount = tasks.filter(t => t.dueDate >= start && t.dueDate <= end).length;
  return eventCount + taskCount;
}

export function GanttTimeline({ events, tasks, maxRows = 10 }: GanttTimelineProps) {
  const [windowKey, setWindowKey] = useState<WindowKey>('30');
  // Expanding shows the same timeline full-screen with more rows and, by
  // default, the Full Year window — collapsing back returns to whatever
  // window was selected before.
  const [isExpanded, setIsExpanded] = useState(false);

  // 1st click = select event & show info banner on timeline.
  // 2nd click = open full event detail modal window without leaving home.
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<EventItem | null>(null);

  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const handleEventClick = (event: EventItem) => {
    if (selectedEventId === event.id) {
      // 2nd click on the same event: opens the detail window modal!
      setModalEvent(event);
    } else {
      // 1st click: selects the event and displays the info on the timeline!
      setSelectedEventId(event.id);
    }
  };

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsExpanded(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isExpanded]);
  // Once the user picks a window explicitly, their choice sticks — auto-widen
  // only ever applies to the untouched default.
  const [userPickedWindow, setUserPickedWindow] = useState(false);

  // If the default (30-day) window — or, failing that, 2 weeks — turns up
  // nothing, automatically widen to 90 days rather than showing an empty
  // chart the user has to manually expand.
  useEffect(() => {
    if (userPickedWindow) return;
    for (const opt of WINDOW_OPTIONS) {
      if (countInWindow(opt, events, tasks) > 0) {
        setWindowKey(opt.key);
        return;
      }
    }
    setWindowKey('year');
  }, [events, tasks, userPickedWindow]);

  const windowOpt = WINDOW_OPTIONS.find(w => w.key === windowKey)!;

  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = addDays(today, -windowOpt.before);
    const end = addDays(today, windowOpt.after);

    // The default lookback is only a few days — nowhere near enough to
    // actually place a planning-phase start date that's genuinely weeks
    // out. Extend the window's left edge back to the earliest such date
    // actually in play (capped so one very old date can't blow the whole chart out).
    const endStr = toDateStr(end);
    let earliestPlanning: string | null = null;
    for (const e of events) {
      if (!hasEventPlanningPhase(e) || !e.startDate || e.startDate > endStr) continue;
      if (!earliestPlanning || e.planningStartDate! < earliestPlanning) earliestPlanning = e.planningStartDate!;
    }
    if (earliestPlanning && earliestPlanning < toDateStr(start)) {
      const hardFloor = addDays(today, -180);
      const candidate = parseDate(earliestPlanning);
      start = candidate < hardFloor ? hardFloor : candidate;
    }

    return { rangeStart: start, rangeEnd: end, totalDays: daysBetween(start, end) + 1 };
  }, [windowOpt, events]);

  const dayWidth = totalDays <= 16 ? 40 : totalDays <= 35 ? 22 : totalDays <= 120 ? 11 : 7;
  const timelineWidth = totalDays * dayWidth;
  const todayOffset = daysBetween(rangeStart, new Date(new Date().setHours(0, 0, 0, 0)));

  const xFor = (dateStr: string) => Math.min(totalDays, Math.max(0, daysBetween(rangeStart, parseDate(dateStr)))) * dayWidth;

  const rangeStartStr = toDateStr(rangeStart);
  const rangeEndStr = toDateStr(rangeEnd);

  const effectiveMaxRows = isExpanded ? 500 : maxRows;

  const eventRows = useMemo(() => {
    return events
      .filter(e => !e.datesTBD && e.startDate && e.endDate)
      .filter(e => e.endDate >= rangeStartStr && e.startDate <= rangeEndStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, effectiveMaxRows)
      .map(event => {
        const clampedStart = event.startDate < rangeStartStr ? rangeStartStr : event.startDate;
        const clampedEnd = event.endDate > rangeEndStr ? rangeEndStr : event.endDate;
        const left = xFor(clampedStart);
        const width = Math.max(dayWidth * 0.6, xFor(clampedEnd) - left + dayWidth);

        // Pre-event planning/prep phase, drawn as a lighter, hatched lead-in
        // segment ending where the event's own (solid) bar begins.
        let planningLeft: number | null = null;
        let planningWidth = 0;
        if (hasEventPlanningPhase(event) && event.planningStartDate! <= rangeEndStr) {
          const clampedPlanStart = event.planningStartDate! < rangeStartStr ? rangeStartStr : event.planningStartDate!;
          planningLeft = xFor(clampedPlanStart);
          planningWidth = Math.max(dayWidth * 0.4, left - planningLeft);
        }

        const eventTasks = tasks
          .filter(t => t.eventId === event.id && t.dueDate >= rangeStartStr && t.dueDate <= rangeEndStr);
        return { event, left, width, planningLeft, planningWidth, tasks: eventTasks };
      });
  }, [events, tasks, rangeStartStr, rangeEndStr, dayWidth, effectiveMaxRows]);

  const standaloneTasks = useMemo(() => {
    return tasks
      .filter(t => !t.eventId && t.dueDate >= rangeStartStr && t.dueDate <= rangeEndStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, isExpanded ? 200 : 12);
  }, [tasks, rangeStartStr, rangeEndStr, isExpanded]);

  // Week/period tick labels along the header, spaced ~4-8 apart depending on zoom
  const ticks = useMemo(() => {
    const tickEveryDays = totalDays <= 16 ? 1 : totalDays <= 35 ? 7 : 14;
    const result: { offset: number; label: string }[] = [];
    for (let i = 0; i <= totalDays; i += tickEveryDays) {
      const d = addDays(rangeStart, i);
      result.push({ offset: i * dayWidth, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
    }
    return result;
  }, [totalDays, dayWidth, rangeStart]);

  const rowCount = eventRows.length + (standaloneTasks.length > 0 ? 1 : 0);

  const content = (
    <div className={isExpanded ? 'glass-panel rounded-2xl p-6 flex flex-col space-y-4 h-full min-h-0' : 'glass-panel rounded-2xl p-6 flex flex-col space-y-4'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-accent" />
            Project Timeline
          </h3>
          <p className="text-xs text-theme-text-secondary">
            Click once to inspect timeline info &middot; Click again to open full event window
          </p>
          {!userPickedWindow && windowKey !== '30' && (
            <p className="text-[10px] text-warning font-medium pt-0.5">Auto-widened to {windowOpt.label.toLowerCase()} — nothing fell in the default window</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {WINDOW_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { setWindowKey(opt.key); setUserPickedWindow(true); }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                windowKey === opt.key
                  ? 'bg-accent text-white'
                  : 'bg-theme-border/30 text-theme-text-secondary hover:bg-theme-border/50 hover:text-theme-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (!isExpanded) { setWindowKey('year'); setUserPickedWindow(true); }
              setIsExpanded(v => !v);
            }}
            title={isExpanded ? 'Collapse' : 'Expand — see the full year'}
            className="p-1.5 rounded-lg bg-theme-border/30 text-theme-text-secondary hover:bg-theme-border/50 hover:text-theme-text-primary transition-all cursor-pointer"
          >
            {isExpanded ? <X className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 1st Click Info Banner: Shows selected event details on timeline */}
      {selectedEvent && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent/15 via-primary/10 to-accent/5 border border-accent/30 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-accent text-white shadow-xs">
                Timeline Info
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-theme-border/30 text-theme-text-primary border border-theme-border/40">
                {getEffectiveEventStatus(selectedEvent, tasks)}
              </span>
              {selectedEvent.campus && (
                <span className="text-[10px] text-theme-text-secondary bg-theme-border/20 px-2 py-0.5 rounded-full border border-theme-border/30">
                  {selectedEvent.campus}
                </span>
              )}
            </div>

            <h4 className="text-sm md:text-base font-bold text-theme-text-primary truncate">
              {selectedEvent.title}
            </h4>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-theme-text-secondary">
              <span className="flex items-center gap-1 font-semibold text-accent">
                <Calendar className="h-3.5 w-3.5" />
                {formatEventDateRange(selectedEvent)}
              </span>
              {formatEventPlanningNote(selectedEvent) && (
                <span className="text-warning font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatEventPlanningNote(selectedEvent)}
                </span>
              )}
              {selectedEvent.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-theme-text-secondary" />
                  {selectedEvent.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CheckSquare className="h-3.5 w-3.5 text-theme-text-secondary" />
                {tasks.filter(t => t.eventId === selectedEvent.id || t.event === selectedEvent.title).length} tasks
              </span>
            </div>

            {selectedEvent.description && (
              <p className="text-xs text-theme-text-secondary line-clamp-1 italic pt-0.5">
                &ldquo;{selectedEvent.description}&rdquo;
              </p>
            )}

            <p className="text-[11px] text-accent/90 font-semibold pt-0.5 flex items-center gap-1">
              <span>👉 Click this event row again on the timeline, or press the button to open full details window.</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-stretch md:self-center justify-end">
            <button
              type="button"
              onClick={() => setModalEvent(selectedEvent)}
              className="px-4 py-2 bg-accent hover:bg-primary-light text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-accent/20 flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Open Event Window</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedEventId(null)}
              className="p-2 rounded-xl bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              title="Deselect event"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {rowCount === 0 ? (
        <div className="text-center py-10 text-theme-text-secondary text-xs">
          No events or tasks fall within this window. Try a wider range, or check the Events / Tasks modules directly.
        </div>
      ) : (
        <>
          <div className={isExpanded ? 'flex-1 min-h-0 overflow-auto rounded-xl border border-theme-border/20' : 'overflow-x-auto rounded-xl border border-theme-border/20'}>
            <div style={{ minWidth: timelineWidth + 176 }}>
              {/* Header: date scale */}
              <div className="flex sticky top-0 z-20">
                <div className="sticky left-0 z-30 w-44 shrink-0 bg-theme-card border-b border-r border-theme-border/20 px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-secondary">Timeline</span>
                </div>
                <div className="relative bg-theme-card border-b border-theme-border/20" style={{ width: timelineWidth, height: 32 }}>
                  {ticks.map((t, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full flex items-center border-l border-theme-border/15 pl-1"
                      style={{ left: t.offset }}
                    >
                      <span className="text-[9px] text-theme-text-secondary whitespace-nowrap">{t.label}</span>
                    </div>
                  ))}
                  {todayOffset >= 0 && todayOffset <= totalDays && (
                    <div
                      className="absolute top-0 h-full border-l-2 border-danger/70 z-10"
                      style={{ left: todayOffset * dayWidth }}
                    >
                      <span className="absolute -top-0.5 left-1 text-[9px] font-bold text-danger whitespace-nowrap">Today</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Event rows */}
              {eventRows.map(({ event, left, width, planningLeft, planningWidth, tasks: eventTasks }) => {
                const effective = getEffectiveEventStatus(event, tasks);
                const isSelected = selectedEventId === event.id;

                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className={`flex items-center h-11 border-b border-theme-border/10 group cursor-pointer transition-colors ${
                      isSelected ? 'bg-accent/10 border-accent/30' : 'hover:bg-theme-border/10'
                    }`}
                  >
                    <div
                      className={`sticky left-0 z-10 w-44 shrink-0 border-r border-theme-border/20 px-3 py-2 transition-all ${
                        isSelected ? 'bg-accent/15 border-l-4 border-l-accent' : 'bg-theme-card group-hover:bg-accent/5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={`text-[11px] transition-all truncate block w-full text-left cursor-pointer ${
                          isSelected ? 'font-bold text-accent' : 'font-semibold text-theme-text-primary hover:text-accent'
                        }`}
                        title={isSelected ? `${event.title} (Click again to open full event window)` : `${event.title} (Click to inspect on timeline)`}
                      >
                        {event.title}
                      </button>
                    </div>
                    <div className="relative" style={{ width: timelineWidth, height: '100%' }}>
                      {todayOffset >= 0 && todayOffset <= totalDays && (
                        <div className="absolute top-0 h-full border-l border-danger/30" style={{ left: todayOffset * dayWidth }} />
                      )}
                      {planningLeft !== null && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-warning/40 border border-dashed border-warning/70 hover:bg-warning/55 transition-all cursor-pointer ${
                            isSelected ? 'ring-2 ring-warning ring-offset-1 ring-offset-theme-card' : ''
                          }`}
                          style={{ left: planningLeft, width: planningWidth }}
                          title={isSelected ? `${event.title} · prep phase (Click again to open event window)` : `${event.title} · prep phase from ${event.planningStartDate} (Click to inspect)`}
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-full ${STATUS_COLORS[effective]} ${
                          isSelected
                            ? 'opacity-100 ring-2 ring-accent ring-offset-2 ring-offset-theme-card shadow-md scale-y-125'
                            : 'opacity-80 hover:opacity-100'
                        } transition-all shadow-sm cursor-pointer`}
                        style={{ left, width }}
                        title={isSelected ? `${event.title} · ${effective} (Click again to open event window)` : `${event.title} · ${effective} (Click to inspect)`}
                      />
                      {eventTasks.map(task => (
                        <Link
                          key={task.id}
                          href={`/dashboard/tasks?highlight=${task.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rotate-45 border border-white/60 shadow-sm hover:scale-125 transition-transform z-10 ${
                            task.status === 'Completed' ? 'bg-success' : task.status === 'Pending Extension' ? 'bg-danger' : 'bg-white'
                          }`}
                          style={{ left: xFor(task.dueDate) }}
                          title={`${task.title} · due ${task.dueDate} · ${task.status}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Standalone tasks row */}
              {standaloneTasks.length > 0 && (
                <div className="flex items-center h-11 border-b border-theme-border/10 group">
                  <div className="sticky left-0 z-10 w-44 shrink-0 bg-theme-card group-hover:bg-accent/5 border-r border-theme-border/20 px-3 py-2 transition-all">
                    <Link
                      href="/dashboard/tasks"
                      className="text-[11px] font-semibold text-theme-text-secondary hover:text-accent transition-all truncate block"
                    >
                      Other Deliverables
                    </Link>
                  </div>
                  <div className="relative" style={{ width: timelineWidth, height: '100%' }}>
                    {todayOffset >= 0 && todayOffset <= totalDays && (
                      <div className="absolute top-0 h-full border-l border-danger/30" style={{ left: todayOffset * dayWidth }} />
                    )}
                    {standaloneTasks.map(task => (
                      <Link
                        key={task.id}
                        href={`/dashboard/tasks?highlight=${task.id}`}
                        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rotate-45 border border-white/60 shadow-sm hover:scale-125 transition-transform ${
                          task.status === 'Completed' ? 'bg-success' : task.status === 'Pending Extension' ? 'bg-danger' : 'bg-accent'
                        }`}
                        style={{ left: xFor(task.dueDate) }}
                        title={`${task.title} · due ${task.dueDate} · ${task.status}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-theme-text-secondary pt-1">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Planned</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Active</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-theme-text-secondary/50" /> Archived</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning/40 border border-dashed border-warning/70" /> Planning/prep phase</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-white border border-theme-text-secondary/40 inline-block" /> Task due</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-success inline-block" /> Task completed</span>
          </div>
        </>
      )}

      <div className="flex justify-end shrink-0">
        <Link href="/dashboard/events" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
          Open Events Module <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {isExpanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="w-full max-w-7xl h-[88vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      ) : (
        content
      )}

      {/* Full Event Details Modal Window (Opens on 2nd click without navigating away) */}
      <EventDetailModal
        event={modalEvent}
        tasks={tasks}
        isOpen={modalEvent !== null}
        onClose={() => setModalEvent(null)}
      />
    </>
  );
}

