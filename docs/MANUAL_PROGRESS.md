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
| **1.1** | Architecture & File Locations (`leads-dashboard/.env`, `data/`) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T00:50:00+05:30 | Working Tree | Zero-cloud local DB layout, AES-256-GCM scheme, PBKDF2 salt | Complete |
| **1.2** | Master Cryptographic Key (`DATA_ENCRYPTION_KEY`) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T00:50:00+05:30 | Working Tree | 64-char hex key generation, offline vault backup protocols | Complete |
| **1.3** | Interactive Super User Seeding (`npm run setup`) | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T00:50:00+05:30 | Working Tree | Prompt-by-prompt walkthrough with non-personal placeholders | Complete |
| **1.4** | Environment Configuration File (`.env`) Reference Table | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T00:50:00+05:30 | Working Tree | Complete variable reference (PORT, NODE_ENV, SMTP, KEYS) | Complete |
| **1.5** | Production VPS Deployment (`vps-setup.sh`) & CD Pipeline | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T00:50:00+05:30 | Working Tree | Automated Ubuntu bootstrap, Nginx reverse proxy, PM2 reload | Complete |
| **3.22** | Email Engine & SMTP Mailroom Portal | `docs/USER_MANUAL.md`, `docs/manual.html` | 2026-09-30T00:50:00+05:30 | Working Tree | Granular field-by-field input guide, provider setup, diagnostics | Complete |
| **6.0** | Compiled Official PDF Manual | `docs/LEADS_ERP_User_Manual.pdf` | 2026-09-30T00:51:21+05:30 | Working Tree | High-resolution 64.65 MB printable PDF output with action screenshots | Complete |

---

## 3. How to Update this Document
Whenever an engineer or technical writer updates any part of the manual:
1. Identify the section modified or add a new entry to the table above.
2. Note the target deliverable (`docs/manual.html`, `docs/USER_MANUAL.md`, etc.).
3. Record the exact local ISO timestamp (`YYYY-MM-DDTHH:MM:SS+05:30`).
4. Execute `git log -1 --format="%h"` to capture the short commit hash (or use the working branch/commit reference).
5. Provide a concise note of the changes made and update the Status column.
