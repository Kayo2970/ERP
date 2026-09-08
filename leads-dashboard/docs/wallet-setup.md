# Digital Visiting Card — Wallet Setup

The Digital Visiting Card feature (sidebar → Visiting Card) works
end-to-end today: profile fields, the public `/card/[slug]` page, QR code,
and "Save Contact" (.vcf) all work with zero extra setup.

## Apple Wallet & Google Wallet

Both are issued through **[WalletWallet](https://walletwallet.dev)** — a
hosted API that signs passes with its own Apple/Google credentials, so this
deployment never needs its own Apple Developer Program certificate or
Google Cloud service account. One API key activates both platforms at
once.

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
- `logoURL`/`iconURL`/`wideLogoURL`/`thumbnailURL` point at
  `/images/leads-short-logo.png` (already hosted by the app) rather than a
  separately uploaded wide-banner/thumbnail asset — swap in real files
  under `public/images/` and update the URLs in `walletwallet-client.ts` if
  a distinct wide-format or thumbnail asset is wanted. These four fields
  are WalletWallet Pro-plan-only; harmless to send on a free-tier key, they
  just get ignored.
- `src/lib/wallet/card-wallet-pass.ts` — caches the issued pass on the
  member's own record (a content hash of their card fields) so repeat
  visits don't re-create an identical pass and burn API quota; a pass is
  only regenerated when the member actually edits their card.
- `src/app/api/card/[slug]/apple-pass/route.ts` and `.../google-pass/route.ts`
  serve the cached (or freshly created) pass.

Known limitation (see the `ponytail:` comment in `card-wallet-pass.ts`):
editing a published card creates a brand-new pass rather than pushing a
live update to phones that already saved the old one, since WalletWallet's
update endpoint doesn't return fresh pass bytes. Anyone who re-adds the
card gets the current version; already-installed passes just don't
auto-refresh. Fine for how this feature is used today — worth revisiting
if that becomes a real problem.

### Third-party data flow — know this before turning it on

Every time a pass is generated, the member's name, phone, email,
designation, and bio are sent to WalletWallet's servers to build the pass.
This is a deliberate trade-off (no certificates, way less setup) — if that
data flow is a concern, the alternative is running your own signing
pipeline with real Apple/Google Developer credentials instead. Ask before
re-introducing that if it's ever needed; the self-hosted approach was
removed in favor of WalletWallet to avoid the Apple Developer Program
enrollment ($99/yr + account setup) and Google Cloud service account setup.

## Samsung Wallet

Samsung Wallet card issuance requires enrollment in Samsung's **Partner
Portal**, which is invite/business-verification-gated — unlike Apple's
$99/yr self-serve program or Google's open signup, there is no publicly
documented self-serve path for an individual developer to issue arbitrary
business cards today, and WalletWallet doesn't cover Samsung either.

Until Samsung grants partner access, Samsung/Android users get the
universal fallback everyone gets: **Save Contact** (.vcf — Android
natively imports it into Contacts) and the **QR code**. This is a fully
practical substitute in the meantime.

Once partner access is granted: `src/lib/wallet/samsung-config.ts` and
`src/app/api/card/[slug]/samsung-pass/route.ts` are stubbed as drop-in
points — replace `isSamsungWalletConfigured()`'s `return false` with a
real check, and implement the card-issuing logic once Samsung's actual API
spec is available.
