<!-- converted from LEADS_ERP_Instruction_and_Privileges_Manual.docx -->

LEADS NEXT GEN CENTRE
OPERATIONS & PRIVILEGES MANUAL
Comprehensive System Instruction Guide, Role Privilege Matrix & Security Architecture


# 1. Executive System Overview
The LEADS Next Gen ERP Dashboard is a centralized institutional management platform built specifically for the LEADS Next Gen Centre at MSRUAS. The platform manages events, real-time task allocations, automated reimbursement verification pipelines, budget allocation tracking, design asset clearance workflows, dynamic public feedback forms, and hierarchical organizational member directories.
# 2. One-Time Initial Setup Wizard
Upon deploying a fresh instance of the LEADS ERP (locally or on a production VPS), the application automatically enters the Initial Setup Wizard upon first launch. Once completed, this setup is permanently locked and cannot be re-executed.
## Step 1: Super User Account Provisioning
• The operator sets up the primary root Super User (Name, Email ID, and Master Password min 8 chars).
• Scrypt cryptographic hashing (with unique salts and timing-safe comparisons) is used to protect credentials.
• A fresh install starts with zero pre-existing accounts; all additional faculty, staff, and student accounts are created via the Members Directory.
## Step 2: Database Server-Side Encryption Key Setup
• The system prompts the operator to configure the DATA_ENCRYPTION_KEY used to encrypt all local database files on disk.
• Operators can either auto-generate a cryptographically secure 256-bit key (recommended) or specify a custom secret key.
• The key is saved permanently to .env on the server. The setup wizard displays a prominent alert reminding the administrator to store a secure offline backup of the key.
• All local database collections (data/members.json, data/events.json, etc.) are encrypted at rest using AES-256-GCM authenticated encryption.
# 3. Granular Role & Privilege Matrix (Tiers 1 to 7)

# 4. Comprehensive Module Operating Instructions
## 4.1 Members Directory & User Management
The Members Directory allows administrators to add, update, terminate, and reactivate members. When adding a member, an activation link with a secure cryptographic token is generated. Super Users can also trigger password resets, require mandatory password updates on next login, or assign members to specific divisions and departments.
## 4.2 Dynamic Quick Switch (Super User Feature)
The Quick Switch feature (accessible via the user settings header) allows the Super User to instantly view the dashboard from the perspective of any registered account without requiring their password. The switcher dynamically queries the live member roster, ensuring only real, active accounts appear. A prominent top bar allows one-click return to the Super User session at any time.
## 4.3 Events & Automated Task Delegation
Events progress through draft, proposal, faculty approval, active execution, and archival stages. Sub-committees (Stage, Logistics, Hospitality, Social Media) can be attached to events with dedicated lead allocations. Tasks created within events automatically update progress percentages and trigger audit logs.
## 4.4 Design Portal & Multi-Gate Proofreading Engine
The Design Portal manages promotional creatives and posters. Uploaded assets undergo dual verification: Gate 1 (Style & Resolution check) and Gate 2 (AI OCR Spellcheck & designated Faculty Proofreader sign-off). Once approved, associated design deliverables automatically mark linked event tasks as complete.
## 4.5 Multi-Stage Financial Reimbursement Pipeline
Claims submitted by members include digitized receipts and event tags. The pipeline enforces dual-approval: Level 1 Faculty Verification followed by Level 2 Centre Head Clearance. Disbursed funds automatically adjust event budgets and sponsor balances, calculating net university expenditure in real time.
## 4.6 Dynamic Public Forms & Feedback System
Administrators can create public sign-up and feedback forms with custom fields (text, dropdowns, ratings). Each form generates a dynamic QR code and shareable URL. Responses are logged into the encrypted database with export capabilities to CSV, PDF, and Word DOCX summary reports.
## 4.7 Email Management & Broadcast Communication
Outbound announcements and notifications route through a local Postfix relay authenticated with MSRUAS Workspace. Custom scopes (All Members, Core Committee, Faculty Only) allow targeted communication with delivery tracking.
# 5. Security, Backup & Maintenance Guidelines
• Data Encryption: Never commit the DATA_ENCRYPTION_KEY to git repositories. It must remain strictly in the .env file.
• Backups: Use the built-in Backup & Restore module (Tier 1 Super User) to generate encrypted snapshots. Backups can be decrypted offline using scripts/decrypt-backup.js with the master key.
• Deployment on VPS: Follow the standard deployment sequence (git pull -> npm install -> npm run build -> pm2 restart leads-dashboard).
• Disaster Recovery: If migrating servers, copy both the data/ directory and the DATA_ENCRYPTION_KEY string from .env.

— End of Operations Manual —
© 2026 LEADS Next Gen Centre, MSRUAS. All rights reserved.
| Platform: | LEADS ERP All-in-One Operations Portal |
| --- | --- |
| Institution: | LEADS Next Gen Centre, M.S. Ramaiah University of Applied Sciences (MSRUAS) |
| System Version: | v2.0 Production (Next.js 16 + AES-256-GCM Secure Data Layer) |
| Document Classification: | Internal Operational & Administrative Reference |
| Tier | Role Name | Division | Key System Permissions & Scope |
| --- | --- | --- | --- |
| Tier 1 | Super User | Core Committee | Unrestricted system control, global audit logs, emergency lockdown mode, policy management, backup/restore, dynamic Quick Switch impersonation. |
| Tier 2 | Centre Head | Faculty | Full operational authority across both campuses, final budget approval, Level-2 reimbursement clearance, guest directory management, email broadcasts. |
| Tier 2.5 | GG Campus Head | Faculty | Campus-specific oversight for Gnanagangothri (GG) campus operations, events, and task coordination. |
| Tier 3 | Faculty / Event Head / Advisors | Faculty | Event proposal approvals, Level-1 reimbursement audits, task assignment to student leads, performance evaluation reviewer. |
| Tier 4 | Advisory Board | Faculty | High-level read access to institutional performance metrics, reports, ratings, and event summaries. |
| Tier 5 | Core Committee (Officers & Leads) | Core Committee | Operational execution, task allocation, event planning, form building & public QR code publishing, financial claim submission. |
| Tier 6 | Training Associate / Members | Training Associate | Personal workspace access, assigned task execution & status updates, reimbursement claim submission, feedback submission. |
| Tier 7 | Alumni / Guests | Alumni / Guest | View-only access to relevant past archives, certificates, or assigned guest directories. |