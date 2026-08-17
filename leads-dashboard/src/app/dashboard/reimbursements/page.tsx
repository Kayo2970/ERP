'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Check, X, Download, FileText, Plus, ShieldAlert, CheckCircle } from 'lucide-react';
import { getReimbursements, addReimbursement, updateReimbursementStatus, ReimbursementItem } from '@/lib/local-data';

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>([]);
  const [user, setUser] = useState<any>(null);

  // Form State (Collaborator Claims)
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Printing & Stationary');
  const [description, setDescription] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [receiptFile, setReceiptFile] = useState<string>('');

  // Notification Alert State
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    setReimbursements(getReimbursements());

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !bankDetails || !user) return;

    addReimbursement({
      memberName: user.name,
      memberEmail: user.email,
      amount: parseFloat(amount),
      category,
      description,
      receiptUrl: receiptFile || 'uploaded_receipt.pdf',
      bankDetails
    });

    // Reset Form
    setAmount('');
    setDescription('');
    setBankDetails('');
    setReceiptFile('');

    // Refresh & Notify
    setReimbursements(getReimbursements());
    triggerSuccess('Reimbursement claim submitted successfully for review.');
  };

  const handleStatusUpdate = (id: string, status: ReimbursementItem['status']) => {
    updateReimbursementStatus(id, status);
    setReimbursements(getReimbursements());
    triggerSuccess(`Claim status updated to ${status}.`);
  };

  const handleDownloadCsv = () => {
    const approvedClaims = reimbursements.filter(r => r.status === 'Approved');
    if (approvedClaims.length === 0) {
      alert('No approved claims available to reconcile.');
      return;
    }

    let csvContent = 'ID,Member,Email,Category,Amount,Bank Details,Date Approved\n';
    approvedClaims.forEach(claim => {
      csvContent += `"${claim.id}","${claim.memberName}","${claim.memberEmail}","${claim.category}",${claim.amount},"${claim.bankDetails.replace(/"/g, '""')}","${claim.submittedAt}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_approved_reimbursements.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerSuccess = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 5000);
  };

  const isAdmin = user && user.tier <= 3; // Super User, Centre Head, Head of Events see approval UI

  // Filter claims listed for user:
  // - Admins see all claims.
  // - Collaborators see only their own submitted claims.
  const displayedClaims = reimbursements.filter(r => {
    if (!user) return true;
    if (isAdmin) return true;
    return r.memberEmail === user.email;
  });

  const pendingClaims = displayedClaims.filter(r => r.status === 'Pending');
  const processedClaims = displayedClaims.filter(r => r.status !== 'Pending');

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
          <h1 className="text-xl font-bold text-theme-text-primary">Reimbursements & Expenses</h1>
          <p className="text-xs text-theme-text-secondary">Submit expense claims and manage payment reconciliations</p>
        </div>
        {isAdmin && (
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
        
        {/* Left Column: Form (only for Tiers 5-6 or when testing) */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-1 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-theme-text-primary">Submit Expense Claim</h3>
            <p className="text-xs text-theme-text-secondary">Upload receipts and log expense details</p>
          </div>

          <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              >
                <option value="Printing & Stationary">Printing & Stationary</option>
                <option value="Catering / Refreshments">Catering / Refreshments</option>
                <option value="Travel & Logistics">Travel & Logistics</option>
                <option value="Technical Assets / Hardware">Technical Assets / Hardware</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Reimbursement Amount (INR)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Description / Remarks</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed usage summary..."
                rows={3}
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Your Bank Details (IFSC, Account No)</label>
              <input
                type="text"
                required
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="e.g. HDFC Bank - A/C XXXXXXXX - IFSC HDFC000123"
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Evidence / Receipt File</label>
              <div className="border border-dashed border-theme-border/60 hover:border-accent rounded-xl p-4 text-center cursor-pointer transition-all">
                <span className="text-[11px] text-theme-text-secondary">Click to upload receipt files (PDF/JPG)</span>
                <input 
                  type="file" 
                  onChange={(e) => setReceiptFile(e.target.files?.[0]?.name || '')}
                  className="hidden" 
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="block text-[10px] font-bold text-accent mt-2 cursor-pointer">
                  {receiptFile || 'Select File'}
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
            >
              Submit Claim
            </button>
          </form>
        </div>

        {/* Right Column: Claims list and Reconciliations */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Pending Claims */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-theme-text-primary">Pending Reviews</h3>
              <p className="text-xs text-theme-text-secondary">Claims awaiting approval and bank details verification</p>
            </div>

            <div className="overflow-x-auto">
              {pendingClaims.length === 0 ? (
                <div className="text-center py-8 text-theme-text-secondary text-xs">
                  No claims currently pending review.
                </div>
              ) : (
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                      <th className="pb-3.5 font-semibold">Member</th>
                      <th className="pb-3.5 font-semibold">Details</th>
                      <th className="pb-3.5 font-semibold">Bank Info</th>
                      <th className="pb-3.5 font-semibold">Amount</th>
                      {isAdmin && <th className="pb-3.5 font-semibold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/20 text-xs">
                    {pendingClaims.map(claim => (
                      <tr key={claim.id} className="hover:bg-theme-border/10 transition-all">
                        <td className="py-4 pr-2 font-medium text-theme-text-primary">
                          <p>{claim.memberName}</p>
                          <p className="text-[10px] text-theme-text-secondary font-normal mt-0.5">{claim.memberEmail}</p>
                        </td>
                        <td className="py-4 pr-2 text-theme-text-secondary">
                          <p className="font-semibold text-theme-text-primary">{claim.category}</p>
                          <p className="text-[10px] mt-0.5 max-w-xs truncate" title={claim.description}>{claim.description}</p>
                        </td>
                        <td className="py-4 pr-2 text-theme-text-secondary font-mono text-[10px]">{claim.bankDetails}</td>
                        <td className="py-4 pr-2 text-theme-text-primary font-bold">₹{claim.amount}</td>
                        {isAdmin && (
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleStatusUpdate(claim.id, 'Approved')}
                                className="p-1 text-success hover:bg-success/15 rounded-md cursor-pointer"
                                title="Approve Claim"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(claim.id, 'Denied')}
                                className="p-1 text-danger hover:bg-danger/15 rounded-md cursor-pointer"
                                title="Reject Claim"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Processed Claims */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-theme-text-primary">Processed Claims</h3>
              <p className="text-xs text-theme-text-secondary">Expense claims that have been approved or rejected</p>
            </div>

            <div className="overflow-x-auto">
              {processedClaims.length === 0 ? (
                <div className="text-center py-8 text-theme-text-secondary text-xs">
                  No processed claims logs found.
                </div>
              ) : (
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                      <th className="pb-3.5 font-semibold">Member</th>
                      <th className="pb-3.5 font-semibold">Details</th>
                      <th className="pb-3.5 font-semibold">Amount</th>
                      <th className="pb-3.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/20 text-xs">
                    {processedClaims.map(claim => (
                      <tr key={claim.id} className="hover:bg-theme-border/10 transition-all">
                        <td className="py-4 pr-2 font-medium text-theme-text-primary">
                          <p>{claim.memberName}</p>
                        </td>
                        <td className="py-4 pr-2 text-theme-text-secondary">
                          <p className="font-semibold text-theme-text-primary">{claim.category}</p>
                          <p className="text-[10px] mt-0.5 max-w-xs truncate" title={claim.description}>{claim.description}</p>
                        </td>
                        <td className="py-4 pr-2 text-theme-text-primary font-bold">₹{claim.amount}</td>
                        <td className="py-4 pr-2">
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            claim.status === 'Approved' 
                              ? 'bg-success/15 text-success border border-success/20' 
                              : 'bg-danger/15 text-danger border border-danger/20'
                          }`}>
                            {claim.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
