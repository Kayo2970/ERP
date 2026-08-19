'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  History, 
  Lock, 
  Key, 
  CheckCircle2, 
  ShieldAlert, 
  Users, 
  Sliders, 
  Clock, 
  Sun, 
  Moon,
  Save,
  Building2,
  CreditCard,
  Hash,
  Receipt,
  Mail,
  Send,
  Eye,
  RefreshCw,
  FileText
} from 'lucide-react';
import { getAuditLogs, getMembers, updateMember, Member, AuditLogItem, getEmailLogs } from '@/lib/local-data';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'reimbursement' | 'roles' | 'audit' | 'emails'>('account');
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [emailFilter, setEmailFilter] = useState<string>('ALL');
  const [previewEmail, setPreviewEmail] = useState<any | null>(null);

  // Test Email state
  const [testTo, setTestTo] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testBody, setTestBody] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Account form state
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Reimbursement Settlement Coordinates
  const [savedBankName, setSavedBankName] = useState('');
  const [savedAccountNumber, setSavedAccountNumber] = useState('');
  const [savedIfscCode, setSavedIfscCode] = useState('');

  // Notification state
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const allMembers = getMembers();
    setMembers(allMembers);
    setAuditLogs(getAuditLogs());
    fetchEmails();

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        setDisplayName(u.name);
        const me = allMembers.find(m => m.id === u.id || m.email.toLowerCase() === u.email.toLowerCase());
        setSavedBankName(u.bankName || me?.bankName || '');
        setSavedAccountNumber(u.accountNumber || me?.accountNumber || '');
        setSavedIfscCode(u.ifscCode || me?.ifscCode || '');
        setTestTo(u.email || '');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchEmails = async () => {
    const logs = await getEmailLogs();
    setEmailLogs(logs);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      triggerError('Name cannot be blank.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 4) {
        triggerError('New password must be at least 4 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        triggerError('New password and confirmation do not match.');
        return;
      }
    }

    const changes = { 
      name: displayName.trim(), 
      ...(newPassword ? { customPassword: newPassword } : {}),
      bankName: savedBankName.trim(),
      accountNumber: savedAccountNumber.trim(),
      ifscCode: savedIfscCode.trim().toUpperCase()
    };
    const updatedMember = updateMember(user.id, changes, user.name);
    if (!updatedMember) {
      triggerError('Could not find your member record to update.');
      return;
    }

    const updatedUser = { ...user, ...changes };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setMembers(getMembers());
    setAuditLogs(getAuditLogs());

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    triggerSuccess('Account profile and reimbursement settlement bank coordinates saved successfully.');
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTo.trim() || !testSubject.trim() || !testBody.trim()) {
      triggerError('Please fill in recipient, subject, and body for test email.');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testTo.trim(),
          subject: testSubject.trim(),
          bodyText: testBody.trim(),
          category: 'SYSTEM',
        }),
      });
      if (res.ok) {
        triggerSuccess(`Test email dispatched successfully to ${testTo.trim()}`);
        setTestSubject('');
        setTestBody('');
        fetchEmails();
      } else {
        triggerError('Failed to dispatch test email.');
      }
    } catch (err: any) {
      triggerError(err.message || 'Error dispatching test email.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const isSuperAdmin = user && (user.tier === 1 || user.tier === 2);

  const rolePrivileges = [
    { tier: 1, role: 'Super User', access: 'Full unconstrained system administration, user management, audit logs, and forms building.' },
    { tier: 2, role: 'Centre Head', access: 'Final reimbursement authorization, event oversight, performance evaluations, and reporting.' },
    { tier: 3, role: 'Head of Events', access: 'Event creation & management, task assignments, deadline extensions, and ratings.' },
    { tier: 4, role: 'Advisory Board', access: 'Strategic read-only oversight, quarterly analytics, and event calendar reviews.' },
    { tier: 5, role: 'Core Committee', access: 'Event organizing, task assignments, public form creation, and reimbursement first-pass checks.' },
    { tier: 6, role: 'Training Associate', access: 'Assigned deliverable execution, task acknowledgment, and personal claim submissions.' },
  ];

  const filteredEmailLogs = emailLogs.filter(log => {
    if (emailFilter === 'ALL') return true;
    return log.category === emailFilter;
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-danger/15 border border-danger/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <ShieldAlert className="h-5 w-5 text-danger shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header section */}
      <div>
        <h1 className="text-xl font-bold text-theme-text-primary">System Settings & Governance</h1>
        <p className="text-xs text-theme-text-secondary">Configure your profile credentials, saved reimbursement settlement bank details, inspect role privileges, manage email dispatcher, and review audit records</p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-theme-border/30 gap-4 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'account'
              ? 'text-accent border-b-2 border-accent'
              : 'text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <User className="h-4 w-4" />
          Account Profile
        </button>

        <button
          onClick={() => setActiveTab('reimbursement')}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'reimbursement'
              ? 'text-accent border-b-2 border-accent'
              : 'text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Reimbursement Account
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'roles'
              ? 'text-accent border-b-2 border-accent'
              : 'text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Roles & Permissions Matrix
        </button>

        <button
          onClick={() => {
            setActiveTab('emails');
            fetchEmails();
          }}
          className={`pb-3 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'emails'
              ? 'text-accent border-b-2 border-accent'
              : 'text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <Mail className="h-4 w-4" />
          Email Logs & Dispatcher ({emailLogs.length})
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => {
              setActiveTab('audit');
              setAuditLogs(getAuditLogs());
            }}
            className={`pb-3 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'text-accent border-b-2 border-accent'
                : 'text-theme-text-secondary hover:text-theme-text-primary'
            }`}
          >
            <History className="h-4 w-4" />
            Audit Trail ({auditLogs.length})
          </button>
        )}
      </div>

      {/* Tab 1: Account Profile */}
      {activeTab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-5">
            <div>
              <h3 className="text-base font-bold text-theme-text-primary">Profile & Security Preferences</h3>
              <p className="text-xs text-theme-text-secondary">Update your display information and access credentials</p>
            </div>

            <form onSubmit={handleUpdateAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 bg-theme-background/10 border border-theme-border/30 rounded-xl text-theme-text-secondary cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-theme-border/20">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Role Tier</label>
                  <input
                    type="text"
                    disabled
                    value={`${user?.role || 'Super User'} (Tier ${user?.tier || 1})`}
                    className="w-full px-4 py-2.5 bg-theme-background/10 border border-theme-border/30 rounded-xl text-theme-text-secondary cursor-not-allowed opacity-70"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Committee</label>
                  <input
                    type="text"
                    disabled
                    value={user?.committee || 'All Committees'}
                    className="w-full px-4 py-2.5 bg-theme-background/10 border border-theme-border/30 rounded-xl text-theme-text-secondary cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              {/* Saved Bank Details for Auto-filling Reimbursements */}
              <div className="pt-2 border-t border-theme-border/20 space-y-3">
                <h4 className="font-bold text-xs text-theme-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-accent" />
                  Default Reimbursement Bank Settlement Coordinates
                </h4>
                <p className="text-[11px] text-theme-text-secondary">
                  Save your bank credentials here so they automatically pre-fill whenever you submit reimbursement claims.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block font-medium text-theme-text-secondary">Bank Name</label>
                    <input
                      type="text"
                      value={savedBankName}
                      onChange={(e) => setSavedBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, SBI, ICICI Bank"
                      className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-medium text-theme-text-secondary">Account Number</label>
                      <input
                        type="text"
                        value={savedAccountNumber}
                        onChange={(e) => setSavedAccountNumber(e.target.value)}
                        placeholder="e.g. 50100293849182"
                        className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-medium text-theme-text-secondary">IFSC Code</label>
                      <input
                        type="text"
                        value={savedIfscCode}
                        onChange={(e) => setSavedIfscCode(e.target.value)}
                        placeholder="e.g. HDFC0000123"
                        className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-theme-border/20 space-y-3">
                <h4 className="font-bold text-xs text-theme-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-accent" />
                  Change Password
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-medium text-theme-text-secondary">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-medium text-theme-text-secondary">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <Save className="h-4 w-4" />
                  Save Profile & Bank Details
                </button>
              </div>
            </form>
          </div>

          {/* User Session Info Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3 text-xs">
              <h3 className="text-sm font-bold text-theme-text-primary">Session Info</h3>
              <div className="bg-theme-background/30 p-4 rounded-xl border border-theme-border/30 space-y-2 text-[11px]">
                <p className="text-theme-text-secondary">Authenticated Account:</p>
                <p className="font-bold text-theme-text-primary text-xs">{user?.name}</p>
                <p className="font-mono text-accent">{user?.email}</p>
                <div className="pt-2 border-t border-theme-border/20 text-theme-text-secondary">
                  <span>Authorized Tier: </span>
                  <strong className="text-theme-text-primary">{user?.role} (Level {user?.tier})</strong>
                </div>

                {savedBankName && (
                  <div className="pt-2 border-t border-theme-border/20 text-theme-text-secondary">
                    <span>Saved Reimbursement Bank: </span>
                    <strong className="text-accent font-medium">{savedBankName}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-theme-text-secondary space-y-1">
              <p>MSRUAS LEADS Next Gen Portal</p>
              <p>Build version: v2026.8.19-email-sync</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reimbursement Settlement Account */}
      {activeTab === 'reimbursement' && (
        <div className="glass-panel rounded-2xl p-6 space-y-6 max-w-3xl">
          <div className="flex items-center justify-between border-b border-theme-border/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/15 border border-accent/25 rounded-2xl text-accent">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-text-primary">Saved Reimbursement Bank Settlement Account</h3>
                <p className="text-xs text-theme-text-secondary">Students & organizers can save bank coordinates here to auto-fill every reimbursement claim submission</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateAccount} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-accent" />
                Bank Name *
              </label>
              <input
                type="text"
                required
                value={savedBankName}
                onChange={(e) => setSavedBankName(e.target.value)}
                placeholder="e.g. HDFC Bank, State Bank of India, ICICI Bank, Axis Bank"
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-accent" />
                  Bank Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={savedAccountNumber}
                  onChange={(e) => setSavedAccountNumber(e.target.value)}
                  placeholder="e.g. 50100293849182"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-accent" />
                  IFSC Code *
                </label>
                <input
                  type="text"
                  required
                  value={savedIfscCode}
                  onChange={(e) => setSavedIfscCode(e.target.value)}
                  placeholder="e.g. HDFC0000123"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-mono uppercase"
                />
              </div>
            </div>

            <div className="p-3 bg-theme-background/20 border border-theme-border/20 rounded-xl text-[11px] text-theme-text-secondary flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Your bank credentials are saved locally to your member profile and automatically auto-filled whenever you open the reimbursement claim form.</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer flex items-center gap-2 text-xs"
              >
                <Save className="h-4 w-4" />
                Save Reimbursement Bank Coordinates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Roles Matrix */}
      {activeTab === 'roles' && (
        <div className="glass-panel rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary">System Access & Permission Hierarchy</h3>
            <p className="text-xs text-theme-text-secondary">Governing access rules across the 6 role tiers defined in LEADS PRD</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolePrivileges.map(rp => (
              <div key={rp.tier} className="p-4 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-theme-text-primary text-sm">{rp.role}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                    Tier {rp.tier}
                  </span>
                </div>
                <p className="text-xs text-theme-text-secondary leading-relaxed">
                  {rp.access}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Email Logs & Dispatcher Inspector */}
      {activeTab === 'emails' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sent Emails History */}
            <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border/30 pb-4">
                <div>
                  <h3 className="text-base font-bold text-theme-text-primary">Sent Email Notifications</h3>
                  <p className="text-xs text-theme-text-secondary">Live dispatches for OTP resets, announcements, tasks, and event rosters</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchEmails}
                    className="p-2 bg-theme-background/40 hover:bg-theme-background/70 border border-theme-border/40 rounded-xl text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
                    title="Refresh Email Logs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <select
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="px-3 py-1.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="ALL">All Categories ({emailLogs.length})</option>
                    <option value="AUTH_OTP">Password Reset OTP</option>
                    <option value="ANNOUNCEMENT">Announcements</option>
                    <option value="TASK_ASSIGNMENT">Task Assignments</option>
                    <option value="EVENT_ROSTER">Event Roster Updates</option>
                    <option value="SYSTEM">System Alerts</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                {filteredEmailLogs.length === 0 ? (
                  <div className="text-center py-12 text-theme-text-secondary text-xs space-y-2">
                    <Mail className="h-8 w-8 mx-auto text-theme-text-secondary/40" />
                    <p>No email logs found for category &ldquo;{emailFilter}&rdquo;.</p>
                  </div>
                ) : (
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold">Recipient</th>
                        <th className="pb-3 font-semibold">Subject</th>
                        <th className="pb-3 font-semibold">Sent At</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/20">
                      {filteredEmailLogs.map(log => (
                        <tr key={log.id} className="hover:bg-theme-border/10 transition-all text-xs">
                          <td className="py-3 pr-2 whitespace-nowrap">
                            <span className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase border ${
                              log.category === 'AUTH_OTP'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : log.category === 'ANNOUNCEMENT'
                                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                : log.category === 'TASK_ASSIGNMENT'
                                ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {log.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 pr-2 font-mono font-medium text-theme-text-primary whitespace-nowrap">{log.to}</td>
                          <td className="py-3 pr-2 text-theme-text-primary max-w-xs truncate" title={log.subject}>
                            {log.subject}
                          </td>
                          <td className="py-3 pr-2 text-theme-text-secondary whitespace-nowrap font-mono text-[11px]">
                            {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setPreviewEmail(log)}
                              className="px-2.5 py-1 bg-accent/15 hover:bg-accent/30 text-accent rounded-lg transition-all font-medium text-[11px] flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Eye className="h-3 w-3" />
                              Preview
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Test Email Dispatcher Panel */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 h-fit">
              <div>
                <h3 className="text-sm font-bold text-theme-text-primary flex items-center gap-2">
                  <Send className="h-4 w-4 text-accent" />
                  Test Email Dispatcher
                </h3>
                <p className="text-[11px] text-theme-text-secondary mt-1">
                  Send a test notification to verify recipient inbox delivery
                </p>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="block font-medium text-theme-text-secondary">Recipient Email</label>
                  <input
                    type="email"
                    required
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    placeholder="name@msruas.ac.in"
                    className="w-full px-3.5 py-2 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-medium text-theme-text-secondary">Subject Line</label>
                  <input
                    type="text"
                    required
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    placeholder="[Test] LEADS System Verification"
                    className="w-full px-3.5 py-2 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-medium text-theme-text-secondary">Email Message</label>
                  <textarea
                    rows={3}
                    required
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    placeholder="Write test message body here..."
                    className="w-full px-3.5 py-2 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="w-full py-2.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {isSendingTest ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Dispatch Email
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Audit Trail */}
      {activeTab === 'audit' && isSuperAdmin && (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-theme-text-primary">Security Audit Trail</h3>
              <p className="text-xs text-theme-text-secondary">Immutable log of system actions, member updates, and governance events</p>
            </div>
            <span className="text-xs font-semibold text-accent px-2.5 py-0.5 bg-accent/15 rounded-md">
              {auditLogs.length} events logged
            </span>
          </div>

          <div className="overflow-x-auto">
            {auditLogs.length === 0 ? (
              <div className="text-center py-10 text-theme-text-secondary text-xs">
                No audit logs recorded yet in this session.
              </div>
            ) : (
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">Event Action</th>
                    <th className="pb-3 font-semibold">Actor Name</th>
                    <th className="pb-3 font-semibold">Actor Email</th>
                    <th className="pb-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-theme-border/10 transition-all text-xs">
                      <td className="py-3 pr-2 text-theme-text-secondary whitespace-nowrap font-mono">{log.timestamp}</td>
                      <td className="py-3 pr-2">
                        <span className="font-semibold px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 pr-2 font-bold text-theme-text-primary">{log.actorName}</td>
                      <td className="py-3 pr-2 text-theme-text-secondary font-mono">{log.actorEmail}</td>
                      <td className="py-3 text-theme-text-secondary max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Rendered Email Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 flex flex-col space-y-4 max-h-[90vh] border border-white/20 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <div>
                  <h3 className="text-sm font-bold text-theme-text-primary">Rendered Email Dispatch Preview</h3>
                  <p className="text-[11px] text-theme-text-secondary">To: {previewEmail.to}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-theme-text-secondary hover:text-theme-text-primary text-sm p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div dangerouslySetInnerHTML={{ __html: previewEmail.bodyHtml }} />
            </div>

            <div className="flex justify-between items-center text-[11px] text-theme-text-secondary pt-2 border-t border-theme-border/20">
              <span className="font-mono">ID: {previewEmail.id}</span>
              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-theme-text-primary font-medium rounded-xl transition-all cursor-pointer text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
