# LEADS ERP — User Operations & Privileges Manual

> **Version:** 2.0 Production  
> **Platform:** LEADS Next Gen Centre ERP Operations Portal  
> **Institution:** M.S. Ramaiah University of Applied Sciences (MSRUAS)  
> **Target Audience:** Students, Training Associates, Committee Leads, Faculty Advisors, Department Heads, and Super Users.

---

## Table of Contents

1. [Welcome & Getting Started](#1-welcome--getting-started)
   - [1.1 Platform Overview](#11-platform-overview)
   - [1.2 Architecture & File System Locations](#12-architecture--file-system-locations)
   - [1.3 The Master Encryption Key (DATA_ENCRYPTION_KEY)](#13-the-master-encryption-key-data_encryption_key)
   - [1.4 Initial Web GUI Setup Wizard (/setup)](#14-initial-web-gui-setup-wizard-setup)
   - [1.5 Headless CLI Seeding (npm run setup)](#15-headless-cli-seeding-npm-run-setup)
   - [1.6 Environment Configuration File (.env) Reference](#16-environment-configuration-file-env-reference)
   - [1.7 AWS Enterprise Cloud Infrastructure & Production Deployment](#17-aws-enterprise-cloud-infrastructure--production-deployment)
   - [1.8 Super User Financial Setup & Payment Initiation](#18-super-user-financial-setup--payment-initiation)
   - [1.9 First-Time Account Activation & Password Setup](#19-first-time-account-activation--password-setup)
   - [1.10 Mobile / PWA Installation (iOS & Android)](#110-mobile--pwa-installation-ios--android)
   - [1.11 Interface Layout & Navigation Shell](#111-interface-layout--navigation-shell)
2. [Role Privileges & Access Hierarchy](#2-role-privileges--access-hierarchy)
   - [Understanding Tiers 1 through 7](#21-understanding-tiers-1-through-7)
   - [Role Matrix Summary](#22-role-matrix-summary)
   - [Super User Quick Switch (Persona Switcher)](#23-super-user-quick-switch-persona-switcher)
3. [Module-by-Module Operating Instructions](#3-module-by-module-operating-instructions)
   - [3.1 Home Dashboard](#31-home-dashboard)
   - [3.2 Events Management](#32-events-management)
   - [3.3 Event Passes & Live Scanner Kiosk](#33-event-passes--live-scanner-kiosk)
   - [3.4 Apple Wallet & Google Wallet Integration](#34-apple-wallet--google-wallet-integration)
   - [3.5 Task Management, Delegation & Gantt Timeline](#35-task-management-delegation--gantt-timeline)
   - [3.6 Performance Ratings & Committee Evaluation](#36-performance-ratings--committee-evaluation)
   - [3.7 Procurement & Equipment Requisitions](#37-procurement--equipment-requisitions)
   - [3.8 Financial Reimbursements & Multi-Gate Audit](#38-financial-reimbursements--multi-gate-audit)
   - [3.9 Budgeting, P&L & Income Sources](#39-budgeting-pl--income-sources)
   - [3.10 Design Portal, Proofreading & OCR Spellcheck](#310-design-portal-proofreading--ocr-spellcheck)
   - [3.11 Dynamic Form Builder & Public Submissions](#311-dynamic-form-builder--public-submissions)
   - [3.12 Digital Visiting Cards & 3D Interactive Keycard](#312-digital-visiting-cards--3d-interactive-keycard)
   - [3.13 Guest Directory & VIP Invitation Engine](#313-guest-directory--vip-invitation-engine)
   - [3.14 Announcements & Scoped Broadcasts](#314-announcements--scoped-broadcasts)
   - [3.15 Master Calendar & Festival Schedule](#315-master-calendar--festival-schedule)
   - [3.16 Executive Event Reports & PDF/Word Exports](#316-executive-event-reports--pdfword-exports)
   - [3.17 Unified Approvals Inbox](#317-unified-approvals-inbox)
   - [3.18 Members Directory & Account Provisioning](#318-members-directory--account-provisioning)
   - [3.19 Custom Group Policies & Access Thresholds](#319-custom-group-policies--access-thresholds)
   - [3.20 Email Delivery Engine & Queue Logs](#320-email-delivery-engine--queue-logs)
   - [3.21 System & Security Settings](#321-system--security-settings)
   - [3.22 Encrypted Backup & Restore](#322-encrypted-backup--restore)
4. [Step-by-Step Workflows by Role](#4-step-by-step-workflows-by-role)
   - [For Students / Training Associates (Tiers 5-6)](#41-for-students--training-associates-tiers-5-6)
   - [For Event Organizers & Committee Leads (Tiers 3, 5)](#42-for-event-organizers--committee-leads-tiers-3-5)
   - [For Faculty Advisors & Department Heads (Tiers 2-4)](#43-for-faculty-advisors--department-heads-tiers-2-4)
   - [For Centre Head & Executive Leadership (Tier 2)](#44-for-centre-head--executive-leadership-tier-2)
   - [For System Administrators (Tier 1 Super User)](#45-for-system-administrators-tier-1-super-user)
5. [Troubleshooting & Frequently Asked Questions](#5-troubleshooting--frequently-asked-questions)

---

## 1. Welcome & Getting Started

### 1.1 Platform Overview
The **LEADS ERP** is an all-in-one operations portal developed specifically for the LEADS Next Gen Centre at M.S. Ramaiah University of Applied Sciences. It unifies institutional event planning, task tracking, multi-tier financial governance, digital credentials, dynamic form collection, and committee evaluations into a fast, reactive web application.

Key architectural benefits:
- **Zero Cloud Database Dependency**: Your data is encrypted at rest using industry-standard AES-256-GCM directly on institutional servers.
- **Cross-Device Reactive Sync**: When an organizer updates a task or clears a reimbursement on one computer, all active devices pick up the change within 7 seconds automatically.
- **Role-Gated Privacy**: Information is strictly segmented based on student, faculty, and administrative tiers.

---

### 1.2 Architecture & File System Locations
The LEADS ERP runs entirely on local, sovereign server storage without third-party cloud database subscriptions. All student records, bank accounts, UPI IDs, event financials, and receipts are encrypted on disk.

#### File & Directory Reference ("Where Files Live"):
| Directory / File Path | Purpose & Storage Classification |
|---|---|
| `leads-dashboard/.env` | **Environment Configuration File:** Holds the master encryption key, session secret, port, and institutional SMTP credentials. Git-ignored and strictly confidential. |
| `leads-dashboard/.env.example` | **Template Schema:** Reference blueprint containing all permissible environment variables. |
| `leads-dashboard/data/` | **Encrypted Data Directory:** Houses all encrypted JSON collections: `members.json`, `events.json`, `tasks.json`, `reimbursements.json`, `sessions.json`, and `systemSettings.json`. |
| `leads-dashboard/src/app/setup/` | **Web GUI Provisioning Wizard:** Visual browser onboarding portal accessed at `/setup` on initial installation. |
| `leads-dashboard/scripts/setup-superuser.js` | **Interactive Provisioning CLI:** Headless bootstrap utility executed via `npm run setup` to create the initial founding administrator. |
| `deploy.sh` | **Zero-Downtime Continuous Deployment:** Automates Git sync, dependency checks, production compilation, and PM2 reload. |

---

### 1.3 The Master Encryption Key (DATA_ENCRYPTION_KEY)
Every sensitive record committed to disk is ciphered using **AES-256-GCM** (Galois/Counter Mode) authenticated encryption:
- **Entropy Format:** A 64-character hexadecimal string representing 32 bytes (256 bits) of cryptographic entropy.
- **Key Derivation Function (PBKDF2):** At runtime, the server derives the active cipher key using:
  ```javascript
  crypto.pbkdf2Sync(MASTER_KEY, 'LEADS_NEXT_GEN_CENTRE_MSRUAS_SALT_2026', 100000, 32, 'sha256')
  ```
  The 100,000 iterations ensure resilience against GPU-accelerated dictionary and rainbow table attacks.
- **Payload Schema:** Every database file in `data/` contains:
  ```json
  {
    "_encrypted": true,
    "algorithm": "aes-256-gcm",
    "iv": "<12-byte hex IV>",
    "authTag": "<16-byte hex authentication tag>",
    "ciphertext": "<hex-encoded encrypted payload>"
  }
  ```

> **⚠️ Critical Security Warning:** If `DATA_ENCRYPTION_KEY` in `.env` is deleted or corrupted, existing database files **cannot be decrypted by anyone**. Always maintain an offline physical backup of this 64-character string in an institutional security vault.

---

### 1.4 Initial Web GUI Setup Wizard (/setup)
When the application is first launched without an existing database, visiting the root URL automatically redirects administrators to the visual **Database Provisioning Wizard** (`/setup`):

#### Step 1: Super User Account Provisioning
The browser presents the initial administrator registration card:

1. **Super User Full Name:** Enter the formal administrative name of the founding Super User (e.g. `<Administrator Full Name>`).
2. **Super User Email Address:** Enter the institutional email address (e.g. `<admin@institution.edu>`).
3. **Master Password (Min 8 Characters):** Create a secure administrator password. Includes an eye toggle to inspect hidden characters.
4. **Confirm Password:** Re-enter the identical password.
5. Click **Proceed to Step 2: Database Security →**.

![Setup Wizard Step 1](screenshots/steps/00_setup/01_setup_gui_step1_account.png)
*Figure 1.1: Live captured Initial GUI Setup Wizard — Step 1: Super User Provisioning.*

---

#### Step 2: Database Encryption Key Configuration
The wizard transitions to the cryptographic key setup screen:

1. **Key Mode Selection:**
   - **Generate 256-bit Key (Default):** The browser creates a cryptographically secure 64-character hexadecimal string with 256 bits of cryptographic entropy. Click **Regenerate** to cycle keys if required.
   - **Custom Passphrase:** Allows pasting an existing enterprise AES-256 master key from an institutional vault.
2. **Copy Master Key:** Click the **Copy** button to save the 64-character key string directly to your clipboard.
3. **Security Confirmation Mandate:** You must check the mandatory confirmation box:
   - *"I have securely copied and saved this encryption key"*
4. **Complete Setup & Launch:** Click the button. The application derives the PBKDF2 salt, initializes `data/members.json` with the new Super User profile (`tier: 1`), writes `DATA_ENCRYPTION_KEY` to `.env`, and routes directly into the executive dashboard.

![Setup Wizard Step 2](screenshots/steps/00_setup/02_setup_gui_step2_encryption.png)
*Figure 1.2: Live captured Initial GUI Setup Wizard — Step 2: Database Encryption Key.*

---

### 1.5 Headless CLI Seeding (npm run setup)
For headless server environments where no web browser is available during bootstrapping, the exact same provisioning workflow can be executed directly in the terminal:

```bash
cd leads-dashboard
npm run setup
```

The CLI steps through the 5 interactive prompts:
- **Prompt 1 (`name`):** Full name of the administrator.
- **Prompt 2 (`email`):** RFC 5322 institutional email address.
- **Prompts 3 & 4 (`passwordHash`):** Hidden stdin raw mode entry (masked input), 8-character minimum, hashed with `crypto.scryptSync`.
- **Prompt 5 (`DATA_ENCRYPTION_KEY`):** Press Enter to auto-generate a 64-character hex key, or paste a custom key.

---

### 1.6 Environment Configuration File (.env) Reference
The runtime environment is configured via `leads-dashboard/.env`:

| Environment Variable | Default / Example Value | Description & Purpose |
|---|---|---|
| `DATA_ENCRYPTION_KEY` | `<64_hex_characters>` | **Mandatory:** Master 256-bit AES-GCM encryption key for local collections. |
| `SESSION_SECRET` | `<random_hex_string>` | Secret key used for signing HMAC authentication session tokens. |
| `PORT` | `3030` | Local HTTP port bound by the Next.js server. |
| `NODE_ENV` | `production` / `development` | Toggles production optimizations, caching, and secure HTTP-only cookies. |
| `APP_URL` | `http://localhost:3030` | Base public URL used when generating pass QR codes and activation email links. |
| `SMTP_HOST` | `smtp.gmail.com` | Outbound institutional SMTP relay host. |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (SSL) | SMTP communication port. |
| `SMTP_USER` | `<notifications@institution.edu>` | Outbound mail service authentication username. |
| `SMTP_PASS` | `<16_char_app_password>` | Application-specific password from Google Workspace or Microsoft 365. |
| `SMTP_FROM` | `"LEADS Centre" <notifications@institution.edu>` | Outbound sender name and email displayed in recipient inboxes. |

---

### 1.7 AWS Enterprise Cloud Infrastructure & Production Deployment

#### Baseline IT Infrastructure Specification (As on 10/09/2026)
As established in the formal institutional IT infrastructure requisition for the deployment and operation of the Leads Next Gen Centre Portal:

> **Institutional IT Communication — Infrastructure Requisition (Date: 10/09/2026):**
> 
> *“Dear Sir,*  
> *As discussed earlier, we require the following IT infrastructure and configurations for the deployment and smooth operation of the Leads Next Gen Centre Portal:*
> 
> 1. **AWS EC2 – T3 Medium Instance:** Provisioning of an AWS EC2 T3 Medium instance for hosting and running the portal application.
> 2. **Two Subdomains with DNS Configuration:** We require two subdomains under the University domain `msruas.ac.in`, with the following proposed structure:
>    - **External Website (`leads.msruas.ac.in`):** Used for the public-facing showcase and communications website of the Leads Next Gen Centre.
>    - **ERP Portal (`portal.leads.msruas.ac.in`):** Used for hosting and accessing the ERP portal developed for the Centre's internal operations and management.
>    - *Action requested:* Necessary DNS configuration and routing for both subdomains.
> 3. **University-Issued Email ID for ERP Portal:** Dedicated official email ID under the `@msruas.ac.in` domain:
>    - **Address:** `noreply.leads@msruas.ac.in`
>    - *Purpose:* System-generated and portal-related communications, including OTPs, password resets, registrations, notifications, confirmations, and other automated emails.
> 4. **Amazon SES Configuration:** Provisioning and configuration of Amazon Simple Email Service (SES) to enable high-reputation system-generated and transactional emails from the ERP portal using `noreply.leads@msruas.ac.in`.
> 5. **Amazon S3 Storage:** Provisioning of Amazon S3 storage for securely storing application-related documents, scanned invoices/bills, event media, encrypted backups, and required assets.
> 6. **Provision for Future Scalability:** While the above infrastructure is based on our current requirements, the setup is provisioned with the ability to scale up as requirements increase — including computing resources, storage capacity, bandwidth, database resources, or other components based on growth in users, data, traffic, and operational volume, without requiring major restructuring of the underlying infrastructure.”*

| Infrastructure Component | Specification / Allocation | Functional Role in LEADS Platform |
|---|---|---|
| **Compute Instance** | AWS EC2 `t3.medium` (2 vCPU, 4 GiB RAM, Nitro Hypervisor) | Hosts Next.js App, Node.js 22 LTS, PM2 Process Manager, and local encrypted data store. |
| **Public Subdomain** | `leads.msruas.ac.in` | Public-facing portal for external university community, announcements, and events showcase. |
| **Enterprise ERP Subdomain** | `portal.leads.msruas.ac.in` | Secure institutional ERP gateway for authenticated internal operations, approvals, and financials. |
| **Official Portal Mailbox** | `noreply.leads@msruas.ac.in` | Dedicated university identity for password resets, activation tokens, and event passes. |
| **Email Transport Engine** | Amazon Simple Email Service (Amazon SES) | High-deliverability transactional relay configured with DKIM, SPF, and DMARC on `msruas.ac.in`. |
| **Object & Media Vault** | Amazon Simple Storage Service (Amazon S3) | Scalable encrypted object storage for reimbursement bills, proof attachments, and system snapshots. |
| **Scalability Provision** | Elastic Vertical & Horizontal Scaling | Zero-downtime upgrades for compute, storage capacity, and bandwidth as user volume grows. |

---

#### Why AWS is Superior to a Generic VPS
Running mission-critical university ERP operations on Amazon Web Services (AWS) provides substantial architectural, security, and compliance advantages over unmanaged generic Virtual Private Servers (VPS):

```
+-----------------------------------------------------------------------------------+
|                            AWS CLOUD ARCHITECTURE                                 |
|                                                                                   |
|  [ University Route 53 DNS ] ---> [ Elastic IP (Clean PTR / Anti-Spam Rep) ]      |
|                                                     |                             |
|                                                     v                             |
|  +-----------------------------------------------------------------------------+  |
|  | AWS Security Group (Stateful Hypervisor Firewall: Inbound 80, 443; SSH IP)  |  |
|  |                                                                             |  |
|  |   +---------------------------------------------------------------------+   |  |
|  |   | EC2 Instance (Ubuntu 24.04 LTS - t4g.small / t3.medium)             |   |  |
|  |   |                                                                     |   |  |
|  |   |   [ Nginx Reverse Proxy (SSL / HTTP/2) ]                            |   |  |
|  |   |                     |                                               |   |  |
|  |   |                     v (Internal Port 3030 - Never Publicly Exposed) |   |  |
|  |   |   [ Next.js Node.js 22 Runtime managed by PM2 Cluster ]             |   |  |
|  |   |                     |                                               |   |  |
|  |   |                     v (AES-256-GCM Application Encryption)          |   |  |
|  |   |   +-------------------------------------------------------------+   |  |
|  |   |   | Encrypted EBS Volume (AWS KMS Hardware-Enforced Encryption) |   |  |
|  |   |   | - data/members.json                                         |   |  |
|  |   |   | - data/events.json                                          |   |  |
|  |   |   | - data/reimbursements.json                                  |   |  |
|  |   |   +-------------------------------------------------------------+   |  |
|  |   +---------------------------------------------------------------------+   |  |
|  +-----------------------------------------------------------------------------+  |
|                                     |                                             |
|  [ AWS Data Lifecycle Manager (DLM) ] ---> Automated Multi-AZ Point-in-Time Snapshots |
+-----------------------------------------------------------------------------------+
```

| Security / Operational Vector | Generic Unmanaged VPS | AWS Enterprise Cloud Architecture |
|---|---|---|
| **Storage Encryption** | Host-level software encryption often missing; raw hypervisor disk snapshots can expose plaintext files if compromised. | **Dual-Layer Zero-Trust Security:** EBS hardware volume encryption enforced via AWS KMS (FIPS 140-3 Level 3 HSM) on top of the ERP's application-level AES-256-GCM cipher. |
| **Network & Firewall Protection** | Relies on software `ufw`/`iptables` within the guest OS. If the OS kernel is breached, the firewall collapses. | **Hypervisor-Level Security Groups:** Stateful virtual firewalls operating outside the VM. Unused ports (like 3030) are blocked at the AWS network fabric before ever hitting the server. |
| **Email Deliverability & IP Reputation** | Generic VPS IP pools are frequently blacklisted due to spam neighbor abuse; reverse-DNS (PTR) is difficult or impossible to configure. | **Dedicated Elastic IP with Clean PTR:** Guaranteed IP allocation with customized reverse-DNS configured directly in the AWS console, achieving flawless inbox delivery for OTPs and invitations. |
| **Hardware Failure & High Availability** | If physical VPS host hardware dies, server is offline for hours until manual support intervention. | **Auto-Recovery & Instant Resizing:** EC2 automatically migrates the instance to healthy hardware within 60 seconds if hardware degrades. Volume storage can be expanded dynamically with zero downtime. |
| **Disaster Recovery Snapshots** | Manual or uncoordinated full-disk dumps requiring downtime. | **Amazon Data Lifecycle Manager (DLM):** Automated, application-consistent point-in-time EBS volume snapshots replicated across multiple availability zones. |
| **Credential Management** | Plaintext `.env` credentials remain on disk indefinitely. | **AWS Systems Manager Parameter Store / Secrets Manager:** Secrets can be injected dynamically into the runtime via IAM Instance Profiles without storing plain credentials in static files. |

---

#### Step-by-Step AWS Deployment Runbook

##### Step 1: EC2 Instance Provisioning
1. Log in to the **AWS Management Console** and navigate to **EC2** → **Launch Instance**.
2. **Name:** `LEADS-ERP-Production`.
3. **Application and OS Image (AMI):** Select **Ubuntu Server 24.04 LTS (HVM)**, SSD Volume Type.
4. **Architecture:** `64-bit (Arm)` (for AWS Graviton) or `64-bit (x86)`.
5. **Instance Type:**
   - *Recommended (Arm):* `t4g.small` (2 vCPU, 2 GiB RAM) — 20% lower cost and higher compute efficiency.
   - *Alternative (x86):* `t3.medium` (2 vCPU, 4 GiB RAM).
6. **Key Pair:** Create a new key pair `leads-erp-key` (format: `.pem` for OpenSSH) and download it to a secure administrative workstation.

##### Step 2: Storage Configuration & AWS KMS Encryption
1. In the **Configure Storage** section, set primary root volume:
   - **Size:** `30 GiB` minimum.
   - **Volume Type:** `gp3` (General Purpose SSD, baseline 3,000 IOPS, 125 MB/s throughput).
2. Expand **Advanced Storage Details**:
   - Check **Encrypted**.
   - **KMS Key:** Select `(default) aws/ebs` or select your institutional customer-managed key (CMK).

##### Step 3: Security Group Rules Configuration
Create a dedicated Security Group named `leads-erp-sg`:

| Rule Type | Protocol | Port Range | Source | Justification |
|---|---|---|---|---|
| **HTTPS** | TCP | `443` | `0.0.0.0/0` & `::/0` | Public encrypted web access for students, faculty, and attendees. |
| **HTTP** | TCP | `80` | `0.0.0.0/0` & `::/0` | Required for Let's Encrypt automated ACME HTTP-01 SSL issuance and auto-renewal. |
| **SSH** | TCP | `22` | `<Admin-Workstation-IP>/32` | **Strict Whitelist:** Restrict administrative SSH exclusively to your static institutional IP address. |

> **Security Note:** Port `3030` is **NOT** included in the Security Group. The Next.js application runs strictly locally on `localhost:3030`, accessible only through the local Nginx reverse proxy.

##### Step 4: Elastic IP Allocation & Route 53 DNS Mapping
1. Under **Network & Security**, click **Elastic IPs** → **Allocate Elastic IP address**.
2. Select the allocated IP, click **Actions** → **Associate Elastic IP address**, and attach it to your running EC2 instance.
3. In **Amazon Route 53** (or your institutional DNS registrar):
   - Create an `A` record pointing `leads.institution.edu` to the Elastic IP.
   - In the EC2 Elastic IP console, configure the **Reverse DNS (PTR)** record to match `leads.institution.edu`.

##### Step 5: Connecting to EC2 & Server Initialization
Connect to the server from your workstation:
```bash
chmod 400 leads-erp-key.pem
ssh -i leads-erp-key.pem ubuntu@<Elastic-IP>
```

Execute the automated system setup:
```bash
# 1. Update OS packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git

# 3. Install PM2 Process Manager globally
sudo npm install -g pm2
```

##### Step 6: Deploying the Application & Nginx Configuration
```bash
# 1. Clone repository to server
cd /var/www
sudo git clone https://github.com/Kayo2970/ERP.git
sudo chown -R ubuntu:ubuntu /var/www/ERP
cd /var/www/ERP/leads-dashboard

# 2. Install dependencies & compile production bundle
npm install
npm run build

# 3. Start daemon under PM2
pm2 start npm --name "leads-dashboard" -- start
pm2 save
pm2 startup
```

Configure Nginx reverse proxy at `/etc/nginx/sites-available/leads-erp`:
```nginx
server {
    server_name leads.institution.edu;

    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and obtain SSL:
```bash
sudo ln -s /etc/nginx/sites-available/leads-erp /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d leads.institution.edu
```

Navigate to `https://leads.institution.edu/setup` in your browser to complete the **Initial Web GUI Setup Wizard**!

---

### 1.8 Super User Financial Setup & Payment Initiation

The Super User and Centre Head oversee the financial disbursement pipeline, starting with configuring institutional settlement coordinates and processing expense claims:

#### Phase 1: Configuring Default Settlement Bank Coordinates
1. Navigate to **System Settings** (`/dashboard/settings`).
2. Scroll to the **Default Reimbursement Bank Settlement Coordinates** section.
3. **What to Enter:**
   - **Bank Name:** The official banking institution (e.g. `State Bank of India` or `HDFC Bank`).
   - **Account Number:** The institutional or personal settlement bank account number.
   - **IFSC Code:** The 11-character Indian Financial System Code (e.g. `SBIN0001234`).
4. Click **Save Profile & Bank Details**.
5. **What Happens:** Coordinates are saved into your profile record. Whenever you submit an expense reimbursement, these details automatically pre-fill into the claim voucher.

![Super User Bank Coordinates Setup](screenshots/steps/00_setup/03_super_user_bank_payment_setup.png)
*Figure 1.3: Live captured default reimbursement bank settlement coordinates in Settings.*

---

#### Phase 2: Initiating a Payment / Reimbursement Claim
1. Navigate to **Reimbursements** (`/dashboard/reimbursements`).
2. Locate the **Submit Expense Claim** form on the left workspace panel.
3. **What to Enter:**
   - **Associated Event (Optional):** Select the target conclave, festival, or choose *General Operations / Non-Event Expense*.
   - **Expense Category:** Select the budget classification (`Stage & AV`, `Logistics & Transport`, `Printing & Stationary`, `Hospitality & Food`, `Miscellaneous`).
   - **Claim Amount (₹) \*:** The exact financial amount in Indian Rupees (e.g. `12500`).
   - **Expense Description & Justification \*:** Detailed operational reason for the purchase.
   - **Bills & Supporting Docs (Up to 3 files):** Drag and drop GST invoices, merchant tax bills, or payment receipts.
   - **Bank Settlement Coordinates:** Verified auto-populated Bank Name, Account Number, and IFSC Code.
4. Click **Submit Reimbursement Claim**.
5. **What Happens:** The claim enters the **Claims in Verification Pipeline** in real time across all client screens.

![Payment Claim Initiation](screenshots/steps/00_setup/04_payment_claim_initiation.png)
*Figure 1.4: Live captured reimbursement claim initiation and expense submission form.*

---

#### Phase 3: The 3-Gate Payment Approval & Disbursement Lifecycle
Every submitted claim is audited through 3 distinct checkpoints:

1. **Gate 1: Sector / Department Head Verification**
   - The Event Sector Head reviews the claim against the approved event plan.
   - Checks operational necessity and clicks **Approve Gate 1**.
2. **Gate 2: Finance Head GST Compliance Audit**
   - The Finance Head opens the attached tax vouchers.
   - Verifies the merchant's GSTIN, invoice date, and matching bank coordinates.
   - Clicks **Verify Gate 2 (GST Audit Cleared)**.
3. **Gate 3: Centre Head Executive Settlement & Disbursement**
   - The Centre Head or Super User opens the cleared claim.
   - Inspects the claimant's bank account number and IFSC code.
   - Initiates bank NEFT/RTGS/UPI transfer and clicks **Disburse / Settle Gate 3**.
   - **Outcome:** The claim badge transitions to green (`Settled`), the transaction timestamp is stamped into the immutable audit ledger, and the event's actual expenditure figure updates automatically.

---

### 1.9 First-Time Account Activation & Password Setup
Accounts are provisioned by the Administrator or Department Head through the **Members Directory**. Users do not self-register from a public signup form.

1. **Receive Activation Email**: When your profile is created, you receive an automated email containing your unique, single-use activation link.
2. **Open Activation Link**: Click the link (e.g., `https://leads.msruas.ac.in/activate?token=...`).
3. **Set Password**:
   - Must be at least **8 characters** in length.
   - Recommended: Include uppercase, lowercase, numbers, and symbols.
4. **Confirm Profile Details**: Verify your Department, Role, and Phone Number.
5. **Log In**: Navigate to the Login screen with your institutional email and new password.

> **Tip:** If your activation link expires or is lost, contact your administrator to click **Resend Activation Link** from the Members Directory.

---

### 1.10 Mobile / PWA Installation (iOS & Android)
LEADS ERP is an installable Progressive Web Application (PWA). You can install it directly onto your phone's home screen for a full-screen, native app feel:

- **Apple iOS (Safari)**:
  1. Open the ERP URL in Safari.
  2. Tap the **Share** button (box with an arrow pointing up).
  3. Scroll down and tap **Add to Home Screen**.
  4. Tap **Add**. The LEADS icon will appear on your home screen.
- **Android (Chrome)**:
  1. Open the ERP URL in Google Chrome.
  2. Tap the three dots menu in the top right corner.
  3. Tap **Install app** or **Add to Home screen**.
  4. Confirm by tapping **Install**.

---

### 1.11 Interface Layout & Navigation Shell
Once logged in, the application interface provides:

1. **Collapsible Sidebar (Left)**: Houses navigation links to all modules permitted for your tier. Clicking the collapse button tucks the sidebar into compact icon mode.
2. **Top Application Bar**:
   - **Page Title**: Current view and status.
   - **Date Range / Period Filter**: Globally filters events, tasks, and financials (All Time, This Month, Last 90 Days, Academic Year).
   - **Quick Switcher (Super User only)**: Allows administrators to view the interface as any active member.
   - **User Menu**: Shows your profile picture, active role badge, settings, and Sign Out button.
3. **Main Content Canvas**: Fast, responsive workspace with zero full-page reloads.

---

## 2. Role Privileges & Access Hierarchy

### 2.1 Understanding Tiers 1 through 7
Access rights in LEADS ERP are governed by a 7-tier hierarchical model combined with organizational divisions:

| Tier | Role Title | Typical Division | Core Authority |
|:---:|:---|:---|:---|
| **Tier 1** | **Super User** | Core Committee | Unrestricted administrative control, system settings, global audit logs, emergency lockdown, encrypted backups, and persona switching. |
| **Tier 2** | **Centre Head** | Faculty | Executive operational authority across campuses, final budget approvals, Level-2 reimbursement clearance, and VIP guest directory oversight. |
| **Tier 3** | **Department Head / Event Lead** | Faculty / Core | Directs designated departments (Events, Logistics, Media, Stage, etc.). Approves event proposals, conducts Level-1 reimbursement audits, assigns tasks. |
| **Tier 4** | **Advisory Board / Faculty Advisor** | Faculty / Advisory | High-level consultative read access to institutional performance analytics, committee ratings, and event summaries. |
| **Tier 5** | **Core Committee Members** | Core Committee | Operational execution: event creation, task allocation, event passes studio, design review submissions, and form creation. |
| **Tier 6** | **Training Associates / Student Members** | Training Associate | Personal workspace: task execution and status reporting, personal reimbursement claim submissions, and digital visiting card generation. |
| **Tier 7** | **Alumni / External Guests** | Alumni / Guest | Read-only access to relevant past event archives, visiting card exchanges, and public event passes. |

---

### 2.2 Master Designation x Module Privileges Matrix

The comprehensive matrix below defines the exact operational authority of every institutional role across the 24 workspace modules:

| Module / Route | Super User (T1) | Centre Head & Advisor (T2) | Finance Head (T3) | Sector / Dept Head (T3/5) | General Secretary (T5) | Core Member (T5) | Training Assoc. (T6) | Chief Advisor (T4) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard Home** (`/dashboard/home`) | **Full** | **Full** | View All | View All | View All | View All | Own Only | View Only |
| **Events Management** (`/dashboard/events`) | **Full** | **Approve** | View All | Create | Create | Create (Req Sign-off) | Own Only | View Only |
| **Event Passes & Scanner** (`/dashboard/event-passes`) | **Full** | **Full** | View All | **Full** | **Full** | Issue / Scan | Scan Kiosk | View Only |
| **Tasks & Gantt** (`/dashboard/tasks`) | **Full** | **Full** | View All | Assign / Edit | Create | Own / Exec | Execute Task | View Only |
| **Reimbursements (Gate 1)** (`/dashboard/reimbursements`) | **Full** | **Sign-off** | View All | **Approve Gate 1** | Submit Claim | Submit Claim | Submit Claim | View Only |
| **Reimbursements (Gate 2)** (`/dashboard/reimbursements`) | **Full** | **Audit** | **Verify Gate 2** | — | — | — | — | View Only |
| **Reimbursements (Gate 3)** (`/dashboard/reimbursements`) | **Full** | **Settle Gate 3** | — | — | — | — | — | View Only |
| **Budgeting & Funds** (`/dashboard/budget`) | **Full** | **Full Allocation** | **Manage Funds** | View All | View All | — | — | View Only |
| **Design Portal & OCR** (`/dashboard/designs`) | **Full** | **Full** | View All | Approve Proof | Upload | Upload / Proof | Upload | View Only |
| **Dynamic Form Builder** (`/dashboard/forms`) | **Full** | **Approve Live** | **Approve Live** | Build (Req Sign) | Build Form | Build Form | — | View Only |
| **Event Reports** (`/dashboard/event-reports`) | **Full** | **Approve Report** | View All | View All | **Submit Report** | — | — | View Only |
| **Members Directory** (`/dashboard/directory`) | **Add / Terminate** | **Add Member** | View Roster | View Roster | View Roster | View Roster | Own Profile | View Only |
| **Group Policies** (`/dashboard/policies`) | **Full** | **Full** | — | — | — | — | — | — |
| **Backup & Restore** (`/dashboard/backup`) | **Full** | — | — | — | — | — | — | — |
| **System Settings** (`/dashboard/settings`) | **Full** | — | — | — | — | — | — | — |

> **Access Legend:**
> - **Full**: Unrestricted administrative governance, capability grants, deletions, and overrides.
> - **Approve**: Authority to approve or reject submissions in this module.
> - **Create**: Can author records (routes through sign-off where indicated).
> - **View All / View Only**: Read-only institutional transparency without mutation affordances.
> - **Own Only**: Restricted strictly to personal assigned deliverables, profile, or submitted claims.
> - **—**: Feature access hidden or disabled by RBAC governance.

### 2.3 Super User Quick Switch (Persona Switcher)
Administrators (Tier 1) can evaluate user experience or verify permission rules without logging in and out:
1. In the top bar, open the **Persona Switcher** dropdown.
2. Select any registered member in the system.
3. The dashboard re-renders instantly with that exact user's permissions, navigation sidebar, and data visibility.
4. An amber notification banner remains pinned at the top: **"Impersonating [Name] — Return to Super User"**.
5. Click **Return to Super User** at any time to restore root administrative credentials.

---

## 3. Module-by-Module Operating Instructions

### 3.1 Home Dashboard
The executive landing page upon signing in:
- **KPI Stat Cards**: Real-time totals for Active Events, Pending Tasks, Completed Tasks, and Total Budget vs. Expenditure.
- **Action Required Inbox**: Highlights items waiting on your approval (reimbursements to verify, tasks requiring sign-off).
- **Upcoming Deadlines**: Prioritized timeline of imminent event and task deadlines.
- **Recent Activity Feed**: Audit trail of recent member logins, status updates, and document exports.

![Live Dashboard Screenshot](screenshots/02_dashboard_home.png)
*Figure 3.1: Live Home Dashboard with active metric cards and project timeline.*

---

### 3.2 Events Management
The **Events Management** module (`/dashboard/events`) is the operational engine of the LEADS ERP. It coordinates the complete lifecycle of university hackathons, conferences, technical symposiums, and cultural festivals from initial ideation to post-event reporting.

> **Access Permissions & Scoping:**
> - **Proposal & Setup:** Tier 1 (Super User), Tier 2 (Centre Head), Tier 3 (Department Heads), and Tier 5 (Core Committee Leads).
> - **Executive Approval:** Tier 2 (Centre Head) and Tier 2.5 / Tier 3 (Faculty Event Heads).
> - **Student Visibility:** Tier 6 (Training Associates) view events they are appointed to.

![Events Management Main View](screenshots/steps/02_events_management/01_events_main_view.png)
*Figure 3.2.1: Events directory showing active event cards, campus filters, budget utilization bars, and status pills.*

#### 1. Event Status Lifecycle
Events transition through five strictly enforced operational states:
```
[Draft] ──► [Pending Approval] ──► [Approved / Active] ──► [Completed] ──► [Archived]
                 │                           │
                 └──► Rejected (Returned)    └──► Cancelled
```

---

#### Step 1: Creating an Event Proposal
1. Navigate to **Events** from the sidebar.
2. Click the **+ Create Event** button in the top toolbar.
3. The **Create New Event** modal opens.
4. Fill in the event configuration according to the table below.

#### Input Field Reference ("What Information Goes Where")
| Field Label | Input Type | Where to Enter | Allowed Format / Values | Description & System Behavior |
|---|---|---|---|---|
| **Event Title \*** | Text Input | First input box | Full title (e.g. `National Youth Tech Conclave 2026`) | Official institutional event name. Appears on delegate badges, public registrations, and financial vouchers. |
| **Event Code \*** | Text Input | Second input box | Unique alphanumeric string (e.g. `TECHCON-2026`) | Internal ledger prefix used to tag procurement claims, passes, and task queues. |
| **Campus / Venue \*** | Select Dropdown | Left column dropdown | `Ramaiah Technology Centre (RTC)`, `Gnanagangothri Campus (GG)`, `Virtual / Online` | Sets geographic venue and automatically assigns campus jurisdiction to the relevant Faculty Head. |
| **Start & End Dates \*** | Date & Time Pickers | Middle row | Valid future date range | Defines active operational window. Automatically synchronizes with Master Calendar and Festival timetable. |
| **Estimated Budget \*** | Currency Input | Right column | Integer INR (e.g. `₹1,50,000`) | Proposed financial allocation. Subject to Gate-1 faculty review and Centre Head clearance. |
| **Target Capacity** | Number Input | Bottom row | Integer (e.g. `500`) | Maximum delegate capacity. Used by Event Passes studio to prevent over-subscription. |

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

### 3.3 Event Passes & Live Scanner Kiosk
The **Event Passes** module (`/dashboard/event-passes`) provides digital ticketing, badge printing, and live gate access control.

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
| **Attendee Full Name \*** | Text Input | First input box | Full Name (e.g. `Dr. Vikram Sarabhai`) | Displayed in high-contrast typography on digital and printed passes. |
| **Email Address \*** | Email Input | Second input box | Valid Email (`attendee@institution.edu`) | Destination address for automated PDF badge dispatch and Apple/Google Wallet links. |
| **Pass Category \*** | Select Dropdown | Left dropdown | `VIP Dignitary`, `Keynote Speaker`, `Faculty Delegate`, `Student Participant` | Dictates pass color styling, lanyard badge layout, and gate security clearance privileges. |
| **Seat / Zone Assignment** | Text Input | Right input box | Row & Seat (e.g. `Auditorium - Row A, Seat 12`) | Printed on pass barcode payload for ushering. |

![Issue Pass Modal](screenshots/steps/03_event_passes/02_issue_pass_modal_filled.png)
*Figure 3.3.2: Issue pass modal with category badges, organization details, and instant email dispatch options.*

---

#### Step 2: Operating the Live Gate Scanner Kiosk
1. On event day, gate volunteers navigate to **Event Passes &rarr; Check-in Scanner**.
2. Grant camera permissions. The camera feed initializes with a high-contrast targeting reticle.
3. Present the attendee's QR badge (printed or displayed on smartphone).
4. **Instant Security Feedback:**
   - 🟢 **Green Flash & Chime:** Valid Pass. Displays Attendee Name, Category, and records check-in timestamp in `event_passes.json`.
   - 🔴 **Red Flash & Alarm:** Duplicate Check-in! Shows exact prior entry timestamp to prevent badge sharing.
   - 🟡 **Amber Flash:** Invalid or unapproved serial.

![Live Scanner Kiosk](screenshots/steps/03_event_passes/03_live_scanner_kiosk.png)
*Figure 3.3.3: Gate Scanner Kiosk with camera viewfinder, flashlight toggle, manual serial override, and live entry logs.*

### 3.4 Apple Wallet & Google Wallet Integration
Attendees and committee members can store passes directly inside their phone's native digital wallet.

- **Apple Wallet (`.pkpass`)**:
  - Attendee taps **Add to Apple Wallet** from their email or pass confirmation page.
  - The iOS PassKit engine opens the pass with custom event branding, seat/tier information, and live gate updates.
  - Automatically surfaces on the iPhone lock screen via geo-fencing when near the MSRUAS campus on event day.
- **Google Wallet**:
  - Android users tap **Save to Google Wallet**.
  - Adds the pass to Google Wallet app with barcode, event schedule, and push notification support.

---

### 3.5 Task Management, Delegation & Gantt Timeline
The **Tasks** module (`/dashboard/tasks`) coordinates deliverables across all operational tiers with integrated timeline scheduling.

![Tasks Board View](screenshots/steps/04_tasks_gantt/01_tasks_board_view.png)
*Figure 3.5.1: Task board view showing priority badges, committee tags, assignee avatars, and deadline countdowns.*

---

#### Step 1: Creating and Delegating a Task
1. Navigate to **Tasks** and click **+ New Task**.
2. Fill in task parameters:

#### Input Field Reference
| Field Label | Input Type | Where to Enter | Allowed Values | Description & System Behavior |
|---|---|---|---|---|
| **Task Title \*** | Text Input | First input box | Concise title (e.g. `Stage LED Wall Configuration & AV Soundcheck`) | Summarizes the deliverable. Appears on dashboard action cards. |
| **Description** | Textarea | Main text area | Detailed instructions | Outlines technical requirements, dimensions, safety protocols, or file links. |
| **Assignee Type \*** | Radio / Dropdown | Assignment section | `Individual Member` or `Entire Committee` | When *Committee* is chosen, every member appointed to that sub-committee receives visibility and notifications. |
| **Priority Level \*** | Select Dropdown | Left column dropdown | `High (Urgent)`, `Medium (Standard)`, `Low (Flexible)` | High-priority items pin to the top of member dashboards with crimson badges. |
| **Deadline Date & Time \***| Date/Time Picker | Right column picker | Future date & time | Triggers automated background email reminders 24 hours and 2 hours before expiration. |

![New Task Modal Filled](screenshots/steps/04_tasks_gantt/02_new_task_modal_filled.png)
*Figure 3.5.2: Task assignment modal with committee delegation, priority flags, and deadline scheduling.*

---

#### Step 2: Visualizing Schedule via Gantt Timeline
1. Switch to the **Gantt Timeline** tab in the top navigation rail.
2. The interactive timeline displays horizontal task bars grouped by sub-committee.
3. Identify overlapping deliverables, critical dependencies, and potential resource bottlenecks before event day.

![Gantt Timeline Active](screenshots/steps/04_tasks_gantt/03_gantt_timeline_active.png)
*Figure 3.5.3: Interactive Gantt timeline visualization with date markers and progress milestones.*

### 3.6 Performance Ratings & Committee Evaluation
Objective performance reviews conducted after event completions:
1. Navigate to **Ratings**.
2. Select an event and target committee or member.
3. Score across standard institutional criteria (1 to 5 stars):
   - Timeliness & Reliability
   - Quality of Deliverables
   - Communication & Teamwork
   - Initiative & Problem Solving
4. Add qualitative commendations or constructive feedback.
5. Ratings automatically aggregate into the student's operational transcript and departmental performance index.

![Live Performance Ratings Screenshot](screenshots/06_performance_ratings.png)
*Figure 3.5: Committee member evaluations and leaderboards.*

---

### 3.7 Procurement & Equipment Requisitions
The **Procurement** module (`/dashboard/procurement`) enforces structured financial requisitions for equipment, sound rentals, printing, and consumables.

![Procurement Table View](screenshots/steps/05_procurement/01_procurement_requests_table.png)
*Figure 3.7.1: Equipment procurement ledger showing requisition status, vendor quotations, and cost breakdowns.*

---

#### Step 1: Submitting a Procurement Requisition
1. Navigate to **Procurement** and click **+ New Request**.
2. Fill in the requisition modal:

#### Input Field Reference
| Field Label | Input Type | Where to Enter | Allowed Values | Description & System Behavior |
|---|---|---|---|---|
| **Item Name \*** | Text Input | First input box | Descriptive title (e.g. `Heavy-Duty Industrial Extension Cables & Power Strips`) | Identifies equipment or materials needed. |
| **Quantity \*** | Number Input | Left number field | Positive integer (e.g. `10`) | Number of units requested. |
| **Estimated Cost (INR) \*** | Currency Input | Right number field | Number in INR (e.g. `₹12,500`) | Total estimated price including taxes. |
| **Vendor Quotation (PDF) \***| File Upload | Drag-and-drop zone | PDF or image scan (Max 10MB) | Mandatory competitive vendor quotation for financial audit compliance. |
| **Justification & Event** | Textarea | Bottom text area | Explanatory note | Explains why existing centre inventory cannot fulfill the requirement. |

![New Requisition Modal Filled](screenshots/steps/05_procurement/02_new_requisition_modal.png)
*Figure 3.7.2: Procurement request modal with vendor estimate upload and budget justification.*

---

#### Step 2: Multi-Stage Approval Sequence
```
[Requisition Submitted] ──► [Level 1: Dept Head Clearance] ──► [Level 2: Centre Head Financial Approval] ──► [Fulfilled / Purchased]
```

### 3.8 Financial Reimbursements & Multi-Gate Audit
The **Reimbursements** module (`/dashboard/reimbursements`) guarantees transparency and auditability for all out-of-pocket expenses incurred during university operations.

![Reimbursements Pipeline View](screenshots/steps/06_reimbursements/01_reimbursements_pipeline_view.png)
*Figure 3.8.1: Reimbursement claims queue showing dual-gate audit status and payment vouchers.*

---

#### Step 1: Submitting an Expense Claim
1. Open **Reimbursements** and click **+ Submit Claim**.
2. Complete claim submission form:

#### Input Field Reference
| Field Label | Input Type | Where to Enter | Allowed Values | Description & System Behavior |
|---|---|---|---|---|
| **Expense Title \*** | Text Input | First input box | Descriptive title (e.g. `VIP Guest Transport & Airport Escort Fuel Charges`) | Summary of expense. Appears on payment audit reports. |
| **Amount (INR) \*** | Currency Input | Left number field | Positive number in INR (e.g. `₹3,450`) | Exact amount supported by attached receipt. |
| **Category \*** | Select Dropdown | Right dropdown | `Travel & Transport`, `Food & Hospitality`, `Materials & Printing`, `Technical Supplies` | Categorizes expense for annual financial statements. |
| **Receipt Scan \*** | File Upload | Upload dropzone | JPG, PNG, or PDF scan (Max 10MB) | Mandatory clear tax invoice or digital payment receipt. |
| **Linked Event \*** | Select Dropdown | Event selector | Active approved events | Automatically debits the approved budget of the selected event upon disbursement. |

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

### 3.9 Budgeting, P&L & Income Sources
The **Budgeting** module (`/dashboard/budget`) maintains the master fiscal balance sheet of the LEADS Next Gen Centre.

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

### 3.10 Design Portal, Proofreading & OCR Spellcheck
The **Design Portal** (`/dashboard/designs`) manages promotional posters, banners, and digital creatives before public distribution.

![Design Portal Overview](screenshots/steps/08_design_portal/01_designs_gallery_view.png)
*Figure 3.10.1: Design portal asset gallery showing proofreading status badges and linked event tags.*

---

#### Step 1: Uploading a Creative Asset
1. Click **+ Upload Creative** or **Add Design**.
2. Select target event and format (e.g. `Instagram Post (1080x1080)`, `Auditorium Standee (3x6 ft)`).
3. Upload image (PNG, JPG, WebP).
4. **Automated AI OCR Spellcheck:** The integrated Tesseract.js engine scans all text lines within 3 seconds, cross-referencing dates, guest names, and institutional terminology against the English dictionary to detect typos automatically.
5. **Faculty Sign-off:** Designated media faculty inspect the asset and click **Approve for Publishing**.

![Upload Creative Modal](screenshots/steps/08_design_portal/02_upload_creative_modal.png)
*Figure 3.10.2: Creative upload modal with dimensions picker and automated spellcheck analysis.*

### 3.11 Dynamic Form Builder & Public Submissions
The **Forms** module (`/dashboard/forms`) enables rapid creation of public event RSVPs, delegate registrations, and feedback surveys without external third-party subscriptions.

![Forms Management View](screenshots/steps/09_dynamic_forms/01_forms_management_view.png)
*Figure 3.11.1: Dynamic forms management table displaying live submission tallies and QR download tools.*

---

#### Step 1: Building a Dynamic Form
1. Click **+ Create Form**.
2. In the Form Designer canvas, add fields from the drag-and-drop palette:
   - Text inputs, email validators, phone formatters, dropdown selectors, checkboxes, rating stars, and file uploads.
3. Configure **Public URL Slug** (e.g. `/forms/tech-conclave-rsvp`).
4. Generate instant high-resolution **QR Code** for event poster printing.
5. Real-time responses stream directly into `submissions.json` with instant export to Word (.docx) and CSV.

![Form Builder Canvas](screenshots/steps/09_dynamic_forms/02_form_builder_canvas.png)
*Figure 3.11.2: Form builder canvas showing custom fields, validation rules, and live preview.*

### 3.12 Digital Visiting Cards & 3D Interactive Keycard
Every verified institutional member receives a personalized digital card accessible at `/card/[slug]`.

![3D Keycard Preview](screenshots/steps/10_visiting_card/01_visiting_card_3d_keycard.png)
*Figure 3.12.1: Interactive 3D WebGL keycard badge with holographic sheen and one-tap vCard address book download.*

- **Interactive 3D WebGL Badge:** Responds fluidly to mouse movement and smartphone gyroscopes.
- **One-Tap Contact Save:** Tap **Save Contact (vCard)** to immediately save name, designation, phone, email, and social profiles directly into smartphone address books.
- **Mobile Wallet Integration:** Downloadable pass for Apple Wallet and Google Wallet.

### 3.13 Guest Directory & VIP Invitation Engine
The **Guest Directory** (`/dashboard/guest-directory`) manages institutional records for visiting dignitaries, keynote speakers, and industry delegates.

![Guest Roster Table](screenshots/steps/11_guest_directory/01_guest_roster_table.png)
*Figure 3.13.1: VIP guest directory displaying dignitary designations, organizations, and engagement status.*

---

#### Step 1: Adding a Dignitary via Business Card Photo OCR
1. Click **+ Add Guest**.
2. Either enter contact details manually or upload a photo of the guest's physical visiting card.
3. The built-in OCR scans the card and auto-populates Full Name, Organization, Designation, Phone, and Email.
4. Select guests and click **Send Formal Invitation** to dispatch personalized emails with embedded RSVP buttons.

![Add Guest OCR Modal](screenshots/steps/11_guest_directory/02_add_guest_ocr_modal.png)
*Figure 3.13.2: Guest creation modal with automated visiting card image OCR recognition.*

### 3.14 Announcements & Scoped Broadcasts
The **Announcements & Circulars Engine** (`/dashboard/announcements`) empowers center leadership and committee heads to publish official advisories, emergency updates, meeting summons, and financial deadlines. The module features precision target scoping, multi-tier approval gates, and a real-time background email dispatch pipeline with live progress telemetry.

> **Access Permission:** 
> - **Direct Publication & Approval:** **Tier 1 (Super User)** and **Tier 2 (Centre Head / GG Campus Events Head)** can publish and circulate immediately.
> - **Proposal & Submission:** **Tier 3 (Department Heads)** and **Tier 5 (Core Committee / Secretariat)** can draft announcements, which automatically route to the Centre Head for sanction before email distribution.
> - **Read Access:** All registered members see announcements targeted to their scope on their personal dashboard feed.

![Center Announcements Feed](screenshots/steps/13_announcements/01_announcements_feed_view.png)
*Figure 3.14.1: Live captured Announcements board displaying active circulars, approval status badges, and scope tags.*

---

#### Step-by-Step Operating Workflow:

##### Step 1: Open the Broadcast Composer
1. Navigate to **Announcements** (`/dashboard/announcements`) in the left navigation sidebar.
2. Click the **+ New Announcement** button in the upper-right header.
3. The **Publish Center Announcement** modal dialog opens over the workspace.

![New Announcement Modal](screenshots/steps/13_announcements/02_new_announcement_modal.png)
*Figure 3.14.2: Live captured announcement composer modal with precision target scoping controls.*

##### Step 2: Target Audience & Content Configuration ("What Information Goes Where")

| Input Field Name | UI Component Type | Permissible Values / Format | Description & Architectural Impact |
|---|---|---|---|
| **Announcement Title \*** | Single-line Text Input | String (5–120 chars) | High-impact circular headline displayed in dashboard banners and used as the email subject line prefix (e.g. `[LEADS Notice] Mandatory Pre-Fest Stage Logistics Briefing`). |
| **Target Audience / Category \*** | Dropdown Select | `All Members`<br>`Advisory Board`<br>`Core Committee`<br>`Training Associate`<br>`Faculty`<br>`Executive Council`<br>`Event Committee`<br>`Specific Members` | Determines the cryptographic recipient filter. Only members matching this designation receive the circular in their feed and email inbox. |
| **Select Linked Event \*** | Searchable Dropdown | Approved Active Events | *Appears only when `Event Committee` is selected.* Associates the announcement with an active festival or event. |
| **Select Committee \*** | Dropdown Select | Committee names from selected event | *Appears only when `Event Committee` is selected.* Targets a specific functional sub-unit (e.g. `Stage & Sound`, `Guest Hospitality`). |
| **Specific Members Search \*** | Searchable Multiselect Checklist | Registered Member Roster | *Appears only when `Specific Members` is selected.* Allows individually selecting 1 or more specific colleagues by name and email. |
| **Announcement Content \*** | Multiline Textarea | Rich Markdown / Plaintext (Min 10 chars) | Full circular text, instructions, venue details, agenda points, and operational requirements. Automatically rendered with clean typography and spacing. |

##### Step 3: Submission & Multi-Tier Approval Gate
1. Click **Publish Announcement** (or **Submit for Approval** if logged in as Tier 3 or 5).
2. **What Happens Architectural Flow:**
   - **Executive Submission (Centre Head / Super User):** The announcement is marked `Approved` immediately. The background email dispatcher fires asynchronously, and a floating status toast confirms circulation.
   - **Student / Dept Head Submission:** The announcement is marked `Pending Approval (Centre Head / GG Campus Events Head)` with an amber pulse badge. It appears in the Centre Head's **Approvals Inbox** (`/dashboard/approvals`). No emails are sent until executive sign-off.
   - **Executive Approval:** The Centre Head opens the announcement and clicks **Approve & Publish**. The badge turns green (`Approved & Published`), and the email queue begins transmitting.
   - **Executive Rejection:** If rejected, the announcement displays a red `Rejected` badge with auditor remarks.

##### Step 4: Real-Time Email Circulation Progress Monitor
When an approved circular initiates email delivery:
1. A persistent progress widget docks to the bottom-right corner of the screen:
   - Displays real-time progress bar (e.g. `Sending email 14 of 48...`).
   - Displays the exact recipient currently receiving transmission (e.g. `Dispatched to: rahul.sharma@institution.edu`).
2. Users can click **Minimize** to collapse the widget into a compact pill while continuing other work without interrupting the socket relay.

---

### 3.15 Master Calendar & Festival Schedule
The **Master Calendar & Festival Schedule** (`/dashboard/calendar` and `/dashboard/festivals`) provides an enterprise-grade institutional timetable uniting all event production milestones, gate rehearsal schedules, task deliverables, and official university holidays into a synchronized operational calendar.

> **Access Permission:** Available to **All Tiers (1 through 7)**. Visibility of specific event cards adheres to individual Group Policies (`OWN` vs `ALL` scope) and publication approval status.

![Master Calendar Month View](screenshots/steps/14_calendar_festivals/01_master_calendar_month_view.png)
*Figure 3.15.1: Live captured Master Calendar month grid showing event milestones, task deadlines, and quick-filter controls.*

---

#### Features & Operations Breakdown:

##### A. Master Calendar Grid Operations (`/dashboard/calendar`)
1. **Month & Year Navigation:**
   - Use the **<** (Previous Month) and **>** (Next Month) chevron buttons in the header to navigate across academic terms.
   - Click any date cell (e.g. August 15) to isolate scheduled activities for that specific 24-hour cycle.
2. **Color-Coded Status Markers:**
   - **Purple Badges:** Active Event Milestones (e.g. *RoboTech 2026 Opening Ceremony*).
   - **Amber Badges:** Planning Phase & Technical Rehearsals.
   - **Emerald Badges:** Completed Events & Post-Event Audits.
   - **Cyan Badges:** Individual Task Deliverable Deadlines linked to your committee.
3. **Campus Segregation Filter:**
   - Toggle between **All Campuses**, **Ramaiah Tech Campus (RTC)**, and **Gnanagangothri Campus (GG)** to resolve venue booking overlaps before finalizing dates.

![University Festivals & Observance Portal](screenshots/steps/14_calendar_festivals/02_festivals_and_holidays_view.png)
*Figure 3.15.2: Live captured Festivals & Observance directory with social media creative dispatch triggers.*

##### B. University Festivals & Observance Portal (`/dashboard/festivals`)
Institutions celebrate numerous national observances, cultural festivals, and university foundations throughout the academic year. The Festivals portal ensures no celebration is overlooked:
1. **Time-Horizon Filtering:**
   - Click the chip toggles: **This Week (Next 7 Days)**, **Upcoming 30 Days**, **All Year**, or **Past Observances**.
2. **Automated Social Media Task Dispatch:**
   - Committee Leads and Social Media Heads can click **+ Assign Social Creative** on any upcoming festival card.
   - **What Happens:** The ERP automatically spawns a linked graphic design deliverable on the **Tasks Board** (`/dashboard/tasks`) and **Design Portal** (`/dashboard/designs`), assigned directly to the Media Committee with an automated due date 48 hours prior to the festival!

---

### 3.16 Executive Event Reports & PDF/Word Exports
Comprehensive institutional governance demands thorough post-event documentation. The LEADS platform incorporates two synchronized reporting engines: the **Event Documentation & Rubrics Scoring Portal** (`/dashboard/event-reports`) and the **Executive Performance Analytics Engine** (`/dashboard/reports`).

> **Access Permission:**
> - **Report Submission:** **Tier 1 (Super User)**, **Tier 2 (Centre Head)**, and **Tier 5 (General Secretary & Chief Coordinator)**.
> - **Evaluation Rubrics Scoring & Approval:** **Tier 1 (Super User)** and **Tier 2 (Centre Head / Faculty Advisor)**.
> - **Analytics & PDF Export:** **Tier 1 through Tier 4 (Faculty & Leadership)**.

![Event Reports Rubric Portal](screenshots/steps/15_event_reports/01_event_reports_rubric_portal.png)
*Figure 3.16.1: Live captured Event Reports portal showing submitted documentation, status workflows, and institutional rubrics scoring.*

---

#### Sub-Portal A: Post-Event Documentation & Rubrics Scoring (`/dashboard/event-reports`)

##### Step 1: Submitting a Formal Post-Event Report (General Secretary / Organizers)
1. Navigate to **Event Reports** (`/dashboard/event-reports`).
2. Under **Submit Event Report**:
   - **Select Completed Event:** Pick from the list of approved events that have concluded.
   - **Upload Event Dossier File:** Drag and drop the formal compiled report file (`.pdf`, `.docx`, or `.zip` up to 25 MB) into the upload dropzone.
3. Click **Submit Event Report for Executive Review**.
4. **What Happens:** The report enters `Pending Review` status. An audit notification routes to the Centre Head and Faculty Advisor.

##### Step 2: The 5-Pillar Institutional Evaluation Rubric
When reviewing a submitted report, the Centre Head or Faculty Advisor scores the event across five institutional excellence criteria:

| Rubric Pillar | Weightage | Evaluation Criteria |
|---|---|---|
| **1. Operational Execution & Punctuality** | 20 Points | Stage flow adherence, technical setup promptness, speaker management, and crowd control. |
| **2. Financial Discipline & Budget Adherence** | 20 Points | Variance between approved budget ceiling and actual expenditure; completeness of GST vouchers. |
| **3. Delegate Engagement & Attendance Turnout** | 20 Points | Ratio of scanned turnstile check-ins against total passes issued; audience satisfaction metrics. |
| **4. Media, Branding & Social Outreach** | 20 Points | Quality of promotional creatives, Instagram/LinkedIn reach, and university branding compliance. |
| **5. Post-Event Documentation & Handover** | 20 Points | Timeliness of report submission, high-resolution photo archives, and inventory return reconciliations. |

Once scored, the system calculates a composite score (e.g. `94/100 — Grade A+ Outstanding`), seals the audit ledger, and enables university leadership download.

---

#### Sub-Portal B: Executive Performance Analytics & PDF Compilation (`/dashboard/reports`)

![Executive Analytics Charts & PDF Export](screenshots/steps/15_event_reports/02_executive_analytics_charts.png)
*Figure 3.16.2: Live captured Executive Performance Analytics dashboard featuring radar competency metrics and one-click PDF generation.*

1. **Radar Competency Visualizer:**
   - Renders interactive SVG radar charts comparing student committee competencies across Leadership, Punctuality, Technical Skill, Financial Prudence, and Teamwork.
2. **Bar Chart Aggregation Breakdown:**
   - Toggle view modes: **By Student Average**, **By Event Aggregate**, or **By Individual Task Deliverable**.
3. **Period & Division Filtering:**
   - Filter metrics across academic terms or isolate specific divisions (*Core Committee*, *Training Associates*, *Faculty*).
4. **One-Click Executive PDF Compilation:**
   - Click the **Download Executive Report (PDF)** button in the header.
   - **What Happens:** The system captures client-side SVG vector charts, merges them with institutional header typography and member evaluation tables, and streams a publication-ready `.pdf` directly to the browser downloads folder.

---


### 3.17 Unified Approvals Inbox
The **Approvals** module (`/dashboard/approvals`) is the centralized decision-making inbox for Tier 2 and Tier 3 heads.

![Unified Approvals Inbox](screenshots/steps/12_approvals_inbox/01_unified_approvals_queue.png)
*Figure 3.17.1: Centralized approvals queue consolidating proposals, requisitions, expense claims, and creatives.*

- **Tabbed Categories:** Switch seamlessly between Event Proposals, Procurement Requisitions, Financial Claims, and Design Creatives.
- **Inline Actions:** Decision-makers can inspect item details and click **Approve** or **Reject** with mandatory feedback notes without navigating between disparate modules.

### 3.18 Members Directory & Account Provisioning
The **Members Directory** (`/dashboard/directory`) is the central administrative hub for managing the institutional workforce, leadership appointments, user provisioning, access credentials, and student performance dossiers across the LEADS Next Gen Centre.

> **Access Permissions & Scoping:**
> - **Full Management & Provisioning:** Tier 1 (Super User), Tier 2 (Centre Head / Advisor), Tier 3 (Department Heads), and Tier 5 (Core Committee Leads).
> - **Student View (Tier 6 Training Associates):** When logged in, student volunteers are presented with their personal *Student Profile Dossier* showing their tasks, performance ratings, and committee appointments.

![Members Directory Main View](screenshots/steps/01_members_directory/01_directory_main_view.png)
*Figure 3.18.1: Live Members Directory interface showing division filters, search bar, batch tools, and active member roster.*

#### 1. Primary Directory Controls & Anatomy
- **Division Filter Tabs:** Quick-filter the roster by organizational branch: `ALL`, `Core Committee`, `Faculty`, `Training Associate`, `Advisory Board`, or `Alumni`.
- **Live Search Engine:** Real-time filtering across member names, institutional email addresses, roles, departments, academic degrees, and graduation batches.
- **Batch Action Tools:**
  - `Download CSV Template`: Exports a pre-formatted CSV schema with all valid headers.
  - `Import CSV`: Opens drag-and-drop file ingestion zone for bulk onboarding.
  - `+ Add Member`: Opens the visual onboarding modal for individual member provisioning.

---

#### Step 1: Onboarding an Individual Member
1. Click the **+ Add Member** button in the top-right toolbar.
2. The **Add New Member** modal opens with dark-glass styling.
3. Enter the member's personal, institutional, and academic details according to the field reference table below.

#### Input Field Reference ("What Information Goes Where")
| Field Label | Input Type | Where to Enter | Allowed Format / Values | Description & System Behavior |
|---|---|---|---|---|
| **Full Name \*** | Text Input | First input box in modal | Full alphabetic name (e.g. `Ananya Sharma`) | Official institutional name. Used across event badges, digital keycards, certificates, and post-event executive reports. |
| **Email Address \*** | Email Input | Second input box in modal | Valid institutional email (e.g. `ananya.sharma@msruas.ac.in`) | Primary unique account identifier. The system verifies uniqueness to prevent duplicate registrations. Used for login authentication, password reset links, and automated dispatches. |
| **Division \*** | Select Dropdown | Left column dropdown | `Core Committee`, `Faculty`, `Training Associate`, `Advisory Board`, `Alumni` | Defines the organizational grouping, baseline access tier, and dynamically determines the available choices in the Position dropdown. |
| **Position / Designation \*** | Select Dropdown | Right column dropdown (Dynamic) | Contextual based on selected Division (e.g. `President`, `General Secretary`, `Department Head`, `Associate`, etc.) | Defines operational leadership standing and determines the exact permissions granted across the ERP. |
| **Department** | Select Dropdown | Appears conditionally when *Department Head* or *Member* is chosen | `Leadership & Development`, `Research & Development`, `Design & Social Media`, `Sustainability & Innovation`, `Finance & Sponsorships`, `Marketing & Branding`, `Operations & Logistics` | Associates the member with a specialized committee department for task delegation, budget tracking, and material requisitions. |
| **Degree / Program** | Text Input | Student Information section | Academic title (e.g. `B.Tech Computer Science & Engineering`) | Enrolled university degree. Displayed in student profile dossiers and digital keycards. |
| **Graduation Batch** | Text Input | Student Information section | Year range (e.g. `2023 - 2027`) | Academic cohort years. Used for cohort analytics and automated alumni migration upon graduation. |

#### Dynamic Role Derivation ("Computed Role Preview")
The LEADS ERP enforces zero-configuration role derivation. Rather than requiring administrators to manually configure dozens of security checkboxes, the platform computes the exact **Access Tier (1 through 7)** and system capability flags in real-time based on the combination of **Division** and **Position**.

As you modify dropdown selections, the blue **Computed Role Preview** box updates dynamically to show the exact administrative tier before saving:
- `Core Committee` + `Department Head` &rarr; **Tier 5: Core Committee Lead (Full Department Oversight)**
- `Faculty` + `Events Head` &rarr; **Tier 2.5: Faculty Head of Events**
- `Training Associate` + `Associate` &rarr; **Tier 6: Student Workforce (Assigned Tasks & Personal Profile Only)**

![Add Member Modal Filled](screenshots/steps/01_members_directory/02_add_member_modal_filled.png)
*Figure 3.18.2: Completed Add Member modal for Core Committee Department Head, illustrating live dynamic Computed Role Preview (Tier 5).*

---

#### Step 2: Division-Specific Sub-Selections & Campus Jurisdictions
1. When **Faculty** is selected as the Division, the Position dropdown adapts to present academic leadership roles: `Centre Head`, `Events Head`, `Finance Head`, `Industrial Connects`, `Advisor`, and `Chief Advisor`.
2. Selecting **Events Head** dynamically reveals a secondary **Campus Designation** sub-selection.
3. Choose between `GG Campus` (Gnanagangothri Campus) and `RTC Campus` (Ramaiah Technology Centre).
4. The Computed Role Preview immediately adjusts to reflect campus-specific event governance (e.g. *Tier 2.5 — Head of Events - GG Campus*).
5. Click **Save Member** to commit the record to encrypted storage.

![Faculty Campus Sub-Selection](screenshots/steps/01_members_directory/03_faculty_campus_subselection.png)
*Figure 3.18.3: Faculty sub-selection interface showing Events Head paired with GG Campus designation and dynamic Tier 2.5 derivation.*

---

#### Step 3: Direct Password Administration (Super User Override)
While standard provisioning dispatches an automated email containing a 48-hour activation token, administrators frequently require immediate credential provisioning (e.g. for offline testing, emergency access recovery, or service accounts).
1. Locate the target member in the directory table (e.g. `Aarav Sharma`).
2. In the Actions column on the right, click the **Set Password Directly (Lock icon)** button.
3. The **Set Password Directly** modal appears with an administrative override warning.
4. Enter the new password in the input field (minimum 4 characters). Use the eye icon toggle to verify plaintext entry if required.
5. Click **Set Password**.
6. **What Happens on Click:**
   - The password is sent over TLS to the server API (`/api/members/set-password`).
   - The server generates a unique cryptographic salt and hashes the credentials using high-work-factor **scrypt**.
   - The encrypted hash is stored in `data/members.json`, replacing any previous credentials.
   - The member's `hasPassword` flag flips to `true`, and any pending reset requirement is resolved. The user can log in immediately without OTP verification.

![Direct Password Override](screenshots/steps/01_members_directory/04_set_password_modal.png)
*Figure 3.18.4: Super User direct password override modal enabling instant credential assignment with secure scrypt hashing.*

---

#### Step 4: Inspecting Student Profile Dossiers & Outcomes
The LEADS ERP provides a longitudinal dossier for every student member, collating deliverables, committee evaluations, and performance ratings across their university career.
1. In the directory roster, find any student member (e.g. `Aarav Sharma`).
2. Click the **Profile (Eye icon)** button in their row.
3. The **Student Profile Dossier** modal opens in high-contrast dark-glass presentation.
4. Inspect the 4 high-level KPI cards:
   - **Rating:** Cumulative peer and faculty evaluation score (out of 5.0 stars).
   - **Tasks Completed:** Ratio of completed deliverables to assigned work (e.g. `0 / 0 total`, 100% completion rate).
   - **Committees:** Total number of active sub-committee appointments held across university events.
   - **Quality Index:** Automated rubric deliverable quality assessment score.
5. Explore the three tabbed outcome sections:
   - **Deliverables & Tasks Tab:** Lists historical tasks, deadline compliance, and submitted project deliverables.
   - **Event Sub-Committees Tab:** Highlights organizing committee appointments and leadership roles across institutional festivals.
   - **Evaluation Scorecards Tab:** Presents qualitative commentary and rubric evaluations logged by Faculty Advisors and Department Heads.

![Student Profile Dossier](screenshots/steps/01_members_directory/05_member_profile_dossier.png)
*Figure 3.18.5: Comprehensive Student Profile Dossier displaying performance scores, task completion analytics, and committee outcomes.*

---

#### 4. Bulk Operations & Batch Data Management
- **Downloading CSV Schema:** Click **Download CSV Template** to obtain `leads_members_template.csv` pre-populated with required headers: `Name,Email,Division,Position,Department,Program,Batch,Phone`.
- **Batch CSV Ingestion:** Click **Import CSV** or drag a `.csv` file directly onto the roster table. The ingestion engine validates email formats, prevents duplicate entries, and stages valid rows for single-click database insertion.
- **Multi-Select Toolbar:** Check the boxes next to individual member rows (or click the table header checkbox to select all filtered members). A floating glass toolbar appears at the bottom of the screen:
  - **Export Selected:** Generates an instant CSV extract of the selected cohort.
  - **Bulk Remove:** Triggers a safe confirmation modal requiring explicit approval before removing multiple accounts.
  - **Resend Welcome Email:** Dispatches fresh 48-hour activation tokens to all unactivated accounts in the selection.

---

### 3.19 Custom Group Policies & Access Thresholds
The **Group Policies & Granular RBAC Engine** (`/dashboard/policies`) provides university administrators with total cryptographic control over dashboard permissions without altering a single line of application source code. Administrators can construct dynamic access policies, target them at specific academic divisions, tiers, designations, or individual colleagues, and grant elevated module capabilities or view/edit overrides on demand.

> **Access Permission:** Strictly restricted to **Tier 1 (Super User)**, **Tier 2 (Centre Head / GG Campus Events Head)**, and **Tier 4 (Faculty Advisor)**. All other members are barred by kernel-level routing guards.

![Group Policies Management Matrix](screenshots/steps/16_group_policies/01_group_policies_matrix_view.png)
*Figure 3.19.1: Live captured Group Policies matrix showing active capability tags, target scope filters, and module access grants.*

---

#### Architectural Security Model:
1. **The Permanent Super User Safety Floor:**
   - Tier 1 (Super User) retains unalterable, hardcoded access across every database collection and endpoint. Group policies can never strip the Super User's privileges, ensuring administrators can never accidentally lock themselves out of the system.
2. **Capability Additive Inheritance:**
   - If a member is a Training Associate (Tier 6) with default read-only restrictions, an administrator can assign them a policy tag (e.g. `STUDENT_TREASURER`) that grants `PROPOSE_BUDGET` and `MANAGE_PROCUREMENT`. The user immediately inherits those elevated privileges without altering their institutional rank.
3. **Module Scope Overrides (`OWN` vs `ALL`):**
   - By default, junior coordinators can only view and edit records belonging to their own committee (`OWN`). Group Policies allow granting `ALL` access across specific modules (e.g. allowing an auditor to view all campus requisitions across all departments).

---

#### Step-by-Step Operating Workflow:

##### Step 1: Launch Policy Tag Builder
1. Navigate to **Group Policies** (`/dashboard/policies`) in the navigation sidebar.
2. Click the **+ New Policy Tag** button in the upper-right header.
3. The **Create Access Policy Tag** modal dialog renders over the matrix.

![Create Policy Tag Modal](screenshots/steps/16_group_policies/02_create_policy_modal.png)
*Figure 3.19.2: Live captured Policy Tag Builder modal with granular capability checkboxes and module access toggles.*

##### Step 2: Policy Tag Configuration ("What Information Goes Where")

| Configuration Field | Component Type | Options / Syntax | Functional Purpose |
|---|---|---|---|
| **Policy Tag Name \*** | Text Input | Slugified uppercase string (e.g. `STAGE_TECH_SUPERVISOR`) | Unique cryptographic key identifying this policy across session tokens and capability resolvers. |
| **Description** | Textarea | Plaintext description | Records administrative justification (e.g. *Grants elevated equipment procurement rights to stage crew leads*). |
| **Target Divisions** | Multi-Checkbox Toggle | `Faculty`<br>`Core Committee`<br>`Training Associate`<br>`Advisory Board`<br>`Alumni` | Any member whose profile division matches any selected checkbox automatically inherits this policy. |
| **Target Tiers** | Multi-Checkbox Toggle | `Tier 1` through `Tier 7` | Limits enforcement strictly to selected hierarchical ranks (e.g. only Tier 5 students). |
| **Designation Keyword** | Text Input | Search string (e.g. `Treasurer`, `Media`, `Head`) | Matches any member whose institutional title contains this substring (case-insensitive). |
| **Specific Members** | Searchable Select Dropdown | Member Roster | Directly attaches the policy to one or more individuals regardless of their division or rank. |
| **Capability Grants** | Multi-Checkbox Matrix | `MANAGE_EVENT_PASSES`<br>`PROPOSE_BUDGET`<br>`AUDIT_REIMBURSEMENTS`<br>`PUBLISH_ANNOUNCEMENTS`<br>`EDIT_FORM_TEMPLATES`<br>`VIEW_ALL_EVENTS` | Explicit capability flags that unlock administrative action buttons on corresponding dashboard pages. |
| **Module View / Edit Overrides** | Dual-Select Matrix per Module | `Events`: `[View: ALL / OWN]` `[Edit: ALL / OWN / NONE]`<br>`Tasks`: `[View: ALL / OWN]` `[Edit: ALL / OWN / NONE]`<br>`Procurement`: `[View: ALL / OWN]` `[Edit: ALL / OWN / NONE]` | Forces custom data visibility and editing bounds for targeted members on specific database collections. |
| **Approval Sign-off Required** | Boolean Toggle Switch | `Enabled` / `Disabled` | When enabled, actions executed by policyholders must be countersigned in the Approvals Inbox by the Centre Head. |

##### Step 3: Persistence & Reactive Hot-Reload
1. Click **Create Policy Tag**.
2. **What Happens:** The policy is cryptographically serialized into `data/policies.json`.
3. Within 7 seconds, all active client browsers synchronize the new policy matrix. Targeted members will see newly unlocked navigation buttons and permissions appear instantly without needing to log out.

---

### 3.20 Email Delivery Engine & SMTP Mailroom Portal
The **Mailroom Audit Portal** (`/dashboard/email`) provides institutional email relay controls, automated system dispatches (account activation tokens, OTPs, task notifications, pass deliveries, birthday greetings), scoped announcements, and delivery audit logs.

> **Access Permission:** Restricted strictly to **Tier 1 (Super User)** and **Tier 2 (Centre Head)**.

![SMTP Server Configuration](screenshots/steps/17_email_engine/01_email_engine_smtp_config.png)
*Figure 3.20.1: Live captured SMTP configuration panel showing mail relay credentials, TLS security toggles, and socket diagnostics.*

![Outbound Transmission Logs](screenshots/steps/17_email_engine/02_email_outbox_queue_logs.png)
*Figure 3.20.2: Live captured Outbound Transmission queue and delivery audit logs with real-time status badges.*

---

#### Step 1: Navigating to SMTP Mail Relay Configuration
1. In the sidebar, select **Email Engine** (`/dashboard/email`).
2. Click the **SMTP Configuration** tab in the top navigation toggle.
3. The configuration panel displays the provider selection matrix and credential input forms.

---

#### Step 2: Selecting Mail Relay Provider
Select the service provider matching your institution's email infrastructure:

| Provider Card | Default Endpoint | Security / Authentication Requirements |
|---|---|---|
| **Gmail / Workspace** | `smtp.gmail.com:587` | Requires Google Workspace account with 2-Factor Authentication enabled and a 16-character **Google App Password**. |
| **Outlook 365** | `smtp.office365.com:587` | Requires Microsoft 365 mailbox with **SMTP AUTH enabled** in M365 Admin Center (`Users → Active Users → [Mailbox] → Mail → Manage email apps → check Authenticated SMTP`). |
| **Custom SMTP** | User-defined | Any on-premise institutional SMTP relay (e.g. `mail.institution.edu`) supporting STARTTLS or SSL. |
| **Local Postfix** | `localhost:25` | Zero-credential local relay daemon running directly on the Linux VPS. |
| **Direct Send (Built-in)** | MX Direct (Port 25) | Built-in direct dispatch. The ERP resolves recipient domain MX records via DNS and connects directly without intermediary relays. Requires configured reverse-DNS (PTR). |

---

#### Step 3: Input Field Reference ("What to Enter and Where")

##### A. Standard SMTP Relays (Gmail, Outlook, Custom SMTP, Postfix)
- **SMTP Host \***:
  - *Where to enter:* First input in the server parameters grid.
  - *What to enter:* The fully qualified hostname of your outgoing mail server (e.g. `smtp.gmail.com`, `smtp.office365.com`, or `mail.institution.edu`).
- **SMTP Port \***:
  - *Where to enter:* Second input in the server parameters grid.
  - *What to enter:* `587` for STARTTLS (recommended), `465` for TLS/SSL wrapper, or `25` for local unauthenticated Postfix.
- **Auth Username / Email**:
  - *Where to enter:* Under "Auth Username / Email".
  - *What to enter:* The institutional service account address (e.g. `<system-notifications@institution.edu>`). Leave empty if using local unauthenticated Postfix.
- **App Password / Auth Secret**:
  - *Where to enter:* Under "App Password / Auth Secret". Click the eye icon to toggle visibility.
  - *What to enter:* The 16-character application-specific password. Never enter your personal account password.
- **Sender Display Name \***:
  - *Where to enter:* Under "Sender Display Name".
  - *What to enter:* The formal institutional sender name appearing in recipients' inboxes (e.g. `LEADS Next Gen Centre`).
- **Sender Email Address \***:
  - *Where to enter:* Under "Sender Email Address".
  - *What to enter:* The RFC 5322 "From" address (e.g. `<notifications@institution.edu>`). Must match the authenticated mailbox domain to pass SPF/DMARC checks.

##### B. Built-in Direct Send Mode (No Relay)
When **Direct Send (Built-in)** is selected:
- **HELO Hostname \***:
  - *Where to enter:* Direct Send parameters box.
  - *What to enter:* The fully qualified domain name (FQDN) assigned to your VPS outbound IP (e.g. `mail.institution.edu`).
  - *Requirement:* Must match the PTR (reverse-DNS) record on your VPS IP address; receiving mail servers (Gmail, Microsoft) reject connections without valid reverse DNS.

##### C. Advanced DKIM Cryptographic Signing (Optional)
Click **DKIM Signing (Advanced)** to expand the cryptographic key fields:
- **DKIM Domain**: The domain signing the outbound messages (e.g. `institution.edu`).
- **DKIM Selector**: The DNS selector prefix (e.g. `leads`), matching the public DNS TXT record at `<selector>._domainkey.<domain>`.
- **DKIM Private Key**: Paste the PEM-formatted RSA private key (`-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----`).

---

#### Step 4: Saving Credentials & Encryption At Rest
1. Review all entered fields for accuracy.
2. Click **Save SMTP Credentials**.
3. **What Happens:**
   - Field validations trigger. If any mandatory field is missing, the form scrolls automatically to the invalid field with an alert toast.
   - The server encrypts sensitive credentials using the master `DATA_ENCRYPTION_KEY` and persists them in `leads-dashboard/data/systemSettings.json`.
   - A green toast appears: *"Email server credentials and SMTP settings updated successfully."*
   - The "Last updated" timestamp refreshes.

---

#### Step 5: Connection Diagnostics & Sending a Test Email
1. In the right-hand panel under **Connection Diagnostics & Test**, locate the **Test Recipient Email** box.
2. Enter a verified destination inbox (e.g. `<admin-test@institution.edu>`).
3. Click **Test Connection & Send Email**.
4. **Diagnostic Execution Flow:**
   - The button switches to a spinning status: *"Verifying SMTP Server..."*
   - The server establishes a socket connection to the configured host and port.
   - Negotiates TLS handshake and submits authentication credentials.
   - Sends a formatted HTML diagnostic message.
5. **Evaluating Test Results:**
   - **Success (Green Box):** Displays **"SMTP Handshake Verified"** along with the server response code (e.g. `250 2.0.0 OK: message queued`). Check the test inbox to confirm email delivery.
   - **Failure (Red Box):** Displays **"SMTP Handshake Error"** with raw diagnostic details:
     - `535 5.7.8 Authentication credentials invalid`: Check username and verify the App Password.
     - `ETIMEDOUT` / `ECONNREFUSED`: Firewall or ISP blocking port 587/465.
     - `535 5.7.139 Authentication unsuccessful (M365)`: SMTP AUTH is disabled on the Microsoft 365 mailbox; an administrator must enable it in the Microsoft 365 Admin Center.

---

#### Step 6: Composing & Dispatching Broadcast Emails
1. Click the **Compose Broadcast** tab.
2. Select the **Target Audience Scope**:
   - `All Members`: Entire university roster.
   - `Faculty / Dept Heads`: Tier 2 through 4 faculty leadership.
   - `Core Committee`: Tier 5 student organizers.
   - `Training Associates`: Tier 6 general student workforce.
   - `Custom List`: Enter comma-separated recipient addresses.
3. Enter the **Email Subject Line** and compose message body in Markdown or Rich Text.
4. Attach optional files (enforces max 25MB total attachment limit per SMTP standards).
5. Click **Dispatch Broadcast**. A security confirmation modal displays the recipient count and target scope. Confirm to initiate delivery.

---

#### Step 7: Sent Outbox History & Delivery Audit Logs
1. Click the **Sent Outbox & Audit Logs** tab.
2. Inspect the real-time operational metrics:
   - **Total Sent Emails**: Cumulative dispatches since system initialization.
   - **Successful Handshakes**: Messages accepted by receiving mail transfer agents (MTAs).
   - **Failed Dispatches**: Messages rejected, bounced, or timed out.
3. The live log table shows:
   - **Timestamp**: Exact delivery attempt date and time.
   - **Recipient & Category**: Member email and dispatch type (`Activation Token`, `Pass Delivery`, `Task Digest`, `Announcement`).
   - **Status Badge**: `DELIVERED` (Green), `QUEUED` (Amber), or `BOUNCED` (Red).
   - **Action**: Click **Inspect Diagnostics** to view the full SMTP handshake transcript and error codes.

---

### 3.21 System & Security Settings
The **System & Security Settings** suite (`/dashboard/settings`) manages personal identity, encrypted banking credentials for reimbursement payouts, visual role inspection, and the immutable university security audit trail.

> **Access Permission:** 
> - **Personal Identity & Banking Tabs:** Open to **All Registered Users (Tiers 1 through 7)** for updating their personal credentials and reimbursement bank accounts.
> - **Audit Trail & System Controls:** Strictly accessible to **Tier 1 (Super User)** and **Tier 2 (Centre Head)**.

![System Account & Security Settings](screenshots/steps/18_settings/01_system_account_security_view.png)
*Figure 3.21.1: Live captured System Settings showing account profile, password entropy bar, and reimbursement banking inputs.*

---

#### Operating Tabs & Field Reference ("What Information Goes Where"):

##### Tab 1: Account Profile & Security Credentials (`/dashboard/settings?tab=account`)

| Field Name | Component Type | Format / Constraints | Operational Purpose |
|---|---|---|---|
| **Display Name \*** | Text Input | Full Name (2–80 chars) | Formal name displayed on passes, committee rosters, and email circular signatures. |
| **Official Email Address** | Text Input + Button | Institutional Email | Click **Request Email Change**. Initiates a two-step cryptographic verification requiring approval tokens from both old and new addresses to thwart unauthorized takeovers. |
| **Date of Birth** | Date Picker | YYYY-MM-DD | Used for birthday greetings automation and age verification for official university tours. |
| **Profile Avatar Photo** | File Upload + Canvas Cropper | PNG, JPG, WebP (Max 2 MB) | Includes interactive rectangular and circular aspect ratio cropping tools before saving to server storage. |
| **Current Password \*** | Password Input (with eye toggle) | Existing secret | Required verification before the server accepts any credential change. |
| **New Master Password** | Password Input (with eye toggle) | Minimum 8 characters | Features a real-time entropy meter evaluating uppercase, lowercase, numbers, and symbols. |
| **Confirm New Password \*** | Password Input | Identical string | Prevents typographical lockout. |

##### Tab 2: Financial Reimbursement Banking Profile (`/dashboard/settings?tab=reimbursement`)
To receive automated expense reimbursements from the University Finance Department, every member must keep their banking details current:
- **Account Holder Name \***: Name as registered in the bank passbook.
- **Bank Name \***: Scheduled commercial bank (e.g. *State Bank of India*, *HDFC Bank*).
- **Bank Account Number \***: Numeric bank account identifier (encrypted on disk using AES-256).
- **IFSC Code \***: 11-character Indian Financial System Code (e.g. `SBIN0040582`).
- **UPI Virtual Payment Address (VPA)**: Direct UPI handle (e.g. `rahul@okhdfcbank`) for instant digital payouts.

![System Audit Trail](screenshots/steps/18_settings/02_system_audit_trail_view.png)
*Figure 3.21.2: Live captured Immutable System Audit Trail capturing security logs, IP addresses, and export utilities.*

##### Tab 3: Immutable System Security Audit Trail (`/dashboard/settings?tab=audit`)
1. **Search & Period Filters:** Filter events by member name, keyword (e.g. `PASSWORD_RESET`, `CLAIM_SETTLED`), or academic quarter.
2. **Recorded Telemetry Points:** Every administrative modification permanently stamps:
   - Action Timestamp (UTC + IST)
   - Initiating Member Name & Institutional Email
   - Remote Client IP Address and User Agent
   - Target Entity ID and Delta Payload
3. **CSV Audit Export:** Click **Download CSV Audit Log** to export compliance records for institutional governance audits.

---

### 3.22 Encrypted Backup & Restore
The **Disaster Recovery & Encrypted Snapshot Engine** (`/dashboard/backup`) ensures total institutional data sovereignty, disaster resilience, and offline portability without relying on third-party cloud database providers.

> **Access Permission:** Strictly restricted to **Tier 1 (Super User)**. All other tiers are immediately redirected.

![Encrypted Backup & Disaster Recovery Portal](screenshots/steps/19_backup_restore/01_encrypted_backup_dr_view.png)
*Figure 3.22.1: Live captured AES-256 Encrypted Backup and Point-in-Time Disaster Recovery interface.*

---

#### Step-by-Step Operating Procedures:

##### Step 1: Generating an AES-256 Encrypted Backup Snapshot
1. Navigate to **Backup & Restore** (`/dashboard/backup`).
2. Under **Create Encrypted Backup**:
   - **Custom Passphrase (Optional):** Enter a custom secret passphrase to encrypt the snapshot. If left empty, the server automatically ciphers the archive using the master server key `DATA_ENCRYPTION_KEY`.
   - **Confirm Passphrase:** Retype the identical passphrase.
3. Click **Download Encrypted Snapshot (.leads.enc)**.
4. **What Happens Architectural Flow:**
   - The server traverses all SQLite relational tables and encrypted JSON collections (`members`, `events`, `tasks`, `reimbursements`, `budgets`, `forms`, `settings`).
   - Compresses the dataset into an atomic payload.
   - Encrypts the archive using **AES-256-GCM** with a newly generated 12-byte initialization vector (IV) and 16-byte authentication tag.
   - Downloads a `.leads.enc` file (e.g. `leads_backup_2026-10-02_18-59.leads.enc`) directly to your administrative device.

##### Step 2: Emergency System Lockdown Mode
In the event of an active cyber incident or during major university infrastructure maintenance:
1. Locate the **Emergency Maintenance Lockdown** card in the upper panel.
2. Toggle the switch to **Active**.
3. **What Happens:** All active non-Super User client sessions across the campus are immediately paused with a polite modal: *"System Under Scheduled Maintenance. Database writes temporarily frozen."* The Super User can safely perform maintenance operations without race conditions.

##### Step 3: Point-in-Time Database Restoration
1. Under **Point-in-Time Restoration**:
   - Drag and drop your `.leads.enc` snapshot file into the **Restore File Dropzone**.
   - Enter the **Decryption Passphrase** used when creating the snapshot.
   - For security, type the exact confirmation word: `RESTORE`.
2. Click **Execute Point-in-Time Restoration**.
3. **What Happens:**
   - The server verifies the cryptographic authentication tag (`authTag`). If the file has been tampered with or corrupted, restoration aborts immediately without touching active data.
   - Once verified, the database replaces current records, re-indexes relations, and emits a websocket broadcast triggering an automatic page reload across all campus browsers within 7 seconds.

##### Step 4: Air-Gapped Offline Decryption CLI
If the server hardware suffers catastrophic failure and the web dashboard cannot be accessed, administrators can decrypt `.leads.enc` files offline on any machine with Node.js installed:
```bash
node scripts/decrypt-backup.js path/to/leads_backup.leads.enc "YourPassphrase"
```
The script outputs standard unencrypted JSON files into a target directory for immediate forensic inspection or manual database recovery.

---

## 4. Step-by-Step Operator Playbooks by Designation

This section details the exact step-by-step procedures for each institutional role, including the primary action buttons, what happens on each click, and actual live application screenshots.

---

### 4.1 Playbook: Tier 1 — Super User Administration
*Applicable Designation:* **Super User / System Administrator**

#### Step 1: Real-Time Role Impersonation via Persona Switcher
1. Navigate to **Home Dashboard** (`/dashboard/home`).
2. Click the **Account Switcher** (UserCog icon) in the header navigation bar.
3. Select any registered member from the searchable dropdown roster.
4. **What Happens:** The entire client interface re-renders under that target user's exact tier, department, and permissions. An amber notification banner pins to the header: *"Impersonating [Name] — Return to Super User"*.
5. Click **Return to Super User** at any time to restore root administrative credentials.

![Super User Persona Switcher](screenshots/steps/01_super_user/02_persona_switcher_active.png)
*Figure 4.1.1: Live captured Super User quick-switch dropdown menu.*

#### Step 2: Member Account Provisioning & Password Override
1. Navigate to **Members Directory** (`/dashboard/directory`).
2. Click **+ Add Member**.
3. Fill in Name, Institutional Email, select Division (*Faculty*, *Core Committee*, *Training Associate*, or *Alumni*), and assign Department and Position.
4. Click **Add Member**.
5. **What Happens:** The system creates the member record, generates a single-use activation token (`act-...`), and dispatches an onboarding email. Alternatively, the Super User can click **Set Password Directly** to establish credentials immediately without OTP.

![Member Provisioning Modal](screenshots/steps/01_super_user/04_add_member_modal.png)
*Figure 4.1.2: Live captured member provisioning modal.*

#### Step 3: Granular Access Control & Group Policies
1. Navigate to **Group Policies** (`/dashboard/policies`).
2. Review the built-in access levels or click **+ Create Policy**.
3. Toggle module view/edit grants and capability tags (e.g., `PROPOSE_BUDGET`, `MANAGE_EVENT_PASSES`).
4. Click **Save Policies**.
5. **What Happens:** Target members inherit the capability tag immediately with reactive cross-device sync.

![Group Policies Builder](screenshots/steps/01_super_user/05_group_policies_matrix.png)
*Figure 4.1.3: Live captured group policies capability editor.*

#### Step 4: Encrypted AES-256 Disaster Recovery Snapshot
1. Navigate to **Backup & Restore** (`/dashboard/backup`).
2. Click **Create Encrypted Backup Now**.
3. **What Happens:** The server dumps all collections (JSON and SQLite), compresses the payload, encrypts it under AES-256-GCM using `DATA_ENCRYPTION_KEY`, and downloads a `.leads.enc` archive.
4. To recover from a catastrophe, drag the snapshot into the **Restore Dropzone**, input the decryption passphrase, and click **Execute Restoration**.

![Encrypted Backup Portal](screenshots/steps/01_super_user/06_encrypted_backup_portal.png)
*Figure 4.1.4: Live captured AES-256 encrypted backup and point-in-time recovery screen.*

---

### 4.2 Playbook: Tier 2 — Centre Head & Faculty Advisor
*Applicable Designations:* **Centre Head**, **Faculty Advisor**, and **Head of Events (GG Campus - Tier 2.5)**

#### Step 1: Manage Unified Approvals Inbox
1. Navigate to **Approvals Inbox** (`/dashboard/approvals`).
2. Filter by category (*Events*, *Tasks*, *Reimbursements*, *Budgets*, *Forms*).
3. Inspect pending proposal details.
4. Click **Approve (Checkmark)** to grant authorization, or click **Reject (Cross)** and supply audit feedback notes.
5. **What Happens:** The item updates instantly across all active client devices within 7 seconds.

![Approvals Inbox Queue](screenshots/steps/02_centre_head/01_approvals_inbox_queue.png)
*Figure 4.2.1: Live captured unified approvals inbox queue.*

#### Step 2: Executive Event Proposal Sanction
1. Navigate to **Events** (`/dashboard/events`).
2. Filter by `Pending Approval` to isolate new proposals.
3. Review proposed budget ceiling, venue selection, target delegate attendance, and committee assignments.
4. Click **Approve Proposal**.
5. **What Happens:** Event transitions to `Active` on the university calendar, unlocking pass issuance and dynamic form generation.

![Events Executive View](screenshots/steps/02_centre_head/02_events_executive_view.png)
*Figure 4.2.2: Live captured events management dashboard with proposal sanction controls.*

#### Step 3: Gate-3 Financial Reimbursement Final Settlement
1. Navigate to **Reimbursements** (`/dashboard/reimbursements`).
2. Filter for claims with status `Verified by Finance Head (Gate 2 Passed)`.
3. Inspect claimant's bank account number, IFSC code, and attached GST invoice vouchers.
4. Click **Disburse / Settle Gate 3**.
5. **What Happens:** Claim badge turns green (`Settled`), payment timestamp is stamped into the immutable audit ledger, and the event's actual expenditure figure updates automatically.

![Gate 3 Settlement](screenshots/steps/02_centre_head/03_reimbursements_gate3_settlement.png)
*Figure 4.2.3: Live captured Gate-3 financial reimbursement settlement portal.*

---

### 4.3 Playbook: Tier 3 — Department Heads & Finance Head
*Applicable Designations:* **Head of Finance**, **Head of Events (RTC Campus)**, **Sector & Department Heads**

#### Step 1: Gate-2 Financial & GST Treasury Audit (Head of Finance)
1. Open **Reimbursements** (`/dashboard/reimbursements`). Note: Claims only appear on the Finance Head's board after Gate-1 approval by the Sector Head!
2. Click on the claim row to expand receipt previews and vendor tax details.
3. Verify that invoice items match institutional guidelines.
4. Click **Verify Gate 2**.
5. **What Happens:** Claim advances to Gate 3 for Centre Head final disbursement.

![Gate 2 Financial Audit](screenshots/steps/03_dept_heads/01_reimbursements_gate2_audit.png)
*Figure 4.3.1: Live captured Gate-2 financial audit portal.*

#### Step 2: Assign Department Task Deliverables (Department Heads)
1. Navigate to **Tasks** (`/dashboard/tasks`).
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
1. Navigate to **Events** (`/dashboard/events`) and click **+ Create Event**.
2. Input Title, Dates, Venue, Budget Estimate, and Target Attendance.
3. Assign Committee Leads for Logistics, Hospitality, Social Media, and Stage Management.
4. Click **Submit Proposal**.
5. **What Happens:** Event proposal routes to Centre Head/Advisor queue in `Pending Approval` status.

![Create Event Studio](screenshots/steps/04_core_committee/01_create_event_studio_modal.png)
*Figure 4.4.1: Live captured Event Studio modal.*

#### Step 2: Configure & Issue Passes in Pass Studio
1. Navigate to **Event Passes** (`/dashboard/event-passes`).
2. Click **+ Generate Pass** (or select **Pass Studio**).
3. Select pass category (*VIP Pass*, *Student Delegate*, *Speaker*, *Organizer*).
4. Enter attendee details and click **Issue Pass**.
5. **What Happens:** System generates a signed digital pass with high-entropy QR serial number and delivers it via email with Apple/Google Wallet links.

![Pass Studio Workspace](screenshots/steps/04_core_committee/02_pass_studio_workspace.png)
*Figure 4.4.2: Live captured Event Pass Studio.*

#### Step 3: Operate Gate Turnstile Scanner Kiosk
1. Navigate to **Event Passes** (`/dashboard/event-passes`).
2. Click **Launch Turnstile Scanner**.
3. Allow camera access. Align attendee's QR pass inside the scanning reticle.
4. **What Happens:** Audio chime sounds. Green banner displays attendee name, category, and photo (*"Admitted"*). If already scanned, a red warning displays (*"Already Checked In at [Time]"*).

![Turnstile Scanner Kiosk](screenshots/steps/04_core_committee/03_turnstile_scanner_viewfinder.png)
*Figure 4.4.3: Live captured Turnstile Scanner viewfinder kiosk.*

#### Step 4: Build Public Registration Forms
1. Navigate to **Forms** (`/dashboard/forms`).
2. Click **+ Create New Form**.
3. Drag and drop form fields (*Text Input*, *Dropdown*, *Multiple Choice*, *File Upload*).
4. Click **Publish Form**.
5. **What Happens:** Activates public link (`/forms/[slug]`) and generates QR code for promotional posters.

![Dynamic Form Builder](screenshots/steps/04_core_committee/04_dynamic_form_builder.png)
*Figure 4.4.4: Live captured Dynamic Form Builder canvas.*

#### Step 5: Submit Official Post-Event Report (General Secretary)
1. Navigate to **Event Reports** (`/dashboard/event-reports`).
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
1. Navigate to **Tasks** (`/dashboard/tasks`) and view **My Tasks**.
2. Click **Acknowledge Task** to confirm receipt.
3. Update status dropdown from `Assigned` to `In Progress`.
4. Check off individual subtask items as you finish them.
5. Upload deliverable files and select **Mark Completed**.

![Student Task Checklist](screenshots/steps/05_training_associate/01_student_task_checklist.png)
*Figure 4.5.1: Live captured student task card with acknowledgement and subtask checklist.*

#### Step 2: File Expense Reimbursement Claim
1. Navigate to **Reimbursements** (`/dashboard/reimbursements`).
2. Under **Submit Claim Form**:
   - Select linked Event and Task.
   - Enter Category (e.g. *Printing & Stationary*, *Hardware*), Amount (₹), and Description.
   - Provide Bank Name, Account Number, IFSC Code, and UPI ID.
   - Drag and drop invoice receipts into the **Receipt File Dropzone**.
3. Click **Submit Reimbursement Claim**.
4. **What Happens:** Claim enters `Pending Gate-1 Approval` and notifies your Department Head.

![Claim Submission Form](screenshots/steps/05_training_associate/02_claim_submission_form.png)
*Figure 4.5.2: Live captured reimbursement claim submission form.*

#### Step 3: Manage 3D Digital Keycard Profile
1. Navigate to **Visiting Card** (`/dashboard/visiting-card`).
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

## 5. Troubleshooting & Frequently Asked Questions

#### Q: I made a change on my laptop, but my colleague doesn't see it on their screen.
> **Answer**: The application automatically syncs with the server every **7 seconds**. If you need an instant sync, click on any sidebar link or press `F5` / `Ctrl+R` to force a browser refresh.

#### Q: My account activation link says "Invalid or Expired Token".
> **Answer**: For security, activation tokens expire after 48 hours or after being used once. Contact your administrator or Department Head to click **Resend Activation Link** from the Members Directory.

#### Q: The check-in QR scanner is having trouble scanning a pass.
> **Answer**: 
> 1. Ensure the camera lens is clean and the attendee's phone screen brightness is at maximum.
> 2. If lighting is dim, tap the **Flashlight** button inside the scanner.
> 3. You can also manually type the serial number (e.g. `LEADS-EVT-2026-XXXX`) in the search box below the camera.

#### Q: The receipt photo won't upload to my reimbursement claim.
> **Answer**: Ensure your image file is in JPG, PNG, or PDF format and does not exceed **10 MB**. If your phone takes very high-resolution photos, take a screenshot of the photo and upload that instead.

#### Q: An attendee's Apple Wallet button is not opening.
> **Answer**: Ensure the attendee is opening the link in **Safari** on an iPhone running iOS 14+. Third-party browsers (Chrome/Firefox for iOS) may require tapping "Open in Safari" to install `.pkpass` files into Apple Wallet.

---

*© 2026 LEADS Next Gen Centre, M.S. Ramaiah University of Applied Sciences. All rights reserved.*
