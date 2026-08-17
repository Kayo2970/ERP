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
import { BarChart3, Users, User, Download, TrendingUp, AlertCircle } from 'lucide-react';

export default function ReportsPage() {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [reportType, setReportType] = useState<'individual' | 'committee'>('individual');
  const [selectedTarget, setSelectedTarget] = useState('All');

  useEffect(() => {
    setRatings(getRatings());
    setMembers(getMembers());
  }, []);

  // Filter ratings based on selected type and target
  const filteredRatings = ratings.filter(r => {
    if (r.targetType !== reportType) return false;
    if (selectedTarget !== 'All' && r.targetName !== selectedTarget) return false;
    return true;
  });

  // Calculate Average Metrics (Quality, Timeliness, Initiative, Collaboration)
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

  // Radar Data for visual representation
  const radarData = [
    { subject: 'Quality', A: averages.quality, fullMark: 5 },
    { subject: 'Timeliness', A: averages.timeliness, fullMark: 5 },
    { subject: 'Initiative', A: averages.initiative, fullMark: 5 },
    { subject: 'Collaboration', A: averages.collaboration, fullMark: 5 },
  ];

  // Bar Data comparing overall ratings by target name
  const barData = filteredRatings.map(r => ({
    name: r.targetName,
    score: r.overallScore,
  }));

  // Unique Targets List for selector
  const targets = Array.from(new Set(ratings.filter(r => r.targetType === reportType).map(r => r.targetName)));

  const handleDownloadReport = () => {
    if (filteredRatings.length === 0) {
      alert('No data available for export.');
      return;
    }
    
    let csvContent = 'Target Unit,Rater,Quality,Timeliness,Initiative,Collaboration,Overall Score,Evaluation Date,Notes\n';
    filteredRatings.forEach(r => {
      csvContent += `"${r.targetName}","${r.raterName}",${r.quality},${r.timeliness},${r.initiative},${r.collaboration},${r.overallScore},"${r.createdAt}","${r.notes || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${reportType}_performance_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Reports & Analytics Portal</h1>
          <p className="text-xs text-theme-text-secondary">Explore overall center efficiency and individual performance scores</p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Export Report Data (CSV)
        </button>
      </div>

      {/* Control Selector Filters */}
      <div className="glass-panel rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        
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
                  ? 'bg-accent text-white shadow-md' 
                  : 'bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary'
              }`}
            >
              <User className="h-4 w-4" />
              By Individual
            </button>
            <button
              onClick={() => {
                setReportType('committee');
                setSelectedTarget('All');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                reportType === 'committee' 
                  ? 'bg-accent text-white shadow-md' 
                  : 'bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary'
              }`}
            >
              <Users className="h-4 w-4" />
              By Committee
            </button>
          </div>
        </div>

        {/* Target Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-theme-text-secondary uppercase">Target Subject</label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
          >
            <option value="All">All {reportType === 'committee' ? 'Committees' : 'Students'}</option>
            {targets.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* KPI Score card rollup */}
        <div className="flex items-center gap-4 bg-accent/10 border border-accent/15 rounded-xl p-3">
          <div className="h-10 w-10 bg-accent/10 border border-accent/15 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-[10px] text-theme-text-secondary uppercase tracking-wider font-semibold">Overall Score rollup</p>
            <h3 className="text-lg font-black text-theme-text-primary">
              {averages.overall > 0 ? `${averages.overall} / 5.0` : 'No Scores'}
            </h3>
          </div>
        </div>

      </div>

      {filteredRatings.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-theme-text-secondary text-sm">
          No ratings recorded yet for this selection.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Radar representation of 4 dimensions */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
              <div>
                <h3 className="text-base font-semibold text-theme-text-primary">4-Factor Metric Rollup</h3>
                <p className="text-xs text-theme-text-secondary">Average rating breakdown across standard evaluations</p>
              </div>
              
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="var(--text-secondary)" fontSize={9} />
                    <Radar name="Score" dataKey="A" stroke="#2E75B6" fill="#2E75B6" fillOpacity={0.4} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card-bg)', 
                        borderColor: 'var(--card-border)', 
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontSize: '12px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart overall score comparison */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-4">
              <div>
                <h3 className="text-base font-semibold text-theme-text-primary">Direct Comparisons</h3>
                <p className="text-xs text-theme-text-secondary">Rollup comparison scores for target units</p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} />
                    <YAxis domain={[0, 5]} stroke="var(--text-secondary)" fontSize={11} ticks={[0, 1, 2, 3, 4, 5]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card-bg)', 
                        borderColor: 'var(--card-border)', 
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={45}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#7FB069" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Table breakdown breakdown */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-theme-text-primary">Raw Performance Evaluations</h3>
              <p className="text-xs text-theme-text-secondary">Summary grid of metrics compiled for this report view</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                    <th className="pb-3.5 font-semibold">Name</th>
                    <th className="pb-3.5 font-semibold text-center">Quality</th>
                    <th className="pb-3.5 font-semibold text-center">Timeliness</th>
                    <th className="pb-3.5 font-semibold text-center">Initiative</th>
                    <th className="pb-3.5 font-semibold text-center">Collaboration</th>
                    <th className="pb-3.5 font-semibold text-right">Overall average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20 text-xs">
                  {filteredRatings.map(row => (
                    <tr key={row.id} className="hover:bg-theme-border/10 transition-all">
                      <td className="py-3.5 pr-2 font-medium text-theme-text-primary">{row.targetName}</td>
                      <td className="py-3.5 pr-2 text-center text-theme-text-secondary">{row.quality}</td>
                      <td className="py-3.5 pr-2 text-center text-theme-text-secondary">{row.timeliness}</td>
                      <td className="py-3.5 pr-2 text-center text-theme-text-secondary">{row.initiative}</td>
                      <td className="py-3.5 pr-2 text-center text-theme-text-secondary">{row.collaboration}</td>
                      <td className="py-3.5 pr-2 text-right font-bold text-accent">{row.overallScore.toFixed(1)} / 5.0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
