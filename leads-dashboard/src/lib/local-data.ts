export type MemberDivision = 'Advisory Board' | 'Core Committee' | 'Training Associate' | 'Alumni';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: number;
  division: MemberDivision;
  committee?: string; // Legacy fallback
  department?: string;
  batch?: string; // e.g. "Class of 2025" for Alumni
}

export interface EventCommittee {
  id: string;
  name: string; // e.g. "Stage & Audio-Visual", "Hospitality & Logistics", "Design & Media"
  leadMemberId?: string;
  leadMemberName?: string;
  memberIds: string[]; // Students participating in this event committee
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  location?: string;
  committees: EventCommittee[];
  createdBy?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  event?: string;
  eventId?: string;
  eventCommitteeId?: string;
  eventCommitteeName?: string;
  assignee: string;
  assigneeId?: string;
  assigneeEmail?: string;
  assigneeType: 'individual' | 'committee';
  dueDate: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Pending Extension';
  creatorName?: string;
  extensionReason?: string;
  decidedBy?: string;
  decidedAt?: string;
  ratingScore?: number;
  ratedAt?: string;
}

export interface RatingItem {
  id: string;
  taskId: string;
  taskTitle: string;
  eventId?: string;
  eventName?: string;
  targetId: string; // Member ID
  targetName: string; // Member Name
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
  scope: string; // 'All Members' | 'Advisory Board' | 'Core Committee' | 'Training Associate' | 'Alumni'
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

// Initial mock data matching leadership website and division structure
const initialMembers: Member[] = [
  { id: 'm1', name: 'Kayomarz Pavri', email: 'kayomarz.pavri@msruas.ac.in', role: 'Super User', tier: 1, division: 'Core Committee' },
  { id: 'm2', name: 'Dr. Subhadeep Mukherjee', email: 'subhadeep.mukherjee@msruas.ac.in', role: 'Centre Head', tier: 2, division: 'Advisory Board' },
  { id: 'm3', name: 'Dr. Kiran Kumar B M', email: 'kiran.kumar@msruas.ac.in', role: 'Head of Events', tier: 3, division: 'Advisory Board' },
  { id: 'm4', name: 'Dr. K. M. Sharath Kumar', email: 'sharath.kumar@msruas.ac.in', role: 'Advisory Board Member', tier: 4, division: 'Advisory Board' },
  { id: 'm5', name: 'Gurutejas C', email: 'gurutejas.c@msruas.ac.in', role: 'President & Student Lead', tier: 5, division: 'Core Committee' },
  { id: 'm6', name: 'Kunal Bhadauria', email: 'kunal.bhadauria@msruas.ac.in', role: 'Vice President', tier: 5, division: 'Core Committee' },
  { id: 'm7', name: 'Dr. Hari Krishna S', email: 'hari.krishna@msruas.ac.in', role: 'Faculty Advisor', tier: 4, division: 'Advisory Board' },
  { id: 'm8', name: 'Keerthan J', email: 'keerthan.j@msruas.ac.in', role: 'Junior Coordinator', tier: 6, division: 'Training Associate' },
  { id: 'm9', name: 'Dr. Kuldeep Kumar Raina', email: 'kuldeep.raina@msruas.ac.in', role: 'Vice Chancellor / Advisory Patron', tier: 2, division: 'Advisory Board' },
  { id: 'm10', name: 'Dr. Pallabi Mund', email: 'pallabi.mund@msruas.ac.in', role: 'Associate Advisor', tier: 3, division: 'Advisory Board' },
  { id: 'm11', name: 'Dr. Ajay R', email: 'ajay.r@msruas.ac.in', role: 'Faculty Advisor', tier: 3, division: 'Advisory Board' },
  { id: 'm12', name: 'Ms. Sujata Bijwe', email: 'sujata.bijwe@msruas.ac.in', role: 'Faculty Advisor', tier: 3, division: 'Advisory Board' },
  { id: 'm13', name: 'Abhijit Arya', email: 'abhijit.arya@msruas.ac.in', role: 'General Secretary', tier: 5, division: 'Core Committee' },
  { id: 'm14', name: 'Laksh Soorya Singh', email: 'laksh.singh@msruas.ac.in', role: 'Operations Lead', tier: 5, division: 'Core Committee' },
  { id: 'm15', name: 'Bhawen Maroo', email: 'bhawen.maroo@msruas.ac.in', role: 'Logistics Head', tier: 5, division: 'Core Committee' },
  { id: 'm16', name: 'Bharvi A Padia', email: 'bharvi.padia@msruas.ac.in', role: 'Finance Head', tier: 5, division: 'Core Committee' },
  { id: 'm17', name: 'Arvind Rakshith', email: 'arvind.rakshith@msruas.ac.in', role: 'Design & Media Lead', tier: 5, division: 'Core Committee' },
  { id: 'm18', name: 'Shreesha S N', email: 'shreesha.sn@msruas.ac.in', role: 'Technical Head', tier: 5, division: 'Core Committee' },
  { id: 'm19', name: 'Nuthan H', email: 'nuthan.h@msruas.ac.in', role: 'Public Relations Lead', tier: 5, division: 'Core Committee' },
  { id: 'm20', name: 'S Bhavya Shree', email: 'bhavya.shree@msruas.ac.in', role: 'Training Coordinator', tier: 6, division: 'Training Associate' },
  { id: 'm21', name: 'Shriram SG', email: 'shriram.sg@msruas.ac.in', role: 'Technical Associate', tier: 6, division: 'Training Associate' },
  { id: 'm22', name: 'Manoj Petakamsetty', email: 'manoj.petakamsetty@msruas.ac.in', role: 'Events Associate', tier: 6, division: 'Training Associate' },
  { id: 'm23', name: 'Sudev Mitra', email: 'sudev.mitra@msruas.ac.in', role: 'Media Associate', tier: 6, division: 'Training Associate' },
  { id: 'm24', name: 'Jyotsna Karn', email: 'jyotsna.karn@msruas.ac.in', role: 'Hospitality Associate', tier: 6, division: 'Training Associate' },
  { id: 'm25', name: 'Shravya T', email: 'shravya.t@msruas.ac.in', role: 'Documentation Associate', tier: 6, division: 'Training Associate' },
  { id: 'm26', name: 'P Koushik Reddy', email: 'koushik.reddy@msruas.ac.in', role: 'Logistics Associate', tier: 6, division: 'Training Associate' },
  { id: 'm27', name: 'Sadiya Sawood', email: 'sadiya.sawood@msruas.ac.in', role: 'PR Associate', tier: 6, division: 'Training Associate' },
  { id: 'm28', name: 'Syed Furqaan Ahmed', email: 'furqaan.ahmed@msruas.ac.in', role: 'Technical Associate', tier: 6, division: 'Training Associate' },
  { id: 'm29', name: 'Kayomarz M Pavri', email: 'kayomarz.m@msruas.ac.in', role: 'Alumni Mentor (Former President)', tier: 7, division: 'Alumni', batch: 'Batch of 2024' },
  { id: 'm30', name: 'Nimisha K M', email: 'nimisha.km@msruas.ac.in', role: 'Alumni Mentor (Former Tech Lead)', tier: 7, division: 'Alumni', batch: 'Batch of 2025' },
  { id: 'm31', name: 'Aravind Manashetti', email: 'aravind.manashetti@msruas.ac.in', role: 'Training Associate', tier: 6, division: 'Training Associate' },
  { id: 'm32', name: 'Shwetha S', email: 'shwetha.s@msruas.ac.in', role: 'Training Associate', tier: 6, division: 'Training Associate' },
  { id: 'm33', name: 'Kishan KP', email: 'kishan.kp@msruas.ac.in', role: 'Training Associate', tier: 6, division: 'Training Associate' },
  { id: 'm34', name: 'Yash Chandak', email: 'yash.chandak@msruas.ac.in', role: 'Training Associate', tier: 6, division: 'Training Associate' },
  { id: 'm35', name: 'Niyati Chawra', email: 'niyati.chawra@msruas.ac.in', role: 'Training Associate', tier: 6, division: 'Training Associate' },
];

const initialEvents: EventItem[] = [
  { 
    id: 'e1', 
    title: 'Tech Conclave 2026', 
    description: 'Annual tech symposium featuring sustainability, robotics showcase, and AI panel discussions.', 
    startDate: '2026-09-10', 
    endDate: '2026-09-12', 
    location: 'Ramaiah Technology Campus - Auditorium 1',
    status: 'active', 
    createdBy: 'Kayomarz Pavri',
    committees: [
      { id: 'c1_1', name: 'Stage & Audio-Visual Committee', leadMemberId: 'm5', leadMemberName: 'Gurutejas C', memberIds: ['m5', 'm8', 'm21'] },
      { id: 'c1_2', name: 'Hospitality & Catering Committee', leadMemberId: 'm15', leadMemberName: 'Bhawen Maroo', memberIds: ['m15', 'm24', 'm26'] },
      { id: 'c1_3', name: 'Design & Media Committee', leadMemberId: 'm17', leadMemberName: 'Arvind Rakshith', memberIds: ['m17', 'm23', 'm27'] },
      { id: 'c1_4', name: 'Finance & Registrations Committee', leadMemberId: 'm16', leadMemberName: 'Bharvi A Padia', memberIds: ['m16', 'm25'] },
    ]
  },
  { 
    id: 'e2', 
    title: 'Alumni Meet & Innovation Summit 2026', 
    description: 'Reunion meet for RUAS alumni sharing entrepreneurial journeys with undergraduate leaders.', 
    startDate: '2026-10-05', 
    endDate: '2026-10-06', 
    location: 'Gnanagangothri Campus - Seminar Complex',
    status: 'planned', 
    createdBy: 'Dr. Subhadeep Mukherjee',
    committees: [
      { id: 'c2_1', name: 'Alumni Relations Committee', leadMemberId: 'm6', leadMemberName: 'Kunal Bhadauria', memberIds: ['m6', 'm29', 'm30'] },
      { id: 'c2_2', name: 'Operations & Logistics Committee', leadMemberId: 'm14', leadMemberName: 'Laksh Soorya Singh', memberIds: ['m14', 'm22', 'm26'] }
    ]
  },
  { 
    id: 'e3', 
    title: 'Robotics Bootcamp & Hackathon', 
    description: 'Hands-on bootcamp on ROS, autonomous navigation, and robot assembly.', 
    startDate: '2026-08-25', 
    endDate: '2026-08-27', 
    location: 'Robotics Lab 3',
    status: 'planned', 
    createdBy: 'Dr. Kiran Kumar B M',
    committees: [
      { id: 'c3_1', name: 'Technical Mentorship Committee', leadMemberId: 'm18', leadMemberName: 'Shreesha S N', memberIds: ['m18', 'm21', 'm28'] },
      { id: 'c3_2', name: 'Hardware & Kit Logistics', leadMemberId: 'm8', leadMemberName: 'Keerthan J', memberIds: ['m8', 'm31', 'm33'] }
    ]
  },
  { 
    id: 'e4', 
    title: 'Leadership Webinar Series', 
    description: 'Expert online talks on sustainable leadership and modern engineering practices.', 
    startDate: '2026-08-15', 
    endDate: '2026-08-18', 
    location: 'Virtual Zoom / MS Teams Room',
    status: 'active', 
    createdBy: 'Dr. K. M. Sharath Kumar',
    committees: [
      { id: 'c4_1', name: 'Public Relations & Streaming', leadMemberId: 'm19', leadMemberName: 'Nuthan H', memberIds: ['m19', 'm20', 'm27'] }
    ]
  },
];

const initialTasks: TaskItem[] = [
  { 
    id: 't1', 
    title: 'Prepare Event Budget Spreadsheet', 
    event: 'Tech Conclave 2026', 
    eventId: 'e1', 
    eventCommitteeName: 'Finance & Registrations Committee',
    assignee: 'Bharvi A Padia', 
    assigneeId: 'm16',
    assigneeEmail: 'bharvi.padia@msruas.ac.in', 
    assigneeType: 'individual', 
    dueDate: '2026-08-20', 
    status: 'Completed', 
    creatorName: 'Kayomarz Pavri',
    ratingScore: 4.8,
    ratedAt: '2026-08-14'
  },
  { 
    id: 't2', 
    title: 'Coordinate Speaker Panel Invitations', 
    event: 'Alumni Meet & Innovation Summit 2026', 
    eventId: 'e2', 
    eventCommitteeName: 'Alumni Relations Committee',
    assignee: 'Kunal Bhadauria', 
    assigneeId: 'm6',
    assigneeEmail: 'kunal.bhadauria@msruas.ac.in', 
    assigneeType: 'individual', 
    dueDate: '2026-08-22', 
    status: 'In Progress', 
    creatorName: 'Dr. Subhadeep Mukherjee' 
  },
  { 
    id: 't3', 
    title: 'Setup Audio-Visual & Microphones Check', 
    event: 'Tech Conclave 2026', 
    eventId: 'e1', 
    eventCommitteeName: 'Stage & Audio-Visual Committee',
    assignee: 'Keerthan J', 
    assigneeId: 'm8',
    assigneeEmail: 'keerthan.j@msruas.ac.in', 
    assigneeType: 'individual', 
    dueDate: '2026-08-25', 
    status: 'Completed', 
    creatorName: 'Dr. Kiran Kumar B M',
    ratingScore: 4.5,
    ratedAt: '2026-08-10'
  },
  { 
    id: 't4', 
    title: 'Compile Participant Feedback Survey Results', 
    event: 'Leadership Webinar Series', 
    eventId: 'e4', 
    eventCommitteeName: 'Public Relations & Streaming',
    assignee: 'Gurutejas C', 
    assigneeId: 'm5',
    assigneeEmail: 'gurutejas.c@msruas.ac.in', 
    assigneeType: 'individual', 
    dueDate: '2026-08-18', 
    status: 'Pending Extension', 
    creatorName: 'Kayomarz Pavri', 
    extensionReason: 'Waiting for 15 pending survey responses from participants.' 
  },
  { 
    id: 't5', 
    title: 'Finalize Event Banners & Backdrop Graphics', 
    event: 'Tech Conclave 2026',
    eventId: 'e1',
    eventCommitteeName: 'Design & Media Committee',
    assignee: 'Arvind Rakshith', 
    assigneeId: 'm17',
    assigneeEmail: 'arvind.rakshith@msruas.ac.in',
    assigneeType: 'individual', 
    dueDate: '2026-08-12', 
    status: 'Completed', 
    creatorName: 'Kunal Bhadauria',
    ratingScore: 5.0,
    ratedAt: '2026-08-12'
  },
  { 
    id: 't6', 
    title: 'Confirm Catering Service Layout & Meal Counts', 
    event: 'Tech Conclave 2026', 
    eventId: 'e1', 
    eventCommitteeName: 'Hospitality & Catering Committee',
    assignee: 'Bhawen Maroo', 
    assigneeId: 'm15',
    assigneeEmail: 'bhawen.maroo@msruas.ac.in', 
    assigneeType: 'individual', 
    dueDate: '2026-08-14', 
    status: 'Completed', 
    creatorName: 'Gurutejas C',
    ratingScore: 4.3,
    ratedAt: '2026-08-15'
  },
];

const initialRatings: RatingItem[] = [
  { 
    id: 'r1', 
    taskId: 't1',
    taskTitle: 'Prepare Event Budget Spreadsheet',
    eventId: 'e1',
    eventName: 'Tech Conclave 2026',
    targetName: 'Bharvi A Padia', 
    targetId: 'm16', 
    raterName: 'Dr. Kiran Kumar B M', 
    quality: 5, 
    timeliness: 5, 
    initiative: 4, 
    collaboration: 5, 
    overallScore: 4.8, 
    notes: 'Flawless financial planning and transparent allocations for conclave.', 
    quarter: '2026-Q3', 
    createdAt: '2026-08-14' 
  },
  { 
    id: 'r2', 
    taskId: 't5',
    taskTitle: 'Finalize Event Banners & Backdrop Graphics',
    eventId: 'e1',
    eventName: 'Tech Conclave 2026',
    targetName: 'Arvind Rakshith', 
    targetId: 'm17', 
    raterName: 'Dr. Subhadeep Mukherjee', 
    quality: 5, 
    timeliness: 5, 
    initiative: 5, 
    collaboration: 5, 
    overallScore: 5.0, 
    notes: 'Outstanding branding assets delivered ahead of schedule.', 
    quarter: '2026-Q3', 
    createdAt: '2026-08-12' 
  },
  { 
    id: 'r3', 
    taskId: 't3',
    taskTitle: 'Setup Audio-Visual & Microphones Check',
    eventId: 'e1',
    eventName: 'Tech Conclave 2026',
    targetName: 'Keerthan J', 
    targetId: 'm8', 
    raterName: 'Dr. Kiran Kumar B M', 
    quality: 4, 
    timeliness: 5, 
    initiative: 4, 
    collaboration: 5, 
    overallScore: 4.5, 
    notes: 'Handled AV testing and soundboard check smoothly.', 
    quarter: '2026-Q3', 
    createdAt: '2026-08-10' 
  },
  { 
    id: 'r4', 
    taskId: 't6',
    taskTitle: 'Confirm Catering Service Layout & Meal Counts',
    eventId: 'e1',
    eventName: 'Tech Conclave 2026',
    targetName: 'Bhawen Maroo', 
    targetId: 'm15', 
    raterName: 'Dr. Subhadeep Mukherjee', 
    quality: 4, 
    timeliness: 4, 
    initiative: 5, 
    collaboration: 4, 
    overallScore: 4.3, 
    notes: 'Vendor negotiations and seating arrangements were well coordinated.', 
    quarter: '2026-Q3', 
    createdAt: '2026-08-15' 
  },
];

const initialReimbursements: ReimbursementItem[] = [
  { id: 'rem1', memberName: 'Gurutejas C', memberEmail: 'gurutejas.c@msruas.ac.in', amount: 4500, category: 'Printing & Stationary', description: 'Banners and feedback card prints for Tech Conclave.', receiptUrl: 'receipt_tech.pdf', status: 'Pending', bankDetails: 'HDFC BANK - A/C 50100293849182 - IFSC HDFC0000123', submittedAt: '2026-08-15' },
  { id: 'rem2', memberName: 'Kunal Bhadauria', memberEmail: 'kunal.bhadauria@msruas.ac.in', amount: 1200, category: 'Catering / Refreshments', description: 'Snacks for speaker panel preliminary meet.', receiptUrl: 'receipt_catering.jpg', status: 'Approved', bankDetails: 'SBI - A/C 30928349182 - IFSC SBIN0004921', submittedAt: '2026-08-10', firstPassReviewer: 'Gurutejas C', finalApprover: 'Dr. Subhadeep Mukherjee', decidedAt: '2026-08-11' },
];

const initialAnnouncements: AnnouncementItem[] = [
  { id: 'a1', title: 'Tech Conclave 2026 Core Planning Briefing', content: 'All event committee leads and student organizers are requested to join the final walkthrough in Seminar Hall 2 at 4:30 PM.', scope: 'Core Committee', authorName: 'Kayomarz Pavri', publishedAt: '2026-08-16 10:30' },
  { id: 'a2', title: 'Q3 Financial Reconciliation Window Open', content: 'Submit all outstanding reimbursement slips and bills before the 25th of August for leadership sign-off.', scope: 'All Members', authorName: 'Dr. Subhadeep Mukherjee', publishedAt: '2026-08-14 15:00' },
  { id: 'a3', title: 'Advisory Board Strategic Review Meeting', content: 'Review of event calendar and academic integration scheduled for next Monday with the executive leadership team.', scope: 'Advisory Board', authorName: 'Dr. K. M. Sharath Kumar', publishedAt: '2026-08-12 11:15' },
];

const initialForms: PublicFormItem[] = [
  {
    id: 'f1',
    slug: 'tech-conclave-registration',
    title: 'Tech Conclave 2026 Participant Registration',
    description: 'Register for panel sessions, workshops, and student innovation showcase.',
    committee: 'Tech Conclave 2026',
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
    committee: 'Robotics Bootcamp',
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
      field_notes: 'Excited for the keynote session.'
    }
  },
  {
    id: 'sub_2',
    formId: 'f1',
    slug: 'tech-conclave-registration',
    isSample: true,
    submittedAt: '2026-08-11 15:40',
    data: {
      field_name: 'Rohan Verma',
      field_email: 'rohan.v@msruas.ac.in',
      field_dept: 'Mechanical & Manufacturing',
      field_track: 'Sustainable Engineering',
    }
  }
];

