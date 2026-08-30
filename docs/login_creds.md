# LEADS Dashboard — Super User Setup

A fresh deploy no longer ships with any pre-seeded accounts or a shared
default password. On first install, `npm run setup`
(`scripts/setup-superuser.js`) runs once, interactively, and prompts for the
Super User's name, email, and a password you choose on the spot — that
becomes the *only* account on the instance. It's wired into
`docs/vps-setup.sh` right before the production build, and is a no-op if
`data/members.json` already has accounts in it (safe to leave in place
across redeploys).

See `docs/vps-deployment-guide.html`, Step 2, for the full walkthrough.

Every other account (Centre Head, Events Heads, Faculty Advisors, etc.) is
added afterward from **Members Directory** by that Super User, each with
their own real password set via their account-activation email — never a
shared or hardcoded one.
