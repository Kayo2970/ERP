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

console.log('All security audit checks passed successfully!');
