## 2026-08-31 - [XSS Fix in Email Preview]
**Vulnerability:** Unsanitized HTML string (`previewEmail.bodyHtml`) passed directly to `dangerouslySetInnerHTML` in Settings page email preview.
**Learning:** Next.js Server-Side Rendering requires safe DOM manipulation libraries when dealing with HTML parsing. The system dynamically generates email bodies with rich HTML, making this a high-risk area for stored/reflected XSS if email logs ever contain unvalidated inputs.
**Prevention:** Use `isomorphic-dompurify` rather than standard `dompurify` to avoid Server-Side Rendering crashes when sanitizing HTML strings before injecting them into the DOM.
