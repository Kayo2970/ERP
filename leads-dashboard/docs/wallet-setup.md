# Digital Visiting Card — Wallet Setup

The Digital Visiting Card feature (sidebar → Visiting Card) works
end-to-end today: profile fields, the public `/card/[slug]` page, QR code,
and "Save Contact" (.vcf) all work with zero extra setup.

## Apple Wallet & Google Wallet

Both are issued through **[WalletWallet](https://walletwallet.dev)** — a
hosted API that signs passes with its own Apple/Google credentials, so this
deployment never needs its own Apple Developer Program certificate or
Google Cloud service account. One API key activates both platforms at
once. (There is no Samsung Wallet integration — Samsung's card-issuance
program is invite/business-verification-gated with no public self-serve
API, and WalletWallet doesn't cover it either. Samsung/Android users get
the QR code and Save Contact, both of which already work everywhere.)

### Setup

1. Sign up at https://walletwallet.dev and generate an API key
   (`ww_live_...`). The free tier covers 1,000 passes/month.
2. In the ERP: **sidebar → Visiting Card → Wallet Setup** (visible
   to a Tier-1 Super User only), paste the key in, click **Save**.

That's it — "Add to Apple Wallet" and "Add to Google Wallet" appear on
every published card immediately, no redeploy needed.

Equivalent environment variable, if you'd rather set it at the server
level instead of through Settings (wins over the Settings value if both
are present):

```
WALLETWALLET_API_KEY=ww_live_...
```

### How it works

- `src/lib/wallet/walletwallet-client.ts` — calls WalletWallet's
  `POST /api/passes`, which returns a `.pkpass` file and a Google Wallet
  save link in one response. The exact field layout (colors, org contact
  details on the back, name as the big value with designation as the label
  above it) matches the design finalized in the WalletWallet dashboard's
  pass builder — see the constants (`ORG_NAME`, `ORG_EMAIL`, `ORG_PHONE`,
  `ORG_ADDRESS`, `COLOR_PRESET`, `CUSTOM_COLOR`) at the top of that file to
  tweak it. **Double-check `ORG_EMAIL` (`LEADS.NGC.@MSRUAS.AC.IN` — note the
  stray dot before `@`) and `ORG_PHONE` (`+91 804536666` — only 9 digits) is
  correct before relying on them; both were carried over verbatim from the
  original pass design.**
- `logoURL`/`iconURL`/`wideLogoURL`/`thumbnailURL` are built from a
  hardcoded `SITE_ORIGIN` constant (`https://leadsnextgencentre.online`) at
  the top of `walletwallet-client.ts` + `/images/leads-short-logo.png` —
  see **Logo assets** and **If the production domain ever changes** below.
  These four fields are WalletWallet Pro-plan-only; harmless to send on a
  free-tier key, they just get ignored.
- `src/lib/wallet/card-wallet-pass.ts` — caches the issued pass on the
  member's own record (a content hash of their card fields) so repeat
  visits don't re-create an identical pass and burn API quota; a pass is
  only regenerated when the member actually edits their card.
- `src/app/api/card/[slug]/apple-pass/route.ts` and `.../google-pass/route.ts`
  serve the cached pass straight off disk — a real WalletWallet API call
  only happens on a genuine cache miss (first publish, or an edit that
  changed name/phone/email/LinkedIn/designation).

### Passes are generated at save time, not on first tap

`src/app/api/card/[slug]/wallet-pass/route.ts` is called automatically by
the Visiting Card page the moment a member saves/publishes their card
(self-service — a member can only trigger their own, a Super User can
trigger anyone's). By the time a visitor actually opens the card and taps
"Add to Apple Wallet," the `.pkpass` is already sitting cached on disk —
the apple-pass/google-pass routes just replay that file back, so scanning
the QR code or tapping the buttons never itself burns an API call.

### Designation

The card's designation mirrors the member's `role` field from the Members
Directory by default — a Super User (Tier 1) can instead type a free-text
override in the Visiting Card page's Designation field
(`Member.cardDesignationOverride`), enforced server-side in
`members/[id]/route.ts` (stripped from anyone else's request) via
`effectiveCardDesignation()` in `src/lib/member-guard.ts`, which every
designation-reading spot (the public card API, the .vcf export, and the
wallet pass) goes through.

### Per-member rate limit

Each non-Super-User member is limited to **2 real WalletWallet API calls
per rolling 15-day window** (a cache hit — unchanged card content — never
counts against this, only an actual regeneration does). Super Users
(Tier 1) are exempt. Enforced in `checkWalletPassRateLimit()` in
`card-wallet-pass.ts`, backed by `Member.cardPassGenerations` (an array of
ISO timestamps, pruned to the current window on every write — never
client-writable, stripped server-side in `members/[id]/route.ts`).
Hitting the limit returns **HTTP 429** with a `retryAt` timestamp; the
Visiting Card page surfaces this as a message after Save rather than
failing the save itself. To change the limit, edit
`RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX_GENERATIONS` at the top of
`card-wallet-pass.ts`.

Known limitation (see the `ponytail:` comment in `card-wallet-pass.ts`):
editing a published card creates a brand-new pass rather than pushing a
live update to phones that already saved the old one, since WalletWallet's
update endpoint doesn't return fresh pass bytes. Anyone who re-adds the
card gets the current version; already-installed passes just don't
auto-refresh. Fine for how this feature is used today — worth revisiting
if that becomes a real problem.

#### Logo assets

All four logo fields currently point at the same square `leads-short-logo.png`
as a placeholder — there's a proper wide-format banner (with the "Centre
for Leadership Empowering..." tagline and MSRUAS byline) and a
higher-resolution square mark that should replace it, but they need to be
uploaded as actual files (not pasted inline) before they can be hosted
safely. Once you have them:

1. Save the wide banner to `public/images/leads-wide-logo.png` and the
   square mark to `public/images/leads-logo-square.png` (or reuse
   `leads-short-logo.png` if it's the same artwork).
2. In `src/lib/wallet/walletwallet-client.ts`, point `wideLogoURL` at the
   wide banner and `logoURL`/`iconURL`/`thumbnailURL` at the square mark.
3. Run `npx tsc --noEmit` and `npm run build`, then commit and push to
   `main` — the VPS picks it up on its next `git pull`.

#### If the production domain ever changes

`SITE_ORIGIN` in `walletwallet-client.ts` is a hardcoded constant rather
than derived from the request, so the wallet pass's logo URLs are always
stable. If the site's domain ever changes from
`https://leadsnextgencentre.online`:

1. Update `SITE_ORIGIN` in `src/lib/wallet/walletwallet-client.ts` to the
   new domain.
2. Point the new domain's DNS at the VPS and update whatever's issuing its
   TLS certificate (the logo URLs must be reachable over HTTPS or
   Apple/Google Wallet will reject the pass).
3. If any other env vars reference the old domain (e.g. `NEXT_PUBLIC_APP_URL`/`APP_URL` — see `src/lib/app-url.ts`), update those too.
4. `npx tsc --noEmit` && `npm run build`, commit, push to `main`, redeploy.

Cards already published under the old domain keep working — `cardUrl` (the
QR code target and vCard link) is built per-request from the actual
incoming domain via `getAppBaseUrl()`, not from this constant, so only the
logo image URLs need the manual update above.

### Third-party data flow — know this before turning it on

Every time a pass is generated, the member's name, phone, email,
designation, and LinkedIn are sent to WalletWallet's servers to build the pass.
This is a deliberate trade-off (no certificates, way less setup) — if that
data flow is a concern, the alternative is running your own signing
pipeline with real Apple/Google Developer credentials instead. Ask before
re-introducing that if it's ever needed; the self-hosted approach was
removed in favor of WalletWallet to avoid the Apple Developer Program
enrollment ($99/yr + account setup) and Google Cloud service account setup.
