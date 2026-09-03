'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCheck, Check, X, Clock, Inbox, Send, CheckSquare, Calendar, Users } from 'lucide-react';
import {
  getApprovalRequests,
  decideApprovalRequest,
  deleteApprovalRequest,
  ApprovalRequest,
} from '@/lib/local-data';
import { EmptyState } from '@/components/ui/empty-state';

type Tab = 'inbox' | 'sent';

const entityIcon = (type: ApprovalRequest['entityType']) => {
  if (type === 'task') return CheckSquare;
  if (type === 'event') return Calendar;
  return Users;
};

const entityLink = (req: ApprovalRequest) => {
  if (req.entityType === 'task') return '/dashboard/tasks';
  if (req.entityType === 'event') return `/dashboard/events/${req.entityId}`;
  if (req.entityType === 'member') return '/dashboard/directory';
  return req.eventId ? `/dashboard/events/${req.eventId}` : '/dashboard/events';
};

const statusBadge = (status: ApprovalRequest['status']) => {
  if (status === 'approved') return 'bg-success/15 text-success border-success/30';
  if (status === 'rejected') return 'bg-danger/15 text-danger border-danger/30';
  return 'bg-warning/15 text-warning border-warning/30';
};

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('inbox');
  const [successMsg, setSuccessMsg] = useState('');
  const [decisionNoteFor, setDecisionNoteFor] = useState<{ id: string; decision: 'approved' | 'rejected' } | null>(null);
  const [decisionNoteInput, setDecisionNoteInput] = useState('');

  useEffect(() => {
    const refreshData = () => setRequests(getApprovalRequests());
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

  const inboxRequests = requests.filter(r => user && r.targetMemberId === user.id);
  const sentRequests = requests.filter(r => user && r.requesterId === user.id);
  const list = tab === 'inbox' ? inboxRequests : sentRequests;
  const pendingInboxCount = inboxRequests.filter(r => r.status === 'pending').length;

  const handleDecide = (id: string, decision: 'approved' | 'rejected', note?: string) => {
    decideApprovalRequest(id, decision, user?.name || 'User', note);
    setDecisionNoteFor(null);
    setDecisionNoteInput('');
    triggerSuccess(decision === 'approved' ? 'Request approved.' : 'Request rejected.');
  };

  const handleWithdraw = (id: string) => {
    deleteApprovalRequest(id, user?.name || 'User');
    triggerSuccess('Request withdrawn.');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <Check className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-theme-text-primary flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-accent" />
          Approvals
        </h1>
        <p className="text-xs text-theme-text-secondary">Requests to sign off on a task, committee, or event — sent to or by you directly</p>
      </div>

      <div className="flex items-center gap-2 border-b border-theme-border/20">
        <button
          onClick={() => setTab('inbox')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${tab === 'inbox' ? 'border-accent text-accent' : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'}`}
        >
          <Inbox className="h-3.5 w-3.5" />
          Awaiting My Decision
          {pendingInboxCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold">{pendingInboxCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${tab === 'sent' ? 'border-accent text-accent' : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'}`}
        >
          <Send className="h-3.5 w-3.5" />
          Sent By Me
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={tab === 'inbox' ? 'Nothing waiting on you' : 'No requests sent yet'}
          description={
            tab === 'inbox'
              ? "When a member asks you to approve a task, committee, or event, it'll show up here."
              : 'Use the "Request Approval" button on a task, committee, or event to ask a member to sign off on it.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(req => {
            const Icon = entityIcon(req.entityType);
            return (
              <div key={req.id} className="glass-panel rounded-2xl p-4 space-y-3 text-xs border border-theme-border/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-accent/15 text-accent shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <Link href={entityLink(req)} className="font-bold text-theme-text-primary hover:text-accent transition-all">
                        {req.entityTitle}
                      </Link>
                      <p className="text-[10px] text-theme-text-secondary uppercase tracking-wide">{req.entityType}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge(req.status)}`}>
                    {req.status === 'pending' ? 'Pending' : req.status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                </div>

                <p className="text-theme-text-secondary">
                  {tab === 'inbox' ? (
                    <><span className="font-semibold text-theme-text-primary">{req.requesterName}</span> is asking you to approve this.</>
                  ) : (
                    <>Sent to <span className="font-semibold text-theme-text-primary">{req.targetMemberName}</span> for approval.</>
                  )}
                </p>

                {req.message && (
                  <p className="bg-theme-background/30 border-l-2 border-accent/40 px-3 py-2 rounded-lg text-theme-text-secondary italic">
                    "{req.message}"
                  </p>
                )}

                {req.status !== 'pending' && req.decisionNote && (
                  <p className="bg-theme-background/30 border-l-2 border-theme-border/40 px-3 py-2 rounded-lg text-theme-text-secondary">
                    Note: {req.decisionNote}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-theme-border/20">
                  <span className="flex items-center gap-1 text-[10px] text-theme-text-secondary">
                    <Clock className="h-3 w-3" />
                    {new Date(req.createdAt).toLocaleString()}
                  </span>

                  {tab === 'inbox' && req.status === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDecisionNoteFor({ id: req.id, decision: 'approved' })}
                        className="flex items-center gap-1 px-2.5 py-1 bg-success hover:bg-success/90 text-white font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => setDecisionNoteFor({ id: req.id, decision: 'rejected' })}
                        className="flex items-center gap-1 px-2.5 py-1 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  )}

                  {tab === 'sent' && req.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(req.id)}
                      className="px-2.5 py-1 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {decisionNoteFor && (() => {
        const reviewing = requests.find(r => r.id === decisionNoteFor.id);
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-4 relative border border-white/15 shadow-2xl">
            <h2 className="text-base font-bold text-theme-text-primary">
              {decisionNoteFor.decision === 'approved' ? 'Approve Request' : 'Reject Request'}
            </h2>

            {reviewing && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-theme-background/30 border border-theme-border/30 rounded-xl space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-theme-text-secondary font-bold">{reviewing.entityType}</p>
                  <p className="font-semibold text-theme-text-primary">{reviewing.entityTitle}</p>
                </div>
                <div className="p-3 bg-theme-background/30 border border-theme-border/30 rounded-xl space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-theme-text-secondary font-bold">Requested By</p>
                  <p className="font-semibold text-theme-text-primary">{reviewing.requesterName}</p>
                  {reviewing.requesterEmail && <p className="text-theme-text-secondary">{reviewing.requesterEmail}</p>}
                </div>
                {reviewing.message && (
                  <div className="p-3 bg-theme-background/30 border-l-2 border-accent/40 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wide text-theme-text-secondary font-bold mb-1">What They Told You</p>
                    <p className="text-theme-text-primary italic">"{reviewing.message}"</p>
                  </div>
                )}
              </div>
            )}

            <textarea
              value={decisionNoteInput}
              onChange={(e) => setDecisionNoteInput(e.target.value)}
              rows={3}
              placeholder="Add an optional note..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-theme-border/40 bg-theme-background/30 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
            />
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => { setDecisionNoteFor(null); setDecisionNoteInput(''); }}
                className="px-4 py-2.5 text-xs font-semibold text-theme-text-primary bg-theme-border/30 hover:bg-theme-border/50 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecide(decisionNoteFor.id, decisionNoteFor.decision, decisionNoteInput.trim() || undefined)}
                className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer text-white ${decisionNoteFor.decision === 'approved' ? 'bg-success hover:bg-success/90 shadow-success/20' : 'bg-danger hover:bg-danger/90 shadow-danger/20'}`}
              >
                Confirm {decisionNoteFor.decision === 'approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
