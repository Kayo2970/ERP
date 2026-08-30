'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  Palette,
  CheckSquare,
  AlertCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { getEvents, getTasks, addTask, EventItem, TaskItem, Member } from '@/lib/local-data';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';

export default function FestivalsPage() {
  const [user, setUser] = useState<Member | null>(null);
  const [festivals, setFestivals] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming_7' | 'upcoming_30' | 'past'>('all');
  const [successMsg, setSuccessMsg] = useState('');

  const refreshData = () => {
    const allEvents = getEvents();
    const holidayList = allEvents.filter(e => e.isHoliday || e.description?.includes('holiday') || e.description?.includes('festival'));
    setFestivals(holidayList);
    setTasks(getTasks());
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    refreshData();

    window.addEventListener('leads-data-sync', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('leads-data-sync', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  // Helper to find related social media post task for a festival
  const getFestivalSocialTask = (festival: EventItem): TaskItem | undefined => {
    return tasks.find(t => 
      t.eventId === festival.id ||
      t.event === festival.title ||
      t.title.toLowerCase().includes(festival.title.toLowerCase())
    );
  };

  // Helper to request a social media creative post for a festival
  const handleCreateSocialPostTask = (festival: EventItem) => {
    if (!user) return;
    const taskTitle = `Social media post needed for "${festival.title}"?`;
    addTask({
      title: taskTitle,
      event: festival.title,
      eventId: festival.id,
      assignee: user.name || 'Media & Design Head',
      assigneeEmail: user.email || 'design@leads.edu',
      assigneeType: 'individual',
      status: 'Assigned',
      dueDate: festival.startDate,
      creatorName: user.name || 'User',
      isDesignDeliverable: true,
      workflowType: 'holiday_social_approval',
    });
    refreshData();
    triggerSuccess(`Social media post task requested for ${festival.title}!`);
  };

  // Filtered festivals
  const filteredFestivals = festivals.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedMonth !== 'all') {
      const monthStr = f.startDate.slice(5, 7);
      if (monthStr !== selectedMonth) return false;
    }

    if (timeFilter === 'upcoming_7') {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const in7Days = d.toISOString().slice(0, 10);
      return f.startDate >= todayStr && f.startDate <= in7Days;
    }

    if (timeFilter === 'upcoming_30') {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      const in30Days = d.toISOString().slice(0, 10);
      return f.startDate >= todayStr && f.startDate <= in30Days;
    }

    if (timeFilter === 'past') {
      return f.startDate < todayStr;
    }

    return true;
  }).sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/30 shadow-xl bg-gradient-to-r from-accent/15 via-primary/10 to-transparent">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-accent/20 border border-accent/30 text-accent">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-theme-text-primary tracking-tight">Festivals & Observances</h1>
              <p className="text-xs text-theme-text-secondary">Official Indian National Observances, University Holidays & Social Media Campaign Tracker</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/tasks">
            <Button variant="flat" color="accent" size="sm" startContent={<CheckSquare className="h-4 w-4" />}>
              View Social Tasks
            </Button>
          </Link>
          <Link href="/dashboard/calendar">
            <Button variant="bordered" color="default" size="sm" startContent={<Calendar className="h-4 w-4" />}>
              Open Calendar
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/20">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-text-secondary" />
          <input
            type="text"
            placeholder="Search festivals or observances..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/40 dark:bg-white/5 border border-theme-border/30 text-theme-text-primary placeholder:text-theme-text-secondary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 bg-white/30 dark:bg-white/5 p-1 rounded-xl border border-theme-border/20">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${timeFilter === 'all' ? 'bg-accent text-white shadow-sm' : 'text-theme-text-secondary hover:text-theme-text-primary'}`}
            >
              All ({festivals.length})
            </button>
            <button
              onClick={() => setTimeFilter('upcoming_30')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${timeFilter === 'upcoming_30' ? 'bg-accent text-white shadow-sm' : 'text-theme-text-secondary hover:text-theme-text-primary'}`}
            >
              Next 30 Days
            </button>
            <button
              onClick={() => setTimeFilter('upcoming_7')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${timeFilter === 'upcoming_7' ? 'bg-accent text-white shadow-sm' : 'text-theme-text-secondary hover:text-theme-text-primary'}`}
            >
              This Week
            </button>
          </div>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white/40 dark:bg-white/5 border border-theme-border/30 text-theme-text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="all">All Months</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
      </div>

      {/* Festivals Grid */}
      {filteredFestivals.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3 border border-white/20">
          <Sparkles className="h-10 w-10 text-theme-text-secondary mx-auto opacity-50" />
          <h3 className="text-base font-bold text-theme-text-primary">No festivals match your current filter</h3>
          <p className="text-xs text-theme-text-secondary max-w-sm mx-auto">Try clearing search keywords or selecting All Months.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFestivals.map((festival) => {
            const socialTask = getFestivalSocialTask(festival);
            const isUpcoming = festival.startDate >= todayStr;
            const dateObj = new Date(festival.startDate);
            const formattedDate = isNaN(dateObj.getTime())
              ? festival.startDate
              : dateObj.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

            return (
              <Card
                key={festival.id}
                variant="flat"
                className={`flex flex-col justify-between transition-all duration-300 hover:border-accent/40 ${isUpcoming ? 'border-accent/25' : 'opacity-80'}`}
              >
                <CardHeader className="flex items-start justify-between gap-3 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip variant="flat" color={isUpcoming ? 'accent' : 'default'} size="sm">
                        {isUpcoming ? 'Upcoming' : 'Past Observance'}
                      </Chip>
                      <span className="text-[11px] font-semibold text-theme-text-secondary flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formattedDate}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-theme-text-primary leading-tight mt-1">
                      {festival.title}
                    </h3>
                  </div>
                </CardHeader>

                <CardBody className="py-2 space-y-3">
                  <p className="text-xs text-theme-text-secondary leading-relaxed">
                    {festival.description || 'Indian public holiday / festival (auto-synced weekly).'}
                  </p>

                  {/* Social Media Status Block */}
                  <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-theme-border/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-theme-text-secondary flex items-center gap-1.5">
                        <Share2 className="h-3.5 w-3.5 text-accent" />
                        Social Media Post:
                      </span>
                      {socialTask ? (
                        <Chip
                          variant="flat"
                          color={socialTask.status === 'Completed' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {socialTask.status === 'Completed' ? 'Post Ready (Done)' : 'Task in Progress'}
                        </Chip>
                      ) : (
                        <Chip variant="flat" color="default" size="sm">
                          No Post Requested
                        </Chip>
                      )}
                    </div>

                    {socialTask && (
                      <p className="text-[11px] text-theme-text-secondary truncate">
                        Assigned to: <strong className="text-theme-text-primary">{socialTask.assignee}</strong> ({socialTask.status})
                      </p>
                    )}
                  </div>
                </CardBody>

                <CardFooter className="pt-3 border-t border-theme-border/20 flex items-center justify-between gap-2">
                  {socialTask ? (
                    <Link
                      href={`/dashboard/tasks?highlight=${socialTask.id}`}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      View Assigned Task <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <Button
                      variant="flat"
                      color="accent"
                      size="sm"
                      onClick={() => handleCreateSocialPostTask(festival)}
                      startContent={<Palette className="h-3.5 w-3.5" />}
                    >
                      Request Social Post (Yes)
                    </Button>
                  )}

                  <Link href={`/dashboard/calendar?date=${festival.startDate}`}>
                    <Button variant="light" color="default" size="sm">
                      In Calendar
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
