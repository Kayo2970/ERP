import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = path.resolve('scratch/edge_action_profile');
const SCREENSHOT_BASE = path.resolve('docs/screenshots/steps');

fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const PORT = 9223;

const PERSONAS = {
  super_user: {
    folder: '01_super_user',
    user: {
      id: 'm1',
      name: 'Kayomarz Pavri',
      email: 'kayo2970@gmail.com',
      role: 'Super User',
      tier: 1,
      division: 'Faculty',
      department: 'Events',
      committee: 'All Committees'
    },
    token: '0b66288225aab6bee121dd44e65b349b002dce596e4433c6349b2561999b8e12'
  },
  centre_head: {
    folder: '02_centre_head',
    user: {
      id: 'm2',
      name: 'Dr. Subhadeep Mukherjee',
      email: 'subhadeep@msruas.ac.in',
      role: 'Centre Head',
      tier: 2,
      division: 'Faculty',
      department: 'Faculty Oversight'
    },
    token: 'f2de75385dba2646a0e8cffd31832aec85ae14b955237c883086c37711a6d599'
  },
  dept_heads: {
    folder: '03_dept_heads',
    user: {
      id: 'm3',
      name: 'Prof. Rajesh Kumar',
      email: 'rajesh.finance@msruas.ac.in',
      role: 'Head of Finance',
      tier: 3,
      division: 'Faculty',
      department: 'Finance & Sponsorships'
    },
    token: '90abddcf4813f9e0a94d9cb7cc7f21deda88cd3c91d6b55c7669c145a1c2d6b3'
  },
  core_committee: {
    folder: '04_core_committee',
    user: {
      id: 'm4',
      name: 'Aarav Sharma',
      email: 'aarav.gensec@msruas.ac.in',
      role: 'General Secretary',
      tier: 5,
      division: 'Core Committee',
      department: 'Secretariat'
    },
    token: '8f18989083e4b14540dafc092b3f461b64793dd06e761460eadad9523ea3b3c1'
  },
  training_associate: {
    folder: '05_training_associate',
    user: {
      id: 'm5',
      name: 'Ananya Patel',
      email: 'ananya.associate@msruas.ac.in',
      role: 'Associate - Operations & Logistics',
      tier: 6,
      division: 'Training Associate',
      department: 'Operations & Logistics'
    },
    token: '6894912c37ec191b4ab9d81e448f22e750e81d66bffe22f82935cb79812475dc'
  },
  chief_advisor: {
    folder: '06_chief_advisor',
    user: {
      id: 'm6',
      name: 'Dr. H. S. Srivatsa',
      email: 'srivatsa.advisor@msruas.ac.in',
      role: 'Chief Advisor',
      tier: 4,
      division: 'Faculty',
      department: 'Chief Advisor Office'
    },
    token: '85b3cd886a9dd56babae970efb511c04638e795d37d05072be6af05662594fcb'
  }
};