// -------------------------------------------------------------
// Server Sync & Per-Collection API Helpers
// -------------------------------------------------------------

/**
 * Fetch all collections from the server and hydrate localStorage.
 * Server data ALWAYS wins — this is safe to call repeatedly (polling).
 * Falls back to initialX sample data only if localStorage is also empty.
 */
export async function syncWithServer(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (data && typeof data === 'object') {
      // Always hydrate from server — server is source of truth
      if (Array.isArray(data.members)) {
        localStorage.setItem('leads_members', JSON.stringify(
          data.members.length > 0 ? data.members : initialMembers
        ));
      }
      if (Array.isArray(data.events)) {
        localStorage.setItem('leads_events', JSON.stringify(
          data.events.length > 0 ? data.events : initialEvents
        ));
      }
      if (Array.isArray(data.tasks)) {
        localStorage.setItem('leads_tasks', JSON.stringify(
          data.tasks.length > 0 ? data.tasks : initialTasks
        ));
      }
      if (Array.isArray(data.ratings)) {
        localStorage.setItem('leads_ratings', JSON.stringify(
          data.ratings.length > 0 ? data.ratings : initialRatings
        ));
      }
      if (Array.isArray(data.reimbursements)) {
        localStorage.setItem('leads_reimbursements', JSON.stringify(
          data.reimbursements.length > 0 ? data.reimbursements : initialReimbursements
        ));
      }
      if (Array.isArray(data.announcements)) {
        localStorage.setItem('leads_announcements', JSON.stringify(
          data.announcements.length > 0 ? data.announcements : initialAnnouncements
        ));
      }
      if (Array.isArray(data.forms)) {
        localStorage.setItem('leads_custom_forms', JSON.stringify(
          data.forms.length > 0 ? data.forms : initialForms
        ));
      }
      if (Array.isArray(data.submissions)) {
        localStorage.setItem('leads_form_submissions', JSON.stringify(
          data.submissions.length > 0 ? data.submissions : initialSubmissions
        ));
      }
      if (Array.isArray(data.auditLogs)) {
        localStorage.setItem('leads_audit_logs', JSON.stringify(data.auditLogs));
      }
      return true;
    }
  } catch (err) {
    console.warn('[sync] Server sync skipped (offline or starting up):', err);
  }
  return false;
}

