## 2026-09-01 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Found a pervasive pattern where key icon-only navigation elements (e.g., notification bell, sidebar collapse toggles) lacked `aria-label` attributes and explicit `focus-visible` states, significantly hindering screen reader and keyboard accessibility.
**Action:** When working on navigation or shell components in the future, proactively check for and add `aria-label` and `focus:outline-none focus-visible:ring-2 focus-visible:ring-accent` classes to any icon-only interactive elements.
