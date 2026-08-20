'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  X,
  Calendar,
  MapPin,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Download,
  Upload,
  Clock,
  Check,
  Ban
} from 'lucide-react';
import { getEvents, addEvent, updateEvent, deleteEvent, approveEvent, rejectEvent, submitEventEdit, getTasks, getEffectiveEventStatus, EventItem, TaskItem } from '@/lib/local-data';
import { canCreateEvent, canEditEvent, canDeleteEvent, canManageEvents, canViewEvent, canApprovePendingEvent, getEventApprovalRequirement } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [rejectingEventId, setRejectingEventId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<EventItem['status']>('planned');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refreshData = () => {
      setEvents(getEvents());
      setTasks(getTasks());
    };
    refreshData();

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    window.addEventListener('leads-data-sync', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('leads-data-sync', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const VALID_STATUSES: EventItem['status'][] = ['planned', 'active', 'completed', 'archived'];

  const handleDownloadTemplate = () => {
    const csvContent = 'Title,Description,StartDate,EndDate,Location,Status\n' +
      'National Robotics Symposium 2026,Annual robotics and AI showcase,2026-09-10,2026-09-12,Auditorium 2,planned\n' +
      'Design Sprint Weekend,Two-day UI/UX design bootcamp,2026-10-01,2026-10-02,Design Lab,planned';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_events_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        if (lines.length < 2) {
          triggerError('CSV file is empty or missing headers.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const titleIndex = headers.indexOf('title');
        const descIndex = headers.indexOf('description');
        const startIndex = headers.indexOf('startdate');
        const endIndex = headers.indexOf('enddate');
        const locationIndex = headers.indexOf('location');
        const statusIndex = headers.indexOf('status');

        if (titleIndex === -1 || startIndex === -1 || endIndex === -1) {
          triggerError('Invalid CSV headers. Required at minimum: Title, StartDate, EndDate');
          return;
        }

        let importCount = 0;
        let skippedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
          if (values.length < 2) continue;

          const evTitle = values[titleIndex];
          const evStart = values[startIndex];
          const evEnd = values[endIndex];

          if (!evTitle || !evStart || !evEnd || isNaN(new Date(evStart).getTime()) || isNaN(new Date(evEnd).getTime())) {
            skippedCount++;
            continue;
          }
          if (new Date(evEnd) < new Date(evStart)) {
            skippedCount++;
            continue;
          }

          const rawStatus = statusIndex !== -1 ? values[statusIndex].toLowerCase() : 'planned';
          const evStatus = (VALID_STATUSES as string[]).includes(rawStatus) ? rawStatus as EventItem['status'] : 'planned';

          addEvent({
            title: evTitle,
            description: descIndex !== -1 ? values[descIndex] : '',
            startDate: evStart,
            endDate: evEnd,
            location: locationIndex !== -1 ? values[locationIndex] : '',
            status: evStatus,
            createdBy: user?.name || 'User',
            committees: [
              { id: 'c_' + Date.now() + '_' + i + '_1', name: 'Logistics & Venue Committee', memberIds: [] },
              { id: 'c_' + Date.now() + '_' + i + '_2', name: 'Technical & AV Committee', memberIds: [] },
              { id: 'c_' + Date.now() + '_' + i + '_3', name: 'Design & Media Committee', memberIds: [] }
            ]
          });
          importCount++;
        }

        if (importCount > 0) {
          setEvents(getEvents());
          triggerSuccess(`Successfully imported ${importCount} new event(s). ${skippedCount > 0 ? `(${skippedCount} invalid row(s) skipped)` : ''}`);
        } else {
          triggerError('No valid event rows found in the CSV — check that Title, StartDate, and EndDate are filled in and dates are valid.');
        }
      } catch (err) {
        triggerError('Error parsing CSV file. Please verify formatting.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setLocation('');
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
    setLocation(event.location || '');
    setStatus(event.status);
    setFormError('');
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !startDate || !endDate) {
      setFormError('Please fill in event title and active dates.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End Date must be on or after Start Date.');
      return;
    }

    if (editingEvent) {
      const changes = {
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
        location: location.trim(),
        status,
      };
      const approval = getEventApprovalRequirement(user, 'EDIT');
      if (approval.requiresApproval) {
        submitEventEdit(editingEvent.id, changes, user?.name || 'User', user?.email || '', {
          approverType: approval.approverType,
          approverMemberId: approval.approverMemberId,
          approverPolicyTagId: approval.approverPolicyTagId,
          policyName: approval.policyName,
        });
        triggerSuccess(`Edit submitted for approval from ${approval.approverName}. It will apply once approved.`);
      } else {
        updateEvent(editingEvent.id, changes, user?.name || 'User');
        triggerSuccess('Event details updated successfully.');
      }
      setEditingEvent(null);
    } else {
      const newEventBase = {
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
        location: location.trim(),
        status,
        createdBy: user?.name || 'User',
        committees: [
          { id: 'c_' + Date.now() + '_1', name: 'Logistics & Venue Committee', memberIds: [] },
          { id: 'c_' + Date.now() + '_2', name: 'Technical & AV Committee', memberIds: [] },
          { id: 'c_' + Date.now() + '_3', name: 'Design & Media Committee', memberIds: [] }
        ]
      };
      const approval = getEventApprovalRequirement(user, 'CREATE');
      if (approval.requiresApproval) {
        addEvent({
          ...newEventBase,
          approvalStatus: 'pending_create',
          approverType: approval.approverType,
          approverMemberId: approval.approverMemberId,
          approverPolicyTagId: approval.approverPolicyTagId,
          approvalPolicyName: approval.policyName,
          submittedBy: user?.name,
          submittedByEmail: user?.email,
        });
        triggerSuccess(`Event submitted for approval from ${approval.approverName}. It will go live once approved.`);
      } else {
        addEvent(newEventBase);
        triggerSuccess('New event created with its own directory and sub-committees.');
      }
      setIsCreateModalOpen(false);
    }

    setEvents(getEvents());
  };

  const handleApproveEvent = (id: string) => {
    approveEvent(id, user?.name || 'User');
    setEvents(getEvents());
    triggerSuccess('Approved. The change is now live.');
  };

  const handleConfirmReject = () => {
    if (!rejectingEventId) return;
    rejectEvent(rejectingEventId, user?.name || 'User', rejectionReasonInput || undefined);
    setEvents(getEvents());
    setRejectingEventId(null);
    setRejectionReasonInput('');
    triggerSuccess('Rejected.');
  };

  const handleConfirmDelete = () => {
    if (!deletingEventId) return;
    deleteEvent(deletingEventId, user?.name || 'User');
    setDeletingEventId(null);
    setEvents(getEvents());
    triggerSuccess('Event removed from system.');
  };

  const canManage = canManageEvents(user);
  const canCreate = canCreateEvent(user);

  const getStatusBadge = (eventStatus: EventItem['status']) => {
    switch (eventStatus) {
      case 'active':
        return 'bg-success/15 text-success border border-success/30';
      case 'planned':
        return 'bg-warning/15 text-warning border border-warning/30';
      case 'completed':
        return 'bg-primary/15 text-primary-light border border-primary/30';
      case 'archived':
        return 'bg-theme-border/30 text-theme-text-secondary';
    }
  };

  // Visibility: a pending/rejected submission is only shown to its submitter, its
  // resolved approver, and the Super User — everyone else sees nothing of it until
  // it's approved. Once approved (or for events created before this feature, which
  // carry no approvalStatus at all), the normal own/listed-vs-all rule from
  // canViewEvent applies.
  const canSeeApprovalMeta = (event: EventItem) =>
    user?.tier === 1 || event.submittedByEmail === user?.email || canApprovePendingEvent(event, user);

  const visibleEvents = events.filter(event => {
    if (event.approvalStatus === 'pending_create' || event.approvalStatus === 'rejected') {
      return canSeeApprovalMeta(event);
    }
    return canViewEvent(event, user);
  });

  // Upcoming/active events first (soonest start date first), then events whose end
  // date has already passed — those sort most-recently-ended first, and their
  // status badge shows "completed" even if it's still stored as "planned"/"active"
  // (nothing ever auto-transitioned it before), so the grid reads as a real
  // upcoming-vs-past view instead of an arbitrary jumble.
  const statusRank = (s: EventItem['status']) => (s === 'archived' ? 2 : s === 'completed' ? 1 : 0);
  const sortedEvents = [...visibleEvents].sort((a, b) => {
    const aStatus = getEffectiveEventStatus(a);
    const bStatus = getEffectiveEventStatus(b);
    const rankDiff = statusRank(aStatus) - statusRank(bStatus);
    if (rankDiff !== 0) return rankDiff;
    const aTime = new Date(a.startDate).getTime();
    const bTime = new Date(b.startDate).getTime();
    const isPast = aStatus === 'completed' || aStatus === 'archived';
    return isPast ? bTime - aTime : aTime - bTime;
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Alert Banner */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-danger/15 border border-danger/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <ShieldAlert className="h-5 w-5 text-danger shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Events & Milestone Operations</h1>
          <p className="text-xs text-theme-text-secondary">Manage symposiums, create event-specific sub-committees, and assign student teams</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer border border-theme-border/40"
              title="Download CSV Template"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>

            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer border border-theme-border/40"
              title="Upload Filled CSV File"
            >
              <Upload className="h-4 w-4" />
              Upload Events (CSV)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />

            {canCreate && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Create New Event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of Events Cards */}
      {visibleEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events scheduled"
          description="Create your first symposium, workshop, or conference milestone."
          actionLabel={canCreate ? "Create Event" : undefined}
          onAction={canCreate ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedEvents.map((event) => {
            const eventTasks = tasks.filter(t => t.eventId === event.id || t.event === event.title);
            const totalStudentsAssigned = Array.from(new Set((event.committees || []).flatMap(c => c.memberIds))).length;
            const effectiveStatus = getEffectiveEventStatus(event);
            const isPast = effectiveStatus === 'completed' || effectiveStatus === 'archived';

            return (
              <div
                key={event.id}
                className={`glass-panel rounded-3xl p-6 flex flex-col justify-between hover:bg-theme-border/10 transition-all border border-theme-card-border/50 group space-y-5 ${isPast ? 'opacity-70' : ''}`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${getStatusBadge(effectiveStatus)}`}>
                      {effectiveStatus}
                    </span>
                    <span className="text-[11px] text-accent font-semibold flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {(event.committees || []).length} Committees
                    </span>
                  </div>

                  {(event.approvalStatus === 'pending_create' || event.approvalStatus === 'pending_edit') && canSeeApprovalMeta(event) && (
                    <div className="flex items-center justify-between gap-2 p-2.5 bg-warning/10 border border-warning/25 rounded-xl text-[11px]">
                      <div className="flex items-center gap-1.5 text-warning font-semibold">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {event.approvalStatus === 'pending_edit' ? 'Edit awaiting approval' : 'Awaiting approval'}
                          {event.submittedBy ? ` from ${event.submittedBy === user?.name ? 'you' : event.submittedBy}` : ''}
                        </span>
                      </div>
                      {canApprovePendingEvent(event, user) && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleApproveEvent(event.id)}
                            className="p-1 hover:bg-success/15 rounded-md text-success cursor-pointer"
                            title="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setRejectingEventId(event.id)}
                            className="p-1 hover:bg-danger/15 rounded-md text-danger cursor-pointer"
                            title="Reject"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {event.approvalStatus === 'rejected' && canSeeApprovalMeta(event) && (
                    <div className="flex items-center gap-1.5 p-2.5 bg-danger/10 border border-danger/25 rounded-xl text-[11px] text-danger font-semibold">
                      <Ban className="h-3.5 w-3.5 shrink-0" />
                      <span>Rejected by {event.decidedBy || 'approver'}{event.rejectionReason ? `: ${event.rejectionReason}` : ''}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Link 
                      href={`/dashboard/events/${event.id}`}
                      className="font-bold text-base text-theme-text-primary hover:text-accent transition-colors leading-snug block"
                    >
                      {event.title}
                    </Link>
                    <p className="text-xs text-theme-text-secondary line-clamp-2 leading-relaxed">
                      {event.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-theme-text-secondary pt-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                      <span>{event.startDate} &mdash; {event.endDate}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <MapPin className="h-3.5 w-3.5 text-warning" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-theme-border/20 pt-4 flex items-center justify-between text-xs">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-primary-light transition-all"
                  >
                    <span>Event Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  {(canEditEvent(user) || canDeleteEvent(user)) && (
                    <div className="flex items-center gap-1">
                      {canEditEvent(user) && (
                        <button
                          onClick={() => handleOpenEdit(event)}
                          className="p-1.5 hover:bg-theme-border/30 rounded-lg transition-all text-theme-text-secondary hover:text-accent cursor-pointer"
                          title="Edit Event Settings"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDeleteEvent(user) && (
                        <button
                          onClick={() => setDeletingEventId(event.id)}
                          className="p-1.5 hover:bg-danger/10 rounded-lg transition-all text-danger cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
                  placeholder="e.g. National Robotics Symposium 2026"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Venue / Campus Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Auditorium 2 / Robotics Lab Complex"
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

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Event Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventItem['status'])}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active / In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Description / Objectives</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key targets, attendee capacity, and schedule..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                {editingEvent ? 'Save Event Updates' : 'Create Event & Initialize Sub-Committees'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingEventId)}
        title="Delete Event"
        message="Are you sure you want to delete this event? All sub-committees and linked event deliverables will be removed."
        confirmLabel="Delete Event"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingEventId(null)}
      />

      {/* Reject Pending Approval Modal */}
      {rejectingEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-4 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
                <Ban className="h-4.5 w-4.5 text-danger" />
                Reject Submission
              </h2>
              <button
                onClick={() => { setRejectingEventId(null); setRejectionReasonInput(''); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="block font-medium text-theme-text-secondary">Reason (optional)</label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
                placeholder="Let the submitter know why this was rejected..."
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <button
              onClick={handleConfirmReject}
              className="w-full py-3 bg-danger hover:bg-danger/90 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
