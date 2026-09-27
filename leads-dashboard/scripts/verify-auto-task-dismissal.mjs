import assert from 'node:assert/strict';

// Test pure filtering logic directly mirroring event-social-scheduler and holiday-scheduler

function filterPosterTasks(events, systemSettingsList, designs, tasks) {
  const dismissedSet = new Set(systemSettingsList?.[0]?.dismissedAutoTaskIds || []);
  const eventsWithDesigns = new Set((designs || []).filter(d => d.eventId).map(d => d.eventId));
  const alreadyCreated = new Set(
    (tasks || []).filter(t => t.workflowType === 'event_poster_request').map(t => t.eventId)
  );

  const approvedDatedEvents = events.filter(e =>
    !e.isHoliday &&
    !e.datesTBD &&
    !e.posterTaskDismissed &&
    !e.dismissedAutoTaskTypes?.includes('event_poster_request') &&
    !dismissedSet.has(`task_event_poster_${e.id}`) &&
    !dismissedSet.has(`event_poster_request_${e.id}`) &&
    !dismissedSet.has(e.id) &&
    !eventsWithDesigns.has(e.id) &&
    typeof e.startDate === 'string' && e.startDate.length > 0 &&
    e.approvalStatus !== 'pending_create' && e.approvalStatus !== 'rejected' && e.approvalStatus !== 'pending_delete'
  );

  return approvedDatedEvents.filter(e => !alreadyCreated.has(e.id));
}

function filterLapseSocialTasks(events, systemSettingsList, tasks, today) {
  const dismissedSet = new Set(systemSettingsList?.[0]?.dismissedAutoTaskIds || []);
  const alreadyCreated = new Set(
    (tasks || []).filter(t => t.workflowType === 'event_social_post').map(t => t.eventId)
  );

  const lapsedEvents = events.filter(e =>
    !e.isHoliday &&
    !e.datesTBD &&
    !e.socialTaskDismissed &&
    !e.dismissedAutoTaskTypes?.includes('event_social_post') &&
    !dismissedSet.has(`task_event_social_${e.id}`) &&
    !dismissedSet.has(`event_social_post_${e.id}`) &&
    !dismissedSet.has(e.id) &&
    typeof e.endDate === 'string' && e.endDate.length > 0 && e.endDate < today &&
    e.approvalStatus !== 'pending_create' && e.approvalStatus !== 'rejected' && e.approvalStatus !== 'pending_delete'
  );

  return lapsedEvents.filter(e => !alreadyCreated.has(e.id));
}

function filterHolidayApprovalTasks(events, systemSettingsList, tasks, today, windowEnd) {
  const dismissedSet = new Set(systemSettingsList?.[0]?.dismissedAutoTaskIds || []);
  const alreadyAskedEventIds = new Set(
    (tasks || []).filter(t => t.workflowType === 'holiday_social_approval').map(t => t.eventId)
  );

  const upcomingHolidays = events.filter(e =>
    e.isHoliday &&
    !e.socialTaskDismissed &&
    !e.dismissedAutoTaskTypes?.includes('holiday_social_approval') &&
    !dismissedSet.has(`task_holiday_approval_${e.id}`) &&
    !dismissedSet.has(`holiday_social_approval_${e.id}`) &&
    !dismissedSet.has(e.id) &&
    e.startDate >= today && e.startDate <= windowEnd
  );

  return upcomingHolidays.filter(h => !alreadyAskedEventIds.has(h.id));
}

console.log('Running Auto-Task Dismissal Unit Checks...');

// Case 1: Normal active event gets poster task
const normalEvent = {
  id: 'ev_1',
  title: 'Annual Fest',
  startDate: '2026-10-15',
  endDate: '2026-10-17',
  status: 'planned',
  approvalStatus: 'approved',
};

let toCreate = filterPosterTasks([normalEvent], [{ id: 'default', dismissedAutoTaskIds: [] }], [], []);
assert.equal(toCreate.length, 1, 'Normal event should generate a poster task');

