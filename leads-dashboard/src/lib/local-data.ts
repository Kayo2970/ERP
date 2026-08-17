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
  event: string;
  eventId: string;
  assignee: string;
  assigneeEmail: string;
  dueDate: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Pending Extension';
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
];

const initialEvents: EventItem[] = [
  { id: 'e1', title: 'Tech Conclave 2026', description: 'Annual tech symposium featuring sustainability and AI panels.', startDate: '2026-09-10', endDate: '2026-09-12', committee: 'Senior Student Leadership', status: 'active' },
  { id: 'e2', title: 'Alumni Meet 2026', description: 'Reunion meet for RUAS alumni sharing entrepreneurial journeys.', startDate: '2026-10-05', endDate: '2026-10-06', committee: 'Organizing Committee', status: 'planned' },
  { id: 'e3', title: 'Robotics Workshop', description: 'Hands-on bootcamp on ROS and robot assembly.', startDate: '2026-08-25', endDate: '2026-08-27', committee: 'All Committees', status: 'planned' },
  { id: 'e4', title: 'Webinar Series', description: 'Expert online talks on sustainable leadership.', startDate: '2026-08-15', endDate: '2026-08-18', committee: 'Executive Council', status: 'active' },
];

const initialTasks: TaskItem[] = [
  { id: 't1', title: 'Prepare Event Budget Spreadsheet', event: 'Tech Conclave 2026', eventId: 'e1', assignee: 'Gurutejas C', assigneeEmail: 'gurutejas.c@msruas.ac.in', dueDate: '2026-08-20', status: 'Assigned' },
  { id: 't2', title: 'Coordinate Speaker Panel Invitations', event: 'Alumni Meet 2026', eventId: 'e2', assignee: 'Kunal Bhadauria', assigneeEmail: 'kunal.bhadauria@msruas.ac.in', dueDate: '2026-08-22', status: 'In Progress' },
  { id: 't3', title: 'Setup Audio-Visual Check', event: 'Robotics Workshop', eventId: 'e3', assignee: 'Keerthan J', assigneeEmail: 'keerthan.j@msruas.ac.in', dueDate: '2026-08-25', status: 'Assigned' },
  { id: 't4', title: 'Compile Feedback Survey Results', event: 'Webinar Series', eventId: 'e4', assignee: 'Gurutejas C', assigneeEmail: 'gurutejas.c@msruas.ac.in', dueDate: '2026-08-18', status: 'Pending Extension' },
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
