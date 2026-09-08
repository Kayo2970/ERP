import jwt from 'jsonwebtoken';
import type { GoogleWalletCredentials } from './google-config';
import type { WalletCardMember } from './apple-pkpass';

const GENERIC_CLASS_SUFFIX = 'leads_visiting_card';

function classId(creds: GoogleWalletCredentials): string {
  return `${creds.issuerId}.${GENERIC_CLASS_SUFFIX}`;
}

function objectId(creds: GoogleWalletCredentials, member: WalletCardMember): string {
  // Google requires objectId to be issuerId.<alphanumeric/underscore/hyphen> —
  // the slug is already URL-safe from slugifyName() in members/[id]/route.ts.
  return `${creds.issuerId}.${member.cardSlug}`;
}

function buildGenericClass(creds: GoogleWalletCredentials) {
  return {
    id: classId(creds),
    issuerName: 'LEADS Next Gen Centre',
    reviewStatus: 'UNDER_REVIEW',
  };
}

function buildGenericObject(creds: GoogleWalletCredentials, member: WalletCardMember, cardUrl: string) {
  const textModules: any[] = [];
  if (member.phone) textModules.push({ id: 'phone', header: 'Phone', body: member.phone });
  if (member.email) textModules.push({ id: 'email', header: 'Email', body: member.email });
  if (member.bio) textModules.push({ id: 'bio', header: 'About', body: member.bio });
  if (member.socials?.linkedin) textModules.push({ id: 'linkedin', header: 'LinkedIn', body: member.socials.linkedin });
  if (member.socials?.instagram) textModules.push({ id: 'instagram', header: 'Instagram', body: member.socials.instagram });
  if (member.socials?.twitter) textModules.push({ id: 'twitter', header: 'Twitter / X', body: member.socials.twitter });
  if (member.socials?.website) textModules.push({ id: 'website', header: 'Website', body: member.socials.website });

  return {
    id: objectId(creds, member),
    classId: classId(creds),
    state: 'ACTIVE',
    // ERP dark-navy brand — see src/app/globals.css.
    hexBackgroundColor: '#0B1B2E',
    cardTitle: { defaultValue: { language: 'en-US', value: 'LEADS Next Gen Centre' } },
    header: { defaultValue: { language: 'en-US', value: member.name } },
    subheader: member.designation
      ? { defaultValue: { language: 'en-US', value: member.designation } }
      : undefined,
    textModulesData: textModules,
    barcode: { type: 'QR_CODE', value: cardUrl, alternateText: 'Scan to view' },
  };
}

/**
 * Builds the signed "Save to Google Wallet" JWT/link per Google's spec
 * (https://developers.google.com/wallet/generic/web). The JWT itself only
 * needs a valid RS256 keypair to construct — real activation additionally
 * requires the class/object referenced here to be creatable via the Wallet
 * REST API under a real Issuer ID (see docs/wallet-setup.md), which is what
 * isGoogleWalletConfigured() gates.
 */
export function buildGoogleWalletSaveUrl(creds: GoogleWalletCredentials, member: WalletCardMember, cardUrl: string): string {
  const payload = {
    iss: creds.serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [],
    payload: {
      genericClasses: [buildGenericClass(creds)],
      genericObjects: [buildGenericObject(creds, member, cardUrl)],
    },
  };

  const token = jwt.sign(payload, creds.privateKey, { algorithm: 'RS256' });
  return `https://pay.google.com/gp/v/save/${token}`;
}
