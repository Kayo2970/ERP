'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Server, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  RefreshCw,
  FileText,
  Sparkles,
  Key,
  Globe,
  Search,
  X,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { EmailSettings, EmailLog } from '@/lib/email-service';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function EmailManagementPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'client' | 'outbox'>('settings');

  // Email Settings Form State
  const [settings, setSettings] = useState<EmailSettings>({
    id: 'default',
    provider: 'gmail',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    secure: false,
    authUser: 'leads@msruas.ac.in',
    authPass: '',
    fromName: 'LEADS Next Gen Centre',
    fromEmail: 'leads@msruas.ac.in',
    replyTo: 'leads@msruas.ac.in',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showDkimSection, setShowDkimSection] = useState(false);

  // SMTP Test Diagnostics State
  const [testRecipient, setTestRecipient] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Email Client Composer State
  const [dispatchScope, setDispatchScope] = useState<'SINGLE' | 'All Members' | 'Advisory Board' | 'Core Committee' | 'Training Associate' | 'Alumni'>('SINGLE');
  const [customRecipient, setCustomRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'ANNOUNCEMENT' | 'DIRECT_MESSAGE' | 'SYSTEM'>('ANNOUNCEMENT');
  const [bodyText, setBodyText] = useState('');
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [isSendingDispatch, setIsSendingDispatch] = useState(false);
  const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);

  // Outbox Logs State
  const [outboxLogs, setOutboxLogs] = useState<EmailLog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'ALL' | 'SENT' | 'FAILED'>('ALL');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Toast notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        setTestRecipient(u.email || 'leads@msruas.ac.in');
      } catch (e) {
        console.error(e);
      }
    }
    fetchSettings();
    fetchLogs();
  }, []);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4500);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/email/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/email/logs');
      if (res.ok) {
        const data = await res.json();
        setOutboxLogs(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Provider Preset Handler
  const handleSelectProvider = (provider: EmailSettings['provider']) => {
    if (provider === 'gmail') {
      setSettings(prev => ({
        ...prev,
        provider: 'gmail',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        secure: false,
      }));
    } else if (provider === 'outlook') {
      setSettings(prev => ({
        ...prev,
        provider: 'outlook',
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        secure: false,
      }));
    } else if (provider === 'local_postfix') {
      setSettings(prev => ({
        ...prev,
        provider: 'local_postfix',
        smtpHost: 'localhost',
        smtpPort: 25,
        secure: false,
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        provider: 'custom',
      }));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, actorName: user?.name || 'Super User' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        triggerToast('success', 'Email server credentials and SMTP settings updated successfully.');
      } else {
        triggerToast('error', 'Failed to save email settings.');
      }
    } catch (err: any) {
      triggerToast('error', err?.message || 'Error saving settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testRecipient) {
      triggerToast('error', 'Please enter a test recipient email address.');
      return;
    }
    setIsTestingSmtp(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testRecipient }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        triggerToast('success', 'SMTP test successful! Check test inbox.');
      } else {
        triggerToast('error', 'SMTP test failed. Check server credentials.');
      }
      fetchLogs();
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed' });
      triggerToast('error', 'Failed to reach SMTP server.');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const [badgeOption, setBadgeOption] = useState<string>('NONE');
  const [customBadgeText, setCustomBadgeText] = useState<string>('');

  const handleExecuteDispatch = async () => {
    setShowDispatchConfirm(false);
    setIsSendingDispatch(true);
    try {
      let resolvedBadgeText: string | undefined = undefined;
      if (badgeOption === 'INVITATION') resolvedBadgeText = '🎉 Official Invitation';
      else if (badgeOption === 'ANNOUNCEMENT') resolvedBadgeText = '📢 Official Announcement';
      else if (badgeOption === 'ACTION_REQUIRED') resolvedBadgeText = '📌 Action Required';
      else if (badgeOption === 'IMPORTANT') resolvedBadgeText = '⚠️ Important Notice';
      else if (badgeOption === 'CUSTOM') resolvedBadgeText = customBadgeText.trim() || undefined;
      else resolvedBadgeText = undefined;

      const payload = {
        scope: dispatchScope,
        recipientEmail: dispatchScope === 'SINGLE' ? customRecipient : undefined,
        subject,
        bodyText,
        category,
        badgeText: resolvedBadgeText,
      };
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('success', `Dispatched ${data.count} email notification(s) successfully.`);
        setSubject('');
        setBodyText('');
        setCustomRecipient('');
        fetchLogs();
      } else {
        triggerToast('error', data.error || 'Failed to dispatch emails.');
      }
    } catch (err: any) {
      triggerToast('error', err?.message || 'Error executing email dispatch.');
    } finally {
      setIsSendingDispatch(false);
    }
  };

  // Filter Outbox Logs
  const filteredLogs = outboxLogs.filter(log => {
    if (logStatusFilter !== 'ALL' && log.status !== logStatusFilter) return false;
    const q = logSearchQuery.toLowerCase();
    return !q || log.to.toLowerCase().includes(q) || log.subject.toLowerCase().includes(q) || log.category.toLowerCase().includes(q);
  });

  const totalLogs = outboxLogs.length;
  const sentCount = outboxLogs.filter(l => l.status === 'SENT').length;
  const failedCount = outboxLogs.filter(l => l.status === 'FAILED').length;

  // Super User Gate
  if (user && user.tier !== 1) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="glass-panel p-8 rounded-3xl border border-danger/30 text-center space-y-4 shadow-2xl">
          <div className="h-16 w-16 bg-danger/15 rounded-2xl flex items-center justify-center mx-auto text-danger border border-danger/25">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-theme-text-primary">Super User Authorization Required</h2>
          <p className="text-xs text-theme-text-secondary leading-relaxed">
            The Email Client and SMTP Server Management Module handles global email server configurations, App Passwords, and mail server dispatches. Access is strictly reserved for Tier-1 Super Users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-300 border shadow-lg ${
          toastMsg.type === 'success' 
            ? 'bg-success/15 border-success/30 text-theme-text-primary' 
            : 'bg-danger/15 border-danger/30 text-theme-text-primary'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" /> : <AlertCircle className="h-5 w-5 text-danger shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-accent/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-accent/10 via-primary/5 to-transparent">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/20">
              <Mail className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-theme-text-primary">Email Client & Server Management Desk</h1>
          </div>
          <p className="text-xs text-theme-text-secondary">
            Configure SMTP credentials (Gmail, Outlook 365, Custom), test mail server health, and compose broadcast announcements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-3 py-1 bg-accent/15 text-accent rounded-xl border border-accent/20 flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5" />
            Provider: {settings.provider.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-theme-border/30 pb-3 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'settings' 
              ? 'bg-accent text-white shadow-md shadow-accent/20' 
              : 'text-theme-text-secondary hover:bg-theme-border/20'
          }`}
        >
          <Server className="h-4 w-4" />
          SMTP Server Credentials
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'client' 
              ? 'bg-accent text-white shadow-md shadow-accent/20' 
              : 'text-theme-text-secondary hover:bg-theme-border/20'
          }`}
        >
          <Send className="h-4 w-4" />
          Email Client & Composer
        </button>

        <button
          onClick={() => setActiveTab('outbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'outbox' 
              ? 'bg-accent text-white shadow-md shadow-accent/20' 
              : 'text-theme-text-secondary hover:bg-theme-border/20'
          }`}
        >
          <FileText className="h-4 w-4" />
          Sent Outbox & Logs ({totalLogs})
        </button>
      </div>

      {/* TAB 1: SMTP Server Settings & Diagnostics */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main SMTP Config Form */}
          <div className="glass-panel p-6 rounded-3xl xl:col-span-2 space-y-6 border border-theme-card-border">
            <div>
              <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
                <Key className="h-4 w-4 text-accent" />
                SMTP Mail Relay Credentials
              </h3>
              <p className="text-xs text-theme-text-secondary mt-0.5">
                Select your service provider or enter custom SMTP credentials for sending announcements, OTPs, and task notifications.
              </p>
            </div>

            {/* Provider Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleSelectProvider('gmail')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.provider === 'gmail'
                    ? 'bg-accent/15 border-accent text-accent shadow-md shadow-accent/10'
                    : 'bg-theme-border/10 border-theme-border/30 hover:border-theme-border/60 text-theme-text-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Globe className="h-4 w-4" />
                  {settings.provider === 'gmail' && <Check className="h-4 w-4" />}
                </div>
                <div>
                  <span className="font-bold text-xs block mt-2">Gmail / Workspace</span>
                  <span className="text-[10px] opacity-75">smtp.gmail.com:587</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectProvider('outlook')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.provider === 'outlook'
                    ? 'bg-accent/15 border-accent text-accent shadow-md shadow-accent/10'
                    : 'bg-theme-border/10 border-theme-border/30 hover:border-theme-border/60 text-theme-text-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Globe className="h-4 w-4" />
                  {settings.provider === 'outlook' && <Check className="h-4 w-4" />}
                </div>
                <div>
                  <span className="font-bold text-xs block mt-2">Outlook 365</span>
                  <span className="text-[10px] opacity-75">smtp.office365.com:587</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectProvider('custom')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.provider === 'custom'
                    ? 'bg-accent/15 border-accent text-accent shadow-md shadow-accent/10'
                    : 'bg-theme-border/10 border-theme-border/30 hover:border-theme-border/60 text-theme-text-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Server className="h-4 w-4" />
                  {settings.provider === 'custom' && <Check className="h-4 w-4" />}
                </div>
                <div>
                  <span className="font-bold text-xs block mt-2">Custom SMTP</span>
                  <span className="text-[10px] opacity-75">Host & Port Defined</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectProvider('local_postfix')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.provider === 'local_postfix'
                    ? 'bg-accent/15 border-accent text-accent shadow-md shadow-accent/10'
                    : 'bg-theme-border/10 border-theme-border/30 hover:border-theme-border/60 text-theme-text-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Zap className="h-4 w-4" />
                  {settings.provider === 'local_postfix' && <Check className="h-4 w-4" />}
                </div>
                <div>
                  <span className="font-bold text-xs block mt-2">Local Postfix</span>
                  <span className="text-[10px] opacity-75">localhost:25</span>
                </div>
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block font-medium text-theme-text-secondary">SMTP Host *</label>
                  <input
                    type="text"
                    required
                    value={settings.smtpHost}
                    onChange={e => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="e.g. smtp.gmail.com"
                    className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">SMTP Port *</label>
                  <input
                    type="number"
                    required
                    value={settings.smtpPort}
                    onChange={e => setSettings(prev => ({ ...prev, smtpPort: Number(e.target.value) }))}
                    placeholder="587"
                    className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Auth Username / Email</label>
                  <input
                    type="text"
                    value={settings.authUser}
                    onChange={e => setSettings(prev => ({ ...prev, authUser: e.target.value }))}
                    placeholder="leads@msruas.ac.in"
                    className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="block font-medium text-theme-text-secondary">App Password / Auth Secret</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={settings.authPass}
                      onChange={e => setSettings(prev => ({ ...prev, authPass: e.target.value }))}
                      placeholder="••••••••••••••••"
                      className="w-full pl-4 pr-10 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-theme-text-secondary hover:text-theme-text-primary"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Sender Display Name *</label>
                  <input
                    type="text"
                    required
                    value={settings.fromName}
                    onChange={e => setSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="LEADS Next Gen Centre"
                    className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Sender Email Address *</label>
                  <input
                    type="email"
                    required
                    value={settings.fromEmail}
                    onChange={e => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="leads@msruas.ac.in"
                    className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-theme-border/20">
                <button
                  type="button"
                  onClick={() => setShowDkimSection(v => !v)}
                  className="w-full flex items-center justify-between py-2 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-bold text-theme-text-primary">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    DKIM Signing (Advanced)
                  </span>
                  {showDkimSection ? <ChevronUp className="h-4 w-4 text-theme-text-secondary" /> : <ChevronDown className="h-4 w-4 text-theme-text-secondary" />}
                </button>

                {showDkimSection && (
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] text-theme-text-secondary leading-relaxed">
                      Automated mail relayed through a shared SMTP server (Postfix, a Workspace relay, etc.) often isn&apos;t signed on behalf of your own sending domain, which is one of the biggest reasons a recipient&apos;s server quietly spam-filters it even though the send itself &quot;succeeds.&quot; Signing it here — independent of whatever the relay does — is the single most effective fix. Requires publishing the matching public key as a DNS TXT record at <code className="text-accent">&lt;selector&gt;._domainkey.&lt;domain&gt;</code>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block font-medium text-theme-text-secondary">Signing Domain</label>
                        <input
                          type="text"
                          value={settings.dkimDomain || ''}
                          onChange={e => setSettings(prev => ({ ...prev, dkimDomain: e.target.value }))}
                          placeholder="e.g. leadsnextgencentre.online"
                          className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-medium text-theme-text-secondary">DKIM Selector</label>
                        <input
                          type="text"
                          value={settings.dkimSelector || ''}
                          onChange={e => setSettings(prev => ({ ...prev, dkimSelector: e.target.value }))}
                          placeholder="e.g. leads"
                          className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-medium text-theme-text-secondary">Private Key (PEM format)</label>
                      <textarea
                        value={settings.dkimPrivateKey || ''}
                        onChange={e => setSettings(prev => ({ ...prev, dkimPrivateKey: e.target.value }))}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        rows={5}
                        className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary font-mono text-[11px] focus:outline-none focus:border-accent"
                      />
                      <p className="text-[10px] text-theme-text-secondary">
                        Leave all three fields blank to send unsigned (current behavior) — signing only activates once every field here is filled in.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-theme-border/20">
                <span className="text-[11px] text-theme-text-secondary">
                  Last updated: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Not configured'}
                </span>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2.5 bg-accent hover:bg-primary-light text-white font-bold rounded-xl transition-all shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Server className="h-4 w-4" />
                  {isSavingSettings ? 'Saving Settings...' : 'Save SMTP Credentials'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Connection Diagnostics & Live Test */}
          <div className="glass-panel p-6 rounded-3xl space-y-5 border border-theme-card-border flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Connection Diagnostics & Test
              </h3>
              <p className="text-xs text-theme-text-secondary leading-relaxed">
                Test your SMTP server connection and verify credentials by transmitting a live test email payload.
              </p>

              <div className="space-y-1.5 text-xs">
                <label className="block font-medium text-theme-text-secondary">Test Recipient Email</label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={e => setTestRecipient(e.target.value)}
                  placeholder="kayo2970@gmail.com"
                  className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingSmtp}
                className="w-full py-2.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isTestingSmtp ? 'animate-spin' : ''}`} />
                {isTestingSmtp ? 'Verifying SMTP Server...' : 'Test Connection & Send Email'}
              </button>

              {/* Diagnostic Test Output Card */}
              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-300 ${
                  testResult.success 
                    ? 'bg-success/10 border-success/30 text-theme-text-primary' 
                    : 'bg-danger/10 border-danger/30 text-theme-text-primary'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-danger shrink-0" />
                    )}
                    <span>{testResult.success ? 'SMTP Handshake Verified' : 'SMTP Handshake Error'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-theme-border/10 rounded-2xl border border-theme-border/20 space-y-2 text-[11px] text-theme-text-secondary">
              <span className="font-bold text-theme-text-primary block">💡 Setup Guide for Gmail / Workspace:</span>
              <p>1. Enable 2-Step Verification on your Google Account.</p>
              <p>2. Generate a 16-character <strong>App Password</strong> under Security.</p>
              <p>3. Paste the App Password into the Auth Secret field above.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Interactive Email Client & Custom Dispatcher */}
      {activeTab === 'client' && (
        <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 border border-theme-card-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme-border/20 pb-4">
            <div>
              <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
                <Send className="h-4 w-4 text-accent" />
                Email Dispatcher & Announcement Composer
              </h3>
              <p className="text-xs text-theme-text-secondary mt-0.5">
                Compose custom HTML/text email broadcasts to member divisions or individual recipients directly via your configured mail server.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewTab('edit')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  previewTab === 'edit' ? 'bg-accent text-white' : 'bg-theme-border/20 text-theme-text-secondary'
                }`}
              >
                Edit Content
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('preview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  previewTab === 'preview' ? 'bg-accent text-white' : 'bg-theme-border/20 text-theme-text-secondary'
                }`}
              >
                Live Preview
              </button>
            </div>
          </div>

          {previewTab === 'edit' ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Target Recipient Scope *</label>
                  <select
                    value={dispatchScope}
                    onChange={e => setDispatchScope(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-semibold"
                  >
                    <option value="SINGLE">Single Recipient Email</option>
                    <option value="All Members">All Members (Full Roster Broadcast)</option>
                    <option value="Core Committee">Core Committee</option>
                    <option value="Training Associate">Training Associates</option>
                    <option value="Advisory Board">Advisory Board</option>
                    <option value="Alumni">Alumni Roster</option>
                  </select>
                </div>

                {dispatchScope === 'SINGLE' ? (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-medium text-theme-text-secondary">Recipient Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customRecipient}
                      onChange={e => setCustomRecipient(e.target.value)}
                      placeholder="student@msruas.ac.in"
                      className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-medium text-theme-text-secondary">Category Tag</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="ANNOUNCEMENT">Announcement Broadcast</option>
                      <option value="DIRECT_MESSAGE">Direct Notification</option>
                      <option value="SYSTEM">System Broadcast</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block font-medium text-theme-text-secondary">Header Tag / Badge Style</label>
                  <select
                    value={badgeOption}
                    onChange={e => setBadgeOption(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="NONE">None (Clean Corporate Email - Recommended)</option>
                    <option value="INVITATION">🎉 Official Invitation</option>
                    <option value="ANNOUNCEMENT">📢 Official Announcement</option>
                    <option value="ACTION_REQUIRED">📌 Action Required</option>
                    <option value="IMPORTANT">⚠️ Important Notice</option>
                    <option value="CUSTOM">Custom Tag...</option>
                  </select>
                  {badgeOption === 'CUSTOM' && (
                    <input
                      type="text"
                      value={customBadgeText}
                      onChange={e => setCustomBadgeText(e.target.value)}
                      placeholder="Enter custom badge text (e.g. 🎓 Orientation 2026)"
                      className="w-full px-4 py-2 bg-theme-background/40 border border-theme-card-border rounded-xl text-xs text-theme-text-primary mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Subject Line *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. [LEADS Announcement] General Body Meeting Schedule & Deliverables"
                  className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Email Message Body *</label>
                <textarea
                  rows={8}
                  required
                  value={bodyText}
                  onChange={e => setBodyText(e.target.value)}
                  placeholder="Type message content here..."
                  className="w-full px-4 py-3 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  type="button"
                  disabled={!subject || !bodyText || (dispatchScope === 'SINGLE' && !customRecipient) || isSendingDispatch}
                  onClick={() => setShowDispatchConfirm(true)}
                  className="px-6 py-2.5 bg-accent hover:bg-primary-light text-white font-bold rounded-xl transition-all shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSendingDispatch ? 'Dispatching...' : 'Broadcast Email Payload'}
                </button>
              </div>
            </div>
          ) : (
            /* Live HTML Preview Box */
            <div className="space-y-4">
              <div className="p-4 bg-theme-background/60 border border-theme-card-border rounded-2xl space-y-3">
                <div className="border-b border-theme-border/20 pb-3 text-xs space-y-1">
                  <p className="text-theme-text-secondary">From: <strong className="text-theme-text-primary">{settings.fromName} &lt;{settings.fromEmail}&gt;</strong></p>
                  <p className="text-theme-text-secondary">To: <strong className="text-theme-text-primary">{dispatchScope === 'SINGLE' ? customRecipient || 'recipient@domain.com' : `[Broadcast Scope: ${dispatchScope}]`}</strong></p>
                  <p className="text-theme-text-secondary">Subject: <strong className="text-accent">{subject || 'No Subject Provided'}</strong></p>
                </div>
                
                <div className="p-6 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-4 text-xs font-sans">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-sky-400">{subject || 'Subject Line Preview'}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Sender: {settings.fromName}</p>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                    {bodyText || 'Your message text will appear here...'}
                  </div>
                  <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 text-center">
                    © 2026 {settings.fromName} · MSRUAS Internal Operations Portal
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Sent Outbox & System Logs */}
      {activeTab === 'outbox' && (
        <div className="glass-panel p-6 rounded-3xl space-y-5 border border-theme-card-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Sent Email Outbox & Diagnostic Logs
              </h3>
              <p className="text-xs text-theme-text-secondary">Audit history of every email notification, OTP, announcement, and custom message dispatched.</p>
            </div>

            <button
              onClick={fetchLogs}
              className="px-3 py-1.5 bg-theme-border/20 hover:bg-theme-border/40 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Logs
            </button>
          </div>

          {/* Outbox Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-theme-border/10 rounded-2xl border border-theme-border/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-secondary">Total Emails Dispatched</span>
              <h4 className="text-xl font-bold text-theme-text-primary">{totalLogs}</h4>
            </div>

            <div className="p-4 bg-success/10 rounded-2xl border border-success/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-success">Successful Deliveries</span>
              <h4 className="text-xl font-bold text-success">{sentCount}</h4>
            </div>

            <div className="p-4 bg-danger/10 rounded-2xl border border-danger/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-danger">Delivery Failures</span>
              <h4 className="text-xl font-bold text-danger">{failedCount}</h4>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-theme-text-secondary" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={e => setLogSearchQuery(e.target.value)}
                placeholder="Search by recipient or subject..."
                className="w-full pl-9 pr-3 py-1.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-theme-text-secondary font-medium">Filter Status:</span>
              <select
                value={logStatusFilter}
                onChange={e => setLogStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-xs text-theme-text-primary focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Sent Successfully</option>
                <option value="FAILED">Delivery Failed</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No email logs found"
              description="Email delivery attempts and system dispatches will appear here."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-theme-border/20">
              <table className="w-full text-left text-xs text-theme-text-primary">
                <thead className="bg-theme-border/15 text-[11px] uppercase tracking-wider text-theme-text-secondary border-b border-theme-border/20">
                  <tr>
                    <th className="p-3.5 font-bold">Status</th>
                    <th className="p-3.5 font-bold">Recipient</th>
                    <th className="p-3.5 font-bold">Subject</th>
                    <th className="p-3.5 font-bold">Category</th>
                    <th className="p-3.5 font-bold">Sent Date</th>
                    <th className="p-3.5 font-bold text-right">Inspect Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/15">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-theme-border/10 transition-colors">
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SENT' 
                            ? 'bg-success/15 text-success border border-success/20' 
                            : 'bg-danger/15 text-danger border border-danger/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-theme-text-primary">{log.to}</td>
                      <td className="p-3.5 max-w-xs truncate font-medium">{log.subject}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-md font-mono text-[10px]">
                          {log.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-theme-text-secondary text-[11px] whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-accent/15 hover:bg-accent/25 text-accent text-[11px] font-bold rounded-lg border border-accent/20 transition-all cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm Dispatch Modal */}
      {showDispatchConfirm && (
        <ConfirmModal
          isOpen={showDispatchConfirm}
          title="Confirm Email Dispatch"
          message={`Are you sure you want to dispatch this email broadcast? Target Scope: "${dispatchScope}". This will deliver emails through your configured SMTP server.`}
          confirmLabel="Execute Dispatch"
          cancelLabel="Cancel"
          onConfirm={handleExecuteDispatch}
          onCancel={() => setShowDispatchConfirm(false)}
        />
      )}

      {/* Inspect Email Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 space-y-5 border border-white/15 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-theme-border/20 pb-4">
              <div>
                <h3 className="text-base font-bold text-theme-text-primary">Email Payload Inspector</h3>
                <p className="text-xs text-theme-text-secondary mt-0.5">Log ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-theme-border/10 p-3.5 rounded-2xl border border-theme-border/20">
                <div>
                  <span className="text-[10px] text-theme-text-secondary block font-medium">To:</span>
                  <span className="font-bold text-theme-text-primary">{selectedLog.to}</span>
                </div>
                <div>
                  <span className="text-[10px] text-theme-text-secondary block font-medium">Status:</span>
                  <span className={`font-bold ${selectedLog.status === 'SENT' ? 'text-success' : 'text-danger'}`}>
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-theme-text-secondary block font-medium">Category:</span>
                  <span className="font-semibold text-accent">{selectedLog.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-theme-text-secondary block font-medium">Dispatched At:</span>
                  <span className="font-mono text-theme-text-primary">{new Date(selectedLog.sentAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-theme-text-primary block mb-1">Subject:</span>
                <div className="p-2.5 bg-theme-background/50 rounded-xl border border-theme-border/20 font-semibold text-accent">
                  {selectedLog.subject}
                </div>
              </div>

              {/* Diagnostics — "SENT" here only means the SMTP server accepted the
                  message for delivery, not that it actually reached the inbox.
                  This is the raw server response, so "sent but never arrives"
                  can be diagnosed without shell access to the mail server. */}
              {selectedLog.errorMessage && (
                <div>
                  <span className="font-bold text-danger block mb-1">Error:</span>
                  <div className="p-2.5 bg-danger/10 border border-danger/25 rounded-xl text-danger font-mono text-[11px] whitespace-pre-wrap">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}
              {selectedLog.smtpResponse && (
                <div>
                  <span className="font-bold text-theme-text-primary block mb-1">SMTP Server Response:</span>
                  <div className="p-2.5 bg-theme-background/50 rounded-xl border border-theme-border/20 font-mono text-[11px] text-theme-text-secondary">
                    {selectedLog.smtpResponse}
                  </div>
                </div>
              )}
              {selectedLog.rejectedRecipients && selectedLog.rejectedRecipients.length > 0 && (
                <div>
                  <span className="font-bold text-warning block mb-1">Rejected Recipients:</span>
                  <div className="p-2.5 bg-warning/10 border border-warning/25 rounded-xl text-warning font-mono text-[11px]">
                    {selectedLog.rejectedRecipients.join(', ')}
                  </div>
                </div>
              )}

              <div>
                <span className="font-bold text-theme-text-primary block mb-1">Raw Body Content:</span>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedLog.bodyText}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-theme-border/20">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
