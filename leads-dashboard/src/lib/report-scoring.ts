import { EventReportItem } from './local-data';

const HALF_LIFE_DAYS = 90;
const LAMBDA = Math.log(2) / HALF_LIFE_DAYS;
const EVENT_DECAY_GAMMA = 0.9;

export interface ScoredReport {
  score: number;
  submittedAt: string;
}

/**
 * Weighted average of a submitter's report scores, where each report's
 * weight decays over time (half-life of 90 days) and with the number of
 * later reports the same submitter has completed since (gamma^k). Returns
 * null when there is nothing scored yet.
 */
export function computeFinalReportScore(reports: ScoredReport[], now: Date = new Date()): number | null {
  if (reports.length === 0) return null;

  const sorted = [...reports].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  let weightedSum = 0;
  let weightTotal = 0;

  sorted.forEach((report, i) => {
    const deltaTDays = Math.max(0, (now.getTime() - new Date(report.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
    const k = sorted.length - 1 - i; // number of subsequent reports after this one
    const weight = Math.exp(-LAMBDA * deltaTDays) * Math.pow(EVENT_DECAY_GAMMA, k);
    weightedSum += weight * report.score;
    weightTotal += weight;
  });

  if (weightTotal === 0) return null;
  return parseFloat((weightedSum / weightTotal).toFixed(2));
}

export interface SubmitterReportScore {
  submittedBy: string;
  reportCount: number;
  lastSubmittedAt: string;
  finalScore: number;
}

/**
 * Groups scored event reports by submitter and computes each one's decayed
 * Final Score, for the Ratings page's report-scoring leaderboard.
 */
export function groupScoredReportsBySubmitter(reports: EventReportItem[]): SubmitterReportScore[] {
  const bySubmitter = new Map<string, EventReportItem[]>();

  reports
    .filter((r): r is EventReportItem & { reportScore: number } => typeof r.reportScore === 'number')
    .forEach(r => {
      const key = r.submittedBy || 'Unknown';
      if (!bySubmitter.has(key)) bySubmitter.set(key, []);
      bySubmitter.get(key)!.push(r);
    });

  const results: SubmitterReportScore[] = [];
  bySubmitter.forEach((submitterReports, submittedBy) => {
    const scored: ScoredReport[] = submitterReports.map(r => ({ score: r.reportScore as number, submittedAt: r.submittedAt }));
    const finalScore = computeFinalReportScore(scored);
    if (finalScore === null) return;
    const lastSubmittedAt = submitterReports
      .map(r => r.submittedAt)
      .sort()
      .slice(-1)[0];
    results.push({ submittedBy, reportCount: submitterReports.length, lastSubmittedAt, finalScore });
  });

  return results.sort((a, b) => b.finalScore - a.finalScore);
}
