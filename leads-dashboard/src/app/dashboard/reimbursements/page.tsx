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
  AlertTriangle
} from 'lucide-react';
import { 
  getReimbursements, 
  addReimbursement, 
  updateReimbursementStatus, 
  deleteReimbursement,
  ReimbursementItem 
} from '@/lib/local-data';
import { maskBankDetails } from '@/lib/design-tokens';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>([]);
  const [user, setUser] = useState<any>(null);

  // Form State (Collaborator Claims)
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Printing & Stationary');
  const [description, setDescription] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');

  // Modals & previews
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; title: string } | null>(null);
  const [revealedBankIds, setRevealedBankIds] = useState<Record<string, boolean>>({});
  const [deletingClaimId, setDeletingClaimId] = useState<string | null>(null);

  // Notification Alert State
  const [alertMsg, setAlertMsg] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setReimbursements(getReimbursements());

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
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

    addReimbursement({
      memberName: user.name,
      memberEmail: user.email,
      amount: parsedAmount,
      category,
      description,
      receiptUrl: receiptFileName || 'receipt.pdf',
      receiptData: receiptDataUrl || undefined,
      bankDetails
    });

    // Reset Form
    setAmount('');
    setDescription('');
    setBankDetails('');
    setReceiptDataUrl('');
    setReceiptFileName('');
    setFormError('');

    // Refresh & Notify
    setReimbursements(getReimbursements());
    triggerSuccess('Reimbursement claim submitted successfully for review.');
  };

  // Two-Stage Approval Handlers
  const handleCoreFirstPass = (id: string, approve: boolean) => {
    if (approve) {
      updateReimbursementStatus(id, 'Under Review', { name: user.name, stage: 'firstPass' });
      triggerSuccess('First-pass review complete: Recommended for Centre Head sign-off.');
    } else {
      updateReimbursementStatus(id, 'Denied', { name: user.name, stage: 'firstPass' });
      triggerSuccess('Claim denied during Core Committee first-pass review.');
    }
    setReimbursements(getReimbursements());
  };

  const handleFinalApproval = (id: string, approve: boolean) => {
    if (approve) {
      updateReimbursementStatus(id, 'Approved', { name: user.name, stage: 'final' });
      triggerSuccess('Final Centre Head approval granted. Ready for payment disbursement.');
    } else {
      updateReimbursementStatus(id, 'Denied', { name: user.name, stage: 'final' });
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

    let csvContent = 'Claim_ID,Member,Email,Category,Amount,Masked_Bank_Details,Date_Approved,First_Pass_Reviewer,Final_Approver\n';
    approvedClaims.forEach(claim => {
      const masked = maskBankDetails(claim.bankDetails, false);
      csvContent += `"${claim.id}","${claim.memberName}","${claim.memberEmail}","${claim.category}",${claim.amount},"${masked}","${claim.submittedAt}","${claim.firstPassReviewer || 'N/A'}","${claim.finalApprover || 'N/A'}"\n`;
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

  const isLeadership = user && user.tier <= 3; // Super User, Centre Head, Head of Events
  const isCoreCommittee = user && user.tier === 5; // Tier 5

  const displayedClaims = reimbursements.filter(r => {
    if (!user) return true;
    if (isLeadership || isCoreCommittee) return true;
    return r.memberEmail === user.email;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Reimbursements & Expense Claims</h1>
          <p className="text-xs text-theme-text-secondary">Two-stage financial verification: Core Committee review &rarr; Centre Head authorization</p>
        </div>
        {(isLeadership || isCoreCommittee) && (
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download Reconciliations (CSV)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Submit Claim Form */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-1 space-y-4">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary">Submit Expense Claim</h3>
            <p className="text-xs text-theme-text-secondary">Attach receipt files and bank settlement coordinates</p>
          </div>

          {formError && (
            <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
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
                No reimbursement claims currently awaiting review.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingClaims.map(claim => {
                  const isRevealed = Boolean(revealedBankIds[claim.id]);
                  return (
                    <div key={claim.id} className="p-4 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-3 hover:bg-theme-border/15 transition-all text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-theme-text-primary">{claim.memberName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(claim.status)}`}>
                              {claim.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-theme-text-secondary mt-0.5">
                            Category: <strong>{claim.category}</strong> &middot; Submitted: {claim.submittedAt}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-theme-text-primary">₹{claim.amount.toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-xs text-theme-text-secondary bg-theme-background/30 p-2.5 rounded-lg border border-theme-border/20">
                        {claim.description}
                      </p>

                      {/* Bank Details Masked */}
                      <div className="flex items-center justify-between text-[11px] text-theme-text-secondary pt-1">
                        <div className="flex items-center gap-2">
                          <span>Bank Info: <strong>{maskBankDetails(claim.bankDetails, isRevealed)}</strong></span>
                          {(isLeadership || isCoreCommittee) && (
                            <button
                              onClick={() => toggleBankReveal(claim.id)}
                              className="p-1 hover:bg-theme-border/30 rounded text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
                              title={isRevealed ? "Mask Details" : "Reveal Details"}
                            >
                              {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          )}
                        </div>

                        {claim.receiptData ? (
                          <button
                            onClick={() => setViewingReceipt({ url: claim.receiptData!, title: `${claim.memberName} - ₹${claim.amount}` })}
                            className="text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="h-3 w-3" />
                            View Receipt
                          </button>
                        ) : (
                          <span className="text-theme-text-secondary italic">No receipt image attached</span>
                        )}
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
                No past settled or denied claims recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                      <th className="pb-2.5 font-semibold">Claimant</th>
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

    </div>
  );
}
