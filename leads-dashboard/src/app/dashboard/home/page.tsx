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
  Award
} from 'lucide-react';
import { getTasks, getEvents, getMembers, getRatings, updateTaskStatus, TaskItem } from '@/lib/local-data';

// Mock Data for Quarters
const scoreHistory = [
  { quarter: 'Q1', score: 4.2 },
  { quarter: 'Q2', score: 4.5 },
  { quarter: 'Q3', score: 4.7 },
  { quarter: 'Q4', score: 4.8 },
];

// Mock Data for Criteria
const criteriaScores = [
  { name: 'Quality', score: 4.9, color: '#2E8B57' },
  { name: 'Timeliness', score: 4.6, color: '#7FB069' },
  { name: 'Initiative', score: 4.8, color: '#2E8B57' },
  { name: 'Collaboration', score: 4.7, color: '#7FB069' },
];
export default function DashboardHome() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [eventsCount, setEventsCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  
  // Announcements and Events Tab State
  const [activeTab, setActiveTab] = useState<'events' | 'announcements'>('events');
  const [events, setEvents] = useState<any[]>([]);

  // Custom Calendar and Leaderboard State
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 7, 1)); // Default August 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(10); // Default to 10th (Tech Conclave start)
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    setTasks(getTasks());
    setEventsCount(getEvents().length);
    setEvents(getEvents().sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
    setMembersCount(getMembers().length);
    
    // Leaderboard calculation
    const ratingsList = getRatings();
    const totalsMap: Record<string, { total: number; count: number; role: string; type: string }> = {};
    
    ratingsList.forEach(r => {
      const key = r.targetName;
      if (!totalsMap[key]) {
        totalsMap[key] = { 
          total: 0, 
          count: 0, 
          role: r.targetType === 'committee' ? 'Committee Group' : 'Student Leader',
          type: r.targetType
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
        score: Math.round((item.total / item.count) * 10) / 10,
        type: item.type
      };
    });

    const defaults = [
      { name: 'Gurutejas C', role: 'Senior President', score: 4.9, type: 'individual' },
      { name: 'Abhijit Arya', role: 'Senior Vice President', score: 4.8, type: 'individual' },
      { name: 'Organizing Committee', role: 'Committee Group', score: 4.7, type: 'committee' },
      { name: 'Sadiya Sawood', role: 'Head — Leadership & Dev', score: 4.6, type: 'individual' },
    ];

    const finalLeaderboard = [...calculated];
    defaults.forEach(def => {
      if (!finalLeaderboard.some(f => f.name === def.name)) {
        finalLeaderboard.push(def);
      }
    });

    setLeaderboard(finalLeaderboard.sort((a, b) => b.score - a.score).slice(0, 4));
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
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
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    setSelectedDay(null);
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

  // Filter tasks based on logged-in user tier/roles
  const displayedTasks = tasks.filter(task => {
    if (!user) return true;
    if (user.tier <= 3) return true; // Super User, Centre Head, Head of Events see all
    if (user.tier === 5) {
      // Core Committee see their own tasks plus tasks related to their committee
      return task.assigneeEmail === user.email || task.event === 'Tech Conclave 2026';
    }
    // Training Associates see only their own assigned tasks
    return task.assigneeEmail === user.email;
  });

  // Count tasks awaiting acknowledgment
  const pendingAckCount = displayedTasks.filter(t => t.status === 'Assigned').length;

  const announcements = [
    { id: '1', title: 'Q3 Performance Evaluation Ratings Published', body: 'Faculty advisors have updated individual and committee ratings for the Q3 events cycle. Check your rating card.', date: 'Today, 10:30 AM', scope: 'Everyone' },
    { id: '2', title: 'Reimbursement Claims Deadline - August Cycle', body: 'All expense claims and receipts for events conducted in July/August must be submitted by August 24th.', date: 'Yesterday', scope: 'Core Committee' },
  ];

  const getFormatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
      return { day, month };
    } catch {
      return { day: '??', month: 'EVT' };
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Welcome Card & Context Alert */}
      {user && (
        <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-accent/5 to-primary/5 border-accent/10">
          <div>
            <h1 className="text-xl font-bold text-theme-text-primary">Welcome Back, {user.name}!</h1>
            <p className="text-xs text-theme-text-secondary mt-1">Logged in as {user.role} &middot; Tier {user.tier}</p>
          </div>
          <span className="text-xs font-semibold text-accent px-3 py-1 bg-accent/15 rounded-xl border border-accent/10">
            {user.tier <= 3 ? 'Administrator Workspace' : 'Collaborator Workspace'}
          </span>
        </div>
      )}

      {/* Banner: Task awaiting acknowledgment */}
      {pendingAckCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/20 rounded-2xl text-theme-text-primary animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <span className="text-sm font-medium">
              You have {pendingAckCount} task(s) awaiting your acknowledgment.
            </span>
          </div>
          <span className="text-xs font-semibold text-warning uppercase tracking-wider bg-warning/10 px-2 py-0.5 rounded-md">Action Required</span>
        </div>
      )}

      {/* Grid: Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Events */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Active Events</span>
            <h3 className="text-2xl font-bold text-theme-text-primary">{eventsCount}</h3>
            <span className="text-[10px] text-success font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +2 this month
            </span>
          </div>
          <div className="h-12 w-12 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/15">
            <Calendar className="h-6 w-6 text-accent" />
          </div>
        </div>

        {/* Tasks Assigned */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Your Tasks</span>
            <h3 className="text-2xl font-bold text-theme-text-primary">{displayedTasks.length}</h3>
            <span className="text-[10px] text-theme-text-secondary font-medium">
              {displayedTasks.filter(t => t.status === 'Completed').length} completed
            </span>
          </div>
          <div className="h-12 w-12 bg-success/15 rounded-xl flex items-center justify-center border border-success/15">
            <CheckSquare className="h-6 w-6 text-success" />
          </div>
        </div>

        {/* Members / Roster Count */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Member Roster</span>
            <h3 className="text-2xl font-bold text-theme-text-primary">{membersCount}</h3>
            <span className="text-[10px] text-accent font-semibold">Active center roster</span>
          </div>
          <div className="h-12 w-12 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/15">
            <TrendingUp className="h-6 w-6 text-accent" />
          </div>
        </div>

        {/* Performance Rating */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Performance Rollup</span>
            <h3 className="text-2xl font-bold text-theme-text-primary">4.8 <span className="text-sm font-normal text-theme-text-secondary">/ 5</span></h3>
            <div className="flex gap-0.5">
              <span className="h-1.5 w-6 bg-success rounded-full"></span>
              <span className="h-1.5 w-6 bg-success rounded-full"></span>
              <span className="h-1.5 w-6 bg-success rounded-full"></span>
              <span className="h-1.5 w-6 bg-success rounded-full"></span>
              <span className="h-1.5 w-6 bg-theme-border rounded-full"></span>
            </div>
          </div>
          <div className="h-12 w-12 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/15">
            <ArrowUpRight className="h-6 w-6 text-accent" />
          </div>
        </div>

      </div>

      {/* Grid: Calendar & Leaderboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Interactive Event Calendar */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-theme-text-primary">LEADS Event Calendar</h3>
              <p className="text-xs text-theme-text-secondary">Click on highlighted days with event indicators</p>
            </div>
            
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
              <button 
                onClick={handlePrevMonth}
                className="p-1 hover:bg-theme-border/30 rounded-lg text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-semibold text-theme-text-primary select-none w-24 text-center">
                {monthNames[calMonth]} {calYear}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-1 hover:bg-theme-border/30 rounded-lg text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
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
                          ? 'bg-accent/10 border border-accent/25 text-accent hover:bg-accent/20'
                          : 'hover:bg-theme-border/30 text-theme-text-primary'
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvents && !isSelected && (
                      <span className="absolute bottom-1 h-1 w-1 bg-accent rounded-full animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Event Details */}
          <div className="flex-1 space-y-2 max-h-[140px] overflow-y-auto pr-1">
            <h4 className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider">
              Events on {monthNames[calMonth]} {selectedDay || '?'}:
            </h4>
            {selectedDay ? (
              (() => {
                const dayEvents = getDayEvents(selectedDay);
                if (dayEvents.length === 0) {
                  return (
                    <div className="text-[11px] text-theme-text-secondary py-3 text-center bg-white/5 border border-white/5 rounded-xl">
                      No events scheduled for this date.
                    </div>
                  );
                }
                return dayEvents.map(ev => (
                  <div key={ev.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between gap-3 hover:bg-white/10 transition-all text-xs">
                    <div>
                      <h5 className="font-semibold text-theme-text-primary">{ev.title}</h5>
                      <p className="text-[10px] text-theme-text-secondary mt-0.5">{ev.committee}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-accent/15 text-accent font-medium rounded-md">
                      {ev.status}
                    </span>
                  </div>
                ));
              })()
            ) : (
              <div className="text-[11px] text-theme-text-secondary py-3 text-center bg-white/5 border border-white/5 rounded-xl">
                Select a day with indicators to audit scheduled events.
              </div>
            )}
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <div>
            <h3 className="text-base font-semibold text-theme-text-primary">Top Center Performers</h3>
            <p className="text-xs text-theme-text-secondary">Leaderboard ranked by overall performance evaluations</p>
          </div>

          <div className="flex-1 space-y-3.5">
            {leaderboard.map((perf, index) => {
              const rankIcons = [
                <Crown key="crown" className="h-5 w-5 text-warning shrink-0" />,
                <Award key="award2" className="h-5 w-5 text-theme-text-primary shrink-0 opacity-80" />,
                <Award key="award3" className="h-5 w-5 text-theme-text-secondary shrink-0 opacity-60" />,
              ];

              return (
                <div 
                  key={perf.name} 
                  className="flex items-center justify-between p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl hover:bg-theme-border/15 transition-all text-xs"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Indicator */}
                    <div className="w-6 flex justify-center">
                      {index < 3 ? rankIcons[index] : <span className="font-bold text-theme-text-secondary">#{index + 1}</span>}
                    </div>

                    {/* Initials Avatar */}
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center border font-bold ${
                      perf.type === 'committee'
                        ? 'bg-success/10 border-success/20 text-success'
                        : 'bg-accent/10 border-accent/20 text-accent'
                    }`}>
                      {perf.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    {/* Name & Role details */}
                    <div>
                      <h4 className="font-semibold text-theme-text-primary leading-snug">{perf.name}</h4>
                      <p className="text-[10px] text-theme-text-secondary mt-0.5">{perf.role}</p>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-success/15 border border-success/20 text-success rounded-xl font-bold">
                    <span>{perf.score.toFixed(1)}</span>
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid: Tasks Table & Dynamic Tabbed Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Tasks List */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-theme-text-primary">Actionable Tasks</h3>
              <p className="text-xs text-theme-text-secondary">Your current assignments and task lifecycles</p>
            </div>
            <span className="text-xs font-semibold text-accent px-2 py-0.5 bg-accent/15 rounded-md">{displayedTasks.length} total</span>
          </div>

          <div className="overflow-x-auto">
            {displayedTasks.length === 0 ? (
              <div className="text-center py-8 text-theme-text-secondary text-sm">
                No active tasks assigned.
              </div>
            ) : (
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                    <th className="pb-3 font-medium">Task</th>
                    <th className="pb-3 font-medium">Linked Event</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {displayedTasks.map(task => (
                    <tr key={task.id} className="hover:bg-theme-border/10 transition-all">
                      <td className="py-3.5 pr-2 font-medium text-theme-text-primary">{task.title}</td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary">{task.event || 'Standalone'}</td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary">{task.dueDate}</td>
                      <td className="py-3.5 pr-2">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
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
                      <td className="py-3.5 text-right">
                        {task.status === 'Assigned' ? (
                          <button
                            onClick={() => handleAcknowledge(task.id)}
                            className="px-3 py-1.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-md shadow-accent/15"
                          >
                            Acknowledge
                          </button>
                        ) : task.status === 'In Progress' ? (
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleComplete(task.id)}
                              className="p-1 text-success hover:bg-success/15 rounded-md transition-all cursor-pointer"
                              title="Mark Completed"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleRequestExtension(task.id)}
                              className="p-1 text-warning hover:bg-warning/15 rounded-md transition-all cursor-pointer"
                              title="Request Extension"
                            >
                              <FileClock className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-theme-text-secondary font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tabbed Side Panel: Announcements & Events Calendar */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <div className="flex border-b border-theme-border/30 pb-1">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 pb-2 text-center text-xs font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === 'events' 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              Event Calendar
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex-1 pb-2 text-center text-xs font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === 'announcements' 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              Announcements
            </button>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto pr-1 max-h-[360px]">
            {activeTab === 'events' ? (
              // Events Calendar View
              events.length === 0 ? (
                <div className="text-center py-12 text-theme-text-secondary text-xs">
                  No upcoming events scheduled.
                </div>
              ) : (
                events.map(ev => {
                  const { day, month } = getFormatDate(ev.startDate);
                  return (
                    <div 
                      key={ev.id} 
                      className="flex gap-3.5 p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl hover:bg-theme-border/15 transition-all"
                    >
                      {/* Calendar Block Icon */}
                      <div className="h-12 w-12 shrink-0 bg-accent/15 rounded-xl border border-accent/25 flex flex-col items-center justify-center font-sans">
                        <span className="text-[9px] font-bold text-accent leading-none">{month}</span>
                        <span className="text-lg font-extrabold text-theme-text-primary leading-tight mt-0.5">{day}</span>
                      </div>
                      
                      {/* Event Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                            ev.status === 'active' 
                              ? 'bg-success/15 text-success' 
                              : 'bg-accent/15 text-accent'
                          }`}>
                            {ev.status}
                          </span>
                          <span className="text-[10px] text-theme-text-secondary font-medium">
                            {ev.committee}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-theme-text-primary leading-snug">
                          {ev.title}
                        </h4>
                        <p className="text-[11px] text-theme-text-secondary leading-relaxed line-clamp-2">
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              // Announcements List View
              announcements.map(announcement => (
                <div 
                  key={announcement.id} 
                  className="p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2 hover:bg-theme-border/15 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-md tracking-wider uppercase">
                      {announcement.scope}
                    </span>
                    <span className="text-[10px] text-theme-text-secondary">
                      {announcement.date}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-theme-text-primary leading-snug">
                    {announcement.title}
                  </h4>
                  <p className="text-[11px] text-theme-text-secondary leading-relaxed">
                    {announcement.body}
                  </p>
                </div>
              ))
            )}
          </div>

          <Link
            href="/dashboard/events"
            className="w-full py-2.5 bg-theme-border/20 hover:bg-theme-border/30 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-theme-card-border"
          >
            {activeTab === 'events' ? 'Go to Events Manager' : 'View Announcements'}
          </Link>
        </div>
      </div>

    </div>
  );
}
