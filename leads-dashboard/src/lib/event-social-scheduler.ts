import { readCollection, mutateCollection } from './server-db';
import { enqueueTaskEmailNotification } from './task-email-queue';

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
        // Flag this as a real Design Task, not a general one, so it shows
        // up in the Design Portal's "Design Task Requests" queue — without
        // this, a design submitted against it had no way to reference this
        // task (no sourceTaskId), leaving it orphaned and never
        // auto-completed by the resulting design's approval.
        taskCategory: 'design',
        briefDescription: `Create and post recap/highlight content for "${e.title}" on social media. Submit the design asset here once ready.`,
      });
      created++;
    }
    return next;
  });

  // This scheduler writes straight to the tasks collection via
  // mutateCollection — unlike a task created through POST /api/tasks (the
  // normal Tasks page flow), which enqueues the debounced assignment email
  // itself, so that never happens here on its own. Enqueue it explicitly
  // for every pool member on every newly-created event-lapse task, same as
  // a manually-assigned task would get.
  for (const e of toCreate) {
    for (const member of pool) {
      if (!member.email) continue;
      await enqueueTaskEmailNotification({
        id: `task_event_social_${e.id}`,
        title: `Social media posts required for "${e.title}" (event concluded ${e.endDate})`,
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
 * For every approved, dated (non-TBD), non-holiday event that doesn't
 * already have one, creates a single INDIVIDUAL poster/social-media-assets
 * task — assigned to whoever currently holds the Head of Design / Social
 * Media Head role (falling back to a Senior Head, then any tier<=2 leader,
 * so it's never left orphaned). Deliberately an individual task, not a
 * group/committee one: unlike event_social_post (post-event recap,
 * assigned to a whole pool so anyone can pick it up), this is pre-event
 * prep work with one clear owner. Due the event's start date — poster work
 * needs to be done BEFORE the event, not once it's already underway.
 *
 * Every operation here is idempotent (a deterministic task id per event,
 * `task_event_poster_${event.id}`), so re-running this on every boot and
 * every day is always safe and never creates a duplicate. Skips events
 * still pending/rejected approval — an event that never got approved
 * shouldn't have prep work assigned against it.
 */
export async function runEventPosterTasks(): Promise<{ created: number }> {
  const events = await readCollection<any>('events');

  const approvedDatedEvents = events.filter((e: any) =>
    !e.isHoliday &&
    !e.datesTBD &&
    typeof e.startDate === 'string' && e.startDate.length > 0 &&
    e.approvalStatus !== 'pending_create' && e.approvalStatus !== 'rejected' && e.approvalStatus !== 'pending_delete'
  );
  if (approvedDatedEvents.length === 0) return { created: 0 };

  const tasks = await readCollection<any>('tasks');
  const alreadyCreated = new Set(
    tasks.filter((t: any) => t.workflowType === 'event_poster_request').map((t: any) => t.eventId)
  );
  const toCreate = approvedDatedEvents.filter((e: any) => !alreadyCreated.has(e.id));
  if (toCreate.length === 0) return { created: 0 };

  const members = await readCollection<any>('members');
  const activeMembers = members.filter((m: any) => m.status !== 'Terminated' && m.email);
  // Same role-matching rule as resolveSocialPostingAssignees in local-data.ts,
  // but this scheduler works off raw server collections rather than the
  // client-side getMembers() that helper reads from, so it's re-expressed
  // here — kept in sync by hand if that matching rule ever changes.
  let pool = activeMembers.filter((m: any) => {
    const role = (m.role || '').toLowerCase();
    const isDesignOrSocialMediaHead = role.includes('design head')
      || role.includes('social media head')
      || (role.includes('design') && role.includes('social media') && role.includes('head'));
    const isSeniorHead = role.includes('senior') && role.includes('head');
    return isDesignOrSocialMediaHead || isSeniorHead;
  });
  if (pool.length === 0) pool = activeMembers.filter((m: any) => m.tier <= 2);
  if (pool.length === 0) return { created: 0 }; // no one at all to assign to — nothing safe to create

  // One individual owner, not a group — the first match is deterministic
  // across repeated runs as long as the roster doesn't change in between.
  const assignee = pool[0];

  let created = 0;
  await mutateCollection<any>('tasks', (current) => {
    const next = [...current];
    for (const e of toCreate) {
      const id = `task_event_poster_${e.id}`;
      if (next.some((t: any) => t.id === id)) continue;
      next.unshift({
        id,
        title: `Design poster / social media assets for "${e.title}"`,
        event: e.title,
        eventId: e.id,
        assignee: assignee.name,
        assigneeId: assignee.id,
        assigneeEmail: assignee.email,
        assigneeType: 'individual',
        dueDate: e.startDate,
        status: 'Assigned',
        creatorName: 'Event Scheduler',
        workflowType: 'event_poster_request',
        // Flags this as a real Design Task so it shows up in the Design
        // Portal's "Design Task Requests" queue, same as event_social_post.
        taskCategory: 'design',
        briefDescription: `Create the poster and any other promotional/social media assets for "${e.title}". Submit the design asset here once ready.`,
      });
      created++;
    }
    return next;
  });

  for (const e of toCreate) {
    if (!assignee.email) continue;
    await enqueueTaskEmailNotification({
      id: `task_event_poster_${e.id}`,
      title: `Design poster / social media assets for "${e.title}"`,
      event: e.title,
      dueDate: e.startDate,
      creatorName: 'Event Scheduler',
      assigneeEmail: assignee.email,
      assigneeName: assignee.name,
    });
  }

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
  runEventPosterTasks().catch((err) => console.error('[event-social-scheduler] Poster-task startup catch-up check failed:', err));

  setTimeout(() => {
    runEventLapseSocialTasks().catch((err) => console.error('[event-social-scheduler] Midnight check failed:', err));
    runEventPosterTasks().catch((err) => console.error('[event-social-scheduler] Poster-task midnight check failed:', err));
    setInterval(() => {
      runEventLapseSocialTasks().catch((err) => console.error('[event-social-scheduler] Daily check failed:', err));
      runEventPosterTasks().catch((err) => console.error('[event-social-scheduler] Poster-task daily check failed:', err));
    }, DAY_MS);
  }, msUntilNextMidnight());
}
