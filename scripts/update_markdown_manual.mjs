import fs from 'fs';

const manualMdPath = 'docs/USER_MANUAL.md';
let content = fs.readFileSync(manualMdPath, 'utf8');

const masterMatrixMd = `### 2.2 Master Designation x Module Privileges Matrix

The comprehensive matrix below defines the exact operational authority of every institutional role across the 24 workspace modules:

| Module / Route | Super User (T1) | Centre Head & Advisor (T2) | Finance Head (T3) | Sector / Dept Head (T3/5) | General Secretary (T5) | Core Member (T5) | Training Assoc. (T6) | Chief Advisor (T4) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard Home** (\`/dashboard/home\`) | **Full** | **Full** | View All | View All | View All | View All | Own Only | View Only |
| **Events Management** (\`/dashboard/events\`) | **Full** | **Approve** | View All | Create | Create | Create (Req Sign-off) | Own Only | View Only |
| **Event Passes & Scanner** (\`/dashboard/event-passes\`) | **Full** | **Full** | View All | **Full** | **Full** | Issue / Scan | Scan Kiosk | View Only |
| **Tasks & Gantt** (\`/dashboard/tasks\`) | **Full** | **Full** | View All | Assign / Edit | Create | Own / Exec | Execute Task | View Only |
| **Reimbursements (Gate 1)** (\`/dashboard/reimbursements\`) | **Full** | **Sign-off** | View All | **Approve Gate 1** | Submit Claim | Submit Claim | Submit Claim | View Only |
| **Reimbursements (Gate 2)** (\`/dashboard/reimbursements\`) | **Full** | **Audit** | **Verify Gate 2** | — | — | — | — | View Only |
| **Reimbursements (Gate 3)** (\`/dashboard/reimbursements\`) | **Full** | **Settle Gate 3** | — | — | — | — | — | View Only |
| **Budgeting & Funds** (\`/dashboard/budget\`) | **Full** | **Full Allocation** | **Manage Funds** | View All | View All | — | — | View Only |
| **Design Portal & OCR** (\`/dashboard/designs\`) | **Full** | **Full** | View All | Approve Proof | Upload | Upload / Proof | Upload | View Only |
| **Dynamic Form Builder** (\`/dashboard/forms\`) | **Full** | **Approve Live** | **Approve Live** | Build (Req Sign) | Build Form | Build Form | — | View Only |
| **Event Reports** (\`/dashboard/event-reports\`) | **Full** | **Approve Report** | View All | View All | **Submit Report** | — | — | View Only |
| **Members Directory** (\`/dashboard/directory\`) | **Add / Terminate** | **Add Member** | View Roster | View Roster | View Roster | View Roster | Own Profile | View Only |
| **Group Policies** (\`/dashboard/policies\`) | **Full** | **Full** | — | — | — | — | — | — |
| **Backup & Restore** (\`/dashboard/backup\`) | **Full** | — | — | — | — | — | — | — |
| **System Settings** (\`/dashboard/settings\`) | **Full** | — | — | — | — | — | — | — |

> **Access Legend:**
> - **Full**: Unrestricted administrative governance, capability grants, deletions, and overrides.
> - **Approve**: Authority to approve or reject submissions in this module.
> - **Create**: Can author records (routes through sign-off where indicated).
> - **View All / View Only**: Read-only institutional transparency without mutation affordances.
> - **Own Only**: Restricted strictly to personal assigned deliverables, profile, or submitted claims.
> - **—**: Feature access hidden or disabled by RBAC governance.
`;

// Replace Section 2.2
content = content.replace(
  /### 2\.2 Role Matrix Summary[\s\S]*?(?=### 2\.3 Super User Quick Switch)/,
  masterMatrixMd + '\n'
);

