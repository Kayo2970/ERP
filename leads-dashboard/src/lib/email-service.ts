import nodemailer, { Transporter } from 'nodemailer';
import path from 'path';
import { mutateCollection, readCollection } from './server-db';
import { DirectSendTransport } from './direct-smtp-transport';

// Referenced as cid:leads-logo in wrapInMasterEmailTemplate — attach this
// to every sendMail() call so the header logo is embedded, not fetched
// from a remote URL.
const EMAIL_LOGO_ATTACHMENT = {
  filename: 'leads-logo.png',
  path: path.join(process.cwd(), 'src', 'assets', 'leads-email-logo.png'),
  cid: 'leads-logo',
};

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  category: 'AUTH_OTP' | 'ANNOUNCEMENT' | 'TASK_ASSIGNMENT' | 'EVENT_ROSTER' | 'SYSTEM' | 'DIRECT_MESSAGE' | 'GUEST_INVITE' | 'ACCOUNT_ACTIVATION';
  status: 'SENT' | 'FAILED';
  sentAt: string;
  // Diagnostics for "shows SENT but never arrives" — a resolved sendMail()
  // only means the SMTP server ACCEPTED the message for delivery, not that
  // it reached the recipient's inbox. These surface what the server
  // actually said, without needing shell/log access on the VPS.
  errorMessage?: string;       // set when the send itself threw (auth failure, connection refused, timeout, ...)
  smtpResponse?: string;       // the raw final SMTP response line, e.g. "250 2.0.0 OK ..."
  rejectedRecipients?: string[]; // addresses the SMTP server explicitly rejected, if any
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  badgeText?: string;
  badgeColor?: string;
  category: 'AUTH_OTP' | 'ANNOUNCEMENT' | 'TASK_ASSIGNMENT' | 'EVENT_ROSTER' | 'SYSTEM' | 'DIRECT_MESSAGE' | 'GUEST_INVITE' | 'ACCOUNT_ACTIVATION';
}

export interface EmailSettings {
  id: string; // 'default'
  // 'direct_send' is the built-in outbound engine (src/lib/direct-smtp-transport.ts):
  // the app itself resolves each recipient's MX records and delivers straight
  // to their mail server, with no relay/API in between — the other four
  // options stay available and unaffected for whoever prefers a relay.
  provider: 'gmail' | 'outlook' | 'custom' | 'local_postfix' | 'direct_send';
  smtpHost: string;
  smtpPort: number;
  secure: boolean;
  authUser: string;
  authPass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  // HELO/EHLO identity used only by the 'direct_send' provider — must match
  // the reverse-DNS (PTR) record on the VPS's outbound IP, or most receiving
  // mail servers will reject the connection outright.
  heloHostname?: string;
  // Optional DKIM signing (nodemailer signs the message itself, independent
  // of whatever the relay/Postfix does) — the single most effective lever
  // this app can pull for automated mail landing in spam, since a relay
  // often doesn't sign on behalf of a domain that isn't its own. Requires
  // the matching public key published as a DNS TXT record at
  // `<dkimSelector>._domainkey.<dkimDomain>` — signing is skipped entirely
  // unless all three fields are set, so this is a no-op until configured.
  dkimDomain?: string;
  dkimSelector?: string;
  dkimPrivateKey?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  id: 'default',
  provider: 'gmail',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  secure: false,
  authUser: process.env.ANNOUNCEMENT_FROM_EMAIL || 'leads@msruas.ac.in',
  authPass: process.env.SMTP_PASS || '',
  fromName: process.env.ANNOUNCEMENT_FROM_NAME || 'LEADS Next Gen Centre',
  fromEmail: process.env.ANNOUNCEMENT_FROM_EMAIL || 'leads@msruas.ac.in',
  replyTo: process.env.ANNOUNCEMENT_FROM_EMAIL || 'leads@msruas.ac.in',
  updatedAt: new Date().toISOString(),
};

