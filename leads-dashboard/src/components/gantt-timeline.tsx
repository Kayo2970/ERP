'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarRange, ExternalLink } from 'lucide-react';
import { EventItem, TaskItem, getEffectiveEventStatus } from '@/lib/local-data';

type WindowKey = '14' | '30' | '90';

const WINDOW_OPTIONS: { key: WindowKey; label: string; before: number; after: number }[] = [
  { key: '14', label: '2 Weeks', before: 2, after: 14 },
  { key: '30', label: '30 Days', before: 5, after: 30 },
  { key: '90', label: '90 Days', before: 7, after: 90 },
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
 * Both bars and markers deep-link back into the Events/Tasks modules.
 */
export function GanttTimeline({ events, tasks, maxRows = 10 }: GanttTimelineProps) {
  const [windowKey, setWindowKey] = useState<WindowKey>('30');
  const windowOpt = WINDOW_OPTIONS.find(w => w.key === windowKey)!;

  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = addDays(today, -windowOpt.before);
    const end = addDays(today, windowOpt.after);
    return { rangeStart: start, rangeEnd: end, totalDays: daysBetween(start, end) + 1 };
  }, [windowOpt]);

  const dayWidth = totalDays <= 16 ? 40 : totalDays <= 35 ? 22 : 11;
  const timelineWidth = totalDays * dayWidth;
  const todayOffset = daysBetween(rangeStart, new Date(new Date().setHours(0, 0, 0, 0)));

  const xFor = (dateStr: string) => Math.min(totalDays, Math.max(0, daysBetween(rangeStart, parseDate(dateStr)))) * dayWidth;

  const rangeStartStr = toDateStr(rangeStart);
  const rangeEndStr = toDateStr(rangeEnd);

  const eventRows = useMemo(() => {
    return events
      .filter(e => !e.datesTBD && e.startDate && e.endDate)
      .filter(e => e.endDate >= rangeStartStr && e.startDate <= rangeEndStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, maxRows)
      .map(event => {
        const clampedStart = event.startDate < rangeStartStr ? rangeStartStr : event.startDate;
        const clampedEnd = event.endDate > rangeEndStr ? rangeEndStr : event.endDate;
        const left = xFor(clampedStart);
        const width = Math.max(dayWidth * 0.6, xFor(clampedEnd) - left + dayWidth);
        const eventTasks = tasks
          .filter(t => t.eventId === event.id && t.dueDate >= rangeStartStr && t.dueDate <= rangeEndStr);
        return { event, left, width, tasks: eventTasks };
      });
  }, [events, tasks, rangeStartStr, rangeEndStr, dayWidth, maxRows]);

  const standaloneTasks = useMemo(() => {
    return tasks
      .filter(t => !t.eventId && t.dueDate >= rangeStartStr && t.dueDate <= rangeEndStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 12);
  }, [tasks, rangeStartStr, rangeEndStr]);

  // Week/period tick labels along the header, spaced ~4-8 apart depending on zoom
  const tickEveryDays = totalDays <= 16 ? 1 : totalDays <= 35 ? 7 : 14;
  const ticks: { offset: number; label: string }[] = [];
  for (let i = 0; i <= totalDays; i += tickEveryDays) {
    const d = addDays(rangeStart, i);
    ticks.push({ offset: i * dayWidth, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
  }

  const rowCount = eventRows.length + (standaloneTasks.length > 0 ? 1 : 0);

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-accent" />
            Project Timeline
          </h3>
          <p className="text-xs text-theme-text-secondary">Events and their linked tasks, across the whole club — click any bar or marker to jump in</p>
        </div>

        <div className="flex items-center gap-1.5">
          {WINDOW_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setWindowKey(opt.key)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                windowKey === opt.key
                  ? 'bg-accent text-white'
                  : 'bg-theme-border/30 text-theme-text-secondary hover:bg-theme-border/50 hover:text-theme-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {rowCount === 0 ? (
        <div className="text-center py-10 text-theme-text-secondary text-xs">
          No events or tasks fall within this window. Try a wider range, or check the Events / Tasks modules directly.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-theme-border/20">
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
              {eventRows.map(({ event, left, width, tasks: eventTasks }) => {
                const effective = getEffectiveEventStatus(event, tasks);
                return (
                  <div key={event.id} className="flex items-center h-11 border-b border-theme-border/10 group">
                    <div className="sticky left-0 z-10 w-44 shrink-0 bg-theme-card group-hover:bg-accent/5 border-r border-theme-border/20 px-3 py-2 transition-all">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="text-[11px] font-semibold text-theme-text-primary hover:text-accent transition-all truncate block"
                        title={event.title}
                      >
                        {event.title}
                      </Link>
                    </div>
                    <div className="relative" style={{ width: timelineWidth, height: '100%' }}>
                      {todayOffset >= 0 && todayOffset <= totalDays && (
                        <div className="absolute top-0 h-full border-l border-danger/30" style={{ left: todayOffset * dayWidth }} />
                      )}
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-full ${STATUS_COLORS[effective]} opacity-80 hover:opacity-100 transition-all shadow-sm`}
                        style={{ left, width }}
                        title={`${event.title} · ${effective}`}
                      />
                      {eventTasks.map(task => (
                        <Link
                          key={task.id}
                          href={`/dashboard/tasks?highlight=${task.id}`}
                          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rotate-45 border border-white/60 shadow-sm hover:scale-125 transition-transform ${
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
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-white border border-theme-text-secondary/40 inline-block" /> Task due</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rotate-45 bg-success inline-block" /> Task completed</span>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Link href="/dashboard/events" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
          Open Events Module <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
