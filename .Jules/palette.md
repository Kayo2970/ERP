## 2026-09-05 - Added Missing ARIA Labels to Dashboard Buttons
**Learning:** Found multiple icon-only buttons in the main `dashboard-shell.tsx` component lacking screen reader context (missing `aria-label`) and clear keyboard navigation visibility (missing focus rings).
**Action:** Always verify icon-only buttons have an explicit `aria-label` for screen readers and `focus-visible:ring-2` for keyboard users, as tooltips alone (the `title` attribute) are insufficient for screen readers.