const illustratedPlaybooksMd = `## 4. Step-by-Step Operator Playbooks by Designation

This section details the exact step-by-step procedures for each institutional role, including the primary action buttons, what happens on each click, and actual live application screenshots.

---

### 4.1 Playbook: Tier 1 — Super User Administration
*Applicable Designation:* **Super User / System Administrator**

#### Step 1: Real-Time Role Impersonation via Persona Switcher
1. Navigate to **Home Dashboard** (\`/dashboard/home\`).
2. Click the **Account Switcher** (UserCog icon) in the header navigation bar.
3. Select any registered member from the searchable dropdown roster.
4. **What Happens:** The entire client interface re-renders under that target user's exact tier, department, and permissions. An amber notification banner pins to the header: *"Impersonating [Name] — Return to Super User"*.
5. Click **Return to Super User** at any time to restore root administrative credentials.

![Super User Persona Switcher](screenshots/steps/01_super_user/02_persona_switcher_active.png)
*Figure 4.1.1: Live captured Super User quick-switch dropdown menu.*

#### Step 2: Member Account Provisioning & Password Override
1. Navigate to **Members Directory** (\`/dashboard/directory\`).
2. Click **+ Add Member**.
3. Fill in Name, Institutional Email, select Division (*Faculty*, *Core Committee*, *Training Associate*, or *Alumni*), and assign Department and Position.
4. Click **Add Member**.
5. **What Happens:** The system creates the member record, generates a single-use activation token (\`act-...\`), and dispatches an onboarding email. Alternatively, the Super User can click **Set Password Directly** to establish credentials immediately without OTP.

![Member Provisioning Modal](screenshots/steps/01_super_user/04_add_member_modal.png)
*Figure 4.1.2: Live captured member provisioning modal.*

#### Step 3: Granular Access Control & Group Policies
1. Navigate to **Group Policies** (\`/dashboard/policies\`).
2. Review the built-in access levels or click **+ Create Policy**.
3. Toggle module view/edit grants and capability tags (e.g., \`PROPOSE_BUDGET\`, \`MANAGE_EVENT_PASSES\`).
4. Click **Save Policies**.
5. **What Happens:** Target members inherit the capability tag immediately with reactive cross-device sync.

![Group Policies Builder](screenshots/steps/01_super_user/05_group_policies_matrix.png)
*Figure 4.1.3: Live captured group policies capability editor.*

#### Step 4: Encrypted AES-256 Disaster Recovery Snapshot
1. Navigate to **Backup & Restore** (\`/dashboard/backup\`).
2. Click **Create Encrypted Backup Now**.
3. **What Happens:** The server dumps all collections (JSON and SQLite), compresses the payload, encrypts it under AES-256-GCM using \`DATA_ENCRYPTION_KEY\`, and downloads a \`.leads.enc\` archive.
4. To recover from a catastrophe, drag the snapshot into the **Restore Dropzone**, input the decryption passphrase, and click **Execute Restoration**.

![Encrypted Backup Portal](screenshots/steps/01_super_user/06_encrypted_backup_portal.png)
*Figure 4.1.4: Live captured AES-256 encrypted backup and point-in-time recovery screen.*

---

### 4.2 Playbook: Tier 2 — Centre Head & Faculty Advisor
*Applicable Designations:* **Centre Head**, **Faculty Advisor**, and **Head of Events (GG Campus - Tier 2.5)**

#### Step 1: Manage Unified Approvals Inbox
1. Navigate to **Approvals Inbox** (\`/dashboard/approvals\`).
2. Filter by category (*Events*, *Tasks*, *Reimbursements*, *Budgets*, *Forms*).
3. Inspect pending proposal details.
4. Click **Approve (Checkmark)** to grant authorization, or click **Reject (Cross)** and supply audit feedback notes.
5. **What Happens:** The item updates instantly across all active client devices within 7 seconds.

![Approvals Inbox Queue](screenshots/steps/02_centre_head/01_approvals_inbox_queue.png)
*Figure 4.2.1: Live captured unified approvals inbox queue.*

#### Step 2: Executive Event Proposal Sanction
1. Navigate to **Events** (\`/dashboard/events\`).
2. Filter by \`Pending Approval\` to isolate new proposals.
3. Review proposed budget ceiling, venue selection, target delegate attendance, and committee assignments.
4. Click **Approve Proposal**.
5. **What Happens:** Event transitions to \`Active\` on the university calendar, unlocking pass issuance and dynamic form generation.

![Events Executive View](screenshots/steps/02_centre_head/02_events_executive_view.png)
*Figure 4.2.2: Live captured events management dashboard with proposal sanction controls.*

#### Step 3: Gate-3 Financial Reimbursement Final Settlement
1. Navigate to **Reimbursements** (\`/dashboard/reimbursements\`).
2. Filter for claims with status \`Verified by Finance Head (Gate 2 Passed)\`.
3. Inspect claimant's bank account number, IFSC code, and attached GST invoice vouchers.
4. Click **Disburse / Settle Gate 3**.
5. **What Happens:** Claim badge turns green (\`Settled\`), payment timestamp is stamped into the immutable audit ledger, and the event's actual expenditure figure updates automatically.

![Gate 3 Settlement](screenshots/steps/02_centre_head/03_reimbursements_gate3_settlement.png)
*Figure 4.2.3: Live captured Gate-3 financial reimbursement settlement portal.*

---

### 4.3 Playbook: Tier 3 — Department Heads & Finance Head
*Applicable Designations:* **Head of Finance**, **Head of Events (RTC Campus)**, **Sector & Department Heads**

#### Step 1: Gate-2 Financial & GST Treasury Audit (Head of Finance)
1. Open **Reimbursements** (\`/dashboard/reimbursements\`). Note: Claims only appear on the Finance Head's board after Gate-1 approval by the Sector Head!
2. Click on the claim row to expand receipt previews and vendor tax details.
3. Verify that invoice items match institutional guidelines.
4. Click **Verify Gate 2**.
5. **What Happens:** Claim advances to Gate 3 for Centre Head final disbursement.

![Gate 2 Financial Audit](screenshots/steps/03_dept_heads/01_reimbursements_gate2_audit.png)
*Figure 4.3.1: Live captured Gate-2 financial audit portal.*

#### Step 2: Assign Department Task Deliverables (Department Heads)
1. Navigate to **Tasks** (\`/dashboard/tasks\`).
2. Click **+ New Task**.
3. Select Target Event, Assignee from your department, Priority (*Low*, *Medium*, *High*, *Urgent*), Deadline, and add subtask checklist items.
4. Click **Assign Task**.
5. **What Happens:** An automated assignment notification is dispatched to the student associate, and the task card appears in their personal workspace.

![Task Creation Modal](screenshots/steps/03_dept_heads/03_new_task_modal.png)
*Figure 4.3.2: Live captured task assignment modal with checklist criteria.*

#### Step 3: Supervise Milestones in Gantt Timeline View
1. On the **Tasks** page, click **Timeline / Gantt View**.
2. **What Happens:** Layout switches from cards to a chronological schedule grid displaying milestones, deadlines, and dependencies.

![Gantt Timeline View](screenshots/steps/03_dept_heads/04_tasks_gantt_timeline.png)
*Figure 4.3.3: Live captured Gantt timeline schedule.*

---

### 4.4 Playbook: Tier 5 — Core Committee & Secretariat
*Applicable Designations:* **President**, **Vice President**, **General Secretary**, **Chief Coordinator**, **Core Committee Members**

#### Step 1: Draft Event Proposal in Event Studio
1. Navigate to **Events** (\`/dashboard/events\`) and click **+ Create Event**.
2. Input Title, Dates, Venue, Budget Estimate, and Target Attendance.
3. Assign Committee Leads for Logistics, Hospitality, Social Media, and Stage Management.
4. Click **Submit Proposal**.
5. **What Happens:** Event proposal routes to Centre Head/Advisor queue in \`Pending Approval\` status.

![Create Event Studio](screenshots/steps/04_core_committee/01_create_event_studio_modal.png)
*Figure 4.4.1: Live captured Event Studio modal.*

#### Step 2: Configure & Issue Passes in Pass Studio
1. Navigate to **Event Passes** (\`/dashboard/event-passes\`).
2. Click **+ Generate Pass** (or select **Pass Studio**).
3. Select pass category (*VIP Pass*, *Student Delegate*, *Speaker*, *Organizer*).
4. Enter attendee details and click **Issue Pass**.
5. **What Happens:** System generates a signed digital pass with high-entropy QR serial number and delivers it via email with Apple/Google Wallet links.

![Pass Studio Workspace](screenshots/steps/04_core_committee/02_pass_studio_workspace.png)
*Figure 4.4.2: Live captured Event Pass Studio.*

#### Step 3: Operate Gate Turnstile Scanner Kiosk
1. Navigate to **Event Passes** (\`/dashboard/event-passes\`).
2. Click **Launch Turnstile Scanner**.
3. Allow camera access. Align attendee's QR pass inside the scanning reticle.
4. **What Happens:** Audio chime sounds. Green banner displays attendee name, category, and photo (*"Admitted"*). If already scanned, a red warning displays (*"Already Checked In at [Time]"*).

![Turnstile Scanner Kiosk](screenshots/steps/04_core_committee/03_turnstile_scanner_viewfinder.png)
*Figure 4.4.3: Live captured Turnstile Scanner viewfinder kiosk.*

#### Step 4: Build Public Registration Forms
1. Navigate to **Forms** (\`/dashboard/forms\`).
2. Click **+ Create New Form**.
3. Drag and drop form fields (*Text Input*, *Dropdown*, *Multiple Choice*, *File Upload*).
4. Click **Publish Form**.
5. **What Happens:** Activates public link (\`/forms/[slug]\`) and generates QR code for promotional posters.

![Dynamic Form Builder](screenshots/steps/04_core_committee/04_dynamic_form_builder.png)
*Figure 4.4.4: Live captured Dynamic Form Builder canvas.*

#### Step 5: Submit Official Post-Event Report (General Secretary)
1. Navigate to **Event Reports** (\`/dashboard/event-reports\`).
2. Click **+ Submit Event Report**.
3. Select completed event; enter Final Delegate Turnout, Actual Budget Spent, Upload Event Photographs, and Key Recommendations.
4. Click **Submit for Review**.
5. **What Happens:** Locks report and sends notification to Centre Head for formal institutional archiving and PDF/DOCX compilation.

![Event Report Portal](screenshots/steps/04_core_committee/05_general_secretary_event_report.png)
*Figure 4.4.5: Live captured General Secretary event reporting interface.*

---

### 4.5 Playbook: Tier 6 — Training Associates & Student Members
*Applicable Designations:* **Training Associates**, **Student Volunteers**, **Committee Interns**

#### Step 1: Acknowledge & Execute Assigned Tasks
1. Navigate to **Tasks** (\`/dashboard/tasks\`) and view **My Tasks**.
2. Click **Acknowledge Task** to confirm receipt.
3. Update status dropdown from \`Assigned\` to \`In Progress\`.
4. Check off individual subtask items as you finish them.
5. Upload deliverable files and select **Mark Completed**.

![Student Task Checklist](screenshots/steps/05_training_associate/01_student_task_checklist.png)
*Figure 4.5.1: Live captured student task card with acknowledgement and subtask checklist.*

#### Step 2: File Expense Reimbursement Claim
1. Navigate to **Reimbursements** (\`/dashboard/reimbursements\`).
2. Under **Submit Claim Form**:
   - Select linked Event and Task.
   - Enter Category (e.g. *Printing & Stationary*, *Hardware*), Amount (₹), and Description.
   - Provide Bank Name, Account Number, IFSC Code, and UPI ID.
   - Drag and drop invoice receipts into the **Receipt File Dropzone**.
3. Click **Submit Reimbursement Claim**.
4. **What Happens:** Claim enters \`Pending Gate-1 Approval\` and notifies your Department Head.

![Claim Submission Form](screenshots/steps/05_training_associate/02_claim_submission_form.png)
*Figure 4.5.2: Live captured reimbursement claim submission form.*

#### Step 3: Manage 3D Digital Keycard Profile
1. Navigate to **Visiting Card** (\`/dashboard/visiting-card\`).
2. Click **Edit Card Information** to configure Bio, Phone, and LinkedIn.
3. Drag with your mouse or finger to spin the 3D WebGL holographic keycard.
4. Click **Download vCard (.vcf)** or display QR code for contactless contact sharing.

![Digital Keycard Profile](screenshots/steps/05_training_associate/03_digital_keycard_profile.png)
*Figure 4.5.3: Live captured 3D interactive holographic digital visiting card.*

---

### 4.6 Playbook: Tiers 4 & 7 — Chief Advisor & Alumni
*Applicable Designations:* **Chief Advisor**, **Advisory Board Members**, **Alumni**

- **Chief Advisor (View-Only Mode):** Holds comprehensive read-only transparency across all operational metrics, budgets, and event reports. Action buttons (*Create*, *Edit*, *Approve*, *Delete*) are disabled by architecture.
- **Alumni Members:** Have access to public event archives, alumni networking rosters, and personal digital keycards.

![Chief Advisor View-Only](screenshots/steps/06_chief_advisor/01_chief_advisor_view_only.png)
*Figure 4.6.1: Live captured Chief Advisor consultative view-only mode.*

---

### 4.7 Standard Shared Operating Procedures
The following operational workflows are standardized across all roles:
1. **Reimbursement Claim Submission:** Follows the exact same submission procedure across Training Associates, Core Members, and Faculty.
2. **Turnstile Gate Check-in:** Standardized camera QR scanning interface used by volunteers, security leads, and organizers.
3. **One-Time Token Activation:** Standardized secure password setup procedure for all provisioned institutional accounts.
`;

// Replace Section 4
content = content.replace(
  /## 4\. Step-by-Step Workflows by Role[\s\S]*?(?=## 5\. Troubleshooting & Frequently Asked Questions)/,
  illustratedPlaybooksMd + '\n'
);

fs.writeFileSync(manualMdPath, content);
console.log('✅ docs/USER_MANUAL.md updated with Master Matrix & Illustrated Playbooks!');
