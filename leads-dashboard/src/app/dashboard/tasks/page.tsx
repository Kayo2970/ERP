'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  X,
  Calendar,
  User,
  Briefcase,
  CheckCircle2,
  Check,
  Ban,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  Search,
  PartyPopper,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  UserPlus,
  Megaphone,
  FileCheck2,
  GitBranch,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Paperclip,
  Palette,
  Download,
} from 'lucide-react';
import {
  getTasks,
  getEvents,
  isApprovedEvent,
  getMembers,
  addTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  submitTaskEdit,
  approveTask,
  rejectTask,
  respondToHolidayApproval,
  addEventCommittee,
  updateEventCommitteeMembers,
  uploadTaskAttachments,
  getDesigns,
  submitDesignCaptions,
  reviewDesignCaptions,
  completeDesignPosting,
  TaskItem,
  EventItem,
  Member,
  ReceiptFile,
  DesignSubmissionItem
} from '@/lib/local-data';
import { canViewTaskExtended, canManageTasks, canCreateTask, canEditTask, canDeleteTask, canRequestTaskExtension, canDecideTaskExtension, canChangeTaskStatus, isHeadRole, getTaskApprovalRequirement, canApprovePendingTask, canRespondToHolidayApproval, canDelegateAutoTask, canViewTaskDelegationTrail, canViewAllDesigns } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestApprovalModal } from '@/components/request-approval-modal';
import { DelegateTaskModal } from '@/components/delegate-task-modal';
import { FileDropzone, FilePreviewRow } from '@/components/ui/file-dropzone';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [designs, setDesigns] = useState<DesignSubmissionItem[]>([]);
  const [user, setUser] = useState<any>(null);

  // Inline caption form state (design_caption_draft / design_caption_review task cards) —
  // only one card's form is open/edited at a time, keyed by task id.
  const [captionDraftTaskId, setCaptionDraftTaskId] = useState<string | null>(null);
  const [captionDraftInsta, setCaptionDraftInsta] = useState('');
  const [captionDraftLinkedin, setCaptionDraftLinkedin] = useState('');
  const [captionReviewTaskId, setCaptionReviewTaskId] = useState<string | null>(null);
  const [captionReviewApproved, setCaptionReviewApproved] = useState(true);
  const [captionReviewComments, setCaptionReviewComments] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [extensionTask, setExtensionTask] = useState<TaskItem | null>(null);
  const [extensionReasonInput, setExtensionReasonInput] = useState('');
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [approvalRequestTask, setApprovalRequestTask] = useState<TaskItem | null>(null);
  const [delegatingTask, setDelegatingTask] = useState<TaskItem | null>(null);
  const [expandedTrailTaskId, setExpandedTrailTaskId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('standalone');
  const [assigneeType, setAssigneeType] = useState<'individual' | 'committee' | 'group'>('individual');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  // Committees only exist scoped to a specific event — the picker below is
  // always sourced from that event's own `committees` array, never a
  // generic cross-event name list, so the created task carries a real
  // eventCommitteeId that rating propagation can actually resolve.
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
  const [isCreatingCommittee, setIsCreatingCommittee] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState('');
  const [newCommitteeMemberIds, setNewCommitteeMemberIds] = useState<string[]>([]);
  // Ad-hoc "group" assignment — a task delegated to several individually
  // picked students, independent of any formal committee or event.
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [groupQuery, setGroupQuery] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskItem['status']>('Assigned');
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Design-brief task type — lets the requester (typically Faculty) attach
  // reference files and write out exactly what they want from the deliverable,
  // instead of a title alone.
  const [taskCategory, setTaskCategory] = useState<'general' | 'design'>('general');
  const [briefDescription, setBriefDescription] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ReceiptFile[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);

  // Searchable assignee combobox
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Deep link from a notification (?highlight=<taskId>) — scroll to and ring the task once
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [hasScrolledToHighlight, setHasScrolledToHighlight] = useState(false);

  // Filters & sorting — the board groups every visible task under its event
  // (Standalone last), and these narrow/reorder within that grouping instead
  // of flattening it back out.
  const [filterStudentId, setFilterStudentId] = useState('ALL');
  const [filterEventKey, setFilterEventKey] = useState('ALL');
  const [filterDueFrom, setFilterDueFrom] = useState('');
  const [filterDueTo, setFilterDueTo] = useState('');
  const [sortBy, setSortBy] = useState<'dueDateAsc' | 'dueDateDesc' | 'titleAsc' | 'status'>('dueDateAsc');

  useEffect(() => {
    const refreshData = () => {
      setTasks(getTasks());
      setEvents(getEvents());
      setDesigns(getDesigns());
      const mList = getMembers();
      setMembers(mList);
    };
    refreshData();

    const mList = getMembers();
    if (mList.length > 0) {
      setSelectedAssigneeId(mList[0].id);
    }
    
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Read the ?highlight=<taskId> or ?ack=<taskIds> query params (set by email links) on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setHighlightTaskId(params.get('highlight'));

    const ackParam = params.get('ack');
    const emailParam = params.get('email');
    if (ackParam) {
      fetch('/api/tasks/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: ackParam.split(','),
          email: emailParam || user?.email,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.acknowledgedCount > 0) {
            triggerSuccess(`✔ ${data.acknowledgedCount} task assignment(s) acknowledged!`);
            setTasks(getTasks());
          }
        })
        .catch(err => console.error('[tasks-ack] Auto-acknowledgment failed:', err));
    }
  }, [user]);

  // Once the highlighted task has actually rendered, scroll to it — retries on every
  // tasks refresh until found, since it may not exist locally yet on first paint.
  useEffect(() => {
    if (!highlightTaskId || hasScrolledToHighlight) return;
    const el = document.getElementById(`task-${highlightTaskId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHasScrolledToHighlight(true);
    }
  }, [tasks, highlightTaskId, hasScrolledToHighlight]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const openCaptionDraft = (task: TaskItem) => {
    const design = designs.find(d => d.id === task.designId);
    setCaptionDraftTaskId(task.id);
    setCaptionDraftInsta(design?.draftInstagramCaption || '');
    setCaptionDraftLinkedin(design?.draftLinkedinCaption || '');
  };

  const handleSubmitCaptionDraft = (e: React.FormEvent, task: TaskItem) => {
    e.preventDefault();
    if (!user || !task.designId || !captionDraftInsta.trim()) return;
    const updated = submitDesignCaptions(task.designId, captionDraftInsta.trim(), captionDraftLinkedin.trim(), user.name);
    if (updated) {
      setDesigns(getDesigns());
      setTasks(getTasks());
      setCaptionDraftTaskId(null);
      triggerSuccess('Captions submitted for proofreader approval.');
    }
  };

  const openCaptionReview = (task: TaskItem) => {
    const design = designs.find(d => d.id === task.designId);
    setCaptionReviewTaskId(task.id);
    setCaptionReviewApproved(true);
    setCaptionReviewComments(design?.captionReviewComments || '');
  };

  const handleReviewCaptionDraft = (e: React.FormEvent, task: TaskItem) => {
    e.preventDefault();
    if (!user || !task.designId) return;
    const updated = reviewDesignCaptions(task.designId, captionReviewApproved, captionReviewComments.trim(), user.name);
    if (updated) {
      setDesigns(getDesigns());
      setTasks(getTasks());
      setCaptionReviewTaskId(null);
      triggerSuccess(captionReviewApproved ? 'Captions approved — posting tasks created.' : 'Revision requested — sent back to the designer.');
    }
  };

  const handleCompleteCaptionPosting = (task: TaskItem, platform: 'instagram' | 'linkedin') => {
    if (!user || !task.designId) return;
    const updated = completeDesignPosting(task.designId, platform, user.name);
    if (updated) {
      setDesigns(getDesigns());
      setTasks(getTasks());
      triggerSuccess(`Marked posted on ${platform === 'instagram' ? 'Instagram' : 'LinkedIn'}.`);
    }
  };

  const handleOpenCreate = () => {
    setTitle('');
    setSelectedEventId('standalone');
    setAssigneeType('individual');
    if (members.length > 0) setSelectedAssigneeId(members[0].id);
    setSelectedCommitteeId('');
    setIsCreatingCommittee(false);
    setNewCommitteeName('');
    setNewCommitteeMemberIds([]);
    setSelectedGroupMemberIds([]);
    setGroupQuery('');
    setDueDate('');
    setStatus('Assigned');
    setAssigneeQuery('');
    setIsAssigneeDropdownOpen(false);
    setFormError('');
    setTaskCategory('general');
    setBriefDescription('');
    setAttachedFiles([]);
    setExistingAttachments([]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setSelectedEventId(task.eventId || 'standalone');
    setAssigneeType(task.assigneeType);
    setIsCreatingCommittee(false);
    setNewCommitteeName('');
    setNewCommitteeMemberIds([]);
    if (task.assigneeType === 'individual') {
      const match = members.find(m => m.name === task.assignee || m.email === task.assigneeEmail);
      if (match) setSelectedAssigneeId(match.id);
      setSelectedGroupMemberIds([]);
    } else if (task.assigneeType === 'committee') {
      setSelectedCommitteeId(task.eventCommitteeId || '');
    } else {
      setSelectedGroupMemberIds(task.assigneeIds || []);
    }
    setGroupQuery('');
    setDueDate(task.dueDate);
    setStatus(task.status);
    setAssigneeQuery('');
    setIsAssigneeDropdownOpen(false);
    setFormError('');
    setTaskCategory(task.taskCategory || 'general');
    setBriefDescription(task.briefDescription || '');
    setAttachedFiles([]);
    setExistingAttachments(task.attachments || []);
  };

  const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read that file.')));
    reader.onerror = () => reject(new Error(`Could not read "${file.name}". Please try selecting it again.`));
    reader.readAsDataURL(file);
  });

  const handleAttachmentFilesSelected = (files: File[]) => {
    if (existingAttachments.length + attachedFiles.length + files.length > 5) {
      setFormError('Maximum 5 attachments allowed per task.');
      return;
    }
    setFormError('');
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title || !dueDate) return;
    if (taskCategory === 'design' && !briefDescription.trim()) {
      setFormError('Describe what you want from this design deliverable — the designer needs a real brief, not just a title.');
      return;
    }

    // Upload any newly attached reference files first (awaited) so the task
    // record only ever stores real url/storageKey values, never inline
    // base64 sitting in localStorage.
    let finalAttachments = existingAttachments;
    if (taskCategory === 'design' && attachedFiles.length > 0) {
      setIsUploadingAttachments(true);
      try {
        const filesPayload = await Promise.all(
          attachedFiles.map(async (file) => ({
            name: file.name,
            dataUrl: await readFileAsDataUrl(file),
            type: file.type,
          }))
        );
        const recordId = editingTask?.id || `task_att_${Date.now()}`;
        const uploaded = await uploadTaskAttachments(recordId, filesPayload, existingAttachments.length);
        finalAttachments = [...existingAttachments, ...uploaded];
      } catch (err: any) {
        setIsUploadingAttachments(false);
        setFormError(err?.message || 'Failed to upload attachment(s). Please try again.');
        return;
      }
      setIsUploadingAttachments(false);
    }

    let eventTitle = 'Standalone';
    let eventIdVal = undefined;

    if (selectedEventId !== 'standalone') {
      const eventObj = events.find(ev => ev.id === selectedEventId);
      if (eventObj) {
        eventTitle = eventObj.title;
        eventIdVal = eventObj.id;
      }
    }

    let assigneeName = '';
    let assigneeEmailVal = undefined;
    let assigneeIdVal = undefined;
    let assigneeIdsVal: string[] | undefined = undefined;
    let committeeIdVal: string | undefined = undefined;
    let committeeNameVal: string | undefined = undefined;

    if (assigneeType === 'individual') {
      const memberObj = members.find(m => m.id === selectedAssigneeId);
      if (!memberObj) {
        setFormError('Select a member to assign this task to.');
        return;
      }
      assigneeName = memberObj.name;
      assigneeEmailVal = memberObj.email;
      assigneeIdVal = memberObj.id;
    } else if (assigneeType === 'committee') {
      // Committees only exist scoped to an event — this must resolve to a
      // real EventCommittee on the selected event, not a free-text name,
      // or ratings can never be fanned out to its members later.
      if (!eventIdVal) {
        setFormError('Select an event first — committees are always tied to a specific event.');
        return;
      }
      const eventObj = events.find(ev => ev.id === eventIdVal);
      if (!eventObj) {
        setFormError('Select a valid event.');
        return;
      }

      if (isCreatingCommittee) {
        if (!newCommitteeName.trim()) {
          setFormError('Enter a name for the new committee.');
          return;
        }
        const updatedEvent = addEventCommittee(eventIdVal, newCommitteeName.trim(), user?.name || 'User');
        const createdCommittee = updatedEvent?.committees.find(c => c.name === newCommitteeName.trim());
        if (!createdCommittee) {
          setFormError('Could not create the committee. Please try again.');
          return;
        }
        if (newCommitteeMemberIds.length > 0) {
          updateEventCommitteeMembers(eventIdVal, createdCommittee.id, newCommitteeMemberIds, user?.name || 'User');
        }
        committeeIdVal = createdCommittee.id;
        committeeNameVal = createdCommittee.name;
      } else {
        const committee = eventObj.committees.find(c => c.id === selectedCommitteeId);
        if (!committee) {
          setFormError('Select a committee for this event, or create a new one.');
          return;
        }
        committeeIdVal = committee.id;
        committeeNameVal = committee.name;
      }
      assigneeName = committeeNameVal || '';
    } else {
      if (selectedGroupMemberIds.length === 0) {
        setFormError('Select at least one student for this group task.');
        return;
      }
      const groupMembers = members.filter(m => selectedGroupMemberIds.includes(m.id));
      assigneeName = `${groupMembers.length} students: ${groupMembers.map(m => m.name).join(', ')}`;
      assigneeIdsVal = selectedGroupMemberIds;
    }

    if (editingTask) {
      const changes = {
        title,
        event: eventTitle,
        eventId: eventIdVal,
        eventCommitteeId: committeeIdVal,
        eventCommitteeName: committeeNameVal,
        assignee: assigneeName,
        assigneeId: assigneeIdVal,
        assigneeEmail: assigneeEmailVal,
        assigneeIds: assigneeIdsVal,
        assigneeType,
        dueDate,
        status,
        taskCategory,
        briefDescription: taskCategory === 'design' ? briefDescription.trim() : undefined,
        attachments: taskCategory === 'design' ? finalAttachments : undefined,
      };
      const approval = getTaskApprovalRequirement(user, 'EDIT');
      if (approval.requiresApproval) {
        submitTaskEdit(editingTask.id, changes, user?.name || 'User', user?.email || '', {
          approverType: approval.approverType,
          approverMemberId: approval.approverMemberId,
          approverPolicyTagId: approval.approverPolicyTagId,
          policyName: approval.policyName,
        });
        triggerSuccess(`Edit submitted for approval from ${approval.approverName}. It will apply once approved.`);
      } else {
        updateTask(editingTask.id, changes, user?.name || 'User');
        triggerSuccess('Task updated successfully.');
      }
      setEditingTask(null);
    } else {
      const newTaskBase = {
        title,
        event: eventTitle,
        eventId: eventIdVal,
        eventCommitteeId: committeeIdVal,
        eventCommitteeName: committeeNameVal,
        assignee: assigneeName,
        assigneeId: assigneeIdVal,
        assigneeEmail: assigneeEmailVal,
        assigneeIds: assigneeIdsVal,
        assigneeType,
        dueDate,
        status,
        creatorName: user?.name || 'User',
        taskCategory,
        briefDescription: taskCategory === 'design' ? briefDescription.trim() : undefined,
        attachments: taskCategory === 'design' ? finalAttachments : undefined,
      };
      const approval = getTaskApprovalRequirement(user, 'CREATE');
      if (approval.requiresApproval) {
        addTask({
          ...newTaskBase,
          approvalStatus: 'pending_create',
          approverType: approval.approverType,
          approverMemberId: approval.approverMemberId,
          approverPolicyTagId: approval.approverPolicyTagId,
          approvalPolicyName: approval.policyName,
          submittedBy: user?.name,
          submittedByEmail: user?.email,
        });
        triggerSuccess(`Task submitted for approval from ${approval.approverName}. It will be assigned once approved.`);
      } else {
        addTask(newTaskBase);
        triggerSuccess('Task assigned successfully.');
      }
      setIsCreateModalOpen(false);
    }

    setTasks(getTasks());
  };

  const handleApproveTask = (id: string) => {
    approveTask(id, user?.name || 'User');
    setTasks(getTasks());
    triggerSuccess('Approved. The task is now live.');
  };

  const handleConfirmRejectTask = () => {
    if (!rejectingTaskId) return;
    rejectTask(rejectingTaskId, user?.name || 'User', rejectionReasonInput || undefined);
    setTasks(getTasks());
    setRejectingTaskId(null);
    setRejectionReasonInput('');
    triggerSuccess('Rejected.');
  };

  const handleStatusChange = (id: string, newStatus: TaskItem['status']) => {
    updateTaskStatus(id, newStatus);
    setTasks(getTasks());
    triggerSuccess(`Task status changed to ${newStatus}.`);
  };

  const handleConfirmComplete = () => {
    if (!completingTaskId) return;
    handleStatusChange(completingTaskId, 'Completed');
    setCompletingTaskId(null);
  };

  const handleHolidayApprovalResponse = (id: string, approved: boolean) => {
    respondToHolidayApproval(id, approved, user?.name || 'User');
    setTasks(getTasks());
    triggerSuccess(approved ? 'Approved — a design & posting task has been assigned.' : 'Noted — no post needed for this one.');
  };

  const handleRequestExtensionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionTask) return;
    updateTask(extensionTask.id, {
      status: 'Pending Extension',
      extensionReason: extensionReasonInput || 'Need additional time for deliverables.'
    }, user?.name || 'User');
    setExtensionTask(null);
    setExtensionReasonInput('');
    setTasks(getTasks());
    triggerSuccess('Extension request submitted to leadership.');
  };

  const handleDecideExtension = (taskId: string, approve: boolean) => {
    const now = new Date().toISOString().split('T')[0];
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (approve) {
      // Extend due date by 3 days automatically
      const currentDue = new Date(task.dueDate);
      currentDue.setDate(currentDue.getDate() + 3);
      const newDueStr = currentDue.toISOString().split('T')[0];
      
      updateTask(taskId, {
        status: 'In Progress',
        dueDate: newDueStr,
        decidedBy: user?.name || 'Approver',
        decidedAt: now,
      }, user?.name || 'User');
      triggerSuccess(`Extension approved. New due date: ${newDueStr}`);
    } else {
      updateTask(taskId, {
        status: 'In Progress',
        decidedBy: `${user?.name || 'Approver'} (Denied)`,
        decidedAt: now,
      }, user?.name || 'User');
      triggerSuccess('Extension request denied. Status returned to In Progress.');
    }
    setTasks(getTasks());
  };

  const handleConfirmDelete = () => {
    if (!deletingTaskId) return;
    deleteTask(deletingTaskId, user?.name || 'User');
    setDeletingTaskId(null);
    setTasks(getTasks());
    triggerSuccess('Task deleted successfully.');
  };

  // Visibility: a pending/rejected submission is only shown to its submitter, its
  // resolved approver, the Super User, and — so they can audit the delegation
  // flow live, not just after the fact — the Centre Head / GG Campus Events
  // Head. Everyone else sees nothing of it until it's approved, mirroring the
  // same rule on the Events page.
  const canSeeTaskApprovalMeta = (task: TaskItem) =>
    user?.tier === 1 || task.submittedByEmail === user?.email || canApprovePendingTask(task, user) || canViewTaskDelegationTrail(user);

  // Filter tasks based on shared permission helper, layered with the approval-visibility rule above
  const displayedTasks = tasks.filter(task => {
    if (task.approvalStatus === 'pending_create' || task.approvalStatus === 'rejected') {
      return canSeeTaskApprovalMeta(task);
    }
    return canViewTaskExtended(task, user);
  });
  const canManage = canManageTasks(user);

  // Distinct events actually present in the visible task list, in the order
  // they first appear — populates the Event filter without listing events
  // that have no tasks a viewer can see.
  const eventGroupOptions: { key: string; label: string }[] = [];
  displayedTasks.forEach(t => {
    const key = t.eventId || 'standalone';
    if (!eventGroupOptions.some(g => g.key === key)) {
      eventGroupOptions.push({ key, label: t.event || 'Standalone' });
    }
  });

  const taskMatchesStudent = (task: TaskItem, studentId: string) =>
    task.assigneeId === studentId || (task.assigneeIds || []).includes(studentId);

  const filteredTasks = displayedTasks.filter(task => {
    if (filterStudentId !== 'ALL' && !taskMatchesStudent(task, filterStudentId)) return false;
    if (filterEventKey !== 'ALL' && (task.eventId || 'standalone') !== filterEventKey) return false;
    if (filterDueFrom && task.dueDate < filterDueFrom) return false;
    if (filterDueTo && task.dueDate > filterDueTo) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDateDesc':
        return b.dueDate.localeCompare(a.dueDate);
      case 'titleAsc':
        return a.title.localeCompare(b.title);
      case 'status':
        return a.status.localeCompare(b.status) || a.dueDate.localeCompare(b.dueDate);
      case 'dueDateAsc':
      default:
        return a.dueDate.localeCompare(b.dueDate);
    }
  });

  // Group into per-event sections so the board reads as "what's due for this
  // event" instead of one long undifferentiated wall of cards — Standalone
  // tasks are pushed to the end since they have no event to group under.
  const taskGroups: { key: string; label: string; tasks: TaskItem[] }[] = [];
  sortedTasks.forEach(task => {
    const key = task.eventId || 'standalone';
    let group = taskGroups.find(g => g.key === key);
    if (!group) {
      group = { key, label: task.event || 'Standalone', tasks: [] };
      taskGroups.push(group);
    }
    group.tasks.push(task);
  });
  taskGroups.sort((a, b) => {
    if (a.key === 'standalone') return 1;
    if (b.key === 'standalone') return -1;
    return a.label.localeCompare(b.label);
  });

  const hasActiveFilters = filterStudentId !== 'ALL' || filterEventKey !== 'ALL' || filterDueFrom || filterDueTo;
  const clearFilters = () => {
    setFilterStudentId('ALL');
    setFilterEventKey('ALL');
    setFilterDueFrom('');
    setFilterDueTo('');
  };

  const selectedAssigneeMember = members.find(m => m.id === selectedAssigneeId);
  // The full member roster is always searchable here — a Department Head used
  // to have this list hard-filtered down to just their own department/tier-6
  // members, which on a lot of real rosters (mismatched department strings,
  // no tier-6 members at all) meant the dropdown showed nobody. Now everyone
  // is shown; a Department Head's own department/tier-6 members are simply
  // sorted first for convenience, exactly like the "prioritize" comment
  // always intended, instead of being the only ones shown.
  const filteredAssignees = members
    .filter(m => {
      const q = assigneeQuery.toLowerCase();
      return !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (user && isHeadRole(user) && user.tier > 3) {
        const dept = user.department;
        const aPriority = a.tier === 6 || a.department === dept ? 0 : 1;
        const bPriority = b.tier === 6 || b.department === dept ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
      }
      return a.name.localeCompare(b.name);
    });

  const handleSelectAssignee = (member: Member) => {
    setSelectedAssigneeId(member.id);
    setAssigneeQuery('');
    setIsAssigneeDropdownOpen(false);
  };

  const getStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'Assigned':
        return 'bg-accent/15 text-accent border border-accent/20';
      case 'In Progress':
        return 'bg-warning/15 text-warning border border-warning/20';
      case 'Completed':
        return 'bg-success/15 text-success border border-success/20';
      case 'Pending Extension':
        return 'bg-danger/15 text-danger border border-danger/20';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Task Management</h1>
          <p className="text-xs text-theme-text-secondary">Track assignments, manage extensions, and audit deliverable progress</p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Assign Task
          </button>
        )}
      </div>

      {/* Advisory Board Alert */}
      {user && user.tier === 4 && (
        <div className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <AlertCircle className="h-5 w-5 text-accent shrink-0" />
          <span>
            <strong>Advisory Board Notice:</strong> Advisory Board members do not receive operational task assignments. You can review overall center performance and event progress under the Reports module.
          </span>
        </div>
      )}

      {/* Pending Extension Review Queue (Leadership or Faculty) */}
      {canDecideTaskExtension(user) && tasks.filter(t => t.status === 'Pending Extension').length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-danger/30 bg-danger/5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-danger" />
            <h3 className="text-xs font-bold text-theme-text-primary uppercase tracking-wider">
              Extension Requests Awaiting Leadership Decision ({tasks.filter(t => t.status === 'Pending Extension').length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.filter(t => t.status === 'Pending Extension').map(task => (
              <div key={task.id} className="p-3 bg-theme-background/40 border border-theme-border/40 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-theme-text-primary">{task.title}</h4>
                  <span className="text-[10px] text-theme-text-secondary">Due: {task.dueDate}</span>
                </div>
                <p className="text-[11px] text-theme-text-secondary">
                  <strong>Assignee:</strong> {task.assignee} &middot; <strong>Reason:</strong> {task.extensionReason || 'No justification provided'}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleDecideExtension(task.id, true)}
                    className="flex-1 py-1.5 bg-success hover:bg-success/90 text-white font-semibold text-[11px] rounded-lg transition-all cursor-pointer"
                  >
                    Grant +3 Days
                  </button>
                  <button
                    onClick={() => handleDecideExtension(task.id, false)}
                    className="flex-1 py-1.5 bg-danger hover:bg-danger/90 text-white font-semibold text-[11px] rounded-lg transition-all cursor-pointer"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Sorting */}
      {displayedTasks.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-end gap-3 text-xs">
          <div className="space-y-1">
            <label className="block font-medium text-theme-text-secondary">Student</label>
            <select
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent min-w-[10rem]"
            >
              <option value="ALL">All Students</option>
              {members.slice().sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-theme-text-secondary">Event</label>
            <select
              value={filterEventKey}
              onChange={(e) => setFilterEventKey(e.target.value)}
              className="px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent min-w-[10rem]"
            >
              <option value="ALL">All Events</option>
              {eventGroupOptions.map(g => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-theme-text-secondary">Due From</label>
            <input
              type="date"
              value={filterDueFrom}
              onChange={(e) => setFilterDueFrom(e.target.value)}
              className="px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-theme-text-secondary">Due To</label>
            <input
              type="date"
              value={filterDueTo}
              onChange={(e) => setFilterDueTo(e.target.value)}
              className="px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-medium text-theme-text-secondary">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent min-w-[9rem]"
            >
              <option value="dueDateAsc">Due Date (Soonest)</option>
              <option value="dueDateDesc">Due Date (Latest)</option>
              <option value="titleAsc">Title (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-lg transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Task Board — grouped by event so it doesn't read as one undifferentiated wall of cards */}
      {displayedTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks to display"
          description={user?.tier === 4 ? "Advisory Board members do not receive task assignments." : "No tasks assigned to your current filter."}
          actionLabel={canManage ? "Assign Task" : undefined}
          onAction={canManage ? handleOpenCreate : undefined}
        />
      ) : sortedTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks match your filters"
          description="Try widening the student, event, or due date filters."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="space-y-4">
          {taskGroups.map(group => (
            <details key={group.key} open className="group glass-panel rounded-2xl p-4">
              <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                <span className="flex items-center gap-2 text-sm font-bold text-theme-text-primary">
                  <Briefcase className="h-4 w-4 text-accent" />
                  {group.label}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-theme-border/30 text-theme-text-secondary">
                    {group.tasks.length}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-theme-text-secondary transition-transform group-open:rotate-180" />
              </summary>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
                {group.tasks.map((task) => (
            <div
              key={task.id}
              id={`task-${task.id}`}
              className={`glass-panel rounded-2xl p-6 flex flex-col justify-between hover:bg-theme-border/10 transition-all border space-y-4 ${
                task.id === highlightTaskId ? 'border-accent ring-2 ring-accent/50' : 'border-theme-card-border/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${getStatusBadge(task.status)}`}>
                    {task.status}
                  </span>
                  <span className="text-[11px] text-theme-text-secondary font-medium flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    Due: {task.dueDate}
                  </span>
                </div>
                
                {(task.approvalStatus === 'pending_create' || task.approvalStatus === 'pending_edit') && canSeeTaskApprovalMeta(task) && (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-warning/10 border border-warning/25 rounded-xl text-[11px]">
                    <div className="flex items-center gap-1.5 text-warning font-semibold">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {task.approvalStatus === 'pending_edit' ? 'Edit awaiting approval' : 'Awaiting approval'}
                        {task.submittedBy ? ` from ${task.submittedBy === user?.name ? 'you' : task.submittedBy}` : ''}
                      </span>
                    </div>
                    {canApprovePendingTask(task, user) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleApproveTask(task.id)}
                          className="p-1 hover:bg-success/15 rounded-md text-success cursor-pointer"
                          title="Approve"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setRejectingTaskId(task.id)}
                          className="p-1 hover:bg-danger/15 rounded-md text-danger cursor-pointer"
                          title="Reject"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {task.approvalStatus === 'rejected' && canSeeTaskApprovalMeta(task) && (
                  <div className="flex items-center gap-1.5 p-2.5 bg-danger/10 border border-danger/25 rounded-xl text-[11px] text-danger font-semibold">
                    <Ban className="h-3.5 w-3.5 shrink-0" />
                    <span>Rejected by {task.decidedBy || 'approver'}{task.rejectionReason ? `: ${task.rejectionReason}` : ''}</span>
                  </div>
                )}

                <div className="space-y-1">
                  {(task.workflowType === 'holiday_social_approval' || task.workflowType === 'holiday_design_social') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning/15 border border-warning/30 text-warning text-[10px] font-bold rounded-full">
                      <PartyPopper className="h-3 w-3" /> Holiday Social Media
                    </span>
                  )}
                  {task.workflowType === 'event_social_post' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold rounded-full">
                      <Megaphone className="h-3 w-3" /> Post-Event Social Media
                    </span>
                  )}
                  {task.workflowType === 'event_report_assignment' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning/15 border border-warning/30 text-warning text-[10px] font-bold rounded-full">
                      <FileCheck2 className="h-3 w-3" /> Pick Who Prepares the Event Report
                    </span>
                  )}
                  {task.workflowType === 'event_report_request' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold rounded-full">
                      <FileCheck2 className="h-3 w-3" /> Event Report Request
                    </span>
                  )}
                  {task.workflowType === 'design_caption_draft' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold rounded-full">
                      <Edit2 className="h-3 w-3" /> Caption Required
                    </span>
                  )}
                  {task.workflowType === 'design_caption_review' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning/15 border border-warning/30 text-warning text-[10px] font-bold rounded-full">
                      <UserCheck className="h-3 w-3" /> Caption Approval
                    </span>
                  )}
                  {task.workflowType === 'design_social_posting' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/15 border border-success/30 text-success text-[10px] font-bold rounded-full">
                      <Megaphone className="h-3 w-3" /> Post {task.platform === 'linkedin' ? 'LinkedIn' : 'Instagram'} Caption
                    </span>
                  )}
                  {task.taskCategory === 'design' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold rounded-full">
                      <Palette className="h-3 w-3" /> Design Task
                    </span>
                  )}
                  <h3 className="font-bold text-sm text-theme-text-primary leading-snug">{task.title}</h3>
                  <p className="text-[11px] text-theme-text-secondary flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Event: <span className="font-medium text-theme-text-primary">{task.event || 'Standalone'}</span>
                  </p>
                  <p className="text-[11px] text-theme-text-secondary flex items-center gap-1">
                    {task.assigneeType === 'individual' ? <User className="h-3 w-3 text-accent" /> : <Users className="h-3 w-3 text-warning" />}
                    {task.assigneeType === 'committee' ? 'Committee' : task.assigneeType === 'group' ? 'Group' : 'Assignee'}:{' '}
                    <span className="font-medium text-theme-text-primary">{task.assignee}</span>
                  </p>
                  {task.decidedBy && (
                    <p className="text-[10px] text-theme-text-secondary italic pt-1">
                      Extension decision: {task.decidedBy} ({task.decidedAt})
                    </p>
                  )}
                </div>

                {task.taskCategory === 'design' && (task.briefDescription || (task.attachments && task.attachments.length > 0)) && (
                  <div className="p-2.5 bg-theme-background/30 border border-theme-border/30 rounded-xl space-y-2">
                    {task.briefDescription && (
                      <p className="text-[11px] text-theme-text-secondary whitespace-pre-wrap">
                        <span className="font-semibold text-theme-text-primary">Brief: </span>
                        {task.briefDescription}
                      </p>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {task.attachments.map((f, i) => (
                          <a
                            key={f.storageKey || f.url || i}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 hover:bg-accent/20 border border-accent/25 text-accent text-[10px] font-medium rounded-lg transition-all max-w-full"
                            title={f.name}
                          >
                            <Paperclip className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[9rem]">{f.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Caption workflow — draft, approve, or mark-posted, inline on the task card so the
                    assignee never has to leave Tasks and go hunt down the linked design record. */}
                {(task.workflowType === 'design_caption_draft' || task.workflowType === 'design_caption_review' || task.workflowType === 'design_social_posting') && (() => {
                  const design = designs.find(d => d.id === task.designId);
                  if (!design) return null;

                  if (task.workflowType === 'design_caption_draft' && task.status !== 'Completed') {
                    const canDraft = task.assigneeEmail ? task.assigneeEmail === user?.email : task.assignee === user?.name;
                    if (!canDraft) {
                      return (
                        <p className="text-[11px] text-theme-text-secondary italic p-2.5 bg-theme-background/30 border border-theme-border/30 rounded-xl">
                          Awaiting captions from {task.assignee}.
                        </p>
                      );
                    }
                    return (
                      <div className="p-3 bg-theme-background/30 border border-theme-border/30 rounded-xl space-y-2">
                        {design.captionReviewComments && (
                          <div className="p-2 bg-danger/10 border border-danger/25 text-danger rounded-lg text-[11px]">
                            <strong>Revision notes:</strong> {design.captionReviewComments}
                          </div>
                        )}
                        {captionDraftTaskId === task.id ? (
                          <form onSubmit={(e) => handleSubmitCaptionDraft(e, task)} className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-theme-text-primary">Instagram Caption *</label>
                              <textarea
                                rows={2}
                                required
                                autoFocus
                                placeholder="Write the Instagram caption..."
                                value={captionDraftInsta}
                                onChange={e => setCaptionDraftInsta(e.target.value)}
                                className="w-full bg-theme-background border border-theme-border rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-accent"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-theme-text-primary">LinkedIn Caption</label>
                              <textarea
                                rows={2}
                                placeholder="Optional — same as Instagram if left blank"
                                value={captionDraftLinkedin}
                                onChange={e => setCaptionDraftLinkedin(e.target.value)}
                                className="w-full bg-theme-background border border-theme-border rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-accent"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="submit" className="px-2.5 py-1 bg-accent hover:bg-primary-light text-white font-semibold rounded-lg transition-all text-[11px] cursor-pointer">
                                Submit for Approval
                              </button>
                              <button type="button" onClick={() => setCaptionDraftTaskId(null)} className="px-2.5 py-1 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-lg transition-all text-[11px] cursor-pointer">
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCaptionDraft(task)}
                            className="w-full px-2.5 py-1.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-lg transition-all text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" /> Write Captions
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (task.workflowType === 'design_caption_review' && task.status !== 'Completed') {
                    const canReview = design.assignedProofreaderEmail === user?.email || canViewAllDesigns(user);
                    return (
                      <div className="p-3 bg-theme-background/30 border border-theme-border/30 rounded-xl space-y-2">
                        <div className="text-[11px] space-y-1.5">
                          <div>
                            <span className="font-semibold text-theme-text-primary">Instagram: </span>
                            <span className="text-theme-text-secondary whitespace-pre-wrap">{design.draftInstagramCaption || 'N/A'}</span>
                          </div>
                          {design.draftLinkedinCaption && (
                            <div>
                              <span className="font-semibold text-theme-text-primary">LinkedIn: </span>
                              <span className="text-theme-text-secondary whitespace-pre-wrap">{design.draftLinkedinCaption}</span>
                            </div>
                          )}
                        </div>
                        {!canReview ? (
                          <p className="text-[11px] text-theme-text-secondary italic">
                            Pending review by {design.assignedProofreaderName || 'the assigned proofreader'}.
                          </p>
                        ) : captionReviewTaskId === task.id ? (
                          <form onSubmit={(e) => handleReviewCaptionDraft(e, task)} className="space-y-2">
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium">
                                <input type="radio" name={`captionReview-${task.id}`} checked={captionReviewApproved} onChange={() => setCaptionReviewApproved(true)} />
                                <span className="text-success font-semibold">Approve</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium">
                                <input type="radio" name={`captionReview-${task.id}`} checked={!captionReviewApproved} onChange={() => setCaptionReviewApproved(false)} />
                                <span className="text-danger font-semibold">Request Revision</span>
                              </label>
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Feedback for the designer (optional if approving)..."
                              value={captionReviewComments}
                              onChange={e => setCaptionReviewComments(e.target.value)}
                              className="w-full bg-theme-background border border-theme-border rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-accent"
                            />
                            <div className="flex items-center gap-2">
                              <button type="submit" className="px-2.5 py-1 bg-accent hover:bg-primary-light text-white font-semibold rounded-lg transition-all text-[11px] cursor-pointer">
                                Submit Decision
                              </button>
                              <button type="button" onClick={() => setCaptionReviewTaskId(null)} className="px-2.5 py-1 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-lg transition-all text-[11px] cursor-pointer">
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCaptionReview(task)}
                            className="w-full px-2.5 py-1.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-lg transition-all text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="h-3 w-3" /> Review Captions
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (task.workflowType === 'design_social_posting' && task.status !== 'Completed') {
                    const platform = task.platform || 'instagram';
                    const caption = platform === 'linkedin' ? (design.approvedLinkedinCaption || design.approvedInstagramCaption) : design.approvedInstagramCaption;
                    const done = platform === 'linkedin' ? design.postingLinkedinDone : design.postingInstagramDone;
                    return (
                      <div className="p-3 bg-theme-background/30 border border-theme-border/30 rounded-xl space-y-2">
                        <p className="text-[11px] text-theme-text-secondary whitespace-pre-wrap">{caption}</p>
                        {done ? (
                          <p className="text-[11px] font-semibold text-success">Posted &amp; marked complete</p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCompleteCaptionPosting(task, platform)}
                            className="w-full px-2.5 py-1.5 bg-success hover:bg-success/90 text-white font-semibold rounded-lg transition-all text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Mark Posted on {platform === 'linkedin' ? 'LinkedIn' : 'Instagram'}
                          </button>
                        )}
                      </div>
                    );
                  }

                  return null;
                })()}

                {canViewTaskDelegationTrail(user) && task.delegationTrail && task.delegationTrail.length > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={() => setExpandedTrailTaskId(expandedTrailTaskId === task.id ? null : task.id)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-accent hover:text-primary-light transition-all cursor-pointer"
                    >
                      <GitBranch className="h-3 w-3" />
                      Delegation Flow ({task.delegationTrail.length})
                      {expandedTrailTaskId === task.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {expandedTrailTaskId === task.id && (
                      <ol className="mt-2 space-y-1.5 border-l-2 border-accent/25 pl-3">
                        {task.delegationTrail.map((step, i) => (
                          <li key={i} className="text-[10px] text-theme-text-secondary">
                            <span className={`font-semibold ${
                              step.action === 'approved' ? 'text-success' :
                              step.action === 'rejected' ? 'text-danger' :
                              'text-theme-text-primary'
                            }`}>
                              {step.action === 'submitted_for_review' ? 'Submitted for review' :
                               step.action === 'delegated' ? 'Delegated' :
                               step.action === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                            {' '}by <span className="font-medium text-theme-text-primary">{step.actorName}</span>
                            {step.targetName && (
                              <> <ArrowRight className="inline h-2.5 w-2.5 mx-0.5" /> <span className="font-medium text-theme-text-primary">{step.targetName}</span></>
                            )}
                            {step.note && <span className="italic"> — {step.note}</span>}
                            <span className="block text-[9px] opacity-70">{new Date(step.at).toLocaleString()}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>

              {/* Task Actions */}
              <div className="border-t border-theme-border/20 pt-3 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {task.workflowType === 'holiday_social_approval' && task.status !== 'Completed' ? (
                    canRespondToHolidayApproval(task, user) ? (
                      <>
                        <button
                          onClick={() => handleHolidayApprovalResponse(task.id, true)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-success hover:bg-success/90 text-white font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                        >
                          <ThumbsUp className="h-3 w-3" /> Yes, post needed
                        </button>
                        <button
                          onClick={() => handleHolidayApprovalResponse(task.id, false)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                        >
                          <ThumbsDown className="h-3 w-3" /> No, skip it
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-theme-text-secondary italic">Awaiting Centre Head / Events Head decision</span>
                    )
                  ) : task.status === 'Assigned' && (
                    canChangeTaskStatus(task, user) ? (
                      <button
                        onClick={() => handleStatusChange(task.id, 'In Progress')}
                        className="px-2.5 py-1 bg-accent hover:bg-primary-light text-white font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-[11px] text-theme-text-secondary italic">Awaiting acknowledgement from {task.assignee}</span>
                    )
                  )}
                  {task.status === 'In Progress' && (
                    <>
                      {task.workflowType === 'design_caption_draft' || task.workflowType === 'design_caption_review' || task.workflowType === 'design_social_posting' ? (
                        <span className="text-[11px] text-theme-text-secondary italic">Use the caption panel above to complete this task</span>
                      ) : canChangeTaskStatus(task, user) ? (
                        <button
                          onClick={() => setCompletingTaskId(task.id)}
                          className="px-2.5 py-1 bg-success hover:bg-success/90 text-white font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                        >
                          Complete
                        </button>
                      ) : (
                        <span className="text-[11px] text-theme-text-secondary italic">In progress — {task.assignee}</span>
                      )}
                      {canRequestTaskExtension(task, user) && (
                        <button
                          onClick={() => setExtensionTask(task)}
                          className="px-2 py-1 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                          title="Request deadline extension for self or department team member"
                        >
                          Extend
                        </button>
                      )}
                    </>
                  )}
                  {task.status === 'Completed' && (
                    <span className="text-[11px] text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Done
                    </span>
                  )}
                </div>

                {(canEditTask(user) || canDeleteTask(user, task) || user) && (
                  <div className="flex items-center gap-1">
                    {user && canDelegateAutoTask(task, user) && (
                      <button
                        onClick={() => setDelegatingTask(task)}
                        className="p-1 hover:bg-theme-border/30 rounded-md text-theme-text-secondary hover:text-accent transition-all cursor-pointer"
                        title="Delegate this task to a specific member"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {user && (
                      <button
                        onClick={() => setApprovalRequestTask(task)}
                        className="p-1 hover:bg-theme-border/30 rounded-md text-theme-text-secondary hover:text-accent transition-all cursor-pointer"
                        title="Ask someone to approve this task"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canEditTask(user) && (
                      <button
                        onClick={() => handleOpenEdit(task)}
                        className="p-1 hover:bg-theme-border/30 rounded-md text-theme-text-secondary hover:text-accent transition-all cursor-pointer"
                        title="Edit Task"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDeleteTask(user, task) && (
                      <button
                        onClick={() => setDeletingTaskId(task.id)}
                        className="p-1 hover:bg-danger/10 rounded-md text-danger transition-all cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {(isCreateModalOpen || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">
                {editingTask ? 'Edit Task Details' : 'Assign New Deliverable'}
              </h2>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingTask(null);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Prepare Event Budget Spreadsheet"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-theme-text-secondary">Task Type</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-theme-text-primary">
                    <input
                      type="radio"
                      name="taskCategory"
                      checked={taskCategory === 'general'}
                      onChange={() => setTaskCategory('general')}
                      className="accent-accent"
                    />
                    General Task
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-theme-text-primary">
                    <input
                      type="radio"
                      name="taskCategory"
                      checked={taskCategory === 'design'}
                      onChange={() => setTaskCategory('design')}
                      className="accent-accent"
                    />
                    <Palette className="h-3.5 w-3.5 text-accent" />
                    Design Task
                  </label>
                </div>
              </div>

              {taskCategory === 'design' && (
                <div className="space-y-3 p-3 bg-accent/5 border border-accent/20 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="block font-medium text-theme-text-secondary">
                      Design Brief — what do you want from this project? *
                    </label>
                    <textarea
                      required={taskCategory === 'design'}
                      value={briefDescription}
                      onChange={(e) => setBriefDescription(e.target.value)}
                      placeholder="Describe the deliverable in detail: purpose, dimensions/format, colors/theme, text/copy to include, deadline context, examples to follow..."
                      rows={4}
                      className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-medium text-theme-text-secondary flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" />
                      Reference Attachments ({existingAttachments.length + attachedFiles.length}/5)
                    </label>
                    <FileDropzone
                      onFilesSelected={handleAttachmentFilesSelected}
                      multiple
                      compact
                      disabled={existingAttachments.length + attachedFiles.length >= 5}
                      label="Click to upload or drag and drop reference files"
                      hint="Mockups, logos, style guides, briefs — up to 5 files, 15 MB each"
                    />

                    {existingAttachments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {existingAttachments.map((f, i) => (
                          <div key={f.storageKey || f.url || i} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-theme-border/30 bg-theme-background/20 text-[11px]">
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:underline truncate">
                              <Download className="h-3 w-3 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => removeExistingAttachment(i)}
                              className="h-5 w-5 flex items-center justify-center rounded-md text-theme-text-secondary hover:text-danger hover:bg-danger/10 transition-all cursor-pointer shrink-0"
                              title="Remove attachment"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {attachedFiles.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {attachedFiles.map((file, i) => (
                          <FilePreviewRow
                            key={`${file.name}-${i}`}
                            file={file}
                            status={isUploadingAttachments ? 'uploading' : 'idle'}
                            onRemove={() => removeAttachedFile(i)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Linked Event</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      // Committees are scoped to one event — a committee picked for a
                      // different event no longer applies once the event changes.
                      setSelectedCommitteeId('');
                      setIsCreatingCommittee(false);
                    }}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="standalone">Standalone (No Event)</option>
                    {events.filter(ev => isApprovedEvent(ev, tasks)).map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Assignee Selection */}
              <div className="space-y-3 pt-1 border-t border-theme-border/20">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-theme-text-primary">
                    <input
                      type="radio"
                      name="assigneeType"
                      checked={assigneeType === 'individual'}
                      onChange={() => setAssigneeType('individual')}
                      className="accent-accent"
                    />
                    Individual Member
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-theme-text-primary">
                    <input
                      type="radio"
                      name="assigneeType"
                      checked={assigneeType === 'group'}
                      onChange={() => setAssigneeType('group')}
                      className="accent-accent"
                    />
                    Group of Students
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-theme-text-primary">
                    <input
                      type="radio"
                      name="assigneeType"
                      checked={assigneeType === 'committee'}
                      onChange={() => setAssigneeType('committee')}
                      className="accent-accent"
                    />
                    Event Committee
                  </label>
                </div>

                {assigneeType === 'individual' ? (
                  <div className="space-y-1.5" ref={assigneeDropdownRef}>
                    <label className="block font-medium text-theme-text-secondary">Select Assignee</label>
                    <div className="relative">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl focus-within:border-accent">
                        <Search className="h-3.5 w-3.5 text-theme-text-secondary shrink-0" />
                        <input
                          type="text"
                          value={isAssigneeDropdownOpen ? assigneeQuery : (selectedAssigneeMember ? `${selectedAssigneeMember.name} (${selectedAssigneeMember.role})` : '')}
                          onFocus={() => {
                            setAssigneeQuery('');
                            setIsAssigneeDropdownOpen(true);
                          }}
                          onChange={(e) => {
                            setAssigneeQuery(e.target.value);
                            setIsAssigneeDropdownOpen(true);
                          }}
                          placeholder="Type a name, role, or email to search..."
                          className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-theme-text-primary placeholder-theme-text-secondary"
                        />
                      </div>

                      {isAssigneeDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto glass-panel rounded-xl border border-white/15 shadow-2xl z-10 divide-y divide-theme-border/20 animate-in fade-in zoom-in-95 duration-150">
                          {filteredAssignees.length === 0 ? (
                            <div className="text-center py-4 text-theme-text-secondary">No matching members.</div>
                          ) : (
                            filteredAssignees.map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelectAssignee(m)}
                                className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 hover:bg-theme-border/20 transition-all cursor-pointer ${m.id === selectedAssigneeId ? 'bg-accent/10' : ''}`}
                              >
                                <span className="font-medium text-theme-text-primary">{m.name}</span>
                                <span className="text-theme-text-secondary shrink-0">{m.role}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : assigneeType === 'group' ? (
                  <div className="space-y-1.5">
                    <label className="block font-medium text-theme-text-secondary">
                      Select Students ({selectedGroupMemberIds.length} selected)
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-theme-background/30 border border-theme-card-border rounded-xl focus-within:border-accent">
                      <Search className="h-3.5 w-3.5 text-theme-text-secondary shrink-0" />
                      <input
                        type="text"
                        value={groupQuery}
                        onChange={(e) => setGroupQuery(e.target.value)}
                        placeholder="Search members to add..."
                        className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-theme-text-primary placeholder-theme-text-secondary"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-theme-card-border divide-y divide-theme-border/20">
                      {members
                        .filter(m => {
                          const q = groupQuery.toLowerCase();
                          return !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
                        })
                        .map(m => (
                          <label
                            key={m.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-theme-border/20 cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedGroupMemberIds.includes(m.id)}
                                onChange={(e) => {
                                  setSelectedGroupMemberIds(prev =>
                                    e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id)
                                  );
                                }}
                                className="accent-accent"
                              />
                              <span className="font-medium text-theme-text-primary">{m.name}</span>
                            </span>
                            <span className="text-theme-text-secondary shrink-0">{m.role}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEventId === 'standalone' ? (
                      <p className="p-3 bg-warning/10 border border-warning/25 rounded-xl text-warning">
                        Committees belong to a specific event — select a Linked Event above first.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <label className="block font-medium text-theme-text-secondary">Select Committee</label>
                          <button
                            type="button"
                            onClick={() => setIsCreatingCommittee(v => !v)}
                            className="text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                          >
                            {isCreatingCommittee ? 'Choose Existing Committee' : '+ Create New Committee'}
                          </button>
                        </div>

                        {isCreatingCommittee ? (
                          <div className="space-y-2 p-3 bg-theme-background/30 border border-theme-card-border rounded-xl">
                            <input
                              type="text"
                              value={newCommitteeName}
                              onChange={(e) => setNewCommitteeName(e.target.value)}
                              placeholder="New committee name, e.g. Stage & Decor"
                              className="w-full px-3 py-2 bg-background border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                            />
                            <p className="font-medium text-theme-text-secondary">
                              Add Students ({newCommitteeMemberIds.length} selected)
                            </p>
                            <div className="max-h-36 overflow-y-auto rounded-lg border border-theme-card-border divide-y divide-theme-border/20">
                              {members.map(m => (
                                <label
                                  key={m.id}
                                  className="flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-theme-border/20 cursor-pointer"
                                >
                                  <span className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={newCommitteeMemberIds.includes(m.id)}
                                      onChange={(e) => {
                                        setNewCommitteeMemberIds(prev =>
                                          e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id)
                                        );
                                      }}
                                      className="accent-accent"
                                    />
                                    <span className="font-medium text-theme-text-primary">{m.name}</span>
                                  </span>
                                  <span className="text-theme-text-secondary shrink-0">{m.role}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <select
                            value={selectedCommitteeId}
                            onChange={(e) => setSelectedCommitteeId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                          >
                            <option value="">-- Select Committee --</option>
                            {(events.find(ev => ev.id === selectedEventId)?.committees || []).map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.memberIds.length} members)</option>
                            ))}
                          </select>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingTask && (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskItem['status'])}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending Extension">Pending Extension</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploadingAttachments}
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUploadingAttachments ? 'Uploading attachments...' : editingTask ? 'Save Task Updates' : 'Confirm Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Extension Request Modal */}
      {extensionTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">Request Deadline Extension</h2>
              <button 
                onClick={() => setExtensionTask(null)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRequestExtensionSubmit} className="space-y-4 text-xs">
              <div>
                <p className="text-theme-text-secondary">
                  Task: <strong className="text-theme-text-primary">{extensionTask.title}</strong> (Due: {extensionTask.dueDate})
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Reason / Justification for Extension</label>
                <textarea
                  required
                  value={extensionReasonInput}
                  onChange={(e) => setExtensionReasonInput(e.target.value)}
                  placeholder="Explain why extra time is required (e.g. pending vendor quotes, sponsor followups)..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-warning hover:bg-warning/90 text-white font-semibold rounded-xl transition-all shadow-md shadow-warning/15 cursor-pointer"
              >
                Submit Request to Leadership
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTaskId)}
        title="Delete Task"
        message="Are you sure you want to delete this task deliverable? This action cannot be undone."
        confirmLabel="Delete Task"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTaskId(null)}
      />

      {/* Complete Confirmation Modal — guards against accidental clicks, since
          Complete is a one-way status change that immediately queues the task
          for rating/evaluation. */}
      <ConfirmModal
        isOpen={Boolean(completingTaskId)}
        title="Mark Task Complete"
        message="Are you sure you want to mark this task as completed? This will close it out and cannot be undone from here."
        confirmLabel="Yes, Mark Complete"
        cancelLabel="No, Go Back"
        variant="primary"
        onConfirm={handleConfirmComplete}
        onCancel={() => setCompletingTaskId(null)}
      />

      {approvalRequestTask && user && (
        <RequestApprovalModal
          isOpen={Boolean(approvalRequestTask)}
          onClose={() => setApprovalRequestTask(null)}
          entityType="task"
          entityId={approvalRequestTask.id}
          entityTitle={approvalRequestTask.title}
          eventId={approvalRequestTask.eventId}
          members={members}
          currentUser={user}
          onRequested={() => triggerSuccess('✔ Approval request sent!')}
        />
      )}

      {delegatingTask && user && (
        <DelegateTaskModal
          isOpen={Boolean(delegatingTask)}
          onClose={() => setDelegatingTask(null)}
          task={delegatingTask}
          members={members}
          currentUser={user}
          onDelegated={() => {
            setTasks(getTasks());
            triggerSuccess('Delegation submitted — awaiting Centre Head / GG Campus Events Head approval.');
          }}
        />
      )}

      {rejectingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-4 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
                <Ban className="h-4.5 w-4.5 text-danger" />
                Reject Submission
              </h2>
              <button
                onClick={() => { setRejectingTaskId(null); setRejectionReasonInput(''); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="block font-medium text-theme-text-secondary">Reason (optional)</label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
                placeholder="Let the submitter know why this was rejected..."
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <button
              onClick={handleConfirmRejectTask}
              className="w-full py-3 bg-danger hover:bg-danger/90 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
