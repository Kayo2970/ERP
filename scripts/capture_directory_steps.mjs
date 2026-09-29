import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = path.resolve('scratch/edge_directory_profile');
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const TARGET_DIR_DOCS = path.resolve('docs/screenshots/steps/01_members_directory');
const TARGET_DIR_PUBLIC = path.resolve('leads-dashboard/public/screenshots/steps/01_members_directory');
fs.mkdirSync(TARGET_DIR_DOCS, { recursive: true });
fs.mkdirSync(TARGET_DIR_PUBLIC, { recursive: true });

const PORT = 9232;

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

async function capture(filename) {
  const screenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const buffer = Buffer.from(screenshot.data, 'base64');
  const pathDocs = path.join(TARGET_DIR_DOCS, filename);
  const pathPublic = path.join(TARGET_DIR_PUBLIC, filename);
  fs.writeFileSync(pathDocs, buffer);
  fs.writeFileSync(pathPublic, buffer);
  console.log(`📸 Saved: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// 1. Authenticate session
console.log('Authenticating session...');
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

// Navigate to Directory
console.log('Navigating to /dashboard/directory...');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/directory' });
await new Promise(r => setTimeout(r, 3000));

// Ensure search input is clear
await setReactInput('input[placeholder*="Search"]', '');
await new Promise(r => setTimeout(r, 600));

// Capture 01: Main Directory View
console.log('Capturing 01_directory_main_view.png...');
await capture('01_directory_main_view.png');

// Capture 02: Open Add Member Modal and fill details
console.log('Opening Add Member Modal...');
await send('Runtime.evaluate', {
  expression: `
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Add Member'));
    if (addBtn) addBtn.click();
  `
});
await new Promise(r => setTimeout(r, 800));

await setReactInput('.fixed.inset-0.z-50 input[placeholder*="Ananya Sharma"]', 'Ananya Sharma');
await setReactInput('.fixed.inset-0.z-50 input[placeholder*="ananya.s@msruas.ac.in"]', 'ananya.sharma@msruas.ac.in');

// Set division to Core Committee
await send('Runtime.evaluate', {
  expression: `
    const selects = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 select'));
    if (selects[0]) {
      selects[0].value = 'Core Committee';
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
  `
});
await new Promise(r => setTimeout(r, 300));

// Set position and department
await send('Runtime.evaluate', {
  expression: `
    const selects = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 select'));
    if (selects[1]) {
      selects[1].value = 'Department Head';
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (selects[2]) {
      selects[2].value = 'Operations & Logistics';
      selects[2].dispatchEvent(new Event('change', { bubbles: true }));
    }
  `
});
await new Promise(r => setTimeout(r, 300));

await setReactInput('.fixed.inset-0.z-50 input[placeholder*="B.Tech CSE"]', 'B.Tech Computer Science & Engineering');
await setReactInput('.fixed.inset-0.z-50 input[placeholder*="2022 - 2026"]', '2023 - 2027');

console.log('Capturing 02_add_member_modal_filled.png...');
await capture('02_add_member_modal_filled.png');

// Capture 03: Faculty Events Head with GG Campus
console.log('Switching to Faculty Events Head...');
await send('Runtime.evaluate', {
  expression: `
    const selects = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 select'));
    if (selects[0]) {
      selects[0].value = 'Faculty';
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
  `
});
await new Promise(r => setTimeout(r, 300));

await send('Runtime.evaluate', {
  expression: `
    const selects = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 select'));
    if (selects[1]) {
      selects[1].value = 'Events Head';
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
  `
});
await new Promise(r => setTimeout(r, 300));

await send('Runtime.evaluate', {
  expression: `
    const selects = Array.from(document.querySelectorAll('.fixed.inset-0.z-50 select'));
    if (selects[2]) {
      selects[2].value = 'GG Campus';
      selects[2].dispatchEvent(new Event('change', { bubbles: true }));
    }
  `
});
await new Promise(r => setTimeout(r, 600));

console.log('Capturing 03_faculty_campus_subselection.png...');
await capture('03_faculty_campus_subselection.png');

// Close Add Member modal
await send('Runtime.evaluate', {
  expression: `
    const modal = document.querySelector('.fixed.inset-0.z-50');
    if (modal) {
      const cancelBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    }
  `
});
await new Promise(r => setTimeout(r, 800));

// Capture 04: Set Password Modal for Aarav Sharma
console.log('Opening Set Password modal on Aarav Sharma...');
await send('Runtime.evaluate', {
  expression: `
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const aaravRow = rows.find(r => r.textContent.includes('Aarav'));
    if (aaravRow) {
      const lockBtn = aaravRow.querySelector('button[title*="Set Password Directly"]');
      if (lockBtn) lockBtn.click();
    }
  `
});
await new Promise(r => setTimeout(r, 800));

await setReactInput('.fixed.inset-0.z-50 input[placeholder*="password"]', 'MSRUAS@LEADS#2026');
await new Promise(r => setTimeout(r, 400));

console.log('Capturing 04_set_password_modal.png...');
await capture('04_set_password_modal.png');

// Close any modal and refresh directory view to guarantee clean state
console.log('Navigating to directory for clean Student Profile view...');
await send('Page.navigate', { url: 'http://localhost:3030/dashboard/directory' });
await new Promise(r => setTimeout(r, 2500));

// Capture 05: Student Profile Dossier for Aarav Sharma
console.log('Opening Student Profile Modal for Aarav Sharma...');
const clickRes = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const aaravRow = rows.find(r => r.textContent.includes('Aarav'));
      if (!aaravRow) return 'Aarav row not found';
      const profileBtn = aaravRow.querySelector('button[title*="View Student Profile"]');
      if (!profileBtn) return 'Profile button not found';
      profileBtn.click();
      return 'Clicked profile button successfully';
    })()
  `
});
console.log('Click result:', clickRes.result.value);
await new Promise(r => setTimeout(r, 1500));

console.log('Capturing 05_member_profile_dossier.png...');
await capture('05_member_profile_dossier.png');

ws.close();
edgeProc.kill();
console.log('🎉 All Members Directory captures successfully refreshed!');
