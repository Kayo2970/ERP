'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  X,
  Calendar,
  User,
  Briefcase,
  CheckCircle2,
  FileClock,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Search
} from 'lucide-react';
import { 
  getTasks, 
  getEvents, 
  getMembers, 
  getCommittees, 
  addTask, 
  updateTask,
  updateTaskStatus, 
  deleteTask,
  TaskItem,
  EventItem,
  Member
} from '@/lib/local-data';
import { canViewTaskExtended, canManageTasks, canRequestTaskExtension, isHeadRole } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [user, setUser] = useState<any>(null);
  const [committees, setCommittees] = useState<string[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [extensionTask, setExtensionTask] = useState<TaskItem | null>(null);
  const [extensionReasonInput, setExtensionReasonInput] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('standalone');
  const [assigneeType, setAssigneeType] = useState<'individual' | 'committee'>('individual');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState('Organizing Committee');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskItem['status']>('Assigned');
  const [successMsg, setSuccessMsg] = useState('');

  // Searchable assignee combobox
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refreshData = () => {
      setTasks(getTasks());
      setEvents(getEvents());
      setCommittees(getCommittees());
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

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenCreate = () => {
    setTitle('');
    setSelectedEventId('standalone');
    setAssigneeType('individual');
    if (members.length > 0) setSelectedAssigneeId(members[0].id);
    setSelectedCommittee(committees[0] || 'Organizing Committee');
    setDueDate('');
    setStatus('Assigned');
    setAssigneeQuery('');
    setIsAssigneeDropdownOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setSelectedEventId(task.eventId || 'standalone');
    setAssigneeType(task.assigneeType);
    if (task.assigneeType === 'individual') {
      const match = members.find(m => m.name === task.assignee || m.email === task.assigneeEmail);
      if (match) setSelectedAssigneeId(match.id);
    } else {
      setSelectedCommittee(task.assignee);
    }
    setDueDate(task.dueDate);
    setStatus(task.status);
    setAssigneeQuery('');
    setIsAssigneeDropdownOpen(false);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

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

    if (assigneeType === 'individual') {
      const memberObj = members.find(m => m.id === selectedAssigneeId);
      if (memberObj) {
        assigneeName = memberObj.name;
        assigneeEmailVal = memberObj.email;
      }
    } else {
      assigneeName = selectedCommittee;
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title,
        event: eventTitle,
        eventId: eventIdVal,
        assignee: assigneeName,
        assigneeEmail: assigneeEmailVal,
        assigneeType,
        dueDate,
        status,
      }, user?.name || 'User');
      triggerSuccess('Task updated successfully.');
      setEditingTask(null);
    } else {
      addTask({
        title,
        event: eventTitle,
        eventId: eventIdVal,
        assignee: assigneeName,
        assigneeEmail: assigneeEmailVal,
        assigneeType,
        dueDate,
        status,
        creatorName: user?.name || 'User'
      });
      triggerSuccess('Task assigned successfully.');
      setIsCreateModalOpen(false);
    }

    setTasks(getTasks());
  };

  const handleStatusChange = (id: string, newStatus: TaskItem['status']) => {
    updateTaskStatus(id, newStatus);
    setTasks(getTasks());
    triggerSuccess(`Task status changed to ${newStatus}.`);
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

  // Filter tasks based on shared permission helper
  const displayedTasks = tasks.filter(task => canViewTaskExtended(task, user));
  const canManage = canManageTasks(user);

  const selectedAssigneeMember = members.find(m => m.id === selectedAssigneeId);
  const filteredAssignees = members.filter(m => {
    const q = assigneeQuery.toLowerCase();
    const matchesQuery = !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    if (!matchesQuery) return false;

    // For Department Heads (tier > 3), prioritize department members and training associates
    if (user && isHeadRole(user) && user.tier > 3) {
      const dept = user.department;
      return m.tier === 6 || m.department === dept;
    }
    return true;
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

      {/* Pending Extension Review Queue (Leadership Only) */}
      {user && user.tier <= 3 && tasks.filter(t => t.status === 'Pending Extension').length > 0 && (
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

      {/* Grid of Tasks Card */}
      {displayedTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks to display"
          description={user?.tier === 4 ? "Advisory Board members do not receive task assignments." : "No tasks assigned to your current filter."}
          actionLabel={canManage ? "Assign Task" : undefined}
          onAction={canManage ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedTasks.map((task) => (
            <div key={task.id} className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:bg-theme-border/10 transition-all border border-theme-card-border/50 space-y-4">
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
                
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-theme-text-primary leading-snug">{task.title}</h3>
                  <p className="text-[11px] text-theme-text-secondary flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Event: <span className="font-medium text-theme-text-primary">{task.event || 'Standalone'}</span>
                  </p>
                  <p className="text-[11px] text-theme-text-secondary flex items-center gap-1">
                    {task.assigneeType === 'individual' ? <User className="h-3 w-3 text-accent" /> : <Users className="h-3 w-3 text-warning" />}
                    Assignee: <span className="font-medium text-theme-text-primary">{task.assignee}</span>
                  </p>
                  {task.decidedBy && (
                    <p className="text-[10px] text-theme-text-secondary italic pt-1">
                      Extension decision: {task.decidedBy} ({task.decidedAt})
                    </p>
                  )}
                </div>
              </div>

              {/* Task Actions */}
              <div className="border-t border-theme-border/20 pt-3 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {task.status === 'Assigned' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'In Progress')}
                      className="px-2.5 py-1 bg-accent hover:bg-primary-light text-white font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}
                  {task.status === 'In Progress' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(task.id, 'Completed')}
                        className="px-2.5 py-1 bg-success hover:bg-success/90 text-white font-semibold rounded-lg transition-all text-[11px] cursor-pointer"
                      >
                        Complete
                      </button>
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

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1 hover:bg-theme-border/30 rounded-md text-theme-text-secondary hover:text-accent transition-all cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingTaskId(task.id)}
                      className="p-1 hover:bg-danger/10 rounded-md text-danger transition-all cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Linked Event</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="standalone">Standalone (No Event)</option>
                    {events.map(ev => (
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
                <div className="flex gap-4">
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
                      checked={assigneeType === 'committee'}
                      onChange={() => setAssigneeType('committee')}
                      className="accent-accent"
                    />
                    Entire Committee
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
                ) : (
                  <div className="space-y-1.5">
                    <label className="block font-medium text-theme-text-secondary">Select Committee Unit</label>
                    <select
                      value={selectedCommittee}
                      onChange={(e) => setSelectedCommittee(e.target.value)}
                      className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                    >
                      {committees.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
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
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                {editingTask ? 'Save Task Updates' : 'Confirm Assignment'}
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

    </div>
  );
}
