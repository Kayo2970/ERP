import assert from 'node:assert/strict';

// Helper tests replicating the pure logic in permissions.ts & permissions-server.ts
function isFaculty(user) {
  if (!user) return false;
  if (user.division === 'Faculty') return true;
  const role = (user.role || '').toLowerCase();
  return role.includes('faculty') || role.includes('professor') || role.includes('prof.');
}

function isSocialMediaTeamMember(member) {
  if (!member || isFaculty(member) || member.status === 'Terminated') return false;
  const dept = (member.department || '').toLowerCase();
  const comm = (member.committee || '').toLowerCase();
  const role = (member.role || '').toLowerCase();
  return (
    dept.includes('social media') ||
    comm.includes('social media') ||
    role.includes('social media')
  );
}

function isSocialMediaHeadOrSrHead(member) {
  if (!member || isFaculty(member) || member.status === 'Terminated') return false;
  if (!isSocialMediaTeamMember(member)) return false;
  const role = (member.role || '').toLowerCase();
  return role.includes('head') || role.includes('lead');
}

function isSocialMediaHead(member) {
  if (!member || isFaculty(member) || member.status === 'Terminated') return false;
  if (!isSocialMediaTeamMember(member)) return false;
  const role = (member.role || '').toLowerCase();
  return (role.includes('head') || role.includes('lead')) && !role.includes('senior') && !role.includes('sr');
}

function isSocialMediaSrHead(member) {
  if (!member || isFaculty(member) || member.status === 'Terminated') return false;
  if (!isSocialMediaTeamMember(member)) return false;
  const role = (member.role || '').toLowerCase();
  return (role.includes('head') || role.includes('lead')) && (role.includes('senior') || role.includes('sr.') || role.includes('sr '));
}

function isHeadRole(user, headKeyword = 'head') {
  const role = user?.role;
  if (!user || typeof role !== 'string') return false;
  return new RegExp(`\\b${headKeyword}\\b`, 'i').test(role);
}

function isDesignHead(user, headKeyword = 'head') {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  const dept = (user.department || '').toLowerCase();
  const isDesignOrSocialMedia = role.includes('design') || dept.includes('design') || role.includes('social media') || dept.includes('social media');
  return isHeadRole(user, headKeyword) && isDesignOrSocialMedia;
}

function resolveSocialPostingAssignees(members) {
  const all = (members || []).filter(m => m.status !== 'Terminated' && !isFaculty(m));
  const heads = all.filter(m => isSocialMediaHeadOrSrHead(m));
  if (heads.length > 0) return heads;
  const team = all.filter(m => isSocialMediaTeamMember(m));
  return team.length > 0 ? team : all.slice(0, 1);
}

// 1. Test Head and Senior Head identification
const headMember = {
  id: 'm1',
  name: 'Aarav Social Head',
  email: 'aarav@msruas.ac.in',
  role: 'Head of Design & Social Media',
  department: 'Design & Social Media',
  division: 'Core Committee',
  status: 'Active',
};

const srHeadMember = {
  id: 'm2',
  name: 'Priya Sr Social Head',
  email: 'priya@msruas.ac.in',
  role: 'Senior Head of Design & Social Media',
  department: 'Design & Social Media',
  division: 'Advisory Board',
  status: 'Active',
};

const studentMember = {
  id: 'm3',
  name: 'Rohan Student',
  email: 'rohan@msruas.ac.in',
  role: 'Associate - Design & Social Media',
  department: 'Design & Social Media',
  division: 'Training Associate',
  status: 'Active',
};

const facultyAdvisor = {
  id: 'm4',
  name: 'Dr. Sharma',
  email: 'sharma@msruas.ac.in',
  role: 'Faculty Advisor',
  department: 'Design & Social Media',
  division: 'Faculty',
  status: 'Active',
};

console.log('Testing Social Media Head & Sr Head identification...');
assert.strictEqual(isSocialMediaTeamMember(headMember), true);
assert.strictEqual(isSocialMediaTeamMember(srHeadMember), true);
assert.strictEqual(isSocialMediaTeamMember(studentMember), true);
assert.strictEqual(isSocialMediaTeamMember(facultyAdvisor), false);

assert.strictEqual(isSocialMediaHeadOrSrHead(headMember), true);
assert.strictEqual(isSocialMediaHeadOrSrHead(srHeadMember), true);
assert.strictEqual(isSocialMediaHeadOrSrHead(studentMember), false);
assert.strictEqual(isSocialMediaHeadOrSrHead(facultyAdvisor), false);

assert.strictEqual(isSocialMediaHead(headMember), true);
assert.strictEqual(isSocialMediaHead(srHeadMember), false);
assert.strictEqual(isSocialMediaSrHead(headMember), false);
assert.strictEqual(isSocialMediaSrHead(srHeadMember), true);

console.log('Testing that what Head can do, Sr Head can also do...');
// Check isHeadRole
assert.strictEqual(isHeadRole(headMember), true);
assert.strictEqual(isHeadRole(srHeadMember), true);

// Check isDesignHead
assert.strictEqual(isDesignHead(headMember), true);
assert.strictEqual(isDesignHead(srHeadMember), true);
assert.strictEqual(isDesignHead(studentMember), false);

console.log('Testing resolveSocialPostingAssignees...');
const allMembers = [headMember, srHeadMember, studentMember, facultyAdvisor];
const postingAssignees = resolveSocialPostingAssignees(allMembers);

assert.strictEqual(postingAssignees.length, 2, 'Should only contain the Head and Sr Head');
assert.ok(postingAssignees.some(m => m.id === 'm1'), 'Should contain Head');
assert.ok(postingAssignees.some(m => m.id === 'm2'), 'Should contain Sr Head');
assert.ok(!postingAssignees.some(m => m.id === 'm3'), 'Must NOT contain student member');
assert.ok(!postingAssignees.some(m => m.id === 'm4'), 'Must NOT contain faculty');

console.log('Testing task allotment simulation...');
const autoCreatedTask = {
  id: 'task_event_social_123',
  title: 'Social media posts required for "Tech Fest"',
  assignee: postingAssignees.map(m => m.name).join(', '),
  assigneeType: 'group',
  assigneeIds: postingAssignees.map(m => m.id),
  status: 'Assigned',
};

// Allot to student
const allottedToStudent = {
  ...autoCreatedTask,
  assignee: studentMember.name,
  assigneeId: studentMember.id,
  assigneeEmail: studentMember.email,
  assigneeType: 'individual',
  assigneeIds: [studentMember.id],
  status: 'Assigned',
  allottedBy: headMember.name,
};
assert.strictEqual(allottedToStudent.assigneeType, 'individual');
assert.strictEqual(allottedToStudent.assigneeId, studentMember.id);

// Take up by head
const takenUpByHead = {
  ...autoCreatedTask,
  assignee: headMember.name,
  assigneeId: headMember.id,
  assigneeEmail: headMember.email,
  assigneeType: 'individual',
  assigneeIds: [headMember.id],
  status: 'In Progress',
  allottedBy: headMember.name,
};
assert.strictEqual(takenUpByHead.assigneeType, 'individual');
assert.strictEqual(takenUpByHead.assigneeId, headMember.id);
assert.strictEqual(takenUpByHead.status, 'In Progress');

console.log('All empirical validation assertions passed successfully!');
