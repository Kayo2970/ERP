import crypto from 'crypto';
import forge from 'node-forge';
import AdmZip from 'adm-zip';
import type { AppleWalletCredentials } from './apple-config';

export interface WalletCardMember {
  cardSlug: string;
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
  bio?: string;
  photoUrl?: string; // absolute URL, only used for the strip image
  socials?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

// ERP dark-mode brand — see src/app/globals.css: deep navy background,
// #2E75B6 accent, white foreground. Reused here so a pass looks like it
// belongs to the same product as the dashboard.
const BRAND_BACKGROUND = 'rgb(11,27,46)'; // #0B1B2E
const BRAND_LABEL = 'rgb(46,117,182)'; // #2E75B6
const BRAND_FOREGROUND = 'rgb(255,255,255)';

function buildPassJson(member: WalletCardMember, creds: AppleWalletCredentials, cardUrl: string) {
  const backFields = [] as any[];
  if (member.phone) backFields.push({ key: 'phone', label: 'Phone', value: member.phone });
  if (member.email) backFields.push({ key: 'email', label: 'Email', value: member.email });
  if (member.socials?.linkedin) backFields.push({ key: 'linkedin', label: 'LinkedIn', value: member.socials.linkedin });
  if (member.socials?.instagram) backFields.push({ key: 'instagram', label: 'Instagram', value: member.socials.instagram });
  if (member.socials?.twitter) backFields.push({ key: 'twitter', label: 'Twitter / X', value: member.socials.twitter });
  if (member.socials?.website) backFields.push({ key: 'website', label: 'Website', value: member.socials.website });
  if (member.bio) backFields.push({ key: 'bio', label: 'About', value: member.bio });
  backFields.push({ key: 'link', label: 'Full Card', value: cardUrl });

  return {
    formatVersion: 1,
    passTypeIdentifier: creds.passTypeIdentifier,
    teamIdentifier: creds.teamIdentifier,
    organizationName: 'LEADS Next Gen Centre',
    serialNumber: member.cardSlug,
    description: `${member.name} — Digital Visiting Card`,
    backgroundColor: BRAND_BACKGROUND,
    foregroundColor: BRAND_FOREGROUND,
    labelColor: BRAND_LABEL,
    generic: {
      primaryFields: [{ key: 'name', label: 'Name', value: member.name }],
      secondaryFields: member.designation ? [{ key: 'designation', label: 'Designation', value: member.designation }] : [],
      backFields,
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: cardUrl,
        messageEncoding: 'iso-8859-1',
      },
    ],
  };
}

/**
 * Icon/logo assets in the ERP's dark-navy branding, generated on the fly so
 * no static asset needs shipping per-member. icon.png is what shows in
 * notifications/lock screen; logo.png is the small mark in the pass header.
 */
async function buildPassImages(): Promise<Record<string, Buffer>> {
  const { createCanvas } = await import('@napi-rs/canvas');

  function drawMark(size: number): Buffer {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0B1B2E';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#2E75B6';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(size * 0.32)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', size / 2, size / 2 + size * 0.02);
    return canvas.toBuffer('image/png');
  }

  return {
    'icon.png': drawMark(29),
    'icon@2x.png': drawMark(58),
    'icon@3x.png': drawMark(87),
    'logo.png': drawMark(160),
    'logo@2x.png': drawMark(320),
  };
}

function sha1(buf: Buffer): string {
  return crypto.createHash('sha1').update(buf).digest('hex');
}

/**
 * Computes manifest.json (SHA-1 per file — Apple's spec still mandates
 * SHA-1 for pkpass manifests regardless of its weakness elsewhere) and a
 * detached PKCS#7 signature over it, using the Pass Type ID cert (.p12) and
 * Apple's WWDR intermediate cert.
 */
function signManifest(files: Record<string, Buffer>, creds: AppleWalletCredentials): { manifest: Buffer; signature: Buffer } {
  const manifestObj: Record<string, string> = {};
  for (const [name, content] of Object.entries(files)) {
    manifestObj[name] = sha1(content);
  }
  const manifest = Buffer.from(JSON.stringify(manifestObj));

  const p12Der = forge.util.decode64(creds.p12Base64);
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, creds.p12Password);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!certBag?.cert || !keyBag?.key) {
    throw new Error('Apple Wallet .p12 certificate is missing a certificate or private key.');
  }

  const wwdrPem = Buffer.from(creds.wwdrPemBase64, 'base64').toString('utf8');
  const wwdrCert = forge.pki.certificateFromPem(wwdrPem);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifest.toString('binary'));
  p7.addCertificate(certBag.cert);
  p7.addCertificate(wwdrCert);
  p7.addSigner({
    key: keyBag.key,
    certificate: certBag.cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() as unknown as string },
    ],
  });
  // Detached signature — the manifest content is shipped separately as its
  // own file in the .pkpass bundle, not embedded in the signature itself.
  p7.sign({ detached: true });

  const signatureDer = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const signature = Buffer.from(signatureDer, 'binary');

  return { manifest, signature };
}

/** Zips pass.json + manifest.json + signature + image assets into a .pkpass buffer. */
function assemblePkpass(files: Record<string, Buffer>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, content);
  }
  return zip.toBuffer();
}

export async function generateApplePkpass(member: WalletCardMember, creds: AppleWalletCredentials, cardUrl: string): Promise<Buffer> {
  const passJson = Buffer.from(JSON.stringify(buildPassJson(member, creds, cardUrl)));
  const images = await buildPassImages();

  const bundleFiles: Record<string, Buffer> = { 'pass.json': passJson, ...images };
  const { manifest, signature } = signManifest(bundleFiles, creds);

  return assemblePkpass({ ...bundleFiles, 'manifest.json': manifest, signature });
}