/**
 * Fire-and-forget helper for targeted per-collection server calls.
 * Does NOT send the entire database — only touches the one record that changed.
 */
async function serverPost(endpoint: string, body: any): Promise<any> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.warn(`[api] POST ${endpoint} failed:`, res.status);
    return res.ok ? res.json() : null;
  } catch (err) {
    console.warn(`[api] POST ${endpoint} error:`, err);
    return null;
  }
}

async function serverPatch(endpoint: string, id: string, updates: any): Promise<any> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`${endpoint}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) console.warn(`[api] PATCH ${endpoint}/${id} failed:`, res.status);
    return res.ok ? res.json() : null;
  } catch (err) {
    console.warn(`[api] PATCH ${endpoint}/${id} error:`, err);
    return null;
  }
}

async function serverDelete(endpoint: string, id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    if (!res.ok) console.warn(`[api] DELETE ${endpoint}/${id} failed:`, res.status);
    return res.ok;
  } catch (err) {
    console.warn(`[api] DELETE ${endpoint}/${id} error:`, err);
    return false;
  }
}

// -------------------------------------------------------------
// Storage & Accessors
// -------------------------------------------------------------

export function getMembers(): Member[] {
  if (typeof window === 'undefined') return initialMembers;
  const saved = localStorage.getItem('leads_members');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migrate legacy members without division
      return parsed.map((m: any) => {
        if (!m.division) {
          if (m.tier <= 4) m.division = 'Advisory Board';
          else if (m.tier === 5) m.division = 'Core Committee';
          else if (m.tier === 7) m.division = 'Alumni';
          else m.division = 'Training Associate';
        }
        return m;
      });
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  // syncWithServer() will seed properly on mount
  return initialMembers;
}

export function saveMembers(members: Member[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_members', JSON.stringify(members));
  // Note: bulk saves (e.g. bulkUpdateMembers) still write to /api/data for simplicity
  // Individual mutations (addMember, deleteMember) use targeted endpoints
}

export function addMember(member: Omit<Member, 'id'>): Member {
  const current = getMembers();
  const existing = current.find(m => m.email.toLowerCase() === member.email.toLowerCase());
  if (existing) {
    throw new Error(`A member with email ${member.email} already exists in the roster.`);
  }

  const newMember: Member = {
    ...member,
    id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
  };
  current.push(newMember);
  saveMembers(current);
  serverPost('/api/members', newMember);
  logAuditEvent('MEMBER_ADDED', 'System / Admin', `Added member ${newMember.name} to ${newMember.division}`);
  return newMember;
}

export function deleteMember(id: string): void {
  const current = getMembers();
  const target = current.find(m => m.id === id);
  if (!target) return;

  const updated = current.filter(m => m.id !== id);
  saveMembers(updated);
  serverDelete('/api/members', id);
  logAuditEvent('MEMBER_DELETED', 'System / Admin', `Removed member ${target.name} (${target.email})`);
}

export function bulkUpdateMembers(
  ids: string[],
  updates: Partial<Pick<Member, 'division' | 'role' | 'batch' | 'tier'>>,
  actorName: string
): Member[] {
  const current = getMembers();
  const targetIdSet = new Set(ids);
  let updatedCount = 0;

  const updated = current.map(m => {
    if (targetIdSet.has(m.id)) {
      updatedCount++;
      return { ...m, ...updates };
    }
    return m;
  });

  saveMembers(updated);
  // Bulk: patch each member individually
  ids.forEach(id => serverPatch('/api/members', id, updates));
  const changeSummary = Object.entries(updates)
    .filter(([_, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}='${v}'`)
    .join(', ');
  logAuditEvent('BULK_MEMBERS_UPDATED', actorName, `Bulk updated ${updatedCount} members with: ${changeSummary}`);
  return updated;
}

