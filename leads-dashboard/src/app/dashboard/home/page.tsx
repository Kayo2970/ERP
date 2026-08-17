'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
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
  ExternalLink
} from 'lucide-react';
import { getTasks, getEvents, getMembers, updateTaskStatus, TaskItem } from '@/lib/local-data';

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

  useEffect(() => {
    setTasks(getTasks());
    setEventsCount(getEvents().length);
    setMembersCount(getMembers().length);
    
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

      {/* Grid: Charts & Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Score Trend (Line/Area Chart) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <div>
            <h3 className="text-base font-semibold text-theme-text-primary">Overall Rating Trend</h3>
            <p className="text-xs text-theme-text-secondary">Individual combined score rollup per academic quarter</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E75B6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2E75B6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="quarter" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis domain={[0, 5]} stroke="var(--text-secondary)" fontSize={11} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    borderColor: 'var(--card-border)', 
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="score" stroke="#2E75B6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="text-theme-text-secondary border-b border-theme-border/30">
                <th className="pb-1.5 font-medium">Quarter</th>
                <th className="pb-1.5 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {scoreHistory.map(row => (
                <tr key={row.quarter} className="border-b border-theme-border/20 last:border-0">
                  <td className="py-2 text-theme-text-primary">{row.quarter} Summary</td>
                  <td className="py-2 text-theme-text-primary text-right font-medium">{row.score} / 5.0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Criteria Breakdown (Bar Chart) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <div>
            <h3 className="text-base font-semibold text-theme-text-primary">Performance by Criteria</h3>
            <p className="text-xs text-theme-text-secondary">Average score breakdown from Q4 evaluations</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={criteriaScores} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} />
                <YAxis domain={[0, 5]} stroke="var(--text-secondary)" fontSize={11} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    borderColor: 'var(--card-border)', 
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={45}>
                  {criteriaScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="text-theme-text-secondary border-b border-theme-border/30">
                <th className="pb-1.5 font-medium">Evaluation Criteria</th>
                <th className="pb-1.5 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {criteriaScores.map(row => (
                <tr key={row.name} className="border-b border-theme-border/20 last:border-0">
                  <td className="py-2 text-theme-text-primary">{row.name}</td>
                  <td className="py-2 text-theme-text-primary text-right font-medium">{row.score} / 5.0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Grid: Tasks Table & Announcements */}
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
                      <td className="py-3.5 pr-2 text-theme-text-secondary">{task.event}</td>
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

        {/* Announcements List */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            <h3 className="text-base font-semibold text-theme-text-primary">Announcements</h3>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {announcements.map(announcement => (
              <div 
                key={announcement.id} 
                className="p-4 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2 hover:bg-theme-border/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-md tracking-wider uppercase">
                    {announcement.scope}
                  </span>
                  <span className="text-[10px] text-theme-text-secondary">
                    {announcement.date}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-theme-text-primary leading-snug">
                  {announcement.title}
                </h4>
                <p className="text-xs text-theme-text-secondary leading-relaxed">
                  {announcement.body}
                </p>
              </div>
            ))}
          </div>

          <button className="w-full py-2.5 bg-theme-border/20 hover:bg-theme-border/30 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
            View All Announcements
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
