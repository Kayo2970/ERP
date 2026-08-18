'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  X, 
  Mail, 
  CheckCircle, 
  ChevronRight, 
  Play, 
  Terminal, 
  Edit2, 
  Trash2, 
  Info,
  Clock,
  Send
} from 'lucide-react';
import { 
  getAnnouncements, 
  addAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement, 
  getMembers, 
  getCommittees, 
  AnnouncementItem, 
  Member 
} from '@/lib/local-data';
import { canCreateAnnouncement } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [committees, setCommittees] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  // Modals & Active Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState('All Members');
  
  // Email Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [emailRecipients, setEmailRecipients] = useState<Member[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const refreshData = () => {
      setAnnouncements(getAnnouncements());
      setCommittees(getCommittees());
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
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenCreate = () => {
    setTitle('');
    setContent('');
    setScope('All Members');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ann: AnnouncementItem) => {
    setEditingAnnouncement(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setScope(ann.scope);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !user) return;

    if (editingAnnouncement) {
      updateAnnouncement(editingAnnouncement.id, {
        title,
        content,
        scope,
      }, user.name);
      triggerSuccess('Announcement updated.');
      setEditingAnnouncement(null);
    } else {
      addAnnouncement({
        title,
        content,
        scope,
        authorName: user.name
      });

      // Calculate email recipients based on scope
      const allMembers = getMembers();
      let recipients: Member[] = [];

      if (scope === 'All Members') {
        recipients = allMembers;
      } else if (scope === 'Advisory Board') {
        recipients = allMembers.filter(m => m.tier === 4);
      } else if (scope === 'Core Committee') {
        recipients = allMembers.filter(m => m.tier === 5);
      } else if (scope === 'Training Associate') {
        recipients = allMembers.filter(m => m.tier === 6);
      } else if (scope === 'Executive Council') {
        recipients = allMembers.filter(m => m.committee === 'Executive Council');
      } else {
        // Specific committee
        recipients = allMembers.filter(m => m.committee === scope || m.committee === 'All Committees');
      }

      setEmailRecipients(recipients);
      setIsModalOpen(false);

      // Open Email Dispatch Simulator
      setIsSimulatorOpen(true);
      setSimulatedLogs([`[System] Initializing simulation dispatch queue for target scope: "${scope}" (${recipients.length} members queued)...`]);
    }

    setAnnouncements(getAnnouncements());
  };

  const startEmailDispatch = () => {
    setIsDispatching(true);
    let logIndex = 0;

    const interval = setInterval(() => {
      if (logIndex < emailRecipients.length) {
        const r = emailRecipients[logIndex];
        setSimulatedLogs(prev => [
          ...prev,
          `[Email Dispatcher] Sent notification email to "${r.name}" (${r.email}) - SUCCESS`
        ]);
        logIndex++;
      } else {
        clearInterval(interval);
        setSimulatedLogs(prev => [
          ...prev,
          `[System] Simulated dispatch sequence completed. Total notifications simulated: ${emailRecipients.length}`
        ]);
        setIsDispatching(false);
      }
    }, 250);
  };

  const closeSimulator = () => {
    setTitle('');
    setContent('');
    setScope('All Members');
    setIsSimulatorOpen(false);
    setSimulatedLogs([]);
    setEmailRecipients([]);
  };

  const handleConfirmDelete = () => {
    if (!deletingAnnouncementId) return;
    deleteAnnouncement(deletingAnnouncementId, user?.name || 'User');
    setDeletingAnnouncementId(null);
    setAnnouncements(getAnnouncements());
    triggerSuccess('Announcement retracted.');
  };

  const canPublish = canCreateAnnouncement(user);

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Center Announcements</h1>
          <p className="text-xs text-theme-text-secondary">Publish center circulars and simulate targeted committee email broadcasts</p>
        </div>
        {canPublish && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        )}
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements published"
            description="Broadcast center updates, meeting notifications, or financial deadlines."
            actionLabel={canPublish ? "Publish Announcement" : undefined}
            onAction={canPublish ? handleOpenCreate : undefined}
          />
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="glass-panel rounded-2xl p-6 flex flex-col space-y-3 hover:bg-theme-border/10 transition-all border border-theme-card-border/50 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-sm text-theme-text-primary">{ann.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                    {ann.scope}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-theme-text-secondary text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ann.publishedAt}
                  </span>
                  <span>by <strong className="text-theme-text-primary">{ann.authorName}</strong></span>
                </div>
              </div>

              <p className="text-xs text-theme-text-secondary leading-relaxed bg-theme-background/20 p-3 rounded-xl border border-theme-border/20">
                {ann.content}
              </p>

              {ann.editedAt && (
                <span className="text-[10px] text-theme-text-secondary italic">
                  Last edited: {ann.editedAt}
                </span>
              )}

              {canPublish && (
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleOpenEdit(ann)}
                    className="p-1 hover:bg-theme-border/30 rounded text-theme-text-secondary hover:text-accent transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingAnnouncementId(ann.id)}
                    className="p-1 hover:bg-danger/10 rounded text-danger transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 className="h-3 w-3" /> Retract
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Announcement Modal */}
      {(isModalOpen || editingAnnouncement) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">
                {editingAnnouncement ? 'Edit Announcement' : 'Publish New Announcement'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Announcement Subject *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Financial Reconciliation Window Open"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Target Committee / Role Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="All Members">All Center Members</option>
                  <option value="Advisory Board">Advisory Board (Tier 4)</option>
                  <option value="Core Committee">Core Committee (Tier 5)</option>
                  <option value="Training Associate">Training Associates (Tier 6)</option>
                  <option value="Executive Council">Executive Council (Leadership)</option>
                  {committees.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Announcement Message Content *</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write clear instructions, deadlines, or meeting links..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                {editingAnnouncement ? 'Save Updates' : 'Publish & Launch Simulator'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Email Dispatch Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 flex flex-col space-y-4 relative border border-white/20 shadow-2xl bg-zinc-900/90 text-white">
            
            {/* Simulator Header & Disclaimer */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-accent" />
                  <h3 className="text-sm font-bold text-white">Email Dispatch Simulator</h3>
                </div>
                <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-md text-[10px] font-semibold">
                  <Info className="h-3 w-3 shrink-0" />
                  <span>Simulated Test Mode — No external email servers are contacted</span>
                </div>
              </div>
              <button 
                onClick={closeSimulator}
                disabled={isDispatching}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-1">
              <p>Target Scope: <strong className="text-accent">{scope}</strong></p>
              <p>Queued Recipients: <strong className="text-white">{emailRecipients.length} members</strong></p>
            </div>

            {/* Terminal output box */}
            <div className="h-48 bg-black/70 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1">
              {simulatedLogs.map((log, i) => (
                <div key={i} className="leading-snug">{log}</div>
              ))}
              {isDispatching && (
                <div className="animate-pulse text-accent">&gt; Dispatching payload packets...</div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={closeSimulator}
                disabled={isDispatching}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-30"
              >
                Close Simulator
              </button>
              
              {!isDispatching && simulatedLogs.length <= 1 && (
                <button
                  onClick={startEmailDispatch}
                  className="px-4 py-2 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" />
                  Run Broadcast Simulation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingAnnouncementId)}
        title="Retract Announcement"
        message="Are you sure you want to retract and remove this announcement from the public dashboard feed?"
        confirmLabel="Retract"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingAnnouncementId(null)}
      />

    </div>
  );
}
