/**
 * Final performance score for a student: blends the quality of their
 * evaluations (average score, 0-5) with how many tasks they have been
 * evaluated on (volume), so doing more tasks counts toward the final score.
 *
 *   final = QUALITY_WEIGHT * avgScore + TASK_COUNT_WEIGHT * countScore
 *   countScore = 5 * min(taskCount, TASK_COUNT_TARGET) / TASK_COUNT_TARGET
 */
export const QUALITY_WEIGHT = 0.7;
export const TASK_COUNT_WEIGHT = 0.3;
export const TASK_COUNT_TARGET = 5;

export function computeFinalScore(avgScore: number, taskCount: number, totalEvents?: number, eventsParticipated?: number): number {
  if (taskCount <= 0) return 0;
  const countScore = participationScore(taskCount, totalEvents, eventsParticipated);
  return parseFloat((QUALITY_WEIGHT * avgScore + TASK_COUNT_WEIGHT * countScore).toFixed(2));
}

/**
 * The 30% volume part. When the total number of events held is known, it is the share of ALL events the student
 * took part in (so events they were not part of pull it down), not just the ones they were evaluated on.
 * Without a total it falls back to the old task-count target.
 */
export function participationScore(taskCount: number, totalEvents?: number, eventsParticipated?: number): number {
  if (totalEvents && totalEvents > 0 && eventsParticipated !== undefined) {
    return 5 * Math.min(eventsParticipated, totalEvents) / totalEvents;
  }
  return 5 * Math.min(taskCount, TASK_COUNT_TARGET) / TASK_COUNT_TARGET;
}

export interface StudentFinalScore {
  name: string;
  taskCount: number;
  eventCount: number;
  /** Real events (not standalone tasks) the student took part in. */
  eventsParticipated: number;
  avgScore: number;
  countScore: number;
  finalScore: number;
}

/**
 * Every event a student was evaluated on counts. Tasks are first averaged
 * within each event, then the per-event averages are averaged with equal
 * weight, so a single task-heavy event cannot dominate the quality part and
 * an event with one task counts as much as one with many. Tasks without an
 * event are pooled as one "standalone" bucket. The task-count part still
 * uses the share of ALL events held (`totalEvents`) the student took part in; if the total is not given it uses the
 * number of evaluated tasks.
 */
export function buildStudentFinalScores(
  items: { targetName: string; overallScore: number; eventName?: string }[],
  totalEvents?: number
): StudentFinalScore[] {
  const byStudent = new Map<string, Map<string, number[]>>();
  items.forEach(r => {
    const events = byStudent.get(r.targetName) ?? new Map<string, number[]>();
    const ev = r.eventName || '__standalone__';
    const scores = events.get(ev);
    if (scores) scores.push(r.overallScore); else events.set(ev, [r.overallScore]);
    byStudent.set(r.targetName, events);
  });
  return Array.from(byStudent.entries())
    .map(([name, events]) => {
      const eventAvgs = Array.from(events.values()).map(sc => sc.reduce((a, b) => a + b, 0) / sc.length);
      const taskCount = Array.from(events.values()).reduce((n, sc) => n + sc.length, 0);
      const avgScore = parseFloat((eventAvgs.reduce((a, b) => a + b, 0) / eventAvgs.length).toFixed(2));
      // Standalone tasks are not an event: they never count toward event participation
      const eventsParticipated = Array.from(events.keys()).filter(k => k !== '__standalone__').length;
      return {
        name,
        taskCount,
        eventCount: events.size,
        eventsParticipated,
        avgScore,
        countScore: parseFloat(participationScore(taskCount, totalEvents, eventsParticipated).toFixed(2)),
        finalScore: computeFinalScore(avgScore, taskCount, totalEvents, eventsParticipated),
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
