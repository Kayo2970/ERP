'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle, 
  Users, 
  User, 
  Clock, 
  ShieldAlert, 
  Award, 
  FileText, 
  X, 
  Search, 
  Edit2, 
  Trash2,
  Filter,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { 
  getRatings, 
  addRating, 
  updateRating,
  deleteRating,
  getMembers, 
  getTasks, 
  getRatableTasks,
  Member, 
  TaskItem, 
  RatingItem 
} from '@/lib/local-data';
import { getRatingColor } from '@/lib/design-tokens';
import { canViewRating } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function RatingsPage() {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [user, setUser] = useState<any>(null);

  // Search & Filter state
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState('ALL');

  // Evaluation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRating, setEditingRating] = useState<RatingItem | null>(null);
  const [deletingRatingId, setDeletingRatingId] = useState<string | null>(null);

  // Selected Task for Evaluation
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Form Scores
  const [quality, setQuality] = useState(5);
  const [timeliness, setTimeliness] = useState(5);
  const [initiative, setInitiative] = useState(5);
  const [collaboration, setCollaboration] = useState(5);
  const [notes, setNotes] = useState('');

  // Notification Alerts
  const [alertMsg, setAlertMsg] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const refreshData = () => {
      setRatings(getRatings());
      setMembers(getMembers());
      setTasks(getTasks());
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
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  const openEvaluationForTask = (task: TaskItem) => {
    setEditingRating(null);
    setSelectedTask(task);
    setQuality(5);
    setTimeliness(5);
    setInitiative(5);
    setCollaboration(5);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditEvaluation = (rating: RatingItem) => {
    setEditingRating(rating);
    const matchedTask = tasks.find(t => t.id === rating.taskId) || null;
    setSelectedTask(matchedTask);
    setQuality(rating.quality);
    setTimeliness(rating.timeliness);
    setInitiative(rating.initiative);
    setCollaboration(rating.collaboration);
    setNotes(rating.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEvaluateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedTask && !editingRating) {
      setFormError('Task selection is mandatory. Performance ratings must be evaluated against a specific task deliverable.');
      return;
    }

    if (!user) return;

    const overall = parseFloat(((quality + timeliness + initiative + collaboration) / 4).toFixed(1));

    if (editingRating) {
      updateRating(editingRating.id, {
        quality,
        timeliness,
        initiative,
        collaboration,
        overallScore: overall,
        notes,
      }, user?.name || 'User');
      triggerSuccess(`Updated evaluation scorecard for ${editingRating.targetName}`);
    } else if (selectedTask) {
      const assigneeMember = members.find(m => m.name.toLowerCase() === selectedTask.assignee.toLowerCase());

      addRating({
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        eventId: selectedTask.eventId,
        eventName: selectedTask.event,
        targetId: assigneeMember ? assigneeMember.id : (selectedTask.assigneeId || selectedTask.assignee),
        targetName: selectedTask.assignee,
        raterName: user.name,
        quality,
        timeliness,
        initiative,
        collaboration,
        overallScore: overall,
        notes,
        quarter: '2026-Q3'
      });
      triggerSuccess(`Submitted performance score of ${overall}/5.0 for ${selectedTask.assignee} on "${selectedTask.title}"`);
    }

    setIsModalOpen(false);
    setEditingRating(null);
    setSelectedTask(null);
    setRatings(getRatings());
    setTasks(getTasks());
  };

  const handleConfirmDeleteRating = () => {
    if (!deletingRatingId) return;
    deleteRating(deletingRatingId, user?.name || 'User');
    setDeletingRatingId(null);
    setRatings(getRatings());
    setTasks(getTasks());
    triggerSuccess('Rating record removed successfully.');
  };

  const isAdmin = user && (user.tier <= 3 || user.tier === 5); // Tiers 1-3 & 5 can evaluate tasks

  // Ratable Tasks Queue (Completed or In Progress tasks awaiting performance rating)
  const ratableTasks = tasks
    .filter(t => t.status === 'Completed' || t.status === 'In Progress')
    .filter(t => {
      const q = taskSearchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        (t.event && t.event.toLowerCase().includes(q))
      );
    });

  // Filtered ratings history
  const filteredRatingsHistory = ratings.filter(r => {
    if (!canViewRating(r, user)) return false;

    const matchesSearch =
      r.targetName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      r.taskTitle.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      (r.eventName && r.eventName.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
      r.raterName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(historySearchQuery.toLowerCase()));

    if (selectedQuarterFilter === 'ALL') return matchesSearch;
    return matchesSearch && (r.quarter === selectedQuarterFilter || (!r.quarter && selectedQuarterFilter === '2026-Q3'));
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Alert Banner */}
      {alertMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle className="h-5 w-5 text-success shrink-0" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Header section */}
      <div>
        <h1 className="text-xl font-bold text-theme-text-primary">Task-Based Performance Ratings</h1>
        <p className="text-xs text-theme-text-secondary">Evaluate student members directly on task execution: Quality, Timeliness, Initiative, and Collaboration</p>
      </div>

      {/* Grid: Task Evaluation Queue & Evaluation History */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Task Evaluation Queue */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-1 space-y-4 flex flex-col max-h-[580px]">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-accent" />
              Task Evaluation Queue
            </h3>
            <p className="text-xs text-theme-text-secondary">Select any task deliverable to evaluate assignee performance</p>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-theme-text-secondary" />
            <input
              type="text"
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              placeholder="Search tasks or assignees..."
              className="w-full pl-8 pr-3 py-1.5 bg-theme-background/40 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:border-accent"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {ratableTasks.length === 0 ? (
              <div className="text-center py-8 text-theme-text-secondary text-xs bg-theme-border/5 rounded-xl border border-theme-border/20">
                No active or completed deliverables currently queued.
              </div>
            ) : (
              ratableTasks.map(task => (
                <div 
                  key={task.id} 
                  className="p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2 hover:bg-theme-border/15 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-theme-text-primary line-clamp-1">{task.title}</h4>
                      <p className="text-[10px] text-theme-text-secondary mt-0.5">
                        Assignee: <strong className="text-theme-text-primary">{task.assignee}</strong>
                      </p>
                      {task.event && (
                        <span className="text-[10px] text-accent block mt-0.5">{task.event}</span>
                      )}
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      task.status === 'Completed' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary-light'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  {task.ratingScore ? (
                    <div className="flex items-center justify-between pt-1 border-t border-theme-border/20 text-[11px]">
                      <span className="text-theme-text-secondary">Evaluated Score:</span>
                      <span className="font-bold text-accent flex items-center gap-1">
                        <Star className="h-3 w-3 fill-accent" />
                        {task.ratingScore.toFixed(1)}/5.0
                      </span>
                    </div>
                  ) : isAdmin ? (
                    <button
                      onClick={() => openEvaluationForTask(task)}
                      className="w-full py-1.5 bg-accent hover:bg-primary-light text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                    >
                      <Award className="h-3.5 w-3.5" />
                      Evaluate Performance
                    </button>
                  ) : (
                    <span className="text-[10px] text-theme-text-secondary italic block pt-1">Awaiting advisor evaluation</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Submitted Evaluations & Scorecards History */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-2 space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-theme-text-primary">Performance Evaluation Scorecards</h3>
              <p className="text-xs text-theme-text-secondary">Audited ratings tied directly to student task deliverables</p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Quarter Filter */}
              <select
                value={selectedQuarterFilter}
                onChange={(e) => setSelectedQuarterFilter(e.target.value)}
                className="px-3 py-1.5 bg-theme-background/30 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent"
              >
                <option value="ALL">All Quarters</option>
                <option value="2026-Q3">2026 Q3 (Current)</option>
                <option value="2026-Q2">2026 Q2</option>
                <option value="2026-Q1">2026 Q1</option>
              </select>

              {/* Search filter */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-theme-text-secondary" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search scorecards..."
                  className="w-44 pl-8 pr-3 py-1.5 bg-theme-background/30 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {filteredRatingsHistory.length === 0 ? (
              <div className="text-center py-12 text-theme-text-secondary text-xs">
                No task evaluation scorecards found matching the selected filter.
              </div>
            ) : (
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                    <th className="pb-3 font-semibold">Student Assignee</th>
                    <th className="pb-3 font-semibold">Evaluated Task / Event</th>
                    <th className="pb-3 font-semibold">Evaluator</th>
                    <th className="pb-3 font-semibold">Breakdown (Q / T / I / C)</th>
                    <th className="pb-3 font-semibold">Score</th>
                    <th className="pb-3 font-semibold">Remarks</th>
                    {isAdmin && <th className="pb-3 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {filteredRatingsHistory.map(rating => {
                    const colorTokens = getRatingColor(rating.overallScore);
                    const canEdit = user && (user.tier === 1 || user.name === rating.raterName);

                    return (
                      <tr key={rating.id} className="hover:bg-theme-border/10 transition-all text-xs">
                        <td className="py-3.5 pr-2 font-bold text-theme-text-primary whitespace-nowrap">
                          {rating.targetName}
                        </td>
                        <td className="py-3.5 pr-2 max-w-xs">
                          <p className="font-semibold text-theme-text-primary truncate">{rating.taskTitle}</p>
                          {rating.eventName && (
                            <span className="text-[10px] text-theme-text-secondary">{rating.eventName}</span>
                          )}
                        </td>
                        <td className="py-3.5 pr-2 text-theme-text-secondary whitespace-nowrap">{rating.raterName}</td>
                        <td className="py-3.5 pr-2 text-theme-text-secondary whitespace-nowrap">
                          <span className="font-semibold text-theme-text-primary">{rating.quality}</span> &middot; <span className="font-semibold text-theme-text-primary">{rating.timeliness}</span> &middot; <span className="font-semibold text-theme-text-primary">{rating.initiative}</span> &middot; <span className="font-semibold text-theme-text-primary">{rating.collaboration}</span>
                        </td>
                        <td className="py-3.5 pr-2 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border ${colorTokens.bg} ${colorTokens.text} ${colorTokens.border}`}>
                            <Star className="h-3 w-3 fill-current" />
                            {rating.overallScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3.5 text-theme-text-secondary max-w-xs truncate" title={rating.notes}>
                          {rating.notes || '—'}
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 text-right">
                            {canEdit && (
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => openEditEvaluation(rating)}
                                  className="p-1 hover:bg-theme-border/30 rounded-md text-theme-text-secondary hover:text-accent transition-all cursor-pointer"
                                  title="Edit Scorecard"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingRatingId(rating.id)}
                                  className="p-1 hover:bg-danger/10 rounded-md text-danger transition-all cursor-pointer"
                                  title="Delete Scorecard"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Task Performance Evaluation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">
                {editingRating ? 'Edit Task Performance Scorecard' : 'Evaluate Task Performance'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRating(null);
                  setSelectedTask(null);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Task & Assignee Info Header */}
            <div className="bg-accent/10 border border-accent/15 p-3.5 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-theme-text-secondary font-semibold uppercase tracking-wider text-[10px]">Deliverable</span>
                {selectedTask?.event && (
                  <span className="text-[10px] text-accent font-semibold">{selectedTask.event}</span>
                )}
              </div>
              <h3 className="text-sm font-bold text-theme-text-primary">
                {editingRating ? editingRating.taskTitle : selectedTask?.title}
              </h3>
              <p className="text-[11px] text-theme-text-secondary">
                Student Assignee: <strong className="text-theme-text-primary">{editingRating ? editingRating.targetName : selectedTask?.assignee}</strong>
              </p>
            </div>

            <form onSubmit={handleEvaluateSubmit} className="space-y-4 text-xs">
              
              {/* Score Sliders */}
              <div className="space-y-3">
                
                {/* Quality */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-theme-text-primary">1. Quality of Deliverable</span>
                    <span className="font-bold text-accent">{quality} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={quality} onChange={(e) => setQuality(parseInt(e.target.value))}
                    className="w-full accent-accent h-1.5 bg-theme-border/40 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Timeliness */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-theme-text-primary">2. Timeliness & Deadline Adherence</span>
                    <span className="font-bold text-accent">{timeliness} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={timeliness} onChange={(e) => setTimeliness(parseInt(e.target.value))}
                    className="w-full accent-accent h-1.5 bg-theme-border/40 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Initiative */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-theme-text-primary">3. Proactive Initiative & Problem Solving</span>
                    <span className="font-bold text-accent">{initiative} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={initiative} onChange={(e) => setInitiative(parseInt(e.target.value))}
                    className="w-full accent-accent h-1.5 bg-theme-border/40 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Collaboration */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-theme-text-primary">4. Team Collaboration & Communication</span>
                    <span className="font-bold text-accent">{collaboration} / 5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={collaboration} onChange={(e) => setCollaboration(parseInt(e.target.value))}
                    className="w-full accent-accent h-1.5 bg-theme-border/40 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

              </div>

              {/* Remarks Notes */}
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Evaluation Remarks / Feedback for Student</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record constructive feedback on deliverables and milestone targets..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Rolling Average Score */}
              <div className="bg-theme-border/10 p-3 rounded-xl border border-theme-border/20 flex justify-between items-center">
                <span className="font-semibold text-theme-text-secondary">Calculated Performance Rating:</span>
                <span className="text-sm font-black text-warning flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning stroke-warning" />
                  {((quality + timeliness + initiative + collaboration) / 4).toFixed(1)} / 5.0
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                {editingRating ? 'Save Scorecard Updates' : 'Submit Performance Rating'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingRatingId)}
        title="Delete Scorecard Record"
        message="Are you sure you want to delete this task evaluation scorecard? The performance rating on the task deliverable will be cleared."
        confirmLabel="Delete Scorecard"
        variant="danger"
        onConfirm={handleConfirmDeleteRating}
        onCancel={() => setDeletingRatingId(null)}
      />

    </div>
  );
}