export function bulkDeleteMembers(ids: string[], actorName: string): Member[] {
  const current = getMembers();
  const targetIdSet = new Set(ids);
  // Protect super user m1
  targetIdSet.delete('m1');

  const updated = current.filter(m => !targetIdSet.has(m.id));
  saveMembers(updated);
  Array.from(targetIdSet).forEach(id => serverDelete('/api/members', id));
  logAuditEvent('BULK_MEMBERS_DELETED', actorName, `Bulk removed ${current.length - updated.length} members`);
  return updated;
}

// -------------------------------------------------------------
// Events
// -------------------------------------------------------------

export function getEvents(): EventItem[] {
  if (typeof window === 'undefined') return initialEvents;
  const saved = localStorage.getItem('leads_events');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure committees array exists
      return parsed.map((e: any) => ({
        ...e,
        committees: Array.isArray(e.committees) ? e.committees : []
      }));
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialEvents;
}

export function getEventById(id: string): EventItem | null {
  const events = getEvents();
  return events.find(e => e.id === id) || null;
}

export function saveEvents(events: EventItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_events', JSON.stringify(events));
  // Individual mutations use targeted serverPost/serverPatch/serverDelete
}

export function addEvent(event: Omit<EventItem, 'id' | 'committees'> & { committees?: EventCommittee[] }): EventItem {
  const events = getEvents();
  const newEvent: EventItem = {
    ...event,
    id: 'e_' + Date.now(),
    committees: event.committees || []
  };
  events.unshift(newEvent);
  saveEvents(events);
  serverPost('/api/events', newEvent);
  logAuditEvent('EVENT_CREATED', event.createdBy || 'User', `Created new event: ${newEvent.title}`);
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<EventItem>, actorName: string): EventItem | null {
  const events = getEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return null;

  events[idx] = { ...events[idx], ...updates };
  saveEvents(events);
  serverPatch('/api/events', id, updates);
  logAuditEvent('EVENT_UPDATED', actorName, `Updated event: ${events[idx].title}`);
  return events[idx];
}

