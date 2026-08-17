export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: number;
  committee: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  committee: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  createdBy?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  event?: string;
  eventId?: string;
  assignee: string;
  assigneeEmail?: string;
  assigneeType: 'individual' | 'committee';
  dueDate: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Pending Extension';
  creatorName?: string;
  extensionReason?: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface RatingItem {
  id: string;
  targetType: 'individual' | 'committee';
  targetName: string;
  targetId: string; // Member ID or Committee Name
  raterName: string;
  quality: number;
  timeliness: number;
  initiative: number;
  collaboration: number;
  overallScore: number;
  notes?: string;
  quarter?: string; // e.g. "2026-Q3"
  createdAt: string;
  updatedAt?: string;
}

export interface ReimbursementItem {
  id: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  category: string;
  description: string;
  receiptUrl?: string;
  receiptData?: string; // Base64 data URL for preview/persistence
  status: 'Pending' | 'Under Review' | 'Approved' | 'Denied';
  bankDetails: string;
  submittedAt: string;
  firstPassReviewer?: string;
  finalApprover?: string;
  decidedAt?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  scope: string; // 'All Members' | 'Executive Council' | 'Advisory Board' | specific committee
  authorName: string;
  publishedAt: string;
  editedAt?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'number';
  options?: string[];
  required: boolean;
}

export interface PublicFormItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  fields: FormField[];
  committee: string;
  createdBy: string;
  createdAt: string;
  isSample?: boolean;
  status: 'active' | 'archived';
}

export interface FormSubmissionItem {
  id: string;
  formId: string;
  slug: string;
  data: Record<string, any>;
  submittedAt: string;
  isSample?: boolean;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorName: string;
  actorEmail: string;
  target?: string;
  details: string;
  timestamp: string;
}

const initialCommittees = [
  'Executive Council', 
  'Senior Student Leadership', 
  'Organizing Committee', 
  'Food & Catering Committee', 
  'Logistics & Stage Committee', 
  'Public Relations Committee', 
  'Finance Committee'
];

