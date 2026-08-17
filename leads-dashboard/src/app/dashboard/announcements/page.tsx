'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, X, Mail, CheckCircle, ChevronRight, Play, Terminal } from 'lucide-react';
import { getMembers, Member } from '@/lib/local-data';

interface Announcement {
  id: string;
  title: string;
  body: string;
  scope: string;
  date: string;
  author: string;
}

const initialAnnouncements: Announcement[] = [
  { id: '1', title: 'Q3 Performance Evaluation Ratings Published', body: 'Faculty advisors have updated individual and committee ratings for the Q3 events cycle. Check your rating card.', date: 'Today, 10:30 AM', scope: 'All', author: 'Dr. Kiran Kumar B M' },
  { id: '2', title: 'Reimbursement Claims Deadline - August Cycle', body: 'All expense claims and receipts for events conducted in July/August must be submitted by August 24th.', date: 'Yesterday', scope: 'Core Committee', author: 'Dr. Subhadeep Mukherjee' },
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scope, setScope] = useState<'All' | 'Core Committee' | 'Training Associate' | 'Executive Council'>('All');
  
  // Email Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [emailRecipients, setEmailRecipients] = useState<Member[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    const savedAnnouncements = localStorage.getItem('leads_announcements');
    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements));
    } else {
      localStorage.setItem('leads_announcements', JSON.stringify(initialAnnouncements));
      setAnnouncements(initialAnnouncements);
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body || !user) return;

    // 1. Save announcement locally
    const newAnnouncement: Announcement = {
      id: 'a_' + Date.now(),
      title,
      body,
      scope,
      date: 'Just now',
      author: user.name
    };

    const updated = [newAnnouncement, ...announcements];
    localStorage.setItem('leads_announcements', JSON.stringify(updated));
    setAnnouncements(updated);

    // 2. Calculate email recipients based on scope
    const allMembers = getMembers();
    let recipients: Member[] = [];

    if (scope === 'All') {
      recipients = allMembers;
    } else if (scope === 'Core Committee') {
      recipients = allMembers.filter(m => m.tier === 5);
    } else if (scope === 'Training Associate') {
      recipients = allMembers.filter(m => m.tier === 6);
    } else if (scope === 'Executive Council') {
      recipients = allMembers.filter(m => m.committee === 'Executive Council');
    }

    setEmailRecipients(recipients);
    setIsModalOpen(false);

    // 3. Open Email Dispatch Simulator
    setIsSimulatorOpen(true);
    setSimulatedLogs([`[System] Initializing dispatch queue for scope: "${scope}"...`]);
  };

  const startEmailDispatch = () => {
    setIsDispatching(true);
    let logIndex = 0;

    const interval = setInterval(() => {
      if (logIndex < emailRecipients.length) {
        const r = emailRecipients[logIndex];
        setSimulatedLogs(prev => [
          ...prev,
          `[Email System] Dispatched mail to "${r.name}" (${r.email}) - SUCCESS`
        ]);
        logIndex++;
      } else {
        clearInterval(interval);
        setSimulatedLogs(prev => [
          ...prev,
          `[System] Dispatch completed successfully. Total emails sent: ${emailRecipients.length}`
        ]);
        setIsDispatching(false);
      }
    }, 400); // Fast email sending simulation
  };

  const closeSimulator = () => {
    // Reset Form fields
    setTitle('');
    setBody('');
    setScope('All');
    setIsSimulatorOpen(false);
    setSimulatedLogs([]);
    setEmailRecipients([]);
  };

  // Check if current user is admin (Tiers 1-3 & 5)
  const canPublish = user && (user.tier <= 3 || user.tier === 5);

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Center Announcements</h1>
          <p className="text-xs text-theme-text-secondary">Publish announcements and dispatch notification emails to target committees</p>
        </div>
        {canPublish && (
          <button
            onClick={() => setIsModalOpen(true)}
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
          <div className="glass-panel rounded-2xl p-12 text-center text-theme-text-secondary text-sm">
            No active announcements recorded.
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row gap-4 justify-between border border-theme-card-border/50 hover:bg-theme-border/10 transition-all duration-300">
              <div className="space-y-3 flex-1">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-accent font-bold px-2.5 py-0.5 bg-accent/15 rounded-md uppercase text-[10px] tracking-wider">
                    {ann.scope}
                  </span>
                  <span className="text-theme-text-secondary font-medium">{ann.date}</span>
                </div>
                <h3 className="font-bold text-base text-theme-text-primary leading-tight">{ann.title}</h3>
                <p className="text-xs text-theme-text-secondary leading-relaxed max-w-4xl">{ann.body}</p>
              </div>

              <div className="md:text-right text-xs text-theme-text-secondary shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-theme-border/20 flex flex-row md:flex-col justify-between items-center md:items-end gap-1">
                <span className="font-semibold text-theme-text-primary flex items-center gap-1">
                  <Megaphone className="h-4 w-4 text-accent" />
                  {ann.author}
                </span>
                <span className="text-[10px]">Portal Publisher</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-6 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">Publish New Announcement</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mandatory Assembly Meet - August 20"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Target Recipient Scope (Emailed)</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="All">All Center Members</option>
                  <option value="Core Committee">Core Committee (Tier 5)</option>
                  <option value="Training Associate">Training Associates (Tier 6)</option>
                  <option value="Executive Council">Executive Council Advisors</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Announcement Body Details</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Provide complete announcement description..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4 flex items-center justify-center gap-1.5"
              >
                <Mail className="h-4.5 w-4.5" />
                Post Announcement & Draft Emails
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Email Simulator Dispatch Panel */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 flex flex-col space-y-6 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-accent animate-pulse" />
                <h2 className="text-base font-bold text-theme-text-primary">Email Dispatch Simulator</h2>
              </div>
              {!isDispatching && (
                <button 
                  onClick={closeSimulator}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Email Draft Preview Card */}
            <div className="border border-theme-border/30 rounded-xl p-4 bg-theme-background/20 text-xs space-y-3">
              <div className="flex justify-between border-b border-theme-border/20 pb-2 text-[10px] text-theme-text-secondary">
                <span><strong>From:</strong> LEADS Next Gen Ops (noreply@leads.msruas.ac.in)</span>
                <span><strong>Subject:</strong> [LEADS Announcement] {title}</span>
              </div>
              <div className="space-y-2 text-theme-text-secondary leading-relaxed">
                <p>Dear [Recipient Name],</p>
                <p>A new announcement was posted on the LEADS portal by <strong>{user?.name}</strong>:</p>
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg text-theme-text-primary italic">
                  {body}
                </div>
                <p className="text-[10px]">Log in to your workspace dashboard to acknowledge actions or tasks.</p>
              </div>
            </div>

            {/* Simulated terminal logs */}
            <div className="bg-black/85 text-xs text-green-400 font-mono p-4 rounded-xl space-y-1.5 h-48 overflow-y-auto border border-white/10 flex flex-col justify-start">
              <div className="flex items-center gap-1.5 border-b border-white/10 pb-1 mb-1 text-[10px] text-white">
                <Terminal className="h-3.5 w-3.5" />
                <span>Simulated Mail Server Console Logs</span>
              </div>
              {simulatedLogs.map((log, index) => (
                <p key={index} className="leading-relaxed">{log}</p>
              ))}
              {isDispatching && (
                <p className="animate-pulse text-yellow-400">Processing dispatch...</p>
              )}
            </div>

            {/* Dispatch Triggers */}
            <div className="flex gap-3 justify-end text-xs">
              <span className="text-theme-text-secondary font-medium flex items-center mr-auto">
                Recipients: {emailRecipients.length} users targetted
              </span>
              
              {!isDispatching && simulatedLogs.length === 1 ? (
                <button
                  onClick={startEmailDispatch}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-accent hover:bg-primary-light text-white font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-accent/15"
                >
                  <Play className="h-4 w-4" />
                  Trigger Dispatch
                </button>
              ) : !isDispatching && (
                <button
                  onClick={closeSimulator}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-success hover:bg-success-light text-white font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-success/15"
                >
                  <CheckCircle className="h-4 w-4" />
                  Close Simulator
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
