'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  QrCode,
  Search,
  MapPin,
  Send,
  Bell,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
  Edit3,
} from 'lucide-react';
import {
  EventItem,
  EventPassItem,
  getEvents,
  getEventPasses,
  saveEventPasses,
  updateEventPassStatus,
  dispatchPassEmail,
  authHeaders,
} from '@/lib/local-data';
import {
  canManageEventPasses,
  canScanEventPasses,
  canAccessEventPassesModule,
} from '@/lib/permissions';
import { EventPassStudio } from '@/components/event-pass-studio';
import { EventPassScanner } from '@/components/event-pass-scanner';
import { EventPassPushModal } from '@/components/event-pass-push-modal';
import { EventPassEditModal } from '@/components/event-pass-edit-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function EventPassesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventPasses, setEventPasses] = useState<EventPassItem[]>([]);
  const [activeTab, setActiveTab] = useState<'studio' | 'scanner'>('studio');

  // Handle any direct/legacy pass param navigations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const passSerial = searchParams.get('pass') || searchParams.get('passId') || searchParams.get('serial');
      if (passSerial) {
        router.replace(`/pass/${encodeURIComponent(passSerial)}`);
      }
    }
  }, [router]);

  // Filters & State for Issued Passes Table
  const [passSearchQuery, setPassSearchQuery] = useState('');
  const [passFilterEventId, setPassFilterEventId] = useState<string>('ALL');
  const [dispatchingPassId, setDispatchingPassId] = useState<string | null>(null);

  // Push Alert Modal State
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [selectedPushPass, setSelectedPushPass] = useState<EventPassItem | null>(null);

  // Edit Pass Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditPass, setSelectedEditPass] = useState<EventPassItem | null>(null);

  // Notifications / Toast
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 5000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    setEvents(getEvents());
    setEventPasses(getEventPasses());

    // Immediate server fetch for passes to guarantee cross-device sync
    fetch('/api/events/all/passes', { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((serverPasses) => {
        if (Array.isArray(serverPasses) && serverPasses.length > 0) {
          saveEventPasses(serverPasses);
          setEventPasses(serverPasses);
        }
      })
      .catch((err) => console.warn('[event-passes] initial sync failed:', err));

    const handleSync = () => {
      setEvents(getEvents());
      setEventPasses(getEventPasses());
    };
    window.addEventListener('leads-data-sync', handleSync);
    return () => window.removeEventListener('leads-data-sync', handleSync);
  }, []);

  const canManagePasses = canManageEventPasses(user);
  const canScanPasses = canScanEventPasses(user);
  const canAccessModule = canAccessEventPassesModule(user);

  // Auto switch to scanner if user can only scan
  useEffect(() => {
    if (user && !canManagePasses && canScanPasses) {
      setActiveTab('scanner');
    }
  }, [user, canManagePasses, canScanPasses]);

  const handleExportAttendance = () => {
    const filtered = eventPasses.filter((p) => {
      if (passFilterEventId !== 'ALL' && p.eventId !== passFilterEventId) return false;
      return true;
    });

    if (filtered.length === 0) {
      triggerError('No pass records found to export.');
      return;
    }

    const headers = [
      'Serial Number',
      'Attendee Name',
      'Guest Category',
      'Organization / Affiliation',
      'Assigned Room / Venue',
      'Event Name',
      'Pass Tier',
      'Issued By',
      'Issued At',
      'Status',
      'Checked In By',
      'Checked In At',
      'Email Address',
      'Phone Number',
      'Notes',
    ];

    const rows = filtered.map((p) => [
      `"${p.serialNumber}"`,
      `"${(p.attendeeName || '').replace(/"/g, '""')}"`,
      `"${(p.guestCategory || 'General Delegate').replace(/"/g, '""')}"`,
      `"${(p.attendeeOrg || '').replace(/"/g, '""')}"`,
      `"${(p.roomOrVenue || p.eventVenue || '').replace(/"/g, '""')}"`,
      `"${(p.eventName || '').replace(/"/g, '""')}"`,
      `"${p.passType}"`,
      `"${(p.issuedBy || '').replace(/"/g, '""')}"`,
      `"${p.issuedAt || ''}"`,
      `"${p.status}"`,
      `"${(p.checkedInBy || '').replace(/"/g, '""')}"`,
      `"${p.checkedInAt || ''}"`,
      `"${(p.attendeeEmail || '').replace(/"/g, '""')}"`,
      `"${(p.attendeePhone || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const eventNameSlug =
      passFilterEventId !== 'ALL'
        ? (events.find((e) => e.id === passFilterEventId)?.title || 'event').replace(/[^a-zA-Z0-9]+/g, '_')
        : 'all_events';
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_attendance_${eventNameSlug}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess(`Exported ${filtered.length} attendee records to CSV!`);
  };

  if (!canAccessModule) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          icon={Ticket}
          title="Access Restricted"
          description="You do not currently hold authorization to issue event passes or operate the turnstile gate scanner. Contact leadership or request a Group Policy grant."
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 min-w-0 animate-in fade-in duration-200">
      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300 shadow-md shadow-emerald-500/10">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/15 border border-rose-500/25 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300 shadow-md shadow-rose-500/10">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Header & Main Nav Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border/30 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-text-primary flex items-center gap-2.5">
            <div className="p-2 bg-accent/15 rounded-2xl text-accent border border-accent/20">
              <Ticket className="h-6 w-6" />
            </div>
            Event Passes &amp; Gate Turnstile
          </h1>
          <p className="text-xs text-theme-text-secondary mt-1">
            Issue verified digital &amp; 3D luxury credentials, manage attendee rosters, and operate high-speed gate scanners.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-white/5 p-1 rounded-2xl border border-slate-300 dark:border-white/10 text-xs shadow-inner">
          {canManagePasses && (
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'studio'
                  ? 'bg-accent text-white shadow-md shadow-accent/25'
                  : 'text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Passes &amp; Tickets Studio
              {eventPasses.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
                  {eventPasses.length}
                </span>
              )}
            </button>
          )}

          {canScanPasses && (
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'scanner'
                  ? 'bg-accent text-white shadow-md shadow-accent/25'
                  : 'text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              <QrCode className="h-4 w-4" />
              Gate Turnstile Scanner
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: PASSES & TICKETS STUDIO */}
      {activeTab === 'studio' && canManagePasses && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <EventPassStudio
            events={events}
            currentUserId={user?.id}
            currentUserName={user?.name || 'Authorized Staff'}
            currentUserEmail={user?.email}
            onPassIssued={() => {
              setEventPasses(getEventPasses());
            }}
          />

          {/* ISSUED PASSES LEDGER TABLE */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-5 border border-white/15 bg-theme-card/90 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-theme-text-primary">Issued Event Passes &amp; Turnstile Roster</h3>
                <p className="text-xs text-theme-text-secondary">
                  Real-time ledger of all on-the-spot and digital passes issued across events.
                </p>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportAttendance}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Export Attendance & Registration Roster to CSV for Audits"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Export Attendance (CSV)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPushPass(null);
                    setIsPushModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/35 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Broadcast lock-screen push notification to attendees"
                >
                  <Bell className="h-3.5 w-3.5 animate-pulse" />
                  Broadcast Push
                </button>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-theme-text-secondary" />
                  <input
                    type="text"
                    value={passSearchQuery}
                    onChange={(e) => setPassSearchQuery(e.target.value)}
                    placeholder="Search attendee or serial..."
                    className="pl-8 pr-3 py-1.5 bg-theme-background/50 border border-theme-card-border rounded-xl text-theme-text-primary text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <select
                  value={passFilterEventId}
                  onChange={(e) => setPassFilterEventId(e.target.value)}
                  className="px-3 py-1.5 bg-theme-background/50 border border-theme-card-border rounded-xl text-theme-text-primary text-xs focus:outline-none focus:border-accent"
                >
                  <option value="ALL" className="bg-slate-900 text-white">All Events</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id} className="bg-slate-900 text-white">
                      {evt.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Passes Table */}
            {eventPasses.length === 0 ? (
              <div className="py-12 text-center text-theme-text-secondary text-xs">
                No event passes issued yet. Use the studio above to issue the first pass!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/90 dark:border-white/10 text-theme-text-secondary text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Serial ID</th>
                      <th className="py-3 px-4">Attendee &amp; Category</th>
                      <th className="py-3 px-4">Assigned Room / Venue</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Pass Tier</th>
                      <th className="py-3 px-4">Issued By</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                    {eventPasses
                      .filter((p) => {
                        if (passFilterEventId !== 'ALL' && p.eventId !== passFilterEventId) return false;
                        if (passSearchQuery.trim()) {
                          const q = passSearchQuery.toLowerCase();
                          return (
                            p.attendeeName.toLowerCase().includes(q) ||
                            p.serialNumber.toLowerCase().includes(q) ||
                            (p.attendeeOrg && p.attendeeOrg.toLowerCase().includes(q)) ||
                            (p.roomOrVenue && p.roomOrVenue.toLowerCase().includes(q)) ||
                            (p.guestCategory && p.guestCategory.toLowerCase().includes(q)) ||
                            p.passType.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((pass) => (
                        <tr key={pass.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold">
                            <a
                              href={`/pass/${pass.serialNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-500 dark:text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1 group"
                              title={`Open verified pass for ${pass.attendeeName} (${pass.serialNumber})`}
                            >
                              <span>{pass.serialNumber}</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-theme-text-primary">{pass.attendeeName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {pass.guestCategory && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-accent/15 text-accent border border-accent/25">
                                  {pass.guestCategory}
                                </span>
                              )}
                              {pass.attendeeOrg && (
                                <span className="text-[10px] text-theme-text-secondary truncate max-w-[150px]">
                                  {pass.attendeeOrg}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-accent shrink-0" />
                              {pass.roomOrVenue || pass.eventVenue || 'Main Auditorium'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-theme-text-secondary max-w-[180px] truncate">
                            {pass.eventName}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/30">
                              {pass.passType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-theme-text-secondary text-[11px]">
                            {pass.issuedBy}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                pass.status === 'Checked In'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : pass.status === 'Cancelled'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                  : 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30'
                              }`}
                            >
                              {pass.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Live Pass Button */}
                              <a
                                href={`/pass/${pass.serialNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title={`View Pass for ${pass.attendeeName}`}
                              >
                                <Eye className="h-3 w-3" />
                                <span>View</span>
                              </a>

                              {/* Edit Pass Button */}
                              {canManagePasses && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEditPass(pass);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  title={`Edit pass details for ${pass.attendeeName}`}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                              )}

                              {/* 1-Click Dispatch Email Button */}
                              <button
                                type="button"
                                disabled={dispatchingPassId === pass.id}
                                onClick={async () => {
                                  let email = pass.attendeeEmail;
                                  if (!email) {
                                    email = window.prompt(`Enter recipient email address for ${pass.attendeeName}:`) || undefined;
                                  }
                                  if (!email) return;

                                  setDispatchingPassId(pass.id);
                                  const res = await dispatchPassEmail(pass, email);
                                  setDispatchingPassId(null);
                                  if (res.success) {
                                    triggerSuccess(`Pass ${pass.serialNumber} dispatched to ${email}!`);
                                  } else {
                                    triggerError(res.error || 'Failed to dispatch pass email. Check SMTP settings.');
                                  }
                                }}
                                className="p-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                                title={`Dispatch Pass Email to ${pass.attendeeEmail || pass.attendeeName}`}
                              >
                                {dispatchingPassId === pass.id ? (
                                  <span className="h-3 w-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin block" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </button>

                              {pass.status !== 'Checked In' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateEventPassStatus(pass.id, 'Checked In', user?.name || 'Staff');
                                    setEventPasses(getEventPasses());
                                    triggerSuccess(`Checked in ${pass.attendeeName}!`);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Admit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPushPass(pass);
                                  setIsPushModalOpen(true);
                                }}
                                className="p-1.5 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                title="Send Lock-Screen Push Alert to this Attendee"
                              >
                                <Bell className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(pass.serialNumber);
                                  triggerSuccess(`Copied serial ${pass.serialNumber}`);
                                }}
                                className="px-2 py-1 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                title="Copy Serial ID"
                              >
                                Copy ID
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GATE TURNSTILE SCANNER */}
      {activeTab === 'scanner' && canScanPasses && (
        <div className="animate-in fade-in duration-300">
          <EventPassScanner
            currentUserName={user?.name || 'Staff'}
            onPassCheckedIn={(pass) => {
              setEventPasses(getEventPasses());
              triggerSuccess(`Turnstile Verified: ${pass.attendeeName} (${pass.passType}) admitted!`);
            }}
          />
        </div>
      )}

      {/* EDIT PASS MODAL */}
      <EventPassEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEditPass(null);
        }}
        pass={selectedEditPass}
        currentUserName={user?.name || 'Staff'}
        onPassUpdated={(updated) => {
          setEventPasses(getEventPasses());
          triggerSuccess(`Updated pass for ${updated.attendeeName} (${updated.serialNumber}) — Apple & Google Wallet sync triggered.`);
        }}
      />

      {/* PUSH ALERT NOTIFICATION MODAL */}
      <EventPassPushModal
        isOpen={isPushModalOpen}
        onClose={() => {
          setIsPushModalOpen(false);
          setSelectedPushPass(null);
        }}
        eventId={passFilterEventId !== 'ALL' ? passFilterEventId : events[0]?.id || ''}
        eventName={
          (passFilterEventId !== 'ALL'
            ? events.find((e) => e.id === passFilterEventId)?.title
            : events[0]?.title) || 'LEADS Official Event'
        }
        passes={
          passFilterEventId !== 'ALL'
            ? eventPasses.filter((p) => p.eventId === passFilterEventId)
            : eventPasses
        }
        initialSelectedPass={selectedPushPass}
        onBroadcastSuccess={() => triggerSuccess('Push notification alert sent to pass holders!')}
      />
    </div>
  );
}
