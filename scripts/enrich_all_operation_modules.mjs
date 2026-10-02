import fs from 'fs';
import path from 'path';

const manualMdPath = 'docs/USER_MANUAL.md';
let content = fs.readFileSync(manualMdPath, 'utf8');

// =========================================================================
// SECTION 3.2: EVENTS MANAGEMENT
// =========================================================================
const eventsMd = `### 3.2 Events Management
The **Events Management** module (\`/dashboard/events\`) is the operational engine of the LEADS ERP. It coordinates the complete lifecycle of university hackathons, conferences, technical symposiums, and cultural festivals from initial ideation to post-event reporting.

> **Access Permissions & Scoping:**
> - **Proposal & Setup:** Tier 1 (Super User), Tier 2 (Centre Head), Tier 3 (Department Heads), and Tier 5 (Core Committee Leads).
> - **Executive Approval:** Tier 2 (Centre Head) and Tier 2.5 / Tier 3 (Faculty Event Heads).
> - **Student Visibility:** Tier 6 (Training Associates) view events they are appointed to.

![Events Management Main View](screenshots/steps/02_events_management/01_events_main_view.png)
*Figure 3.2.1: Events directory showing active event cards, campus filters, budget utilization bars, and status pills.*

#### 1. Event Status Lifecycle
Events transition through five strictly enforced operational states:
\`\`\`
[Draft] ──► [Pending Approval] ──► [Approved / Active] ──► [Completed] ──► [Archived]
                 │                           │
                 └──► Rejected (Returned)    └──► Cancelled
\`\`\`

---

#### Step 1: Creating an Event Proposal
1. Navigate to **Events** from the sidebar.
2. Click the **+ Create Event** button in the top toolbar.
3. The **Create New Event** modal opens.
4. Fill in the event configuration according to the table below.

#### Input Field Reference ("What Information Goes Where")
| Field Label | Input Type | Where to Enter | Allowed Format / Values | Description & System Behavior |
|---|---|---|---|---|
| **Event Title \\*** | Text Input | First input box | Full title (e.g. \`National Youth Tech Conclave 2026\`) | Official institutional event name. Appears on delegate badges, public registrations, and financial vouchers. |
| **Event Code \\*** | Text Input | Second input box | Unique alphanumeric string (e.g. \`TECHCON-2026\`) | Internal ledger prefix used to tag procurement claims, passes, and task queues. |
| **Campus / Venue \\*** | Select Dropdown | Left column dropdown | \`Ramaiah Technology Centre (RTC)\`, \`Gnanagangothri Campus (GG)\`, \`Virtual / Online\` | Sets geographic venue and automatically assigns campus jurisdiction to the relevant Faculty Head. |
| **Start & End Dates \\*** | Date & Time Pickers | Middle row | Valid future date range | Defines active operational window. Automatically synchronizes with Master Calendar and Festival timetable. |
| **Estimated Budget \\*** | Currency Input | Right column | Integer INR (e.g. \`₹1,50,000\`) | Proposed financial allocation. Subject to Gate-1 faculty review and Centre Head clearance. |
| **Target Capacity** | Number Input | Bottom row | Integer (e.g. \`500\`) | Maximum delegate capacity. Used by Event Passes studio to prevent over-subscription. |

![Create Event Modal Filled](screenshots/steps/02_events_management/02_create_event_modal_filled.png)
*Figure 3.2.2: Event proposal creation modal with campus venue, dates, budget estimates, and sub-committee allocation.*

---

#### Step 2: Sub-Committee Appointments & Leadership Delegation
A major strength of LEADS ERP is its built-in sub-committee governance. Rather than leaving tasks unassigned, organizers attach dedicated functional committees:
1. In the Event modal or detail view, click **+ Add Sub-Committee**.
2. Select the sub-committee category:
   - **Stage & AV Production:** Manages lighting, sound consoles, LED backdrops, and podium setup.
   - **Logistics & Procurement:** Handles equipment sourcing, transport, venue seating, and supplies.
   - **Hospitality & Protocol:** Dignitary escort, VIP green room management, catering, and guest kits.
   - **Media, Design & Social:** Promotional posters, live streaming, photography, and press releases.
   - **Registration & Badging:** Gate check-in kiosk operation, QR code scanning, and spot registrations.
3. Appoint a **Student Committee Lead** from the Core Committee roster.
4. Add committee volunteer members.

![Event Detail Committees](screenshots/steps/02_events_management/03_event_detail_committees.png)
*Figure 3.2.3: Event detail dossier displaying assigned sub-committees, lead student officers, task progress, and live attendance.*
`;

