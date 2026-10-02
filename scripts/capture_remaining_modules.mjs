import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = path.resolve('scratch/edge_remaining_profile');
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const PORT = 9255;

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

// 1. DESIGN PORTAL
console.log('\n--- Capturing Design Portal ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/designs' });
await new Promise(r => setTimeout(r, 2500));
await capture('08_design_portal', '01_designs_gallery_view.png');

await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const uploadBtn = btns.find(b => b.innerText.includes('Upload') || b.innerText.includes('New Design') || b.innerText.includes('Add Creative'));
    if (uploadBtn) uploadBtn.click();
  `
});
await new Promise(r => setTimeout(r, 800));
await capture('08_design_portal', '02_upload_creative_modal.png');

// Close modal
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 500));

// 2. FORMS MANAGEMENT
console.log('\n--- Capturing Dynamic Forms ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/forms' });
await new Promise(r => setTimeout(r, 2500));
await capture('09_dynamic_forms', '01_forms_management_view.png');

await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const formBtn = btns.find(b => b.innerText.includes('Create Form') || b.innerText.includes('New Form') || b.innerText.includes('Add Form'));
    if (formBtn) formBtn.click();
  `
});
await new Promise(r => setTimeout(r, 1000));
await capture('09_dynamic_forms', '02_form_builder_canvas.png');

// 3. VISITING CARD
console.log('\n--- Capturing Visiting Card ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/visiting-card' });
await new Promise(r => setTimeout(r, 3000));
await capture('10_visiting_card', '01_visiting_card_3d_keycard.png');

// 4. GUEST DIRECTORY
console.log('\n--- Capturing Guest Directory ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/guest-directory' });
await new Promise(r => setTimeout(r, 2500));
await capture('11_guest_directory', '01_guest_roster_table.png');

await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const addGuestBtn = btns.find(b => b.innerText.includes('Add Guest') || b.innerText.includes('New Guest'));
    if (addGuestBtn) addGuestBtn.click();
  `
});
await new Promise(r => setTimeout(r, 800));
await capture('11_guest_directory', '02_add_guest_ocr_modal.png');

// Close modal
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 500));

// 5. APPROVALS INBOX
console.log('\n--- Capturing Approvals Inbox ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/approvals' });
await new Promise(r => setTimeout(r, 2500));
await capture('12_approvals_inbox', '01_unified_approvals_queue.png');

console.log('✨ All remaining modules captured successfully!');
edgeProc.kill();
process.exit(0);