export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const list = await readCollection<EmailSettings>('emailSettings');
    if (list && list.length > 0) {
      return { ...DEFAULT_EMAIL_SETTINGS, ...list[0] };
    }
  } catch (e) {
    console.error('[email-service] Failed to read emailSettings collection:', e);
  }
  return DEFAULT_EMAIL_SETTINGS;
}

export async function updateEmailSettings(settings: Partial<EmailSettings>, actorName: string): Promise<EmailSettings> {
  const current = await getEmailSettings();
  const updated: EmailSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: actorName,
  };

  await mutateCollection<EmailSettings>('emailSettings', () => [updated]);
  return updated;
}

async function buildTransporter(): Promise<{ transporter: Transporter; settings: EmailSettings; effectiveHost: string; effectivePort: number }> {
  const settings = await getEmailSettings();

  const dkim = settings.dkimDomain && settings.dkimSelector && settings.dkimPrivateKey
    ? {
        domainName: settings.dkimDomain.trim(),
        keySelector: settings.dkimSelector.trim(),
        privateKey: settings.dkimPrivateKey,
      }
    : undefined;

  if (settings.provider === 'direct_send') {
    // Built-in engine: no host/port/auth to configure — it connects
    // straight to each recipient's own mail server. DKIM signing (above)
    // still applies here exactly as it does for every other provider,
    // since Nodemailer signs the message before handing it to any
    // transport, not just its own SMTPTransport.
    const heloHostname = (settings.heloHostname || settings.dkimDomain || 'localhost').trim();
    const t = nodemailer.createTransport(
      new DirectSendTransport({ heloHostname }),
      dkim ? { dkim } : undefined,
    );
    return { transporter: t, settings, effectiveHost: `direct-send via ${heloHostname}`, effectivePort: 25 };
  }

  let host = settings.smtpHost;
  let port = settings.smtpPort;
  let secure = settings.secure;
  let auth: { user: string; pass: string } | undefined = undefined;

  const cleanedPass = (settings.authPass || '').replace(/\s+/g, '');

  if (settings.provider === 'gmail') {
    host = 'smtp.gmail.com';
    port = settings.smtpPort || 587;
    if (settings.authUser && settings.authPass) {
      auth = { user: settings.authUser.trim(), pass: cleanedPass };
    }
  } else if (settings.provider === 'outlook') {
    host = 'smtp.office365.com';
    port = settings.smtpPort || 587;
    if (settings.authUser && settings.authPass) {
      auth = { user: settings.authUser.trim(), pass: cleanedPass };
    }
  } else if (settings.provider === 'custom') {
    host = settings.smtpHost || 'smtp.gmail.com';
    port = settings.smtpPort || 587;
    if (settings.authUser && settings.authPass) {
      auth = { user: settings.authUser.trim(), pass: cleanedPass };
    }
  } else if (settings.provider === 'local_postfix') {
    host = process.env.SMTP_HOST || 'localhost';
    port = Number(process.env.SMTP_PORT) || 25;
    secure = false;
    auth = undefined;
  }

  const t = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
    dkim,
    pool: true,
    maxConnections: 3,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  return { transporter: t, settings, effectiveHost: host, effectivePort: port };
}

/**
 * Master Institutional Email Wrapper Template
 * Clean, standard corporate email layout (inspired by PayPal/Stripe transactional notices) with:
 * 1. Minimalist Institution Header Banner & LEADS Logo
 * 2. Styled Content Area (plain white container, high contrast, clean typography)
 * 3. Optional Badge Header Tag (can be omitted completely for clean direct emails & invites)
 * 4. Standardized Institutional Footer with Copyright & IP Licensing Notice for Kayomarz Pavri
 */