export function deleteEvent(id: string, actorName: string): boolean {
  const events = getEvents();
  const target = events.find(e => e.id === id);
  if (!target) return false;

  const updated = events.filter(e => e.id !== id);
  saveEvents(updated);
  serverDelete('/api/events', id);
  logAuditEvent('EVENT_DELETED', actorName, `Deleted event: ${target.title}`);
  return true;
}

export function addEventCommittee(eventId: string, committeeName: string, actorName: string): EventItem | null {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  const newComm: EventCommittee = {
    id: 'comm_' + Date.now(),
    name: committeeName,
    memberIds: []
  };
  event.committees.push(newComm);
  saveEvents(events);
  // Committees are nested in event — patch the whole event object
  serverPatch('/api/events', eventId, { committees: event.committees });
  logAuditEvent('EVENT_COMMITTEE_ADDED', actorName, `Added committee "${committeeName}" to event "${event.title}"`);
  return event;
}

export function updateEventCommitteeMembers(eventId: string, committeeId: string, memberIds: string[], actorName: string): EventItem | null {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  const comm = event.committees.find(c => c.id === committeeId);
  if (!comm) return null;

  comm.memberIds = memberIds;
  saveEvents(events);
  serverPatch('/api/events', eventId, { committees: event.committees });
  logAuditEvent('EVENT_COMMITTEE_UPDATED', actorName, `Updated member assignments for committee "${comm.name}" in event "${event.title}"`);
  return event;
}

