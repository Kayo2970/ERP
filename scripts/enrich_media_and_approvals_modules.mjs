import fs from 'fs';

const manualMdPath = 'docs/USER_MANUAL.md';
let content = fs.readFileSync(manualMdPath, 'utf8');

// =========================================================================
// SECTION 3.10: DESIGN PORTAL & OCR
// =========================================================================
const designsMd = `### 3.10 Design Portal, Proofreading & OCR Spellcheck
The **Design Portal** (\`/dashboard/designs\`) manages promotional posters, banners, and digital creatives before public distribution.

![Design Portal Overview](screenshots/steps/08_design_portal/01_designs_gallery_view.png)
*Figure 3.10.1: Design portal asset gallery showing proofreading status badges and linked event tags.*

---

#### Step 1: Uploading a Creative Asset
1. Click **+ Upload Creative** or **Add Design**.
2. Select target event and format (e.g. \`Instagram Post (1080x1080)\`, \`Auditorium Standee (3x6 ft)\`).
3. Upload image (PNG, JPG, WebP).
4. **Automated AI OCR Spellcheck:** The integrated Tesseract.js engine scans all text lines within 3 seconds, cross-referencing dates, guest names, and institutional terminology against the English dictionary to detect typos automatically.
5. **Faculty Sign-off:** Designated media faculty inspect the asset and click **Approve for Publishing**.

![Upload Creative Modal](screenshots/steps/08_design_portal/02_upload_creative_modal.png)
*Figure 3.10.2: Creative upload modal with dimensions picker and automated spellcheck analysis.*
`;

content = content.replace(
  /### 3\.10 Design Portal, Proofreading & OCR Spellcheck[\s\S]*?(?=### 3\.11 Dynamic Form Builder)/,
  designsMd + '\n'
);

// =========================================================================
// SECTION 3.11: DYNAMIC FORMS
// =========================================================================
const formsMd = `### 3.11 Dynamic Form Builder & Public Submissions
The **Forms** module (\`/dashboard/forms\`) enables rapid creation of public event RSVPs, delegate registrations, and feedback surveys without external third-party subscriptions.

![Forms Management View](screenshots/steps/09_dynamic_forms/01_forms_management_view.png)
*Figure 3.11.1: Dynamic forms management table displaying live submission tallies and QR download tools.*

---

#### Step 1: Building a Dynamic Form
1. Click **+ Create Form**.
2. In the Form Designer canvas, add fields from the drag-and-drop palette:
   - Text inputs, email validators, phone formatters, dropdown selectors, checkboxes, rating stars, and file uploads.
3. Configure **Public URL Slug** (e.g. \`/forms/tech-conclave-rsvp\`).
4. Generate instant high-resolution **QR Code** for event poster printing.
5. Real-time responses stream directly into \`submissions.json\` with instant export to Word (.docx) and CSV.

![Form Builder Canvas](screenshots/steps/09_dynamic_forms/02_form_builder_canvas.png)
*Figure 3.11.2: Form builder canvas showing custom fields, validation rules, and live preview.*
`;

content = content.replace(
  /### 3\.11 Dynamic Form Builder & Public Submissions[\s\S]*?(?=### 3\.12 Digital Visiting Cards)/,
  formsMd + '\n'
);

// =========================================================================
// SECTION 3.12: DIGITAL VISITING CARDS
// =========================================================================
const cardsMd = `### 3.12 Digital Visiting Cards & 3D Interactive Keycard
Every verified institutional member receives a personalized digital card accessible at \`/card/[slug]\`.

![3D Keycard Preview](screenshots/steps/10_visiting_card/01_visiting_card_3d_keycard.png)
*Figure 3.12.1: Interactive 3D WebGL keycard badge with holographic sheen and one-tap vCard address book download.*

- **Interactive 3D WebGL Badge:** Responds fluidly to mouse movement and smartphone gyroscopes.
- **One-Tap Contact Save:** Tap **Save Contact (vCard)** to immediately save name, designation, phone, email, and social profiles directly into smartphone address books.
- **Mobile Wallet Integration:** Downloadable pass for Apple Wallet and Google Wallet.
`;

content = content.replace(
  /### 3\.12 Digital Visiting Cards & 3D Interactive Keycard[\s\S]*?(?=### 3\.13 Guest Directory)/,
  cardsMd + '\n'
);

// =========================================================================
// SECTION 3.13: GUEST DIRECTORY
// =========================================================================
const guestsMd = `### 3.13 Guest Directory & VIP Invitation Engine
The **Guest Directory** (\`/dashboard/guest-directory\`) manages institutional records for visiting dignitaries, keynote speakers, and industry delegates.

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
`;

content = content.replace(
  /### 3\.13 Guest Directory & VIP Invitation Engine[\s\S]*?(?=### 3\.14 Announcements)/,
  guestsMd + '\n'
);

// =========================================================================
// SECTION 3.17: APPROVALS INBOX
// =========================================================================
const approvalsMd = `### 3.17 Unified Approvals Inbox
The **Approvals** module (\`/dashboard/approvals\`) is the centralized decision-making inbox for Tier 2 and Tier 3 heads.

![Unified Approvals Inbox](screenshots/steps/12_approvals_inbox/01_unified_approvals_queue.png)
*Figure 3.17.1: Centralized approvals queue consolidating proposals, requisitions, expense claims, and creatives.*

- **Tabbed Categories:** Switch seamlessly between Event Proposals, Procurement Requisitions, Financial Claims, and Design Creatives.
- **Inline Actions:** Decision-makers can inspect item details and click **Approve** or **Reject** with mandatory feedback notes without navigating between disparate modules.
`;

content = content.replace(
  /### 3\.17 Unified Approvals Inbox[\s\S]*?(?=### 3\.18 Members Directory)/,
  approvalsMd + '\n'
);

fs.writeFileSync(manualMdPath, content, 'utf8');
console.log('✅ Successfully enriched Sections 3.10, 3.11, 3.12, 3.13, and 3.17 in docs/USER_MANUAL.md!');