export function wrapInMasterEmailTemplate(options: {
  headerTitle?: string;
  headerSubtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  bodyContentHtml: string;
}): string {
  // Embedded as a cid: inline attachment (see EMAIL_LOGO_ATTACHMENT below)
  // rather than fetched from a remote URL — a remote-hosted image is one
  // more "this is bulk mail" content signal, and it's one small fix that's
  // literally common to every single automated email this app sends.
  const logoUrl = 'cid:leads-logo';

  const isOmittedBadge = !options.badgeText || ['NONE', 'None', 'NO_BADGE', 'none'].includes(options.badgeText.trim());

  const badgeHtml = isOmittedBadge
    ? ''
    : `<span style="font-size: 11px; font-weight: 700; color: ${options.badgeColor || '#0369a1'}; background: #e0f2fe; border: 1px solid #bae6fd; padding: 4px 10px; border-radius: 6px; display: inline-block; margin-bottom: 16px;">${options.badgeText}</span>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="background-color: #f4f4f7; margin: 0; padding: 28px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; width: 100%; box-sizing: border-box;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        
        <!-- Header Banner with Logo -->
        <div style="background-color: #ffffff; padding: 24px 32px; border-bottom: 1px solid #f1f5f9; text-align: center;">
          <div style="display: inline-block; width: 48px; height: 48px; margin-bottom: 8px; vertical-align: middle;">
            <img src="${logoUrl}" alt="LEADS Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <h2 style="color: #0f172a; margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.01em;">LEADS Next Gen Centre</h2>
          <p style="color: #64748b; font-size: 12px; margin: 3px 0 0 0; font-weight: 500;">Ramaiah University of Applied Sciences &middot; Operations Portal</p>
        </div>

        <!-- Main Content Area -->
        <div style="padding: 28px 32px;">
          ${badgeHtml}
          ${options.headerTitle ? `<h3 style="margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: ${options.headerSubtitle ? '4px' : '18px'};">${options.headerTitle}</h3>` : ''}
          ${options.headerSubtitle ? `<p style="color: #64748b; font-size: 13px; margin-top: 0; margin-bottom: 18px; font-weight: 400;">${options.headerSubtitle}</p>` : ''}

          <div style="color: #334155; font-size: 14px; line-height: 1.65;">
            ${options.bodyContentHtml}
          </div>
        </div>

        <!-- Standardized Institutional Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
          <p style="margin: 0 0 6px 0; color: #475569; font-weight: 600;">© 2026 LEADS Next Gen Centre &middot; MSRUAS Internal Operations Portal</p>
          <p style="margin: 0 0 6px 0; color: #94a3b8;">This is an operational notification. Authorised recipient access only.</p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; color: #64748b; font-size: 10px;">
            All Intellectual Property, Copyrights & Licensing belong exclusively to <strong style="color: #0284c7;">Kayomarz Pavri</strong>.
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
}

export async function testEmailConnection(testRecipient: string): Promise<{ success: boolean; message: string }> {
  try {
    const { transporter: t, settings, effectiveHost, effectivePort } = await buildTransporter();
    await t.verify();

    const from = `${settings.fromName || 'LEADS Next Gen Centre'} <${settings.fromEmail || 'leads@msruas.ac.in'}>`;

    const bodyHtml = wrapInMasterEmailTemplate({
      headerTitle: `SMTP Connection Verified`,
      headerSubtitle: `Diagnostic Health Check Successful`,
      badgeText: `✅ SMTP Operational`,
      badgeColor: `#15803d`,
      bodyContentHtml: `
        <p style="margin-top: 0; color: #0f172a; font-weight: 600;">Your LEADS Dashboard email client and SMTP server settings are operational.</p>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 10px; margin: 16px 0; font-size: 12px;">
          <p style="margin: 0 0 6px 0; color: #64748b;"><strong>Service Provider:</strong> <span style="color: #0284c7; font-weight: 700;">${settings.provider.toUpperCase()}</span></p>
          <p style="margin: 0 0 6px 0; color: #64748b;"><strong>SMTP Host & Port:</strong> <span style="color: #0f172a; font-family: monospace;">${effectiveHost}:${effectivePort}</span></p>
          <p style="margin: 0; color: #64748b;"><strong>Sender Name:</strong> <span style="color: #0f172a;">${settings.fromName}</span></p>
        </div>
        <p style="color: #64748b; font-size: 11px; margin-bottom: 0;">Diagnostic executed at ${new Date().toLocaleString()}</p>
      `
    });

    const info = await t.sendMail({
      from,
      to: testRecipient,
      subject: `[LEADS Test Email] SMTP Client Verification`,
      text: `Hello,\n\nThis is a test notification verifying that your LEADS Dashboard email client and SMTP server (${settings.provider.toUpperCase()} @ ${effectiveHost}) are properly configured and operational.\n\nSent at: ${new Date().toLocaleString()}`,
      html: bodyHtml,
      attachments: [EMAIL_LOGO_ATTACHMENT],
      // No custom/default X-Mailer — a value like "Nodemailer" or a
      // custom app name is one of the more recognizable "this is a mail
      // engine, not a person" signals to spam filters.
      xMailer: false,
    });

    // A resolved sendMail() only means the server ACCEPTED the message for
    // delivery, not that it will actually reach the inbox — surface the raw
    // SMTP response (and any outright-rejected recipients) rather than a
    // blind "success," since that gap is exactly what makes "sent but never
    // received" so hard to diagnose without shell access to the mail server.
    if (info.rejected && info.rejected.length > 0) {
      return {
        success: false,
        message: `SMTP server rejected the recipient (${info.rejected.join(', ')}). Server said: ${info.response || 'no response text'}`,
      };
    }

    return {
      success: true,
      message: `SMTP accepted the message for ${testRecipient} (server said: "${info.response || 'OK'}"). This confirms the SMTP handoff worked — if it still doesn't arrive, check spam/junk, and check that "${settings.fromEmail}" is allowed to send as this domain (SPF/DKIM) rather than the app's connection to the mail server, since that part is already confirmed working.`,
    };
  } catch (err: any) {
    console.error('[email-service] SMTP Connection Test Failed:', err);
    return { success: false, message: err?.message || 'Failed to establish connection to SMTP server.' };
  }
}