async function main() {
  console.log(`🚀 Starting headless Edge on port ${PORT}...`);
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
    console.error('❌ Failed to connect to Edge CDP endpoint');
    edgeProc.kill();
    process.exit(1);
  }
  console.log('✅ Connected to Edge:', versionData.Browser);

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
  console.log('🔌 WebSocket connected');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  const injectPersona = async (persona) => {
    const code = `
      try {
        localStorage.clear();
        localStorage.setItem('user', JSON.stringify(${JSON.stringify(persona.user)}));
        localStorage.setItem('leads_session_token', '${persona.token}');
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
        'OK';
      } catch(e) { e.message; }
    `;
    await send('Runtime.evaluate', { expression: code });
  };

  const capture = async (folder, filename) => {
    const dir = path.join(SCREENSHOT_BASE, folder);
    fs.mkdirSync(dir, { recursive: true });
    await send('Runtime.evaluate', { expression: "document.documentElement.classList.add('dark');" });
    await new Promise(r => setTimeout(r, 200));
    const shot = await send('Page.captureScreenshot', { format: 'png', quality: 90 });
    const buffer = Buffer.from(shot.data, 'base64');
    const outPath = path.join(dir, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`   📸 [${folder}] ${filename} saved (${Math.round(buffer.length / 1024)} KB)`);
  };

  const clickSelector = async (selector) => {
    const expr = `
      (() => {
        const el = document.querySelector('${selector}');
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
          el.click();
          return true;
        }
        return false;
      })()
    `;
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res.result?.value;
  };

  const clickByText = async (text) => {
    const expr = `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const target = buttons.find(b => b.textContent && b.textContent.includes('${text}'));
        if (target) {
          target.scrollIntoView({ behavior: 'instant', block: 'center' });
          target.click();
          return true;
        }
        return false;
      })()
    `;
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res.result?.value;
  };

  // ==========================================
  // 1. TIER 1 — SUPER USER ACTIONS
  // ==========================================
  console.log('\n--- 👑 CAPTURING TIER 1: SUPER USER ACTIONS ---');
  await injectPersona(PERSONAS.super_user);

  // 1.1 Home Dashboard & Quick Switcher
  console.log('Navigating to /dashboard/home...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/home' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('01_super_user', '01_dashboard_home.png');

  // Click Quick Switch icon
  await clickSelector('button[title*="Quick Switch"]');
  await new Promise(r => setTimeout(r, 600));
  await capture('01_super_user', '02_persona_switcher_active.png');

  // 1.2 Members Directory & Add Member Modal
  console.log('Navigating to /dashboard/directory...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/directory' });
  await new Promise(r => setTimeout(r, 2000));
  await capture('01_super_user', '03_directory_roster.png');

  await clickByText('Add Member');
  await new Promise(r => setTimeout(r, 600));
  await capture('01_super_user', '04_add_member_modal.png');

  // 1.3 Group Policies Builder
  console.log('Navigating to /dashboard/policies...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/policies' });
  await new Promise(r => setTimeout(r, 2000));
  await capture('01_super_user', '05_group_policies_matrix.png');

  // 1.4 Encrypted Backup & Restore
  console.log('Navigating to /dashboard/backup...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/backup' });
  await new Promise(r => setTimeout(r, 2000));
  await capture('01_super_user', '06_encrypted_backup_portal.png');

  // 1.5 System Settings & Security
  console.log('Navigating to /dashboard/settings...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/settings' });
  await new Promise(r => setTimeout(r, 2000));
  await capture('01_super_user', '07_system_security_settings.png');

  // ==========================================
  // 2. TIER 2 — CENTRE HEAD ACTIONS
  // ==========================================
  console.log('\n--- 🎓 CAPTURING TIER 2: CENTRE HEAD ACTIONS ---');
  await injectPersona(PERSONAS.centre_head);

  // 2.1 Approvals Inbox Queue
  console.log('Navigating to /dashboard/approvals...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/approvals' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('02_centre_head', '01_approvals_inbox_queue.png');

  // 2.2 Events Management & Proposal Actions
  console.log('Navigating to /dashboard/events...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/events' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('02_centre_head', '02_events_executive_view.png');

  // 2.3 Reimbursements Gate 3 Settlement
  console.log('Navigating to /dashboard/reimbursements...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/reimbursements' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('02_centre_head', '03_reimbursements_gate3_settlement.png');

  // 2.4 Budget & Funds Executive Control
  console.log('Navigating to /dashboard/budget...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/budget' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('02_centre_head', '04_budget_executive_management.png');

  // ==========================================
  // 3. TIER 3 — DEPARTMENT & FINANCE HEAD
  // ==========================================
  console.log('\n--- 💼 CAPTURING TIER 3: DEPARTMENT & FINANCE HEAD ACTIONS ---');
  await injectPersona(PERSONAS.dept_heads);

  // 3.1 Finance Head Reimbursements Gate 2 Verification
  console.log('Navigating to /dashboard/reimbursements...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/reimbursements' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('03_dept_heads', '01_reimbursements_gate2_audit.png');

  // 3.2 Tasks Management & Creation
  console.log('Navigating to /dashboard/tasks...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/tasks' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('03_dept_heads', '02_tasks_board_view.png');

  // Open New Task Modal
  await clickByText('New Task');
  await new Promise(r => setTimeout(r, 600));
  await capture('03_dept_heads', '03_new_task_modal.png');

  // Refresh and switch to Timeline / Gantt
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/tasks' });
  await new Promise(r => setTimeout(r, 2000));
  await clickByText('Timeline');
  await new Promise(r => setTimeout(r, 600));
  await capture('03_dept_heads', '04_tasks_gantt_timeline.png');

  // ==========================================
  // 4. TIER 5 — CORE COMMITTEE & GENERAL SECRETARY
  // ==========================================
  console.log('\n--- ⚡ CAPTURING TIER 5: CORE COMMITTEE & GENERAL SECRETARY ACTIONS ---');
  await injectPersona(PERSONAS.core_committee);

  // 4.1 Create Event Studio Modal
  console.log('Navigating to /dashboard/events...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/events' });
  await new Promise(r => setTimeout(r, 2200));
  await clickByText('Create Event');
  await new Promise(r => setTimeout(r, 600));
  await capture('04_core_committee', '01_create_event_studio_modal.png');

  // 4.2 Event Passes Studio & Turnstile Scanner
  console.log('Navigating to /dashboard/event-passes...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/event-passes' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('04_core_committee', '02_pass_studio_workspace.png');

  // Open Turnstile Scanner
  await clickByText('Scanner');
  await new Promise(r => setTimeout(r, 600));
  await capture('04_core_committee', '03_turnstile_scanner_viewfinder.png');

  // 4.3 Dynamic Form Builder
  console.log('Navigating to /dashboard/forms...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/forms' });
  await new Promise(r => setTimeout(r, 2000));
  await clickByText('Create Form');
  await new Promise(r => setTimeout(r, 600));
  await capture('04_core_committee', '04_dynamic_form_builder.png');

  // 4.4 General Secretary Event Report Portal
  console.log('Navigating to /dashboard/event-reports...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/event-reports' });
  await new Promise(r => setTimeout(r, 2000));
  await capture('04_core_committee', '05_general_secretary_event_report.png');

  // ==========================================
  // 5. TIER 6 — TRAINING ASSOCIATE (STUDENTS)
  // ==========================================
  console.log('\n--- 🎒 CAPTURING TIER 6: TRAINING ASSOCIATE ACTIONS ---');
  await injectPersona(PERSONAS.training_associate);

  // 5.1 Personal Task Execution
  console.log('Navigating to /dashboard/tasks...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/tasks' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('05_training_associate', '01_student_task_checklist.png');

  // 5.2 Collaborator Expense Claim Submission Form
  console.log('Navigating to /dashboard/reimbursements...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/reimbursements' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('05_training_associate', '02_claim_submission_form.png');

  // 5.3 3D Digital Visiting Card Profile
  console.log('Navigating to /dashboard/visiting-card...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/visiting-card' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('05_training_associate', '03_digital_keycard_profile.png');

  // ==========================================
  // 6. TIER 4 — CHIEF ADVISOR (VIEW-ONLY PROOF)
  // ==========================================
  console.log('\n--- 👓 CAPTURING TIER 4: CHIEF ADVISOR VIEW-ONLY ---');
  await injectPersona(PERSONAS.chief_advisor);

  console.log('Navigating to /dashboard/home...');
  await send('Page.navigate', { url: 'http://localhost:3030/dashboard/home' });
  await new Promise(r => setTimeout(r, 2200));
  await capture('06_chief_advisor', '01_chief_advisor_view_only.png');

  console.log('\n✨ All persona-driven step-by-step action screenshots captured successfully!');
  ws.close();
  edgeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Error during capture:', err);
  process.exit(1);
});
