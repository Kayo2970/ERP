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
} from 'lucide-react';
import {
  getBudgets,
  addBudget,
  decideBudget,
  getEvents,
  getReimbursements,
  BudgetItem,
  BudgetLineItem,
  EventItem,
  ReimbursementItem,
} from '@/lib/local-data';
import { isCentreHead, isFinanceHead } from '@/lib/permissions';
import { EmptyState } from '@/components/ui/empty-state';

export default function BudgetPage() {
  const [user, setUser] = useState<any>(null);
  const [userHydrated, setUserHydrated] = useState(false);

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetType, setBudgetType] = useState<'event' | 'monthly'>('event');
  const [eventId, setEventId] = useState('');
  const [month, setMonth] = useState('');
  const [amount, setAmount] = useState('');
  // A monthly budget is proposed as a set of planned events with their own
  // cost, which must sum to the monthly total — not one blind figure.
  const [monthlyLineItems, setMonthlyLineItems] = useState<{ eventId: string; eventName: string; amount: string }[]>([
    { eventId: '', eventName: '', amount: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const [decidingBudget, setDecidingBudget] = useState<BudgetItem | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');

  const [toastMsg, setToastMsg] = useState('');

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

  const handleSubmitBudget = (e: React.FormEvent) => {
    e.preventDefault();

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
      addBudget({
        type: 'event',
        eventId,
        eventName: selectedEvent?.title,
        amount: amountNum,
        notes: notes.trim() || undefined,
        submittedBy: user?.name || 'Centre Head',
        submittedByEmail: user?.email,
      });
    } else {
      if (!month) {
        setFormError('Select a month for this budget request.');
        return;
      }
      const cleanedLineItems: BudgetLineItem[] = monthlyLineItems
        .filter(row => row.eventName.trim() && Number(row.amount) > 0)
        .map(row => ({
          eventId: row.eventId || undefined,
          eventName: row.eventName.trim(),
          amount: Number(row.amount),
        }));
      if (cleanedLineItems.length === 0) {
        setFormError('Add at least one planned event with a cost.');
        return;
      }
      const total = cleanedLineItems.reduce((sum, li) => sum + li.amount, 0);
      addBudget({
        type: 'monthly',
        month,
        amount: total,
        lineItems: cleanedLineItems,
        notes: notes.trim() || undefined,
        submittedBy: user?.name || 'Centre Head',
        submittedByEmail: user?.email,
      });
    }

    setBudgets(getBudgets());
    setIsModalOpen(false);
    resetForm();
    triggerToast('Budget request submitted to the Finance Head.');
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

  const pendingCount = visibleBudgets.filter(b => b.status === 'Pending').length;

  const statusBadge = (status: BudgetItem['status']) => {
    if (status === 'Approved') return 'bg-success/15 text-success border border-success/20';
    if (status === 'Rejected') return 'bg-danger/15 text-danger border border-danger/20';
    return 'bg-warning/15 text-warning border border-warning/20';
  };

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
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-theme-text-primary">
          {canDecide ? `Budget Requests (${visibleBudgets.length})` : `My Budget Requests (${visibleBudgets.length})`}
          {pendingCount > 0 && (
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20">
              {pendingCount} pending
            </span>
          )}
        </h3>

        {visibleBudgets.length === 0 ? (
          <div className="text-center py-10 text-theme-text-secondary text-xs bg-theme-border/5 rounded-xl border border-theme-border/20">
            No budget requests {canDecide ? 'submitted yet' : 'submitted by you yet'}.
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleBudgets.map(b => (
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
                {canDecide && b.status === 'Pending' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setDecidingBudget(b)}
                      className="flex-1 py-1.5 bg-accent hover:bg-primary-light text-white font-semibold text-[11px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      Review Request
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">Request Budget</h2>
              <button
                onClick={() => setIsModalOpen(false)}
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
                        <select
                          value={row.eventId}
                          onChange={e => {
                            const ev = events.find(ev2 => ev2.id === e.target.value);
                            updateLineItemRow(index, { eventId: e.target.value, eventName: ev ? ev.title : row.eventName });
                          }}
                          className="w-28 shrink-0 px-2 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary text-[11px] focus:outline-none focus:border-accent"
                        >
                          <option value="">Not yet created</option>
                          {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={row.eventName}
                          onChange={e => updateLineItemRow(index, { eventName: e.target.value })}
                          placeholder="Event name"
                          disabled={!!row.eventId}
                          className="flex-1 min-w-0 px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent disabled:opacity-60"
                        />
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
                Submit to Finance Head
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
    </div>
  );
}
