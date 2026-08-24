'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  ShieldAlert,
  Landmark,
  ArrowRight,
  Edit2,
  Eye,
  CalendarPlus,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  FileSpreadsheet,
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

const ACADEMIC_YEARS = ['2025-2026', '2026-2027', '2027-2028'];

const MONTH_NAMES = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
];

const CATEGORY_OPTIONS = [
  'Event', 'Operational', 'Equipment', 'Marketing', 'Logistics', 'Other'
];

export default function BudgetPage() {
  const [user, setUser] = useState<any>(null);
  const [userHydrated, setUserHydrated] = useState(false);

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>([]);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(0); // 0 = April (Start of Academic Year)

  // Annual Budget Proposal Modal
  const [isAnnualModalOpen, setIsAnnualModalOpen] = useState(false);
  const [annualAmountInput, setAnnualAmountInput] = useState('');
  const [annualNotesInput, setAnnualNotesInput] = useState('');

  // Monthly Budget Breakdown Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [budgetType, setBudgetType] = useState<'annual' | 'monthly' | 'event'>('monthly');
  const [eventId, setEventId] = useState('');
  const [month, setMonth] = useState('');
  const [amount, setAmount] = useState('');
  const [monthlyLineItems, setMonthlyLineItems] = useState<{
    eventId: string;
    eventName: string;
    category: string;
    amount: string;
  }[]>([
    { eventId: '', eventName: '', category: 'Event', amount: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Decision Modal
  const [decidingBudget, setDecidingBudget] = useState<BudgetItem | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  const [showRejected, setShowRejected] = useState(false);

  // On-The-Spot Event Creation Modal inside Budget Module
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

  // Annual Academic Year Budget Calculation
  const annualBudgetItem = budgets.find(
    (b) => b.type === 'annual' && (b.academicYear === selectedAcademicYear || !b.academicYear)
  );

  const annualApprovedAmount = annualBudgetItem && annualBudgetItem.status === 'Approved'
    ? (annualBudgetItem.amount || annualBudgetItem.proposedAmount || 0)
    : 0;

  const annualProposedAmount = annualBudgetItem
    ? (annualBudgetItem.amount || annualBudgetItem.proposedAmount || 0)
    : 0;

  // Monthly Allocations & Actual Reimbursement Expenses
  const getMonthKey = (mIdx: number) => {
    const yearStart = parseInt(selectedAcademicYear.split('-')[0], 10);
    const year = mIdx < 9 ? yearStart : yearStart + 1; // April(0) to Dec(8) = yearStart, Jan(9) to Mar(11) = yearStart + 1
    const monthNum = mIdx < 9 ? mIdx + 4 : mIdx - 8;
    return `${year}-${String(monthNum).padStart(2, '0')}`;
  };

  // Compute monthly calculations for all 12 months
  const monthlyCalculations = MONTH_NAMES.map((mName, mIdx) => {
    const mKey = getMonthKey(mIdx);

    // Find monthly budgets matching this month key
    const monthBudgets = budgets.filter((b) => b.type === 'monthly' && b.month === mKey);
    const approvedMonthBudgets = monthBudgets.filter((b) => b.status === 'Approved');

    // Proposed allocation
    const proposed = monthBudgets.reduce((sum, b) => sum + (b.amount || b.proposedAmount || 0), 0);

    // Actual spending calculated from approved reimbursements matching this month
    const monthReimbursements = reimbursements.filter((r) => {
      if (r.status !== 'Approved') return false;
      const rDate = r.submittedAt || '';
      return rDate.startsWith(mKey);
    });
    const actual = monthReimbursements.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const variance = proposed - actual;

    return {
      monthName: mName,
      monthKey: mKey,
      proposed,
      actual,
      variance,
      budgets: monthBudgets,
    };
  });

  const totalAllocatedToMonths = monthlyCalculations.reduce((sum, m) => sum + m.proposed, 0);
  const totalActualSpent = monthlyCalculations.reduce((sum, m) => sum + m.actual, 0);
  const totalAnnualVariance = (annualApprovedAmount || annualProposedAmount) - totalActualSpent;

  // Currently Selected Month Calculation
  const selectedMonthCalc = selectedMonthIndex !== null ? monthlyCalculations[selectedMonthIndex] : null;

  // Handlers for Annual Budget
  const handleProposeAnnualBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(annualAmountInput);
    if (!val || val <= 0) return;

    if (annualBudgetItem) {
      updateBudget(
        annualBudgetItem.id,
        {
          type: 'annual',
          academicYear: selectedAcademicYear,
          amount: val,
          proposedAmount: val,
          notes: annualNotesInput,
          submittedBy: user?.name || 'Centre Head',
          submittedByEmail: user?.email,
        },
        user?.name || 'Centre Head'
      );
      triggerToast(`Annual budget proposal updated for ${selectedAcademicYear}. Sent to Finance Head.`);
    } else {
      addBudget({
        type: 'annual',
        academicYear: selectedAcademicYear,
        amount: val,
        proposedAmount: val,
        notes: annualNotesInput,
        submittedBy: user?.name || 'Centre Head',
        submittedByEmail: user?.email,
      });
      triggerToast(`Annual budget proposed for ${selectedAcademicYear}. Sent to Finance Head.`);
    }

    setIsAnnualModalOpen(false);
    setAnnualAmountInput('');
    setAnnualNotesInput('');
    setBudgets(getBudgets());
  };

  const handleDecideAnnualBudget = (status: 'Approved' | 'Rejected') => {
    if (!annualBudgetItem) return;
    decideBudget(annualBudgetItem.id, status, user?.name || 'Finance Head', decisionNotes);
    triggerToast(`Annual Academic Year Budget ${status.toLowerCase()} successfully.`);
    setDecidingBudget(null);
    setDecisionNotes('');
    setBudgets(getBudgets());
  };

  // Handlers for Monthly Line Items & Breakdown
  const resetForm = () => {
    setBudgetType('monthly');
    setEventId('');
    setMonth(selectedMonthCalc ? selectedMonthCalc.monthKey : getMonthKey(0));
    setAmount('');
    setMonthlyLineItems([{ eventId: '', eventName: '', category: 'Event', amount: '' }]);
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
    setMonth(b.month || (selectedMonthCalc ? selectedMonthCalc.monthKey : getMonthKey(0)));
    setAmount(String(b.amount || b.proposedAmount || ''));
    setMonthlyLineItems(
      b.lineItems && b.lineItems.length > 0
        ? b.lineItems.map((li) => ({
            eventId: li.eventId || '',
            eventName: li.eventName,
            category: li.category || 'Event',
            amount: String(li.amount || li.proposedAmount || ''),
          }))
        : [{ eventId: '', eventName: '', category: 'Event', amount: '' }]
    );
    setNotes(b.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const addLineItemRow = () => {
    setMonthlyLineItems((rows) => [...rows, { eventId: '', eventName: '', category: 'Event', amount: '' }]);
  };

  const removeLineItemRow = (index: number) => {
    setMonthlyLineItems((rows) => rows.filter((_, i) => i !== index));
  };

  const updateLineItemRow = (
    index: number,
    patch: Partial<{ eventId: string; eventName: string; category: string; amount: string }>
  ) => {
    setMonthlyLineItems((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const monthlyTotal = monthlyLineItems.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  // On-the-spot event creation inside budget module
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
        { id: 'c_' + Date.now() + '_3', name: 'Design & Media Committee', memberIds: [] },
      ],
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
      updateLineItemRow(newEventLineItemIndex, {
        eventId: created.id,
        eventName: created.title,
      });
    }

    setIsCreateEventModalOpen(false);
    triggerToast(`Event "${created.title}" created on the spot and linked to budget line item.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedLines: BudgetLineItem[] = [];
    for (const r of monthlyLineItems) {
      const nameClean = r.eventName.trim();
      const val = Number(r.amount);
      if (!nameClean) {
        setFormError('Every item in the breakdown needs a title.');
        return;
      }
      if (!val || val <= 0) {
        setFormError(`Item "${nameClean}" needs an amount > 0.`);
        return;
      }
      parsedLines.push({
        eventId: r.eventId || undefined,
        eventName: nameClean,
        category: r.category || 'Event',
        amount: val,
        proposedAmount: val,
      });
    }

    const payload = {
      academicYear: selectedAcademicYear,
      type: 'monthly' as const,
      month: month || (selectedMonthCalc ? selectedMonthCalc.monthKey : getMonthKey(0)),
      amount: monthlyTotal,
      proposedAmount: monthlyTotal,
      lineItems: parsedLines,
      notes: notes.trim(),
      submittedBy: user?.name || 'Centre Head',
      submittedByEmail: user?.email,
    };

    if (editingBudget) {
      updateBudget(editingBudget.id, payload, user?.name || 'Centre Head');
      triggerToast('Monthly budget allocation updated successfully.');
    } else {
      addBudget(payload);
      triggerToast('Monthly budget breakdown submitted successfully.');
    }

    setIsModalOpen(false);
    setBudgets(getBudgets());
  };

  const handleDecision = (status: 'Approved' | 'Rejected') => {
    if (!decidingBudget) return;
    decideBudget(decidingBudget.id, status, user?.name || 'Finance Head', decisionNotes);
    triggerToast(`Budget request ${status.toLowerCase()} successfully.`);
    setDecidingBudget(null);
    setDecisionNotes('');
    setBudgets(getBudgets());
  };

  // Max value for SVG bar chart scaling
  const maxBarValue = Math.max(
    ...monthlyCalculations.map((m) => Math.max(m.proposed, m.actual)),
    100000
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-white font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 text-xs">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-theme-text-primary tracking-tight">
              Financial & Budgeting Control Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 text-[10px] font-extrabold uppercase tracking-wider">
              {selectedAcademicYear}
            </span>
          </div>
          <p className="text-xs text-theme-text-secondary mt-1">
            Academic Year Budgeting, Monthly Allocations, Event Tracking & Visual Analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Academic Year Picker */}
          <div className="flex items-center gap-1 bg-theme-card border border-theme-card-border p-1 rounded-xl">
            {ACADEMIC_YEARS.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedAcademicYear(year)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedAcademicYear === year
                    ? 'bg-accent text-white shadow-md'
                    : 'text-theme-text-secondary hover:text-theme-text-primary'
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          {canSubmit && (
            <button
              onClick={() => {
                setAnnualAmountInput(String(annualApprovedAmount || annualProposedAmount || ''));
                setAnnualNotesInput(annualBudgetItem?.notes || '');
                setIsAnnualModalOpen(true);
              }}
              className="px-4 py-2.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-accent/20 cursor-pointer shrink-0"
            >
              <Landmark className="h-4 w-4" />
              Propose / Edit Annual Budget
            </button>
          )}
        </div>
      </div>

      {/* Top Academic Year Status & Financial Overview Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-theme-card-border space-y-4 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-theme-border/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-theme-text-primary">
                  Academic Year {selectedAcademicYear} Annual Budget
                </h2>
                {annualBudgetItem ? (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      annualBudgetItem.status === 'Approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : annualBudgetItem.status === 'Rejected'
                        ? 'bg-danger/15 text-danger border-danger/30'
                        : 'bg-warning/15 text-warning border-warning/30'
                    }`}
                  >
                    {annualBudgetItem.status === 'Approved' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : annualBudgetItem.status === 'Rejected' ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3 animate-pulse" />
                    )}
                    {annualBudgetItem.status === 'Approved'
                      ? 'Approved by Finance Head'
                      : annualBudgetItem.status === 'Rejected'
                      ? 'Rejected'
                      : 'Pending Finance Head Approval'}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-theme-border/30 text-theme-text-secondary border border-theme-border/40">
                    Not Proposed Yet
                  </span>
                )}
              </div>
              <p className="text-xs text-theme-text-secondary mt-0.5">
                Total Academic Year Allocation approved by Finance Head
              </p>
            </div>
          </div>

          {/* Finance Head Approval Action */}
          {canDecide && annualBudgetItem && annualBudgetItem.status === 'Pending' && (
            <div className="flex items-center gap-2 shrink-0 bg-warning/10 border border-warning/30 p-2 rounded-xl">
              <span className="text-xs text-warning font-semibold">Annual Budget Action:</span>
              <button
                onClick={() => handleDecideAnnualBudget('Approved')}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve Annual Budget
              </button>
              <button
                onClick={() => setDecidingBudget(annualBudgetItem)}
                className="px-3 py-1.5 bg-danger hover:bg-red-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-md cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}
        </div>

        {/* 4 Financial Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-theme-background/50 border border-theme-card-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-theme-text-secondary uppercase tracking-wider block">
              Annual Approved Budget
            </span>
            <div className="text-lg font-extrabold text-accent">
              ₹{annualApprovedAmount > 0 ? annualApprovedAmount.toLocaleString() : (annualProposedAmount > 0 ? `${annualProposedAmount.toLocaleString()} (Pending)` : '0')}
            </div>
            <span className="text-[10px] text-theme-text-secondary">Approved for {selectedAcademicYear}</span>
          </div>

          <div className="bg-theme-background/50 border border-theme-card-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-theme-text-secondary uppercase tracking-wider block">
              Allocated to Months
            </span>
            <div className="text-lg font-extrabold text-theme-text-primary">
              ₹{totalAllocatedToMonths.toLocaleString()}
            </div>
            <span className="text-[10px] text-theme-text-secondary">Sum of monthly line items</span>
          </div>

          <div className="bg-theme-background/50 border border-theme-card-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-theme-text-secondary uppercase tracking-wider block">
              Realized Actual Spent
            </span>
            <div className="text-lg font-extrabold text-emerald-400">
              ₹{totalActualSpent.toLocaleString()}
            </div>
            <span className="text-[10px] text-theme-text-secondary">Approved reimbursements</span>
          </div>

          <div className="bg-theme-background/50 border border-theme-card-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-theme-text-secondary uppercase tracking-wider block">
              Net Annual Savings / Variance
            </span>
            <div className={`text-lg font-extrabold ${totalAnnualVariance >= 0 ? 'text-emerald-400' : 'text-danger'}`}>
              {totalAnnualVariance >= 0 ? `+₹${totalAnnualVariance.toLocaleString()}` : `-₹${Math.abs(totalAnnualVariance).toLocaleString()}`}
            </div>
            <span className="text-[10px] text-theme-text-secondary">
              {totalAnnualVariance >= 0 ? 'Under budget (Savings)' : 'Over budget warning'}
            </span>
          </div>
        </div>
      </div>

      {/* Graphical Visual Analytics Dashboard (SVG Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Chart 1: 12-Month Proposed vs Actual Bar Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-theme-card-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-bold text-theme-text-primary">
                12-Month Financial Breakdown (Proposed vs Actual)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-theme-text-secondary">
                <span className="h-3 w-3 rounded-sm bg-accent inline-block" /> Proposed Target
              </span>
              <span className="flex items-center gap-1 text-theme-text-secondary">
                <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" /> Actual Spent
              </span>
            </div>
          </div>

          {/* Interactive SVG Bar Chart */}
          <div className="h-56 w-full pt-4">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 600 180">
              {/* Baseline */}
              <line x1="30" y1="150" x2="590" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

              {monthlyCalculations.map((m, idx) => {
                const x = 40 + idx * 45;
                const propHeight = Math.min((m.proposed / maxBarValue) * 120, 120);
                const actHeight = Math.min((m.actual / maxBarValue) * 120, 120);

                const isSelected = selectedMonthIndex === idx;

                return (
                  <g key={m.monthKey} className="cursor-pointer" onClick={() => setSelectedMonthIndex(idx)}>
                    {/* Background selection highlight */}
                    {isSelected && (
                      <rect x={x - 6} y="10" width="38" height="150" fill="rgba(46,117,182,0.15)" rx="6" />
                    )}

                    {/* Proposed Bar (Accent) */}
                    <rect
                      x={x}
                      y={150 - propHeight}
                      width="12"
                      height={Math.max(propHeight, 2)}
                      fill="#2E75B6"
                      rx="3"
                      className="transition-all hover:opacity-80"
                    />

                    {/* Actual Bar (Emerald/Red) */}
                    <rect
                      x={x + 14}
                      y={150 - actHeight}
                      width="12"
                      height={Math.max(actHeight, 2)}
                      fill={m.actual > m.proposed && m.proposed > 0 ? '#EF4444' : '#10B981'}
                      rx="3"
                      className="transition-all hover:opacity-80"
                    />

                    {/* Month Label */}
                    <text
                      x={x + 13}
                      y="168"
                      fontSize="9"
                      fill={isSelected ? '#38BDF8' : 'rgba(255,255,255,0.6)'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {m.monthName.substring(0, 3)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* SVG Chart 2: Annual Utilization Ring / Donut Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-theme-card-border space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-accent" />
            <h3 className="text-sm font-bold text-theme-text-primary">Annual Budget Utilization</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-2 relative">
            <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={annualApprovedAmount > 0 && totalActualSpent > annualApprovedAmount ? '#EF4444' : '#10B981'}
                strokeWidth="12"
                strokeDasharray={251.2}
                strokeDashoffset={
                  annualApprovedAmount > 0
                    ? 251.2 - (Math.min(totalActualSpent / annualApprovedAmount, 1) * 251.2)
                    : 251.2
                }
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold text-theme-text-primary">
                {annualApprovedAmount > 0 ? `${Math.round((totalActualSpent / annualApprovedAmount) * 100)}%` : '0%'}
              </span>
              <span className="text-[10px] text-theme-text-secondary uppercase font-semibold">Spent of Total</span>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-theme-border/30 pt-3">
            <div className="flex justify-between">
              <span className="text-theme-text-secondary">Approved Budget:</span>
              <span className="font-bold text-theme-text-primary">₹{annualApprovedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-text-secondary">Total Realized Spent:</span>
              <span className="font-bold text-emerald-400">₹{totalActualSpent.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Month-Wise Calendar Breakdown Bar & Month Selector */}
      <div className="glass-panel rounded-2xl p-5 border border-theme-card-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-accent" />
            <h3 className="text-sm font-bold text-theme-text-primary">
              Month-Wise Calendar Breakdown ({selectedAcademicYear})
            </h3>
          </div>

          {canSubmit && (
            <div className="flex items-center gap-2">
              <button
                onClick={openModal}
                className="px-3.5 py-2 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add / Breakdown Monthly Budget
              </button>
            </div>
          )}
        </div>

        {/* 12-Month Calendar Month Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
          {monthlyCalculations.map((m, idx) => {
            const isSelected = selectedMonthIndex === idx;
            const hasVarianceAlert = m.actual > m.proposed && m.proposed > 0;

            return (
              <button
                key={m.monthKey}
                onClick={() => setSelectedMonthIndex(idx)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex flex-col items-center min-w-[80px] border ${
                  isSelected
                    ? 'bg-accent text-white border-accent shadow-md'
                    : 'bg-theme-background/30 text-theme-text-secondary border-theme-card-border hover:bg-theme-border/20 hover:text-theme-text-primary'
                }`}
              >
                <span>{m.monthName}</span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : hasVarianceAlert ? 'text-danger font-bold' : 'text-emerald-400'}`}>
                  ₹{m.proposed > 0 ? (m.proposed / 1000).toFixed(0) + 'k' : '0'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Month Detail Cards & Line Items */}
        {selectedMonthCalc && (
          <div className="space-y-4 bg-theme-background/30 border border-theme-card-border p-4 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border/30 pb-3">
              <div>
                <h4 className="text-sm font-bold text-theme-text-primary flex items-center gap-2">
                  <span>{selectedMonthCalc.monthName} Financial Summary</span>
                  <span className="text-xs font-mono text-theme-text-secondary">({selectedMonthCalc.monthKey})</span>
                </h4>
              </div>

              {/* Monthly Triple Metrics: Proposed, Actual, Variance */}
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-theme-text-secondary block text-[10px]">Proposed Target:</span>
                  <span className="font-bold text-accent">₹{selectedMonthCalc.proposed.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-theme-text-secondary block text-[10px]">Actual Spent:</span>
                  <span className="font-bold text-emerald-400">₹{selectedMonthCalc.actual.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-theme-text-secondary block text-[10px]">Variance / Forecast:</span>
                  <span className={`font-bold ${selectedMonthCalc.variance >= 0 ? 'text-emerald-400' : 'text-danger'}`}>
                    {selectedMonthCalc.variance >= 0 ? `+₹${selectedMonthCalc.variance.toLocaleString()}` : `-₹${Math.abs(selectedMonthCalc.variance).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Line Items Breakdown Table */}
            {selectedMonthCalc.budgets.length === 0 ? (
              <EmptyState
                icon={FileSpreadsheet}
                title={`No budget breakdown submitted for ${selectedMonthCalc.monthName}`}
                description="Click 'Add / Breakdown Monthly Budget' above to allocate target costs across events & categories."
              />
            ) : (
              <div className="space-y-4">
                {selectedMonthCalc.budgets.map((b) => (
                  <div key={b.id} className="bg-theme-card border border-theme-card-border p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-theme-text-primary">
                          {b.submittedBy} ({b.submittedAt})
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            b.status === 'Approved'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : b.status === 'Rejected'
                              ? 'bg-danger/15 text-danger border-danger/30'
                              : 'bg-warning/15 text-warning border-warning/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {canSubmit && (
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1 text-theme-text-secondary hover:text-accent rounded transition-all cursor-pointer"
                            title="Edit Breakdown"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canDecide && b.status === 'Pending' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                decideBudget(b.id, 'Approved', user?.name || 'Finance Head');
                                triggerToast('Budget request approved.');
                                setBudgets(getBudgets());
                              }}
                              className="px-2 py-1 bg-emerald-500 text-white font-bold rounded text-[11px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setDecidingBudget(b)}
                              className="px-2 py-1 bg-danger text-white font-bold rounded text-[11px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {b.lineItems && b.lineItems.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-theme-border/30 text-theme-text-secondary text-[11px]">
                              <th className="py-1.5 font-semibold">Event / Line Item Title</th>
                              <th className="py-1.5 font-semibold">Category</th>
                              <th className="py-1.5 font-semibold text-right">Proposed Budget</th>
                              <th className="py-1.5 font-semibold text-right">Actual Spent</th>
                              <th className="py-1.5 font-semibold text-right">Variance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border/20">
                            {b.lineItems.map((li, liIdx) => {
                              const liActual = li.eventId
                                ? reimbursements
                                    .filter((r) => r.eventId === li.eventId && r.status === 'Approved')
                                    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
                                : 0;
                              const liVariance = (li.amount || li.proposedAmount || 0) - liActual;

                              return (
                                <tr key={liIdx}>
                                  <td className="py-2 font-medium text-theme-text-primary">
                                    {li.eventName}
                                    {li.eventId && (
                                      <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-accent/15 text-accent border border-accent/30 font-semibold">
                                        Linked Event
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 text-theme-text-secondary">{li.category || 'Event'}</td>
                                  <td className="py-2 text-right font-bold text-accent">
                                    ₹{(li.amount || li.proposedAmount || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2 text-right font-bold text-emerald-400">
                                    ₹{liActual.toLocaleString()}
                                  </td>
                                  <td
                                    className={`py-2 text-right font-bold ${
                                      liVariance >= 0 ? 'text-emerald-400' : 'text-danger'
                                    }`}
                                  >
                                    {liVariance >= 0
                                      ? `+₹${liVariance.toLocaleString()}`
                                      : `-₹${Math.abs(liVariance).toLocaleString()}`}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Propose Annual Budget Modal */}
      {isAnnualModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme-card-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAnnualModalOpen(false)}
              className="absolute top-4 right-4 text-theme-text-secondary hover:text-theme-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-theme-text-primary">
              Propose Academic Year Budget ({selectedAcademicYear})
            </h2>
            <form onSubmit={handleProposeAnnualBudget} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">
                  Total Annual Budget Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={annualAmountInput}
                  onChange={(e) => setAnnualAmountInput(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Notes / Justification</label>
                <textarea
                  rows={3}
                  value={annualNotesInput}
                  onChange={(e) => setAnnualNotesInput(e.target.value)}
                  placeholder="Provide context or key goals for this academic year..."
                  className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnualModalOpen(false)}
                  className="px-4 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl text-xs shadow-md shadow-accent/20 cursor-pointer"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Line Items Breakdown Modal with On-The-Spot Event Creation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme-card-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-theme-text-secondary hover:text-theme-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-theme-text-primary">
              {editingBudget ? 'Edit Monthly Budget Breakdown' : 'Submit Monthly Budget Breakdown'}
            </h2>

            {formError && (
              <div className="p-3 bg-danger/10 border border-danger/25 text-danger rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Academic Year</label>
                  <input
                    type="text"
                    disabled
                    value={selectedAcademicYear}
                    className="w-full px-4 py-2 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Target Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-4 py-2 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    {MONTH_NAMES.map((mName, mIdx) => {
                      const mKey = getMonthKey(mIdx);
                      return (
                        <option key={mKey} value={mKey}>
                          {mName} ({mKey})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Monthly Line Items Breakdown Table */}
              <div className="space-y-3 border-t border-theme-border/30 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-theme-text-primary">Line Items Breakdown</span>
                  <span className="text-accent font-extrabold text-sm">Total: ₹{monthlyTotal.toLocaleString()}</span>
                </div>

                {monthlyLineItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-theme-background/40 p-3 rounded-xl border border-theme-card-border">
                    <div className="flex-1 space-y-1">
                      <select
                        value={item.eventId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'CREATE_NEW') {
                            openCreateEventModal(idx);
                          } else if (val) {
                            const found = events.find((ev) => ev.id === val);
                            updateLineItemRow(idx, {
                              eventId: val,
                              eventName: found ? found.title : item.eventName,
                            });
                          } else {
                            updateLineItemRow(idx, { eventId: '' });
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-theme-card border border-theme-card-border rounded-lg text-theme-text-primary text-xs"
                      >
                        <option value="">-- Select Existing Event --</option>
                        <option value="CREATE_NEW">✨ + Create New Event On The Spot...</option>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} ({ev.campus})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={item.eventName}
                        onChange={(e) => updateLineItemRow(idx, { eventName: e.target.value })}
                        placeholder="Item Title (e.g. Stage Setup / Marketing)"
                        className="w-full px-3 py-1.5 bg-theme-card border border-theme-card-border rounded-lg text-theme-text-primary text-xs"
                      />
                    </div>

                    <div className="w-28">
                      <select
                        value={item.category}
                        onChange={(e) => updateLineItemRow(idx, { category: e.target.value })}
                        className="w-full px-3 py-1.5 bg-theme-card border border-theme-card-border rounded-lg text-theme-text-primary text-xs"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        min={1}
                        value={item.amount}
                        onChange={(e) => updateLineItemRow(idx, { amount: e.target.value })}
                        placeholder="Amount (₹)"
                        className="w-full px-3 py-1.5 bg-theme-card border border-theme-card-border rounded-lg text-theme-text-primary text-xs font-mono"
                      />
                    </div>

                    {monthlyLineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItemRow(idx)}
                        className="p-1.5 text-danger hover:bg-danger/10 rounded-lg cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLineItemRow}
                  className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline cursor-pointer pt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> + Add Another Item Line
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Notes / Justification</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for Finance Head..."
                  className="w-full px-4 py-2 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl text-xs shadow-md shadow-accent/20 cursor-pointer"
                >
                  Submit Monthly Breakdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* On-The-Spot Event Creation Modal */}
      {isCreateEventModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme-card-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsCreateEventModalOpen(false)}
              className="absolute top-4 right-4 text-theme-text-secondary hover:text-theme-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="text-base font-bold text-theme-text-primary">Create Event On The Spot</h3>
            </div>
            <p className="text-xs text-theme-text-secondary">
              Creates a live event in the Events Module & Calendar immediately and links its budget line item.
            </p>

            {newEventError && (
              <div className="p-3 bg-danger/10 border border-danger/25 text-danger rounded-xl text-xs">
                {newEventError}
              </div>
            )}

            <form onSubmit={handleCreateEventForLineItem} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Annual Design Summit 2026"
                  className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Campus</label>
                  <select
                    value={newEventCampus}
                    onChange={(e) => setNewEventCampus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
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
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="e.g. Main Auditorium"
                    className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEventDatesTBD}
                    onChange={(e) => setNewEventDatesTBD(e.target.checked)}
                    className="rounded border-theme-card-border text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-theme-text-primary font-medium">Dates To Be Decided (TBD)</span>
                </label>

                {!newEventDatesTBD && (
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[11px] text-theme-text-secondary">Start Date</label>
                      <input
                        type="date"
                        value={newEventStartDate}
                        onChange={(e) => setNewEventStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] text-theme-text-secondary">End Date</label>
                      <input
                        type="date"
                        value={newEventEndDate}
                        onChange={(e) => setNewEventEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-theme-border/30">
                <button
                  type="button"
                  onClick={() => setIsCreateEventModalOpen(false)}
                  className="px-4 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl text-xs shadow-md shadow-accent/20 cursor-pointer"
                >
                  Create & Link Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decidingBudget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme-card-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setDecidingBudget(null)}
              className="absolute top-4 right-4 text-theme-text-secondary hover:text-theme-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-theme-text-primary">
              Reject Budget Request
            </h2>
            <p className="text-xs text-theme-text-secondary">
              Provide feedback or instructions for the Centre Head regarding this rejection.
            </p>
            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Decision Notes</label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Reason for rejection or requested changes..."
                className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecidingBudget(null)}
                className="px-4 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecision('Rejected')}
                className="px-5 py-2 bg-danger hover:bg-red-600 text-white font-semibold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