// Replace Section 3.2
content = content.replace(
  /### 3\.2 Events Management[\s\S]*?(?=### 3\.3 Event Passes)/,
  eventsMd + '\n'
);

// =========================================================================
// SECTION 3.3: EVENT PASSES & SCANNER KIOSK
// =========================================================================
const passesMd = `### 3.3 Event Passes & Live Scanner Kiosk
The **Event Passes** module (\`/dashboard/event-passes\`) provides digital ticketing, badge printing, and live gate access control.

> **Access Permissions & Scoping:**
> - **Badge Generation & Pass Studio:** Tier 1 (Super User), Tier 3 (Event Head), and Tier 5 (Core Committee Leads).
> - **Gate Scanner Access:** Gate volunteers and student workforce (Tiers 1, 3, 5, 6).

![Passes Studio Overview](screenshots/steps/03_event_passes/01_passes_studio_overview.png)
*Figure 3.3.1: Pass Studio interface featuring pass template designer, active attendee roster, and gate statistics.*

---

#### Step 1: Issuing a Pass (Single or Bulk)
1. Open **Event Passes** and click **+ Issue Pass** (or **Bulk CSV Ingest**).
2. Enter attendee details according to the input field reference:

#### Input Field Reference
| Field Label | Input Type | Where to Enter | Allowed Values | Description & System Behavior |
|---|---|---|---|---|
| **Attendee Full Name \\*** | Text Input | First input box | Full Name (e.g. \`Dr. Vikram Sarabhai\`) | Displayed in high-contrast typography on digital and printed passes. |
| **Email Address \\*** | Email Input | Second input box | Valid Email (\`attendee@institution.edu\`) | Destination address for automated PDF badge dispatch and Apple/Google Wallet links. |
| **Pass Category \\*** | Select Dropdown | Left dropdown | \`VIP Dignitary\`, \`Keynote Speaker\`, \`Faculty Delegate\`, \`Student Participant\` | Dictates pass color styling, lanyard badge layout, and gate security clearance privileges. |
| **Seat / Zone Assignment** | Text Input | Right input box | Row & Seat (e.g. \`Auditorium - Row A, Seat 12\`) | Printed on pass barcode payload for ushering. |

![Issue Pass Modal](screenshots/steps/03_event_passes/02_issue_pass_modal_filled.png)
*Figure 3.3.2: Issue pass modal with category badges, organization details, and instant email dispatch options.*

---

#### Step 2: Operating the Live Gate Scanner Kiosk
1. On event day, gate volunteers navigate to **Event Passes &rarr; Check-in Scanner**.
2. Grant camera permissions. The camera feed initializes with a high-contrast targeting reticle.
3. Present the attendee's QR badge (printed or displayed on smartphone).
4. **Instant Security Feedback:**
   - 🟢 **Green Flash & Chime:** Valid Pass. Displays Attendee Name, Category, and records check-in timestamp in \`event_passes.json\`.
   - 🔴 **Red Flash & Alarm:** Duplicate Check-in! Shows exact prior entry timestamp to prevent badge sharing.
   - 🟡 **Amber Flash:** Invalid or unapproved serial.

![Live Scanner Kiosk](screenshots/steps/03_event_passes/03_live_scanner_kiosk.png)
*Figure 3.3.3: Gate Scanner Kiosk with camera viewfinder, flashlight toggle, manual serial override, and live entry logs.*
`;

// Replace Section 3.3
content = content.replace(
  /### 3\.3 Event Passes & Live Scanner Kiosk[\s\S]*?(?=### 3\.4 Apple Wallet)/,
  passesMd + '\n'
);

