# Digital Visiting Card — Wallet Setup

The Digital Visiting Card feature (Settings → Digital Visiting Card) works
end-to-end today: profile fields, the public `/card/[slug]` page, QR code,
and "Save Contact" (.vcf) all work with zero extra setup.

The "Add to Apple Wallet" and "Add to Google Wallet" buttons are fully
built and wired up in code, but stay hidden on every card until real
credentials are supplied — see below for exactly what to obtain and where
to paste it in (Settings → Digital Visiting Card → Wallet Setup, Super
User only). Nothing needs to be redeployed once credentials are added; the
buttons appear on the next page load.

## Apple Wallet

1. Enroll in the **Apple Developer Program** ($99/yr) — required even for
   internal/personal use of Pass Type certificates:
   https://developer.apple.com/programs/enroll/
2. In the [Certificates, Identifiers & Profiles portal](https://developer.apple.com/account/resources/identifiers/list/passTypeId),
   register a new **Pass Type ID** (e.g. `pass.online.leadsnextgencentre.card`).
3. Generate a **Pass Type ID Certificate** for that identifier (the portal
   walks through generating a CSR via Keychain Access or `openssl`),
   download the `.cer`, then export it together with its private key as a
   **`.p12`** file (Keychain Access → export, set a password you'll remember).
4. Download Apple's current **WWDR (Worldwide Developer Relations)
   Intermediate Certificate** — publicly available, not account-specific:
   https://www.apple.com/certificateauthority/
5. Note your **Team ID** (Apple Developer account → Membership page).
6. In Settings → Digital Visiting Card → Wallet Setup, upload the `.p12`
   file + its password, upload the WWDR certificate, and fill in the Team
   ID and Pass Type Identifier string.

Alternatively, these can be set as environment variables instead of pasted
into Settings (env vars win if both are present):

```
APPLE_PASS_P12_BASE64=<base64 of the .p12 file>
APPLE_PASS_P12_PASSWORD=<the .p12's password>
APPLE_WWDR_PEM_BASE64=<base64 of the WWDR cert, PEM format>
APPLE_TEAM_ID=<Team ID>
APPLE_PASS_TYPE_ID=<e.g. pass.online.leadsnextgencentre.card>
```

## Google Wallet

1. Create or select a **Google Cloud project**, enable the **Google Wallet API**.
2. Enroll in the [Google Wallet Business Console](https://pay.google.com/business/console/)
   and obtain an **Issuer ID**.
3. Create a **Service Account** in Cloud IAM, generate a JSON key, and grant
   that service account access in the Wallet Business Console
   (Issuer → API access → add the service account email).
4. In Settings → Digital Visiting Card → Wallet Setup, upload the service
   account's JSON key file and fill in the Issuer ID.

Equivalent environment variables:

```
GOOGLE_WALLET_ISSUER_ID=<Issuer ID>
GOOGLE_WALLET_SA_JSON_BASE64=<base64 of the full service account JSON key file>
```

## Samsung Wallet

Samsung Wallet card issuance requires enrollment in Samsung's **Partner
Portal**, which is invite/business-verification-gated — unlike Apple's
self-serve $99/yr program or Google's open Cloud Console signup, there is
no publicly documented self-serve path for an individual developer to
issue arbitrary business cards today.

Until Samsung grants partner access, Samsung/Android users get the
universal fallback everyone gets: **Save Contact** (.vcf — Android
natively imports it into Contacts) and the **QR code**. This is a fully
practical substitute in the meantime.

Once partner access is granted: `src/lib/wallet/samsung-config.ts` and
`src/app/api/card/[slug]/samsung-pass/route.ts` are stubbed as drop-in
points — replace `isSamsungWalletConfigured()`'s `return false` with the
same env-var-or-Settings pattern used by `apple-config.ts`/
`google-config.ts`, and implement the card-template/link-signing logic
(analogous to `apple-pkpass.ts`/`google-pass.ts`) once Samsung's actual
API spec is available.
