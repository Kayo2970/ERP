'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  TrendingDown,
  PiggyBank,
  ShieldAlert,
  Landmark,
  ArrowRight,
  Edit2,
  Eye,
  EyeOff,
  CalendarPlus,
} from 'lucide-react';
import {
  getBudgets,
  addBudget,
  updateBudget,
  decideBudget,
  getEvents,
  addEvent,
  getReimbursements,
  BudgetItem,
  BudgetLineItem,
  EventItem,
  ReimbursementItem,
} from '@/lib/local-data';
import { isCentreHead, isFinanceHead, getEventApprovalRequirement } from '@/lib/permissions';
import { EmptyState } from '@/components/ui/empty-state';

export default function BudgetPage() {
  const [user, setUser] = useState<any>(null);
  const [userHydrated, setUserHydrated] = useState(false);

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [budgetType, setBudgetType] = useState<'event' | 'monthly'>('event');
  const [eventId, setEventId] = useState('');
  const [month, setMonth] = useState('');
  const [amount, setAmount] = useState('');
  // A monthly budget is proposed as a set of planned events with their own
  // cost, which must sum to the monthly total — not one blind figure. Each
  // row must point at a real EventItem (existing or newly created inline),
  // never a free-typed label.
  const [monthlyLineItems, setMonthlyLineItems] = useState<{ eventId: string; eventName: string; amount: string }[]>([
    { eventId: '', eventName: '', amount: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const [decidingBudget, setDecidingBudget] = useState<BudgetItem | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  // Rejected requests are hidden by default — only Approved (and Pending,
  // since those need action) show without opting in.
  const [showRejected, setShowRejected] = useState(false);

  // Inline "create a new event on the spot" for a monthly line item — a
  // real EventItem gets created (synced with the Events module & Calendar
  // like any other event), not a free-text label.
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [newEventLineItemIndex, setNewEventLineItemIndex] = useState<number | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCampus, setNewEventCampus] = useState<'GG Campus' | 'RTC Campus' | 'Both Campuses'>('GG Campus');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDatesTBD, setNewEventDatesTBD] = useState(true);
  const [newEventStartDate, setNewEventStartDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventError, setNewEventError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    const refresh = () => {
      setBudgets(getBudgets());
      setEvents(getEvents());
      setReimbursements(getReimbursements());
    };
    refresh();
    setUserHydrated(true);

    window.addEventListener('leads-data-sync', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('leads-data-sync', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const canSubmit = isCentreHead(user);
  const canDecide = isFinanceHead(user);

  const resetForm = () => {
    setBudgetType('event');
    setEventId('');
    setMonth('');
    setAmount('');
    setMonthlyLineItems([{ eventId: '', eventName: '', amount: '' }]);
    setNotes('');
    setFormError('');
  };

  const openModal = () => {
    resetForm();
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: BudgetItem) => {
    setEditingBudget(b);
    setBudgetType(b.type);
    setEventId(b.eventId || '');
    setMonth(b.month || '');
    setAmount(b.type === 'event' ? String(b.amount) : '');
    setMonthlyLineItems(
      b.lineItems && b.lineItems.length > 0
        ? b.lineItems.map(li => ({ eventId: li.eventId || '', eventName: li.eventName, amount: String(li.amount) }))
        : [{ eventId: '', eventName: '', amount: '' }]
    );
    setNotes(b.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const addLineItemRow = () => {
    setMonthlyLineItems(rows => [...rows, { eventId: '', eventName: '', amount: '' }]);
  };
  const removeLineItemRow = (index: number) => {
    setMonthlyLineItems(rows => rows.filter((_, i) => i !== index));
  };
  const updateLineItemRow = (index: number, patch: Partial<{ eventId: string; eventName: string; amount: string }>) => {
    setMonthlyLineItems(rows => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const monthlyTotal = monthlyLineItems.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const openCreateEventModal = (lineItemIndex: number) => {
    setNewEventLineItemIndex(lineItemIndex);
    setNewEventTitle('');
    setNewEventCampus('GG Campus');
    setNewEventLocation('');
    setNewEventDatesTBD(true);
    setNewEventStartDate('');
    setNewEventEndDate('');
    setNewEventError('');
    setIsCreateEventModalOpen(true);
  };

  // Creates a real EventItem — the exact same way the Events module itself
  // does (default sub-committees, the same approval-requirement check) — so
  // it's a fully live event on the Calendar/Events module immediately, not
  // a free-text label that only means something inside this budget request.
  const handleCreateEventForLineItem = (e: React.FormEvent) => {
    e.preventDefault();
    setNewEventError('');

    if (!newEventTitle.trim()) {
      setNewEventError('Enter an event title.');
      return;
    }
    if (!newEventDatesTBD && (!newEventStartDate || !newEventEndDate)) {
      setNewEventError('Enter both dates, or mark dates as To Be Decided.');
      return;
    }
    if (!newEventDatesTBD && new Date(newEventEndDate) < new Date(newEventStartDate)) {
      setNewEventError('End Date must be on or after Start Date.');
      return;
    }

    const newEventBase = {
      title: newEventTitle.trim(),
      description: '',
      startDate: newEventDatesTBD ? '' : newEventStartDate,
      endDate: newEventDatesTBD ? '' : newEventEndDate,
      datesTBD: newEventDatesTBD,
      location: newEventLocation.trim(),
      campus: newEventCampus,
      status: 'planned' as EventItem['status'],
      createdBy: user?.name || 'User',
      committees: [
        { id: 'c_' + Date.now() + '_1', name: 'Logistics & Venue Committee', memberIds: [] },
        { id: 'c_' + Date.now() + '_2', name: 'Technical & AV Committee', memberIds: [] },
        { id: 'c_' + Date.now() + '_3', name: 'Design & Media Committee', memberIds: [] }
      ]
    };

    const approval = getEventApprovalRequirement(user, 'CREATE');
    const created = approval.requiresApproval
      ? addEvent({
          ...newEventBase,
          approvalStatus: 'pending_create',
          approverType: approval.approverType,
          approverMemberId: approval.approverMemberId,
          approverPolicyTagId: approval.approverPolicyTagId,
          approvalPolicyName: approval.policyName,
          submittedBy: user?.name,
          submittedByEmail: user?.email,
        })
      : addEvent(newEventBase);

    setEvents(getEvents());
    if (newEventLineItemIndex !== null) {
      updateLineItemRow(newEventLineItemIndex, { eventId: created.id, eventName: created.title });
    }
    setIsCreateEventModalOpen(false);
    triggerToast(
      approval.requiresApproval
        ? `Event submitted for approval from ${approval.approverName}. It will go live once approved.`
        : 'New event created and linked to this line item.'
    );
  };

  const handleSubmitBudget = (e: React.FormEvent) => {
    e.preventDefault();

    let payload: Partial<BudgetItem>;

    if (budgetType === 'event') {
      const amountNum = Number(amount);
      if (!amountNum || amountNum <= 0) {
        setFormError('Enter a valid budget amount.');
        return;
      }
      if (!eventId) {
        setFormError('Select an event for this budget request.');
        return;
      }
      const selectedEvent = events.find(ev => ev.id === eventId);
      payload = {
        type: 'event',
        eventId,
        eventName: selectedEvent?.title,
        month: undefined,
        lineItems: undefined,
        amount: amountNum,
        notes: notes.trim() || undefined,
      };
    } else {
      if (!month) {
        setFormError('Select a month for this budget request.');
        return;
      }
      const cleanedLineItems: BudgetLineItem[] = monthlyLineItems
        .filter(row => row.eventId && Number(row.amount) > 0)
        .map(row => ({
          eventId: row.eventId,
          eventName: row.eventName,
          amount: Number(row.amount),
        }));
      if (cleanedLineItems.length === 0) {
        setFormError('Add at least one planned event with a cost — pick an existing event or create a new one.');
        return;
      }
      const total = cleanedLineItems.reduce((sum, li) => sum + li.amount, 0);
      payload = {
        type: 'monthly',
        eventId: undefined,
        eventName: undefined,
        month,
        amount: total,
        lineItems: cleanedLineItems,
        notes: notes.trim() || undefined,
      };
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, payload, user?.name || 'Centre Head');
    } else {
      addBudget({
        ...(payload as Omit<BudgetItem, 'id' | 'status' | 'submittedAt'>),
        submittedBy: user?.name || 'Centre Head',
        submittedByEmail: user?.email,
      });
    }

    setBudgets(getBudgets());
    setIsModalOpen(false);
    setEditingBudget(null);
    resetForm();
    triggerToast(
      editingBudget
        ? (editingBudget.status === 'Approved'
            ? 'Budget request updated — sent back to the Finance Head for re-approval.'
            : 'Budget request updated.')
        : 'Budget request submitted to the Finance Head.'
    );
  };

  const handleDecide = (status: 'Approved' | 'Rejected') => {
    if (!decidingBudget) return;
    decideBudget(decidingBudget.id, status, user?.name || 'Finance Head', decisionNotes.trim() || undefined);
    setBudgets(getBudgets());
    setDecidingBudget(null);
    setDecisionNotes('');
    triggerToast(`Budget request ${status.toLowerCase()}.`);
  };

  if (!userHydrated) return null;

  if (!canSubmit && !canDecide) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted"
          description="The Budget module is available to the Centre Head (submitting requests) and Finance Head (reviewing and tracking funds) only."
        />
      </div>
    );
  }

  // Fund Overview (Finance Head only): every Approved budget is money made
  // available; every Approved reimbursement is money actually spent. The
  // difference is a plain running balance — unspent budget automatically
  // "carries forward" simply because nothing here ever resets per period.
  const totalApprovedBudget = budgets.filter(b => b.status === 'Approved').reduce((s, b) => s + b.amount, 0);
  const totalExpenses = reimbursements.filter(r => r.status === 'Approved').reduce((s, r) => s + r.amount, 0);
  const availableBalance = totalApprovedBudget - totalExpenses;

  const eventBudgetIds = new Set<string>([
    ...budgets.filter(b => b.type === 'event' && b.eventId).map(b => b.eventId as string),
    ...reimbursements.filter(r => r.eventId).map(r => r.eventId as string),
  ]);
  const eventBreakdown = Array.from(eventBudgetIds).map(id => {
    const ev = events.find(e => e.id === id);
    const budgetForEvent = budgets.find(b => b.eventId === id);
    const allocated = budgets.filter(b => b.eventId === id && b.status === 'Approved').reduce((s, b) => s + b.amount, 0);
    const spent = reimbursements.filter(r => r.eventId === id && r.status === 'Approved').reduce((s, r) => s + r.amount, 0);
    return {
      id,
      name: ev?.title || budgetForEvent?.eventName || 'Unknown Event',
      allocated,
      spent,
      remaining: allocated - spent,
    };
  }).sort((a, b) => b.allocated - a.allocated);

  const visibleBudgets = canDecide
    ? budgets
    : budgets.filter(b => (user?.email && b.submittedByEmail === user.email) || b.submittedBy === user?.name);

  const pendingBudgets = visibleBudgets.filter(b => b.status === 'Pending');
  const approvedBudgets = visibleBudgets.filter(b => b.status === 'Approved');
  const rejectedBudgets = visibleBudgets.filter(b => b.status === 'Rejected');
  const pendingCount = pendingBudgets.length;

  const isOwnBudget = (b: BudgetItem) => (user?.email && b.submittedByEmail === user.email) || b.submittedBy === user?.name;

  const statusBadge = (status: BudgetItem['status']) => {
    if (status === 'Approved') return 'bg-success/15 text-success border border-success/20';
    if (status === 'Rejected') return 'bg-danger/15 text-danger border border-danger/20';
    return 'bg-warning/15 text-warning border border-warning/20';
  };

  const renderBudgetCard = (b: BudgetItem) => (
    <div key={b.id} className="p-4 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-bold text-theme-text-primary">
            {b.type === 'event' ? (b.eventName || 'Event') : `Monthly — ${b.month}`}
          </span>
          <p className="text-[11px] text-theme-text-secondary">
            Submitted by {b.submittedBy} on {b.submittedAt}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusBadge(b.status)}`}>
          {b.status}
        </span>
      </div>
      <p className="text-sm font-bold text-accent">₹{b.amount.toLocaleString()}</p>
      {b.lineItems && b.lineItems.length > 0 && (
        <ul className="pl-1 space-y-0.5 border-l-2 border-theme-border/30">
          {b.lineItems.map((li, i) => (
            <li key={i} className="pl-2 flex items-center justify-between text-[11px] text-theme-text-secondary">
              <span>{li.eventName}</span>
              <span className="font-mono">₹{li.amount.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
      {b.notes && <p className="text-[11px] text-theme-text-secondary italic">"{b.notes}"</p>}
      {b.decidedBy && (
        <p className="text-[10px] text-theme-text-secondary">
          Decision by {b.decidedBy} on {b.decidedAt}{b.decisionNotes ? ` — "${b.decisionNotes}"` : ''}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        {canDecide && b.status === 'Pending' && (
          <button
            onClick={() => setDecidingBudget(b)}
            className="flex-1 py-1.5 bg-accent hover:bg-primary-light text-white font-semibold text-[11px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            Review Request
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        {canSubmit && isOwnBudget(b) && (
          <button
            onClick={() => openEditModal(b)}
            title={b.status === 'Approved' ? 'Editing this will send it back to the Finance Head for re-approval' : 'Edit request'}
            className="flex-1 py-1.5 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold text-[11px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <Edit2 className="h-3 w-3" />
            {b.status === 'Approved' ? 'Edit (Needs Re-approval)' : 'Edit Request'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary flex items-center gap-2">
            <Wallet className="h-5 w-5 text-accent" />
            Budget & Funds
          </h1>
          <p className="text-xs text-theme-text-secondary">
            {canDecide
              ? 'Review event and monthly budget requests, and track available funds.'
              : 'Submit event or monthly budget requests to the Finance Head for approval.'}
          </p>
        </div>
        {canSubmit && (
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Request Budget
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Fund Overview — Finance Head only */}
      {canDecide && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel rounded-2xl p-5 space-y-1">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-theme-text-secondary uppercase tracking-wider">
              <Landmark className="h-3.5 w-3.5" />
              Total Budget Approved
            </span>
            <p className="text-xl font-bold text-theme-text-primary">₹{totalApprovedBudget.toLocaleString()}</p>
          </div>
          <div className="glass-panel rounded-2xl p-5 space-y-1">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-theme-text-secondary uppercase tracking-wider">
              <TrendingDown className="h-3.5 w-3.5" />
              Total Expenses
            </span>
            <p className="text-xl font-bold text-danger">₹{totalExpenses.toLocaleString()}</p>
          </div>
          <div className="glass-panel rounded-2xl p-5 space-y-1 border border-accent/30">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-theme-text-secondary uppercase tracking-wider">
              <PiggyBank className="h-3.5 w-3.5" />
              Available Balance (Carry Forward)
            </span>
            <p className={`text-xl font-bold ${availableBalance >= 0 ? 'text-success' : 'text-danger'}`}>
              ₹{availableBalance.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Event-wise budget vs actual spend — Finance Head only */}
      {canDecide && eventBreakdown.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-theme-text-primary">Event-wise Budget vs Spend</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="text-theme-text-secondary border-b border-theme-border/40">
                  <th className="pb-2.5 font-semibold">Event</th>
                  <th className="pb-2.5 font-semibold">Allocated</th>
                  <th className="pb-2.5 font-semibold">Spent</th>
                  <th className="pb-2.5 font-semibold">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {eventBreakdown.map(row => (
                  <tr key={row.id}>
                    <td className="py-2.5 font-semibold text-theme-text-primary">{row.name}</td>
                    <td className="py-2.5 text-theme-text-secondary">₹{row.allocated.toLocaleString()}</td>
                    <td className="py-2.5 text-theme-text-secondary">₹{row.spent.toLocaleString()}</td>
                    <td className={`py-2.5 font-semibold ${row.remaining >= 0 ? 'text-success' : 'text-danger'}`}>
                      ₹{row.remaining.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget Requests */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-theme-text-primary">
            {canDecide ? 'Budget Requests' : 'My Budget Requests'}
            {pendingCount > 0 && (
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20">
                {pendingCount} pending
              </span>
            )}
          </h3>
          {rejectedBudgets.length > 0 && (
            <button
              onClick={() => setShowRejected(v => !v)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
            >
              {showRejected ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showRejected ? 'Hide' : 'Show'} Rejected ({rejectedBudgets.length})
            </button>
          )}
        </div>

        {visibleBudgets.length === 0 ? (
          <div className="text-center py-10 text-theme-text-secondary text-xs bg-theme-border/5 rounded-xl border border-theme-border/20">
            No budget requests {canDecide ? 'submitted yet' : 'submitted by you yet'}.
          </div>
        ) : (
          <>
            {pendingBudgets.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-warning">Pending Review</h4>
                <div className="space-y-2.5">{pendingBudgets.map(renderBudgetCard)}</div>
              </div>
            )}

            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-success">Approved</h4>
              {approvedBudgets.length === 0 ? (
                <div className="text-center py-6 text-theme-text-secondary text-xs bg-theme-border/5 rounded-xl border border-theme-border/20">
                  No approved budgets yet.
                </div>
              ) : (
                <div className="space-y-2.5">{approvedBudgets.map(renderBudgetCard)}</div>
              )}
            </div>

            {showRejected && rejectedBudgets.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-danger">Rejected</h4>
                <div className="space-y-2.5">{rejectedBudgets.map(renderBudgetCard)}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">
                {editingBudget ? 'Edit Budget Request' : 'Request Budget'}
              </h2>
              <button
                onClick={() => { setIsModalOpen(false); setEditingBudget(null); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editingBudget?.status === 'Approved' && (
              <div className="p-3 bg-warning/10 border border-warning/25 rounded-xl text-warning text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>This request was already Approved. Saving changes sends it back to the Finance Head for re-approval.</span>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBudget} className="space-y-4 text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-theme-text-primary">
                  <input type="radio" checked={budgetType === 'event'} onChange={() => setBudgetType('event')} className="text-accent focus:ring-accent" />
                  Event-wise
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-theme-text-primary">
                  <input type="radio" checked={budgetType === 'monthly'} onChange={() => setBudgetType('monthly')} className="text-accent focus:ring-accent" />
                  Monthly
                </label>
              </div>

              {budgetType === 'event' ? (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Event *</label>
                  <select
                    value={eventId}
                    onChange={e => setEventId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="">-- Select Event --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Month *</label>
                  <input
                    type="month"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {budgetType === 'event' ? (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Amount Requested (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-medium text-theme-text-secondary">Planned Events & Costs *</label>
                    <button
                      type="button"
                      onClick={addLineItemRow}
                      className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Add Event
                    </button>
                  </div>
                  <div className="space-y-2">
                    {monthlyLineItems.map((row, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        {row.eventId ? (
                          <button
                            type="button"
                            onClick={() => updateLineItemRow(index, { eventId: '', eventName: '' })}
                            title="Click to change the linked event"
                            className="flex-1 min-w-0 px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary truncate text-left cursor-pointer hover:border-accent"
                          >
                            {row.eventName}
                          </button>
                        ) : (
                          <select
                            value=""
                            onChange={e => {
                              const ev = events.find(ev2 => ev2.id === e.target.value);
                              if (ev) updateLineItemRow(index, { eventId: ev.id, eventName: ev.title });
                            }}
                            className="flex-1 min-w-0 px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                          >
                            <option value="">-- Select Event --</option>
                            {events.map(ev => (
                              <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() => openCreateEventModal(index)}
                          title="Create a new event for this line item"
                          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-all cursor-pointer"
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={row.amount}
                          onChange={e => updateLineItemRow(index, { amount: e.target.value })}
                          placeholder="₹"
                          className="w-24 shrink-0 px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                        />
                        <button
                          type="button"
                          onClick={() => removeLineItemRow(index)}
                          disabled={monthlyLineItems.length === 1}
                          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-danger transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-theme-text-secondary">
                    Pick an existing event, or tap <CalendarPlus className="h-2.5 w-2.5 inline" /> to create a new one on the spot — it's added to the Events module and Calendar immediately.
                  </p>
                  <div className="flex items-center justify-between pt-1.5 border-t border-theme-border/20">
                    <span className="font-semibold text-theme-text-secondary">Monthly Total</span>
                    <span className="text-sm font-bold text-accent">₹{monthlyTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Notes / Justification</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="What this budget will cover..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-2"
              >
                {editingBudget
                  ? (editingBudget.status === 'Approved' ? 'Save & Send for Re-approval' : 'Save Changes')
                  : 'Submit to Finance Head'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review (Approve / Reject) Modal */}
      {decidingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">Review Budget Request</h2>
              <button
                onClick={() => { setDecidingBudget(null); setDecisionNotes(''); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 p-3.5 bg-theme-background/30 border border-theme-border/20 rounded-xl">
              <p className="font-bold text-theme-text-primary">
                {decidingBudget.type === 'event' ? decidingBudget.eventName : `Monthly — ${decidingBudget.month}`}
              </p>
              <p className="text-theme-text-secondary">Requested by {decidingBudget.submittedBy}</p>
              <p className="text-accent font-bold text-sm">₹{decidingBudget.amount.toLocaleString()}</p>
              {decidingBudget.lineItems && decidingBudget.lineItems.length > 0 && (
                <ul className="pl-1 space-y-0.5 border-l-2 border-theme-border/30">
                  {decidingBudget.lineItems.map((li, i) => (
                    <li key={i} className="pl-2 flex items-center justify-between text-theme-text-secondary">
                      <span>{li.eventName}</span>
                      <span className="font-mono">₹{li.amount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
              {decidingBudget.notes && <p className="text-theme-text-secondary italic">"{decidingBudget.notes}"</p>}
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-medium text-theme-text-secondary">Decision Notes (optional)</label>
              <textarea
                value={decisionNotes}
                onChange={e => setDecisionNotes(e.target.value)}
                placeholder="Any remarks for the record..."
                rows={2}
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDecide('Rejected')}
                className="flex-1 py-2.5 bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={() => handleDecide('Approved')}
                className="flex-1 py-2.5 bg-success hover:bg-success/90 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal — for a monthly line item, opened over the Request Budget modal */}
      {isCreateEventModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col space-y-4 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-theme-text-primary flex items-center gap-1.5">
                <CalendarPlus className="h-4 w-4 text-accent" />
                Create New Event
              </h2>
              <button
                onClick={() => setIsCreateEventModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {newEventError && (
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{newEventError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEventForLineItem} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Event Title *</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Freshers Orientation"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Campus</label>
                  <select
                    value={newEventCampus}
                    onChange={e => setNewEventCampus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="GG Campus">GG Campus</option>
                    <option value="RTC Campus">RTC Campus</option>
                    <option value="Both Campuses">Both Campuses</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Location</label>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={e => setNewEventLocation(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-theme-text-primary">
                <input
                  type="checkbox"
                  checked={newEventDatesTBD}
                  onChange={e => setNewEventDatesTBD(e.target.checked)}
                  className="accent-accent"
                />
                Dates To Be Decided
              </label>

              {!newEventDatesTBD && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block font-medium text-theme-text-secondary">Start Date *</label>
                    <input
                      type="date"
                      value={newEventStartDate}
                      onChange={e => setNewEventStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-medium text-theme-text-secondary">End Date *</label>
                    <input
                      type="date"
                      value={newEventEndDate}
                      onChange={e => setNewEventEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}

              <p className="text-[10px] text-theme-text-secondary">
                This creates a real event in the Events module and Calendar, with its own default sub-committees, immediately.
              </p>

              <button
                type="submit"
                className="w-full py-2.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-1"
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