// =========================================================================
// SECTION 3.5: TASKS & GANTT TIMELINE
// =========================================================================
const tasksMd = `### 3.5 Task Management, Delegation & Gantt Timeline
The **Tasks** module (\`/dashboard/tasks\`) coordinates deliverables across all operational tiers with integrated timeline scheduling.

![Tasks Board View](screenshots/steps/04_tasks_gantt/01_tasks_board_view.png)
*Figure 3.5.1: Task board view showing priority badges, committee tags, assignee avatars, and deadline countdowns.*

---

#### Step 1: Creating and Delegating a Task
1. Navigate to **Tasks** and click **+ New Task**.
2. Fill in task parameters:

#### Input Field Reference
| Field Label | Input Type | Where to Enter | Allowed Values | Description & System Behavior |
|---|---|---|---|---|
| **Task Title \\*** | Text Input | First input box | Concise title (e.g. \`Stage LED Wall Configuration & AV Soundcheck\`) | Summarizes the deliverable. Appears on dashboard action cards. |
| **Description** | Textarea | Main text area | Detailed instructions | Outlines technical requirements, dimensions, safety protocols, or file links. |
| **Assignee Type \\*** | Radio / Dropdown | Assignment section | \`Individual Member\` or \`Entire Committee\` | When *Committee* is chosen, every member appointed to that sub-committee receives visibility and notifications. |
| **Priority Level \\*** | Select Dropdown | Left column dropdown | \`High (Urgent)\`, \`Medium (Standard)\`, \`Low (Flexible)\` | High-priority items pin to the top of member dashboards with crimson badges. |
| **Deadline Date & Time \\***| Date/Time Picker | Right column picker | Future date & time | Triggers automated background email reminders 24 hours and 2 hours before expiration. |

![New Task Modal Filled](screenshots/steps/04_tasks_gantt/02_new_task_modal_filled.png)
*Figure 3.5.2: Task assignment modal with committee delegation, priority flags, and deadline scheduling.*

---

#### Step 2: Visualizing Schedule via Gantt Timeline
1. Switch to the **Gantt Timeline** tab in the top navigation rail.
2. The interactive timeline displays horizontal task bars grouped by sub-committee.
3. Identify overlapping deliverables, critical dependencies, and potential resource bottlenecks before event day.

![Gantt Timeline Active](screenshots/steps/04_tasks_gantt/03_gantt_timeline_active.png)
*Figure 3.5.3: Interactive Gantt timeline visualization with date markers and progress milestones.*
`;

// Replace Section 3.5
content = content.replace(
  /### 3\.5 Task Management, Delegation & Gantt Timeline[\s\S]*?(?=### 3\.6 Performance Ratings)/,
  tasksMd + '\n'
);

// =========================================================================
// SECTION 3.7: PROCUREMENT REQUISITIONS
// =========================================================================
const procurementMd = `### 3.7 Procurement & Equipment Requisitions
The **Procurement** module (\`/dashboard/procurement\`) enforces structured financial requisitions for equipment, sound rentals, printing, and consumables.

![Procurement Table View](screenshots/steps/05_procurement/01_procurement_requests_table.png)
*Figure 3.7.1: Equipment procurement ledger showing requisition status, vendor quotations, and cost breakdowns.*

---

#### Step 1: Submitting a Procurement Requisition
1. Navigate to **Procurement** and click **+ New Request**.
2. Fill in the requisition modal:

#### Input Field Reference
| Field Label | Input Type | Where to Enter | Allowed Values | Description & System Behavior |
|---|---|---|---|---|
| **Item Name \\*** | Text Input | First input box | Descriptive title (e.g. \`Heavy-Duty Industrial Extension Cables & Power Strips\`) | Identifies equipment or materials needed. |
| **Quantity \\*** | Number Input | Left number field | Positive integer (e.g. \`10\`) | Number of units requested. |
| **Estimated Cost (INR) \\*** | Currency Input | Right number field | Number in INR (e.g. \`₹12,500\`) | Total estimated price including taxes. |
| **Vendor Quotation (PDF) \\***| File Upload | Drag-and-drop zone | PDF or image scan (Max 10MB) | Mandatory competitive vendor quotation for financial audit compliance. |
| **Justification & Event** | Textarea | Bottom text area | Explanatory note | Explains why existing centre inventory cannot fulfill the requirement. |

![New Requisition Modal Filled](screenshots/steps/05_procurement/02_new_requisition_modal.png)
*Figure 3.7.2: Procurement request modal with vendor estimate upload and budget justification.*

---

#### Step 2: Multi-Stage Approval Sequence
\`\`\`
[Requisition Submitted] ──► [Level 1: Dept Head Clearance] ──► [Level 2: Centre Head Financial Approval] ──► [Fulfilled / Purchased]
\`\`\`
`;

// Replace Section 3.7
content = content.replace(
  /### 3\.7 Procurement & Equipment Requisitions[\s\S]*?(?=### 3\.8 Financial Reimbursements)/,
  procurementMd + '\n'
);

