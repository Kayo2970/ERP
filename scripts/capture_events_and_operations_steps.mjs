import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = path.resolve('scratch/edge_operations_profile');
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const PORT = 9245;

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

const setReactInput = async (selector, value) => {
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('${selector}');
        if (!input) return false;
        const prototype = Object.getPrototypeOf(input);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter) {
          prototypeValueSetter.call(input, ${JSON.stringify(value)});
        } else {
          input.value = ${JSON.stringify(value)};
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()
    `
  });
  await new Promise(r => setTimeout(r, 100));
};

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

// ==========================================
// 1. MODULE: EVENTS MANAGEMENT
// ==========================================
console.log('\n--- 1. Capturing Events Management ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/events' });
await new Promise(r => setTimeout(r, 2500));

// Capture main events view
await capture('02_events_management', '01_events_main_view.png');

// Open Create Event modal
console.log('Opening Create Event Modal...');
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const createBtn = btns.find(b => b.innerText.includes('Create Event') || b.innerText.includes('New Event') || b.innerText.includes('Add Event'));
    if (createBtn) createBtn.click();
  `
});
await new Promise(r => setTimeout(r, 800));

// Fill in event modal fields if visible
await setReactInput('.fixed.inset-0.z-50 input[placeholder*="Title"], .fixed.inset-0.z-50 input[name="title"], .fixed.inset-0.z-50 input[type="text"]', 'National Youth Tech Conclave 2026');
await new Promise(r => setTimeout(r, 500));
await capture('02_events_management', '02_create_event_modal_filled.png');

// Close modal by clicking Cancel or close button or pressing Escape
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 600));

// Open first event details if available
console.log('Inspecting first event details...');
await send('Runtime.evaluate', {
  expression: `
    const eventCards = document.querySelectorAll('.cursor-pointer, [data-event-id], table tbody tr');
    if (eventCards.length > 0) eventCards[0].click();
  `
});
await new Promise(r => setTimeout(r, 1000));
await capture('02_events_management', '03_event_detail_committees.png');

// Close modal
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 600));

// ==========================================
// 2. MODULE: EVENT PASSES & SCANNER KIOSK
// ==========================================
console.log('\n--- 2. Capturing Event Passes & Scanner Kiosk ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/event-passes' });
await new Promise(r => setTimeout(r, 2500));
await capture('03_event_passes', '01_passes_studio_overview.png');

// Open Issue Pass modal
console.log('Opening Issue Pass Modal...');
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const issueBtn = btns.find(b => b.innerText.includes('Issue Pass') || b.innerText.includes('Create Pass') || b.innerText.includes('New Pass') || b.innerText.includes('Generate'));
    if (issueBtn) issueBtn.click();
  `
});
await new Promise(r => setTimeout(r, 800));

await setReactInput('.fixed.inset-0.z-50 input[placeholder*="Name"], .fixed.inset-0.z-50 input[name="name"]', 'Dr. Vikram Sarabhai');
await setReactInput('.fixed.inset-0.z-50 input[placeholder*="Email"], .fixed.inset-0.z-50 input[name="email"]', 'vikram.sarabhai@isro.gov.in');
await new Promise(r => setTimeout(r, 500));
await capture('03_event_passes', '02_issue_pass_modal_filled.png');

// Close modal
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 600));

// Click Scanner tab or open scanner
console.log('Switching to Scanner Kiosk...');
await send('Runtime.evaluate', {
  expression: `
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const scannerTab = tabs.find(b => b.innerText.includes('Scanner') || b.innerText.includes('Check-in') || b.innerText.includes('Scan Passes'));
    if (scannerTab) scannerTab.click();
  `
});
await new Promise(r => setTimeout(r, 1200));
await capture('03_event_passes', '03_live_scanner_kiosk.png');

// ==========================================
// 3. MODULE: TASKS & GANTT TIMELINE
// ==========================================
console.log('\n--- 3. Capturing Tasks & Gantt Timeline ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/tasks' });
await new Promise(r => setTimeout(r, 2500));
await capture('04_tasks_gantt', '01_tasks_board_view.png');

// Open New Task Modal
console.log('Opening New Task Modal...');
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const newBtn = btns.find(b => b.innerText.includes('New Task') || b.innerText.includes('Create Task') || b.innerText.includes('Add Task'));
    if (newBtn) newBtn.click();
  `
});
await new Promise(r => setTimeout(r, 800));

