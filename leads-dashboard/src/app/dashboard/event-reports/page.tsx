'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  Check,
  X,
  Ban,
  Lock,
  Download,
  Mail,
  AlertTriangle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  getEvents,
  getEventReports,
  addEventReport,
  resubmitEventReport,
  approveEventReport,
  rejectEventReport,
  deleteEventReport,
  isApprovedEvent,
  getTasks,
  EventItem,
  EventReportItem,
} from '@/lib/local-data';
import { canSubmitEventReport, canReviewEventReports, isCentreHead, isEventsHeadGgCampus } from '@/lib/permissions';
import { FileDropzone, FilePreviewRow, createProgressTracker } from '@/components/ui/file-dropzone';
import { EmptyState } from '@/components/ui/empty-state';

export default function EventReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reports, setReports] = useState<EventReportItem[]>([]);

  const [eventId, setEventId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState('');
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadEtaSeconds, setUploadEtaSeconds] = useState<number | null>(null);

  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitFileData, setResubmitFileData] = useState('');
  const [resubmitProgress, setResubmitProgress] = useState(0);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const refresh = () => {
      setEvents(getEvents());
      setReports(getEventReports());
    };
    refresh();

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    window.addEventListener('leads-data-sync', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('leads-data-sync', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4500);
  };
  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4500);
  };

  const canSubmit = canSubmitEventReport(user);
  const canReview = canReviewEventReports(user);
  const viewerIsCentreHead = isCentreHead(user);
  const viewerIsGgEventsHead = isEventsHeadGgCampus(user);

  if (user && !canSubmit && !canReview) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="glass-panel p-8 rounded-3xl border border-danger/30 text-center space-y-4 shadow-2xl">
          <div className="h-16 w-16 bg-danger/15 rounded-2xl flex items-center justify-center mx-auto text-danger border border-danger/25">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-theme-text-primary">General Secretary Access Only</h2>
          <p className="text-xs text-theme-text-secondary leading-relaxed">
            The Event Report module is restricted to the General Secretary (for submissions) and the Centre Head / GG Campus Head of Events (for review).
          </p>
        </div>
      </div>
    );
  }

  const readFile = (selected: File | undefined, onDone: (dataUrl: string) => void, onError: (msg: string) => void) => {
    if (!selected) return;
    const MAX_SIZE = 25 * 1024 * 1024;
    if (selected.size > MAX_SIZE) {
      onError(`File size (${(selected.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 25 MB maximum limit.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onDone(reader.result);
    };
    reader.onerror = () => onError('Could not read that file. Please try selecting it again.');
    reader.readAsDataURL(selected);
  };

  const handleFile = (selected: File | undefined) => {
    setFileError('');
    setFile(selected || null);
    setFileData('');
    if (selected) {
      readFile(selected, setFileData, (msg) => { setFileError(msg); setFile(null); });
    }
  };

  const handleSubmitReport = async () => {
    if (!eventId) { setFileError('Select the event this report is for.'); return; }
    if (!file || !fileData.startsWith('data:')) { setFileError('Please select a report file to upload.'); return; }

    const selectedEvent = events.find(e => e.id === eventId);
    setIsSubmitting(true);
    setFileError('');
    try {
      const tracker = createProgressTracker((pct, eta) => { setUploadProgress(pct); setUploadEtaSeconds(eta); });
      await addEventReport({
        eventId,
        eventTitle: selectedEvent?.title || 'Event',
        fileData,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        submittedBy: user?.name || 'General Secretary',
        submittedByEmail: user?.email || '',
      }, tracker);
      setReports(getEventReports());
      setEventId('');
      setFile(null);
      setFileData('');
      setUploadProgress(0);
      setUploadEtaSeconds(null);
      triggerSuccess('Report submitted — awaiting approval from the Centre Head and GG Campus Head of Events.');
    } catch (err: any) {
      setFileError(err.message || 'Failed to submit the report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = async (report: EventReportItem) => {
    if (!resubmitFile || !resubmitFileData.startsWith('data:')) return;
    setIsResubmitting(true);
    try {
      const tracker = createProgressTracker((pct) => setResubmitProgress(pct));
      await resubmitEventReport(report.id, resubmitFileData, resubmitFile.name, resubmitFile.size, resubmitFile.type || 'application/octet-stream', user?.name || 'General Secretary', tracker);
      setReports(getEventReports());
      setResubmittingId(null);
      setResubmitFile(null);
      setResubmitFileData('');
      setResubmitProgress(0);
      triggerSuccess('Report resubmitted — awaiting approval again.');
    } catch (err: any) {
      triggerError(err.message || 'Failed to resubmit the report.');
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleApprove = async (report: EventReportItem, as: 'centre_head' | 'gg_events_head') => {
    const result = await approveEventReport(report.id, as, user?.name || 'Reviewer');
    if (!result) { triggerError('Failed to record approval.'); return; }
    setReports(getEventReports());
    triggerSuccess(result.status === 'approved'
      ? (result.emailSent ? 'Approved. Both sign-offs are in — the report has been emailed as an attachment.' : `Approved. Both sign-offs are in, but the email could not be sent${result.emailError ? `: ${result.emailError.split('\n')[0]}` : '.'}`)
      : 'Approved your side — still waiting on the other reviewer.');
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    const result = await rejectEventReport(rejectingId, user?.name || 'Reviewer', rejectionReasonInput || undefined);
    if (!result) { triggerError('Failed to reject the report.'); return; }
    setReports(getEventReports());
    setRejectingId(null);
    setRejectionReasonInput('');
    triggerSuccess('Rejected. The General Secretary can resubmit a corrected file.');
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    const ok = await deleteEventReport(deletingId, user?.name || 'User');
    if (ok) {
      setReports(getEventReports());
      triggerSuccess('Report deleted.');
    } else {
      triggerError('Failed to delete the report.');
    }
    setDeletingId(null);
  };

  const myReports = reports.filter(r => r.submittedByEmail === user?.email);
  const pendingForReview = reports.filter(r => r.status === 'pending_review');
  const eligibleEvents = events.filter(ev => !ev.isHoliday && isApprovedEvent(ev, getTasks()));

  const statusBadge = (report: EventReportItem) => {
    if (report.status === 'approved') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30"><Check className="h-2.5 w-2.5" />Approved</span>;
    }
    if (report.status === 'rejected') {
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30"><X className="h-2.5 w-2.5" />Rejected</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30"><Clock className="h-2.5 w-2.5" />Pending Review</span>;
  };

  const approvalChecklist = (report: EventReportItem) => (
    <div className="flex items-center gap-3 text-[10px] font-semibold">
      <span className={report.centreHeadApproved ? 'text-success' : 'text-theme-text-secondary'}>
        {report.centreHeadApproved ? '✓' : '○'} Centre Head
      </span>
      <span className={report.eventsHeadGgApproved ? 'text-success' : 'text-theme-text-secondary'}>
        {report.eventsHeadGgApproved ? '✓' : '○'} GG Campus Events Head
      </span>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <Check className="h-5 w-5 text-success shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-danger/15 border border-danger/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="glass-panel p-6 rounded-3xl border border-accent/20 flex items-center gap-3 bg-gradient-to-r from-accent/10 via-primary/5 to-transparent">
        <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/20">
          <FileCheck2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Event Reports</h1>
          <p className="text-xs text-theme-text-secondary">Submit, review, and approve post-event reports — approved reports are emailed as an attachment to the Centre Head, GG Campus Head of Events, and President.</p>
        </div>
      </div>

      {canSubmit && (
        <div className="glass-panel p-6 rounded-3xl border border-theme-card-border space-y-4">
          <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider">Submit a New Report</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">Event *</label>
              <select
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                className="w-full px-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">-- Select an event --</option>
                {eligibleEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="block font-medium text-theme-text-secondary">Report File (Word/PDF, &lt; 25 MB) *</label>
            <FileDropzone
              onFilesSelected={(files) => handleFile(files[0])}
              accept="application/pdf,.doc,.docx"
              label="Click to select the finished report file"
              hint="Word or PDF — up to 25 MB"
              disabled={isSubmitting}
            />
            {file && (
              <FilePreviewRow
                file={file}
                status={isSubmitting ? 'uploading' : fileError ? 'error' : 'idle'}
                progress={uploadProgress}
                etaSeconds={uploadEtaSeconds}
                error={fileError}
                onRetry={fileError ? handleSubmitReport : undefined}
              />
            )}
            {!file && fileError && <p className="text-danger text-[11px]">{fileError}</p>}
          </div>

          <button
            onClick={handleSubmitReport}
            disabled={isSubmitting || !eventId || !file}
            className="px-5 py-2.5 bg-accent hover:bg-primary-light text-white font-bold rounded-xl transition-all shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs"
          >
            <FileCheck2 className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      )}

      {canReview && (
        <div className="glass-panel p-6 rounded-3xl border border-theme-card-border space-y-4">
          <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider">Pending My Review ({pendingForReview.length})</h3>
          {pendingForReview.length === 0 ? (
            <EmptyState icon={FileCheck2} title="Nothing pending" description="Every submitted event report has been decided." />
          ) : (
            <div className="space-y-3">
              {pendingForReview.map(report => (
                <div key={report.id} className="p-4 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-theme-text-primary text-xs">{report.eventTitle}</h4>
                      <span className="text-[10px] text-theme-text-secondary">Submitted by {report.submittedBy} &middot; {report.fileName}</span>
                    </div>
                    {statusBadge(report)}
                  </div>
                  {approvalChecklist(report)}
                  <div className="flex items-center gap-2 pt-1">
                    {report.fileUrl && (
                      <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-all" title="Download report">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {viewerIsCentreHead && !report.centreHeadApproved && (
                      <button onClick={() => handleApprove(report, 'centre_head')} className="flex-1 py-1.5 bg-success/15 hover:bg-success/25 text-success border border-success/30 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">
                        <Check className="h-3 w-3" /> Approve as Centre Head
                      </button>
                    )}
                    {viewerIsGgEventsHead && !report.eventsHeadGgApproved && (
                      <button onClick={() => handleApprove(report, 'gg_events_head')} className="flex-1 py-1.5 bg-success/15 hover:bg-success/25 text-success border border-success/30 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">
                        <Check className="h-3 w-3" /> Approve as GG Events Head
                      </button>
                    )}
                    <button onClick={() => setRejectingId(report.id)} className="flex-1 py-1.5 bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">
                      <X className="h-3 w-3" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {canSubmit && (
        <div className="glass-panel p-6 rounded-3xl border border-theme-card-border space-y-4">
          <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider">My Submissions ({myReports.length})</h3>
          {myReports.length === 0 ? (
            <EmptyState icon={FileCheck2} title="No reports submitted yet" description="Reports you submit will appear here with their approval status." />
          ) : (
            <div className="space-y-3">
              {myReports.map(report => (
                <div key={report.id} className="p-4 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-theme-text-primary text-xs">{report.eventTitle}</h4>
                      <span className="text-[10px] text-theme-text-secondary">{report.fileName} &middot; {new Date(report.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {statusBadge(report)}
                  </div>
                  {report.status !== 'approved' && approvalChecklist(report)}
                  {report.status === 'rejected' && report.rejectionReason && (
                    <p className="text-[11px] text-danger bg-danger/10 border border-danger/20 rounded-lg p-2">{report.rejectionReason}</p>
                  )}
                  {report.status === 'approved' && report.emailSent === false && (
                    <p className="text-[11px] text-warning bg-warning/10 border border-warning/20 rounded-lg p-2 flex items-start gap-1.5">
                      <Mail className="h-3 w-3 shrink-0 mt-0.5" />
                      Approved, but the notification email couldn&apos;t be delivered{report.emailError ? `: ${report.emailError.split('\n')[0]}` : '.'}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {report.fileUrl && (
                      <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-all" title="Download report">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {report.status === 'rejected' && (
                      <button onClick={() => setResubmittingId(report.id)} className="px-3 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3" /> Resubmit
                      </button>
                    )}
                    {report.status !== 'approved' && (
                      <button onClick={() => setDeletingId(report.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {resubmittingId === report.id && (
                    <div className="pt-2 border-t border-theme-border/20 space-y-2">
                      <FileDropzone
                        onFilesSelected={(files) => {
                          const selected = files[0];
                          setResubmitFile(selected || null);
                          setResubmitFileData('');
                          if (selected) readFile(selected, setResubmitFileData, () => setResubmitFile(null));
                        }}
                        accept="application/pdf,.doc,.docx"
                        label="Select the corrected report file"
                        hint="Word or PDF — up to 25 MB"
                        disabled={isResubmitting}
                      />
                      {resubmitFile && (
                        <FilePreviewRow file={resubmitFile} status={isResubmitting ? 'uploading' : 'idle'} progress={resubmitProgress} />
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResubmit(report)}
                          disabled={isResubmitting || !resubmitFile}
                          className="px-3 py-1.5 bg-accent hover:bg-primary-light text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isResubmitting ? 'Uploading...' : 'Submit Correction'}
                        </button>
                        <button onClick={() => { setResubmittingId(null); setResubmitFile(null); setResubmitFileData(''); }} className="px-3 py-1.5 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-[11px] font-bold rounded-lg transition-all cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-4 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
                <Ban className="h-4.5 w-4.5 text-danger" />
                Reject Report
              </h2>
              <button onClick={() => { setRejectingId(null); setRejectionReasonInput(''); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="block font-medium text-theme-text-secondary">Reason (optional)</label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
                placeholder="Let the General Secretary know what needs fixing..."
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <button onClick={handleConfirmReject} className="w-full py-3 bg-danger hover:bg-danger/90 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer">
              Confirm Rejection
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col space-y-4 relative border border-white/15 shadow-2xl text-xs">
            <h2 className="text-base font-bold text-theme-text-primary">Delete this report?</h2>
            <p className="text-theme-text-secondary">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={handleConfirmDelete} className="flex-1 py-2.5 bg-danger hover:bg-danger/90 text-white font-semibold rounded-xl transition-all cursor-pointer">Delete</button>
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-xl transition-all cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
