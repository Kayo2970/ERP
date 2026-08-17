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
  createdAt: string;
}

export interface ReimbursementItem {
  id: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  category: string;
  description: string;
  receiptUrl?: string;
  status: 'Pending' | 'Approved' | 'Denied';
  bankDetails: string;
  submittedAt: string;
}

// Initial mock data matching leadership website and dashboard requirements
const initialMembers: Member[] = [
  { id: 'm1', name: 'Kayomarz Pavri', email: 'kayomarz.pavri@msruas.ac.in', role: 'Super User', tier: 1, committee: 'All Committees' },
  { id: 'm2', name: 'Dr. Subhadeep Mukherjee', email: 'subhadeep.mukherjee@msruas.ac.in', role: 'Centre Head', tier: 2, committee: 'Executive Council' },
  { id: 'm3', name: 'Dr. Kiran Kumar B M', email: 'kiran.kumar@msruas.ac.in', role: 'Head of Events', tier: 3, committee: 'Executive Council' },
  { id: 'm4', name: 'Dr. K. M. Sharath Kumar', email: 'sharath.kumar@msruas.ac.in', role: 'Advisory Board', tier: 4, committee: 'Executive Council' },
  { id: 'm5', name: 'Gurutejas C', email: 'gurutejas.c@msruas.ac.in', role: 'Core Committee', tier: 5, committee: 'Senior Student Leadership' },
  { id: 'm6', name: 'Kunal Bhadauria', email: 'kunal.bhadauria@msruas.ac.in', role: 'Training Associate', tier: 6, committee: 'Organizing Committee' },
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
  { id: 'e1', title: 'Tech Conclave 2026', description: 'Annual tech symposium featuring sustainability and AI panels.', startDate: '2026-09-10', endDate: '2026-09-12', committee: 'Senior Student Leadership', status: 'active' },
  { id: 'e2', title: 'Alumni Meet 2026', description: 'Reunion meet for RUAS alumni sharing entrepreneurial journeys.', startDate: '2026-10-05', endDate: '2026-10-06', committee: 'Organizing Committee', status: 'planned' },
  { id: 'e3', title: 'Robotics Workshop', description: 'Hands-on bootcamp on ROS and robot assembly.', startDate: '2026-08-25', endDate: '2026-08-27', committee: 'All Committees', status: 'planned' },
  { id: 'e4', title: 'Webinar Series', description: 'Expert online talks on sustainable leadership.', startDate: '2026-08-15', endDate: '2026-08-18', committee: 'Executive Council', status: 'active' },
];

const initialTasks: TaskItem[] = [
  { id: 't1', title: 'Prepare Event Budget Spreadsheet', event: 'Tech Conclave 2026', eventId: 'e1', assignee: 'Gurutejas C', assigneeEmail: 'gurutejas.c@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-20', status: 'Assigned' },
  { id: 't2', title: 'Coordinate Speaker Panel Invitations', event: 'Alumni Meet 2026', eventId: 'e2', assignee: 'Kunal Bhadauria', assigneeEmail: 'kunal.bhadauria@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-22', status: 'In Progress' },
  { id: 't3', title: 'Setup Audio-Visual Check', event: 'Robotics Workshop', eventId: 'e3', assignee: 'Keerthan J', assigneeEmail: 'keerthan.j@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-25', status: 'Assigned' },
  { id: 't4', title: 'Compile Feedback Survey Results', event: 'Webinar Series', eventId: 'e4', assignee: 'Gurutejas C', assigneeEmail: 'gurutejas.c@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-18', status: 'Pending Extension' },
  { id: 't5', title: 'Finalize Event Banners & Design Assets', assignee: 'Organizing Committee', assigneeType: 'committee', dueDate: '2026-08-12', status: 'Completed' },
  { id: 't6', title: 'Confirm Catering Service Layout', event: 'Tech Conclave 2026', eventId: 'e1', assignee: 'Keerthan J', assigneeEmail: 'keerthan.j@msruas.ac.in', assigneeType: 'individual', dueDate: '2026-08-14', status: 'Completed' },
];

const initialRatings: RatingItem[] = [
  { id: 'r1', targetType: 'individual', targetName: 'Gurutejas C', targetId: 'm5', raterName: 'Dr. Kiran Kumar B M', quality: 5, timeliness: 4, initiative: 5, collaboration: 5, overallScore: 4.8, notes: 'Excellent leadership in tech conclave organization.', createdAt: '2026-08-14' },
  { id: 'r2', targetType: 'committee', targetName: 'Organizing Committee', targetId: 'Organizing Committee', raterName: 'Dr. Subhadeep Mukherjee', quality: 4, timeliness: 4, initiative: 5, collaboration: 4, overallScore: 4.3, notes: 'Design tasks completed early, very prompt.', createdAt: '2026-08-13' },
];

const initialReimbursements: ReimbursementItem[] = [
  { id: 'rem1', memberName: 'Gurutejas C', memberEmail: 'gurutejas.c@msruas.ac.in', amount: 4500, category: 'Printing & Stationary', description: 'Banners and feedback card prints for Tech Conclave.', receiptUrl: 'receipt_tech.pdf', status: 'Pending', bankDetails: 'HDFC BANK - A/C 50100293849182 - IFSC HDFC0000123', submittedAt: '2026-08-15' },
  { id: 'rem2', memberName: 'Kunal Bhadauria', memberEmail: 'kunal.bhadauria@msruas.ac.in', amount: 1200, category: 'Catering / Refreshments', description: 'Snacks for speaker panel preliminary meet.', receiptUrl: 'receipt_catering.jpg', status: 'Approved', bankDetails: 'SBI - A/C 30928349182 - IFSC SBIN0004921', submittedAt: '2026-08-10' },
];

const isBrowser = typeof window !== 'undefined';

export function initializeData() {
  if (!isBrowser) return;
  if (!localStorage.getItem('leads_members')) {
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
}

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
  const newMember = { ...member, id: 'm_' + Date.now() };
  members.push(newMember);
  saveMembers(members);
  return newMember;
}

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
  return newEvent;
}

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
  return newTask;
}

export function updateTaskStatus(id: string, status: TaskItem['status']) {
  const tasks = getTasks();
  const updated = tasks.map(t => t.id === id ? { ...t, status } : t);
  saveTasks(updated);
}

// Ratings Functions
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
  const newRating = { 
    ...rating, 
    id: 'r_' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0] 
  };
  ratings.push(newRating);
  saveRatings(ratings);
  return newRating;
}

// Reimbursements Functions
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
  const newReimbursement = {
    ...reimbursement,
    id: 'rem_' + Date.now(),
    status: 'Pending' as const,
    submittedAt: new Date().toISOString().split('T')[0]
  };
  reimbursements.push(newReimbursement);
  saveReimbursements(reimbursements);
  return newReimbursement;
}

export function updateReimbursementStatus(id: string, status: ReimbursementItem['status']) {
  const reimbursements = getReimbursements();
  const updated = reimbursements.map(r => r.id === id ? { ...r, status } : r);
  saveReimbursements(updated);
}
