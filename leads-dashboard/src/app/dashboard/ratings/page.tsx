'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle,
  Users,
  ShieldAlert,
  X,
  Search,
  Edit2,
  Trash2,
  CheckSquare,
  Palette,
  ChevronDown,
  Briefcase,
  ListFilter
} from 'lucide-react';
import {
  getRatings,
  addRating,
  updateRating,
  deleteRating,
  getMembers,
  getTasks,
  getEvents,
  Member,
  TaskItem,
  RatingItem,
  EventItem
} from '@/lib/local-data';
import { getRatingColor } from '@/lib/design-tokens';
import { canViewRating, canEvaluateEventStudent, canEditRating, resolveRatingReviewerRole } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { PeriodFilter } from '@/components/period-filter';
import { SearchableSelect } from '@/components/searchable-select';
import { PeriodFilterValue, extractAvailableMonths, isWithinPeriod } from '@/lib/period-filter';
import {
  RATING_CRITERIA,
  RatingCriteriaSet,
  criteriaSetForTaskCategory,
  averageScore,
  projectLegacyRatingFields,
} from '@/lib/rating-criteria';
import { groupScoredReportsBySubmitter } from '@/lib/report-scoring';
import { getEventReports } from '@/lib/local-data';

const CRITERIA_SET_LABEL: Record<RatingCriteriaSet, string> = {
  general: 'General Task',
  design: 'Design Task',
  reportWriting: 'Report Writing Task',
};

// Sliders default to the midpoint (3 = Satisfactory), not the maximum score —
// defaulting to 5 meant a reviewer who opened the modal and submitted without
// touching a single slider silently handed out a perfect rating.
function defaultScoresFor(set: RatingCriteriaSet): Record<string, number> {
  const scores: Record<string, number> = {};
  RATING_CRITERIA[set].forEach(c => { scores[c.key] = 3; });
  return scores;
}

// Legacy ratings (pre-criteriaSet) only ever have the 4 fixed fields — editing
// one re-scores it against the General rubric, seeded from its old scores.
function legacyRatingAsGeneralScores(rating: RatingItem): Record<string, number> {
  return {
    accuracy: rating.quality,
    timeliness: rating.timeliness,
    collaboration: rating.collaboration,
    reliability: rating.initiative,
    communication: rating.overallScore,
  };
}

// Falls back to the title-string convention for tasks created before
// isDesignDeliverable existed, so already-created Design Portal tasks don't
// lose their Design Head evaluation rights after this deploys.
const isDesignTask = (task: TaskItem): boolean =>
  task.isDesignDeliverable === true || /design approved|design deliverable/i.test(task.title);

