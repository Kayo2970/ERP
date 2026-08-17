'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, Briefcase, Eye, Edit2, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getEvents, addEvent, updateEvent, deleteEvent, getCommittees, getTasks, EventItem, TaskItem } from '@/lib/local-data';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [committees, setCommittees] = useState<string[]>([]);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [viewingEvent, setViewingEvent] = useState<EventItem | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [committee, setCommittee] = useState('Senior Student Leadership');
  const [status, setStatus] = useState<EventItem['status']>('planned');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setEvents(getEvents());
    setTasks(getTasks());
    setCommittees(getCommittees());
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setCommittee(committees[0] || 'Senior Student Leadership');
    setStatus('planned');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (event: EventItem) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setStartDate(event.startDate);
    setEndDate(event.endDate);
    setCommittee(event.committee);
    setStatus(event.status);
    setFormError('');
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title || !startDate || !endDate) {
      setFormError('Please fill in all required fields.');
      return;
    }

    // Validate End Date >= Start Date
    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End Date must be on or after Start Date.');
      return;
    }

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        title,
        description,
        startDate,
        endDate,
        committee,
        status,
      }, user?.name || 'User');
      triggerSuccess('Event updated successfully.');
      setEditingEvent(null);
    } else {
      addEvent({
        title,
        description,
        startDate,
        endDate,
        committee,
        status,
        createdBy: user?.name || 'User'
      });
      triggerSuccess('New event created successfully.');
      setIsCreateModalOpen(false);
    }

    setEvents(getEvents());
  };

  const handleConfirmDelete = () => {
    if (!deletingEventId) return;
    deleteEvent(deletingEventId, user?.name || 'User');
    setDeletingEventId(null);
    setEvents(getEvents());
    triggerSuccess('Event deleted successfully.');
  };

  // Check if current user has admin rights to create/edit events (Tiers 1-3 & 5)
  const canManage = user && (user.tier <= 3 || user.tier === 5);

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

  const linkedTasks = viewingEvent 
    ? tasks.filter(t => t.eventId === viewingEvent.id || (t.event && t.event.toLowerCase() === viewingEvent.title.toLowerCase()))
    : [];

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Events Calendar & Management</h1>
          <p className="text-xs text-theme-text-secondary">Plan symposiums, track milestones, and audit committee deliverables</p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Grid of Events Card */}
      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events scheduled"
          description="Create your first symposium, workshop, or conference milestone."
          actionLabel={canManage ? "Create Event" : undefined}
          onAction={canManage ? handleOpenCreate : undefined}
        />
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
                  <span className="text-[11px] font-medium">{event.startDate} &middot; {event.endDate}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setViewingEvent(event)}
                    className="p-1.5 hover:bg-theme-border/30 rounded-lg transition-all text-theme-text-primary flex items-center gap-1 cursor-pointer"
                    title="View Event Details"
                  >
                    <Eye className="h-4 w-4 text-accent" />
                  </button>
                  
                  {canManage && (
                    <>
                      <button 
                        onClick={() => handleOpenEdit(event)}
                        className="p-1.5 hover:bg-theme-border/30 rounded-lg transition-all text-theme-text-primary flex items-center gap-1 cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit2 className="h-4 w-4 text-theme-text-secondary hover:text-accent" />
                      </button>
                      <button 
                        onClick={() => setDeletingEventId(event.id)}
                        className="p-1.5 hover:bg-danger/10 rounded-lg transition-all text-danger flex items-center gap-1 cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {(isCreateModalOpen || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">
                {editingEvent ? 'Edit Event Details' : 'Create New Event'}
              </h2>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingEvent(null);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Tech Symposium 2026"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context on speakers, topics, venue, and goals..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">End Date *</label>
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
                    <option value="All Committees">All Committees</option>
                    {committees.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EventItem['status'])}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                {editingEvent ? 'Save Event Updates' : 'Publish Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Drawer / Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${getStatusBadge(viewingEvent.status)}`}>
                  {viewingEvent.status}
                </span>
                <h2 className="text-lg font-bold text-theme-text-primary mt-2">{viewingEvent.title}</h2>
              </div>
              <button 
                onClick={() => setViewingEvent(null)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-theme-background/30 p-4 rounded-xl border border-theme-border/30 space-y-2">
                <p className="text-theme-text-secondary leading-relaxed">
                  {viewingEvent.description || 'No detailed description recorded.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-theme-border/20 text-[11px]">
                  <div>
                    <span className="text-theme-text-secondary block">Date Range:</span>
                    <strong className="text-theme-text-primary">{viewingEvent.startDate} &middot; {viewingEvent.endDate}</strong>
                  </div>
                  <div>
                    <span className="text-theme-text-secondary block">Committee Unit:</span>
                    <strong className="text-theme-text-primary">{viewingEvent.committee}</strong>
                  </div>
                </div>
              </div>

              {/* Linked Tasks Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-theme-text-primary uppercase tracking-wider">
                  Linked Deliverables & Tasks ({linkedTasks.length})
                </h4>
                {linkedTasks.length === 0 ? (
                  <p className="text-xs text-theme-text-secondary italic">No tasks linked to this event yet.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {linkedTasks.map(t => (
                      <div key={t.id} className="p-2.5 bg-theme-border/10 rounded-lg border border-theme-border/20 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium text-theme-text-primary">{t.title}</p>
                          <p className="text-[10px] text-theme-text-secondary">Assignee: {t.assignee} &middot; Due: {t.dueDate}</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">{t.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingEvent(null)}
                className="px-4 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingEventId)}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action will permanently remove it from the schedule and audit trail."
        confirmLabel="Delete Event"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingEventId(null)}
      />

    </div>
  );
}