// Case 2: Event with posterTaskDismissed set must NOT get poster task
const dismissedPosterEvent = {
  ...normalEvent,
  id: 'ev_2',
  posterTaskDismissed: true,
};
toCreate = filterPosterTasks([dismissedPosterEvent], [{ id: 'default', dismissedAutoTaskIds: [] }], [], []);
assert.equal(toCreate.length, 0, 'Event with posterTaskDismissed must NOT generate poster task');

// Case 3: Event in systemSettings.dismissedAutoTaskIds must NOT get poster task
const dismissedViaSettingsEvent = {
  ...normalEvent,
  id: 'ev_3',
};
toCreate = filterPosterTasks(
  [dismissedViaSettingsEvent],
  [{ id: 'default', dismissedAutoTaskIds: ['ev_3'] }],
  [],
  []
);
assert.equal(toCreate.length, 0, 'Event in dismissedAutoTaskIds must NOT generate poster task');

// Case 4: Event whose specific task ID is in dismissedAutoTaskIds must NOT get poster task
const dismissedViaTaskId = {
  ...normalEvent,
  id: 'ev_4',
};
toCreate = filterPosterTasks(
  [dismissedViaTaskId],
  [{ id: 'default', dismissedAutoTaskIds: ['task_event_poster_ev_4'] }],
  [],
  []
);
assert.equal(toCreate.length, 0, 'Event with task_event_poster_ev_4 in dismissedAutoTaskIds must NOT generate poster task');

// Case 5: Event with existing design asset must NOT get poster task
const eventWithDesign = {
  ...normalEvent,
  id: 'ev_5',
};
toCreate = filterPosterTasks(
  [eventWithDesign],
  [{ id: 'default', dismissedAutoTaskIds: [] }],
  [{ id: 'd_1', eventId: 'ev_5', title: 'Fest Poster' }],
  []
);
assert.equal(toCreate.length, 0, 'Event with existing design must NOT generate poster task');

// Case 6: Lapsed event dismissal check
const lapsedEvent = {
  id: 'ev_6',
  title: 'Past Workshop',
  startDate: '2026-09-01',
  endDate: '2026-09-02',
  status: 'completed',
  approvalStatus: 'approved',
  socialTaskDismissed: true,
};
const lapsedToCreate = filterLapseSocialTasks(
  [lapsedEvent],
  [{ id: 'default', dismissedAutoTaskIds: [] }],
  [],
  '2026-09-27'
);
assert.equal(lapsedToCreate.length, 0, 'Lapsed event with socialTaskDismissed must NOT generate social task');

// Case 7: Holiday dismissal check
const holidayEvent = {
  id: 'holiday_2026-10-02_gandhi-jayanti',
  title: 'Mahatma Gandhi Jayanti',
  startDate: '2026-10-02',
  endDate: '2026-10-02',
  isHoliday: true,
  approvalStatus: 'approved',
};
const holidayToCreateDismissed = filterHolidayApprovalTasks(
  [{ ...holidayEvent, socialTaskDismissed: true }],
  [{ id: 'default', dismissedAutoTaskIds: [] }],
  [],
  '2026-09-27',
  '2026-10-04'
);
assert.equal(holidayToCreateDismissed.length, 0, 'Holiday with socialTaskDismissed must NOT generate approval task');

const holidayToCreateSettings = filterHolidayApprovalTasks(
  [holidayEvent],
  [{ id: 'default', dismissedAutoTaskIds: ['holiday_2026-10-02_gandhi-jayanti'] }],
  [],
  '2026-09-27',
  '2026-10-04'
);
assert.equal(holidayToCreateSettings.length, 0, 'Holiday in dismissedAutoTaskIds must NOT generate approval task');

console.log('All Auto-Task Dismissal Unit Checks passed successfully!');
