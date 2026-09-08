/**
 * Category-specific rating rubrics. Each task category is scored against its
 * own set of 5 criteria (all on the existing 1-5 scale) instead of the single
 * generic 4-criteria form used previously.
 */
export type RatingCriteriaSet = 'general' | 'design' | 'reportWriting';

export interface RatingCriterion {
  key: string;
  label: string;
  description: string;
}

export const RATING_CRITERIA: Record<RatingCriteriaSet, RatingCriterion[]> = {
  general: [
    { key: 'accuracy', label: 'Accuracy', description: 'Correctness of information provided' },
    { key: 'timeliness', label: 'Timeliness', description: 'Adherence to set deadlines' },
    { key: 'collaboration', label: 'Collaboration', description: 'Effective teamwork and communication with others' },
    { key: 'reliability', label: 'Reliability', description: 'Dependability in completing assigned duties' },
    { key: 'communication', label: 'Communication', description: 'Clarity and effectiveness in transmitting information' },
  ],
  design: [
    { key: 'originality', label: 'Originality', description: 'Creativity and uniqueness of the design' },
    { key: 'technicalExecution', label: 'Technical Execution and Polish', description: 'Professionalism, cleanliness, and formatting of the file' },
    { key: 'functionality', label: 'Functionality', description: 'Effectiveness of the design in serving its purpose across media' },
    { key: 'presentation', label: 'Presentation', description: 'Overall visual appeal and engagement' },
    { key: 'attentionToDetail', label: 'Attention to Detail', description: 'Precision in design elements' },
  ],
  reportWriting: [
    { key: 'clarity', label: 'Clarity', description: 'Ease of understanding the written content' },
    { key: 'analysis', label: 'Analysis', description: 'Depth of critical thinking and examination of data' },
    { key: 'structure', label: 'Structure', description: 'Logical organization of the report' },
    { key: 'comprehensiveness', label: 'Comprehensiveness', description: 'Thorough coverage of the event or topic' },
    { key: 'accuracy', label: 'Accuracy', description: 'Correctness of facts and data presented' },
  ],
};

export function criteriaSetForTaskCategory(taskCategory: string | undefined): RatingCriteriaSet {
  if (taskCategory === 'design') return 'design';
  if (taskCategory === 'reportWriting') return 'reportWriting';
  return 'general';
}

export function averageScore(scores: Record<string, number>): number {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  return parseFloat((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1));
}

/**
 * Projects the new per-criterion scores onto the legacy fixed
 * quality/timeliness/initiative/collaboration fields so existing analytics
 * (report-generator.ts, reports/page.tsx, student-profile-modal.tsx) that
 * were built around exactly those 4 fields keep working without a rewrite.
 * The mapping is an approximation, not a semantic equivalence — the real
 * per-criterion breakdown lives in `scores`/`criteriaSet`.
 */
export function projectLegacyRatingFields(
  criteriaSet: RatingCriteriaSet,
  scores: Record<string, number>
): { quality: number; timeliness: number; initiative: number; collaboration: number } {
  const overall = averageScore(scores);
  if (criteriaSet === 'general') {
    return {
      quality: scores.accuracy ?? overall,
      timeliness: scores.timeliness ?? overall,
      initiative: scores.reliability ?? overall,
      collaboration: scores.collaboration ?? overall,
    };
  }
  if (criteriaSet === 'design') {
    return {
      quality: scores.technicalExecution ?? overall,
      timeliness: overall,
      initiative: scores.originality ?? overall,
      collaboration: scores.presentation ?? overall,
    };
  }
  return {
    quality: scores.accuracy ?? overall,
    timeliness: overall,
    initiative: scores.analysis ?? overall,
    collaboration: scores.structure ?? overall,
  };
}
