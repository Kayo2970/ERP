'use client';

import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Check, 
  X, 
  Download, 
  FileText, 
  Plus, 
  ShieldAlert, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Filter,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { 
  getReimbursements, 
  addReimbursement, 
  updateReimbursementStatus, 
  deleteReimbursement,
  getEvents,
  ReimbursementItem,
  EventItem
} from '@/lib/local-data';
import { maskBankDetails } from '@/lib/design-tokens';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [user, setUser] = useState<any>(null);

  // Form State (Collaborator Claims)
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Printing & Stationary');
  const [description, setDescription] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');

  // Filtering & Event Chart Modal State
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartEventId, setChartEventId] = useState<string>('ALL');

  // Modals & previews
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; title: string } | null>(null);
  const [revealedBankIds, setRevealedBankIds] = useState<Record<string, boolean>>({});
  const [deletingClaimId, setDeletingClaimId] = useState<string | null>(null);

  // Notification Alert State
  const [alertMsg, setAlertMsg] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const refreshData = () => {
      setReimbursements(getReimbursements());
      setEvents(getEvents());
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
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setReceiptDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid positive reimbursement amount.');
      return;
    }

    if (!description || !bankDetails || !user) {
      setFormError('Please fill in all mandatory expense details.');
      return;
    }

    const selectedEv = events.find(ev => ev.id === selectedEventId);

    addReimbursement({
      memberName: user.name,
      memberEmail: user.email,
      amount: parsedAmount,
      category,
      description,
      receiptUrl: receiptFileName || 'receipt.pdf',
      receiptData: receiptDataUrl || undefined,
      bankDetails,
      eventId: selectedEventId || undefined,
      eventName: selectedEv ? selectedEv.title : undefined
    });

    // Reset Form
    setAmount('');
    setDescription('');
    setBankDetails('');
    setSelectedEventId('');
    setReceiptDataUrl('');
    setReceiptFileName('');
    setFormError('');

    // Refresh & Notify
    setReimbursements(getReimbursements());
    triggerSuccess(`Reimbursement claim ${selectedEv ? `attached to "${selectedEv.title}"` : ''} submitted successfully for review.`);
  };

  // Two-Stage Approval Handlers
  const handleCoreFirstPass = (id: string, approve: boolean) => {
    if (approve) {
      updateReimbursementStatus(id, 'Under Review', { name: user.name, stage: 'firstPass', tier: user.tier });
      triggerSuccess('First-pass review complete: Recommended for Centre Head sign-off.');
    } else {
      updateReimbursementStatus(id, 'Denied', { name: user.name, stage: 'firstPass', tier: user.tier });
      triggerSuccess('Claim denied during Core Committee first-pass review.');
    }
    setReimbursements(getReimbursements());
  };

  const handleFinalApproval = (id: string, approve: boolean) => {
    if (approve) {
      updateReimbursementStatus(id, 'Approved', { name: user.name, stage: 'final', tier: user.tier });
      triggerSuccess('Final Centre Head approval granted. Ready for payment disbursement.');
    } else {
      updateReimbursementStatus(id, 'Denied', { name: user.name, stage: 'final', tier: user.tier });
      triggerSuccess('Claim denied by leadership.');
    }
    setReimbursements(getReimbursements());
  };

  const toggleBankReveal = (id: string) => {
    setRevealedBankIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadCsv = () => {
    const approvedClaims = reimbursements.filter(r => r.status === 'Approved');
    if (approvedClaims.length === 0) {
      alert('No approved claims available to reconcile.');
      return;
    }

    let csvContent = 'Claim_ID,Member,Email,Category,Event,Amount,Masked_Bank_Details,Date_Approved,First_Pass_Reviewer,Final_Approver\n';
    approvedClaims.forEach(claim => {
      const masked = maskBankDetails(claim.bankDetails, false);
      csvContent += `"${claim.id}","${claim.memberName}","${claim.memberEmail}","${claim.category}","${claim.eventName || 'General Operations'}",${claim.amount},"${masked}","${claim.submittedAt}","${claim.firstPassReviewer || 'N/A'}","${claim.finalApprover || 'N/A'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_reconciled_expenses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // One-Shot Event Reimbursement Chart CSV Export
  const handleExportEventChartCsv = (targetEventId: string) => {
    const targetEv = events.find(e => e.id === targetEventId);
    const chartClaims = targetEventId === 'ALL'
      ? reimbursements
      : targetEventId === 'GENERAL'
      ? reimbursements.filter(r => !r.eventId)
      : reimbursements.filter(r => r.eventId === targetEventId);

    const titleName = targetEventId === 'ALL'
      ? 'All Events & Operations'
      : targetEventId === 'GENERAL'
      ? 'General Operations'
      : targetEv?.title || 'Event';

    const totalAmount = chartClaims.reduce((sum, r) => sum + r.amount, 0);
    const approvedAmount = chartClaims.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = chartClaims.filter(r => r.status === 'Pending' || r.status === 'Under Review').reduce((sum, r) => sum + r.amount, 0);
    const deniedAmount = chartClaims.filter(r => r.status === 'Denied').reduce((sum, r) => sum + r.amount, 0);

    let csvContent = `==================================================\n`;
    csvContent += `LEADS FINANCIAL REIMBURSEMENT SUMMARY CHART\n`;
    csvContent += `Target Scope: ${titleName}\n`;
    csvContent += `Generated Date: ${new Date().toISOString().split('T')[0]}\n`;
    csvContent += `Total Claims Count: ${chartClaims.length}\n`;
    csvContent += `Total Amount Claimed: ₹${totalAmount}\n`;
    csvContent += `Total Approved Amount: ₹${approvedAmount}\n`;
    csvContent += `Total Pending Amount: ₹${pendingAmount}\n`;
    csvContent += `Total Denied Amount: ₹${deniedAmount}\n`;
    csvContent += `==================================================\n\n`;

    csvContent += `Claim_ID,Member_Name,Email,Category,Event_Name,Description,Amount_INR,Status,Bank_Details,Submitted_Date,First_Pass_Reviewer,Final_Approver\n`;

    chartClaims.forEach(r => {
      const masked = maskBankDetails(r.bankDetails, false);
      csvContent += `"${r.id}","${r.memberName}","${r.memberEmail}","${r.category}","${r.eventName || 'General Operations'}","${r.description.replace(/"/g, '""')}",${r.amount},"${r.status}","${masked}","${r.submittedAt}","${r.firstPassReviewer || 'N/A'}","${r.finalApprover || 'N/A'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeFilename = titleName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `reimbursement_chart_${safeFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLeadership = user && user.tier <= 3; // Super User, Centre Head, Head of Events
  const isCoreCommittee = user && user.tier === 5; // Tier 5

  const displayedClaims = reimbursements.filter(r => {
    // Role filter
    if (user && !isLeadership && !isCoreCommittee && r.memberEmail !== user.email) {
      return false;
    }
    // Event filter
    if (selectedEventFilter === 'ALL') return true;
    if (selectedEventFilter === 'GENERAL') return !r.eventId;
    return r.eventId === selectedEventFilter;
  });

  const pendingClaims = displayedClaims.filter(r => r.status === 'Pending' || r.status === 'Under Review');
  const processedClaims = displayedClaims.filter(r => r.status === 'Approved' || r.status === 'Denied');

  const getStatusBadge = (status: ReimbursementItem['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/15 text-amber-500 border border-amber-500/30';
      case 'Under Review':
        return 'bg-accent/15 text-accent border border-accent/30';
      case 'Approved':
        return 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30';
      case 'Denied':
        return 'bg-red-500/15 text-red-500 border border-red-500/30';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Alert Banner */}
      {alertMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle className="h-5 w-5 text-success shrink-0" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Reimbursements & Expense Claims</h1>
          <p className="text-xs text-theme-text-secondary">Attach claims directly to events & export one-shot event financial summary charts</p>
        </div>

        {/* Header Controls & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Event Filter Selector */}
          <div className="flex items-center gap-2 bg-theme-background/30 border border-theme-card-border px-3 py-1.5 rounded-xl">
            <Filter className="h-4 w-4 text-theme-text-secondary" />
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="bg-transparent text-xs text-theme-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Events & Operations</option>
              <option value="GENERAL">General Operations (No Event)</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>Event: {ev.title}</option>
              ))}
            </select>
          </div>

          {/* Event Reimbursement Chart Modal Trigger */}
          <button
            onClick={() => {
              setChartEventId(selectedEventFilter === 'GENERAL' ? 'ALL' : selectedEventFilter);
              setShowChartModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-theme-border/20 hover:bg-theme-border/30 text-theme-text-primary text-xs font-semibold rounded-xl border border-theme-border/30 transition-all cursor-pointer shadow-sm"
          >
            <BarChart3 className="h-4 w-4 text-accent" />
            <span>Event Expense Chart</span>
          </button>

          {(isLeadership || isCoreCommittee) && (
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Download Reconciliations (CSV)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Submit Claim Form */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-1 space-y-4">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary">Submit Expense Claim</h3>
            <p className="text-xs text-theme-text-secondary">Attach to an event, upload bills & provide settlement details</p>
          </div>

          {formError && (
            <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
            {/* Event Association Select Dropdown */}
            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                Associated Event (Optional)
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">General Operations / Non-Event Expense</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              >
                <option value="Printing & Stationary">Printing & Stationary</option>
                <option value="Catering / Refreshments">Catering / Refreshments</option>
                <option value="Travel & Logistics">Travel & Logistics</option>
                <option value="Technical Assets / Hardware">Technical Assets / Hardware</option>
                <option value="Miscellaneous & Operational">Miscellaneous & Operational</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Claim Amount (₹) *</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2450.00"
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Expense Description & Justification *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail what was purchased, for which event/committee, and why..."
                rows={3}
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Upload Bill / Receipt File</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 px-4 py-2.5 bg-theme-background/30 border border-theme-card-border border-dashed rounded-xl text-theme-text-secondary hover:text-theme-text-primary hover:border-accent transition-all cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="truncate">{receiptFileName || 'Choose receipt file (Image / PDF)'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Bank Settlement Details *</label>
              <input
                type="text"
                required
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Bank Name, A/C Number, IFSC Code"
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              />
              <span className="text-[10px] text-theme-text-secondary">
                Bank credentials will be masked in audit tables for privacy.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-2"
            >
              Submit Expense Claim
            </button>
          </form>
        </div>

        {/* Right Column: Pending & Processed Claims */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-2 space-y-6">
          
          {/* Pending / Under Review Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Claims in Verification Pipeline ({pendingClaims.length})
              </h3>
            </div>

            {pendingClaims.length === 0 ? (
              <div className="text-center py-8 text-theme-text-secondary text-xs bg-theme-border/5 rounded-xl border border-theme-border/20">
                No reimbursement claims currently awaiting review for this filter scope.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingClaims.map(claim => {
                  const isRevealed = Boolean(revealedBankIds[claim.id]);
                  return (
                    <div key={claim.id} className="p-4 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-3 hover:bg-theme-border/15 transition-all text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-theme-text-primary">{claim.memberName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(claim.status)}`}>
                              {claim.status}
                            </span>
                            {claim.eventName && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {claim.eventName}
                              </span>
                            )}
                          </div>
                          <p className="text-theme-text-secondary mt-0.5">{claim.memberEmail} · Submitted on {claim.submittedAt}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-base text-accent">₹{claim.amount.toLocaleString()}</span>
                          <p className="text-[11px] text-theme-text-secondary">{claim.category}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-theme-background/30 rounded-lg border border-theme-border/20 space-y-2">
                        <p className="text-theme-text-primary font-medium">{claim.description}</p>
                        
                        <div className="flex items-center justify-between text-[11px] text-theme-text-secondary pt-1 border-t border-theme-border/10">
                          <div className="flex items-center gap-2">
                            <span>Bank Settlement:</span>
                            <span className="font-mono text-theme-text-primary font-medium">
                              {maskBankDetails(claim.bankDetails, isRevealed)}
                            </span>
                            {(isLeadership || isCoreCommittee) && (
                              <button
                                type="button"
                                onClick={() => toggleBankReveal(claim.id)}
                                className="p-1 text-theme-text-secondary hover:text-accent cursor-pointer"
                                title={isRevealed ? 'Mask Bank Info' : 'Reveal Full Bank Info'}
                              >
                                {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>

                          {claim.receiptData ? (
                            <button
                              onClick={() => setViewingReceipt({ url: claim.receiptData!, title: `Receipt Slip: ${claim.memberName} (₹${claim.amount})` })}
                              className="text-accent hover:underline flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View Uploaded Receipt
                            </button>
                          ) : (
                            <span className="text-theme-text-secondary italic">No receipt file attached</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons based on role */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-theme-border/20">
                        {/* Stage 1: Core Committee review */}
                        {isCoreCommittee && claim.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleCoreFirstPass(claim.id, true)}
                              className="px-3 py-1.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-lg transition-all text-xs cursor-pointer flex items-center gap-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Recommend Approval (Pass to Head)
                            </button>
                            <button
                              onClick={() => handleCoreFirstPass(claim.id, false)}
                              className="px-3 py-1.5 bg-danger hover:bg-danger/90 text-white font-semibold rounded-lg transition-all text-xs cursor-pointer flex items-center gap-1"
                            >
                              <X className="h-3.5 w-3.5" />
                              Deny Claim
                            </button>
                          </>
                        )}

                        {/* Stage 2: Centre Head / Super User Final Approval */}
                        {isLeadership && (
                          <>
                            <button
                              onClick={() => handleFinalApproval(claim.id, true)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-xs cursor-pointer flex items-center gap-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              {claim.status === 'Under Review' ? 'Final Approve & Pay' : 'Direct Approve'}
                            </button>
                            <button
                              onClick={() => handleFinalApproval(claim.id, false)}
                              className="px-3 py-1.5 bg-danger hover:bg-danger/90 text-white font-semibold rounded-lg transition-all text-xs cursor-pointer flex items-center gap-1"
                            >
                              <X className="h-3.5 w-3.5" />
                              Deny Claim
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Processed / Reconciled Claims History */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Settlement & Reconciled History ({processedClaims.length})
            </h3>

            {processedClaims.length === 0 ? (
              <div className="text-center py-6 text-theme-text-secondary text-xs">
                No past settled or denied claims recorded for this filter scope.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                      <th className="pb-2.5 font-semibold">Claimant</th>
                      <th className="pb-2.5 font-semibold">Event / Scope</th>
                      <th className="pb-2.5 font-semibold">Category</th>
                      <th className="pb-2.5 font-semibold">Amount</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                      <th className="pb-2.5 font-semibold">Approval Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/20">
                    {processedClaims.map(claim => (
                      <tr key={claim.id} className="hover:bg-theme-border/10 transition-all text-xs">
                        <td className="py-3 font-semibold text-theme-text-primary">{claim.memberName}</td>
                        <td className="py-3 text-theme-text-secondary">{claim.eventName || 'General Ops'}</td>
                        <td className="py-3 text-theme-text-secondary">{claim.category}</td>
                        <td className="py-3 font-bold text-theme-text-primary">₹{claim.amount.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(claim.status)}`}>
                            {claim.status}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] text-theme-text-secondary">
                          {claim.finalApprover ? `Authorized by ${claim.finalApprover}` : claim.firstPassReviewer ? `Reviewed by ${claim.firstPassReviewer}` : 'System Logged'} ({claim.decidedAt || claim.submittedAt})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* View Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 flex flex-col space-y-4 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-theme-text-primary">{viewingReceipt.title}</h3>
              <button 
                onClick={() => setViewingReceipt(null)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-theme-border/30 bg-black/20 flex items-center justify-center p-2">
              {viewingReceipt.url.startsWith('data:image') || viewingReceipt.url.endsWith('.jpg') || viewingReceipt.url.endsWith('.png') ? (
                <img src={viewingReceipt.url} alt="Receipt Preview" className="max-w-full h-auto object-contain rounded-lg" />
              ) : (
                <iframe src={viewingReceipt.url} className="w-full h-96 rounded-lg" title="Receipt PDF"></iframe>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-Shot Event Reimbursement Chart Modal */}
      {showChartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-theme-border/30 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-2xl text-accent">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-theme-text-primary">Event Reimbursement Summary Chart</h3>
                  <p className="text-xs text-theme-text-secondary">Inspect itemized claims & download one-shot financial ledgers per event</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChartModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scope / Event Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-background/20 p-3.5 rounded-2xl border border-theme-border/30 text-xs">
              <span className="font-semibold text-theme-text-primary flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-accent" />
                Select Event Scope:
              </span>
              <select
                value={chartEventId}
                onChange={(e) => setChartEventId(e.target.value)}
                className="px-3 py-2 bg-theme-background/50 border border-theme-card-border rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="ALL">All Events & Operations Combined</option>
                <option value="GENERAL">General Operations (No Event)</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>Event: {ev.title}</option>
                ))}
              </select>
            </div>

            {/* Financial Metrics Summary Grid */}
            {(() => {
              const scopeClaims = chartEventId === 'ALL'
                ? reimbursements
                : chartEventId === 'GENERAL'
                ? reimbursements.filter(r => !r.eventId)
                : reimbursements.filter(r => r.eventId === chartEventId);

              const totalAmt = scopeClaims.reduce((s, r) => s + r.amount, 0);
              const approvedAmt = scopeClaims.filter(r => r.status === 'Approved').reduce((s, r) => s + r.amount, 0);
              const pendingAmt = scopeClaims.filter(r => r.status === 'Pending' || r.status === 'Under Review').reduce((s, r) => s + r.amount, 0);
              const deniedAmt = scopeClaims.filter(r => r.status === 'Denied').reduce((s, r) => s + r.amount, 0);

              const selectedEventObj = events.find(e => e.id === chartEventId);

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-1">
                      <span className="text-[11px] text-theme-text-secondary font-medium">Total Claimed</span>
                      <p className="text-base font-bold text-theme-text-primary">₹{totalAmt.toLocaleString()}</p>
                      <span className="text-[10px] text-theme-text-secondary">{scopeClaims.length} total claim(s)</span>
                    </div>

                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                      <span className="text-[11px] text-emerald-400 font-medium">Approved & Paid</span>
                      <p className="text-base font-bold text-emerald-400">₹{approvedAmt.toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-400/80">{scopeClaims.filter(r => r.status === 'Approved').length} claim(s)</span>
                    </div>

                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                      <span className="text-[11px] text-amber-400 font-medium">Pending Review</span>
                      <p className="text-base font-bold text-amber-400">₹{pendingAmt.toLocaleString()}</p>
                      <span className="text-[10px] text-amber-400/80">{scopeClaims.filter(r => r.status === 'Pending' || r.status === 'Under Review').length} claim(s)</span>
                    </div>

                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
                      <span className="text-[11px] text-red-400 font-medium">Denied Claims</span>
                      <p className="text-base font-bold text-red-400">₹{deniedAmt.toLocaleString()}</p>
                      <span className="text-[10px] text-red-400/80">{scopeClaims.filter(r => r.status === 'Denied').length} claim(s)</span>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-theme-text-primary uppercase tracking-wider">
                      Itemized Expense Breakdown ({scopeClaims.length})
                    </h4>

                    {scopeClaims.length === 0 ? (
                      <div className="text-center py-6 text-theme-text-secondary text-xs bg-theme-border/5 rounded-xl border border-theme-border/20">
                        No expense claims attached to this event scope yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-theme-border/30 rounded-xl max-h-60 overflow-y-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="sticky top-0 bg-theme-background/90 backdrop-blur-md border-b border-theme-border/40">
                            <tr className="text-theme-text-secondary text-[11px]">
                              <th className="p-2.5 font-semibold">Claimant</th>
                              <th className="p-2.5 font-semibold">Category</th>
                              <th className="p-2.5 font-semibold">Description</th>
                              <th className="p-2.5 font-semibold">Amount</th>
                              <th className="p-2.5 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border/20">
                            {scopeClaims.map(claim => (
                              <tr key={claim.id} className="hover:bg-theme-border/10 text-xs">
                                <td className="p-2.5 font-semibold text-theme-text-primary">{claim.memberName}</td>
                                <td className="p-2.5 text-theme-text-secondary">{claim.category}</td>
                                <td className="p-2.5 text-theme-text-secondary truncate max-w-xs">{claim.description}</td>
                                <td className="p-2.5 font-bold text-theme-text-primary">₹{claim.amount.toLocaleString()}</td>
                                <td className="p-2.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(claim.status)}`}>
                                    {claim.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* One-Shot Download Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-theme-border/30">
                    <p className="text-[11px] text-theme-text-secondary">
                      Export full ledger containing claim breakdown, bank settlement coordinates, and verification logs.
                    </p>
                    <button
                      onClick={() => handleExportEventChartCsv(chartEventId)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer flex items-center justify-center gap-2 text-xs"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Download Event Reimbursement Chart (CSV)</span>
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
}
