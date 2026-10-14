import type { PublicFormItem, FormSubmissionItem } from '@/lib/local-data';
import { analyseFeedback, DEFAULT_TARGET } from '@/lib/feedback-analysis';
import { buildReportCharts } from '@/lib/feedback-report-charts';
import { buildFeedbackReportDocx } from '@/lib/feedback-report';

/** Analyses a Feedback Form's responses, builds the Word report (with charts) and triggers the browser download. */
export async function downloadFeedbackReport(
  form: PublicFormItem,
  submissions: FormSubmissionItem[],
  opts: { target?: number; attendees?: number; eventName?: string; preparedBy?: string } = {},
): Promise<void> {
  const target = opts.target ?? DEFAULT_TARGET;
  const analysis = analyseFeedback(form, submissions, target);
  const charts = await buildReportCharts(analysis, target);
  const blob = await buildFeedbackReportDocx(analysis, {
    formTitle: form.title,
    eventName: opts.eventName ?? form.eventName,
    attendees: opts.attendees && opts.attendees > 0 ? opts.attendees : undefined,
    target,
    preparedBy: opts.preparedBy,
  }, charts);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${form.slug || 'feedback'}-analysis-report.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
