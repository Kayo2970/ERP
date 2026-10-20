## 2024-05-31 - Icon Button Accessibility

**Learning:** Next.js and Lucide React icons alone do not inherently provide keyboard accessibility or screen reader text for icon-only buttons unless explicitly wrapped with attributes and states.
**Action:** Always ensure that any button containing only an icon has an explicit `aria-label` and visual focus states (e.g., `focus-visible:ring-2 focus-visible:ring-accent focus:outline-none`) applied.
