import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = path.resolve('scratch/edge_final_modules_profile');
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const PORT = 9260;

console.log('🚀 Launching Edge on port ' + PORT + '...');

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

let versionData = null;
for (let i = 0; i < 20; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (res.ok) {
      versionData = await res.json();
      break;
    }
  } catch {}
  await new Promise(r => setTimeout(r, 400));
}

if (!versionData) {
  console.error('❌ Failed to connect to Edge CDP endpoint');
  edgeProc.kill();
  process.exit(1);
}

const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
const targets = await targetsRes.json();
const target = targets.find(t => t.type === 'page');

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
await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');

async function capture(subfolder, filename) {
  const targetDocs = path.resolve('docs/screenshots/steps', subfolder);
  const targetPublic = path.resolve('leads-dashboard/public/screenshots/steps', subfolder);
  fs.mkdirSync(targetDocs, { recursive: true });
  fs.mkdirSync(targetPublic, { recursive: true });

  const screenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const buffer = Buffer.from(screenshot.data, 'base64');
  fs.writeFileSync(path.join(targetDocs, filename), buffer);
  fs.writeFileSync(path.join(targetPublic, filename), buffer);
  console.log(`📸 Saved [${subfolder}]: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// Authenticate session as Super User
console.log('Authenticating Super User session...');
await send('Runtime.evaluate', {
  expression: `
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
  `
});

// 1. ANNOUNCEMENTS
console.log('\n--- Capturing Announcements ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/announcements' });
await new Promise(r => setTimeout(r, 2500));
await capture('13_announcements', '01_announcements_feed_view.png');

await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('New Announcement') || b.innerText.includes('Publish Announcement'));
    if (btn) btn.click();
  `
});
await new Promise(r => setTimeout(r, 800));
await capture('13_announcements', '02_new_announcement_modal.png');

// Close modal
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button, .fixed.inset-0 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close') || b.querySelector('svg.lucide-x'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 500));

// 2. CALENDAR & FESTIVALS
console.log('\n--- Capturing Master Calendar & Festivals ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/calendar' });
await new Promise(r => setTimeout(r, 2500));
await capture('14_calendar_festivals', '01_master_calendar_month_view.png');

await send('Page.navigate', { url: 'http://localhost:3030/dashboard/festivals' });
await new Promise(r => setTimeout(r, 2500));
await capture('14_calendar_festivals', '02_festivals_and_holidays_view.png');

// 3. EVENT REPORTS & ANALYTICS
console.log('\n--- Capturing Event Reports & Analytics ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/event-reports' });
await new Promise(r => setTimeout(r, 2500));
await capture('15_event_reports', '01_event_reports_rubric_portal.png');

await send('Page.navigate', { url: 'http://localhost:3030/dashboard/reports' });
await new Promise(r => setTimeout(r, 2500));
await capture('15_event_reports', '02_executive_analytics_charts.png');

// 4. GROUP POLICIES
console.log('\n--- Capturing Group Policies ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/policies' });
await new Promise(r => setTimeout(r, 2500));
await capture('16_group_policies', '01_group_policies_matrix_view.png');

await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('New Policy Tag'));
    if (btn) btn.click();
  `
});
await new Promise(r => setTimeout(r, 800));
await capture('16_group_policies', '02_create_policy_modal.png');

// Close modal
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button, .fixed.inset-0 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close') || b.querySelector('svg.lucide-x'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 500));

// 5. EMAIL ENGINE
console.log('\n--- Capturing Email Engine ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/email' });
await new Promise(r => setTimeout(r, 2500));

// Switch to Settings tab
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('SMTP') || b.innerText.includes('Settings') || b.innerText.includes('Configuration'));
    if (btn) btn.click();
  `
});
await new Promise(r => setTimeout(r, 1000));
await capture('17_email_engine', '01_email_engine_smtp_config.png');

// Switch to Outbox tab
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Outbox') || b.innerText.includes('Audit Logs') || b.innerText.includes('Sent'));
    if (btn) btn.click();
  `
});
await new Promise(r => setTimeout(r, 1000));
await capture('17_email_engine', '02_email_outbox_queue_logs.png');

// 6. SYSTEM SETTINGS
console.log('\n--- Capturing System Settings ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/settings' });
await new Promise(r => setTimeout(r, 2500));
await capture('18_settings', '01_system_account_security_view.png');

// Switch to Audit tab
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Audit Trail') || b.innerText.includes('Audit Logs') || b.innerText.includes('Activity'));
    if (btn) btn.click();
  `
});
await new Promise(r => setTimeout(r, 1000));
await capture('18_settings', '02_system_audit_trail_view.png');

// 7. BACKUP & RESTORE
console.log('\n--- Capturing Backup & Restore ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/backup' });
await new Promise(r => setTimeout(r, 2500));
await capture('19_backup_restore', '01_encrypted_backup_dr_view.png');

console.log('✨ All final remaining modules captured successfully!');
edgeProc.kill();
process.exit(0);