export async function dispatchEmail(payload: SendEmailPayload): Promise<EmailLog> {
  let badgeTextToUse: string | undefined = payload.badgeText;
  if (!badgeTextToUse) {
    if (payload.category === 'ANNOUNCEMENT') badgeTextToUse = '📢 Official Announcement';
    else if (payload.category === 'TASK_ASSIGNMENT') badgeTextToUse = '📌 Action Required';
    else if (payload.category === 'EVENT_ROSTER') badgeTextToUse = '🎉 Event Roster';
    else if (payload.category === 'ACCOUNT_ACTIVATION') badgeTextToUse = '👋 Welcome';
    else badgeTextToUse = undefined; // Omit badge completely for direct messages and guest invites
  }

  const defaultFormattedHtml = wrapInMasterEmailTemplate({
    headerTitle: payload.subject,
    badgeText: badgeTextToUse,
    badgeColor: payload.badgeColor,
    bodyContentHtml: `<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #1e293b;">${payload.bodyText}</div>`
  });

  const bodyHtml = payload.bodyHtml || defaultFormattedHtml;
  let status: 'SENT' | 'FAILED' = 'FAILED';
  let errorMessage: string | undefined;
  let smtpResponse: string | undefined;
  let rejectedRecipients: string[] | undefined;

  try {
    const { transporter: t, settings } = await buildTransporter();
    const from = `${settings.fromName || 'LEADS Next Gen Centre'} <${settings.fromEmail || 'leads@msruas.ac.in'}>`;

    const domain = (settings.fromEmail || 'leadsnextgencentre.online').split('@')[1] || 'leadsnextgencentre.online';
    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 9)}@${domain}>`;

    // A List-Unsubscribe header is a real, well-recognized deliverability
    // signal to Gmail/Yahoo-class spam filters — but only makes sense for
    // the genuinely bulk/broadcast categories, not a 1:1 OTP or welcome
    // email, where offering an "unsubscribe" would just be confusing.
    const isBulkCategory = payload.category === 'ANNOUNCEMENT' || payload.category === 'EVENT_ROSTER' || payload.category === 'GUEST_INVITE';
    const unsubscribeAddress = settings.replyTo || settings.fromEmail;
    const headers: Record<string, string> = {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Message-ID': messageId,
    };
    if (isBulkCategory && unsubscribeAddress) {
      headers['List-Unsubscribe'] = `<mailto:${unsubscribeAddress}?subject=Unsubscribe>`;
    }

    const info = await t.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.bodyText,
      html: bodyHtml,
      replyTo: settings.replyTo || settings.fromEmail,
      attachments: [EMAIL_LOGO_ATTACHMENT],
      // No custom/default X-Mailer — a recognizable "sent by a mail
      // engine, not a person" signal that doesn't help deliverability.
      xMailer: false,
      headers,
    });

    smtpResponse = info.response;
    // sendMail() resolving only means the SMTP server ACCEPTED the message
    // for delivery — not that every recipient will actually get it. A
    // server that rejects some/all recipients outright (bad address,
    // relay-denied, etc.) reports that in `rejected` without necessarily
    // throwing, so treat a fully-rejected send as FAILED rather than SENT.
    if (info.rejected && info.rejected.length > 0) {
      const rejectedList = info.rejected.map(String);
      rejectedRecipients = rejectedList;
      if (!info.accepted || info.accepted.length === 0) {
        status = 'FAILED';
        errorMessage = `SMTP server rejected all recipients: ${rejectedList.join(', ')}`;
      } else {
        status = 'SENT';
      }
    } else {
      status = 'SENT';
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[email-service] Failed to send to ${payload.to}:`, errorMessage);
  }

  const newEmail: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: payload.to,
    subject: payload.subject,
    bodyText: payload.bodyText,
    bodyHtml,
    category: payload.category,
    status,
    sentAt: new Date().toISOString(),
    errorMessage,
    smtpResponse,
    rejectedRecipients,
  };

  try {
    await mutateCollection<EmailLog>('emails', (current) => [newEmail, ...(current || [])]);
  } catch (err) {
    console.error('[email-service] Failed to persist email to database:', err);
  }

  return newEmail;
}

