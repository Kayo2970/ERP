## 2026-09-11 - Add aria-labels and focus states to dashboard-shell icon buttons
**Learning:** Icon-only buttons often lack accessible names for screen readers and miss explicit focus states which makes keyboard navigation unintuitive.
**Action:** When creating icon-only buttons, always ensure an `aria-label` describes the action, and standard focus classes (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`) are applied.
