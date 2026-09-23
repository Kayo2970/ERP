'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  X,
  Trash2,
  CheckCircle,
  Clock,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import {
  getProcurementRequests,
  addProcurementRequest,
  decideProcurementRequest,
  updateProcurementRequest,
  deleteProcurementRequest,
  getEvents,
  getTasks,
  ProcurementRequestItem,
  ProcurementItemLine,
  EventItem,
  TaskItem,
} from '@/lib/local-data';
import { canDecideProcurementRequest, canViewProcurementRequest } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

function emptyLine(): ProcurementItemLine {
  return { name: '', quantity: 1, unit: '', notes: '' };
}

export default function ProcurementPage() {
  const [requests, setRequests] = useState<ProcurementRequestItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [user, setUser] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ProcurementRequestItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [linkType, setLinkType] = useState<'none' | 'event' | 'task'>('none');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [lines, setLines] = useState<ProcurementItemLine[]>([emptyLine()]);
  const [justification, setJustification] = useState('');

  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionAction, setDecisionAction] = useState<'Approved' | 'Rejected' | null>(null);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [hasScrolledToHighlight, setHasScrolledToHighlight] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const refreshData = () => {
      setRequests(getProcurementRequests());
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

    const params = new URLSearchParams(window.location.search);
    setHighlightId(params.get('highlight'));

    window.addEventListener('leads-data-sync', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('leads-data-sync', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  useEffect(() => {
    if (!highlightId || hasScrolledToHighlight) return;
    const el = document.getElementById(`procurement-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHasScrolledToHighlight(true);
    }
  }, [requests, highlightId, hasScrolledToHighlight]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const resetForm = () => {
    setLinkType('none');
    setSelectedEventId('');
    setSelectedTaskId('');
    setLines([emptyLine()]);
    setJustification('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingRequest(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (req: ProcurementRequestItem) => {
    setEditingRequest(req);
    setLinkType(req.eventId ? 'event' : req.taskId ? 'task' : 'none');
    setSelectedEventId(req.eventId || '');
    setSelectedTaskId(req.taskId || '');
    setLines(req.items.length > 0 ? req.items.map(i => ({ ...i })) : [emptyLine()]);
    setJustification(req.justification || '');
    setIsModalOpen(true);
  };

  const updateLine = (idx: number, updates: Partial<ProcurementItemLine>) => {
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...updates } : l)));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanLines = lines
      .map(l => ({ ...l, name: l.name.trim(), unit: l.unit?.trim() || undefined, notes: l.notes?.trim() || undefined }))
      .filter(l => l.name && l.quantity > 0);
    if (cleanLines.length === 0) return;

    const selectedEvent = events.find(e => e.id === selectedEventId);
    const selectedTask = tasks.find(t => t.id === selectedTaskId);

    if (editingRequest) {
      updateProcurementRequest(editingRequest.id, {
        eventId: linkType === 'event' ? selectedEventId : undefined,
        eventName: linkType === 'event' ? selectedEvent?.title : undefined,
        taskId: linkType === 'task' ? selectedTaskId : undefined,
        taskTitle: linkType === 'task' ? selectedTask?.title : undefined,
        items: cleanLines,
        justification: justification.trim() || undefined,
      }, user.name);
      triggerSuccess('Procurement request resubmitted for approval.');
    } else {
      addProcurementRequest({
        requesterId: user.id,
        requesterName: user.name,
        requesterEmail: user.email,
        eventId: linkType === 'event' ? selectedEventId : undefined,
        eventName: linkType === 'event' ? selectedEvent?.title : undefined,
        taskId: linkType === 'task' ? selectedTaskId : undefined,
        taskTitle: linkType === 'task' ? selectedTask?.title : undefined,
        items: cleanLines,
        justification: justification.trim() || undefined,
      });
      triggerSuccess('Procurement request submitted! The Centre Head and Advisor have been notified for approval.');
    }

    setIsModalOpen(false);
    setEditingRequest(null);
    setRequests(getProcurementRequests());
  };

  const handleOpenDecision = (id: string, action: 'Approved' | 'Rejected') => {
    setDecidingId(id);
    setDecisionAction(action);
    setDecisionNotes('');
  };

  const handleConfirmDecision = () => {
    if (!decidingId || !decisionAction || !user) return;
    decideProcurementRequest(decidingId, decisionAction, user.name, decisionNotes.trim() || undefined);
    setRequests(getProcurementRequests());
    triggerSuccess(decisionAction === 'Approved' ? 'Procurement request approved.' : 'Procurement request rejected.');
    setDecidingId(null);
    setDecisionAction(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingId || !user) return;
    deleteProcurementRequest(deletingId, user.name);
    setRequests(getProcurementRequests());
    setDeletingId(null);
    triggerSuccess('Procurement request deleted.');
  };

  const canDecide = canDecideProcurementRequest(user);
  const visibleRequests = requests.filter(r => canViewProcurementRequest(user, r));

  return (
    <div className="p-6 md:p-8 space-y-6">

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Procurement Requests</h1>
          <p className="text-xs text-theme-text-secondary">Request materials for an event or task — approved requests are visible to everyone once cleared by the Centre Head or Advisor.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      <div className="space-y-4">
        {visibleRequests.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No procurement requests"
            description="Request materials needed for an event or a task and get sign-off from the Centre Head or Advisor."
            actionLabel="New Request"
            onAction={handleOpenCreate}
          />
        ) : (
          visibleRequests.map((req) => {
            const isOwner = user && (req.requesterId === user.id || req.requesterEmail === user.email);
            return (
              <div
                key={req.id}
                id={`procurement-${req.id}`}
                className={`glass-panel rounded-2xl p-6 flex flex-col space-y-3 hover:bg-theme-border/10 transition-all border text-xs ${
                  req.id === highlightId ? 'border-accent ring-2 ring-accent/50' : 'border-theme-card-border/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2.5">
                    <h3 className="font-bold text-sm text-theme-text-primary flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-accent" />
                      {req.eventName || req.taskTitle || 'General Request'}
                    </h3>
                    {req.status === 'Pending' && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="h-3 w-3 animate-pulse" />
                        Pending Approval
                      </span>
                    )}
                    {req.status === 'Approved' && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Approved
                      </span>
                    )}
                    {req.status === 'Rejected' && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Rejected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-theme-text-secondary text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </span>
                    <span>by <strong className="text-theme-text-primary">{req.requesterName}</strong></span>
                  </div>
                </div>

                <div className="bg-theme-background/20 p-3 rounded-xl border border-theme-border/20 space-y-1.5">
                  {req.items.map((line, i) => (
                    <div key={i} className="flex items-center justify-between text-theme-text-secondary">
                      <span>{line.name}{line.notes ? ` — ${line.notes}` : ''}</span>
                      <span className="font-semibold text-theme-text-primary shrink-0 ml-2">{line.quantity} {line.unit || ''}</span>
                    </div>
                  ))}
                </div>

                {req.justification && (
                  <p className="text-xs text-theme-text-secondary italic">"{req.justification}"</p>
                )}

                {req.status === 'Approved' && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-[11px] text-emerald-400">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      <strong>Approved</strong> by <strong className="text-emerald-300">{req.decidedBy}</strong>
                      {req.decidedAt && ` on ${new Date(req.decidedAt).toLocaleDateString()}`}
                      {req.decisionNotes && ` — "${req.decisionNotes}"`}
                    </span>
                  </div>
                )}

                {req.status === 'Rejected' && (
                  <div className="flex items-center gap-2 p-2.5 bg-danger/10 border border-danger/25 rounded-xl text-[11px] text-danger">
                    <X className="h-4 w-4 shrink-0 text-danger" />
                    <span>
                      <strong>Rejected</strong> by <strong className="text-red-300">{req.decidedBy}</strong>
                      {req.decidedAt && ` on ${new Date(req.decidedAt).toLocaleDateString()}`}
                      {req.decisionNotes && ` — "${req.decisionNotes}"`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-theme-border/20">
                  <div className="flex items-center gap-2">
                    {canDecide && req.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleOpenDecision(req.id, 'Approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenDecision(req.id, 'Rejected')}
                          className="px-3 py-1.5 bg-danger hover:bg-danger/90 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                  {(isOwner || canDecide) && (
                    <div className="flex items-center gap-2">
                      {isOwner && req.status === 'Rejected' && (
                        <button
                          onClick={() => handleOpenEdit(req)}
                          className="px-2.5 py-1 hover:bg-theme-border/30 rounded text-theme-text-secondary hover:text-accent transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                        >
                          <ClipboardList className="h-3 w-3" /> Revise & Resubmit
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingId(req.id)}
                        className="p-1 hover:bg-danger/10 rounded text-danger transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">
                {editingRequest ? 'Revise Procurement Request' : 'New Procurement Request'}
              </h2>
              <button
                onClick={() => { setIsModalOpen(false); setEditingRequest(null); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Link To (optional)</label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as 'none' | 'event' | 'task')}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-semibold"
                >
                  <option value="none">Not linked to a specific event/task</option>
                  <option value="event">An Event</option>
                  <option value="task">A Task</option>
                </select>
              </div>

              {linkType === 'event' && (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Select Event *</label>
                  <select
                    required
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="">Select an event...</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}

              {linkType === 'task' && (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Select Task *</label>
                  <select
                    required
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="">Select a task...</option>
                    {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-theme-text-secondary">Materials Needed *</label>
                  <button type="button" onClick={addLine} className="text-accent hover:underline font-medium cursor-pointer flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {lines.map((line, idx) => (
                    <div key={idx} className="p-3 bg-theme-background/20 border border-theme-border/20 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={line.name}
                          onChange={(e) => updateLine(idx, { name: e.target.value })}
                          placeholder="Item name"
                          className="flex-1 px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                        />
                        <input
                          type="number"
                          required
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                          className="w-16 px-2 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                        />
                        <input
                          type="text"
                          value={line.unit || ''}
                          onChange={(e) => updateLine(idx, { unit: e.target.value })}
                          placeholder="Unit"
                          className="w-16 px-2 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                        />
                        {lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(idx)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={line.notes || ''}
                        onChange={(e) => updateLine(idx, { notes: e.target.value })}
                        placeholder="Notes (optional)"
                        className="w-full px-3 py-1.5 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Justification (optional)</label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Why are these items needed?"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                {editingRequest ? 'Resubmit for Approval' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decidingId && decisionAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-4 relative border border-white/15 shadow-2xl">
            <h2 className="text-base font-bold text-theme-text-primary">
              {decisionAction === 'Approved' ? 'Approve Request' : 'Reject Request'}
            </h2>
            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary text-xs">Notes (optional)</label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setDecidingId(null); setDecisionAction(null); }}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-theme-text-secondary hover:bg-theme-border/30 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all cursor-pointer ${
                  decisionAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-danger hover:bg-danger/90'
                }`}
              >
                Confirm {decisionAction === 'Approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Delete Procurement Request"
        message="Are you sure you want to delete this procurement request?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />

    </div>
  );
}