export function deleteEventCommittee(eventId: string, committeeId: string, actorName: string): EventItem | null {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  event.committees = event.committees.filter(c => c.id !== committeeId);
  saveEvents(events);
  serverPatch('/api/events', eventId, { committees: event.committees });
  logAuditEvent('EVENT_COMMITTEE_DELETED', actorName, `Removed committee from event "${event.title}"`);
  return event;
}

export function getCommittees(): string[] {
  const events = getEvents();
  const names = new Set<string>();
  events.forEach(e => {
    (e.committees || []).forEach(c => names.add(c.name));
  });
  if (names.size === 0) {
    return ['Logistics & Venue Committee', 'Technical & AV Committee', 'Design & Media Committee'];
  }
  return Array.from(names);
}

// -------------------------------------------------------------
// Tasks & Visibility Rule
// -------------------------------------------------------------

export function getTasks(): TaskItem[] {
  if (typeof window === 'undefined') return initialTasks;
  const saved = localStorage.getItem('leads_tasks');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialTasks;
}

export function saveTasks(tasks: TaskItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_tasks', JSON.stringify(tasks));
}

export function addTask(task: Omit<TaskItem, 'id' | 'status'> & { status?: TaskItem['status'] }): TaskItem {
  const tasks = getTasks();
  const newTask: TaskItem = {
    ...task,
    id: 't_' + Date.now(),
    status: task.status || 'Assigned'
  };
  tasks.unshift(newTask);
  saveTasks(tasks);
  serverPost('/api/tasks', newTask);
  logAuditEvent('TASK_CREATED', task.creatorName || 'User', `Assigned task: ${newTask.title} to ${newTask.assignee}`);
  return newTask;
}

export function updateTask(id: string, updates: Partial<TaskItem>, actorName: string): TaskItem | null {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;

  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks(tasks);
  serverPatch('/api/tasks', id, updates);
  logAuditEvent('TASK_UPDATED', actorName, `Updated task: ${tasks[idx].title}`);
  return tasks[idx];
}

export function updateTaskStatus(id: string, status: TaskItem['status'], actorName?: string): TaskItem | null {
  return updateTask(id, { status }, actorName || 'User');
}

export function deleteTask(id: string, actorName: string): boolean {
  const tasks = getTasks();
  const target = tasks.find(t => t.id === id);
  if (!target) return false;

  const updated = tasks.filter(t => t.id !== id);
  saveTasks(updated);
  serverDelete('/api/tasks', id);
  logAuditEvent('TASK_DELETED', actorName, `Deleted task: ${target.title}`);
  return true;
}

export function canViewTask(
  task: TaskItem, 
  user: { name: string; email: string; tier: number; division?: string; committee?: string } | null
): boolean {
  if (!user) return false;
  // Tier 1-3 (Super User, Centre Head, Head of Events): see all tasks
  if (user.tier <= 3) return true;
  // Tier 4 (Advisory Board): strategic read-only oversight
  if (user.tier === 4) return true;
  // Tier 5-6 (Core Committee, Training Associate): see their assigned tasks
  return Boolean(
    (task.assignee && task.assignee.toLowerCase() === user.name.toLowerCase()) ||
    (task.assigneeEmail && task.assigneeEmail.toLowerCase() === user.email.toLowerCase()) ||
    (task.assigneeId && task.assigneeId === (user as any).id)
  );
}

// -------------------------------------------------------------
// Ratings (Tied to Task Performance)
// -------------------------------------------------------------

export function getRatings(): RatingItem[] {
  if (typeof window === 'undefined') return initialRatings;
  const saved = localStorage.getItem('leads_ratings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialRatings;
}

export function saveRatings(ratings: RatingItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_ratings', JSON.stringify(ratings));
}

export function addRating(rating: Omit<RatingItem, 'id' | 'createdAt'>): RatingItem {
  const ratings = getRatings();
  const newRating: RatingItem = {
    ...rating,
    id: 'r_' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0]
  };
  ratings.unshift(newRating);
  saveRatings(ratings);
  serverPost('/api/ratings', newRating);

  // Update task with rating metadata
  if (rating.taskId) {
    updateTask(rating.taskId, { ratingScore: rating.overallScore, ratedAt: newRating.createdAt }, rating.raterName);
  }

  logAuditEvent('RATING_SUBMITTED', rating.raterName, `Evaluated task performance (${rating.overallScore}/5.0) for ${rating.targetName} on "${rating.taskTitle}"`);
  return newRating;
}

export function updateRating(id: string, updates: Partial<RatingItem>, actorName: string): RatingItem | null {
  const ratings = getRatings();
  const idx = ratings.findIndex(r => r.id === id);
  if (idx === -1) return null;

  ratings[idx] = { 
    ...ratings[idx], 
    ...updates, 
    updatedAt: new Date().toISOString().split('T')[0] 
  };
  saveRatings(ratings);
  serverPatch('/api/ratings', id, updates);

  if (ratings[idx].taskId && updates.overallScore) {
    updateTask(ratings[idx].taskId, { ratingScore: updates.overallScore }, actorName);
  }

  logAuditEvent('RATING_UPDATED', actorName, `Updated evaluation scorecard for ${ratings[idx].targetName}`);
  return ratings[idx];
}

export function deleteRating(id: string, actorName: string): boolean {
  const ratings = getRatings();
  const target = ratings.find(r => r.id === id);
  if (!target) return false;

  const updated = ratings.filter(r => r.id !== id);
  saveRatings(updated);
  serverDelete('/api/ratings', id);
  logAuditEvent('RATING_DELETED', actorName, `Deleted rating record for ${target.targetName}`);
  return true;
}

// Helper: Get ratable tasks (completed or in-progress)
export function getRatableTasks(): TaskItem[] {
  const tasks = getTasks();
  return tasks.filter(t => t.status === 'Completed' || t.status === 'In Progress');
}

