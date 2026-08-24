/**
 * account-activation.ts — server-only. Generates the "set up your account"
 * token sent when a member is first added to the Directory, and the
 * shared lookup used to consume it. Mirrors the passwordResets pattern in
 * forgot-password/reset-password (one dedicated collection, purge-then-
 * insert per email, expiry-checked on consume) — a long opaque token
 * instead of a short OTP, since this one is clicked from an email rather
 * than typed in, and given a much longer window (7 days, not 5 minutes)
 * since there's no urgency/security pressure like a password reset.
 */
import { randomBytes } from 'crypto';
import { mutateCollection } from './server-db';
import { dispatchEmail, generateWelcomeActivationEmailTemplate } from './email-service';

const ACTIVATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// No APP_BASE_URL env var exists in this project yet (email CTAs elsewhere
// hardcode the same production domain) — matching that existing convention
// rather than introducing a new one for just this feature.
const APP_BASE_URL = 'https://leadsnextgencentre.online';

export interface ActivationToken {
  id: string;
  memberId: string;
  email: string;
  token: string;
  expiresAt: number;
  createdAt: string;
}

/**
 * Creates a fresh activation token for a member (purging any prior one for
 * the same member first, so only the most recently sent link works) and
 * emails them the "set up your account" link. Never throws on email
 * failure — the caller (member creation / resend routes) should already
 * be wrapping this in its own try/catch so a mail hiccup never blocks the
 * member record itself from being created.
 */
export async function createActivationTokenAndSendEmail(
  member: { id: string; name: string; email: string },
  originUrl?: string
): Promise<{ token: string; activationLink: string }> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + ACTIVATION_WINDOW_MS;

  const activationToken: ActivationToken = {
    id: `activate-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    memberId: member.id,
    email: member.email.toLowerCase(),
    token,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  await mutateCollection('accountActivations', (current) => {
    const filtered = (current || []).filter((t: any) => t.memberId !== member.id);
    return [activationToken, ...filtered];
  });

  const baseUrl = originUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://leads.pavris.in';
  const activationLink = `${baseUrl.replace(/\/+$/, '')}/activate?token=${token}`;
  const template = generateWelcomeActivationEmailTemplate(member.name, activationLink);

  await dispatchEmail({
    to: member.email,
    subject: template.subject,
    bodyText: template.bodyText,
    bodyHtml: template.bodyHtml,
    category: 'ACCOUNT_ACTIVATION',
  });

  return { token, activationLink };
}
