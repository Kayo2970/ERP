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

export function computeFinalScore(avgScore: number, taskCount: number): number {
  if (taskCount <= 0) return 0;
  const countScore = 5 * Math.min(taskCount, TASK_COUNT_TARGET) / TASK_COUNT_TARGET;
  return parseFloat((QUALITY_WEIGHT * avgScore + TASK_COUNT_WEIGHT * countScore).toFixed(2));
}

export interface StudentFinalScore {
  name: string;
  taskCount: number;
  avgScore: number;
  countScore: number;
  finalScore: number;
}

export function buildStudentFinalScores(
  items: { targetName: string; overallScore: number }[]
): StudentFinalScore[] {
  const groups = new Map<string, number[]>();
  items.forEach(r => {
    const g = groups.get(r.targetName);
    if (g) g.push(r.overallScore); else groups.set(r.targetName, [r.overallScore]);
  });
  return Array.from(groups.entries())
    .map(([name, scores]) => {
      const avgScore = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      return {
        name,
        taskCount: scores.length,
        avgScore,
        countScore: parseFloat((5 * Math.min(scores.length, TASK_COUNT_TARGET) / TASK_COUNT_TARGET).toFixed(2)),
        finalScore: computeFinalScore(avgScore, scores.length),
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