// -------------------------------------------------------------
// Student Profiles & Individual Outcomes Aggregation
// -------------------------------------------------------------

export interface StudentProfileData {
  member: Member;
  assignedEvents: { event: EventItem; committee: EventCommittee }[];
  tasks: TaskItem[];
  ratings: RatingItem[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageRating: number;
    qualityAvg: number;
    timelinessAvg: number;
    initiativeAvg: number;
    collaborationAvg: number;
    totalEvents: number;
  };
}

export function getStudentProfile(memberIdOrName: string): StudentProfileData | null {
  const members = getMembers();
  const member = members.find(m => m.id === memberIdOrName || m.name.toLowerCase() === memberIdOrName.toLowerCase());
  if (!member) return null;

  const events = getEvents();
  const assignedEvents: { event: EventItem; committee: EventCommittee }[] = [];
  events.forEach(event => {
    (event.committees || []).forEach(comm => {
      if (comm.memberIds.includes(member.id) || comm.memberIds.includes(member.name)) {
        assignedEvents.push({ event, committee: comm });
      }
    });
  });

  const allTasks = getTasks();
  const memberTasks = allTasks.filter(t => 
    t.assigneeId === member.id || 
    t.assignee.toLowerCase() === member.name.toLowerCase() || 
    (member.email && t.assigneeEmail && t.assigneeEmail.toLowerCase() === member.email.toLowerCase())
  );

  const allRatings = getRatings();
  const memberRatings = allRatings.filter(r => 
    r.targetId === member.id || 
    r.targetName.toLowerCase() === member.name.toLowerCase()
  );

  const totalTasks = memberTasks.length;
  const completedTasks = memberTasks.filter(t => t.status === 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let qualitySum = 0, timelinessSum = 0, initiativeSum = 0, collaborationSum = 0, overallSum = 0;
  memberRatings.forEach(r => {
    qualitySum += r.quality;
    timelinessSum += r.timeliness;
    initiativeSum += r.initiative;
    collaborationSum += r.collaboration;
    overallSum += r.overallScore;
  });

  const ratingCount = memberRatings.length;
  const averageRating = ratingCount > 0 ? parseFloat((overallSum / ratingCount).toFixed(1)) : 0;
  const qualityAvg = ratingCount > 0 ? parseFloat((qualitySum / ratingCount).toFixed(1)) : 0;
  const timelinessAvg = ratingCount > 0 ? parseFloat((timelinessSum / ratingCount).toFixed(1)) : 0;
  const initiativeAvg = ratingCount > 0 ? parseFloat((initiativeSum / ratingCount).toFixed(1)) : 0;
  const collaborationAvg = ratingCount > 0 ? parseFloat((collaborationSum / ratingCount).toFixed(1)) : 0;

  return {
    member,
    assignedEvents,
    tasks: memberTasks,
    ratings: memberRatings,
    stats: {
      totalTasks,
      completedTasks,
      completionRate,
      averageRating,
      qualityAvg,
      timelinessAvg,
      initiativeAvg,
      collaborationAvg,
      totalEvents: assignedEvents.length
    }
  };
}

export function getStudentLeaderboard(): {
  id: string;
  name: string;
  role: string;
  division: string;
  score: number;
  completedTasks: number;
  totalTasks: number;
  ratingsCount: number;
}[] {
  const members = getMembers();
  // Filter for student contributors: Core Committee, Training Associates, Alumni
  const studentMembers = members.filter(m => m.division !== 'Advisory Board' && m.tier >= 5);
  
  const results = studentMembers.map(m => {
    const profile = getStudentProfile(m.id);
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      division: m.division,
      score: profile?.stats.averageRating || 0,
      completedTasks: profile?.stats.completedTasks || 0,
      totalTasks: profile?.stats.totalTasks || 0,
      ratingsCount: profile?.ratings.length || 0,
    };
  });

  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.completedTasks - a.completedTasks;
  });
}

// -------------------------------------------------------------
// Reimbursements (Two-Stage Approval)
// -------------------------------------------------------------

export function getReimbursements(): ReimbursementItem[] {
  if (typeof window === 'undefined') return initialReimbursements;
  const saved = localStorage.getItem('leads_reimbursements');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialReimbursements;
}

export function saveReimbursements(reimbursements: ReimbursementItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_reimbursements', JSON.stringify(reimbursements));
}

export function addReimbursement(item: Omit<ReimbursementItem, 'id' | 'status' | 'submittedAt'>): ReimbursementItem {
  const current = getReimbursements();
  const newClaim: ReimbursementItem = {
    ...item,
    id: 'rem_' + Date.now(),
    status: 'Pending',
    submittedAt: new Date().toISOString().split('T')[0]
  };
  current.unshift(newClaim);
  saveReimbursements(current);
  serverPost('/api/reimbursements', newClaim);
  logAuditEvent('REIMBURSEMENT_CLAIMED', item.memberName, `Submitted expense claim of ₹${item.amount} under ${item.category}`);
  return newClaim;
}

export function updateReimbursementStatus(
  id: string, 
  status: ReimbursementItem['status'],
  reviewerInfo?: { name: string; stage: 'firstPass' | 'final' }
): ReimbursementItem | null {
  const current = getReimbursements();
  const idx = current.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const claim = current[idx];
  claim.status = status;
  claim.decidedAt = new Date().toISOString().split('T')[0];

  if (reviewerInfo) {
    if (reviewerInfo.stage === 'firstPass') {
      claim.firstPassReviewer = reviewerInfo.name;
    } else {
      claim.finalApprover = reviewerInfo.name;
    }
    logAuditEvent('REIMBURSEMENT_STATUS_UPDATED', reviewerInfo.name, `Updated claim #${claim.id} status to "${status}" (${reviewerInfo.stage})`);
  }

  saveReimbursements(current);
  serverPatch('/api/reimbursements', id, { status: claim.status, decidedAt: claim.decidedAt, firstPassReviewer: claim.firstPassReviewer, finalApprover: claim.finalApprover });
  return claim;
}