/**
 * Template Generator: Password Reset OTP
 */
export function generateOtpEmailTemplate(name: string, otp: string): { subject: string; bodyText: string; bodyHtml: string } {
  const subject = `Your LEADS Dashboard Password Reset Code: ${otp}`;
  const bodyText = `Hello ${name},\n\n` +
    `You recently requested a password reset for your LEADS Next Gen Dashboard account.\n\n` +
    `Your One-Time Password (OTP) code is: ${otp}\n\n` +
    `This code is strictly valid for 5 minutes. If you did not request a password reset, please ignore this email or notify your system administrator immediately.\n\n` +
    `Regards,\nLEADS Next Gen Centre, MSRUAS`;

  const bodyHtml = wrapInMasterEmailTemplate({
    headerTitle: `Password Reset Authorization`,
    headerSubtitle: `Security Verification Code`,
    badgeText: `🔒 5-Minute OTP Code`,
    badgeColor: `#be123c`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #0f172a; font-size: 14px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">You requested a password reset for your LEADS account. Use the 6-digit verification code below to authorize your password update:</p>

      <div style="text-align: center; margin: 28px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; background: #f0f9ff; border: 1px dashed #7dd3fc; padding: 14px 28px; border-radius: 12px; display: inline-block;">
          ${otp}
        </span>
        <p style="color: #e11d48; font-size: 12px; margin-top: 12px; font-weight: 700;">⏱️ Valid for 5 minutes only</p>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 0;">If you did not request this, you can safely ignore this message. Your password will remain unchanged.</p>
    `
  });

  return { subject, bodyText, bodyHtml };
}

/**
 * Template Generator: Welcome / Account Activation.
 * Sent once, right when a member is first added to the Directory — the
 * account exists (in the members collection) but has no passwordHash yet,
 * so this link is the only way in until the recipient sets their own
 * password. The link carries a long-lived opaque token (see
 * src/lib/account-activation.ts), not a short OTP, since it's meant to be
 * clicked from an inbox rather than typed in.
 */
export function generateWelcomeActivationEmailTemplate(name: string, activationLink: string): { subject: string; bodyText: string; bodyHtml: string } {
  const subject = `Welcome to LEADS Next Gen Centre — Set Up Your Account`;
  const bodyText = `Hello ${name},\n\n` +
    `Welcome to LEADS Next Gen Centre! An account has been created for you on the LEADS Operations Dashboard.\n\n` +
    `Set your password and activate your account here:\n${activationLink}\n\n` +
    `This link is valid for 7 days. Once activated, sign in with this email address and the password you choose.\n\n` +
    `If you weren't expecting this, you can safely ignore this email.\n\n` +
    `Regards,\nLEADS Next Gen Centre, MSRUAS`;

  const bodyHtml = wrapInMasterEmailTemplate({
    headerTitle: `Welcome, ${name}!`,
    headerSubtitle: `Your LEADS Operations Dashboard account is ready`,
    badgeText: `👋 Welcome`,
    badgeColor: `#15803d`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #0f172a; font-size: 14px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">You've been added to the LEADS Next Gen Centre roster. Set up your password below to access the Operations Dashboard:</p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${activationLink}" style="display: inline-block; background: #0284c7; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
          Set Up My Account
        </a>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 12px;">⏱️ This link is valid for 7 days</p>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 0;">If the button doesn't work, copy and paste this link into your browser:<br /><span style="word-break: break-all; color: #0284c7;">${activationLink}</span></p>
    `
  });

  return { subject, bodyText, bodyHtml };
}

/**
 * Template Generator: Email Change Confirmation OTP.
 * Sent to the OLD address as a security check, never the new one — the
 * recipient must already control the account's current inbox to approve
 * a change away from it.
 */
export function generateEmailChangeOtpTemplate(name: string, otp: string, newEmail: string): { subject: string; bodyText: string; bodyHtml: string } {
  const subject = `Your LEADS Dashboard Email Change Code: ${otp}`;
  const bodyText = `Hello ${name},\n\n` +
    `Someone requested to change the login email on your LEADS Next Gen Dashboard account from this address to: ${newEmail}\n\n` +
    `Your One-Time Password (OTP) code is: ${otp}\n\n` +
    `This code is strictly valid for 5 minutes. If you did not request this change, do NOT share this code — ignore this email or notify your system administrator immediately, and your login email will remain unchanged.\n\n` +
    `Regards,\nLEADS Next Gen Centre, MSRUAS`;

  const bodyHtml = wrapInMasterEmailTemplate({
    headerTitle: `Email Change Authorization`,
    headerSubtitle: `Security Verification Code`,
    badgeText: `🔒 5-Minute OTP Code`,
    badgeColor: `#be123c`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #0f172a; font-size: 14px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">A request was made to change the login email on your LEADS account to <strong style="color: #0f172a;">${newEmail}</strong>. Use the 6-digit verification code below to authorize this change:</p>

      <div style="text-align: center; margin: 28px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; background: #f0f9ff; border: 1px dashed #7dd3fc; padding: 14px 28px; border-radius: 12px; display: inline-block;">
          ${otp}
        </span>
        <p style="color: #e11d48; font-size: 12px; margin-top: 12px; font-weight: 700;">⏱️ Valid for 5 minutes only</p>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 0;">If you did not request this, do not share this code with anyone — ignore this message and your login email will remain unchanged.</p>
    `
  });

  return { subject, bodyText, bodyHtml };
}

/**
 * Template Generator: Announcement Alert
 */
export function generateAnnouncementEmailTemplate(memberName: string, title: string, content: string, author: string): { subject: string; bodyText: string; bodyHtml: string } {
  const subject = `[LEADS Announcement] ${title}`;
  const bodyText = `Hello ${memberName},\n\nA new announcement has been published on the LEADS Dashboard by ${author}:\n\n` +
    `Title: ${title}\n\n` +
    `Details: ${content}\n\n` +
    `Log in to the dashboard to view full details.\n\n` +
    `Regards,\nLEADS Next Gen Centre`;

  const bodyHtml = wrapInMasterEmailTemplate({
    headerTitle: title,
    headerSubtitle: `Published by ${author}`,
    badgeText: `📢 Official Announcement`,
    badgeColor: `#0369a1`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #334155;">Hello <strong>${memberName}</strong>,</p>
      <p style="color: #0f172a; white-space: pre-wrap; font-size: 14px; line-height: 1.7;">${content}</p>
      <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0; text-align: center;">
        <a href="https://leadsnextgencentre.online/dashboard/announcements" style="background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 12px; display: inline-block;">View in Dashboard &rarr;</a>
      </div>
    `
  });

  return { subject, bodyText, bodyHtml };
}

/**
 * Template Generator: Task Assignment Alert
 */
export function generateTaskEmailTemplate(memberName: string, taskTitle: string, eventName: string, dueDate: string, creatorName: string): { subject: string; bodyText: string; bodyHtml: string } {
  const subject = `[LEADS Task Assignment] New Task: ${taskTitle}`;
  const bodyText = `Hello ${memberName},\n\nYou have been assigned a new task on LEADS Dashboard.\n\n` +
    `Task: ${taskTitle}\n` +
    `Event/Context: ${eventName || 'LEADS Operations'}\n` +
    `Due Date: ${dueDate}\n` +
    `Assigned By: ${creatorName || 'Committee Admin'}\n\n` +
    `Please log in to your dashboard to view details and mark progress.`;

  const bodyHtml = wrapInMasterEmailTemplate({
    headerTitle: taskTitle,
    headerSubtitle: `Assigned by ${creatorName || 'Committee Admin'}`,
    badgeText: `📌 Action Required: New Task`,
    badgeColor: `#854d0e`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #334155;">Hello <strong>${memberName}</strong>,</p>
      <p style="color: #334155; font-size: 14px;">You have been assigned a new deliverable on the LEADS Dashboard:</p>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 120px;">Context:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${eventName || 'LEADS Operations'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Due Date:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #dc2626;">${dueDate}</td>
        </tr>
      </table>

      <div style="margin-top: 20px; text-align: center;">
        <a href="https://leadsnextgencentre.online/dashboard/tasks" style="background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 12px; display: inline-block;">Open Tasks Desk &rarr;</a>
      </div>
    `
  });

  return { subject, bodyText, bodyHtml };
}

/**
 * Template Generator: Event Committee Roster Assignment
 */
export function generateEventRosterEmailTemplate(memberName: string, eventTitle: string, committeeName: string, startDate: string): { subject: string; bodyText: string; bodyHtml: string } {
  const subject = `[LEADS Event Update] You've been assigned to ${eventTitle}`;
  const bodyText = `Hello ${memberName},\n\nYou have been added to the "${committeeName}" committee for the upcoming event "${eventTitle}".\n\n` +
    `Event Start Date: ${startDate}\n\n` +
    `Check the LEADS Dashboard for your team roster and responsibilities.`;

  const bodyHtml = wrapInMasterEmailTemplate({
    headerTitle: eventTitle,
    headerSubtitle: `Committee Assignment`,
    badgeText: `🎉 Event Committee Roster`,
    badgeColor: `#6b21a8`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #334155;">Hello <strong>${memberName}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">You have been officially added to the <strong>${committeeName}</strong> committee for <strong>${eventTitle}</strong>.</p>
      
      <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 13px; color: #0f172a;">📅 <strong>Event Start Date:</strong> ${startDate}</p>
      </div>

      <div style="margin-top: 20px; text-align: center;">
        <a href="https://leadsnextgencentre.online/dashboard/events" style="background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 12px; display: inline-block;">View Event Details &rarr;</a>
      </div>
    `
  });

  return { subject, bodyText, bodyHtml };
}
