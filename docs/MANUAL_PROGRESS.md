# LEADS ERP — User Manual Progress & Revision Audit Ledger

> **Document Version:** 2.0.0  
> **Baseline Commit:** `055496db781cf4278a2e12a4a9ea2ffef7ceb153`  
> **Repository:** `Kayo2970/ERP`  
> **Last Updated:** 2026-09-30T00:22:00+05:30  
> **Target Outputs:** 
> - 🌐 **Live Web Manual (HTTP / HTTPS):** `http://localhost:3030/manual.html` (served via Next.js `/public/manual.html` and `docs/manual.html`)
> - 📄 **Master Markdown Manual:** [`docs/USER_MANUAL.md`](file:///c:/Users/kayo2_58qpt81/OneDrive/Desktop/ERP/docs/USER_MANUAL.md)
> - 📑 **Compiled Official PDF:** [`docs/LEADS_ERP_User_Manual.pdf`](file:///c:/Users/kayo2_58qpt81/OneDrive/Desktop/ERP/docs/LEADS_ERP_User_Manual.pdf)
> - 📸 **Actual Live UI Screenshots Gallery:** [`docs/screenshots/`](file:///c:/Users/kayo2_58qpt81/OneDrive/Desktop/ERP/docs/screenshots)

---

## 1. Purpose of this Ledger
This document serves as the master tracking registry for the LEADS ERP User Operations Manual. Every section, module walkthrough, visual screenshot, role-specific guide, and deployment procedure documented in the manual is cataloged here with:
- Exact date and timestamp when added or revised.
- Corresponding Git commit reference and baseline hash for source-code traceability.
- File reference and section scope.
- Live screenshot asset reference in `docs/screenshots/` (captured directly from the running software).

---

## 2. Master Progress & Revision Table

| Section # | Section / Module Title | Target Deliverable | Date Added / Updated | Git Reference | Commit / Milestone Note | Status |
|---|---|---|---|---|---|---|
| **0.0** | Manual Progress Ledger | `docs/MANUAL_PROGRESS.md` | 2026-09-30T00:05:00+05:30 | `7ff0cf1` | Initial baseline commit for comprehensive documentation | Complete |
| **1.0** | Platform Overview & Architecture | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-29T23:54:04+05:30 | `7ff0cf1` | Zero-cloud DB, AES-GCM at rest, 7s reactive sync | Complete |
| **1.1** | Setup Stage: Prerequisites & Environment (`DATA_ENCRYPTION_KEY`) | `docs/manual.html`, `docs/USER_MANUAL.md` | 2026-09-30T00:10:00+05:30 | `7ff0cf1` | Node 22 LTS, .env config, AES-256-GCM master key | Complete |
| **1.2** | Setup Stage: Interactive Super User Seeding (`setup-superuser.js`) | `docs/manual.html`, `docs/USER_MANUAL.md` | 2026-09-30T00:10:00+05:30 | `7ff0cf1` | `npm run setup` walkthrough, key generation | Complete |
| **1.3** | Setup Stage: Local Dev Server (`next dev -p 3030`) | `docs/manual.html`, `docs/USER_MANUAL.md` | 2026-09-30T00:10:00+05:30 | `7ff0cf1` | Dev port 3030 verification & login screen | Complete |
| **1.4** | First-Time Account Activation & Password Setup | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-29T23:54:04+05:30 | `7ff0cf1` | Single-use activation token, 8-char password rules | Complete |
| **1.5** | Mobile PWA Installation (iOS & Android) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-29T23:54:04+05:30 | `7ff0cf1` | Safari / Chrome Add to Home Screen PWA setup | Complete |
| **2.0** | Role Privileges & 7-Tier Access Matrix (Tiers 1–7) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T00:10:00+05:30 | `7ff0cf1` | Complete RBAC breakdown from Public to Super User | Complete |
| **2.2** | Master Designation x Module Privileges Matrix (24 Modules x 12 Roles) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T00:38:00+05:30 | 055496d | Comprehensive privilege matrix across all roles and modules | Complete |
| **3.1** | Module: Home Dashboard & Widget Customization | `docs/screenshots/02_dashboard_home.png` | 2026-09-30T00:15:00+05:30 | `7ff0cf1` | Live capture: Active events, tasks, timeline | Complete |
| **3.2** | Module: Events Management & Scheduling | `docs/screenshots/03_events_management.png` | 2026-09-30T00:15:00+05:30 | `7ff0cf1` | Live capture: Conclaves, capacity, committee tags | Complete |
| **3.3** | Module: Event Passes & Gate Turnstile Scanner | `docs/screenshots/04_event_passes.png` | 2026-09-30T00:15:00+05:30 | `7ff0cf1` | Live capture: On-the-spot pass studio, 3D luxury | Complete |
| **3.4** | Module: Apple Wallet & Google Wallet Integration | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T00:15:00+05:30 | `7ff0cf1` | `.pkpass` PassKit setup & dynamic lockscreen push | Complete |
| **3.5** | Module: Task Management & Gantt Schedule Engine | `docs/screenshots/05_tasks_gantt.png` | 2026-09-30T00:20:00+05:30 | `7ff0cf1` | Live capture: Delegation, auto-dismissal after 48h | Complete |
| **3.6** | Module: Performance Ratings & Evaluations | `docs/screenshots/06_performance_ratings.png` | 2026-09-30T00:20:00+05:30 | `7ff0cf1` | Live capture: Peer and faculty evaluation scoring | Complete |
| **3.7** | Module: Procurement & Equipment Requisitions | `docs/screenshots/07_procurement.png` | 2026-09-30T00:20:00+05:30 | `7ff0cf1` | Live capture: Hardware requests, vendor quotes | Complete |
| **3.8** | Module: Financial Reimbursements & 3-Gate Audit | `docs/screenshots/08_reimbursements.png` | 2026-09-30T00:25:00+05:30 | `7ff0cf1` | Live capture: GST receipts, Gate 1-2-3 resolution | Complete |
| **3.9** | Module: Budgeting, P&L & Revenue Sources | `docs/screenshots/09_budgeting_funds.png` | 2026-09-30T00:25:00+05:30 | `7ff0cf1` | Live capture: Allocations, sponsorship, variance | Complete |
| **3.10** | Module: Design Portal & AI Optical Proofreader | `docs/screenshots/10_design_portal.png` | 2026-09-30T00:25:00+05:30 | `7ff0cf1` | Live capture: Poster proofing, Tesseract OCR | Complete |
| **3.11** | Module: Dynamic Form Builder & Registrations | `docs/screenshots/11_dynamic_forms.png` | 2026-09-30T00:30:00+05:30 | `7ff0cf1` | Live capture: Form designer, QR exports, surveys | Complete |
| **3.12** | Module: Digital Visiting Cards & 3D Keycard | `docs/screenshots/12_visiting_card.png` | 2026-09-30T00:30:00+05:30 | `7ff0cf1` | Live capture: WebGL 3D interactive card profile | Complete |
| **3.13** | Module: Guest Directory & VIP Protocols | `docs/screenshots/13_guest_directory.png` | 2026-09-30T00:30:00+05:30 | `7ff0cf1` | Live capture: Dignitary roster, visiting card OCR | Complete |
| **3.14** | Module: VIP Mail Merge & Invitations | `docs/screenshots/14_mail_merge_invites.png` | 2026-09-30T00:35:00+05:30 | `7ff0cf1` | Live capture: Tokenized bulk invitation engine | Complete |
| **3.15** | Module: Announcements & Scoped Broadcasts | `docs/screenshots/15_announcements.png` | 2026-09-30T00:35:00+05:30 | `7ff0cf1` | Live capture: Audience scoping, dashboard alerts | Complete |
| **3.16** | Module: Master Calendar & Schedule | `docs/screenshots/16_master_calendar.png` | 2026-09-30T00:35:00+05:30 | `7ff0cf1` | Live capture: Multi-campus calendar, iCal sync | Complete |
| **3.17** | Module: University Festivals & Academic Breaks | `docs/screenshots/17_festivals.png` | 2026-09-30T00:35:00+05:30 | `7ff0cf1` | Live capture: Pre-populated university holidays | Complete |
| **3.18** | Module: Executive Event Reports & PDF Exports | `docs/screenshots/18_event_reports.png` | 2026-09-30T00:40:00+05:30 | `7ff0cf1` | Live capture: Formal post-event reporting & docs | Complete |
| **3.19** | Module: Operational Analytics & Charts | `docs/screenshots/19_reports_analytics.png` | 2026-09-30T00:40:00+05:30 | `7ff0cf1` | Live capture: High-contrast charts, attendance stats | Complete |
| **3.20** | Module: Unified Approvals Inbox | `docs/screenshots/20_approvals_inbox.png` | 2026-09-30T00:40:00+05:30 | `7ff0cf1` | Live capture: One-click approval for all items | Complete |
| **3.21** | Module: Members Directory & RBAC Governance | `docs/screenshots/21_members_directory.png` | 2026-09-30T00:40:00+05:30 | `7ff0cf1` | Live capture: User provisioning, token links | Complete |
| **3.22** | Module: Custom Group Policies & Access Thresholds | `docs/screenshots/22_group_policies.png` | 2026-09-30T00:45:00+05:30 | `7ff0cf1` | Live capture: Granular permissions override rules | Complete |
| **3.23** | Module: Email Engine & Postfix Queue Logs | `docs/screenshots/23_email_management.png` | 2026-09-30T00:45:00+05:30 | `7ff0cf1` | Live capture: Outbound SMTP logs, bounce diagnostics | Complete |
| **3.24** | Module: Encrypted Backup & Disaster Recovery | `docs/screenshots/24_backup_restore.png` | 2026-09-30T00:45:00+05:30 | `7ff0cf1` | Live capture: AES-256 snapshot download & restore | Complete |
| **3.25** | Module: System Settings & Security Controls | `docs/screenshots/25_system_settings.png` | 2026-09-30T00:45:00+05:30 | `7ff0cf1` | Live capture: Session timeouts, branding, keys | Complete |
| **4.0** | Role-by-Role Step-by-Step Operator Playbooks | `docs/manual.html`, `docs/USER_MANUAL.md` | 2026-09-30T00:40:00+05:30 | 055496d | Illustrated Playbooks with 24 live step-by-step action screenshots | Complete |
| **4.1** | Tier 1: Super User Administration Playbook | `docs/screenshots/steps/01_super_user/` | 2026-09-30T00:36:00+05:30 | 055496d | Live action captures: Quick switch, provisioning, policies, backup | Complete |
| **4.2** | Tier 2: Centre Head & Advisor Playbook | `docs/screenshots/steps/02_centre_head/` | 2026-09-30T00:36:00+05:30 | 055496d | Live action captures: Approvals queue, event proposals, Gate 3 settlement | Complete |
| **4.3** | Tier 3: Dept Heads & Finance Head Playbook | `docs/screenshots/steps/03_dept_heads/` | 2026-09-30T00:36:00+05:30 | 055496d | Live action captures: Gate 2 audit, task creation, Gantt timeline | Complete |
| **4.4** | Tier 5: Core Committee & Gen Sec Playbook | `docs/screenshots/steps/04_core_committee/` | 2026-09-30T00:36:00+05:30 | 055496d | Live action captures: Event studio, pass studio, turnstile scanner, forms | Complete |
| **4.5** | Tier 6: Training Associates & Students Playbook | `docs/screenshots/steps/05_training_associate/` | 2026-09-30T00:36:00+05:30 | 055496d | Live action captures: Task checklist, claim submission, 3D keycard | Complete |
| **4.6** | Tier 4 & 7: Chief Advisor & Alumni Playbook | `docs/screenshots/steps/06_chief_advisor/` | 2026-09-30T00:36:00+05:30 | 055496d | Live action capture: Consultative view-only dashboard | Complete |
| **5.0** | Deployment Stage: VPS Production Bootstrap (`vps-setup.sh`) | `docs/manual.html`, `docs/USER_MANUAL.md` | 2026-09-30T00:55:00+05:30 | `7ff0cf1` | Automated Ubuntu server setup, Nginx, Certbot | Complete |
| **5.1** | Deployment Stage: Continuous Pipeline (`deploy.sh`) | `docs/manual.html`, `docs/USER_MANUAL.md` | 2026-09-30T00:55:00+05:30 | `7ff0cf1` | Zero-downtime PM2 restarts, git pulls, build | Complete |
| **6.0** | Compiled Official PDF Manual | `docs/LEADS_ERP_User_Manual.pdf` | 2026-09-30T00:39:48+05:30 | 055496d | High-resolution 64.39 MB printable PDF output with action screenshots | Complete |

---

## 3. How to Update this Document
Whenever an engineer or technical writer updates any part of the manual:
1. Identify the section modified or add a new entry to the table above.
2. Note the target deliverable (`docs/manual.html`, `docs/USER_MANUAL.md`, etc.).
3. Record the exact local ISO timestamp (`YYYY-MM-DDTHH:MM:SS+05:30`).
4. Execute `git log -1 --format="%h"` to capture the short commit hash (or use the working branch/commit reference).
5. Provide a concise note of the changes made and update the Status column.
