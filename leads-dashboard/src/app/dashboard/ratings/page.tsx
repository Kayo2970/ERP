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
  Filter
} from 'lucide-react';
import { 
  getRatings, 
  addRating, 
  updateRating,
  deleteRating,
  getMembers, 
  getTasks, 
  getCommittees, 
  Member, 
  TaskItem, 
  RatingItem 
} from '@/lib/local-data';
import { getRatingColor } from '@/lib/design-tokens';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function RatingsPage() {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [committees, setCommittees] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  // Search & Filter state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState('ALL');

  // Evaluation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRating, setEditingRating] = useState<RatingItem | null>(null);
  const [deletingRatingId, setDeletingRatingId] = useState<string | null>(null);

  const [targetType, setTargetType] = useState<'individual' | 'committee'>('individual');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');

  // Form Scores
  const [quality, setQuality] = useState(5);
  const [timeliness, setTimeliness] = useState(5);
  const [initiative, setInitiative] = useState(5);
  const [collaboration, setCollaboration] = useState(5);
  const [notes, setNotes] = useState('');

  // Notification Alerts
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    setRatings(getRatings());
    setMembers(getMembers());
    setTasks(getTasks());
    setCommittees(getCommittees());

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const triggerSuccess = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  const openEvaluation = (type: 'individual' | 'committee', id: string, name: string) => {
    setEditingRating(null);
    setTargetType(type);
    setTargetId(id);
    setTargetName(name);
    setQuality(5);
    setTimeliness(5);
    setInitiative(5);
    setCollaboration(5);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditEvaluation = (rating: RatingItem) => {
    setEditingRating(rating);
    setTargetType(rating.targetType);
    setTargetId(rating.targetId);
    setTargetName(rating.targetName);
    setQuality(rating.quality);
    setTimeliness(rating.timeliness);
    setInitiative(rating.initiative);
    setCollaboration(rating.collaboration);
    setNotes(rating.notes || '');
    setIsModalOpen(true);
  };

  const handleEvaluateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName || !user) return;

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
      triggerSuccess(`Updated evaluation scorecard for ${targetName}`);
    } else {
      addRating({
        targetType,
        targetName,
        targetId,
        raterName: user.name,
        quality,
        timeliness,
        initiative,
        collaboration,
        overallScore: overall,
        notes
      });
      triggerSuccess(`Submitted rating evaluation of ${overall}/5.0 for ${targetName}`);
    }

    setIsModalOpen(false);
    setEditingRating(null);
    setRatings(getRatings());
  };

  const handleConfirmDeleteRating = () => {
    if (!deletingRatingId) return;
    deleteRating(deletingRatingId, user?.name || 'User');
    setDeletingRatingId(null);
    setRatings(getRatings());
    triggerSuccess('Rating record removed successfully.');
  };

  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const isAdmin = user && user.tier <= 3; // Tier 1-3 can evaluate

  // Filtered members in evaluation roster
  const filteredEvaluationMembers = members
    .filter(m => m.tier >= 5)
    .filter(m => {
      const q = memberSearchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.committee.toLowerCase().includes(q);
    });

  // Filtered ratings history
  const filteredRatingsHistory = ratings.filter(r => {
    const matchesSearch = 
      r.targetName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
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
        <h1 className="text-xl font-bold text-theme-text-primary">Performance Evaluation & Ratings</h1>
        <p className="text-xs text-theme-text-secondary">Rate individual student members or entire committees on Quality, Timeliness, Initiative, and Collaboration</p>
      </div>

      {/* Completed Tasks Queue & Direct Evaluation Roster */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Completed Tasks Queue */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-1 space-y-4 flex flex-col max-h-[500px]">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary">Completed Tasks Queue</h3>
            <p className="text-xs text-theme-text-secondary">Evaluate performance for recently completed deliverables</p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {completedTasks.length === 0 ? (
              <div className="text-center py-8 text-theme-text-secondary text-xs">
                No completed tasks awaiting evaluation.
              </div>
            ) : (
              completedTasks.map(task => (
                <div 
                  key={task.id} 
                  className="p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2.5 hover:bg-theme-border/15 transition-all"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-theme-text-primary line-clamp-1">{task.title}</h4>
                    <p className="text-[10px] text-theme-text-secondary mt-0.5">Assignee: {task.assignee}</p>
                  </div>
                  
                  {isAdmin ? (
                    <button
                      onClick={() => openEvaluation(
                        task.assigneeType, 
                        task.assigneeType === 'individual' ? (members.find(m => m.name === task.assignee)?.id || 'unknown') : task.assignee, 
                        task.assignee
                      )}
                      className="w-full py-1.5 bg-accent hover:bg-primary-light text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Award className="h-3.5 w-3.5" />
                      Evaluate Assignee
                    </button>
                  ) : (
                    <span className="text-[10px] text-theme-text-secondary italic block">Awaiting advisor evaluation</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Evaluation Roster Lists */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-2 space-y-4">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary">Direct Evaluation Roster</h3>
            <p className="text-xs text-theme-text-secondary">Advisors can evaluate any committee or student directory member directly</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Committees List (Loaded dynamically) */}
            <div className="border border-theme-border/30 rounded-xl p-4 space-y-3 bg-theme-background/10">
              <h4 className="font-bold text-xs text-theme-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-warning" />
                Committees ({committees.length})
              </h4>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {committees.map(comm => (
                  <div key={comm} className="flex items-center justify-between p-2 hover:bg-theme-border/10 rounded-lg text-xs">
                    <span className="text-theme-text-primary font-medium truncate pr-2">{comm}</span>
                    {isAdmin && (
                      <button
                        onClick={() => openEvaluation('committee', comm, comm)}
                        className="px-2.5 py-1 bg-accent/20 hover:bg-accent text-accent hover:text-white text-[10px] font-bold rounded-md transition-all cursor-pointer shrink-0"
                      >
                        Rate Unit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Members List with Search Box */}
            <div className="border border-theme-border/30 rounded-xl p-4 space-y-3 bg-theme-background/10">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-theme-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-4 w-4 text-accent" />
                  Student Members
                </h4>
                <span className="text-[10px] text-theme-text-secondary">{filteredEvaluationMembers.length} available</span>
              </div>

              {/* Roster Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-theme-text-secondary" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Search student members..."
                  className="w-full pl-8 pr-3 py-1.5 bg-theme-background/40 border border-theme-border/40 rounded-lg text-xs text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                {filteredEvaluationMembers.length === 0 ? (
                  <div className="text-center py-6 text-theme-text-secondary text-xs">
                    No matching members.
                  </div>
                ) : (
                  filteredEvaluationMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-theme-border/10 rounded-lg text-xs">
                      <div className="overflow-hidden pr-2">
                        <p className="text-theme-text-primary font-medium truncate">{member.name}</p>
                        <p className="text-[10px] text-theme-text-secondary truncate">{member.role} &middot; {member.committee}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => openEvaluation('individual', member.id, member.name)}
                          className="px-2.5 py-1 bg-accent/20 hover:bg-accent text-accent hover:text-white text-[10px] font-bold rounded-md transition-all cursor-pointer shrink-0"
                        >
                          Rate
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Ratings History List & Filters */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary">Submitted Evaluations & History</h3>
            <p className="text-xs text-theme-text-secondary">Historical logs of evaluations, criteria breakdowns, and advisor remarks</p>
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
                placeholder="Search history..."
                className="w-48 pl-8 pr-3 py-1.5 bg-theme-background/30 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRatingsHistory.length === 0 ? (
            <div className="text-center py-12 text-theme-text-secondary text-xs">
              No rating evaluations found matching the selected filter.
            </div>
          ) : (
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                  <th className="pb-3 font-semibold">Target / Unit</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Quarter</th>
                  <th className="pb-3 font-semibold">Evaluator</th>
                  <th className="pb-3 font-semibold">Breakdown (Q / T / I / C)</th>
                  <th className="pb-3 font-semibold">Overall Rating</th>
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
                      <td className="py-3.5 pr-2 font-bold text-theme-text-primary">{rating.targetName}</td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary capitalize">{rating.targetType}</td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary">{rating.quarter || '2026-Q3'}</td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary">{rating.raterName}</td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary">
                        <span className="font-semibold text-theme-text-primary">{rating.quality}</span> &middot; <span className="font-semibold text-theme-text-primary">{rating.timeliness}</span> &middot; <span className="font-semibold text-theme-text-primary">{rating.initiative}</span> &middot; <span className="font-semibold text-theme-text-primary">{rating.collaboration}</span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border ${colorTokens.bg} ${colorTokens.text} ${colorTokens.border}`}>
                          <Star className="h-3 w-3 fill-current" />
                          {rating.overallScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3.5 text-theme-text-secondary max-w-xs truncate" title={rating.notes}>
                        {rating.notes || 'No remarks recorded.'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 text-right">
                          {canEdit && (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditEvaluation(rating)}
                                className="p-1 hover:bg-theme-border/30 rounded-md text-theme-text-secondary hover:text-accent transition-all cursor-pointer"
                                title="Edit Evaluation"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingRatingId(rating.id)}
                                className="p-1 hover:bg-danger/10 rounded-md text-danger transition-all cursor-pointer"
                                title="Delete Evaluation"
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

      {/* Evaluate / Edit Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">
                {editingRating ? 'Edit Performance Scorecard' : 'Performance Rating Scorecard'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRating(null);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-accent/10 border border-accent/15 p-3.5 rounded-xl text-xs space-y-1">
              <p className="text-theme-text-secondary font-semibold uppercase tracking-wider text-[10px]">Evaluating Unit</p>
              <h3 className="text-sm font-bold text-theme-text-primary flex items-center gap-2">
                {targetType === 'committee' ? <Users className="h-4.5 w-4.5 text-warning" /> : <User className="h-4.5 w-4.5 text-accent" />}
                {targetName}
              </h3>
            </div>

            <form onSubmit={handleEvaluateSubmit} className="space-y-4 text-xs">
              
              {/* Score Sliders */}
              <div className="space-y-3">
                
                {/* Quality */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-theme-text-primary">1. Quality of Deliverables</span>
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
                    <span className="font-semibold text-theme-text-primary">3. Proactive Initiative & Ownership</span>
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
                    <span className="font-semibold text-theme-text-primary">4. Collaboration & Team Spirit</span>
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
                <label className="block font-medium text-theme-text-secondary">Evaluation Remarks / Milestone Feedback</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record summary feedback or specific milestones reached..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Rolling Average Score */}
              <div className="bg-theme-border/10 p-3 rounded-xl border border-theme-border/20 flex justify-between items-center">
                <span className="font-semibold text-theme-text-secondary">Overall Scorecard Result:</span>
                <span className="text-sm font-black text-warning flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning stroke-warning" />
                  {((quality + timeliness + initiative + collaboration) / 4).toFixed(1)} / 5.0
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                {editingRating ? 'Save Scorecard Updates' : 'Submit Scorecard'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingRatingId)}
        title="Delete Evaluation Record"
        message="Are you sure you want to delete this rating evaluation record? This will adjust the overall rollups and performance history."
        confirmLabel="Delete Record"
        variant="danger"
        onConfirm={handleConfirmDeleteRating}
        onCancel={() => setDeletingRatingId(null)}
      />

    </div>
  );
}
