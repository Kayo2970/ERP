import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = path.resolve('scratch/edge_setup_profile');
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const SETUP_DIR = 'docs/screenshots/steps/00_setup';
const PUBLIC_SETUP_DIR = 'leads-dashboard/public/screenshots/steps/00_setup';
fs.mkdirSync(SETUP_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_SETUP_DIR, { recursive: true });

async function run() {
  console.log('🚀 Launching Edge for Setup & Payment screenshots...');
  const PORT = 9226;
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
    await new Promise(r => setTimeout(r, 500));
  }

  if (!versionData) {
    console.error('❌ Edge failed to start');
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

  const typeInto = async (selector, text) => {
    await send('Runtime.evaluate', {
      expression: `document.querySelector('${selector}').focus();`
    });
    await send('Input.insertText', { text });
    await new Promise(r => setTimeout(r, 100));
  };

  const saveScreenshot = async (name) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(SETUP_DIR, name), buffer);
    fs.writeFileSync(path.join(PUBLIC_SETUP_DIR, name), buffer);
    console.log(`📸 Saved ${name} (${(buffer.length / 1024).toFixed(1)} KB)`);
  };

  // 1. Setup Wizard Step 1: Super User Account
  console.log('Navigating to /setup?preview=true (Step 1)...');
  await send('Page.navigate', { url: 'http://localhost:3030/setup?preview=true' });
  await new Promise(r => setTimeout(r, 2000));
  
  await typeInto('input[placeholder*="Name"], input[type="text"]', 'System Administrator');
  await typeInto('input[type="email"]', 'admin@institution.edu');
  
  const passInputs = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('input[type="password"]').length`
  });
  
  await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('input[type="password"]')[0].focus();`
  });
  await send('Input.insertText', { text: 'SuperAdmin2026!' });
  
  await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('input[type="password"]')[1].focus();`
  });
  await send('Input.insertText', { text: 'SuperAdmin2026!' });
  await new Promise(r => setTimeout(r, 500));
  await saveScreenshot('01_setup_gui_step1_account.png');

  // 2. Setup Wizard Step 2: Database Encryption Key
  console.log('Clicking to proceed to Step 2...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[type="submit"]').click();`
  });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('02_setup_gui_step2_encryption.png');

  // 3. Super User Payment Coordinates Setup in Settings
  console.log('Navigating to /dashboard/settings for Payment/Bank Coordinates...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/home' });
  await new Promise(r => setTimeout(r, 1000));
  await send('Runtime.evaluate', {
    expression: `
      const superUser = {
        id: "m1",
        name: "Kayomarz Pavri",
        email: "kayo2970@gmail.com",
        role: "Super User",
        division: "Faculty",
        department: "Events",
        committee: "All Committees",
        tier: 1,
        bankName: "State Bank of India",
        accountNumber: "987654321012",
        ifscCode: "SBIN0001234"
      };
      localStorage.setItem('user', JSON.stringify(superUser));
      localStorage.setItem('leads_session_token', '0b66288225aab6bee121dd44e65b349b002dce596e4433c6349b2561999b8e12');
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    `
  });
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/settings' });
  await new Promise(r => setTimeout(r, 2000));
  // Scroll down slightly to make the bank coordinates visible
  await send('Runtime.evaluate', {
    expression: `
      const bankHeader = Array.from(document.querySelectorAll('h3, h4, label')).find(el => el.textContent.includes('Bank') || el.textContent.includes('Settlement') || el.textContent.includes('IFSC'));
      if (bankHeader) bankHeader.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await new Promise(r => setTimeout(r, 500));
  await saveScreenshot('03_super_user_bank_payment_setup.png');

  // 4. Initiating Payment / Reimbursement Claim in /dashboard/reimbursements
  console.log('Navigating to /dashboard/reimbursements...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/reimbursements' });
  await new Promise(r => setTimeout(r, 2000));
  // Fill in claim details on the form to demonstrate payment initiation
  await send('Runtime.evaluate', {
    expression: `
      const amtInput = document.querySelector('input[placeholder*="2450"], input[type="number"]');
      if (amtInput) {
        amtInput.value = "12500";
        amtInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const descInput = document.querySelector('textarea');
      if (descInput) {
        descInput.value = "Stage sound system rental and audiovisual hardware procurement for Inaugural Conclave.";
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `
  });
  await new Promise(r => setTimeout(r, 600));
  await saveScreenshot('04_payment_claim_initiation.png');

  console.log('🎉 All setup & payment screenshots successfully captured!');
  ws.close();
  edgeProc.kill();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
