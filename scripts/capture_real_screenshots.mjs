import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = path.resolve('scratch/edge_profile');
const SCREENSHOT_DIR = path.resolve('docs/screenshots');

fs.mkdirSync(USER_DATA_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const PORT = 9222;

const routes = [
  { name: '01_login_portal.png', path: '/' },
  { name: '02_dashboard_home.png', path: '/dashboard/home' },
  { name: '03_events_management.png', path: '/dashboard/events' },
  { name: '04_event_passes.png', path: '/dashboard/event-passes' },
  { name: '05_tasks_gantt.png', path: '/dashboard/tasks' },
  { name: '06_performance_ratings.png', path: '/dashboard/ratings' },
  { name: '07_procurement.png', path: '/dashboard/procurement' },
  { name: '08_reimbursements.png', path: '/dashboard/reimbursements' },
  { name: '09_budgeting_funds.png', path: '/dashboard/budget' },
  { name: '10_design_portal.png', path: '/dashboard/designs' },
  { name: '11_dynamic_forms.png', path: '/dashboard/forms' },
  { name: '12_visiting_card.png', path: '/dashboard/visiting-card' },
  { name: '13_guest_directory.png', path: '/dashboard/guest-directory' },
  { name: '14_mail_merge_invites.png', path: '/dashboard/guest-invites' },
  { name: '15_announcements.png', path: '/dashboard/announcements' },
  { name: '16_master_calendar.png', path: '/dashboard/calendar' },
  { name: '17_festivals.png', path: '/dashboard/festivals' },
  { name: '18_event_reports.png', path: '/dashboard/event-reports' },
  { name: '19_reports_analytics.png', path: '/dashboard/reports' },
  { name: '20_approvals_inbox.png', path: '/dashboard/approvals' },
  { name: '21_members_directory.png', path: '/dashboard/directory' },
  { name: '22_group_policies.png', path: '/dashboard/policies' },
  { name: '23_email_management.png', path: '/dashboard/email' },
  { name: '24_backup_restore.png', path: '/dashboard/backup' },
  { name: '25_system_settings.png', path: '/dashboard/settings' },
];

async function main() {
  console.log('🚀 Starting headless Edge on port ' + PORT + '...');
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'http://localhost:3030/'
  ]);

  // Wait for Edge CDP to become available
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }

  if (!versionData) {
    console.error('❌ Failed to connect to Edge CDP endpoint');
    edgeProc.kill();
    process.exit(1);
  }

  console.log('✅ Connected to Edge:', versionData.Browser);

  // Get active target or create one
  const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const targets = await targetsRes.json();
  let target = targets.find(t => t.type === 'page');
  if (!target) {
    const newTargetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?http://localhost:3030/`);
    target = await newTargetRes.json();
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(r => ws.onopen = r);
  console.log('🔌 WebSocket connected to page target');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Inject session auth into localStorage
  const authSetupCode = `
    try {
      localStorage.setItem('user', JSON.stringify({
        id: 'm1',
        name: 'Kayomarz Pavri',
        email: 'kayo2970@gmail.com',
        role: 'Super User',
        tier: 1,
        division: 'Core Committee',
        department: 'Events',
        committee: 'All Committees'
      }));
      localStorage.setItem('leads_session_token', '0b66288225aab6bee121dd44e65b349b002dce596e4433c6349b2561999b8e12');
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
      'AUTH_INJECTED';
    } catch(e) { e.message; }
  `;

  for (const item of routes) {
    console.log(`📸 Capturing ${item.name} (${item.path})...`);
    
    // If not the login page, ensure auth is in place
    if (item.path !== '/') {
      await send('Runtime.evaluate', { expression: authSetupCode });
    } else {
      // Clear user for login screenshot
      await send('Runtime.evaluate', { expression: "localStorage.clear();" });
    }

    await send('Page.navigate', { url: `http://localhost:3030${item.path}` });
    
    // Wait for page hydration & data rendering
    await new Promise(r => setTimeout(r, 2200));

    // Re-ensure dark theme is applied cleanly
    await send('Runtime.evaluate', { expression: "document.documentElement.classList.add('dark');" });
    await new Promise(r => setTimeout(r, 300));

    const shot = await send('Page.captureScreenshot', { format: 'png', quality: 90 });
    const buffer = Buffer.from(shot.data, 'base64');
    const outPath = path.join(SCREENSHOT_DIR, item.name);
    fs.writeFileSync(outPath, buffer);
    console.log(`   ✔ Saved ${item.name} (${Math.round(buffer.length / 1024)} KB)`);
  }

  console.log('✨ All 25 live screenshots successfully captured!');
  ws.close();
  edgeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