// Initial mock data matching leadership website and dashboard requirements
const initialMembers: Member[] = [
  { id: 'm1', name: 'Kayomarz Pavri', email: 'kayomarz.pavri@msruas.ac.in', role: 'Super User', tier: 1, committee: 'All Committees' },
  { id: 'm2', name: 'Dr. Subhadeep Mukherjee', email: 'subhadeep.mukherjee@msruas.ac.in', role: 'Centre Head', tier: 2, committee: 'Executive Council' },
  { id: 'm3', name: 'Dr. Kiran Kumar B M', email: 'kiran.kumar@msruas.ac.in', role: 'Head of Events', tier: 3, committee: 'Executive Council' },
  { id: 'm4', name: 'Dr. K. M. Sharath Kumar', email: 'sharath.kumar@msruas.ac.in', role: 'Advisory Board', tier: 4, committee: 'Executive Council' },
  { id: 'm5', name: 'Gurutejas C', email: 'gurutejas.c@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Senior Student Leadership' },
  { id: 'm6', name: 'Kunal Bhadauria', email: 'kunal.bhadauria@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Organizing Committee' },
  { id: 'm7', name: 'Dr. Hari Krishna S', email: 'hari.krishna@msruas.ac.in', role: 'Advisory Board', tier: 4, committee: 'Executive Council' },
  { id: 'm8', name: 'Keerthan J', email: 'keerthan.j@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm9', name: 'Dr. Kuldeep Kumar Raina', email: 'kuldeep.raina@msruas.ac.in', role: 'Centre Head', tier: 2, committee: 'Executive Council' },
  { id: 'm10', name: 'Dr. Pallabi Mund', email: 'pallabi.mund@msruas.ac.in', role: 'Head of Events', tier: 3, committee: 'Executive Council' },
  { id: 'm11', name: 'Dr. Ajay R', email: 'ajay.r@msruas.ac.in', role: 'Head of Events', tier: 3, committee: 'Executive Council' },
  { id: 'm12', name: 'Ms. Sujata Bijwe', email: 'sujata.bijwe@msruas.ac.in', role: 'Head of Events', tier: 3, committee: 'Executive Council' },
  { id: 'm13', name: 'Abhijit Arya', email: 'abhijit.arya@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Senior Student Leadership' },
  { id: 'm14', name: 'Laksh Soorya Singh', email: 'laksh.singh@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Senior Student Leadership' },
  { id: 'm15', name: 'Bhawen Maroo', email: 'bhawen.maroo@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Senior Student Leadership' },
  { id: 'm16', name: 'Bharvi A Padia', email: 'bharvi.padia@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Senior Student Leadership' },
  { id: 'm17', name: 'Arvind Rakshith', email: 'arvind.rakshith@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Senior Student Leadership' },
  { id: 'm18', name: 'Shreesha S N', email: 'shreesha.sn@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Senior Student Leadership' },
  { id: 'm19', name: 'Nuthan H', email: 'nuthan.h@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Organizing Committee' },
  { id: 'm20', name: 'S Bhavya Shree', email: 'bhavya.shree@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm21', name: 'Shriram SG', email: 'shriram.sg@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm22', name: 'Manoj Petakamsetty', email: 'manoj.petakamsetty@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm23', name: 'Sudev Mitra', email: 'sudev.mitra@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm24', name: 'Jyotsna Karn', email: 'jyotsna.karn@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm25', name: 'Shravya T', email: 'shravya.t@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm26', name: 'P Koushik Reddy', email: 'koushik.reddy@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm27', name: 'Sadiya Sawood', email: 'sadiya.sawood@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm28', name: 'Syed Furqaan Ahmed', email: 'furqaan.ahmed@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm29', name: 'Kayomarz M Pavri', email: 'kayomarz.pavri@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Organizing Committee' },
  { id: 'm30', name: 'Nimisha K M', email: 'nimisha.km@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm31', name: 'Aravind Manashetti', email: 'aravind.manashetti@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm32', name: 'Shwetha S', email: 'shwetha.s@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm33', name: 'Kishan KP', email: 'kishan.kp@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm34', name: 'Yash Chandak', email: 'yash.chandak@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
  { id: 'm35', name: 'Niyati Chawra', email: 'niyati.chawra@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
];

const initialEvents: EventItem[] = [
  { id: 'e1', title: 'Tech Conclave 2026', description: 'Annual tech symposium featuring sustainability and AI panels.', startDate: '2026-09-10', endDate: '2026-09-12', committee: 'Senior Student Leadership', status: 'active', createdBy: 'Kayomarz Pavri' },
  { id: 'e2', title: 'Alumni Meet 2026', description: 'Reunion meet for RUAS alumni sharing entrepreneurial journeys.', startDate: '2026-10-05', endDate: '2026-10-06', committee: 'Organizing Committee', status: 'planned', createdBy: 'Dr. Subhadeep Mukherjee' },
  { id: 'e3', title: 'Robotics Workshop', description: 'Hands-on bootcamp on ROS and robot assembly.', startDate: '2026-08-25', endDate: '2026-08-27', committee: 'All Committees', status: 'planned', createdBy: 'Dr. Kiran Kumar B M' },
  { id: 'e4', title: 'Webinar Series', description: 'Expert online talks on sustainable leadership.', startDate: '2026-08-15', endDate: '2026-08-18', committee: 'Executive Council', status: 'active', createdBy: 'Dr. K. M. Sharath Kumar' },
];

const initialTasks: TaskItem[] = [
  { id: 't1', title: 'Prepare Event Budget Spreadsheet', event: 'Tech Conclave 2026', eventId: 'e1', assignee: 'Gurutejas C', assigneeEmail: 'gurutejas.c@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-20', status: 'Assigned', creatorName: 'Kayomarz Pavri' },
  { id: 't2', title: 'Coordinate Speaker Panel Invitations', event: 'Alumni Meet 2026', eventId: 'e2', assignee: 'Kunal Bhadauria', assigneeEmail: 'kunal.bhadauria@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-22', status: 'In Progress', creatorName: 'Dr. Subhadeep Mukherjee' },
  { id: 't3', title: 'Setup Audio-Visual Check', event: 'Robotics Workshop', eventId: 'e3', assignee: 'Keerthan J', assigneeEmail: 'keerthan.j@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-25', status: 'Assigned', creatorName: 'Dr. Kiran Kumar B M' },
  { id: 't4', title: 'Compile Feedback Survey Results', event: 'Webinar Series', eventId: 'e4', assignee: 'Gurutejas C', assigneeEmail: 'gurutejas.c@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-18', status: 'Pending Extension', creatorName: 'Kayomarz Pavri', extensionReason: 'Waiting for 15 pending responses from participants.' },
  { id: 't5', title: 'Finalize Event Banners & Design Assets', assignee: 'Organizing Committee', assigneeType: 'committee', dueDate: '2026-08-12', status: 'Completed', creatorName: 'Kunal Bhadauria' },
  { id: 't6', title: 'Confirm Catering Service Layout', event: 'Tech Conclave 2026', eventId: 'e1', assignee: 'Keerthan J', assigneeEmail: 'keerthan.j@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-14', status: 'Completed', creatorName: 'Gurutejas C' },
];

const initialRatings: RatingItem[] = [
  { id: 'r1', targetType: 'individual', targetName: 'Gurutejas C', targetId: 'm5', raterName: 'Dr. Kiran Kumar B M', quality: 5, timeliness: 4, initiative: 5, collaboration: 5, overallScore: 4.8, notes: 'Excellent leadership in tech conclave organization.', quarter: '2026-Q3', createdAt: '2026-08-14' },
  { id: 'r2', targetType: 'committee', targetName: 'Organizing Committee', targetId: 'Organizing Committee', raterName: 'Dr. Subhadeep Mukherjee', quality: 4, timeliness: 4, initiative: 5, collaboration: 4, overallScore: 4.3, notes: 'Design tasks completed early, very prompt.', quarter: '2026-Q3', createdAt: '2026-08-13' },
  { id: 'r3', targetType: 'individual', targetName: 'Kunal Bhadauria', targetId: 'm6', raterName: 'Kayomarz Pavri', quality: 5, timeliness: 5, initiative: 4, collaboration: 5, overallScore: 4.8, notes: 'Outstanding dedication across cross-committee logistics.', quarter: '2026-Q3', createdAt: '2026-08-12' },
  { id: 'r4', targetType: 'individual', targetName: 'Keerthan J', targetId: 'm8', raterName: 'Dr. Kiran Kumar B M', quality: 4, timeliness: 4, initiative: 4, collaboration: 4, overallScore: 4.0, notes: 'Great support in audio visual setup.', quarter: '2026-Q3', createdAt: '2026-08-10' },
];

const initialReimbursements: ReimbursementItem[] = [
  { id: 'rem1', memberName: 'Gurutejas C', memberEmail: 'gurutejas.c@msruas.ac.in', amount: 4500, category: 'Printing & Stationary', description: 'Banners and feedback card prints for Tech Conclave.', receiptUrl: 'receipt_tech.pdf', status: 'Pending', bankDetails: 'HDFC BANK - A/C 50100293849182 - IFSC HDFC0000123', submittedAt: '2026-08-15' },
  { id: 'rem2', memberName: 'Kunal Bhadauria', memberEmail: 'kunal.bhadauria@msruas.ac.in', amount: 1200, category: 'Catering / Refreshments', description: 'Snacks for speaker panel preliminary meet.', receiptUrl: 'receipt_catering.jpg', status: 'Approved', bankDetails: 'SBI - A/C 30928349182 - IFSC SBIN0004921', submittedAt: '2026-08-10', firstPassReviewer: 'Gurutejas C', finalApprover: 'Dr. Subhadeep Mukherjee', decidedAt: '2026-08-11' },
];

const initialAnnouncements: AnnouncementItem[] = [
  { id: 'a1', title: 'Tech Conclave 2026 Core Planning Briefing', content: 'All committee leads and senior student members are requested to join the final walkthrough in Seminar Hall 2 at 4:30 PM.', scope: 'All Members', authorName: 'Kayomarz Pavri', publishedAt: '2026-08-16 10:30' },
  { id: 'a2', title: 'Q3 Financial Reconciliation Window Open', content: 'Submit all outstanding reimbursement slips and bills before the 25th of August for leadership sign-off.', scope: 'Organizing Committee', authorName: 'Dr. Subhadeep Mukherjee', publishedAt: '2026-08-14 15:00' },
  { id: 'a3', title: 'Advisory Board Strategic Review Meeting', content: 'Review of event calendar and academic integration scheduled for next Monday with the executive leadership team.', scope: 'Advisory Board', authorName: 'Dr. K. M. Sharath Kumar', publishedAt: '2026-08-12 11:15' },
];

const initialForms: PublicFormItem[] = [
  {
    id: 'f1',
    slug: 'tech-conclave-registration',
    title: 'Tech Conclave 2026 Participant Registration',
    description: 'Register for panel sessions, workshops, and student innovation showcase.',
    committee: 'Senior Student Leadership',
    createdBy: 'Kayomarz Pavri',
    createdAt: '2026-08-10',
    isSample: true,
    status: 'active',
    fields: [
      { id: 'field_name', label: 'Full Name', type: 'text', required: true },
      { id: 'field_email', label: 'University / Institute Email', type: 'email', required: true },
      { id: 'field_dept', label: 'Department / Faculty', type: 'text', required: true },
      { id: 'field_track', label: 'Preferred Track', type: 'select', options: ['AI & Robotics', 'Sustainable Engineering', 'Design & UI/UX'], required: true },
      { id: 'field_notes', label: 'Special Accommodation / Questions', type: 'textarea', required: false },
    ],
  },
  {
    id: 'f2',
    slug: 'robotics-bootcamp-rsvp',
    title: 'Robotics Bootcamp RSVP & Kit Request',
    description: 'Confirm participation and kit allocation for hands-on ROS sessions.',
    committee: 'Organizing Committee',
    createdBy: 'Gurutejas C',
    createdAt: '2026-08-12',
    isSample: true,
    status: 'active',
    fields: [
      { id: 'field_name', label: 'Student Name', type: 'text', required: true },
      { id: 'field_srn', label: 'Student Registration Number (SRN)', type: 'text', required: true },
      { id: 'field_exp', label: 'Prior ROS / Arduino Experience', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    ],
  },
];

const initialSubmissions: FormSubmissionItem[] = [
  {
    id: 'sub_1',
    formId: 'f1',
    slug: 'tech-conclave-registration',
    isSample: true,
    submittedAt: '2026-08-11 14:22',
    data: {
      field_name: 'Ananya Sharma',
      field_email: 'ananya.s@msruas.ac.in',
      field_dept: 'Computer Science & Engineering',
      field_track: 'AI & Robotics',
      field_notes: 'Excited to attend the keynote panel on GenAI in Healthcare.',
    },
  },
  {
    id: 'sub_2',
    formId: 'f1',
    slug: 'tech-conclave-registration',
    isSample: true,
    submittedAt: '2026-08-12 09:45',
    data: {
      field_name: 'Rohan Deshmukh',
      field_email: 'rohan.d@msruas.ac.in',
      field_dept: 'Electronics & Communication',
      field_track: 'Design & UI/UX',
      field_notes: '',
    },
  },
];

const isBrowser = typeof window !== 'undefined';

export function initializeData() {
  if (!isBrowser) return;
  
  const storedMembers = localStorage.getItem('leads_members');
  if (!storedMembers || JSON.parse(storedMembers).length < 15) {
    localStorage.setItem('leads_members', JSON.stringify(initialMembers));
  }
  
  if (!localStorage.getItem('leads_events')) {
    localStorage.setItem('leads_events', JSON.stringify(initialEvents));
  }
  if (!localStorage.getItem('leads_tasks')) {
    localStorage.setItem('leads_tasks', JSON.stringify(initialTasks));
  }
  if (!localStorage.getItem('leads_ratings')) {
    localStorage.setItem('leads_ratings', JSON.stringify(initialRatings));
  }
  if (!localStorage.getItem('leads_reimbursements')) {
    localStorage.setItem('leads_reimbursements', JSON.stringify(initialReimbursements));
  }
  if (!localStorage.getItem('leads_announcements')) {
    localStorage.setItem('leads_announcements', JSON.stringify(initialAnnouncements));
  }
  if (!localStorage.getItem('leads_forms')) {
    localStorage.setItem('leads_forms', JSON.stringify(initialForms));
  }
  if (!localStorage.getItem('leads_submissions')) {
    localStorage.setItem('leads_submissions', JSON.stringify(initialSubmissions));
  }
  
  const storedCommittees = localStorage.getItem('leads_committees');
  if (!storedCommittees || JSON.parse(storedCommittees).length < 5) {
    localStorage.setItem('leads_committees', JSON.stringify(initialCommittees));
  }
}

// -------------------------------------------------------------
// Centralized Permission / Visibility Helpers
// -------------------------------------------------------------
export function canViewTask(
  task: TaskItem, 
  user: { name: string; email: string; tier: number; committee: string } | null
): boolean {
  if (!user) return false;
  // Tier 1-3 (Super User, Centre Head, Head of Events): see all tasks
  if (user.tier <= 3) return true;
  // Tier 4 (Advisory Board): read-only role, no task execution duties
  if (user.tier === 4) return false;
  // Tier 5-6 (Core Committee, Training Associate):
  if (task.assigneeType === 'individual') {
    return Boolean(
      (task.assignee && task.assignee.toLowerCase() === user.name.toLowerCase()) ||
      (task.assigneeEmail && task.assigneeEmail.toLowerCase() === user.email.toLowerCase())
    );
  }
  if (task.assigneeType === 'committee') {
    return Boolean(
      user.committee === 'All Committees' || 
      (task.assignee && task.assignee.toLowerCase() === user.committee.toLowerCase())
    );
  }
  return false;
}

// -------------------------------------------------------------
// Members
// -------------------------------------------------------------
export function getMembers(): Member[] {
  if (!isBrowser) return initialMembers;
  initializeData();
  const data = localStorage.getItem('leads_members');
  return data ? JSON.parse(data) : initialMembers;
}

export function saveMembers(members: Member[]) {
  if (!isBrowser) return;
  localStorage.setItem('leads_members', JSON.stringify(members));
}

export function addMember(member: Omit<Member, 'id'>) {
  const members = getMembers();
  // Check for duplicate email
  const exists = members.some(m => m.email.toLowerCase() === member.email.toLowerCase());
  if (exists) {
    throw new Error(`A member with email ${member.email} already exists in the roster.`);
  }
  const newMember = { ...member, id: 'm_' + Date.now() };
  members.push(newMember);
  saveMembers(members);
  logAuditEvent('MEMBER_ADDED', 'System Admin', `Added member ${member.name} (${member.email})`);
  return newMember;
}

export function deleteMember(id: string) {
  const members = getMembers();
  const target = members.find(m => m.id === id);
  if (target?.id === 'm1') {
    throw new Error('Cannot delete the primary Super User account.');
  }
  const updated = members.filter(m => m.id !== id);
  saveMembers(updated);
  if (target) {
    logAuditEvent('MEMBER_DELETED', 'System Admin', `Deleted member ${target.name} (${target.email})`);
  }
}

// -------------------------------------------------------------
// Events
// -------------------------------------------------------------
export function getEvents(): EventItem[] {
  if (!isBrowser) return initialEvents;
  initializeData();
  const data = localStorage.getItem('leads_events');
  return data ? JSON.parse(data) : initialEvents;
}

export function saveEvents(events: EventItem[]) {
  if (!isBrowser) return;
  localStorage.setItem('leads_events', JSON.stringify(events));
}

export function addEvent(event: Omit<EventItem, 'id'>) {
  const events = getEvents();
  const newEvent = { ...event, id: 'e_' + Date.now() };
  events.push(newEvent);
  saveEvents(events);
  logAuditEvent('EVENT_CREATED', event.createdBy || 'User', `Created event: ${event.title}`);
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<EventItem>, actorName = 'User') {
  const events = getEvents();
  const updated = events.map(e => e.id === id ? { ...e, ...updates } : e);
  saveEvents(updated);
  logAuditEvent('EVENT_UPDATED', actorName, `Updated event ID: ${id}`);
}

export function deleteEvent(id: string, actorName = 'User') {
  const events = getEvents();
  const target = events.find(e => e.id === id);
  const updated = events.filter(e => e.id !== id);
  saveEvents(updated);
  logAuditEvent('EVENT_DELETED', actorName, `Deleted event: ${target?.title || id}`);
}

// -------------------------------------------------------------
// Tasks
// -------------------------------------------------------------
export function getTasks(): TaskItem[] {
  if (!isBrowser) return initialTasks;
  initializeData();
  const data = localStorage.getItem('leads_tasks');
  return data ? JSON.parse(data) : initialTasks;
}

export function saveTasks(tasks: TaskItem[]) {
  if (!isBrowser) return;
  localStorage.setItem('leads_tasks', JSON.stringify(tasks));
}

export function addTask(task: Omit<TaskItem, 'id'>) {
  const tasks = getTasks();
  const newTask = { ...task, id: 't_' + Date.now() };
  tasks.push(newTask);
  saveTasks(tasks);
  logAuditEvent('TASK_CREATED', task.creatorName || 'User', `Created task: ${task.title} for ${task.assignee}`);
  return newTask;
}

export function updateTask(id: string, updates: Partial<TaskItem>, actorName = 'User') {
  const tasks = getTasks();
  const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
  saveTasks(updated);
  logAuditEvent('TASK_UPDATED', actorName, `Updated task: ${id}`);
}

export function updateTaskStatus(id: string, status: TaskItem['status']) {
  const tasks = getTasks();
  const updated = tasks.map(t => t.id === id ? { ...t, status } : t);
  saveTasks(updated);
}

export function deleteTask(id: string, actorName = 'User') {
  const tasks = getTasks();
  const target = tasks.find(t => t.id === id);
  const updated = tasks.filter(t => t.id !== id);
  saveTasks(updated);
  logAuditEvent('TASK_DELETED', actorName, `Deleted task: ${target?.title || id}`);
}

// -------------------------------------------------------------
// Ratings
// -------------------------------------------------------------
export function getRatings(): RatingItem[] {
  if (!isBrowser) return initialRatings;
  initializeData();
  const data = localStorage.getItem('leads_ratings');
  return data ? JSON.parse(data) : initialRatings;
}

export function saveRatings(ratings: RatingItem[]) {
  if (!isBrowser) return;
  localStorage.setItem('leads_ratings', JSON.stringify(ratings));
}

export function addRating(rating: Omit<RatingItem, 'id' | 'createdAt'>) {
  const ratings = getRatings();
  const now = new Date();
  const month = now.getMonth() + 1;
  const quarter = `${now.getFullYear()}-Q${Math.ceil(month / 3)}`;
  
  const newRating: RatingItem = { 
    ...rating, 
    id: 'r_' + Date.now(),
    quarter: rating.quarter || quarter,
    createdAt: now.toISOString().split('T')[0] 
  };
  ratings.push(newRating);
  saveRatings(ratings);
  logAuditEvent('RATING_SUBMITTED', rating.raterName, `Rated ${rating.targetName} (${rating.overallScore}/5.0)`);
  return newRating;
}

export function updateRating(id: string, updates: Partial<RatingItem>, actorName = 'User') {
  const ratings = getRatings();
  const updated = ratings.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : r);
  saveRatings(updated);
  logAuditEvent('RATING_UPDATED', actorName, `Updated evaluation ID: ${id}`);
}

export function deleteRating(id: string, actorName = 'User') {
  const ratings = getRatings();
  const target = ratings.find(r => r.id === id);
  const updated = ratings.filter(r => r.id !== id);
  saveRatings(updated);
  logAuditEvent('RATING_DELETED', actorName, `Deleted rating for ${target?.targetName || id}`);
}

// -------------------------------------------------------------
// Reimbursements (Two-Stage Workflow)
// -------------------------------------------------------------
export function getReimbursements(): ReimbursementItem[] {
  if (!isBrowser) return initialReimbursements;
  initializeData();
  const data = localStorage.getItem('leads_reimbursements');
  return data ? JSON.parse(data) : initialReimbursements;
}

export function saveReimbursements(reimbursements: ReimbursementItem[]) {
  if (!isBrowser) return;
  localStorage.setItem('leads_reimbursements', JSON.stringify(reimbursements));
}

export function addReimbursement(reimbursement: Omit<ReimbursementItem, 'id' | 'status' | 'submittedAt'>) {
  const reimbursements = getReimbursements();
  const newReimbursement: ReimbursementItem = {
    ...reimbursement,
    id: 'rem_' + Date.now(),
    status: 'Pending',
    submittedAt: new Date().toISOString().split('T')[0]
  };
  reimbursements.push(newReimbursement);
  saveReimbursements(reimbursements);
  logAuditEvent('REIMBURSEMENT_SUBMITTED', reimbursement.memberName, `Submitted claim for ₹${reimbursement.amount} (${reimbursement.category})`);
  return newReimbursement;
}

export function updateReimbursementStatus(
  id: string, 
  status: ReimbursementItem['status'],
  reviewerInfo?: { name: string; stage: 'firstPass' | 'final' }
) {
  const reimbursements = getReimbursements();
  const now = new Date().toISOString().split('T')[0];
  const updated = reimbursements.map(r => {
    if (r.id !== id) return r;
    const upd: ReimbursementItem = { ...r, status, decidedAt: now };
    if (reviewerInfo?.stage === 'firstPass') {
      upd.firstPassReviewer = reviewerInfo.name;
    } else if (reviewerInfo?.stage === 'final') {
      upd.finalApprover = reviewerInfo.name;
    }
    return upd;
  });
  saveReimbursements(updated);
  logAuditEvent('REIMBURSEMENT_STATUS_CHANGE', reviewerInfo?.name || 'Reviewer', `Claim ${id} status moved to ${status}`);
}

export function deleteReimbursement(id: string, actorName = 'User') {
  const reimbursements = getReimbursements();
  const updated = reimbursements.filter(r => r.id !== id);
  saveReimbursements(updated);
  logAuditEvent('REIMBURSEMENT_DELETED', actorName, `Deleted reimbursement claim ID: ${id}`);
}

// -------------------------------------------------------------
// Announcements
// -------------------------------------------------------------
export function getAnnouncements(): AnnouncementItem[] {
  if (!isBrowser) return initialAnnouncements;
  initializeData();
  const data = localStorage.getItem('leads_announcements');
  return data ? JSON.parse(data) : initialAnnouncements;
}

export function saveAnnouncements(announcements: AnnouncementItem[]) {
  if (!isBrowser) return;
  localStorage.setItem('leads_announcements', JSON.stringify(announcements));
}

export function addAnnouncement(announcement: Omit<AnnouncementItem, 'id' | 'publishedAt'>) {
  const announcements = getAnnouncements();
  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const newAnnouncement: AnnouncementItem = {
    ...announcement,
    id: 'a_' + Date.now(),
    publishedAt: timeStr,
  };
  announcements.unshift(newAnnouncement);
  saveAnnouncements(announcements);
  logAuditEvent('ANNOUNCEMENT_PUBLISHED', announcement.authorName, `Published announcement: ${announcement.title} (Scope: ${announcement.scope})`);
  return newAnnouncement;
}

export function updateAnnouncement(id: string, updates: Partial<AnnouncementItem>, actorName = 'User') {
  const announcements = getAnnouncements();
  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const updated = announcements.map(a => a.id === id ? { ...a, ...updates, editedAt: timeStr } : a);
  saveAnnouncements(updated);
  logAuditEvent('ANNOUNCEMENT_UPDATED', actorName, `Updated announcement ID: ${id}`);
}

export function deleteAnnouncement(id: string, actorName = 'User') {
  const announcements = getAnnouncements();
  const target = announcements.find(a => a.id === id);
  const updated = announcements.filter(a => a.id !== id);
  saveAnnouncements(updated);
  logAuditEvent('ANNOUNCEMENT_DELETED', actorName, `Deleted announcement: ${target?.title || id}`);
}

// -------------------------------------------------------------
// Public Forms & Responses
// -------------------------------------------------------------
export function getForms(): PublicFormItem[] {
  if (!isBrowser) return initialForms;
  initializeData();
  const data = localStorage.getItem('leads_forms');
  return data ? JSON.parse(data) : initialForms;
}

export function saveForms(forms: PublicFormItem[]) {
  if (!isBrowser) return;
  localStorage.setItem('leads_forms', JSON.stringify(forms));
}

export function isSlugUnique(slug: string, excludeFormId?: string): boolean {
  const forms = getForms();
  return !forms.some(f => f.slug.toLowerCase() === slug.toLowerCase() && f.id !== excludeFormId);
}

export function addForm(form: Omit<PublicFormItem, 'id' | 'createdAt'>) {
  if (!isSlugUnique(form.slug)) {
    throw new Error(`The public link slug "${form.slug}" is already taken. Please choose a unique slug.`);
  }
  const forms = getForms();
  const newForm: PublicFormItem = {
    ...form,
    id: 'f_' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0],
  };
  forms.push(newForm);
  saveForms(forms);
  logAuditEvent('FORM_CREATED', form.createdBy, `Created public form: ${form.title} (/${form.slug})`);
  return newForm;
}

export function updateForm(id: string, updates: Partial<PublicFormItem>, actorName = 'User') {
  if (updates.slug && !isSlugUnique(updates.slug, id)) {
    throw new Error(`The public link slug "${updates.slug}" is already taken.`);
  }
  const forms = getForms();
  const updated = forms.map(f => f.id === id ? { ...f, ...updates } : f);
  saveForms(updated);
  logAuditEvent('FORM_UPDATED', actorName, `Updated form ID: ${id}`);
}

export function deleteForm(id: string, actorName = 'User') {
  const forms = getForms();
  const target = forms.find(f => f.id === id);
  const updated = forms.filter(f => f.id !== id);
  saveForms(updated);
  logAuditEvent('FORM_DELETED', actorName, `Deleted form: ${target?.title || id}`);
}

export function getSubmissions(): FormSubmissionItem[] {
  if (!isBrowser) return initialSubmissions;
  initializeData();
  const data = localStorage.getItem('leads_submissions');
  return data ? JSON.parse(data) : initialSubmissions;
}

export function saveSubmissions(submissions: FormSubmissionItem[]) {
  if (!isBrowser) return;
  localStorage.setItem('leads_submissions', JSON.stringify(submissions));
}

export function addSubmission(submission: Omit<FormSubmissionItem, 'id' | 'submittedAt'>) {
  const submissions = getSubmissions();
  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const newSub: FormSubmissionItem = {
    ...submission,
    id: 'sub_' + Date.now(),
    submittedAt: timeStr,
  };
  submissions.push(newSub);
  saveSubmissions(submissions);
  return newSub;
}

// -------------------------------------------------------------
// Audit Logs
// -------------------------------------------------------------
export function getAuditLogs(): AuditLogItem[] {
  if (!isBrowser) return [];
  const data = localStorage.getItem('leads_audit_logs');
  return data ? JSON.parse(data) : [];
}

export function logAuditEvent(action: string, actorName: string, details: string, target?: string) {
  if (!isBrowser) return;
  const logs = getAuditLogs();
  const userStr = localStorage.getItem('user');
  let actorEmail = 'system@msruas.ac.in';
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      actorEmail = user.email || actorEmail;
    } catch {
      // ignore
    }
  }
  const now = new Date();
  const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const entry: AuditLogItem = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    action,
    actorName,
    actorEmail,
    target,
    details,
    timestamp: timeStr,
  };
  logs.unshift(entry);
  if (logs.length > 200) logs.pop();
  localStorage.setItem('leads_audit_logs', JSON.stringify(logs));
}

// -------------------------------------------------------------
// Committees
// -------------------------------------------------------------
export function getCommittees(): string[] {
  if (!isBrowser) return initialCommittees;
  initializeData();
  const data = localStorage.getItem('leads_committees');
  return data ? JSON.parse(data) : initialCommittees;
}

export function saveCommittees(committees: string[]) {
  if (!isBrowser) return;
  localStorage.setItem('leads_committees', JSON.stringify(committees));
}

export function addCommittee(name: string) {
  const committees = getCommittees();
  if (!committees.includes(name)) {
    committees.push(name);
    saveCommittees(committees);
    logAuditEvent('COMMITTEE_CREATED', 'System Admin', `Created committee: ${name}`);
  }
}