export function deleteReimbursement(id: string, actorName: string): boolean {
  const current = getReimbursements();
  const target = current.find(r => r.id === id);
  if (!target) return false;

  const updated = current.filter(r => r.id !== id);
  saveReimbursements(updated);
  serverDelete('/api/reimbursements', id);
  logAuditEvent('REIMBURSEMENT_DELETED', actorName, `Deleted claim #${id} of ₹${target.amount}`);
  return true;
}

// -------------------------------------------------------------
// Announcements
// -------------------------------------------------------------

export function getAnnouncements(): AnnouncementItem[] {
  if (typeof window === 'undefined') return initialAnnouncements;
  const saved = localStorage.getItem('leads_announcements');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialAnnouncements;
}

export function saveAnnouncements(announcements: AnnouncementItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_announcements', JSON.stringify(announcements));
}

export function addAnnouncement(item: Omit<AnnouncementItem, 'id' | 'publishedAt'>): AnnouncementItem {
  const current = getAnnouncements();
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newAnn: AnnouncementItem = {
    ...item,
    id: 'a_' + Date.now(),
    publishedAt: formattedDate
  };
  current.unshift(newAnn);
  saveAnnouncements(current);
  serverPost('/api/announcements', newAnn);
  logAuditEvent('ANNOUNCEMENT_PUBLISHED', item.authorName, `Published announcement: "${item.title}" [Scope: ${item.scope}]`);
  return newAnn;
}

export function updateAnnouncement(id: string, updates: Partial<AnnouncementItem>, actorName: string): AnnouncementItem | null {
  const current = getAnnouncements();
  const idx = current.findIndex(a => a.id === id);
  if (idx === -1) return null;

  const now = new Date();
  current[idx] = { 
    ...current[idx], 
    ...updates, 
    editedAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` 
  };
  saveAnnouncements(current);
  serverPatch('/api/announcements', id, updates);
  logAuditEvent('ANNOUNCEMENT_UPDATED', actorName, `Updated announcement: "${current[idx].title}"`);
  return current[idx];
}

export function deleteAnnouncement(id: string, actorName: string): boolean {
  const current = getAnnouncements();
  const target = current.find(a => a.id === id);
  if (!target) return false;

  const updated = current.filter(a => a.id !== id);
  saveAnnouncements(updated);
  serverDelete('/api/announcements', id);
  logAuditEvent('ANNOUNCEMENT_DELETED', actorName, `Retracted announcement: "${target.title}"`);
  return true;
}

// -------------------------------------------------------------
// Forms & Submissions
// -------------------------------------------------------------

export function getForms(): PublicFormItem[] {
  if (typeof window === 'undefined') return initialForms;
  const saved = localStorage.getItem('leads_custom_forms');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialForms;
}

export function saveForms(forms: PublicFormItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('leads_custom_forms', JSON.stringify(forms));
}

export function addForm(form: Omit<PublicFormItem, 'id' | 'createdAt'>): PublicFormItem {
  const current = getForms();
  const newForm: PublicFormItem = {
    ...form,
    id: 'form_' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0]
  };
  current.unshift(newForm);
  saveForms(current);
  serverPost('/api/forms', newForm);
  logAuditEvent('FORM_CREATED', form.createdBy, `Created public form "${form.title}" at /forms/${form.slug}`);
  return newForm;
}

export function updateForm(id: string, updates: Partial<PublicFormItem>, actorName: string): PublicFormItem | null {
  const current = getForms();
  const idx = current.findIndex(f => f.id === id);
  if (idx === -1) return null;

  current[idx] = { ...current[idx], ...updates };
  saveForms(current);
  serverPatch('/api/forms', id, updates);
  logAuditEvent('FORM_UPDATED', actorName, `Updated public form "${current[idx].title}"`);
  return current[idx];
}

export function deleteForm(id: string, actorName: string): boolean {
  const current = getForms();
  const target = current.find(f => f.id === id);
  if (!target) return false;

  const updated = current.filter(f => f.id !== id);
  saveForms(updated);
  serverDelete('/api/forms', id);
  logAuditEvent('FORM_DELETED', actorName, `Deleted public form "${target.title}"`);
  return true;
}

export function isSlugUnique(slug: string, excludeFormId?: string): boolean {
  const current = getForms();
  return !current.some(f => f.slug.toLowerCase() === slug.toLowerCase() && f.id !== excludeFormId);
}

export function getSubmissions(): FormSubmissionItem[] {
  if (typeof window === 'undefined') return initialSubmissions;
  const saved = localStorage.getItem('leads_form_submissions');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Do NOT seed localStorage here — return sample data without writing
  return initialSubmissions;
}

export function addSubmission(sub: Omit<FormSubmissionItem, 'id' | 'submittedAt'>): FormSubmissionItem {
  const current = getSubmissions();
  const now = new Date();
  const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newSub: FormSubmissionItem = {
    ...sub,
    id: 'sub_' + Date.now(),
    submittedAt: formatted
  };
  current.unshift(newSub);
  if (typeof window !== 'undefined') {
    localStorage.setItem('leads_form_submissions', JSON.stringify(current));
    serverPost('/api/submissions', newSub);
  }
  logAuditEvent('FORM_SUBMITTED', 'Public Respondent', `New response submitted for form slug "${sub.slug}"`);
  return newSub;
}

// -------------------------------------------------------------
// Audit Logs
// -------------------------------------------------------------

export function getAuditLogs(): AuditLogItem[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('leads_audit_logs');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

export function logAuditEvent(action: string, actorName: string, details: string, actorEmail?: string): void {
  if (typeof window === 'undefined') return;
  const current = getAuditLogs();
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newLog: AuditLogItem = {
    id: 'log_' + Date.now(),
    action,
    actorName,
    actorEmail: actorEmail || 'system@msruas.ac.in',
    details,
    timestamp
  };
  current.unshift(newLog);
  // Keep last 100 logs in localStorage
  localStorage.setItem('leads_audit_logs', JSON.stringify(current.slice(0, 100)));
  // Push to server asynchronously (fire-and-forget)
  serverPost('/api/auditlogs', newLog);
}

