'use client';

import React, { useState, useEffect } from 'react';
import {
  Palette,
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Trash2,
  Eye,
  ShieldAlert,
  UserCheck,
  Calendar,
  FileCheck,
  Search,
  X,
  Send,
  Lock,
  Download,
  Sparkles
} from 'lucide-react';
import {
  getDesigns,
  addDesign,
  updateDesignReview,
  updateDesignStyleReview,
  updateDesignFile,
  deleteDesign,
  getMembers,
  getEvents,
  DesignSubmissionItem,
  Member,
  EventItem
} from '@/lib/local-data';
import { canViewAllDesigns, isDesignHead, isCentreHead } from '@/lib/permissions';

export default function DesignPortalPage() {
  const [designs, setDesigns] = useState<DesignSubmissionItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [user, setUser] = useState<any>(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'proofread' | 'expired'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedDesign, setSelectedDesign] = useState<DesignSubmissionItem | null>(null);
  const [showInspectorModal, setShowInspectorModal] = useState<boolean>(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DesignSubmissionItem['category']>('Poster');
  const [eventId, setEventId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [requestProofread, setRequestProofread] = useState<boolean>(false);
  const [assignedProofreaderId, setAssignedProofreaderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Reading the file into base64 happens asynchronously (FileReader), separately
  // from the "Uploading..." server round-trip — both get their own progress state
  // so a large file doesn't look "attached and ready" before it actually is.
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [readProgress, setReadProgress] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string>('');

  // Proofread Review form state inside Inspector Modal
  const [reviewStatus, setReviewStatus] = useState<'Proofread Approved' | 'Changes Requested'>('Proofread Approved');
  const [reviewComments, setReviewComments] = useState('');

  // Design Head Style Review form state inside Inspector Modal
  const [styleStatus, setStyleStatus] = useState<'Style Approved' | 'Style Rejected'>('Style Approved');
  const [styleFeedback, setStyleFeedback] = useState('');

  // Replace File form state inside Inspector Modal (design owner only)
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceFileData, setReplaceFileData] = useState<string>('');
  const [replaceFileError, setReplaceFileError] = useState<string>('');
  const [isReplacingFile, setIsReplacingFile] = useState<boolean>(false);
  const [isReadingReplaceFile, setIsReadingReplaceFile] = useState<boolean>(false);
  const [replaceReadProgress, setReplaceReadProgress] = useState<number>(0);

  // Deep link from a notification (?highlight=<designId>) — auto-open its Inspector once
  const [highlightDesignId, setHighlightDesignId] = useState<string | null>(null);
  const [hasOpenedHighlight, setHasOpenedHighlight] = useState(false);

  const openInspector = (design: DesignSubmissionItem) => {
    setSelectedDesign(design);
    // Pre-fill both decision forms with this design's actual current state —
    // previously these stayed at whatever was left over from the last design's
    // Inspector session (or the hardcoded defaults), so reopening an already
    // Changes-Requested/Style-Rejected design silently showed "Approved"
    // pre-selected. A reviewer changing their mind needs to see what's
    // actually on record before deliberately flipping it, not a stale guess.
    setReviewComments(design.review?.comments || '');
    setReviewStatus(design.review?.status === 'Changes Requested' ? 'Changes Requested' : 'Proofread Approved');
    setStyleFeedback(design.styleFeedback || '');
    setStyleStatus(design.styleStatus === 'Style Rejected' ? 'Style Rejected' : 'Style Approved');
    setShowInspectorModal(true);
  };

  const handleSaveStyleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesign || !user) return;
    const updated = updateDesignStyleReview(selectedDesign.id, styleStatus, styleFeedback, user.name);
    if (updated) {
      setSelectedDesign(updated);
      setDesigns(getDesigns());
    }
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setReplaceFileError('');
    if (!selected) {
      setReplaceFile(null);
      setReplaceFileData('');
      return;
    }

    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
    if (selected.size > MAX_SIZE) {
      setReplaceFileError(`File size (${(selected.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 25 MB maximum limit.`);
      setReplaceFile(null);
      setReplaceFileData('');
      return;
    }

    setReplaceFile(selected);
    setReplaceFileData('');
    setIsReadingReplaceFile(true);
    setReplaceReadProgress(0);
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) setReplaceReadProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    reader.onload = () => {
      if (typeof reader.result === 'string') setReplaceFileData(reader.result);
      setIsReadingReplaceFile(false);
      setReplaceReadProgress(100);
    };
    reader.onerror = () => {
      setReplaceFileError('Could not read that file. Please try selecting it again.');
      setReplaceFile(null);
      setReplaceFileData('');
      setIsReadingReplaceFile(false);
    };
    reader.readAsDataURL(selected);
  };

  const handleReplaceFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesign || !user) return;
    if (isReadingReplaceFile) {
      setReplaceFileError('Still preparing the file — please wait a moment and try again.');
      return;
    }
    if (!replaceFile || !replaceFileData.startsWith('data:')) {
      setReplaceFileError('Select a replacement file first.');
      return;
    }

    setIsReplacingFile(true);
    setReplaceFileError('');
    try {
      const updated = await updateDesignFile(
        selectedDesign.id,
        replaceFileData,
        replaceFile.name,
        replaceFile.size,
        replaceFile.type || 'application/octet-stream',
        user.name
      );
      if (updated) {
        setSelectedDesign(updated);
        setDesigns(getDesigns());
        setReplaceFile(null);
        setReplaceFileData('');
      }
    } catch (err: any) {
      setReplaceFileError(err.message || 'Failed to replace file.');
    } finally {
      setIsReplacingFile(false);
    }
  };

  const refreshData = () => {
    setDesigns(getDesigns());
    setMembers(getMembers());
    setEvents(getEvents());
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
    refreshData();

    const params = new URLSearchParams(window.location.search);
    setHighlightDesignId(params.get('highlight'));

    const handleSync = () => refreshData();
    window.addEventListener('leads-data-sync', handleSync);
    return () => window.removeEventListener('leads-data-sync', handleSync);
  }, []);

  // Once the highlighted design has actually loaded, open its Inspector — retries on
  // every refresh until found, since it may not exist locally yet on first paint.
  useEffect(() => {
    if (!highlightDesignId || hasOpenedHighlight) return;
    const match = designs.find(d => d.id === highlightDesignId);
    if (match) {
      openInspector(match);
      setHasOpenedHighlight(true);
    }
  }, [designs, highlightDesignId, hasOpenedHighlight]);

  // Handle file selection with 25 MB limit check
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFileError('');
    if (!selected) {
      setFile(null);
      setFileData('');
      return;
    }

    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
    if (selected.size > MAX_SIZE) {
      setFileError(`File size (${(selected.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 25 MB maximum limit.`);
      setFile(null);
      setFileData('');
      return;
    }

    setFile(selected);
    setFileData('');
    setIsReadingFile(true);
    setReadProgress(0);

    // Convert file to base64 DataURL for storage & preview. This can take a
    // moment for a large PNG/PDF, so it's tracked as its own progress step —
    // submitting before it finishes used to silently create a design with no
    // file attached, since fileData was still the empty string at that point.
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) setReadProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileData(reader.result);
      }
      setIsReadingFile(false);
      setReadProgress(100);
    };
    reader.onerror = () => {
      setFileError('Could not read that file. Please try selecting it again.');
      setFile(null);
      setFileData('');
      setIsReadingFile(false);
    };
    reader.readAsDataURL(selected);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!file) {
      setFileError('Please select a design asset to upload.');
      return;
    }
    if (isReadingFile) {
      setFileError('Still preparing the file — please wait a moment and try again.');
      return;
    }
    if (!fileData.startsWith('data:')) {
      setFileError('The file did not load correctly. Please re-select it and try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const selectedProofreader = members.find(m => m.id === assignedProofreaderId);
      const selectedEvent = events.find(ev => ev.id === eventId);

      await addDesign({
        title: title.trim(),
        description: description.trim(),
        category,
        fileData,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        designerId: user?.id || 'guest',
        designerName: user?.name || 'Designer',
        designerEmail: user?.email || 'designer@msruas.ac.in',
        proofreadRequested: requestProofread,
        assignedProofreaderId: requestProofread ? assignedProofreaderId : undefined,
        assignedProofreaderName: requestProofread ? selectedProofreader?.name : undefined,
        assignedProofreaderEmail: requestProofread ? selectedProofreader?.email : undefined,
        eventId: selectedEvent?.id,
        eventName: selectedEvent?.title,
      });

      refreshData();
      setShowUploadModal(false);

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Poster');
      setEventId('');
      setFile(null);
      setFileData('');
      setFileError('');
      setRequestProofread(false);
      setAssignedProofreaderId('');
    } catch (err: any) {
      // Deliberately doesn't close the modal or reset the form on failure —
      // the file is still selected, so the designer can just hit Submit again.
      setSubmitError(err.message || 'Failed to submit design.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesign) return;

    updateDesignReview(
      selectedDesign.id,
      reviewStatus,
      reviewComments.trim(),
      user?.name || 'Proofreader'
    );

    refreshData();
    setShowInspectorModal(false);
    setSelectedDesign(null);
    setReviewComments('');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteDesign(id, user?.name || 'User');
      refreshData();
      if (selectedDesign?.id === id) {
        setShowInspectorModal(false);
        setSelectedDesign(null);
      }
    }
  };

  // Helper for retention calculation
  const getDaysRemaining = (expiresAtStr: string) => {
    const expiresMs = new Date(expiresAtStr).getTime();
    const nowMs = new Date().getTime();
    const diffDays = Math.ceil((expiresMs - nowMs) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filtered designs
  const filteredDesigns = designs.filter(d => {
    // Search
    const matchesSearch = 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.designerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.eventName && d.eventName.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    // Category
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;

    // Tabs
    if (activeTab === 'mine') {
      return d.designerEmail === user?.email;
    }
    if (activeTab === 'proofread') {
      return d.assignedProofreaderEmail === user?.email || canViewAllDesigns(user);
    }
    if (activeTab === 'expired') {
      return d.isExpired;
    }

    // Default "all" tab: plain designers only see their own + anything assigned to them
    if (!canViewAllDesigns(user)) {
      return d.designerEmail === user?.email || d.assignedProofreaderEmail === user?.email;
    }

    return true;
  });

  // Metrics
  const totalSubmissions = designs.length;
  const pendingProofreads = designs.filter(d => d.proofreadRequested && d.review?.status === 'Pending Proofread').length;
  const approvedDesigns = designs.filter(d => d.review?.status === 'Proofread Approved').length;
  const expiredCount = designs.filter(d => d.isExpired).length;
  const assignedToMeCount = designs.filter(d => d.proofreadRequested && d.assignedProofreaderEmail === user?.email && d.review?.status === 'Pending Proofread').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Palette className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Design Portal & Proofreading Hub</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Submit event artwork, posters & media assets (Max <span className="font-semibold text-foreground">25 MB</span>). Automatic <span className="font-semibold text-foreground">30-day server retention policy</span>. Request peer & faculty proofreading.
          </p>
        </div>
        <button
          onClick={() => { setSubmitError(''); setShowUploadModal(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
        >
          <UploadCloud className="h-4 w-4" />
          Submit Design Asset
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Submissions</span>
            <FileText className="h-4 w-4 text-accent" />
          </div>
          <p className="text-2xl font-bold">{totalSubmissions}</p>
          <p className="text-[11px] text-muted-foreground">Active in portal</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pending Proofread</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-500">{pendingProofreads}</p>
          <p className="text-[11px] text-muted-foreground">{assignedToMeCount} assigned to you</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Proofread Approved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-500">{approvedDesigns}</p>
          <p className="text-[11px] text-muted-foreground">Ready for print & pub</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>30-Day Retention Policy</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-muted-foreground">{expiredCount}</p>
          <p className="text-[11px] text-muted-foreground">Files purged & archived</p>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-3 rounded-xl">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Submissions
          </button>

          <button
            onClick={() => setActiveTab('mine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'mine'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            My Submissions
          </button>

          <button
            onClick={() => setActiveTab('proofread')}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'proofread'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Proofreading Desk
            {assignedToMeCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-bold">
                {assignedToMeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('expired')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'expired'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            30d Expired ({expiredCount})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search design title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Categories</option>
            <option value="Poster">Poster</option>
            <option value="Banner">Banner</option>
            <option value="Social Media">Social Media</option>
            <option value="Brochure">Brochure</option>
            <option value="Certificates">Certificates</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Design Submissions Grid */}
      {filteredDesigns.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Palette className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">No design submissions found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'all' || activeTab !== 'all'
              ? 'Try adjusting your filters or search criteria.'
              : 'Be the first to submit a design asset for proofreading and approval!'}
          </p>
          <button
            onClick={() => { setSubmitError(''); setShowUploadModal(true); }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload Design
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDesigns.map(design => {
            const daysRemaining = getDaysRemaining(design.expiresAt);
            const isAssignedToMe = design.assignedProofreaderEmail === user?.email;

            return (
              <div
                key={design.id}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Top Asset Preview Header */}
                  <div className="relative h-44 bg-muted/60 border-b border-border flex items-center justify-center overflow-hidden">
                    {(design.fileUrl || design.fileData) && design.fileType.startsWith('image/') ? (
                      <img
                        src={design.fileUrl || design.fileData}
                        alt={design.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="h-10 w-10 text-accent/80" />
                        <span className="text-xs font-mono font-medium max-w-[200px] truncate px-2 text-center">
                          {design.fileName}
                        </span>
                      </div>
                    )}

                    {/* Category Pill */}
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-background/90 backdrop-blur border border-border text-foreground">
                      {design.category}
                    </span>

                    {/* 30-Day Retention Badge */}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur border ${
                        design.isExpired || daysRemaining <= 0
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : daysRemaining <= 5
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {design.isExpired || daysRemaining <= 0
                        ? '30d Expired (Purged)'
                        : `Expires in ${daysRemaining}d`}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-accent transition-colors">
                        {design.title}
                      </h3>
                      {design.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {design.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata Specs */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono bg-muted px-2 py-0.5 rounded border border-border">
                        {(design.fileSize / (1024 * 1024)).toFixed(2)} MB / 25 MB
                      </span>

                      {design.eventName && (
                        <span className="flex items-center gap-1 text-accent truncate max-w-[160px]">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {design.eventName}
                        </span>
                      )}
                    </div>

                    {/* Proofreading Status Box */}
                    <div className="pt-2 border-t border-border/60">
                      {design.proofreadRequested ? (
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                              Proofreading Status
                            </span>

                            {design.review?.status === 'Proofread Approved' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Approved
                              </span>
                            ) : design.review?.status === 'Changes Requested' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Changes Requested
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                                <Clock className="h-3.5 w-3.5" />
                                Pending Proofread
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block">Assigned Proofreader</span>
                            <span className="text-xs font-medium text-foreground truncate max-w-[120px] block">
                              {design.assignedProofreaderName || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                          <FileCheck className="h-3 w-3" /> No Proofreading Requested
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 pt-0 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-muted-foreground">
                    By <span className="font-medium text-foreground">{design.designerName}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAssignedToMe && design.review?.status === 'Pending Proofread' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black animate-pulse">
                        Action Required
                      </span>
                    )}

                    <button
                      onClick={() => openInspector(design)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors border border-border"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect & Review
                    </button>

                    {(design.designerEmail === user?.email || user?.tier <= 3) && (
                      <button
                        onClick={() => handleDelete(design.id, design.title)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete design"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-accent" />
                Submit Design Asset
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload your graphic asset (<span className="font-semibold">Max 25 MB</span>). Files are stored for <span className="font-semibold">30 days</span> under automatic retention policy.
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="font-medium text-foreground">Design Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tech Conclave Main Stage Banner"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Category & Event */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="Poster">Poster</option>
                    <option value="Banner">Banner</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Brochure">Brochure</option>
                    <option value="Certificates">Certificates</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground">Tag Event (Optional)</label>
                  <select
                    value={eventId}
                    onChange={e => setEventId(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">-- No Specific Event --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-medium text-foreground">Description & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Provide context, dimensions, or target printing specs..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* File Upload Box */}
              <div className="space-y-1">
                <label className="font-medium text-foreground flex items-center justify-between">
                  <span>File Asset (<span className="text-amber-500 font-bold">&lt; 25 MB</span>) *</span>
                  {file && (
                    <span className="font-mono text-muted-foreground text-[10px]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </label>

                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-accent/60 transition-colors bg-muted/20">
                  <input
                    type="file"
                    id="design-file-input"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="design-file-input" className="cursor-pointer space-y-2 block">
                    <UploadCloud className="h-8 w-8 mx-auto text-accent/80" />
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">
                        {file ? file.name : 'Click to select design file'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Supports PNG, JPG, WEBP, PDF up to 25 MB
                      </p>
                    </div>
                  </label>
                </div>

                {isReadingFile && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Preparing file...</span>
                      <span className="font-mono">{readProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-150 ease-out"
                        style={{ width: `${readProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {fileError && (
                  <p className="text-rose-500 font-medium text-[11px] flex items-center gap-1 pt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fileError}
                  </p>
                )}
              </div>

              {/* Proofreading Toggle & Person Selector */}
              <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={requestProofread}
                      onChange={e => setRequestProofread(e.target.checked)}
                      className="rounded border-border text-accent focus:ring-accent"
                    />
                    Request Peer / Advisor Proofreading
                  </label>
                  <MessageSquare className="h-4 w-4 text-accent" />
                </div>

                {requestProofread && (
                  <div className="space-y-1.5 pt-1">
                    <label className="font-medium text-foreground">
                      Select Proofreader from Directory *
                    </label>
                    <select
                      required={requestProofread}
                      value={assignedProofreaderId}
                      onChange={e => setAssignedProofreaderId(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">-- Choose Member --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role} - {m.division})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      The selected proofreader will be notified to review text accuracy, titles, and layout specs.
                    </p>
                  </div>
                )}
              </div>

              {isSubmitting && (
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Uploading to server...</p>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-full bg-accent rounded-full animate-pulse" />
                  </div>
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 text-[11px] flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{submitError} The file is still selected — you can try submitting again.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isReadingFile}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : isReadingFile ? 'Preparing file...' : submitError ? 'Retry Submit' : 'Submit Design'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Design Inspector & Proofreader Review Modal */}
      {showInspectorModal && selectedDesign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowInspectorModal(false);
                setSelectedDesign(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                    {selectedDesign.category}
                  </span>
                  <h2 className="text-lg font-bold">{selectedDesign.title}</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted by <span className="font-semibold text-foreground">{selectedDesign.designerName}</span> ({selectedDesign.designerEmail})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono bg-muted px-2 py-1 rounded border border-border block">
                  {(selectedDesign.fileSize / (1024 * 1024)).toFixed(2)} MB / 25 MB
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  30-Day Expiration: {selectedDesign.expiresAt.split('T')[0]}
                </span>
              </div>
            </div>

            {/* Asset Preview Frame */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 text-center space-y-3">
              {(selectedDesign.fileUrl || selectedDesign.fileData) && selectedDesign.fileType.startsWith('image/') ? (
                <div className="max-h-72 overflow-hidden rounded-lg border border-border mx-auto flex items-center justify-center">
                  <img
                    src={selectedDesign.fileUrl || selectedDesign.fileData}
                    alt={selectedDesign.title}
                    className="max-h-72 object-contain"
                  />
                </div>
              ) : selectedDesign.isExpired ? (
                <div className="py-8 space-y-2 text-rose-400">
                  <ShieldAlert className="h-10 w-10 mx-auto" />
                  <p className="font-bold text-sm">File Payload Purged under 30-Day Retention Policy</p>
                  <p className="text-xs text-muted-foreground">
                    This file exceeded the 30-day storage period. Metadata is preserved for audit trail.
                  </p>
                </div>
              ) : (
                <div className="py-8 space-y-2 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto text-accent" />
                  <p className="font-medium text-sm text-foreground">{selectedDesign.fileName}</p>
                  <p className="text-xs">{selectedDesign.fileType}</p>
                </div>
              )}

              {(selectedDesign.fileUrl || selectedDesign.fileData) && (
                <a
                  href={selectedDesign.fileUrl ? `${selectedDesign.fileUrl}?download=1` : selectedDesign.fileData}
                  download={selectedDesign.fileName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-medium text-foreground hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Download Full Resolution File
                </a>
              )}
            </div>

            {/* Replace File (design owner or admins only) */}
            {(selectedDesign.designerEmail === user?.email || canViewAllDesigns(user)) && (
              <form onSubmit={handleReplaceFileSubmit} className="border-t border-border pt-4 space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-accent" />
                  Replace Uploaded File
                </h3>
                <p className="text-xs text-muted-foreground">
                  Uploading a new file resets any proofread or style decision back to pending, since the reviewed asset no longer exists.
                </p>
                {replaceFileError && (
                  <p className="text-xs text-rose-500">{replaceFileError} The file selection is kept — you can try again.</p>
                )}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <input
                    type="file"
                    onChange={handleReplaceFileChange}
                    className="flex-1 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-accent file:text-white file:text-xs file:font-medium file:cursor-pointer cursor-pointer"
                  />
                  <button
                    type="submit"
                    disabled={isReplacingFile || isReadingReplaceFile || !replaceFile}
                    className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    {isReplacingFile ? 'Uploading...' : isReadingReplaceFile ? 'Preparing file...' : 'Replace File'}
                  </button>
                </div>
                {isReadingReplaceFile && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Preparing file...</span>
                      <span className="font-mono">{replaceReadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-150 ease-out"
                        style={{ width: `${replaceReadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {isReplacingFile && (
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-full bg-accent rounded-full animate-pulse" />
                  </div>
                )}
              </form>
            )}

            {/* Description & Event */}
            {selectedDesign.description && (
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-foreground">Designer Notes:</span>
                <p className="text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border">
                  {selectedDesign.description}
                </p>
              </div>
            )}

            {/* Proofreading Action Form (for Assigned Proofreader / Admins) */}
            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-accent" />
                  Proofreading Desk Review
                </h3>
                {selectedDesign.assignedProofreaderName && (
                  <span className="text-xs text-muted-foreground">
                    Assigned: <span className="font-semibold text-foreground">{selectedDesign.assignedProofreaderName}</span>
                  </span>
                )}
              </div>

              {selectedDesign.review?.comments && (
                <div className="bg-muted/30 p-3 rounded-lg border border-border space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-semibold text-foreground">Current Review Status:</span>
                    <span className="font-mono text-[10px]">{selectedDesign.review.reviewedAt?.split('T')[0]}</span>
                  </div>
                  <p className="text-foreground font-medium">{selectedDesign.review.status}</p>
                  <p className="text-muted-foreground italic">"{selectedDesign.review.comments}"</p>
                </div>
              )}

              {/* Reviewer Action Controls */}
              {(selectedDesign.assignedProofreaderEmail === user?.email || canViewAllDesigns(user)) ? (
                <form onSubmit={handleSaveReview} className="space-y-3 text-xs bg-muted/20 p-4 rounded-xl border border-border">
                  <p className="font-medium text-foreground">Update Proofreading Decision:</p>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="reviewStatus"
                        checked={reviewStatus === 'Proofread Approved'}
                        onChange={() => setReviewStatus('Proofread Approved')}
                        className="text-accent focus:ring-accent"
                      />
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve Design
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="reviewStatus"
                        checked={reviewStatus === 'Changes Requested'}
                        onChange={() => setReviewStatus('Changes Requested')}
                        className="text-accent focus:ring-accent"
                      />
                      <span className="text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Request Changes
                      </span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Proofreader Comments & Feedback</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Add specific corrections, text typos, color scheme notes..."
                      value={reviewComments}
                      onChange={e => setReviewComments(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit Proofreading Decision
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Only the assigned proofreader ({selectedDesign.assignedProofreaderName || 'assigned member'}) or Tier 1–3 leadership can submit a proofread decision for this design.
                </div>
              )}
            </div>

            {/* Design Head Style Evaluation Section */}
            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Design Style & Aesthetics Approval (Design Head)
                </h3>
                {selectedDesign.styleStatus && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    selectedDesign.styleStatus === 'Style Approved'
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                      : selectedDesign.styleStatus === 'Style Rejected'
                      ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                      : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                  }`}>
                    {selectedDesign.styleStatus}
                  </span>
                )}
              </div>

              {selectedDesign.styleFeedback && (
                <div className="bg-muted/30 p-3 rounded-lg border border-border space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-semibold text-foreground">Design Head Style Notes:</span>
                    <span className="font-mono text-[10px]">{selectedDesign.styleDecidedAt?.split('T')[0]} ({selectedDesign.styleDecidedBy})</span>
                  </div>
                  <p className="text-muted-foreground italic">"{selectedDesign.styleFeedback}"</p>
                </div>
              )}

              {(isDesignHead(user) || isCentreHead(user)) ? (
                <form onSubmit={handleSaveStyleReview} className="space-y-3 text-xs bg-accent/5 p-4 rounded-xl border border-accent/20">
                  <p className="font-medium text-foreground">{selectedDesign.styleStatus ? 'Update Design Style Decision:' : 'Submit Design Style Decision:'}</p>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="styleStatus"
                        checked={styleStatus === 'Style Approved'}
                        onChange={() => setStyleStatus('Style Approved')}
                        className="text-accent focus:ring-accent"
                      />
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve Style
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="styleStatus"
                        checked={styleStatus === 'Style Rejected'}
                        onChange={() => setStyleStatus('Style Rejected')}
                        className="text-accent focus:ring-accent"
                      />
                      <span className="text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Reject Style
                      </span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Style Feedback & Guidelines Compliance</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Feedback on typography, color scheme, design alignment..."
                      value={styleFeedback}
                      onChange={e => setStyleFeedback(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Save Style Decision
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Only a member with the designation of Design Head or Centre Head can approve or reject designs based on design style.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
