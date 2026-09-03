import { readCollection, mutateCollection } from './server-db';

const DAY_MS = 24 * 60 * 60 * 1000;

function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * For every real (non-holiday, dated) event whose last day has already
 * passed, creates an `event_social_post` task — assigned as a group to the
 * senior Head of Design and every Core Committee member — asking for social
 * media coverage of the just-concluded event. Delegating it to a specific
 * person (see delegateAutoTask in local-data.ts) requires Centre Head / GG
 * Campus Events Head sign-off, same as any other task edit. Completing it
 * chains into a follow-on event-report-request task for the General
 * Secretary (see updateTask's spawnEventReportRequestTask).
 *
 * Skips events with no fixed end date (datesTBD), auto-synced holidays
 * (which already run their own holiday_social_approval workflow), and
 * events that never got approved. Every operation here is idempotent (a
 * deterministic task id per event), so re-running this on every boot and
 * every day is always safe and never creates a duplicate.
 */
export async function runEventLapseSocialTasks(): Promise<{ created: number }> {
  const events = await readCollection<any>('events');
  const today = todayDateString();

  const lapsedEvents = events.filter((e: any) =>
    !e.isHoliday &&
    !e.datesTBD &&
    !e.socialTaskDismissed &&
    typeof e.endDate === 'string' && e.endDate.length > 0 && e.endDate < today &&
    e.approvalStatus !== 'pending_create' && e.approvalStatus !== 'rejected' && e.approvalStatus !== 'pending_delete'
  );
  if (lapsedEvents.length === 0) return { created: 0 };

  const tasks = await readCollection<any>('tasks');
  const alreadyCreated = new Set(
    tasks.filter((t: any) => t.workflowType === 'event_social_post').map((t: any) => t.eventId)
  );
  const toCreate = lapsedEvents.filter((e: any) => !alreadyCreated.has(e.id));
  if (toCreate.length === 0) return { created: 0 };

  const members = await readCollection<any>('members');
  const activeMembers = members.filter((m: any) => m.status !== 'Terminated' && m.email);
  let pool = activeMembers.filter((m: any) => {
    const role = (m.role || '').toLowerCase();
    const isSeniorDesignHead = role.includes('design') && role.includes('head') && role.includes('senior');
    const isCoreCommittee = m.division === 'Core Committee';
    return isSeniorDesignHead || isCoreCommittee;
  });
  // Never leave the task with no one able to see/answer it.
  if (pool.length === 0) pool = activeMembers.filter((m: any) => m.tier <= 2);

  let created = 0;
  await mutateCollection<any>('tasks', (current) => {
    const next = [...current];
    for (const e of toCreate) {
      const id = `task_event_social_${e.id}`;
      if (next.some((t: any) => t.id === id)) continue;
      next.unshift({
        id,
        title: `Social media posts required for "${e.title}" (event concluded ${e.endDate})`,
        event: e.title,
        eventId: e.id,
        assignee: pool.map((m: any) => m.name).join(', ') || 'Design Head',
        assigneeType: 'group',
        assigneeIds: pool.map((m: any) => m.id),
        dueDate: today,
        status: 'Assigned',
        creatorName: 'Event Scheduler',
        workflowType: 'event_social_post',
      });
      created++;
    }
    return next;
  });

  return { created };
}

function msUntilNextMidnight(): number {
  const now = new Date();
  // A few seconds past midnight, so the check reliably lands on the new day.
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 15, 0);
  return next.getTime() - now.getTime();
}

/**
 * Starts the in-process daily event-lapse scheduler. Registered once from
 * instrumentation.ts at server boot, mirroring birthday-scheduler.ts's
 * pattern exactly: an immediate catch-up run (so a server restart doesn't
 * cost a missed day), then a timer aligned to the next midnight, repeating
 * every 24 hours after that.
 */
export function startEventSocialScheduler(): void {
  const g = globalThis as unknown as { __eventSocialSchedulerStarted?: boolean };
  if (g.__eventSocialSchedulerStarted) return;
  g.__eventSocialSchedulerStarted = true;

  runEventLapseSocialTasks().catch((err) => console.error('[event-social-scheduler] Startup catch-up check failed:', err));

  setTimeout(() => {
    runEventLapseSocialTasks().catch((err) => console.error('[event-social-scheduler] Midnight check failed:', err));
    setInterval(() => {
      runEventLapseSocialTasks().catch((err) => console.error('[event-social-scheduler] Daily check failed:', err));
    }, DAY_MS);
  }, msUntilNextMidnight());
}
