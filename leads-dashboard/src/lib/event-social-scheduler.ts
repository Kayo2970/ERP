import { readCollection, mutateCollection } from './server-db';
import { enqueueTaskEmailNotification } from './task-email-queue';
import { isSocialMediaTeamMember, isSocialMediaHeadOrSrHead, isFaculty } from './permissions-server';

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
  const [events, systemSettingsList] = await Promise.all([
    readCollection<any>('events'),
    readCollection<any>('systemSettings'),
  ]);
  const dismissedSet = new Set<string>(systemSettingsList?.[0]?.dismissedAutoTaskIds || []);
  const today = todayDateString();

  const lapsedEvents = events.filter((e: any) => {
    if (e.isHoliday || e.datesTBD) return false;
    if (e.socialTaskDismissed) return false;
    if (e.dismissedAutoTaskTypes?.includes('event_social_post')) return false;
    if (dismissedSet.has(`task_event_social_${e.id}`) || dismissedSet.has(`event_social_post_${e.id}`) || dismissedSet.has(e.id)) return false;
    if (e.approvalStatus === 'pending_create' || e.approvalStatus === 'rejected' || e.approvalStatus === 'pending_delete') return false;

    // Auto-generated tasks are ONLY allowed after the day the event is done, never before it
    const eventEnd = (typeof e.endDate === 'string' && e.endDate.trim()) || (typeof e.startDate === 'string' && e.startDate.trim());
    if (!eventEnd) return false;
    return eventEnd < today;
  });
  if (lapsedEvents.length === 0) return { created: 0 };

  const [tasks, designs] = await Promise.all([
    readCollection<any>('tasks'),
    readCollection<any>('designs'),
  ]);
  const alreadyCreated = new Set([
    ...tasks.filter((t: any) => t.workflowType === 'event_social_post' || (t.eventId && t.status === 'Completed' && (t.taskCategory === 'design' || t.isDesignDeliverable || t.isSocialMediaPost))).map((t: any) => t.eventId),
    ...designs.filter((d: any) => d.eventId && (d.workflowStage === 'completed' || d.review?.status === 'Proofread Approved')).map((d: any) => d.eventId),
  ]);
  const toCreate = lapsedEvents.filter((e: any) => !alreadyCreated.has(e.id));
  if (toCreate.length === 0) return { created: 0 };

  const members = await readCollection<any>('members');
  const activeMembers = members.filter((m: any) => m.status !== 'Terminated' && m.email && !isFaculty(m));
  // Auto-created social media tasks go strictly to the Head and Senior Head of Social Media,
  // never to a committee or general group of students.
  const heads = activeMembers.filter((m: any) => isSocialMediaHeadOrSrHead(m));
  const pool = heads.length > 0 ? heads : activeMembers.filter((m: any) => isSocialMediaTeamMember(m));

  let created = 0;
  await mutateCollection<any>('tasks', (current) => {
    const next = [...current];
    for (const e of toCreate) {
      const id = `task_event_social_${e.id}`;
      if (next.some((t: any) => t.id === id)) continue;
      const eventEnd = e.endDate || e.startDate;
      const isSingle = pool.length === 1;
      next.unshift({
        id,
        title: `Social media posts required for "${e.title}" (event concluded ${eventEnd})`,
        event: e.title,
        eventId: e.id,
        assignee: pool.map((m: any) => m.name).join(', ') || 'Social Media Head',
        assigneeType: isSingle ? 'individual' : 'group',
        assigneeId: isSingle ? pool[0].id : undefined,
        assigneeEmail: isSingle ? pool[0].email : undefined,
        assigneeIds: pool.map((m: any) => m.id),
        dueDate: today,
        status: 'Assigned',
        creatorName: 'Event Scheduler',
        workflowType: 'event_social_post',
        isSocialMediaPost: true,
        // Flag this as a real Design Task, not a general one, so it shows
        // up in the Design Portal's "Design Task Requests" queue — without
        // this, a design submitted against it had no way to reference this
        // task (no sourceTaskId), leaving it orphaned and never
        // auto-completed by the resulting design's approval.
        taskCategory: 'design',
        briefDescription: `Allot this task to a social media team member or take it up yourself to create and post recap/highlight content for "${e.title}". Submit the design asset here once ready.`,
      });
      created++;
    }
    return next;
  });

  // Only notify the heads, never the general student body or whole committee
  for (const e of toCreate) {
    const eventEnd = e.endDate || e.startDate;
    for (const member of pool) {
      if (!member.email) continue;
      await enqueueTaskEmailNotification({
        id: `task_event_social_${e.id}`,
        title: `Social media posts required for "${e.title}" (event concluded ${eventEnd})`,
        event: e.title,
        dueDate: today,
        creatorName: 'Event Scheduler',
        assigneeEmail: member.email,
        assigneeName: member.name,
      });
    }
  }

  return { created };
}

/**
 * Auto-generated tasks are ONLY allowed after the day the event is done, never before it.
 * Pre-event poster auto-creation is deliberately disabled.
 */
export async function runEventPosterTasks(): Promise<{ created: number }> {
  return { created: 0 };
}

function msUntilNextMidnight(): number {
  const now = new Date();
  // A few seconds past midnight, so the check reliably lands on the new day.
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 15, 0);
  return next.getTime() - now.getTime();
}

/**
 * Starts the in-process daily event-lapse scheduler. Registered once from
 * instrumentation.ts at server boot. Auto-generated tasks only run after the
 * day an event concludes.
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
