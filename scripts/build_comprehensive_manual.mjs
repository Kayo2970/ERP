import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = path.resolve('scratch/edge_pdf_profile');
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

console.log('📝 Generating comprehensive docs/manual.html...');

const manualHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LEADS ERP — Complete Role-Based Operations & Technical Manual</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --sidebar-bg: #0d131f;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #38bdf8;
      --primary-hover: #0ea5e9;
      --border: #1f293d;
      --accent: #6366f1;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --tag-bg: #1e293b;
      --sidebar-w: 320px;
    }

    [data-theme="light"] {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --sidebar-bg: #f1f5f9;
      --text: #0f172a;
      --text-muted: #64748b;
      --primary: #0284c7;
      --primary-hover: #0369a1;
      --border: #e2e8f0;
      --accent: #4f46e5;
      --tag-bg: #f1f5f9;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      display: flex;
      min-height: 100vh;
    }

    /* Left Navigation Sidebar */
    aside {
      width: var(--sidebar-w);
      background-color: var(--sidebar-bg);
      border-right: 1px solid var(--border);
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .brand {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand h1 {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      letter-spacing: -0.02em;
    }

    .filter-box {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
    }

    .filter-box input, .filter-box select {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
      outline: none;
    }

    .filter-box input:focus, .filter-box select:focus {
      border-color: var(--primary);
    }

    nav.toc {
      flex: 1;
      padding: 0.75rem;
      overflow-y: auto;
    }

    .toc-section {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 0.6rem 0.75rem 0.2rem;
      font-weight: 700;
    }

    .toc a {
      display: block;
      padding: 0.45rem 0.75rem;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      border-radius: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toc a:hover {
      background-color: rgba(56, 189, 248, 0.1);
      color: var(--primary);
    }

    .toc a.active {
      background-color: var(--primary);
      color: #0f172a;
      font-weight: 700;
    }

    /* Main Article Container */
    main {
      margin-left: var(--sidebar-w);
      flex: 1;
      max-width: 1200px;
      padding: 2.5rem 3.5rem;
    }

    header.doc-header {
      margin-bottom: 3rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    header.doc-header h1 {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--text);
      letter-spacing: -0.03em;
      margin-bottom: 0.5rem;
    }

    header.doc-header .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      color: var(--text-muted);
      font-size: 0.875rem;
      align-items: center;
      margin-top: 1rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--tag-bg);
      border: 1px solid var(--border);
    }

    .badge.success { color: var(--success); border-color: rgba(16, 185, 129, 0.4); }
    .badge.primary { color: var(--primary); border-color: rgba(56, 189, 248, 0.4); }
    .badge.warning { color: var(--warning); border-color: rgba(245, 158, 11, 0.4); }
    .badge.danger { color: var(--danger); border-color: rgba(239, 68, 68, 0.4); }

    /* Matrix badges */
    .m-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-align: center;
    }
    .m-full { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; }
    .m-appr { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
    .m-creat { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }
    .m-view { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border: 1px solid #64748b; }
    .m-own { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid #a855f7; }
    .m-none { color: #64748b; font-weight: 400; }

    /* Content Cards & Sections */
    section {
      margin-bottom: 4rem;
      scroll-margin-top: 2rem;
    }

    h2 {
      font-size: 1.8rem;
      font-weight: 800;
      margin-bottom: 1rem;
      color: var(--text);
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.6rem;
    }

    h3 {
      font-size: 1.3rem;
      font-weight: 700;
      margin: 2rem 0 0.8rem;
      color: var(--primary);
    }

    h4 {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 1.5rem 0 0.5rem;
      color: var(--text);
    }

    p { margin-bottom: 1rem; color: var(--text-muted); line-height: 1.7; }
    p strong { color: var(--text); }

    ul, ol {
      margin-bottom: 1.25rem;
      padding-left: 1.5rem;
      color: var(--text-muted);
    }

    li { margin-bottom: 0.4rem; }
    li strong { color: var(--text); }

    /* Screenshot Embed Container */
    .screenshot-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      margin: 1.5rem 0 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .screenshot-header {
      padding: 0.75rem 1.25rem;
      background: rgba(0,0,0,0.2);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .dot-group {
      display: flex;
      gap: 0.35rem;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }

    .screenshot-card img {
      width: 100%;
      height: auto;
      display: block;
      border-bottom: 1px solid var(--border);
    }

    .screenshot-caption {
      padding: 0.75rem 1.25rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      font-style: italic;
      background: var(--card-bg);
    }

    /* Action Step Box */
    .step-box {
      background: rgba(17, 24, 39, 0.7);
      border: 1px solid var(--border);
      border-left: 4px solid var(--primary);
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .step-box.action-gold {
      border-left-color: var(--warning);
    }
    .step-box.action-green {
      border-left-color: var(--success);
    }

    .step-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .step-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
    }

    .step-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      background: var(--tag-bg);
      color: var(--primary);
    }

    .action-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.6rem;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: var(--primary);
      border-radius: 6px;
      font-family: monospace;
      font-weight: 700;
      font-size: 0.85rem;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0 2rem;
      font-size: 0.85rem;
    }

    th, td {
      padding: 0.75rem 0.85rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      background: rgba(0,0,0,0.2);
      font-weight: 700;
      color: var(--text);
    }

    tr:hover td {
      background: rgba(255,255,255,0.02);
    }

    .code-box {
      background: #050811;
      border: 1px solid var(--border);
      padding: 1rem 1.25rem;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      overflow-x: auto;
      margin-bottom: 1.25rem;
      color: #38bdf8;
    }

    .callout {
      border-left: 4px solid var(--accent);
      padding: 1rem 1.25rem;
      background: rgba(99, 102, 241, 0.08);
      border-radius: 0 8px 8px 0;
      margin-bottom: 1.5rem;
    }
    .callout.warning {
      border-left-color: var(--warning);
      background: rgba(245, 158, 11, 0.08);
    }
  </style>
</head>
<body>

  <!-- Left Sidebar Navigation -->
  <aside>
    <div class="brand">
      <h1>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        LEADS ERP
      </h1>
      <span class="badge primary">v2.0 Manual</span>
    </div>

    <div class="filter-box">
      <input type="text" id="manualSearch" placeholder="🔍 Search operations..." onkeyup="filterManual()">
      <select id="roleFilter" onchange="filterRole()">
        <option value="all">Role: All Operations</option>
        <option value="tier1">Tier 1: Super User</option>
        <option value="tier2">Tier 2: Centre Head / Advisor</option>
        <option value="tier3">Tier 3: Dept Heads &amp; Finance</option>
        <option value="tier5">Tier 5: Core Committee</option>
        <option value="tier6">Tier 6: Training Associates</option>
        <option value="tier4">Tier 4: Chief Advisor (View)</option>
        <option value="devops">DevOps &amp; System Setup</option>
      </select>
    </div>

    <nav class="toc">
      <div class="toc-section">0. Setup &amp; Deployment</div>
      <a href="#setup-stage">1. Prerequisites &amp; Node 22</a>
      <a href="#superuser-seeding">2. Super User Seeding</a>
      <a href="#vps-deployment">3. Production VPS Setup</a>
      <a href="#deploy-script">4. Continuous Pipeline</a>

      <div class="toc-section">1. Roles &amp; Master Matrix</div>
      <a href="#rbac-hierarchy">5. 7-Tier Access Matrix</a>
      <a href="#master-privileges-matrix">6. Designation x Module Matrix</a>

      <div class="toc-section">2. Role-by-Role Playbooks</div>
      <a href="#playbook-tier1">Tier 1: Super User Administration</a>
      <a href="#playbook-tier2">Tier 2: Centre Head &amp; Advisor</a>
      <a href="#playbook-tier3">Tier 3: Dept Heads &amp; Finance</a>
      <a href="#playbook-tier5">Tier 5: Core Committee &amp; Sec.</a>
      <a href="#playbook-tier6">Tier 6: Training Associates (Student)</a>
      <a href="#playbook-tier4">Tier 4 &amp; 7: Chief Advisor &amp; Alumni</a>
      <a href="#shared-procedures">Standard Shared Procedures</a>

      <div class="toc-section">3. Workspace Modules (Gallery)</div>
      <a href="#mod-dashboard">3.1 Home Dashboard</a>
      <a href="#mod-events">3.2 Events Management</a>
      <a href="#mod-passes">3.3 Event Passes &amp; Scanner</a>
      <a href="#mod-tasks">3.4 Tasks &amp; Gantt Schedule</a>
      <a href="#mod-ratings">3.5 Performance Ratings</a>
      <a href="#mod-procurement">3.6 Procurement Requisitions</a>
      <a href="#mod-reimbursements">3.7 Financial Reimbursements</a>
      <a href="#mod-budget">3.8 Budgeting &amp; P&amp;L</a>
      <a href="#mod-designs">3.9 Design Portal &amp; OCR</a>
      <a href="#mod-forms">3.10 Dynamic Form Builder</a>
      <a href="#mod-visiting-card">3.11 Digital Visiting Cards</a>
      <a href="#mod-guest-directory">3.12 Guest Directory</a>
      <a href="#mod-guest-invites">3.13 VIP Mail Merge</a>
      <a href="#mod-announcements">3.14 Announcements Engine</a>
      <a href="#mod-calendar">3.15 Master Calendar</a>
      <a href="#mod-festivals">3.16 University Festivals</a>
      <a href="#mod-event-reports">3.17 Executive Event Reports</a>
      <a href="#mod-reports">3.18 Operational Analytics</a>
      <a href="#mod-approvals">3.19 Unified Approvals Inbox</a>
      <a href="#mod-directory">3.20 Members Directory</a>
      <a href="#mod-policies">3.21 Custom Group Policies</a>
      <a href="#mod-email">3.22 Email Engine &amp; Postfix</a>
      <a href="#mod-backup">3.23 Encrypted Backup &amp; Restore</a>
      <a href="#mod-settings">3.24 System Settings &amp; Security</a>
    </nav>
  </aside>

  <!-- Main Manual Article -->
  <main>
    <header class="doc-header">
      <h1>LEADS ERP Operations Manual</h1>
      <p>Official Institutional Operations Guide, Setup Runbook, and Step-by-Step Role Playbook for the LEADS Next-Gen Centre at M.S. Ramaiah University of Applied Sciences.</p>
      
      <div class="meta-bar">
        <span class="badge success">● System Active</span>
        <span class="badge primary">Version 2.0 Production</span>
        <span>Local Dev Port: <code>3030</code></span>
        <span>Zero-Cloud Local DB (AES-256-GCM)</span>
      </div>
    </header>

    <!-- SECTION 0: SETUP STAGE & VPS DEPLOYMENT -->
    <section id="setup-stage">
      <h2>1. Prerequisites &amp; Environment Configuration</h2>
      <p>The LEADS ERP runs locally or on institutional servers with zero external database dependencies. Ensure the runtime environment satisfies:</p>
      <ul>
        <li><strong>Node.js:</strong> Version 22 LTS or newer (<code>node -v</code>)</li>
        <li><strong>Package Manager:</strong> npm 10+ (<code>npm -v</code>)</li>
        <li><strong>Encryption Key:</strong> 64-character hex master key for AES-256-GCM file encryption.</li>
      </ul>

      <div class="code-box">
# 1. Clone repository
git clone https://github.com/Kayo2970/ERP.git
cd ERP/leads-dashboard

# 2. Configure environment file
cp .env.example .env
      </div>
    </section>

    <section id="superuser-seeding">
      <h2>2. Interactive Super User Seeding (setup-superuser.js)</h2>
      <p>Before launching the server for the first time, execute the interactive superuser provisioning utility:</p>
      <div class="code-box">npm run setup</div>
      <p>This script prompts for Administrator Name, Institutional Email, and Password. It seeds the master Super User account (<code>m1</code>), establishes <code>DATA_ENCRYPTION_KEY</code> in <code>.env</code>, and prepares initial data collections.</p>
    </section>

    <section id="vps-deployment">
      <h2>3. Production VPS Setup (vps-setup.sh)</h2>
      <p>For Ubuntu 22.04 / 24.04 VPS deployments, execute the automated bootstrap script as root:</p>
      <div class="code-box">sudo bash /ERP/docs/vps-setup.sh</div>
    </section>

    <section id="deploy-script">
      <h2>4. Continuous Pipeline (deploy.sh)</h2>
      <p>Trigger automated builds and zero-downtime PM2 process restarts:</p>
      <div class="code-box">bash deploy.sh</div>
    </section>

    <!-- SECTION 1: ROLES & PRIVILEGES MATRIX -->
    <section id="rbac-hierarchy">
      <h2>5. 7-Tier Access Matrix &amp; Institutional Designations</h2>
      <p>Access privileges in LEADS ERP are governed by a combination of <strong>Access Tier (1–7)</strong>, <strong>Division</strong>, and <strong>Designation</strong>:</p>

      <table>
        <thead>
          <tr>
            <th>Tier</th>
            <th>Role Title</th>
            <th>Division</th>
            <th>Designation Scope &amp; Authority</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Tier 1</strong></td>
            <td>Super User</td>
            <td>Faculty / Root</td>
            <td>Unrestricted root control, persona switching, direct password management, AES-256 backup/restore, emergency maintenance lockdown.</td>
          </tr>
          <tr>
            <td><strong>Tier 2</strong></td>
            <td>Centre Head &amp; Advisor</td>
            <td>Faculty</td>
            <td>Director level authority: final budget approval, Gate-3 reimbursement settlement, member provisioning, event/task approval.</td>
          </tr>
          <tr>
            <td><strong>Tier 2.5</strong></td>
            <td>Head of Events (GG Campus)</td>
            <td>Faculty</td>
            <td>Campus event authority: approves events, committees, student allotments, holiday social tasks, and ratings for GG campus.</td>
          </tr>
          <tr>
            <td><strong>Tier 3</strong></td>
            <td>Dept Heads &amp; Finance Head</td>
            <td>Faculty / Core</td>
            <td>Gate-1 reimbursement sign-off (Sector Heads), Gate-2 GST audit (Finance Head), task allocation, RTC event coordination.</td>
          </tr>
          <tr>
            <td><strong>Tier 4</strong></td>
            <td>Advisory Board / Chief Advisor</td>
            <td>Faculty / Advisory</td>
            <td>Consultative senior mentors. <em>Chief Advisor is strictly View-Only by design</em> (excluded from all edit/approval triggers).</td>
          </tr>
          <tr>
            <td><strong>Tier 5</strong></td>
            <td>Core Committee</td>
            <td>Core Committee</td>
            <td>Student operational backbone: event creation, Pass Studio, Gate turnstile scanner, Form Builder, Event Report submission (General Secretary).</td>
          </tr>
          <tr>
            <td><strong>Tier 6</strong></td>
            <td>Training Associates</td>
            <td>Training Associate</td>
            <td>Student workforce: task execution, checklist completion, expense reimbursement claims, 3D digital visiting card.</td>
          </tr>
          <tr>
            <td><strong>Tier 7</strong></td>
            <td>Alumni &amp; Guests</td>
            <td>Alumni / Public</td>
            <td>Read-only archive access, public registration forms, digital wallet event passes.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- MASTER DESIGNATION X MODULE PRIVILEGES MATRIX -->
    <section id="master-privileges-matrix">
      <h2>6. Master Designation x Module Privileges Matrix</h2>
      <p>The exhaustive matrix below illustrates the precise authority of every key designation across all 24 workspace modules:</p>

      <div style="overflow-x: auto; margin-bottom: 2rem;">
        <table>
          <thead>
            <tr>
              <th>Module / Feature</th>
              <th>Super User (T1)</th>
              <th>Centre Head (T2)</th>
              <th>Finance Head (T3)</th>
              <th>Sector / Dept Head (T3/5)</th>
              <th>General Secretary (T5)</th>
              <th>Core Member (T5)</th>
              <th>Training Associate (T6)</th>
              <th>Chief Advisor (T4)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Dashboard Home</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-own">Own Only</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Events Management</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-appr">Approve</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-creat">Create</span></td>
              <td><span class="m-badge m-creat">Create</span></td>
              <td><span class="m-badge m-creat">Create (Req Sign-off)</span></td>
              <td><span class="m-badge m-own">Own Only</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Event Passes &amp; Scanner</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-full">Issue / Scan</span></td>
              <td><span class="m-badge m-appr">Scan Kiosk</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Tasks &amp; Gantt</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-appr">Assign / Edit</span></td>
              <td><span class="m-badge m-creat">Create</span></td>
              <td><span class="m-badge m-own">Own / Exec</span></td>
              <td><span class="m-badge m-own">Execute Task</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Reimbursements (Gate 1)</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-appr">Sign-off</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-appr">Approve Gate 1</span></td>
              <td><span class="m-badge m-creat">Submit Claim</span></td>
              <td><span class="m-badge m-creat">Submit Claim</span></td>
              <td><span class="m-badge m-creat">Submit Claim</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Reimbursements (Gate 2)</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-appr">Audit</span></td>
              <td><span class="m-badge m-appr">Verify Gate 2</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Reimbursements (Gate 3)</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-appr">Settle Gate 3</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Budgeting &amp; P&amp;L</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-full">Full Allocation</span></td>
              <td><span class="m-badge m-appr">Manage Funds</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Design Portal &amp; OCR</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-appr">Approve Proof</span></td>
              <td><span class="m-badge m-creat">Upload</span></td>
              <td><span class="m-badge m-creat">Upload / Proof</span></td>
              <td><span class="m-badge m-creat">Upload</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Dynamic Form Builder</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-appr">Approve Live</span></td>
              <td><span class="m-badge m-appr">Approve Live</span></td>
              <td><span class="m-badge m-creat">Build (Req Sign)</span></td>
              <td><span class="m-badge m-creat">Build Form</span></td>
              <td><span class="m-badge m-creat">Build Form</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Event Reports</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-appr">Approve Report</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-view">View All</span></td>
              <td><span class="m-badge m-creat">Submit Report</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Members Directory</strong></td>
              <td><span class="m-badge m-full">Add / Terminate</span></td>
              <td><span class="m-badge m-full">Add Member</span></td>
              <td><span class="m-badge m-view">View Roster</span></td>
              <td><span class="m-badge m-view">View Roster</span></td>
              <td><span class="m-badge m-view">View Roster</span></td>
              <td><span class="m-badge m-view">View Roster</span></td>
              <td><span class="m-badge m-own">Own Profile</span></td>
              <td><span class="m-badge m-view">View Only</span></td>
            </tr>
            <tr>
              <td><strong>Group Policies</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
            </tr>
            <tr>
              <td><strong>Backup &amp; Restore</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
            </tr>
            <tr>
              <td><strong>System Settings</strong></td>
              <td><span class="m-badge m-full">Full</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
              <td><span class="m-none">—</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- SECTION 2: ROLE PLAYBOOKS WITH SCREENSHOTS -->
    <section id="playbook-tier1">
      <h2>4.1 Playbook: Tier 1 — Super User Administration</h2>
      <p>The Super User holds unrestricted root administrative authority over member provisioning, security parameters, dynamic access policies, and encrypted disaster recovery.</p>

      <!-- Step 1 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 1: Test &amp; Verify Permissions via Persona Switcher</span>
          <span class="step-badge">Route: /dashboard/home</span>
        </div>
        <p>Click the <span class="action-trigger">Account Switcher (UserCog Icon)</span> in the top header bar to simulate any active institutional member without logging out.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Quick Switch Active State</span>
          </div>
          <img src="screenshots/steps/01_super_user/02_persona_switcher_active.png" alt="Persona Switcher Active">
          <div class="screenshot-caption">Figure 4.1.1: Super User quick-switch dropdown enabling instant role impersonation.</div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 2: Provision New Member &amp; Override Password</span>
          <span class="step-badge">Route: /dashboard/directory</span>
        </div>
        <p>Click <span class="action-trigger">+ Add Member</span>. Fill in Name, Institutional Email, select Division, Department, and Position. Click <em>Add Member</em> to email an activation link or set password directly.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Member Provisioning Modal</span>
          </div>
          <img src="screenshots/steps/01_super_user/04_add_member_modal.png" alt="Add Member Modal">
          <div class="screenshot-caption">Figure 4.1.2: New member provisioning modal with division, position, and department selectors.</div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 3: Manage Granular Capability Overrides</span>
          <span class="step-badge">Route: /dashboard/policies</span>
        </div>
        <p>In the <strong>Group Policies</strong> portal, configure custom capability grants (e.g. allowing student coordinators to view specific budget heads).</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Group Policies Access Matrix</span>
          </div>
          <img src="screenshots/steps/01_super_user/05_group_policies_matrix.png" alt="Group Policies Matrix">
          <div class="screenshot-caption">Figure 4.1.3: Dynamic RBAC policy editor with module view/edit grants and approver tags.</div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 4: Execute AES-256 Disaster Recovery Snapshot</span>
          <span class="step-badge">Route: /dashboard/backup</span>
        </div>
        <p>Click <span class="action-trigger">Create Encrypted Backup Now</span> to generate and stream an encrypted <code>.leads.enc</code> snapshot directly to your machine.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Encrypted Backup &amp; Restore</span>
          </div>
          <img src="screenshots/steps/01_super_user/06_encrypted_backup_portal.png" alt="Backup Portal">
          <div class="screenshot-caption">Figure 4.1.4: Encrypted snapshot creation and point-in-time restore dropzone.</div>
        </div>
      </div>
    </section>

    <section id="playbook-tier2">
      <h2>4.2 Playbook: Tier 2 — Centre Head &amp; Faculty Advisor</h2>
      <p>The Centre Head directs executive operations, budget clearance, VIP protocols, and Level-3 final reimbursement settlements.</p>

      <!-- Step 1 -->
      <div class="step-box action-green">
        <div class="step-header">
          <span class="step-title">Step 1: Process Approvals Queue Across Modules</span>
          <span class="step-badge">Route: /dashboard/approvals</span>
        </div>
        <p>Review incoming items requiring executive clearance. Click <span class="action-trigger">Approve (Checkmark)</span> or <span class="action-trigger">Reject (Cross)</span> with mandatory feedback.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Unified Approvals Inbox</span>
          </div>
          <img src="screenshots/steps/02_centre_head/01_approvals_inbox_queue.png" alt="Approvals Inbox">
          <div class="screenshot-caption">Figure 4.2.1: Executive approvals inbox prioritizing pending requests across departments.</div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="step-box action-green">
        <div class="step-header">
          <span class="step-title">Step 2: Review &amp; Sanction Event Proposals</span>
          <span class="step-badge">Route: /dashboard/events</span>
        </div>
        <p>Filter by <code>Pending Approval</code>. Inspect budget ceiling, student committee allocation, and campus venue. Click <span class="action-trigger">Approve Proposal</span>.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Event Proposals Queue</span>
          </div>
          <img src="screenshots/steps/02_centre_head/02_events_executive_view.png" alt="Events Executive View">
          <div class="screenshot-caption">Figure 4.2.2: Event proposals board showing status filters and executive sanction buttons.</div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step-box action-green">
        <div class="step-header">
          <span class="step-title">Step 3: Settle Financial Claims (Gate 3 Final Settlement)</span>
          <span class="step-badge">Route: /dashboard/reimbursements</span>
        </div>
        <p>Filter by claims marked <code>Verified by Finance Head (Gate 2 Passed)</code>. Inspect bank details and IFSC code. Click <span class="action-trigger">Disburse / Settle Gate 3</span>.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Gate 3 Settlement Portal</span>
          </div>
          <img src="screenshots/steps/02_centre_head/03_reimbursements_gate3_settlement.png" alt="Gate 3 Settlement">
          <div class="screenshot-caption">Figure 4.2.3: Financial claims ledger displaying 3-gate audit badges and final settlement triggers.</div>
        </div>
      </div>
    </section>

    <section id="playbook-tier3">
      <h2>4.3 Playbook: Tier 3 — Department Heads &amp; Finance Head</h2>
      <p>Department Heads oversee departmental deliverable execution and Gate-1 audit. The Finance Head conducts Gate-2 treasury verification.</p>

      <!-- Step 1 -->
      <div class="step-box action-gold">
        <div class="step-header">
          <span class="step-title">Step 1: Gate-2 Financial &amp; GST Audit (Finance Head)</span>
          <span class="step-badge">Route: /dashboard/reimbursements</span>
        </div>
        <p>Filter for claims in <code>Pending Finance Review</code>. Review uploaded GST invoices, vendor PAN, and claim amount against budget heads. Click <span class="action-trigger">Verify Gate 2</span>.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Gate 2 Financial Audit</span>
          </div>
          <img src="screenshots/steps/03_dept_heads/01_reimbursements_gate2_audit.png" alt="Gate 2 Audit">
          <div class="screenshot-caption">Figure 4.3.1: Treasury audit portal verifying invoice compliance and Gate-2 sign-off.</div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="step-box action-gold">
        <div class="step-header">
          <span class="step-title">Step 2: Assign Department Task Deliverables</span>
          <span class="step-badge">Route: /dashboard/tasks</span>
        </div>
        <p>Click <span class="action-trigger">+ New Task</span>. Select Target Event, Assignee from your department, Priority (Low/Medium/High/Urgent), Deadline, and Checklist. Click <em>Assign Task</em>.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Task Assignment Modal</span>
          </div>
          <img src="screenshots/steps/03_dept_heads/03_new_task_modal.png" alt="Task Assignment Modal">
          <div class="screenshot-caption">Figure 4.3.2: Task assignment modal with subtask checklists and priority toggles.</div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step-box action-gold">
        <div class="step-header">
          <span class="step-title">Step 3: Monitor Department Milestones in Gantt Timeline</span>
          <span class="step-badge">Route: /dashboard/tasks</span>
        </div>
        <p>Click <span class="action-trigger">Timeline View</span> to track dependent milestones and avoid project bottlenecks.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Gantt Timeline View</span>
          </div>
          <img src="screenshots/steps/03_dept_heads/04_tasks_gantt_timeline.png" alt="Gantt Timeline">
          <div class="screenshot-caption">Figure 4.3.3: Interactive Gantt schedule showing departmental task deadlines.</div>
        </div>
      </div>
    </section>

    <section id="playbook-tier5">
      <h2>4.4 Playbook: Tier 5 — Core Committee &amp; General Secretary</h2>
      <p>The Core Committee executes events, manages attendee credentials in Pass Studio, builds registration forms, and files official post-event reports.</p>

      <!-- Step 1 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 1: Draft Event Proposal in Event Studio</span>
          <span class="step-badge">Route: /dashboard/events</span>
        </div>
        <p>Click <span class="action-trigger">+ Create Event</span>. Enter Event Title, Campus/Venue, Budget Estimate, Target Attendance, and Committee Leads. Click <em>Submit Proposal</em>.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Event Creation Studio Modal</span>
          </div>
          <img src="screenshots/steps/04_core_committee/01_create_event_studio_modal.png" alt="Create Event Studio">
          <div class="screenshot-caption">Figure 4.4.1: Event Studio creation form with budget heads and sub-committee allocation.</div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 2: Generate Verified Luxury Passes</span>
          <span class="step-badge">Route: /dashboard/event-passes</span>
        </div>
        <p>Open <strong>Pass Studio</strong>. Select pass type (VIP, Delegate, Volunteer, Speaker). Generate unique serial numbers and trigger automated email dispatch.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Pass Studio Workspace</span>
          </div>
          <img src="screenshots/steps/04_core_committee/02_pass_studio_workspace.png" alt="Pass Studio Workspace">
          <div class="screenshot-caption">Figure 4.4.2: Digital pass studio with attendee roster management and wallet sync.</div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 3: Admit Attendees via Turnstile Scanner Kiosk</span>
          <span class="step-badge">Route: /dashboard/event-passes</span>
        </div>
        <p>Click <span class="action-trigger">Launch Turnstile Scanner</span>. Point camera at attendee QR code for instant audio-visual verification.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Turnstile Camera Viewfinder</span>
          </div>
          <img src="screenshots/steps/04_core_committee/03_turnstile_scanner_viewfinder.png" alt="Turnstile Scanner">
          <div class="screenshot-caption">Figure 4.4.3: Real-time turnstile QR check-in camera viewfinder.</div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 4: Build Public Registration Forms</span>
          <span class="step-badge">Route: /dashboard/forms</span>
        </div>
        <p>Click <span class="action-trigger">+ Create Form</span>. Drag in Text Fields, Dropdowns, Checkboxes, and File Uploads. Click <em>Publish Form</em> to generate public link.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Dynamic Form Builder Canvas</span>
          </div>
          <img src="screenshots/steps/04_core_committee/04_dynamic_form_builder.png" alt="Form Builder">
          <div class="screenshot-caption">Figure 4.4.4: Interactive form designer canvas with field configuration properties.</div>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 5: Submit Official Post-Event Report (General Secretary)</span>
          <span class="step-badge">Route: /dashboard/event-reports</span>
        </div>
        <p>Click <span class="action-trigger">+ Submit Event Report</span>. Enter Delegate Turnout, Actual Spend, High-Res Photos, and Recommendations. Submit for Dean / Advisor sign-off.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — General Secretary Event Report Portal</span>
          </div>
          <img src="screenshots/steps/04_core_committee/05_general_secretary_event_report.png" alt="Event Report Portal">
          <div class="screenshot-caption">Figure 4.4.5: Post-event executive reporting module with automated PDF/DOCX compilation.</div>
        </div>
      </div>
    </section>

    <section id="playbook-tier6">
      <h2>4.5 Playbook: Tier 6 — Training Associates &amp; Students</h2>
      <p>Training Associates execute assigned event tasks, record subtask progress, file personal expense claims, and network using 3D digital keycards.</p>

      <!-- Step 1 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 1: Acknowledge &amp; Complete Assigned Tasks</span>
          <span class="step-badge">Route: /dashboard/tasks</span>
        </div>
        <p>Locate task under <strong>My Tasks</strong>. Click <span class="action-trigger">Acknowledge Task</span>. Check off subtask checkboxes as completed, upload proof attachments, and mark <em>Completed</em>.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Student Task Checklist</span>
          </div>
          <img src="screenshots/steps/05_training_associate/01_student_task_checklist.png" alt="Student Task Checklist">
          <div class="screenshot-caption">Figure 4.5.1: Personal task card with status toggles and subtask checkboxes.</div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 2: Submit Expense Reimbursement Claim</span>
          <span class="step-badge">Route: /dashboard/reimbursements</span>
        </div>
        <p>Under <strong>Submit Claim Form</strong>: select Event and Task, input Category, Amount (₹), Bank Account details, UPI ID, and drag invoice receipt into dropzone. Click <span class="action-trigger">Submit Claim</span>.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Claim Submission Form</span>
          </div>
          <img src="screenshots/steps/05_training_associate/02_claim_submission_form.png" alt="Claim Submission Form">
          <div class="screenshot-caption">Figure 4.5.2: Collaborator reimbursement form with receipt upload and structured bank details.</div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Step 3: Manage 3D Digital Keycard Profile</span>
          <span class="step-badge">Route: /dashboard/visiting-card</span>
        </div>
        <p>Click <span class="action-trigger">Edit Card</span> to customize bio and LinkedIn. Preview interactive 3D keycard and click <em>Download vCard</em> for contactless sharing.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — 3D Keycard Profile</span>
          </div>
          <img src="screenshots/steps/05_training_associate/03_digital_keycard_profile.png" alt="Digital Keycard Profile">
          <div class="screenshot-caption">Figure 4.5.3: WebGL 3D interactive holographic digital visiting card profile.</div>
        </div>
      </div>
    </section>

    <section id="playbook-tier4">
      <h2>4.6 Playbook: Tiers 4 &amp; 7 — Chief Advisor &amp; Alumni</h2>
      <p>Senior institutional mentors and alumni enjoy comprehensive read-only transparency without administrative write privileges.</p>

      <div class="step-box">
        <div class="step-header">
          <span class="step-title">Chief Advisor View-Only Experience</span>
          <span class="step-badge">Route: /dashboard/home</span>
        </div>
        <p>The <strong>Chief Advisor</strong> role has read access across all performance charts, event summaries, and financial reports. Action buttons (Create, Approve, Delete) are disabled by architecture.</p>
        <div class="screenshot-card">
          <div class="screenshot-header">
            <div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
            <span>Live Action Capture — Chief Advisor View-Only Mode</span>
          </div>
          <img src="screenshots/steps/06_chief_advisor/01_chief_advisor_view_only.png" alt="Chief Advisor View">
          <div class="screenshot-caption">Figure 4.6.1: Consultative view-only dashboard providing high-level institutional oversight.</div>
        </div>
      </div>
    </section>

    <section id="shared-procedures">
      <h2>4.7 Standard Shared Operating Procedures</h2>
      <div class="callout">
        <p><strong>Note on Shared Procedures:</strong> To avoid operational redundancy, the following standard workflows follow the exact same interface steps across all eligible roles:</p>
      </div>
      <ul>
        <li><strong>Filing a Reimbursement Claim:</strong> Identical for Training Associates (Tier 6), Core Members (Tier 5), and Faculty (Tier 3). All claims require receipts and UPI/bank details.</li>
        <li><strong>Turnstile Gate Check-in:</strong> Identical for Volunteers (Tier 6), Core Members (Tier 5), and Security (Tier 3). The camera kiosk automatically validates serial tokens.</li>
        <li><strong>Password &amp; Account Activation:</strong> Identical single-use token activation flow for all new members across all tiers.</li>
      </ul>
    </section>

    <!-- SECTION 3: WORKSPACE MODULES GALLERY -->
    <section id="mod-dashboard">
      <h2>3.1 Home Dashboard</h2>
      <p>Unified executive landing page featuring real-time stat rollups, period filtering, and urgent action alerts.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/home</span></div>
        <img src="screenshots/02_dashboard_home.png" alt="Home Dashboard">
        <div class="screenshot-caption">Figure 3.1: Live Home Dashboard with active metric cards and project timeline.</div>
      </div>
    </section>

    <section id="mod-events">
      <h2>3.2 Events Management</h2>
      <p>Manage the full lifecycle of university conclaves, symposiums, hackathons, and cultural festivals.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/events</span></div>
        <img src="screenshots/03_events_management.png" alt="Events Management">
        <div class="screenshot-caption">Figure 3.2: Live Events Management directory.</div>
      </div>
    </section>

    <section id="mod-passes">
      <h2>3.3 Event Passes &amp; Gate Turnstile Scanner</h2>
      <p>On-the-spot pass studio, Apple/Google Wallet sync, and full-screen camera QR turnstile scanner.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/event-passes</span></div>
        <img src="screenshots/04_event_passes.png" alt="Event Passes">
        <div class="screenshot-caption">Figure 3.3: Pass studio and gate check-in scanner.</div>
      </div>
    </section>

    <section id="mod-tasks">
      <h2>3.4 Tasks Management &amp; Gantt Timeline</h2>
      <p>Kanban deliverable tracking, subtask checklists, and interactive Gantt scheduling engine.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/tasks</span></div>
        <img src="screenshots/05_tasks_gantt.png" alt="Tasks &amp; Gantt">
        <div class="screenshot-caption">Figure 3.4: Tasks kanban board and chronological Gantt schedule.</div>
      </div>
    </section>

    <section id="mod-ratings">
      <h2>3.5 Performance Ratings &amp; Evaluations</h2>
      <p>Multi-criteria performance scoring (1–5 stars) across leadership, execution, and collaboration.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/ratings</span></div>
        <img src="screenshots/06_performance_ratings.png" alt="Performance Ratings">
        <div class="screenshot-caption">Figure 3.5: Committee member performance scoring portal.</div>
      </div>
    </section>

    <section id="mod-procurement">
      <h2>3.6 Procurement &amp; Requisitions</h2>
      <p>Material requisitions with quotation attachments and automated order tracking.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/procurement</span></div>
        <img src="screenshots/07_procurement.png" alt="Procurement">
        <div class="screenshot-caption">Figure 3.6: Material requisitions and vendor quotation management.</div>
      </div>
    </section>

    <section id="mod-reimbursements">
      <h2>3.7 Financial Reimbursements &amp; 3-Gate Audit</h2>
      <p>Rigorous 3-gate financial audit: Gate 1 (Sector Head) → Gate 2 (Finance Head) → Gate 3 (Centre Head Settlement).</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/reimbursements</span></div>
        <img src="screenshots/08_reimbursements.png" alt="Reimbursements">
        <div class="screenshot-caption">Figure 3.7: 3-gate reimbursement ledger and receipt audit trail.</div>
      </div>
    </section>

    <section id="mod-budget">
      <h2>3.8 Budgeting, P&amp;L &amp; Funds</h2>
      <p>Master budget allocations, sponsorship revenue tracking, and actual vs projected expenditure.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/budget</span></div>
        <img src="screenshots/09_budgeting_funds.png" alt="Budgeting">
        <div class="screenshot-caption">Figure 3.8: Institutional budget allocation and variance analytics.</div>
      </div>
    </section>

    <section id="mod-designs">
      <h2>3.9 Design Portal &amp; AI OCR Spellcheck</h2>
      <p>Poster upload portal with Tesseract OCR optical inspection, faculty proofreading, and caption generation.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/designs</span></div>
        <img src="screenshots/10_design_portal.png" alt="Design Portal">
        <div class="screenshot-caption">Figure 3.9: Creative design proofing and optical spellcheck interface.</div>
      </div>
    </section>

    <section id="mod-forms">
      <h2>3.10 Dynamic Form Builder</h2>
      <p>Drag-and-drop form designer with instant public URL and submission dataset exports.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/forms</span></div>
        <img src="screenshots/11_dynamic_forms.png" alt="Forms">
        <div class="screenshot-caption">Figure 3.10: Form designer and live attendee response tracker.</div>
      </div>
    </section>

    <section id="mod-visiting-card">
      <h2>3.11 Digital Visiting Cards &amp; 3D Keycard</h2>
      <p>Interactive 3D WebGL rotating keycard with vCard export and personal portfolio links.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/visiting-card</span></div>
        <img src="screenshots/12_visiting_card.png" alt="Visiting Card">
        <div class="screenshot-caption">Figure 3.11: 3D interactive holographic visiting card.</div>
      </div>
    </section>

    <section id="mod-guest-directory">
      <h2>3.12 Guest Directory &amp; VIP Protocols</h2>
      <p>VIP dignitary roster with physical visiting card OCR scanner and protocol guidelines.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/guest-directory</span></div>
        <img src="screenshots/13_guest_directory.png" alt="Guest Directory">
        <div class="screenshot-caption">Figure 3.12: Dignitary contacts and protocol management directory.</div>
      </div>
    </section>

    <section id="mod-guest-invites">
      <h2>3.13 VIP Mail Merge &amp; Invitations</h2>
      <p>Personalized tokenized batch email invitations with live delivery progress tracking.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/guest-invites</span></div>
        <img src="screenshots/14_mail_merge_invites.png" alt="Mail Merge">
        <div class="screenshot-caption">Figure 3.13: Tokenized mail merge invitation dispatch console.</div>
      </div>
    </section>

    <section id="mod-announcements">
      <h2>3.14 Announcements Engine</h2>
      <p>Scoped broadcasts delivering targeted notifications to specific departments or committees.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/announcements</span></div>
        <img src="screenshots/15_announcements.png" alt="Announcements">
        <div class="screenshot-caption">Figure 3.14: Announcements composer and scoped delivery engine.</div>
      </div>
    </section>

    <section id="mod-calendar">
      <h2>3.15 Master Calendar &amp; Venue Booking</h2>
      <p>Multi-campus calendar with iCal subscription feed and conflict detection.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/calendar</span></div>
        <img src="screenshots/16_master_calendar.png" alt="Master Calendar">
        <div class="screenshot-caption">Figure 3.15: Master campus schedule and calendar feed.</div>
      </div>
    </section>

    <section id="mod-festivals">
      <h2>3.16 University Festivals &amp; Academic Breaks</h2>
      <p>Pre-populated institutional breaks to prevent event scheduling collisions.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/festivals</span></div>
        <img src="screenshots/17_festivals.png" alt="Festivals">
        <div class="screenshot-caption">Figure 3.16: Academic holidays and festival conflict checker.</div>
      </div>
    </section>

    <section id="mod-event-reports">
      <h2>3.17 Executive Event Reports &amp; Exports</h2>
      <p>Structured post-event reports with attendance metrics, expenses, and formal PDF/DOCX generation.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/event-reports</span></div>
        <img src="screenshots/18_event_reports.png" alt="Event Reports">
        <div class="screenshot-caption">Figure 3.17: Post-event executive report editor.</div>
      </div>
    </section>

    <section id="mod-reports">
      <h2>3.18 Operational Analytics</h2>
      <p>Consolidated data charts with participation trends and budget utilization metrics.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/reports</span></div>
        <img src="screenshots/19_reports_analytics.png" alt="Reports &amp; Analytics">
        <div class="screenshot-caption">Figure 3.18: High-contrast charts and performance rollups.</div>
      </div>
    </section>

    <section id="mod-approvals">
      <h2>3.19 Unified Approvals Inbox</h2>
      <p>Single cross-module queue for all pending event, budget, task, and reimbursement requests.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/approvals</span></div>
        <img src="screenshots/20_approvals_inbox.png" alt="Approvals Inbox">
        <div class="screenshot-caption">Figure 3.19: Unified approvals sorting requests across departments.</div>
      </div>
    </section>

    <section id="mod-directory">
      <h2>3.20 Members Directory &amp; RBAC Governance</h2>
      <p>Institutional user provisioning, activation token generation, and role transitions.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/directory</span></div>
        <img src="screenshots/21_members_directory.png" alt="Members Directory">
        <div class="screenshot-caption">Figure 3.20: Member roster management and activation tracker.</div>
      </div>
    </section>

    <section id="mod-policies">
      <h2>3.21 Custom Group Policies</h2>
      <p>Dynamic permission override rules and cross-functional committee capability matrix.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/policies</span></div>
        <img src="screenshots/22_group_policies.png" alt="Group Policies">
        <div class="screenshot-caption">Figure 3.21: Dynamic access control policy builder.</div>
      </div>
    </section>

    <section id="mod-email">
      <h2>3.22 Email Engine &amp; Queue Logs</h2>
      <p>SMTP delivery queue logs, bounce diagnostics, and automated schedule triggers.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/email</span></div>
        <img src="screenshots/23_email_management.png" alt="Email Management">
        <div class="screenshot-caption">Figure 3.22: Outbound email delivery queue and diagnostic logs.</div>
      </div>
    </section>

    <section id="mod-backup">
      <h2>3.23 Encrypted Backup &amp; Restore</h2>
      <p>AES-256-GCM point-in-time disaster recovery snapshots with offline decryption tools.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/backup</span></div>
        <img src="screenshots/24_backup_restore.png" alt="Backup and Restore">
        <div class="screenshot-caption">Figure 3.23: Encrypted backup creation and restore portal.</div>
      </div>
    </section>

    <section id="mod-settings">
      <h2>3.24 System Settings &amp; Security Controls</h2>
      <p>Session timeout controls, institutional branding, maintenance mode toggles, and master key security.</p>
      <div class="screenshot-card">
        <div class="screenshot-header"><div class="dot-group"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><span>Screenshot — /dashboard/settings</span></div>
        <img src="screenshots/25_system_settings.png" alt="System Settings">
        <div class="screenshot-caption">Figure 3.24: Institutional security settings and system controls.</div>
      </div>
    </section>
  </main>

  <script>
    function filterManual() {
      const q = document.getElementById('manualSearch').value.toLowerCase();
      const sections = document.querySelectorAll('main section');
      sections.forEach(sec => {
        const text = sec.innerText.toLowerCase();
        sec.style.display = text.includes(q) ? 'block' : 'none';
      });
    }

    function filterRole() {
      const role = document.getElementById('roleFilter').value;
      const sections = document.querySelectorAll('main section');
      if (role === 'all') {
        sections.forEach(s => s.style.display = 'block');
        return;
      }
      
      sections.forEach(s => {
        const id = s.id;
        if (role === 'devops' && (id === 'setup-stage' || id === 'superuser-seeding' || id === 'vps-deployment' || id === 'deploy-script' || id === 'mod-backup' || id === 'mod-settings')) {
          s.style.display = 'block';
        } else if (role === 'tier1') {
          s.style.display = 'block';
        } else if (role === 'tier2' && (id.includes('playbook-tier2') || id.includes('matrix') || id === 'mod-dashboard' || id === 'mod-events' || id === 'mod-approvals' || id === 'mod-budget' || id === 'mod-reimbursements')) {
          s.style.display = 'block';
        } else if (role === 'tier3' && (id.includes('playbook-tier3') || id.includes('matrix') || id === 'mod-tasks' || id === 'mod-reimbursements' || id === 'mod-events')) {
          s.style.display = 'block';
        } else if (role === 'tier5' && (id.includes('playbook-tier5') || id.includes('matrix') || id === 'mod-events' || id === 'mod-passes' || id === 'mod-forms' || id === 'mod-event-reports')) {
          s.style.display = 'block';
        } else if (role === 'tier6' && (id.includes('playbook-tier6') || id === 'shared-procedures' || id === 'mod-tasks' || id === 'mod-reimbursements' || id === 'mod-visiting-card')) {
          s.style.display = 'block';
        } else if (role === 'tier4' && (id.includes('playbook-tier4') || id.includes('matrix') || id === 'mod-reports')) {
          s.style.display = 'block';
        } else {
          s.style.display = 'none';
        }
      });
    }

    window.addEventListener('scroll', () => {
      const links = document.querySelectorAll('.toc a');
      const sections = document.querySelectorAll('main section');
      let current = '';
      sections.forEach(sec => {
        const top = sec.offsetTop;
        if (window.scrollY >= top - 100) current = sec.getAttribute('id');
      });
      links.forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === '#' + current) a.classList.add('active');
      });
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('docs/manual.html', manualHtmlContent);
fs.writeFileSync('leads-dashboard/public/manual.html', manualHtmlContent);
console.log('✅ docs/manual.html and leads-dashboard/public/manual.html updated!');

// Generate LEADS_ERP_User_Manual.pdf via Edge CDP printToPDF
async function generatePdf() {
  console.log('📑 Launching headless Edge to print PDF...');
  const PORT = 9224;
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'http://localhost:3030/manual.html'
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
  await send('Page.navigate', { url: 'http://localhost:3030/manual.html' });
  await new Promise(r => setTimeout(r, 4000)); // wait for full rendering and images

  console.log('🖨 Printing to PDF...');
  const pdfRes = await send('Page.printToPDF', {
    printBackground: true,
    marginTop: 0.3,
    marginBottom: 0.3,
    marginLeft: 0.3,
    marginRight: 0.3,
    paperWidth: 8.27,
    paperHeight: 11.69
  });

  const pdfBuffer = Buffer.from(pdfRes.data, 'base64');
  fs.writeFileSync('docs/LEADS_ERP_User_Manual.pdf', pdfBuffer);
  console.log(`✅ PDF successfully compiled: docs/LEADS_ERP_User_Manual.pdf (${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

  ws.close();
  edgeProc.kill();
}

generatePdf().catch(err => {
  console.error('PDF generation error:', err);
  process.exit(1);
});
