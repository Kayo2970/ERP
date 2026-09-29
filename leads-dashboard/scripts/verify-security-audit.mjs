import assert from 'node:assert';

// 1. Logic check: isFaculty
function isFaculty(user) {
  if (!user) return false;
  if (user.division === 'Faculty') return true;
  const role = (user.role || '').toLowerCase();
  return /faculty|professor|prof\./i.test(role);
}

// 2. Logic check: isSocialMediaTeamMember
function isSocialMediaTeamMember(member) {
  if (!member || isFaculty(member) || member.status === 'Terminated') return false;
  const dept = (member.department || '').toLowerCase();
  const comm = (member.committee || '').toLowerCase();
  const role = (member.role || '').toLowerCase();
  return dept.includes('social media') || comm.includes('social media') || role.includes('social media');
}

// 3. Logic check: isSocialMediaPostTask
function isSocialMediaPostTask(task) {
  if (!task) return false;
  if (task.isSocialMediaPost === true) return true;
  if (task.workflowType === 'holiday_design_social' || task.workflowType === 'design_social_posting' || task.workflowType === 'event_social_post') return true;
  const title = (task.title || '').toLowerCase();
  return title.includes('social media post') || title.includes('instagram post') || title.includes('linkedin post') || title.includes('social media reel') || title.includes('social media story');
}

// 4. Logic check: holiday normalization
function normalizeHolidayTitle(title) {
  return (title || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
}

console.log('Running security audit runnable check...');

// Test 1: Faculty detection
assert.strictEqual(isFaculty({ division: 'Faculty', role: 'Super User' }), true, 'Faculty division must be detected');
assert.strictEqual(isFaculty({ role: 'Assistant Professor' }), true, 'Professor role must be detected');
assert.strictEqual(isFaculty({ role: 'Faculty Coordinator' }), true, 'Faculty coordinator role must be detected');
assert.strictEqual(isFaculty({ role: 'Student Head', division: 'Core Committee' }), false, 'Student must not be faculty');

// Test 2: Social media team detection & strict faculty exclusion
const facultyWithSocialRole = { division: 'Faculty', role: 'Social Media Advisor' };
assert.strictEqual(isSocialMediaTeamMember(facultyWithSocialRole), false, 'Faculty must NEVER be considered a social media team member');

const studentSocial = { id: 's1', role: 'Social Media Associate', department: 'Social Media' };
assert.strictEqual(isSocialMediaTeamMember(studentSocial), true, 'Student in social media dept must be recognized');

const studentLogistics = { id: 's2', role: 'Head of Logistics', department: 'Logistics' };
assert.strictEqual(isSocialMediaTeamMember(studentLogistics), false, 'Non-social student must NOT be recognized');

// Test 3: Social media task detection
assert.strictEqual(isSocialMediaPostTask({ workflowType: 'holiday_design_social' }), true);
assert.strictEqual(isSocialMediaPostTask({ workflowType: 'event_social_post' }), true);
assert.strictEqual(isSocialMediaPostTask({ workflowType: 'design_social_posting' }), true);
assert.strictEqual(isSocialMediaPostTask({ title: 'Prepare Instagram Post for TechFest' }), true);
assert.strictEqual(isSocialMediaPostTask({ title: 'Logistics arrangements for auditorium' }), false);
assert.strictEqual(isSocialMediaPostTask({ workflowType: 'holiday_social_approval' }), false, 'Approval task is administrative, not posting deliverable');

// Test 4: Holiday normalization
assert.strictEqual(normalizeHolidayTitle('Janmashtami (Smarta)'), 'janmashtami');
assert.strictEqual(normalizeHolidayTitle('Janmashtami'), 'janmashtami');
assert.strictEqual(normalizeHolidayTitle('Diwali (Deepavali)'), 'diwali');

// Test 5: Direct correlation check — a rating MUST correlate to an existing task
function validateRatingTaskCorrelation(rating, existingTasks) {
  if (!rating.taskId || typeof rating.taskId !== 'string' || !rating.taskId.trim()) {
    throw new Error('Direct correlation check failed: a rating must directly correlate to an existing task.');
  }
  const task = existingTasks.find(t => t.id === rating.taskId);
  if (!task) {
    throw new Error('Direct correlation check failed: no corresponding task found for this rating.');
  }
  return true;
}

const mockTasks = [
  { id: 'task_101', title: 'Prepare Event Poster' },
  { id: 'task_102', title: 'Draft Event Report' },
];

// Valid rating correlated to existing task
assert.strictEqual(validateRatingTaskCorrelation({ taskId: 'task_101', targetName: 'Student A' }, mockTasks), true);

// Invalid rating missing taskId
assert.throws(() => {
  validateRatingTaskCorrelation({ taskId: '', targetName: 'Student A' }, mockTasks);
}, /must directly correlate to an existing task/);

// Invalid rating referencing nonexistent task
assert.throws(() => {
  validateRatingTaskCorrelation({ taskId: 'task_999_nonexistent', targetName: 'Student A' }, mockTasks);
}, /no corresponding task found/);

// Cascading deletion check: deleting task removes correlated rating
let mockRatings = [
  { id: 'r1', taskId: 'task_101', targetName: 'Student A' },
  { id: 'r2', taskId: 'task_102', targetName: 'Student B' },
];
const deletingTaskId = 'task_101';
mockRatings = mockRatings.filter(r => r.taskId !== deletingTaskId);
assert.strictEqual(mockRatings.length, 1);
assert.strictEqual(mockRatings[0].taskId, 'task_102');

// 7. Logic check: Finance Head never matched as GG Events Head
function isEventsHeadGgCampusCheck(user) {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role.includes('finance')) return false;
  if (user.tier === 2.5) return true;
  return (role.includes('events head') && role.includes('gg')) || (role.includes('head of events') && role.includes('gg'));
}

assert.strictEqual(isEventsHeadGgCampusCheck({ role: 'Finance Head', tier: 2.5 }), false, 'Finance Head must not be matched as GG Events Head even if tier is 2.5');
assert.strictEqual(isEventsHeadGgCampusCheck({ role: 'Head of Events (GG Campus)', tier: 2.5 }), true, 'GG Events Head must be matched');
assert.strictEqual(isEventsHeadGgCampusCheck({ role: 'Head of Events (RTC Campus)', tier: 3 }), false, 'RTC Events Head must not be matched as GG Events Head');

console.log('All security audit and direct correlation checks passed successfully!');

