'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, MapPin, Users, Briefcase, Eye } from 'lucide-react';
import { getEvents, addEvent, EventItem } from '@/lib/local-data';

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [committee, setCommittee] = useState('Senior Student Leadership');
  const [status, setStatus] = useState<EventItem['status']>('planned');

  useEffect(() => {
    setEvents(getEvents());
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;

    addEvent({
      title,
      description,
      startDate,
      endDate,
      committee,
      status
    });

    // Reset Form & Close Modal
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setCommittee('Senior Student Leadership');
    setStatus('planned');
    setIsModalOpen(false);

    // Refresh Events list
    setEvents(getEvents());
  };

  // Check if current user has admin rights to create events (Tiers 1-3 & 5)
  const canCreate = user && (user.tier <= 3 || user.tier === 5);

  const getStatusBadge = (status: EventItem['status']) => {
    switch (status) {
      case 'active':
        return 'bg-accent/15 text-accent border border-accent/20';
      case 'planned':
        return 'bg-warning/15 text-warning border border-warning/20';
      case 'completed':
        return 'bg-success/15 text-success border border-success/20';
      case 'archived':
        return 'bg-theme-border/30 text-theme-text-secondary border border-theme-border/40';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Events Calendar</h1>
          <p className="text-xs text-theme-text-secondary">Plan, view, and link committees to center events</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Grid of Events Card */}
      {events.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-theme-text-secondary">
          No events created yet. Click "Create Event" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:bg-theme-border/10 transition-all border border-theme-card-border/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusBadge(event.status)}`}>
                    {event.status}
                  </span>
                  <span className="text-[11px] text-theme-text-secondary font-medium flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {event.committee}
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-theme-text-primary leading-tight">{event.title}</h3>
                  <p className="text-xs text-theme-text-secondary line-clamp-2 leading-relaxed">{event.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="border-t border-theme-border/20 pt-4 mt-5 flex items-center justify-between text-xs text-theme-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span>{event.startDate} &middot; {event.endDate}</span>
                </div>
                
                <button className="p-1 hover:bg-theme-border/30 rounded-md transition-all text-theme-text-primary flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-6 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">Create New Event</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sustainable Leadership Meet"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide event overview or objectives"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Linked Committee</label>
                  <select
                    value={committee}
                    onChange={(e) => setCommittee(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Executive Council">Executive Council</option>
                    <option value="Senior Student Leadership">Senior Student Leadership</option>
                    <option value="Organizing Committee">Organizing Committee</option>
                    <option value="All Committees">All Committees</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