// =========================================================================
// SECTION 3.8: FINANCIAL REIMBURSEMENTS
// =========================================================================
const reimbursementsMd = `### 3.8 Financial Reimbursements & Multi-Gate Audit
The **Reimbursements** module (\`/dashboard/reimbursements\`) guarantees transparency and auditability for all out-of-pocket expenses incurred during university operations.

![Reimbursements Pipeline View](screenshots/steps/06_reimbursements/01_reimbursements_pipeline_view.png)
*Figure 3.8.1: Reimbursement claims queue showing dual-gate audit status and payment vouchers.*

---

#### Step 1: Submitting an Expense Claim
1. Open **Reimbursements** and click **+ Submit Claim**.
2. Complete claim submission form:

#### Input Field Reference
| Field Label | Input Type | Where to Enter | Allowed Values | Description & System Behavior |
|---|---|---|---|---|
| **Expense Title \\*** | Text Input | First input box | Descriptive title (e.g. \`VIP Guest Transport & Airport Escort Fuel Charges\`) | Summary of expense. Appears on payment audit reports. |
| **Amount (INR) \\*** | Currency Input | Left number field | Positive number in INR (e.g. \`₹3,450\`) | Exact amount supported by attached receipt. |
| **Category \\*** | Select Dropdown | Right dropdown | \`Travel & Transport\`, \`Food & Hospitality\`, \`Materials & Printing\`, \`Technical Supplies\` | Categorizes expense for annual financial statements. |
| **Receipt Scan \\*** | File Upload | Upload dropzone | JPG, PNG, or PDF scan (Max 10MB) | Mandatory clear tax invoice or digital payment receipt. |
| **Linked Event \\*** | Select Dropdown | Event selector | Active approved events | Automatically debits the approved budget of the selected event upon disbursement. |

![Submit Claim Modal Filled](screenshots/steps/06_reimbursements/02_submit_claim_modal_filled.png)
*Figure 3.8.2: Expense claim submission screen with receipt dropzone and linked event balance tracking.*

---

#### Step 2: Dual-Gate Verification Audit
Decision-makers inspect receipts directly in the built-in audit viewer:
1. Click any pending claim row to open the **Claim Audit Modal**.
2. View the uploaded receipt image side-by-side with claimed line items.
3. **Gate 1 (Faculty Head Audit):** Verifies that items were necessary and prices conform to university guidelines. Click **Approve Gate 1**.
4. **Gate 2 (Centre Head Clearance):** Confirms institutional fund disbursement and issues transaction reference. Click **Disburse & Settle**.

![Claim Audit Modal](screenshots/steps/06_reimbursements/03_dual_gate_verification_audit.png)
*Figure 3.8.3: Dual-gate audit modal displaying high-resolution receipt inspection and approval history.*
`;

// Replace Section 3.8
content = content.replace(
  /### 3\.8 Financial Reimbursements & Multi-Gate Audit[\s\S]*?(?=### 3\.9 Budgeting, P&L)/,
  reimbursementsMd + '\n'
);

// =========================================================================
// SECTION 3.9: BUDGETING & FUNDS
// =========================================================================
const budgetingMd = `### 3.9 Budgeting, P&L & Income Sources
The **Budgeting** module (\`/dashboard/budget\`) maintains the master fiscal balance sheet of the LEADS Next Gen Centre.

![Budget PnL Ledger](screenshots/steps/07_budgeting/01_budget_pnl_ledger.png)
*Figure 3.9.1: Master budget ledger displaying institutional allocations, sponsorship inflows, and actual expenditures.*

---

#### Step 1: Adding a Budget Allocation or Income Source
1. Click **+ Add Allocation** or **+ Record Income**.
2. Configure financial parameters:
   - **Funding Source:** Institutional University Grant, Corporate Sponsorship, or Delegate Fee Inflow.
   - **Total Allocation (INR):** Total capital available for the fiscal semester.
   - **Target Event / Department:** Earmarks funds to prevent cross-departmental overspending.

![Add Allocation Modal](screenshots/steps/07_budgeting/02_add_allocation_modal.png)
*Figure 3.9.2: Financial allocation modal enabling fund allocation across academic departments.*
`;

// Replace Section 3.9
content = content.replace(
  /### 3\.9 Budgeting, P&L & Income Sources[\s\S]*?(?=### 3\.10 Design Portal)/,
  budgetingMd + '\n'
);

// Save updated USER_MANUAL.md
fs.writeFileSync(manualMdPath, content, 'utf8');
console.log('✅ Successfully enriched Sections 3.2, 3.3, 3.5, 3.7, 3.8, and 3.9 in docs/USER_MANUAL.md!');