await setReactInput('.fixed.inset-0.z-50 input[placeholder*="Title"], .fixed.inset-0.z-50 input[name="title"]', 'Stage LED Wall Configuration & AV Soundcheck');
await setReactInput('.fixed.inset-0.z-50 textarea', 'Calibrate resolution 3840x2160, verify dual wireless lapel mics, and test HDMI video switchers.');
await new Promise(r => setTimeout(r, 500));
await capture('04_tasks_gantt', '02_new_task_modal_filled.png');

// Close modal
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 600));

// Switch to Gantt Timeline tab if available
console.log('Switching to Gantt Timeline tab...');
await send('Runtime.evaluate', {
  expression: `
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const ganttTab = tabs.find(b => b.innerText.includes('Timeline') || b.innerText.includes('Gantt'));
    if (ganttTab) ganttTab.click();
  `
});
await new Promise(r => setTimeout(r, 1200));
await capture('04_tasks_gantt', '03_gantt_timeline_active.png');

// ==========================================
// 4. MODULE: PROCUREMENT REQUISITIONS
// ==========================================
console.log('\n--- 4. Capturing Procurement Requisitions ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/procurement' });
await new Promise(r => setTimeout(r, 2500));
await capture('05_procurement', '01_procurement_requests_table.png');

// Open New Requisition modal
console.log('Opening New Requisition Modal...');
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const reqBtn = btns.find(b => b.innerText.includes('New Request') || b.innerText.includes('Create Request') || b.innerText.includes('Add Requisition'));
    if (reqBtn) reqBtn.click();
  `
});
await new Promise(r => setTimeout(r, 800));

await setReactInput('.fixed.inset-0.z-50 input[placeholder*="Item"], .fixed.inset-0.z-50 input[name="itemName"]', 'Heavy-Duty Industrial Extension Cables & Power Strips');
await setReactInput('.fixed.inset-0.z-50 input[type="number"]', '12500');
await new Promise(r => setTimeout(r, 500));
await capture('05_procurement', '02_new_requisition_modal.png');

// Close modal
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 600));

// ==========================================
// 5. MODULE: FINANCIAL REIMBURSEMENTS
// ==========================================
console.log('\n--- 5. Capturing Financial Reimbursements ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/reimbursements' });
await new Promise(r => setTimeout(r, 2500));
await capture('06_reimbursements', '01_reimbursements_pipeline_view.png');

// Open Submit Claim modal
console.log('Opening Submit Claim Modal...');
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const claimBtn = btns.find(b => b.innerText.includes('Submit Claim') || b.innerText.includes('New Claim') || b.innerText.includes('Add Expense'));
    if (claimBtn) claimBtn.click();
  `
});
await new Promise(r => setTimeout(r, 800));

await setReactInput('.fixed.inset-0.z-50 input[placeholder*="Title"], .fixed.inset-0.z-50 input[name="title"]', 'VIP Guest Transport & Airport Escort Fuel Charges');
await setReactInput('.fixed.inset-0.z-50 input[type="number"]', '3450');
await new Promise(r => setTimeout(r, 500));
await capture('06_reimbursements', '02_submit_claim_modal_filled.png');

// Close modal
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 button'));
    const cancelBtn = btns.find(b => b.innerText.includes('Cancel') || b.innerText.includes('Close'));
    if (cancelBtn) cancelBtn.click();
  `
});
await new Promise(r => setTimeout(r, 600));

// Open first claim details / verification modal
console.log('Opening Claim Audit Modal...');
await send('Runtime.evaluate', {
  expression: `
    const rows = document.querySelectorAll('table tbody tr, .cursor-pointer');
    if (rows.length > 0) rows[0].click();
  `
});
await new Promise(r => setTimeout(r, 1000));
await capture('06_reimbursements', '03_dual_gate_verification_audit.png');

// ==========================================
// 6. MODULE: BUDGETING & FUNDS
// ==========================================
console.log('\n--- 6. Capturing Budgeting & Funds ---');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/budget' });
await new Promise(r => setTimeout(r, 2500));
await capture('07_budgeting', '01_budget_pnl_ledger.png');

// Open New Allocation / Income modal if available
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Add Allocation') || b.innerText.includes('New Budget') || b.innerText.includes('Add Income'));
    if (addBtn) addBtn.click();
  `
});
await new Promise(r => setTimeout(r, 800));
await capture('07_budgeting', '02_add_allocation_modal.png');

console.log('✨ All operation modules captured successfully!');
edgeProc.kill();
process.exit(0);
