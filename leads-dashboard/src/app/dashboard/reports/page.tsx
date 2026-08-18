'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from 'recharts';
import { getRatings, getMembers, getTasks, RatingItem, Member, TaskItem } from '@/lib/local-data';
import { getRatingColor } from '@/lib/design-tokens';
import { canViewRating } from '@/lib/permissions';
import { BarChart3, Users, User, Download, Printer, Filter, Star, Info, Layers, CheckSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function ReportsPage() {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedTarget, setSelectedTarget] = useState('All');
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');

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

  // Filter ratings based on viewer's access, then selected division, target member, and quarter
  const filteredRatings = ratings.filter(r => {
    if (!canViewRating(r, user)) return false;
    // If division filter is active, check the target member's division
    if (selectedDivision !== 'ALL') {
      const member = members.find(m => m.name.toLowerCase() === r.targetName.toLowerCase() || m.id === r.targetId);
      if (!member || member.division !== selectedDivision) return false;
    }
    if (selectedTarget !== 'All' && r.targetName !== selectedTarget) return false;
    if (selectedQuarter !== 'ALL') {
      const q = r.quarter || '2026-Q3';
      if (q !== selectedQuarter) return false;
    }
    return true;
  });

  // Calculate Average Metrics
  const calculateAverages = () => {
    if (filteredRatings.length === 0) {
      return { quality: 0, timeliness: 0, initiative: 0, collaboration: 0, overall: 0 };
    }

    let qualitySum = 0, timelinessSum = 0, initiativeSum = 0, collaborationSum = 0, overallSum = 0;
    filteredRatings.forEach(r => {
      qualitySum += r.quality;
      timelinessSum += r.timeliness;
      initiativeSum += r.initiative;
      collaborationSum += r.collaboration;
      overallSum += r.overallScore;
    });

    const len = filteredRatings.length;
    return {
      quality: parseFloat((qualitySum / len).toFixed(1)),
      timeliness: parseFloat((timelinessSum / len).toFixed(1)),
      initiative: parseFloat((initiativeSum / len).toFixed(1)),
      collaboration: parseFloat((collaborationSum / len).toFixed(1)),
      overall: parseFloat((overallSum / len).toFixed(1)),
    };
  };

  const averages = calculateAverages();

  // Radar Data
  const radarData = [
    { subject: 'Quality', A: averages.quality, fullMark: 5 },
    { subject: 'Timeliness', A: averages.timeliness, fullMark: 5 },
    { subject: 'Initiative', A: averages.initiative, fullMark: 5 },
    { subject: 'Collaboration', A: averages.collaboration, fullMark: 5 },
  ];

  // Bar Data with dynamic color tokens from design system
  const barData = filteredRatings.map(r => ({
    name: r.targetName,
    task: r.taskTitle,
    score: r.overallScore,
    fill: getRatingColor(r.overallScore).hex,
  }));

  // Unique Targets List for selector
  const targets = Array.from(new Set(ratings.map(r => r.targetName)));

  const handleDownloadReport = () => {
    if (filteredRatings.length === 0) {
      alert('No data available for export.');
      return;
    }
    
    let csvContent = 'Student Member,Task Deliverable,Event,Rater,Quarter,Quality,Timeliness,Initiative,Collaboration,Overall Score,Evaluation Date,Remarks\n';
    filteredRatings.forEach(r => {
      csvContent += `"${r.targetName}","${r.taskTitle}","${r.eventName || ''}","${r.raterName}","${r.quarter || '2026-Q3'}",${r.quality},${r.timeliness},${r.initiative},${r.collaboration},${r.overallScore},"${r.createdAt}","${r.notes || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_task_performance_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 print:p-0 print:space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Reports & Performance Analytics</h1>
          <p className="text-xs text-theme-text-secondary">Task-based evaluation rubrics, radar competency breakdown, and performance audits</p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer border border-theme-border/40"
            title="Generate Printable PDF View"
          >
            <Printer className="h-4 w-4" />
            Generate PDF / Print
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Control Selector Filters */}
      <div className="glass-panel rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center print:hidden">
        
        {/* Division Filter */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-theme-text-secondary uppercase">Division Scope</label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="w-full px-3 py-2 bg-theme-background/30 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Divisions</option>
            <option value="Advisory Board">Advisory Board</option>
            <option value="Core Committee">Core Committee</option>
            <option value="Training Associate">Training Associates</option>
            <option value="Alumni">Alumni Mentors</option>
          </select>
        </div>

        {/* Filter by Specific Member */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-theme-text-secondary uppercase">
            Filter by Member
          </label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full px-3 py-2 bg-theme-background/30 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent"
          >
            <option value="All">All Evaluated Members</option>
            {targets.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Quarterly Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-theme-text-secondary uppercase">Quarterly Period</label>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="w-full px-3 py-2 bg-theme-background/30 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Quarters (Cumulative)</option>
            <option value="2026-Q3">2026 Q3 (Current Quarter)</option>
            <option value="2026-Q2">2026 Q2</option>
            <option value="2026-Q1">2026 Q1</option>
          </select>
        </div>

      </div>

      {/* Summary Scorecards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] text-theme-text-secondary font-medium">Quality Avg</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-theme-text-primary">{averages.quality}</span>
            <span className="text-xs text-theme-text-secondary">/ 5.0</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] text-theme-text-secondary font-medium">Timeliness Avg</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-theme-text-primary">{averages.timeliness}</span>
            <span className="text-xs text-theme-text-secondary">/ 5.0</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] text-theme-text-secondary font-medium">Initiative Avg</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-theme-text-primary">{averages.initiative}</span>
            <span className="text-xs text-theme-text-secondary">/ 5.0</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] text-theme-text-secondary font-medium">Collaboration Avg</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-theme-text-primary">{averages.collaboration}</span>
            <span className="text-xs text-theme-text-secondary">/ 5.0</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between border-l-4 border-l-accent col-span-2 sm:col-span-1">
          <span className="text-[11px] text-accent font-bold">Overall Average</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-black text-theme-text-primary">{averages.overall}</span>
            <span className="text-xs text-theme-text-secondary">/ 5.0</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section */}
      {filteredRatings.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No evaluations found"
          description="There are no task performance evaluation scorecards for the selected filters."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Radar Chart: Competency Rubric */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-theme-text-primary">Competency Balance Rubric</h3>
                <p className="text-[11px] text-theme-text-secondary">Evaluation averages across key performance metrics</p>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="rgba(255,255,255,0.2)" />
                  <Radar name="Performance" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      fontSize: '11px' 
                    }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Comparative Performance */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-sm text-theme-text-primary">Deliverable Performance Distribution</h3>
              <p className="text-[11px] text-theme-text-secondary">Task scores awarded to individual student contributors</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis domain={[0, 5]} tick={{ fill: 'currentColor', fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: any) => [`${value} / 5.0`, 'Score']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      fontSize: '11px' 
                    }} 
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Audited Scorecard Records Table */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-theme-text-primary">Audited Performance Logs ({filteredRatings.length})</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="text-theme-text-secondary border-b border-theme-border/40">
                <th className="pb-3 font-semibold">Student Member</th>
                <th className="pb-3 font-semibold">Evaluated Task</th>
                <th className="pb-3 font-semibold">Event</th>
                <th className="pb-3 font-semibold">Evaluator</th>
                <th className="pb-3 font-semibold">Overall Rating</th>
                <th className="pb-3 font-semibold">Evaluation Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/20">
              {filteredRatings.map((rating) => {
                const colorTokens = getRatingColor(rating.overallScore);
                return (
                  <tr key={rating.id} className="hover:bg-theme-border/10 transition-all text-xs">
                    <td className="py-3 pr-2 font-bold text-theme-text-primary">{rating.targetName}</td>
                    <td className="py-3 pr-2 text-theme-text-secondary font-medium">{rating.taskTitle}</td>
                    <td className="py-3 pr-2 text-theme-text-secondary">{rating.eventName || '—'}</td>
                    <td className="py-3 pr-2 text-theme-text-secondary">{rating.raterName}</td>
                    <td className="py-3 pr-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${colorTokens.bg} ${colorTokens.text} ${colorTokens.border}`}>
                        <Star className="h-3 w-3 fill-current" />
                        {rating.overallScore.toFixed(1)} / 5.0
                      </span>
                    </td>
                    <td className="py-3 text-theme-text-secondary max-w-xs truncate" title={rating.notes}>
                      {rating.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
