import { readCollection, mutateCollection } from './server-db';
import { dispatchEmail, wrapInMasterEmailTemplate } from './email-service';
import { resolveTaskEmailRecipients } from './task-email-queue';
import { getAppBaseUrl } from './app-url';
import type { TaskItem, Member, EventItem } from './local-data';

function tomorrowDateString(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Emails everyone assigned to a task due tomorrow, once per task ever — the
 * `deadlineReminderSentAt` stamp is the idempotency guard, making this safe
 * to call from both the boot catch-up and the daily timer without ever
 * double-sending. Skips tasks already marked Completed.
 */
export async function runTaskDeadlineReminderCheck(): Promise<{ checked: number; sent: number }> {
  const tomorrow = tomorrowDateString();

  const tasks = await readCollection<TaskItem>('tasks');
  const candidates = tasks.filter(
    (t) => t.dueDate === tomorrow && t.status !== 'Completed' && !t.deadlineReminderSentAt
  );

  if (candidates.length === 0) {
    return { checked: tasks.length, sent: 0 };
  }

  const [members, events] = await Promise.all([
    readCollection<Member>('members'),
    readCollection<EventItem>('events'),
  ]);

  const baseUrl = getAppBaseUrl();
  const taskUrl = `${baseUrl}/dashboard/tasks`;
  let sentCount = 0;

  for (const task of candidates) {
    const recipients = resolveTaskEmailRecipients(task, members as any, events as any);
    if (recipients.length === 0) continue;

    let anySent = false;
    for (const recipient of recipients) {
      const eventLabel = task.event || 'LEADS Operations';
      const subject = `Deadline Tomorrow: ${task.title}`;
      const bodyText = `Dear ${recipient.name},\n\nThis is a reminder that the following task is due tomorrow (${task.dueDate}):\n\n` +
        `- ${task.title} (Context: ${eventLabel})\n\n` +
        `Please complete it before the deadline:\n${taskUrl}\n\nRegards,\nLEADS Committee Management`;

      const bodyHtml = wrapInMasterEmailTemplate({
        pageTitle: subject,
        badgeText: 'Deadline Reminder',
        badgeColor: '#dc2626',
        headerTitle: task.title,
        bodyContentHtml: `
          <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
            Dear <strong>${recipient.name}</strong>,<br/>
            This is a reminder that the following task is due <strong>tomorrow</strong>:
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin: 16px 0;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 120px;">Task:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${task.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Context:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${eventLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Due Date:</td>
              <td style="padding: 8px 0; font-weight: 700; color: #dc2626;">${task.dueDate}</td>
            </tr>
          </table>
          <div style="text-align: center; margin: 20px 0 4px;">
            <a href="${taskUrl}" target="_blank" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px;">
              Open Tasks Desk &rarr;
            </a>
          </div>
        `,
      });

      const result = await dispatchEmail({
        to: recipient.email,
        subject,
        bodyText,
        bodyHtml,
        category: 'TASK_ASSIGNMENT',
      });
      if (result.status === 'SENT') anySent = true;
    }

    if (anySent) {
      sentCount++;
      await mutateCollection<TaskItem>('tasks', (current) =>
        current.map((t) => (t.id === task.id ? { ...t, deadlineReminderSentAt: new Date().toISOString() } : t))
      );
    }
  }

  return { checked: tasks.length, sent: sentCount };
}

function msUntilNextMidnight(): number {
  const now = new Date();
  // A few seconds past midnight, offset from the other daily schedulers'
  // own :10/:15 offsets so they don't all fire in the same tick.
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 20, 0);
  return next.getTime() - now.getTime();
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Starts the in-process daily task-deadline-reminder scheduler. Registered
 * once from instrumentation.ts at server boot, mirroring
 * birthday-scheduler.ts's startBirthdayScheduler(): this app runs
 * continuously under PM2, so a single long-lived in-process timer is
 * enough — no external crontab entry needed.
 *
 * Safe to call more than once (e.g. Next.js dev-mode module reloads): a
 * flag on `globalThis` stops a second call from stacking a duplicate timer.
 */
export function startTaskDeadlineReminderScheduler(): void {
  const g = globalThis as unknown as { __taskDeadlineReminderSchedulerStarted?: boolean };
  if (g.__taskDeadlineReminderSchedulerStarted) return;
  g.__taskDeadlineReminderSchedulerStarted = true;

  // Catch up immediately on boot in case the server was down at midnight —
  // the deadlineReminderSentAt guard makes this always safe to run, even
  // right after a scheduled run already fired today.
  runTaskDeadlineReminderCheck().catch((err) => console.error('[task-deadline-reminder-scheduler] Startup catch-up check failed:', err));

  setTimeout(() => {
    runTaskDeadlineReminderCheck().catch((err) => console.error('[task-deadline-reminder-scheduler] Midnight check failed:', err));
    setInterval(() => {
      runTaskDeadlineReminderCheck().catch((err) => console.error('[task-deadline-reminder-scheduler] Daily check failed:', err));
    }, DAY_MS);
  }, msUntilNextMidnight());
}
