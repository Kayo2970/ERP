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
| **0.0** | Manual Progress Ledger | `docs/MANUAL_PROGRESS.md` | 2026-09-30T01:10:00+05:30 | `8a58acb` | Initial baseline commit for comprehensive documentation | Complete |
| **1.0** | Platform Overview & Architecture | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Zero-cloud DB, AES-GCM at rest, 7s reactive sync | Complete |
| **1.1** | Architecture & File Locations (`leads-dashboard/.env`, `data/`) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Zero-cloud local DB layout, AES-256-GCM scheme, PBKDF2 salt | Complete |
| **1.2** | Master Cryptographic Key (`DATA_ENCRYPTION_KEY`) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | 64-char hex key generation, offline vault backup protocols | Complete |
| **1.3** | Web GUI Setup Wizard (`/setup`) Onboarding Flow | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Live screenshots & step-by-step fields for Super User Provisioning & 256-bit Key generation | Complete |
| **1.4** | Headless CLI Seeding (`npm run setup`) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Terminal bootstrap utility walkthrough with non-personal placeholders | Complete |
| **1.5** | Environment Configuration File (`.env`) Reference Table | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Complete variable reference (PORT, NODE_ENV, SMTP, KEYS) | Complete |
| **1.6** | AWS Enterprise Cloud Infrastructure & Production Deployment | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:14:00+05:30 | Working Tree | Detailed comparison why AWS > VPS, ASCII architecture, EC2/EBS KMS/Security Group runbook | Complete |
| **1.6.1** | Baseline IT Infrastructure Specification (As on 10/09/2026) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:17:00+05:30 | Working Tree | Official university requisition: EC2 T3 Medium, leads.msruas.ac.in, portal.leads.msruas.ac.in, noreply.leads@msruas.ac.in, SES, S3, future scaling | Complete |
| **1.7** | Super User Financial Setup & Payment Initiation | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Default clearing bank coordinates, claim submission form, bills upload, 3-gate approval | Complete |
| **1.8** | Continuous Deployment Pipeline (`deploy.sh`) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Git pull, npm install, Next.js build, PM2 cluster zero-downtime reload | Complete |
| **1.9** | First-Time Account Activation & Password Setup | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Single-use activation token, 8-char password rules | Complete |
| **1.10** | Mobile / PWA Installation (iOS & Android) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Safari / Chrome Add to Home Screen PWA setup | Complete |
| **1.11** | Interface Layout & Navigation Shell | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T01:10:00+05:30 | Working Tree | Sidebar rail, period filter, persona quick switch | Complete |
| **3.2** | Events Management & Sub-Committees | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:50:00+05:30 | Working Tree | Proposal lifecycle, sub-committee delegation, budget tracking, 3 live action screenshots | Complete |
| **3.3** | Event Passes & Live Scanner Kiosk | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:50:00+05:30 | Working Tree | Pass Studio, delegate badges, camera QR check-in kiosk, 3 live action screenshots | Complete |
| **3.4** | Apple Wallet & Google Wallet Integration | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:50:00+05:30 | Working Tree | .pkpass iOS PassKit and Google Wallet JWT integration details | Complete |
| **3.5** | Task Management, Delegation & Gantt Timeline | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:50:00+05:30 | Working Tree | Committee delegation, priority flags, Gantt timeline view, 3 live action screenshots | Complete |
| **3.6** | Performance Ratings & Committee Evaluation | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:50:00+05:30 | Working Tree | Objective scoring rubrics, 4-tier criteria, committee index | Complete |
| **3.7** | Procurement & Equipment Requisitions | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:50:00+05:30 | Working Tree | Purchase requisition form, vendor quotation uploads, approval stages, 2 live action screenshots | Complete |
| **3.8** | Financial Reimbursements (Dual-Gate Audit) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:50:00+05:30 | Working Tree | Expense claim submission, bill upload dropzone, dual-gate audit flow, 3 live action screenshots | Complete |
| **3.9** | Budgeting, P&L & Income Sources | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:50:00+05:30 | Working Tree | Master budget ledger, allocations, sponsorship tracking, 2 live action screenshots | Complete |
| **3.10** | Design Portal & AI OCR Proofreading | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:52:00+05:30 | Working Tree | Poster review gallery, automated AI OCR spellcheck, faculty sign-off, 2 live action screenshots | Complete |
| **3.11** | Dynamic Form Builder & Public Submissions | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:52:00+05:30 | Working Tree | Drag-and-drop form canvas, public slugs, high-res QR generation, 2 live action screenshots | Complete |
| **3.12** | Digital Visiting Cards & 3D Keycard | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:52:00+05:30 | Working Tree | Interactive 3D WebGL badge, vCard address book save, live action screenshot | Complete |
| **3.13** | Guest Directory & VIP Invitation Engine | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:52:00+05:30 | Working Tree | VIP roster, visiting card photo OCR, batch personalized invitations, 2 live action screenshots | Complete |
| **3.17** | Unified Approvals Inbox | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-10-02T18:52:00+05:30 | Working Tree | Consolidated queue across proposals, requisitions, claims, and designs, live action screenshot | Complete |
| **3.18** | Members Directory & Account Provisioning | `docs/USER_MANUAL.md`, `docs/manual.html`, `docs/LEADS_ERP_User_Manual.pdf` | 2026-09-30T01:45:00+05:30 | Working Tree | Comprehensive step-by-step onboarding, 5 live action screenshots, input field reference table, dynamic Computed Role Preview, Faculty campus sub-selection, direct password scrypt override, student profile dossiers & outcomes, bulk CSV ingestion | Complete |
| **6.0** | Compiled Official PDF Manual | `docs/LEADS_ERP_User_Manual.pdf` | 2026-09-30T01:45:00+05:30 | Working Tree | High-resolution 71.45 MB printable PDF output with action screenshots | Complete |
| **6.1** | Collapsible Interactive Navigation Sidebar | `docs/manual.html`, `leads-dashboard/public/manual.html` | 2026-09-30T01:12:00+05:30 | Working Tree | Smooth animated collapse, floating re-open button, Ctrl+B shortcut, localStorage persistence | Complete |

---

## 3. How to Update this Document
Whenever an engineer or technical writer updates any part of the manual:
1. Identify the section modified or add a new entry to the table above.
2. Note the target deliverable (`docs/manual.html`, `docs/USER_MANUAL.md`, etc.).
3. Record the exact local ISO timestamp (`YYYY-MM-DDTHH:MM:SS+05:30`).
4. Execute `git log -1 --format="%h"` to capture the short commit hash (or use the working branch/commit reference).
5. Provide a concise note of the changes made and update the Status column.
