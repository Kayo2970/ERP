'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  X,
  CheckCircle,
  Play,
  Terminal,
  Edit2,
  Trash2,
  Info,
  Clock,
  Search,
  Users,
  CheckSquare,
  Square,
  Calendar,
  UserCheck
} from 'lucide-react';
import { 
  getAnnouncements, 
  addAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement,
  approveAnnouncement,
  rejectAnnouncement,
  getMembers, 
  getEvents,
  getCommittees, 
  AnnouncementItem, 
  Member,
  EventItem
} from '@/lib/local-data';
import { isCentreHead, canCreateAnnouncement, canApproveAnnouncement } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [committees, setCommittees] = useState<string[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [user, setUser] = useState<any>(null);

  // Modals & Active Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetCategory, setTargetCategory] = useState<string>('All Members');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberQuery, setMemberQuery] = useState<string>('');
  
  // Email Simulator & Dispatcher State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [emailRecipients, setEmailRecipients] = useState<Member[]>([]);
  const [finalScopeLabel, setFinalScopeLabel] = useState<string>('All Members');
  const [isDispatching, setIsDispatching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Deep link from a notification (?highlight=<announcementId>) — scroll to it once
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [hasScrolledToHighlight, setHasScrolledToHighlight] = useState(false);

  useEffect(() => {
    const refreshData = () => {
      setAnnouncements(getAnnouncements());
      setCommittees(getCommittees());
      const evList = getEvents();
      setEvents(evList);
      const memList = getMembers();
      setAllMembers(memList);

      if (evList.length > 0 && !selectedEventId) {
        setSelectedEventId(evList[0].id);
        if (evList[0].committees && evList[0].committees.length > 0) {
          setSelectedCommitteeId(evList[0].committees[0].id);
        }
      }
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
    const el = document.getElementById(`announcement-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHasScrolledToHighlight(true);
    }
  }, [announcements, highlightId, hasScrolledToHighlight]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenCreate = () => {
    setTitle('');
    setContent('');
    setTargetCategory('All Members');
    if (events.length > 0) {
      setSelectedEventId(events[0].id);
      if (events[0].committees && events[0].committees.length > 0) {
        setSelectedCommitteeId(events[0].committees[0].id);
      }
    }
    setSelectedMemberIds([]);
    setMemberQuery('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ann: AnnouncementItem) => {
    setEditingAnnouncement(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setTargetCategory('All Members');
  };

  const handleApproveAnnouncement = (id: string) => {
    const updated = approveAnnouncement(id, user?.name || 'Centre Head / GG Campus Events Head');
    if (updated) {
      setAnnouncements(getAnnouncements());

      // Resolve recipient list from announcement scope
      let recipients: Member[] = [];
      const scopeStr = updated.scope || 'All Members';

      if (scopeStr.includes('Specific Member')) {
        recipients = allMembers;
      } else if (scopeStr.includes('→')) {
        const parts = scopeStr.split('→').map(s => s.trim());
        const eventMatch = events.find(e => e.title.toLowerCase().includes(parts[0].toLowerCase()));
        const commMatch = eventMatch?.committees.find(c => c.name.toLowerCase().includes(parts[1].toLowerCase()));
        if (commMatch) {
          const idSet = new Set(commMatch.memberIds || []);
          if (commMatch.leadMemberId) idSet.add(commMatch.leadMemberId);
          recipients = allMembers.filter(m => idSet.has(m.id));
        }
      } else if (scopeStr === 'Advisory Board') {
        recipients = allMembers.filter(m => m.tier === 4);
      } else if (scopeStr === 'Core Committee') {
        recipients = allMembers.filter(m => m.tier === 5);
      } else if (scopeStr === 'Training Associates' || scopeStr === 'Training Associate') {
        recipients = allMembers.filter(m => m.tier === 6);
      } else if (scopeStr === 'Faculty Members' || scopeStr === 'Faculty') {
        recipients = allMembers.filter(m => m.division === 'Faculty');
      } else if (scopeStr === 'Executive Leadership' || scopeStr === 'Executive Council') {
        recipients = allMembers.filter(m => m.tier <= 2 || m.role.toLowerCase().includes('president') || m.role.toLowerCase().includes('secretary'));
      } else {
        recipients = allMembers;
      }

      setTitle(updated.title);
      setContent(updated.content);
      setEmailRecipients(recipients);
      setFinalScopeLabel(scopeStr);
      setIsSimulatorOpen(true);
      setSimulatedLogs([`[System] Announcement "${updated.title}" approved by ${user?.name || 'Leadership'}. Ready to circulate to ${recipients.length} queued recipient(s)...`]);
      triggerSuccess(`✔ Announcement "${updated.title}" approved! Dispatcher opened to circulate emails.`);
    }
  };

  const handleRejectAnnouncement = (id: string) => {
    const updated = rejectAnnouncement(id, user?.name || 'Centre Head / GG Campus Events Head');
    if (updated) {
      triggerSuccess(`Announcement submission rejected.`);
      setAnnouncements(getAnnouncements());
    }
  };

  // Helper to compute target recipient list and display scope string
  const computeTargetRecipients = () => {
    let recipients: Member[] = [];
    let scopeLabel = targetCategory;

    if (targetCategory === 'All Members') {
      recipients = allMembers;
      scopeLabel = 'All Center Members';
    } else if (targetCategory === 'Advisory Board') {
      recipients = allMembers.filter(m => m.tier === 4);
      scopeLabel = 'Advisory Board';
    } else if (targetCategory === 'Core Committee') {
      recipients = allMembers.filter(m => m.tier === 5);
      scopeLabel = 'Core Committee';
    } else if (targetCategory === 'Training Associate') {
      recipients = allMembers.filter(m => m.tier === 6);
      scopeLabel = 'Training Associates';
    } else if (targetCategory === 'Faculty') {
      recipients = allMembers.filter(m => m.division === 'Faculty');
      scopeLabel = 'Faculty Members';
    } else if (targetCategory === 'Executive Council') {
      recipients = allMembers.filter(m => m.tier <= 2 || m.role.toLowerCase().includes('president') || m.role.toLowerCase().includes('secretary'));
      scopeLabel = 'Executive Leadership';
    } else if (targetCategory === 'Event Committee') {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      const selectedComm = selectedEvent?.committees.find(c => c.id === selectedCommitteeId);
      if (selectedEvent && selectedComm) {
        const idSet = new Set(selectedComm.memberIds || []);
        if (selectedComm.leadMemberId) idSet.add(selectedComm.leadMemberId);
        recipients = allMembers.filter(m => idSet.has(m.id));
        scopeLabel = `${selectedEvent.title} → ${selectedComm.name}`;
      } else if (selectedEvent) {
        scopeLabel = `Event: ${selectedEvent.title}`;
        recipients = allMembers;
      }
    } else if (targetCategory === 'Specific Members') {
      const idSet = new Set(selectedMemberIds);
      recipients = allMembers.filter(m => idSet.has(m.id));
      scopeLabel = `${recipients.length} Specific Member(s)`;
    }

    return { recipients, scopeLabel };
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !user) return;

    const { recipients, scopeLabel } = computeTargetRecipients();

    if (editingAnnouncement) {
      updateAnnouncement(editingAnnouncement.id, {
        title,
        content,
        scope: scopeLabel,
      }, user.name);
      triggerSuccess('Announcement updated.');
      setEditingAnnouncement(null);
    } else {
      const isApproved = canApproveAnnouncement(user);

      addAnnouncement({
        title,
        content,
        scope: scopeLabel,
        authorName: user.name,
        status: isApproved ? 'Approved' : 'Pending Approval',
      });

      if (!isApproved) {
        triggerSuccess('Announcement submitted! Awaiting approval by the Centre Head or GG Campus Events Head before circulation.');
        setIsModalOpen(false);
        setAnnouncements(getAnnouncements());
        return;
      }

      setEmailRecipients(recipients);
      setFinalScopeLabel(scopeLabel);
      setIsModalOpen(false);

      // Open Email Dispatch Simulator
      setIsSimulatorOpen(true);
      setSimulatedLogs([`[System] Initializing announcement dispatch queue for scope: "${scopeLabel}" (${recipients.length} recipients queued)...`]);
    }

    setAnnouncements(getAnnouncements());
  };

  const startEmailDispatch = async () => {
    setIsDispatching(true);
    let logIndex = 0;

    for (const r of emailRecipients) {
      try {
        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: 'SINGLE',
            recipientEmail: r.email,
            subject: `Announcement: ${title}`,
            bodyText: `Dear ${r.name},\n\n${content}\n\nRegards,\nLEADS Next Gen Centre`,
            category: 'ANNOUNCEMENT',
            badgeText: 'ANNOUNCEMENT',
            badgeColor: '#6366f1',
          }),
        });

        setSimulatedLogs(prev => [
          ...prev,
          `[Email Dispatcher] Dispatched notification email to "${r.name}" (${r.email}) - SENT SUCCESS`
        ]);
      } catch {
        setSimulatedLogs(prev => [
          ...prev,
          `[Email Dispatcher] Dispatched notification email to "${r.name}" (${r.email}) - QUEUED`
        ]);
      }

      logIndex++;
      await new Promise(res => setTimeout(res, 200));
    }

    setSimulatedLogs(prev => [
      ...prev,
      `[System] Dispatch sequence completed. Total announcement notifications sent: ${emailRecipients.length}`
    ]);
    setIsDispatching(false);
  };

  const closeSimulator = () => {
    setTitle('');
    setContent('');
    setTargetCategory('All Members');
    setSelectedMemberIds([]);
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

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const filteredMembers = allMembers.filter(m => {
    const q = memberQuery.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.role || '').toLowerCase().includes(q) || (m.department || '').toLowerCase().includes(q);
  });

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const canPublish = canCreateAnnouncement(user);
  const canApprove = canApproveAnnouncement(user);

  const displayedAnnouncements = announcements.filter(ann => {
    if (canApprove) return true;
    if (user && ann.authorName.toLowerCase() === user.name.toLowerCase()) return true;
    return !ann.status || ann.status === 'Approved';
  });

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
          <p className="text-xs text-theme-text-secondary">Publish center circulars and broadcast targeted announcements to committees and specific members</p>
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
        {displayedAnnouncements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements published"
            description="Broadcast center updates, meeting notifications, or financial deadlines."
            actionLabel={canPublish ? "Publish Announcement" : undefined}
            onAction={canPublish ? handleOpenCreate : undefined}
          />
        ) : (
          displayedAnnouncements.map((ann) => (
            <div
              key={ann.id}
              id={`announcement-${ann.id}`}
              className={`glass-panel rounded-2xl p-6 flex flex-col space-y-3 hover:bg-theme-border/10 transition-all border text-xs ${
                ann.id === highlightId ? 'border-accent ring-2 ring-accent/50' : 'border-theme-card-border/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center flex-wrap gap-2.5">
                  <h3 className="font-bold text-sm text-theme-text-primary">{ann.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                    {ann.scope}
                  </span>
                  {ann.status === 'Pending Approval' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
                      Pending Centre Head Approval
                    </span>
                  )}
                  {ann.status === 'Approved' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                      Approved & Published
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-theme-text-secondary text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ann.publishedAt}
                  </span>
                  <span>by <strong className="text-theme-text-primary">{ann.authorName}</strong></span>
                </div>
              </div>

              <p className="text-xs text-theme-text-secondary leading-relaxed bg-theme-background/20 p-3 rounded-xl border border-theme-border/20 whitespace-pre-wrap">
                {ann.content}
              </p>

              {ann.editedAt && (
                <span className="text-[10px] text-theme-text-secondary italic">
                  Last edited: {ann.editedAt}
                </span>
              )}

              {canApprove && ann.status === 'Pending Approval' && (
                <div className="flex items-center gap-2 pt-2 border-t border-theme-border/20">
                  <button
                    onClick={() => handleApproveAnnouncement(ann.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve & Publish
                  </button>
                  <button
                    onClick={() => handleRejectAnnouncement(ann.id)}
                    className="px-3 py-1.5 bg-danger hover:bg-danger/90 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
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
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  placeholder="e.g. Committee Meeting & Deliverable Notice"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Target Scope Category Selection */}
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Target Recipient Audience</label>
                <select
                  value={targetCategory}
                  onChange={(e) => {
                    setTargetCategory(e.target.value);
                    if (e.target.value === 'Event Committee' && events.length > 0) {
                      setSelectedEventId(events[0].id);
                      if (events[0].committees && events[0].committees.length > 0) {
                        setSelectedCommitteeId(events[0].committees[0].id);
                      }
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-semibold"
                >
                  <option value="All Members">All Center Members</option>
                  <option value="Faculty">Faculty Members</option>
                  <option value="Advisory Board">Advisory Board (Tier 4)</option>
                  <option value="Core Committee">Core Committee (Tier 5)</option>
                  <option value="Training Associate">Training Associates (Tier 6)</option>
                  <option value="Executive Council">Executive Leadership</option>
                  <option value="Event Committee">Event Committee (Sub-menu: Select Event & Committee)</option>
                  <option value="Specific Members">Specific Members (Pick from Member Logbook Roster)</option>
                </select>
              </div>

              {/* Sub-Menu: Event -> Committee Selection */}
              {targetCategory === 'Event Committee' && (
                <div className="p-3.5 bg-accent/5 border border-accent/20 rounded-2xl space-y-3">
                  <div className="space-y-1">
                    <label className="flex items-center gap-1.5 font-semibold text-accent">
                      <Calendar className="h-3.5 w-3.5" />
                      1. Select Event *
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => {
                        const evId = e.target.value;
                        setSelectedEventId(evId);
                        const match = events.find(ev => ev.id === evId);
                        if (match && match.committees && match.committees.length > 0) {
                          setSelectedCommitteeId(match.committees[0].id);
                        } else {
                          setSelectedCommitteeId('');
                        }
                      }}
                      className="w-full px-3.5 py-2 bg-theme-background/50 border border-accent/30 rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-medium"
                    >
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-1.5 font-semibold text-accent">
                      <Users className="h-3.5 w-3.5" />
                      2. Select Sub-Committee *
                    </label>
                    <select
                      value={selectedCommitteeId}
                      onChange={(e) => setSelectedCommitteeId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-theme-background/50 border border-accent/30 rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-medium"
                    >
                      {selectedEvent && selectedEvent.committees && selectedEvent.committees.length > 0 ? (
                        selectedEvent.committees.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.memberIds?.length || 0} members)</option>
                        ))
                      ) : (
                        <option value="">No committees setup for this event</option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* Sub-Menu: Specific Members Roster Selection */}
              {targetCategory === 'Specific Members' && (
                <div className="p-3.5 bg-accent/5 border border-accent/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 font-semibold text-accent">
                      <Users className="h-3.5 w-3.5" />
                      Pick Specific Members from Roster Logbook
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                      {selectedMemberIds.length} Selected
                    </span>
                  </div>

                  {/* Search input */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-background/50 border border-theme-card-border rounded-xl">
                    <Search className="h-3.5 w-3.5 text-theme-text-secondary shrink-0" />
                    <input
                      type="text"
                      value={memberQuery}
                      onChange={(e) => setMemberQuery(e.target.value)}
                      placeholder="Search by name, email, role, or department..."
                      className="w-full bg-transparent border-0 focus:outline-none text-theme-text-primary placeholder-theme-text-secondary text-xs"
                    />
                  </div>

                  {/* Quick Select All / Clear */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberIds(Array.from(new Set([...selectedMemberIds, ...filteredMembers.map(m => m.id)])))}
                      className="text-accent hover:underline font-medium cursor-pointer"
                    >
                      Select All Filtered ({filteredMembers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMemberIds([])}
                      className="text-theme-text-secondary hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>

                  {/* Roster Checkbox List */}
                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1 divide-y divide-theme-border/20">
                    {filteredMembers.length === 0 ? (
                      <p className="text-center py-3 text-theme-text-secondary">No members match your search.</p>
                    ) : (
                      filteredMembers.map(m => {
                        const isChecked = selectedMemberIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleSelectMember(m.id)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                              isChecked ? 'bg-accent/15 border border-accent/30' : 'hover:bg-theme-border/20'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-accent shrink-0" />
                              ) : (
                                <Square className="h-4 w-4 text-theme-text-secondary shrink-0" />
                              )}
                              <div>
                                <span className="font-bold text-theme-text-primary block">{m.name}</span>
                                <span className="text-[10px] text-theme-text-secondary block">{m.email}</span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-border/30 text-theme-text-secondary shrink-0">
                              {m.role || m.division}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

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
                {editingAnnouncement ? 'Save Updates' : 'Publish & Dispatch Announcement'}
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
                  <h3 className="text-sm font-bold text-white">Announcement Email Broadcast Dispatcher</h3>
                </div>
                <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 bg-accent/20 border border-accent/30 text-accent rounded-md text-[10px] font-semibold">
                  <Info className="h-3 w-3 shrink-0" />
                  <span>Targeted Announcement Broadcast & Email Notification Engine</span>
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
              <p>Target Scope: <strong className="text-accent">{finalScopeLabel}</strong></p>
              <p>Queued Recipients: <strong className="text-white">{emailRecipients.length} members</strong></p>
            </div>

            {/* Terminal output box */}
            <div className="h-48 bg-black/70 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1">
              {simulatedLogs.map((log, i) => (
                <div key={i} className="leading-snug">{log}</div>
              ))}
              {isDispatching && (
                <div className="animate-pulse text-accent">&gt; Dispatching announcement emails...</div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={closeSimulator}
                disabled={isDispatching}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-30"
              >
                Close Dispatcher
              </button>
              
              {!isDispatching && (
                <button
                  onClick={startEmailDispatch}
                  className="px-4 py-2 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" />
                  Send Announcement Emails
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
