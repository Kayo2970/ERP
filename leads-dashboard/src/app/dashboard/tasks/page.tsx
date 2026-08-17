'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, User, Briefcase, CheckCircle2, FileClock, Users } from 'lucide-react';
import { getTasks, getEvents, getMembers, addTask, updateTaskStatus, TaskItem, EventItem, Member } from '@/lib/local-data';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('standalone');
  const [assigneeType, setAssigneeType] = useState<'individual' | 'committee'>('individual');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState('Organizing Committee');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskItem['status']>('Assigned');

  useEffect(() => {
    setTasks(getTasks());
    setEvents(getEvents());
    const mList = getMembers();
    setMembers(mList);
    if (mList.length > 0) {
      setSelectedAssigneeId(mList[0].id);
    }
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleCreateTask = (e: React.FormEvent) => {
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

    addTask({
      title,
      event: eventTitle,
      eventId: eventIdVal,
      assignee: assigneeName,
      assigneeEmail: assigneeEmailVal,
      assigneeType,
      dueDate,
      status
    });

    // Reset Form & Close Modal
    setTitle('');
    setSelectedEventId('standalone');
    setAssigneeType('individual');
    if (members.length > 0) setSelectedAssigneeId(members[0].id);
    setDueDate('');
    setStatus('Assigned');
    setIsModalOpen(false);

    // Refresh Tasks List
    setTasks(getTasks());
  };

  const handleStatusChange = (id: string, newStatus: TaskItem['status']) => {
    updateTaskStatus(id, newStatus);
    setTasks(getTasks());
  };

  // Filter tasks based on logged-in user tier/roles
  const displayedTasks = tasks.filter(task => {
    if (!user) return true;
    if (user.tier <= 3) return true; // Super User, Centre Head, Head of Events see all
    
    if (task.assigneeType === 'committee') {
      // If assigned to a committee, check if user belongs to that committee
      return user.committee === task.assignee || user.committee === 'All Committees';
    }

    if (user.tier === 5) {
      // Core Committee see their own tasks plus tasks related to their committee
      return task.assigneeEmail === user.email || task.event === 'Tech Conclave 2026';
    }
    // Training Associates see only their own assigned tasks
    return task.assigneeEmail === user.email;
  });

  const canCreate = user && (user.tier <= 3 || user.tier === 5);

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
      
      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Task Management</h1>
          <p className="text-xs text-theme-text-secondary">Assign standalone or event-linked tasks, and track completions</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Assign Task
          </button>
        )}
      </div>

      {/* Task List Table */}
      <div className="glass-panel rounded-2xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          {displayedTasks.length === 0 ? (
            <div className="text-center py-12 text-theme-text-secondary text-sm">
              No tasks active or assigned for this role context.
            </div>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                  <th className="pb-3.5 font-semibold">Task Title</th>
                  <th className="pb-3.5 font-semibold">Linked Event</th>
                  <th className="pb-3.5 font-semibold">Assignee</th>
                  <th className="pb-3.5 font-semibold">Due Date</th>
                  <th className="pb-3.5 font-semibold">Status</th>
                  <th className="pb-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {displayedTasks.map(task => (
                  <tr key={task.id} className="hover:bg-theme-border/10 transition-all">
                    <td className="py-4 pr-2 font-medium text-theme-text-primary">{task.title}</td>
                    <td className="py-4 pr-2 text-theme-text-secondary">
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="h-3.5 w-3.5 text-accent" />
                        <span>{task.event || 'Standalone'}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-2 text-theme-text-secondary">
                      <div className="flex items-center gap-1.5">
                        {task.assigneeType === 'committee' ? (
                          <Users className="h-3.5 w-3.5 text-warning" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-theme-text-secondary" />
                        )}
                        <span>{task.assignee}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-2 text-theme-text-secondary">{task.dueDate}</td>
                    <td className="py-4 pr-2">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {/* Check if current user is assigned or belongs to committee */}
                      {task.status === 'Assigned' && (task.assigneeEmail === user?.email || (task.assigneeType === 'committee' && user?.committee === task.assignee)) ? (
                        <button
                          onClick={() => handleStatusChange(task.id, 'In Progress')}
                          className="px-3 py-1.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-md shadow-accent/15"
                        >
                          Acknowledge
                        </button>
                      ) : task.status === 'In Progress' && (task.assigneeEmail === user?.email || (task.assigneeType === 'committee' && user?.committee === task.assignee)) ? (
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => handleStatusChange(task.id, 'Completed')}
                            className="p-1 text-success hover:bg-success/15 rounded-md transition-all cursor-pointer"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(task.id, 'Pending Extension')}
                            className="p-1 text-warning hover:bg-warning/15 rounded-md transition-all cursor-pointer"
                            title="Request Extension"
                          >
                            <FileClock className="h-5 w-5" />
                          </button>
                        </div>
                      ) : user?.tier <= 3 && task.status === 'Pending Extension' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleStatusChange(task.id, 'In Progress')}
                            className="px-2 py-1 bg-success/20 text-success text-[10px] font-bold rounded-md hover:bg-success/30 transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(task.id, 'Assigned')}
                            className="px-2 py-1 bg-danger/20 text-danger text-[10px] font-bold rounded-md hover:bg-danger/30 transition-all cursor-pointer"
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-theme-text-secondary font-medium">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-6 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">Assign New Task</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design Event Brochure"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Linked Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="standalone">None (Standalone Task)</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-theme-text-secondary">Assignee Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-theme-text-primary cursor-pointer">
                    <input 
                      type="radio" 
                      name="assigneeType" 
                      checked={assigneeType === 'individual'} 
                      onChange={() => setAssigneeType('individual')} 
                    />
                    <span>Individual Member</span>
                  </label>
                  <label className="flex items-center gap-2 text-theme-text-primary cursor-pointer">
                    <input 
                      type="radio" 
                      name="assigneeType" 
                      checked={assigneeType === 'committee'} 
                      onChange={() => setAssigneeType('committee')} 
                    />
                    <span>Committee / Group</span>
                  </label>
                </div>
              </div>

              {assigneeType === 'individual' ? (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Assignee Member</label>
                  <select
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    {members.map(mem => (
                      <option key={mem.id} value={mem.id}>{mem.name} ({mem.role})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Assignee Committee</label>
                  <select
                    value={selectedCommittee}
                    onChange={(e) => setSelectedCommittee(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Executive Council">Executive Council</option>
                    <option value="Senior Student Leadership">Senior Student Leadership</option>
                    <option value="Organizing Committee">Organizing Committee</option>
                    <option value="All Committees">All Committees</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                Assign Task
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
