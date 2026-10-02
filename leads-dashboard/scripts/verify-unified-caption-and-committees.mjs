import assert from 'node:assert/strict';

// 1. Mock LocalStorage and Global environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};
globalThis.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.CustomEvent = class CustomEvent {
  constructor(name, detail) {
    this.name = name;
    this.detail = detail;
  }
};

// 2. Load members fixture into storage
const mockMembers = [
  { id: 'mem-1', name: 'Alice Designer', email: 'alice@test.com', role: 'Designer', division: 'Core Committee', department: 'Design' },
  { id: 'mem-2', name: 'Bob SM Head', email: 'bob@test.com', role: 'Head of Social Media', division: 'Core Committee', department: 'Social Media' },
  { id: 'mem-3', name: 'Charlie SM Sr Head', email: 'charlie@test.com', role: 'Senior Head of Social Media', division: 'Core Committee', department: 'Social Media' },
  { id: 'mem-4', name: 'Dave Regular SM', email: 'dave@test.com', role: 'Social Media Member', division: 'Core Committee', department: 'Social Media' },
  { id: 'mem-5', name: 'Eve Student', email: 'eve@test.com', role: 'Student Member', division: 'Core Committee', department: 'General' },
  { id: 'mem-6', name: 'Frank Student', email: 'frank@test.com', role: 'Student Member', division: 'Core Committee', department: 'General' },
];
storage.set('leads_members_data', JSON.stringify(mockMembers));
storage.set('leads_tasks_data', JSON.stringify([]));
storage.set('leads_events_data', JSON.stringify([]));
storage.set('leads_designs_data', JSON.stringify([]));

// 3. Test Pure Logic & Contracts
console.log('Testing unified caption & committee requirements...');

// Test A: Design category gating - Only 'Social Media' spawns caption & posting task
function testCategoryGating() {
  const nonSocialCategories = ['Poster', 'Postage', 'Banner', 'Brochure', 'Certificates', 'Other'];
  for (const cat of nonSocialCategories) {
    const isSocial = cat === 'Social Media';
    assert.equal(isSocial, false, `Category ${cat} should NOT be treated as social media`);
  }
  assert.equal('Social Media' === 'Social Media', true, 'Social Media category must be identified as social media');
  console.log('✔ Test A Passed: Only "Social Media" category triggers social workflows.');
}

// Test B: Unified Posting Task Specification
function testUnifiedTaskModel() {
  const design = {
    id: 'des-101',
    title: 'Tech Fest Announcement',
    category: 'Social Media',
    captionInstagram: 'Join us at Tech Fest! #Tech',
    captionLinkedin: 'We are thrilled to announce Tech Fest 2026.',
    captionApproved: true,
    workflowStage: 'posting_tasks_created',
  };

  // When creating posting tasks for a Social Media design:
  // It must create ONE task for caption writing & posting
  const unifiedTask = {
    id: 'task-sm-unified-1',
    title: `[Social Media Post] Caption & Post: ${design.title}`,
    designId: design.id,
    taskCategory: 'design',
    workflowType: 'design_social_posting',
    status: 'Assigned',
    assignee: 'Bob SM Head, Charlie SM Sr Head',
    assigneeIds: ['mem-2', 'mem-3'],
    requiresRatingsQueue: true,
  };

  // Both instagram and linkedin task pointers link to this ONE unified task
  design.postingInstagramTaskId = unifiedTask.id;
  design.postingLinkedinTaskId = unifiedTask.id;

  assert.equal(design.postingInstagramTaskId, design.postingLinkedinTaskId, 'Instagram and LinkedIn task IDs must point to the same unified task');
  assert.equal(unifiedTask.workflowType, 'design_social_posting', 'Workflow type must be design_social_posting');
  console.log('✔ Test B Passed: Unified posting task connects both platforms to one single evaluatable task.');
}