export default function RatingsPage() {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [eventReports, setEventReports] = useState<ReturnType<typeof getEventReports>>([]);

  // Search & Filter state
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({ mode: 'ALL' });
  const [historyStudentFilter, setHistoryStudentFilter] = useState('ALL');
  // Score-range filter + sort for the Scorecard History table below — lets an
  // editor quickly isolate outlier scores (e.g. every 5.0, or everything
  // under 3.0) and sort them together, so a batch of scores that need
  // correcting can be reviewed and edited one after another instead of
  // hunting through the whole list in date order.
  const [historyScoreBand, setHistoryScoreBand] = useState<'ALL' | '5' | '4-4.9' | '3-3.9' | '2-2.9' | '0-1.9'>('ALL');
  const [historySortBy, setHistorySortBy] = useState<'newest' | 'oldest' | 'scoreHigh' | 'scoreLow' | 'nameAsc'>('newest');

  // Task Evaluation Queue — student/event filters, sort, and event grouping
  const [queueStudentFilter, setQueueStudentFilter] = useState('ALL');
  const [queueEventFilter, setQueueEventFilter] = useState('ALL');
  const [queueSortBy, setQueueSortBy] = useState<'pendingFirst' | 'titleAsc' | 'assigneeAsc' | 'eventAsc'>('pendingFirst');

  // Evaluation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRating, setEditingRating] = useState<RatingItem | null>(null);
  const [deletingRatingId, setDeletingRatingId] = useState<string | null>(null);

  // Selected Task for Evaluation
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Form Scores — which 5-criterion rubric is active, and the scores entered
  // against it (keyed by RATING_CRITERIA[activeCriteriaSet]'s criterion keys).
  const [activeCriteriaSet, setActiveCriteriaSet] = useState<RatingCriteriaSet>('general');
  const [scores, setScores] = useState<Record<string, number>>(defaultScoresFor('general'));
  const [notes, setNotes] = useState('');

  // Notification Alerts
  const [alertMsg, setAlertMsg] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const refreshData = () => {
      setRatings(getRatings());
      setMembers(getMembers());
      setTasks(getTasks());
      setEvents(getEvents());
      setEventReports(getEventReports());
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

  // Same targetId resolution handleEvaluateSubmit uses when creating a new
  // rating — factored out so the queue card can look up whether THIS viewer
  // has already filled their reviewer slot for a task, without duplicating
  // the member-lookup logic.
  const getRatingTargetId = (task: TaskItem): string => {
    const assigneeMember = members.find(m => m.name.toLowerCase() === task.assignee.toLowerCase());
    return assigneeMember ? assigneeMember.id : (task.assigneeId || task.assignee);
  };

  const openEvaluationForTask = (task: TaskItem) => {
    const linkedEvent = events.find(ev => ev.id === task.eventId || ev.title === task.event);
    const eventCampus = linkedEvent?.campus || task.eventCampus || 'GG Campus';

    if (!canEvaluateEventStudent(user, eventCampus, isDesignTask(task))) {
      setAlertMsg(`Evaluation Access Denied: You are not authorized to evaluate student performance for this deliverable.`);
      setTimeout(() => setAlertMsg(''), 5000);
      return;
    }

    const criteriaSet = criteriaSetForTaskCategory(task.taskCategory);
    setEditingRating(null);
    setSelectedTask(task);
    setActiveCriteriaSet(criteriaSet);
    setScores(defaultScoresFor(criteriaSet));
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditEvaluation = (rating: RatingItem) => {
    setEditingRating(rating);
    const matchedTask = tasks.find(t => t.id === rating.taskId) || null;
    setSelectedTask(matchedTask);
    const criteriaSet = rating.criteriaSet ?? criteriaSetForTaskCategory(matchedTask?.taskCategory);
    setActiveCriteriaSet(criteriaSet);
    setScores(rating.scores ?? (rating.criteriaSet ? defaultScoresFor(criteriaSet) : legacyRatingAsGeneralScores(rating)));
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

    if (selectedTask) {
      const linkedEvent = events.find(ev => ev.id === selectedTask.eventId || ev.title === selectedTask.event);
      const eventCampus = linkedEvent?.campus || selectedTask.eventCampus || 'GG Campus';
      if (!canEvaluateEventStudent(user, eventCampus, isDesignTask(selectedTask))) {
        setFormError(`Evaluation Access Denied: Only authorized reviewers (Super User, Centre Head, Advisor, Head of Events) may evaluate performance.`);
        return;
      }
    }

    const overall = averageScore(scores);
    const legacy = projectLegacyRatingFields(activeCriteriaSet, scores);

    if (editingRating) {
      updateRating(editingRating.id, {
        criteriaSet: activeCriteriaSet,
        scores,
        ...legacy,
        overallScore: overall,
        notes,
      }, user?.name || 'User');
      triggerSuccess(`Updated evaluation scorecard for ${editingRating.targetName}`);
    } else if (selectedTask) {
      const assigneeMember = members.find(m => m.name.toLowerCase() === selectedTask.assignee.toLowerCase());
      const isCommittee = selectedTask.assigneeType === 'committee' || selectedTask.eventCommitteeId;
      const isGroup = selectedTask.assigneeType === 'group';
      const targetId = assigneeMember ? assigneeMember.id : (selectedTask.assigneeId || selectedTask.assignee);
      const reviewerRole = resolveRatingReviewerRole(user, isDesignTask(selectedTask));

      // Reviewers (Super User, Centre Head, Advisor, GG Campus Events Head)
      // submit separate ratings that are averaged together. If this reviewer
      // already reviewed this exact task/target, re-submitting edits their existing
      // review in place instead of adding a duplicate row from the same reviewer.
      const ownExisting = ratings.find(
        r => r.taskId === selectedTask.id && r.targetId === targetId && reviewerRole !== null && (r.reviewerRole === reviewerRole || r.raterName === user.name)
      );

      if (ownExisting) {
        updateRating(ownExisting.id, {
          criteriaSet: activeCriteriaSet,
          scores,
          ...legacy,
          overallScore: overall,
          notes,
        }, user.name);
      } else {
        addRating({
          taskId: selectedTask.id,
          taskTitle: selectedTask.title,
          eventId: selectedTask.eventId,
          eventName: selectedTask.event,
          targetId,
          targetName: selectedTask.assignee,
          raterName: user.name,
          reviewerRole: reviewerRole ?? undefined,
          criteriaSet: activeCriteriaSet,
          scores,
          ...legacy,
          overallScore: overall,
          notes,
          // Committee/group tasks don't have a real person as their target —
          // targetId/targetName here is the committee's or group's
          // placeholder string. Flag it so it never surfaces as if it were
          // an actual rated person (see RatingItem.isGroupPlaceholder); the
          // real per-student rows are created right below by addRating's
          // propagateCommitteeRating/propagateGroupRating fan-out.
          isGroupPlaceholder: Boolean(isCommittee || isGroup) || undefined,
        });
      }

      const committeeNotice = isCommittee
        ? ' (Evaluation propagated to all student members of this committee)'
        : isGroup
          ? ' (Evaluation propagated to all students in this group)'
          : '';
      const averageNotice = reviewerRole === 'SUPER_USER' || reviewerRole === 'CENTRE_HEAD' || reviewerRole === 'ADVISOR' || reviewerRole === 'GG_HEAD'
        ? ' — shown score is the live average of evaluations submitted so far'
        : '';
      triggerSuccess(`Submitted performance score of ${overall}/5.0 for ${selectedTask.assignee} on "${selectedTask.title}"${committeeNotice}${averageNotice}`);
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

  // Whether the CURRENT viewer's own reviewer slot has already scored this task
  // — used both for the "pending first" sort and to decide whether a queue card offers
  // "Evaluate" or "Edit My Review".
  const hasMyRating = (task: TaskItem): boolean => {
    const reviewerRole = resolveRatingReviewerRole(user, isDesignTask(task));
    if (!reviewerRole) return false;
    const targetId = getRatingTargetId(task);
    return ratings.some(r => r.taskId === task.id && r.targetId === targetId && (r.reviewerRole === reviewerRole || r.raterName === user?.name));
  };

  // Task Evaluation Queue surfaces completed deliverables that are pending evaluation by the current user.
  // Once evaluated by the current user, the task deliverable moves into Performance Evaluation Scorecards.
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const pendingQueueTasks = completedTasks.filter(t => !hasMyRating(t));

  const searchedQueueTasks = pendingQueueTasks.filter(t => {
    const q = taskSearchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.assignee.toLowerCase().includes(q) ||
      (t.event && t.event.toLowerCase().includes(q))
    );
  });

  // Filter option lists are derived from the currently search-matched tasks, so a
  // dropdown never offers a student/event with nothing left to evaluate.
  const queueStudentOptions = Array.from(new Set(searchedQueueTasks.map(t => t.assignee))).sort((a, b) => a.localeCompare(b));
  const queueEventOptions = Array.from(new Set(searchedQueueTasks.map(t => t.event || 'Standalone Deliverable'))).sort((a, b) => a.localeCompare(b));

  const filteredQueueTasks = searchedQueueTasks.filter(t => {
    if (queueStudentFilter !== 'ALL' && t.assignee !== queueStudentFilter) return false;
    if (queueEventFilter !== 'ALL' && (t.event || 'Standalone Deliverable') !== queueEventFilter) return false;
    return true;
  });

  const sortedQueueTasks = [...filteredQueueTasks].sort((a, b) => {
    switch (queueSortBy) {
      case 'titleAsc':
        return a.title.localeCompare(b.title);
      case 'assigneeAsc':
        return a.assignee.localeCompare(b.assignee);
      case 'eventAsc':
        return (a.event || 'Standalone Deliverable').localeCompare(b.event || 'Standalone Deliverable');
      case 'pendingFirst':
      default: {
        const aPending = hasMyRating(a) ? 1 : 0;
        const bPending = hasMyRating(b) ? 1 : 0;
        if (aPending !== bPending) return aPending - bPending;
        return a.title.localeCompare(b.title);
      }
    }
  });

  const queueGroups: { key: string; label: string; tasks: TaskItem[] }[] = [];
  sortedQueueTasks.forEach(task => {
    const key = task.eventId || 'standalone';
    let group = queueGroups.find(g => g.key === key);
    if (!group) {
      group = { key, label: task.event || 'Standalone Deliverables', tasks: [] };
      queueGroups.push(group);
    }
    group.tasks.push(task);
  });
  queueGroups.sort((a, b) => {
    if (a.key === 'standalone') return 1;
    if (b.key === 'standalone') return -1;
    return a.label.localeCompare(b.label);
  });

  const hasActiveQueueFilters = queueStudentFilter !== 'ALL' || queueEventFilter !== 'ALL' || taskSearchQuery !== '';
  const clearQueueFilters = () => {
    setQueueStudentFilter('ALL');
    setQueueEventFilter('ALL');
    setTaskSearchQuery('');
  };

  // Filtered ratings history
  const filteredRatingsHistory = ratings.filter(r => {
    // Committee/group bookkeeping rows are keyed by the committee/group's
    // placeholder name, not a real person — never list them as a scorecard.
    // The real per-student rows (created by the propagate* fan-out) are
    // what should show up here instead.
    if (r.isGroupPlaceholder) return false;
    if (!canViewRating(r, user)) return false;

    const matchesSearch =
      r.targetName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      r.taskTitle.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      (r.eventName && r.eventName.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
      r.raterName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(historySearchQuery.toLowerCase()));

    if (historyStudentFilter !== 'ALL' && r.targetName !== historyStudentFilter) return false;

    return matchesSearch && isWithinPeriod(r.createdAt, periodFilter);
  });

  // Student options for the Scorecard History filter below — placeholder
  // rows excluded so a committee/group name never appears as a choice.
  const historyStudentOptions = Array.from(
    new Set(ratings.filter(r => !r.isGroupPlaceholder).map(r => r.targetName))
  ).sort((a, b) => a.localeCompare(b));

  // Group scorecards by evaluated deliverable (taskId + targetId or taskTitle + targetName)
  interface ScorecardGroup {
    key: string;
    taskId: string;
    taskTitle: string;
    eventId?: string;
    eventName?: string;
    targetId: string;
    targetName: string;
    ratings: RatingItem[];
    aggregateScore: number;
    latestCreatedAt: string;
  }

  const scorecardGroups: ScorecardGroup[] = [];
  filteredRatingsHistory.forEach(r => {
    const key = `${r.taskId || r.taskTitle}_${r.targetId || r.targetName}`;
    let group = scorecardGroups.find(g => g.key === key);
    if (!group) {
      group = {
        key,
        taskId: r.taskId,
        taskTitle: r.taskTitle,
        eventId: r.eventId,
        eventName: r.eventName,
        targetId: r.targetId,
        targetName: r.targetName,
        ratings: [],
        aggregateScore: 0,
        latestCreatedAt: r.createdAt
      };
      scorecardGroups.push(group);
    }
    group.ratings.push(r);
    if (r.createdAt > group.latestCreatedAt) {
      group.latestCreatedAt = r.createdAt;
    }
  });

  scorecardGroups.forEach(g => {
    const sum = g.ratings.reduce((acc, r) => acc + r.overallScore, 0);
    g.aggregateScore = parseFloat((sum / g.ratings.length).toFixed(1));
  });

  // Score-range filter: isolate a specific band (e.g. every 5.0, or every
  // sub-3.0) to review together before editing.
  const scoreBandMatches = (score: number): boolean => {
    switch (historyScoreBand) {
      case '5': return score >= 5;
      case '4-4.9': return score >= 4 && score < 5;
      case '3-3.9': return score >= 3 && score < 4;
      case '2-2.9': return score >= 2 && score < 3;
      case '0-1.9': return score < 2;
      default: return true;
    }
  };
  const scoreFilteredGroups = historyScoreBand === 'ALL'
    ? scorecardGroups
    : scorecardGroups.filter(g => scoreBandMatches(g.aggregateScore));

  scoreFilteredGroups.sort((a, b) => {
    switch (historySortBy) {
      case 'oldest': return a.latestCreatedAt.localeCompare(b.latestCreatedAt);
      case 'scoreHigh': return b.aggregateScore - a.aggregateScore;
      case 'scoreLow': return a.aggregateScore - b.aggregateScore;
      case 'nameAsc': return a.targetName.localeCompare(b.targetName);
      case 'newest':
      default: return b.latestCreatedAt.localeCompare(a.latestCreatedAt);
    }
  });

  const availableRatingMonths = extractAvailableMonths(ratings.map(r => r.createdAt));

  // Report Writing Final Score leaderboard — decay-weighted average of each
  // submitter's scored event reports (see report-scoring.ts).
  const reportScoreLeaderboard = groupScoredReportsBySubmitter(eventReports);

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
        <p className="text-xs text-theme-text-secondary">Evaluate student members against the General, Design, or Report Writing rubric — whichever matches the task</p>
      </div>

      {/* Report Writing Final Score leaderboard */}
      {reportScoreLeaderboard.length > 0 && (
        <div className="bg-theme-card border border-theme-card-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-theme-text-primary mb-1">Report Writing — Final Score</h2>
          <p className="text-[11px] text-theme-text-secondary mb-3">
            Decay-weighted average of each submitter&apos;s scored event reports — older reports and submitters with more reports since count for less.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="text-theme-text-secondary border-b border-theme-border/40">
                  <th className="pb-2 font-semibold">Submitter</th>
                  <th className="pb-2 font-semibold">Reports Scored</th>
                  <th className="pb-2 font-semibold">Last Report</th>
                  <th className="pb-2 font-semibold">Final Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {reportScoreLeaderboard.map(row => {
                  const colorTokens = getRatingColor(row.finalScore);
                  return (
                    <tr key={row.submittedBy}>
                      <td className="py-2.5 pr-2 font-bold text-theme-text-primary whitespace-nowrap">{row.submittedBy}</td>
                      <td className="py-2.5 pr-2 text-theme-text-secondary">{row.reportCount}</td>
                      <td className="py-2.5 pr-2 text-theme-text-secondary whitespace-nowrap">{row.lastSubmittedAt}</td>
                      <td className="py-2.5 pr-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border ${colorTokens.bg} ${colorTokens.text} ${colorTokens.border}`}>
                          <Star className="h-3 w-3 fill-current" />
                          {row.finalScore.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: Task Evaluation Queue & Evaluation History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Task Evaluation Queue */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-1 space-y-4 flex flex-col max-h-[580px]">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-accent" />
              Task Evaluation Queue
            </h3>
            <p className="text-xs text-theme-text-secondary">Select any pending task deliverable to evaluate assignee performance</p>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-theme-text-secondary" />
            <input
              type="text"
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              placeholder="Search pending tasks or assignees..."
              className="w-full pl-8 pr-3 py-1.5 bg-theme-background/40 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:border-accent"
            />
          </div>

          {/* Student / event filters + sort — mirrors the Tasks page filter bar */}
          <div className="space-y-1.5 relative z-10">
            <div className="grid grid-cols-2 gap-1.5">
              <SearchableSelect
                value={queueStudentFilter}
                onChange={setQueueStudentFilter}
                allLabel="All Students"
                allValue="ALL"
                placeholder="Search students..."
                compact
                options={queueStudentOptions.map(name => ({ value: name, label: name }))}
              />
              <SearchableSelect
                value={queueEventFilter}
                onChange={setQueueEventFilter}
                allLabel="All Events"
                allValue="ALL"
                placeholder="Search events..."
                compact
                options={queueEventOptions.map(name => ({ value: name, label: name }))}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-theme-background/40 border border-theme-border/40 rounded-lg">
                <ListFilter className="h-3 w-3 text-theme-text-secondary shrink-0" />
                <select
                  value={queueSortBy}
                  onChange={(e) => setQueueSortBy(e.target.value as typeof queueSortBy)}
                  className="w-full bg-transparent text-[11px] text-theme-text-primary focus:outline-none"
                >
                  <option value="pendingFirst">Sort: Task Title (A-Z)</option>
                  <option value="titleAsc">Sort: Task Title (A-Z)</option>
                  <option value="assigneeAsc">Sort: Student (A-Z)</option>
                  <option value="eventAsc">Sort: Event (A-Z)</option>
                </select>
              </div>
              {hasActiveQueueFilters && (
                <button
                  onClick={clearQueueFilters}
                  className="px-2 py-1.5 text-[11px] font-semibold text-theme-text-secondary hover:text-theme-text-primary bg-theme-border/30 hover:bg-theme-border/50 rounded-lg transition-all cursor-pointer shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {sortedQueueTasks.length === 0 ? (
              <div className="text-center py-8 text-theme-text-secondary text-xs bg-theme-border/5 rounded-xl border border-theme-border/20">
                {hasActiveQueueFilters ? 'No pending deliverables match the selected filters.' : 'No pending deliverables currently waiting for your evaluation.'}
              </div>
            ) : (
              queueGroups.map(group => (
                <details key={group.key} open className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none select-none py-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-theme-text-primary">
                      <Briefcase className="h-3 w-3 text-accent" />
                      {group.label}
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-theme-border/30 text-theme-text-secondary">
                        {group.tasks.length}
                      </span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-theme-text-secondary transition-transform group-open:rotate-180" />
                  </summary>

                  <div className="space-y-3 pt-2 pb-1">
                    {group.tasks.map(task => {
                      const linkedEvent = events.find(ev => ev.id === task.eventId || ev.title === task.event);
                      const eventCampus = linkedEvent?.campus || task.eventCampus || 'GG Campus';
                      const isDesignDeliverable = isDesignTask(task);
                      const canEval = canEvaluateEventStudent(user, eventCampus, isDesignDeliverable);
                      const targetId = getRatingTargetId(task);
                      
                      // Look up ratings already submitted for this task deliverable
                      const existingTaskRatings = ratings.filter(r => r.taskId === task.id && r.targetId === targetId);
                      const avgScoreSoFar = existingTaskRatings.length > 0
                        ? (existingTaskRatings.reduce((sum, r) => sum + r.overallScore, 0) / existingTaskRatings.length).toFixed(1)
                        : null;

                      return (
                        <div
                          key={task.id}
                          className={`p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2 hover:bg-theme-border/15 transition-all text-xs ${!canEval ? 'opacity-75' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-xs text-theme-text-primary line-clamp-1">{task.title}</h4>
                              <p className="text-[10px] text-theme-text-secondary mt-0.5">
                                Assignee: <strong className="text-theme-text-primary">{task.assignee}</strong>
                              </p>
                              <div className="flex items-center flex-wrap gap-1.5 mt-1">
                                {task.event ? (
                                  <span className="text-[10px] text-accent font-semibold">{task.event}</span>
                                ) : (
                                  <span className="text-[9px] font-medium px-1.5 py-0.5 bg-theme-border/20 text-theme-text-secondary rounded">
                                    Standalone Deliverable
                                  </span>
                                )}
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-accent/10 text-accent rounded border border-accent/20">
                                  {eventCampus}
                                </span>
                                {isDesignDeliverable && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded border border-purple-500/20 flex items-center gap-1">
                                    <Palette className="h-2.5 w-2.5" /> Design Deliverable
                                  </span>
                                )}
                                {(task.assigneeType === 'committee' || task.eventCommitteeId) && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-warning/15 text-warning rounded border border-warning/20 flex items-center gap-1">
                                    <Users className="h-2.5 w-2.5" /> Committee Task
                                  </span>
                                )}
                                {task.assigneeType === 'group' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-warning/15 text-warning rounded border border-warning/20 flex items-center gap-1">
                                    <Users className="h-2.5 w-2.5" /> Group Task
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-success/15 text-success">
                              {task.status}
                            </span>
                          </div>

                          {avgScoreSoFar ? (
                            <div className="pt-1 border-t border-theme-border/20 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-theme-text-secondary">Average Score so far:</span>
                                <span className="font-bold text-accent flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-accent" />
                                  {avgScoreSoFar}/5.0
                                </span>
                              </div>
                              <div className="flex items-center flex-wrap gap-1.5 text-[9px]">
                                {existingTaskRatings.map(r => (
                                  <span key={r.id} className="text-success font-semibold flex items-center gap-0.5">
                                    ✓ {r.raterName} ({r.reviewerRole ? r.reviewerRole.replace('_', ' ') : 'Evaluator'})
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="pt-1 border-t border-theme-border/20 flex items-center justify-between gap-2">
                            {!canEval ? (
                              <span className="text-[10px] text-warning font-medium italic">
                                {isDesignDeliverable
                                  ? 'Evaluations restricted to Super User, Centre Head, Advisor, Head of Events (GG Campus), or Design Head'
                                  : 'Evaluations restricted to Super User, Centre Head, Advisor, or Head of Events (GG Campus)'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-theme-text-secondary">
                                {task.assigneeType === 'committee' ? 'Rates entire committee' : task.assigneeType === 'group' ? 'Rates entire group' : 'Pending Evaluation'}
                              </span>
                            )}
                            {canEval && (
                              <button
                                onClick={() => openEvaluationForTask(task)}
                                className="px-3 py-1 text-[11px] font-medium rounded-lg cursor-pointer transition-all bg-accent hover:bg-primary-light text-white shadow-sm"
                              >
                                Evaluate Performance
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Submitted Evaluations & Scorecards History */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-theme-text-primary">Performance Evaluation Scorecards</h3>
              <p className="text-xs text-theme-text-secondary">Audited aggregate performance ratings tied to student task deliverables</p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filter to one specific student's scorecards */}
              <SearchableSelect
                value={historyStudentFilter}
                onChange={setHistoryStudentFilter}
                allLabel="All Students"
                allValue="ALL"
                placeholder="Search students..."
                compact
                options={historyStudentOptions.map(name => ({ value: name, label: name }))}
              />

              {/* Period Filter: month or custom date range */}
              <PeriodFilter
                value={periodFilter}
                onChange={setPeriodFilter}
                availableMonths={availableRatingMonths}
              />

              {/* Score-range filter — isolate a band (e.g. every 5.0, or every sub-3.0) to review/edit as a batch */}
              <select
                value={historyScoreBand}
                onChange={(e) => setHistoryScoreBand(e.target.value as typeof historyScoreBand)}
                title="Filter by score range"
                className="px-2.5 py-1.5 bg-theme-background/30 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent"
              >
                <option value="ALL">All Scores</option>
                <option value="5">5.0 only</option>
                <option value="4-4.9">4.0 – 4.9</option>
                <option value="3-3.9">3.0 – 3.9</option>
                <option value="2-2.9">2.0 – 2.9</option>
                <option value="0-1.9">Below 2.0</option>
              </select>

              {/* Sort order */}
              <select
                value={historySortBy}
                onChange={(e) => setHistorySortBy(e.target.value as typeof historySortBy)}
                title="Sort order"
                className="px-2.5 py-1.5 bg-theme-background/30 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="scoreHigh">Score: High to Low</option>
                <option value="scoreLow">Score: Low to High</option>
                <option value="nameAsc">Student Name (A-Z)</option>
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
            {scoreFilteredGroups.length === 0 ? (
              <div className="text-center py-12 text-theme-text-secondary text-xs">
                No evaluated task scorecards found matching the selected filter.
              </div>
            ) : (
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                    <th className="pb-3 font-semibold">Student Assignee</th>
                    <th className="pb-3 font-semibold">Evaluated Task / Event</th>
                    <th className="pb-3 font-semibold">Evaluator(s) & Scores</th>
                    <th className="pb-3 font-semibold">Breakdown (Q / T / I / C)</th>
                    <th className="pb-3 font-semibold">Average Aggregate Score</th>
                    <th className="pb-3 font-semibold">Remarks</th>
                    {isAdmin && <th className="pb-3 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {scoreFilteredGroups.map(group => {
                    const colorTokens = getRatingColor(group.aggregateScore);

                    return (
                      <tr key={group.key} className="hover:bg-theme-border/10 transition-all text-xs">
                        {/* Student Assignee */}
                        <td className="py-3.5 pr-2 font-bold text-theme-text-primary whitespace-nowrap align-top">
                          {group.targetName}
                        </td>

                        {/* Evaluated Task / Event */}
                        <td className="py-3.5 pr-2 max-w-xs align-top">
                          <p className="font-semibold text-theme-text-primary truncate">{group.taskTitle}</p>
                          {group.eventName ? (
                            <span className="text-[10px] text-accent font-medium">{group.eventName}</span>
                          ) : (
                            <span className="text-[10px] text-theme-text-secondary">Standalone Deliverable</span>
                          )}
                        </td>

                        {/* Evaluator(s) & Individual Scores — showing ONLY people who actually scored */}
                        <td className="py-3.5 pr-2 text-theme-text-secondary max-w-xs align-top space-y-1">
                          {group.ratings.map(rating => (
                            <div key={rating.id} className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-theme-text-primary">{rating.raterName}</span>
                              {rating.reviewerRole && (
                                <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  rating.reviewerRole === 'SUPER_USER'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : rating.reviewerRole === 'CENTRE_HEAD'
                                      ? 'bg-accent/10 text-accent border-accent/20'
                                      : rating.reviewerRole === 'ADVISOR'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : rating.reviewerRole === 'GG_HEAD'
                                          ? 'bg-primary/10 text-primary-light border-primary/20'
                                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>
                                  {rating.reviewerRole === 'SUPER_USER'
                                    ? 'Super User'
                                    : rating.reviewerRole === 'CENTRE_HEAD'
                                      ? 'Centre Head'
                                      : rating.reviewerRole === 'ADVISOR'
                                        ? 'Advisor'
                                        : rating.reviewerRole === 'GG_HEAD'
                                          ? 'GG Head'
                                          : 'Design Head'}
                                </span>
                              )}
                              <span className="font-bold text-accent">({rating.overallScore.toFixed(1)})</span>
                            </div>
                          ))}
                        </td>

                        {/* Breakdown — real per-criterion scores when the rubric is known, else the legacy Q/T/I/C fields */}
                        <td className="py-3.5 pr-2 text-theme-text-secondary whitespace-nowrap align-top space-y-1">
                          {group.ratings.map(rating => (
                            <div key={rating.id} className="text-[11px]">
                              {group.ratings.length > 1 && (
                                <span className="text-[9px] text-theme-text-secondary mr-1">{rating.raterName.split(' ')[0]}:</span>
                              )}
                              {rating.criteriaSet && rating.scores ? (
                                <span title={CRITERIA_SET_LABEL[rating.criteriaSet]}>
                                  {RATING_CRITERIA[rating.criteriaSet].map((c, i) => (
                                    <React.Fragment key={c.key}>
                                      {i > 0 && ' · '}
                                      <span className="font-semibold text-theme-text-primary" title={c.label}>{(rating.scores as Record<string, number>)[c.key]}</span>
                                    </React.Fragment>
                                  ))}
                                </span>
                              ) : (
                                <>
                                  <span className="font-semibold text-theme-text-primary">{rating.quality}</span> &middot;{' '}
                                  <span className="font-semibold text-theme-text-primary">{rating.timeliness}</span> &middot;{' '}
                                  <span className="font-semibold text-theme-text-primary">{rating.initiative}</span> &middot;{' '}
                                  <span className="font-semibold text-theme-text-primary">{rating.collaboration}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </td>

                        {/* Average Aggregate Score */}
                        <td className="py-3.5 pr-2 whitespace-nowrap align-top">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-lg border ${colorTokens.bg} ${colorTokens.text} ${colorTokens.border}`}>
                              <Star className="h-3 w-3 fill-current" />
                              {group.aggregateScore.toFixed(1)} / 5.0
                            </span>
                            {group.ratings.length > 1 && (
                              <span className="text-[9px] text-theme-text-secondary font-medium">
                                Avg of {group.ratings.length} reviews
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Remarks */}
                        <td className="py-3.5 text-theme-text-secondary max-w-xs align-top space-y-1">
                          {group.ratings.map(r => r.notes ? (
                            <p key={r.id} className="text-[11px] truncate" title={`${r.raterName}: ${r.notes}`}>
                              {group.ratings.length > 1 ? <strong className="text-theme-text-primary">{r.raterName.split(' ')[0]}: </strong> : null}
                              {r.notes}
                            </p>
                          ) : null).filter(Boolean).length > 0 ? (
                            group.ratings.map(r => r.notes ? (
                              <p key={r.id} className="text-[11px] truncate" title={`${r.raterName}: ${r.notes}`}>
                                {group.ratings.length > 1 ? <strong className="text-theme-text-primary">{r.raterName.split(' ')[0]}: </strong> : null}
                                {r.notes}
                              </p>
                            ) : null)
                          ) : (
                            <span className="text-[11px]">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        {isAdmin && (
                          <td className="py-3.5 text-right align-top">
                            <div className="flex justify-end gap-1 flex-wrap">
                              {group.ratings.map(rating => {
                                const canEdit = canEditRating(rating, user);
                                if (!canEdit) return null;
                                return (
                                  <div key={rating.id} className="flex items-center gap-0.5" title={`Manage ${rating.raterName}'s rating`}>
                                    <button
                                      onClick={() => openEditEvaluation(rating)}
                                      className="p-1 hover:bg-theme-border/30 rounded-md text-theme-text-secondary hover:text-accent transition-all cursor-pointer"
                                      title={`Edit ${rating.raterName}'s Scorecard`}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingRatingId(rating.id)}
                                      className="p-1 hover:bg-danger/10 rounded-md text-danger transition-all cursor-pointer"
                                      title={`Delete ${rating.raterName}'s Scorecard`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
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
          <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
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
              {!editingRating && selectedTask && (() => {
                const role = resolveRatingReviewerRole(user, isDesignTask(selectedTask));
                if (role === 'SUPER_USER' || role === 'CENTRE_HEAD' || role === 'ADVISOR' || role === 'GG_HEAD') {
                  const roleLabel = role === 'SUPER_USER'
                    ? 'Super User'
                    : role === 'CENTRE_HEAD'
                      ? 'Centre Head'
                      : role === 'ADVISOR'
                        ? 'Advisor'
                        : 'Head of Events (GG Campus)';
                  return (
                    <p className="text-[10px] text-theme-text-secondary/80 italic">
                      Reviewing as {roleLabel} — the score shown for this task is the live average of evaluations submitted so far.
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            <form onSubmit={handleEvaluateSubmit} className="space-y-4 text-xs">

              <div className="text-[10px] font-bold uppercase tracking-wide text-accent">
                {CRITERIA_SET_LABEL[activeCriteriaSet]} Rubric
              </div>

              {/* Score Sliders */}
              <div className="space-y-3">
                {RATING_CRITERIA[activeCriteriaSet].map((criterion, idx) => (
                  <div className="space-y-1" key={criterion.key} title={criterion.description}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-theme-text-primary">{idx + 1}. {criterion.label}</span>
                      <span className="font-bold text-accent">{(scores[criterion.key] ?? 3).toFixed(1)} / 5</span>
                    </div>
                    <input
                      type="range" min="1" max="5" step="0.5"
                      value={scores[criterion.key] ?? 3}
                      onChange={(e) => setScores(s => ({ ...s, [criterion.key]: parseFloat(e.target.value) }))}
                      className="w-full accent-accent h-1.5 bg-theme-border/40 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ))}
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
                  {averageScore(scores).toFixed(1)} / 5.0
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
