'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  AlertCircle,
  Megaphone,
  CheckCircle2,
  FileClock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
  Crown,
  Award,
  Users
} from 'lucide-react';
import { 
  getTasks, 
  getEvents, 
  getMembers, 
  getRatings, 
  getAnnouncements, 
  updateTaskStatus, 
  canViewTask, 
  TaskItem, 
  EventItem,
  AnnouncementItem
} from '@/lib/local-data';
import { getRatingColor } from '@/lib/design-tokens';

export default function DashboardHome() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeEventsCount, setActiveEventsCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Announcements and Events Tab State
  const [activeTab, setActiveTab] = useState<'events' | 'announcements'>('events');

  // Custom Calendar and Leaderboard State
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 7, 1)); // Default August 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(10); // Default to 10th
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [overallAvgScore, setOverallAvgScore] = useState<number>(4.8);

  useEffect(() => {
    const allEvents = getEvents();
    setEvents(allEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
    setActiveEventsCount(allEvents.filter(e => e.status === 'active').length);
    
    const allTasks = getTasks();
    setTasks(allTasks);
    
    setMembersCount(getMembers().length);
    setAnnouncements(getAnnouncements());
    
    // Dynamic Leaderboard calculation from actual ratings
    const ratingsList = getRatings();
    const totalsMap: Record<string, { total: number; count: number; role: string }> = {};
    
    ratingsList.forEach(r => {
      const key = r.targetName;
      if (!totalsMap[key]) {
        totalsMap[key] = { 
          total: 0, 
          count: 0, 
          role: 'Member Evaluation'
        };
      }
      totalsMap[key].total += r.overallScore;
      totalsMap[key].count += 1;
    });

    const calculated = Object.keys(totalsMap).map(name => {
      const item = totalsMap[name];
      return {
        name,
        role: item.role,
        score: Math.round((item.total / item.count) * 10) / 10
      };
    }).sort((a, b) => b.score - a.score);

    setLeaderboard(calculated.slice(0, 4));

    if (ratingsList.length > 0) {
      const totalScore = ratingsList.reduce((acc, r) => acc + r.overallScore, 0);
      setOverallAvgScore(parseFloat((totalScore / ratingsList.length).toFixed(1)));
    }
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleAcknowledge = (id: string) => {
    updateTaskStatus(id, 'In Progress');
    setTasks(getTasks());
  };

  const handleComplete = (id: string) => {
    updateTaskStatus(id, 'Completed');
    setTasks(getTasks());
  };

  const handleRequestExtension = (id: string) => {
    updateTaskStatus(id, 'Pending Extension');
    setTasks(getTasks());
  };

  const handlePrevMonth = () => {
    const newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
    setCalendarDate(newDate);
    const maxDays = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    setSelectedDay(prev => prev ? Math.min(prev, maxDays) : 1);
  };

  const handleNextMonth = () => {
    const newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    setCalendarDate(newDate);
    const maxDays = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    setSelectedDay(prev => prev ? Math.min(prev, maxDays) : 1);
  };

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getDayEvents = (day: number) => {
    const checkStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => checkStr >= e.startDate && checkStr <= e.endDate);
  };

  // Filter tasks based on shared permission helper
  const displayedTasks = tasks.filter(task => canViewTask(task, user));

  // Count tasks awaiting acknowledgment
  const pendingAckCount = displayedTasks.filter(t => t.status === 'Assigned').length;

  const scorePercentage = Math.min(100, Math.max(0, (overallAvgScore / 5.0) * 100));

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Welcome Card */}
      {user && (
        <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-accent/10 to-primary/5 border border-accent/20">
          <div>
            <h1 className="text-xl font-bold text-theme-text-primary">Welcome Back, {user.name}!</h1>
            <p className="text-xs text-theme-text-secondary mt-1">
              Role: <span className="font-semibold text-theme-text-primary">{user.role}</span> &middot; Tier {user.tier} &middot; Committee: {user.committee}
            </p>
          </div>
          <span className="text-xs font-semibold text-accent px-3 py-1 bg-accent/15 rounded-xl border border-accent/15">
            {user.tier <= 3 ? 'Leadership Access' : user.tier === 4 ? 'Advisory Oversight' : 'Core Workspace'}
          </span>
        </div>
      )}

      {/* Advisory Board Alert */}
      {user && user.tier === 4 && (
        <div className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <AlertCircle className="h-5 w-5 text-accent shrink-0" />
          <span>
            <strong>Advisory Board Role Notice:</strong> Advisory Board members provide strategic oversight and do not receive operational task assignments. View event progress, analytics rollups, and performance evaluations below.
          </span>
        </div>
      )}

      {/* Banner: Task awaiting acknowledgment */}
      {pendingAckCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/20 rounded-2xl text-theme-text-primary animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <span className="text-xs font-semibold">
              You have {pendingAckCount} task(s) awaiting your acknowledgment.
            </span>
          </div>
          <Link 
            href="/dashboard/tasks"
            className="text-xs font-semibold text-warning uppercase tracking-wider bg-warning/15 px-2.5 py-1 rounded-lg hover:bg-warning/25 transition-all"
          >
            Review Tasks
          </Link>
        </div>
      )}

      {/* Grid: Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Events */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">Active Events</span>
            <h3 className="text-2xl font-bold text-theme-text-primary">{activeEventsCount}</h3>
            <span className="text-[11px] text-theme-text-secondary font-medium">
              {events.length} total planned / active
            </span>
          </div>
          <div className="h-11 w-11 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/15">
            <Calendar className="h-5 w-5 text-accent" />
          </div>
        </div>

        {/* Tasks Assigned */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">Assigned Tasks</span>
            <h3 className="text-2xl font-bold text-theme-text-primary">{displayedTasks.length}</h3>
            <span className="text-[11px] text-success font-semibold">
              {displayedTasks.filter(t => t.status === 'Completed').length} completed
            </span>
          </div>
          <div className="h-11 w-11 bg-success/15 rounded-xl flex items-center justify-center border border-success/15">
            <CheckSquare className="h-5 w-5 text-success" />
          </div>
        </div>

        {/* Members / Roster Count */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">Member Roster</span>
            <h3 className="text-2xl font-bold text-theme-text-primary">{membersCount}</h3>
            <span className="text-[11px] text-accent font-semibold">Active center members</span>
          </div>
          <div className="h-11 w-11 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/15">
            <Users className="h-5 w-5 text-accent" />
          </div>
        </div>

        {/* Performance Rollup */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1.5 flex-1 pr-2">
            <span className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">Performance Rollup</span>
            <h3 className="text-2xl font-bold text-theme-text-primary">
              {overallAvgScore.toFixed(1)} <span className="text-xs font-normal text-theme-text-secondary">/ 5.0</span>
            </h3>
            {/* Continuous progress track */}
            <div className="w-full bg-theme-border/40 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="h-11 w-11 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Star className="h-5 w-5 text-emerald-500 fill-emerald-500" />
          </div>
        </div>

      </div>

      {/* Grid: Calendar & Leaderboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Interactive Event Calendar */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-theme-text-primary">LEADS Event Calendar</h3>
              <p className="text-xs text-theme-text-secondary">Explore scheduled symposiums, workshops, and milestones</p>
            </div>
            
            <div className="flex items-center gap-1 bg-theme-background/30 border border-theme-border/30 rounded-xl p-1 text-xs">
              <button 
                onClick={handlePrevMonth}
                className="p-1 hover:bg-theme-border/30 rounded-lg text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-semibold text-theme-text-primary select-none w-28 text-center text-xs">
                {monthNames[calMonth]} {calYear}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-1 hover:bg-theme-border/30 rounded-lg text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-theme-border/30 rounded-2xl p-4 bg-theme-background/10">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider mb-2">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square"></div>;
                }

                const dayEvents = getDayEvents(day);
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-white shadow-md shadow-accent/25'
                        : hasEvents
                          ? 'bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25'
                          : 'hover:bg-theme-border/30 text-theme-text-primary'
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvents && !isSelected && (
                      <span className="absolute bottom-1 h-1.5 w-1.5 bg-accent rounded-full animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Event Details */}
          <div className="flex-1 space-y-2 max-h-[140px] overflow-y-auto pr-1 text-xs">
            <h4 className="text-[11px] font-bold text-theme-text-secondary uppercase tracking-wider">
              Events on {monthNames[calMonth]} {selectedDay || '?'}:
            </h4>
            {selectedDay ? (
              (() => {
                const dayEvents = getDayEvents(selectedDay);
                if (dayEvents.length === 0) {
                  return (
                    <div className="text-xs text-theme-text-secondary py-3 text-center bg-theme-border/10 border border-theme-border/20 rounded-xl">
                      No events scheduled for this date.
                    </div>
                  );
                }
                return dayEvents.map(ev => (
                  <Link 
                    key={ev.id} 
                    href={`/dashboard/events/${ev.id}`}
                    className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl flex items-center justify-between gap-3 hover:bg-theme-border/20 transition-all block cursor-pointer"
                  >
                    <div>
                      <h5 className="font-semibold text-theme-text-primary text-xs hover:text-accent transition-colors">{ev.title}</h5>
                      <p className="text-[10px] text-theme-text-secondary mt-0.5">{(ev.committees || []).length} Sub-Committees</p>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 bg-accent/15 text-accent font-semibold rounded-md capitalize">
                      {ev.status}
                    </span>
                  </Link>
                ));
              })()
            ) : (
              <div className="text-xs text-theme-text-secondary py-3 text-center bg-theme-border/10 border border-theme-border/20 rounded-xl">
                Select a day to view scheduled events.
              </div>
            )}
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary">Performance Leaderboard</h3>
            <p className="text-xs text-theme-text-secondary">Ranked by authenticated peer and advisor evaluations</p>
          </div>

          <div className="flex-1 space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-10 text-theme-text-secondary text-xs">
                No evaluation scores submitted yet. Visit Ratings to evaluate committee members.
              </div>
            ) : (
              leaderboard.map((perf, index) => {
                const rankIcons = [
                  <Crown key="crown" className="h-5 w-5 text-amber-400 shrink-0" />,
                  <Award key="award2" className="h-5 w-5 text-slate-300 shrink-0" />,
                  <Award key="award3" className="h-5 w-5 text-amber-600 shrink-0" />,
                ];

                const colorTokens = getRatingColor(perf.score);

                return (
                  <div 
                    key={perf.name} 
                    className="flex items-center justify-between p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl hover:bg-theme-border/20 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 flex justify-center">
                        {index < 3 ? rankIcons[index] : <span className="font-bold text-theme-text-secondary">#{index + 1}</span>}
                      </div>

                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center border font-bold text-xs ${
                        perf.type === 'committee'
                          ? 'bg-success/15 border-success/20 text-success'
                          : 'bg-accent/15 border-accent/20 text-accent'
                      }`}>
                        {perf.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <h4 className="font-semibold text-theme-text-primary text-xs leading-snug">{perf.name}</h4>
                        <p className="text-[10px] text-theme-text-secondary">{perf.role}</p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs border ${colorTokens.bg} ${colorTokens.text} ${colorTokens.border}`}>
                      <span>{perf.score.toFixed(1)}</span>
                      <Star className="h-3 w-3 fill-current" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Grid: Tasks Table & Dynamic Tabbed Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Tasks List */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-theme-text-primary">Actionable Tasks</h3>
              <p className="text-xs text-theme-text-secondary">Current assignments and workflow progress</p>
            </div>
            <Link 
              href="/dashboard/tasks" 
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              View All Tasks <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {displayedTasks.length === 0 ? (
              <div className="text-center py-8 text-theme-text-secondary text-xs">
                {user?.tier === 4 ? 'No task obligations for Advisory Board role.' : 'No active tasks assigned to your view.'}
              </div>
            ) : (
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                    <th className="pb-3 font-semibold">Task</th>
                    <th className="pb-3 font-semibold">Event</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {displayedTasks.slice(0, 5).map(task => (
                    <tr key={task.id} className="hover:bg-theme-border/10 transition-all">
                      <td className="py-3 pr-2 font-medium text-theme-text-primary">{task.title}</td>
                      <td className="py-3 pr-2 text-theme-text-secondary">{task.event || 'Standalone'}</td>
                      <td className="py-3 pr-2 text-theme-text-secondary">{task.dueDate}</td>
                      <td className="py-3 pr-2">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          task.status === 'Assigned' 
                             ? 'bg-accent/15 text-accent border border-accent/20' 
                             : task.status === 'In Progress' 
                               ? 'bg-warning/15 text-warning border border-warning/20' 
                               : task.status === 'Completed'
                                 ? 'bg-success/15 text-success border border-success/20'
                                 : 'bg-danger/15 text-danger border border-danger/20'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {task.status === 'Assigned' ? (
                          <button
                            onClick={() => handleAcknowledge(task.id)}
                            className="px-2.5 py-1 bg-accent hover:bg-primary-light text-white text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        ) : task.status === 'In Progress' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleComplete(task.id)}
                              className="px-2.5 py-1 bg-success hover:bg-success/90 text-white text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleRequestExtension(task.id)}
                              className="px-2 py-1 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                              title="Request Deadline Extension"
                            >
                              Extend
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-theme-text-secondary">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Dynamic Tabbed Events & Announcements Panel */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <div className="flex border-b border-theme-border/30 pb-2.5 gap-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-1 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Upcoming Events
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`pb-1 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'announcements'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              <Megaphone className="h-3.5 w-3.5" />
              Announcements
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1 text-xs">
            {activeTab === 'events' ? (
              events.length === 0 ? (
                <div className="text-center py-8 text-theme-text-secondary text-xs">No upcoming events.</div>
              ) : (
                events.map(ev => (
                  <div key={ev.id} className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-1 hover:bg-theme-border/15 transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-theme-text-primary text-xs">{ev.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-accent/15 text-accent font-semibold rounded-md capitalize">{ev.status}</span>
                    </div>
                    <p className="text-[10px] text-theme-text-secondary line-clamp-2">{ev.description}</p>
                    <p className="text-[10px] text-theme-text-secondary font-medium pt-1">{ev.startDate} to {ev.endDate}</p>
                  </div>
                ))
              )
            ) : (
              announcements.length === 0 ? (
                <div className="text-center py-8 text-theme-text-secondary text-xs">No announcements published.</div>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-1 hover:bg-theme-border/15 transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-theme-text-primary text-xs">{ann.title}</h4>
                      <span className="text-[10px] text-accent font-medium px-2 py-0.5 bg-accent/10 rounded">{ann.scope}</span>
                    </div>
                    <p className="text-[10px] text-theme-text-secondary line-clamp-2">{ann.content}</p>
                    <p className="text-[10px] text-theme-text-secondary font-medium pt-1">{ann.publishedAt} &middot; by {ann.authorName}</p>
                  </div>
                ))
              )
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