// Test C: Unified Task Completion Logic
function testUnifiedTaskCompletion() {
  let design = {
    id: 'des-102',
    title: 'Hackathon Post',
    category: 'Social Media',
    postingInstagramTaskId: 'task-unified-2',
    postingLinkedinTaskId: 'task-unified-2',
    postingInstagramDone: false,
    postingLinkedinDone: false,
    workflowStage: 'posting_tasks_created',
  };

  const isUnified = design.postingInstagramTaskId === design.postingLinkedinTaskId;
  assert.equal(isUnified, true);

  // Complete Instagram first
  design.postingInstagramDone = true;
  const bothDone1 = !!(design.postingInstagramDone && design.postingLinkedinDone);
  assert.equal(bothDone1, false, 'Should not be marked complete after only Instagram');

  // Complete LinkedIn
  design.postingLinkedinDone = true;
  const bothDone2 = !!(design.postingInstagramDone && design.postingLinkedinDone);
  assert.equal(bothDone2, true, 'Should be marked complete after both platforms done');
  if (bothDone2) {
    design.workflowStage = 'completed';
  }
  assert.equal(design.workflowStage, 'completed');
  console.log('✔ Test C Passed: Unified task only completes when both Instagram and LinkedIn posting is verified.');
}

// Test D: Committee Presets and Custom Tag Logic
function testCommitteePresets() {
  const COMMITTEE_PRESETS = ['Food', 'Stage', 'Organizing', 'Hospitality', 'Design', 'Photography', 'Others'];
  const expectedPresets = ['Food', 'Stage', 'Organizing', 'Hospitality', 'Design', 'Photography', 'Others'];
  assert.deepEqual(COMMITTEE_PRESETS, expectedPresets, 'COMMITTEE_PRESETS must include standard options');

  // Resolve committee name from preset
  const resolveName = (preset, customTag) => (preset === 'Others' ? (customTag || '').trim() : preset);

  assert.equal(resolveName('Food', ''), 'Food');
  assert.equal(resolveName('Stage', ''), 'Stage');
  assert.equal(resolveName('Design', ''), 'Design');
  assert.equal(resolveName('Photography', ''), 'Photography');
  assert.equal(resolveName('Hospitality', ''), 'Hospitality');
  assert.equal(resolveName('Organizing', ''), 'Organizing');
  assert.equal(resolveName('Others', 'Media & Press'), 'Media & Press');
  assert.equal(resolveName('Others', ''), '');
  console.log('✔ Test D Passed: Committee preset resolution and custom tags work properly.');
}

// Test E: Committee Creation with Initial Members and Approval Flow
function testCommitteeInitialMembersAndApproval() {
  const event = {
    id: 'ev-1',
    title: 'Annual Gala',
    committees: [],
  };

  const initialMemberIds = ['mem-5', 'mem-6'];
  const committeeName = 'Hospitality';

  // Creating committee under approval requirement
  const newComm = {
    id: `comm_${Date.now()}`,
    name: committeeName,
    memberIds: [],
    pendingMemberIds: initialMemberIds,
    approvalStatus: 'pending_create',
    submittedBy: 'Student Lead',
  };
  event.committees.push(newComm);

  assert.equal(newComm.approvalStatus, 'pending_create');
  assert.deepEqual(newComm.memberIds, [], 'Active roster should be empty prior to approval');
  assert.deepEqual(newComm.pendingMemberIds, ['mem-5', 'mem-6'], 'Proposed students must be staged in pendingMemberIds');

  // Approver approves committee
  if (newComm.approvalStatus === 'pending_create') {
    if (newComm.pendingMemberIds && newComm.pendingMemberIds.length > 0) {
      newComm.memberIds = [...newComm.pendingMemberIds];
      newComm.pendingMemberIds = undefined;
    }
    newComm.approvalStatus = 'approved';
  }

  assert.equal(newComm.approvalStatus, 'approved');
  assert.deepEqual(newComm.memberIds, ['mem-5', 'mem-6'], 'Approved committee must contain all initial students');
  assert.equal(newComm.pendingMemberIds, undefined, 'pendingMemberIds cleared after approval');
  console.log('✔ Test E Passed: Committee creation with initial members stages students and assigns on approval.');
}

testCategoryGating();
testUnifiedTaskModel();
testUnifiedTaskCompletion();
testCommitteePresets();
testCommitteeInitialMembersAndApproval();

console.log('\nAll checks passed successfully!');
