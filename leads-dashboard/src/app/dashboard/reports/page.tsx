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
import { getRatings, getMembers, RatingItem, Member } from '@/lib/local-data';
import { getRatingColor } from '@/lib/design-tokens';
import { BarChart3, Users, User, Download, Printer, Filter, Star, Info } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function ReportsPage() {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [reportType, setReportType] = useState<'individual' | 'committee'>('individual');
  const [selectedTarget, setSelectedTarget] = useState('All');
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');

  useEffect(() => {
    setRatings(getRatings());
    setMembers(getMembers());
  }, []);

  // Filter ratings based on selected type, target, and quarter
  const filteredRatings = ratings.filter(r => {
    if (r.targetType !== reportType) return false;
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
    score: r.overallScore,
    fill: getRatingColor(r.overallScore).hex,
  }));

  // Unique Targets List for selector
  const targets = Array.from(new Set(ratings.filter(r => r.targetType === reportType).map(r => r.targetName)));

  const handleDownloadReport = () => {
    if (filteredRatings.length === 0) {
      alert('No data available for export.');
      return;
    }
    
    let csvContent = 'Target Unit,Rater,Quarter,Quality,Timeliness,Initiative,Collaboration,Overall Score,Evaluation Date,Remarks\n';
    filteredRatings.forEach(r => {
      csvContent += `"${r.targetName}","${r.raterName}","${r.quarter || '2026-Q3'}",${r.quality},${r.timeliness},${r.initiative},${r.collaboration},${r.overallScore},"${r.createdAt}","${r.notes || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${reportType}_quarterly_report.csv`);
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
          <h1 className="text-xl font-bold text-theme-text-primary">Reports & Analytics Portal</h1>
          <p className="text-xs text-theme-text-secondary">Quarterly performance rollups, radar efficiency rubrics, and accessible audits</p>
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
        
        {/* Toggle Report Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-theme-text-secondary uppercase">Report Scope</label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setReportType('individual');
                setSelectedTarget('All');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                reportType === 'individual' 
                  ? 'bg-accent text-white shadow-md shadow-accent/20' 
                  : 'bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary'
              }`}
            >
              <User className="h-4 w-4" />
              Individual Roster
            </button>
            <button
              onClick={() => {
                setReportType('committee');
                setSelectedTarget('All');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                reportType === 'committee' 
                  ? 'bg-accent text-white shadow-md shadow-accent/20' 
                  : 'bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary'
              }`}
            >
              <Users className="h-4 w-4" />
              Committees
            </button>
          </div>
        </div>

        {/* Filter by Specific Unit / Individual */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-theme-text-secondary uppercase">
            Filter {reportType === 'individual' ? 'Member' : 'Committee'}
          </label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full px-3 py-2 bg-theme-background/30 border border-theme-border/40 rounded-xl text-xs text-theme-text-primary focus:outline-none focus:border-accent"
          >
            <option value="All">All {reportType === 'individual' ? 'Members' : 'Committees'}</option>
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
        {[
          { label: 'Quality', score: averages.quality },
          { label: 'Timeliness', score: averages.timeliness },
          { label: 'Initiative', score: averages.initiative },
          { label: 'Collaboration', score: averages.collaboration },
          { label: 'Overall Average', score: averages.overall, highlight: true },
        ].map(item => {
          const colorTokens = getRatingColor(item.score);
          return (
            <div key={item.label} className={`glass-panel rounded-2xl p-4 flex flex-col justify-between border ${item.highlight ? 'border-accent/40 bg-accent/5' : 'border-theme-border/30'}`}>
              <span className="text-[11px] font-semibold text-theme-text-secondary uppercase tracking-wider">{item.label}</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className={`text-2xl font-black ${item.highlight ? 'text-accent' : 'text-theme-text-primary'}`}>{item.score.toFixed(1)}</span>
                <span className="text-xs text-theme-text-secondary">/ 5.0</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar Evaluation Chart */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-theme-text-primary">Performance Rubric Radar</h3>
            <span className="text-[10px] text-accent font-semibold px-2 py-0.5 bg-accent/15 rounded">4-Axis Criteria</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {filteredRatings.length === 0 ? (
              <div className="text-center text-xs text-theme-text-secondary">No evaluation data for this criteria selection.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                  <Radar name="Performance" dataKey="A" stroke="#2E75B6" fill="#2E75B6" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Comparative Bar Chart with Design Scale Colors */}
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-theme-text-primary">Overall Rating Comparison</h3>
            <span className="text-[10px] text-theme-text-secondary font-medium">Color-coded by 5-pt scale</span>
          </div>

          <div className="h-64">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-theme-text-secondary">
                No evaluation scores available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 10 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: 'currentColor', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Accessible Alternative Data Table */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary">Evaluation Logs & Data Table</h3>
            <p className="text-xs text-theme-text-secondary flex items-center gap-1 mt-0.5">
              <Info className="h-3.5 w-3.5 text-accent" />
              Data table (accessible alternative to visual charts above)
            </p>
          </div>
          <span className="text-xs text-theme-text-secondary">{filteredRatings.length} records</span>
        </div>

        <div className="overflow-x-auto">
          {filteredRatings.length === 0 ? (
            <div className="text-center py-8 text-theme-text-secondary text-xs">
              No evaluation data found for the current period.
            </div>
          ) : (
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                  <th className="pb-3 font-semibold">Target Entity</th>
                  <th className="pb-3 font-semibold">Quarter</th>
                  <th className="pb-3 font-semibold">Evaluator</th>
                  <th className="pb-3 font-semibold">Quality</th>
                  <th className="pb-3 font-semibold">Timeliness</th>
                  <th className="pb-3 font-semibold">Initiative</th>
                  <th className="pb-3 font-semibold">Collaboration</th>
                  <th className="pb-3 font-semibold">Overall</th>
                  <th className="pb-3 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {filteredRatings.map(r => {
                  const colorTokens = getRatingColor(r.overallScore);
                  return (
                    <tr key={r.id} className="hover:bg-theme-border/10 transition-all text-xs">
                      <td className="py-3 font-bold text-theme-text-primary">{r.targetName}</td>
                      <td className="py-3 text-theme-text-secondary">{r.quarter || '2026-Q3'}</td>
                      <td className="py-3 text-theme-text-secondary">{r.raterName}</td>
                      <td className="py-3 text-theme-text-primary font-semibold">{r.quality}/5</td>
                      <td className="py-3 text-theme-text-primary font-semibold">{r.timeliness}/5</td>
                      <td className="py-3 text-theme-text-primary font-semibold">{r.initiative}/5</td>
                      <td className="py-3 text-theme-text-primary font-semibold">{r.collaboration}/5</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg border text-xs ${colorTokens.bg} ${colorTokens.text} ${colorTokens.border}`}>
                          <Star className="h-3 w-3 fill-current" />
                          {r.overallScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 text-theme-text-secondary max-w-xs truncate" title={r.notes}>
                        {r.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
