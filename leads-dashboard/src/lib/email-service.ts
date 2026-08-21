import nodemailer, { Transporter } from 'nodemailer';
import { mutateCollection, readCollection } from './server-db';

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  category: 'AUTH_OTP' | 'ANNOUNCEMENT' | 'TASK_ASSIGNMENT' | 'EVENT_ROSTER' | 'SYSTEM' | 'DIRECT_MESSAGE' | 'GUEST_INVITE';
  status: 'SENT' | 'FAILED';
  sentAt: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  category: 'AUTH_OTP' | 'ANNOUNCEMENT' | 'TASK_ASSIGNMENT' | 'EVENT_ROSTER' | 'SYSTEM' | 'DIRECT_MESSAGE' | 'GUEST_INVITE';
}

export interface EmailSettings {
  id: string; // 'default'
  provider: 'gmail' | 'outlook' | 'custom' | 'local_postfix';
  smtpHost: string;
  smtpPort: number;
  secure: boolean;
  authUser: string;
  authPass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
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

async function buildTransporter(): Promise<{ transporter: Transporter; settings: EmailSettings }> {
  const settings = await getEmailSettings();
  
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
    pool: true,
    maxConnections: 3,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  return { transporter: t, settings };
}

/**
 * Master Institutional Email Wrapper Template
 * Wraps email content in a high-end dark slate email container with:
 * 1. Institution Header Banner & High-Res LEADS Logo
 * 2. Styled Content Card
 * 3. Standardized Institutional Footer with Copyright & IP Ownership Notice for Kayomarz Pavri
 */
export function wrapInMasterEmailTemplate(options: {
  headerTitle?: string;
  headerSubtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  bodyContentHtml: string;
}): string {
  const logoUrl = 'https://leadsnextgencentre.online/images/leads-short-logo.png';
  const bgImageUrl = 'https://leadsnextgencentre.online/images/light-bg.jpg';

  const badgeHtml = options.badgeText
    ? `<span style="font-size: 11px; font-weight: 700; color: ${options.badgeColor || '#0369a1'}; background: #e0f2fe; border: 1px solid #bae6fd; padding: 4px 10px; border-radius: 8px; display: inline-block; margin-bottom: 14px;">${options.badgeText}</span>`
    : '';

  return `
    <div style="background: #f1f5f9 url('${bgImageUrl}') center / cover no-repeat; padding: 32px 16px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #1e293b; width: 100%; box-sizing: border-box;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
        
        <!-- Header Banner with Logo -->
        <div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 28px 32px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <div style="display: inline-block; width: 56px; height: 56px; margin-bottom: 10px; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 14px; padding: 8px; vertical-align: middle;">
            <img src="${logoUrl}" alt="LEADS Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <h2 style="color: #0284c7; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">LEADS Next Gen Centre</h2>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; font-weight: 500;">Ramaiah University of Applied Sciences &middot; Operations Portal</p>
        </div>

        <!-- Main Content Area -->
        <div style="padding: 32px 28px;">
          ${badgeHtml}
          ${options.headerTitle ? `<h3 style="margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: ${options.headerSubtitle ? '4px' : '20px'};">${options.headerTitle}</h3>` : ''}
          ${options.headerSubtitle ? `<p style="color: #64748b; font-size: 13px; margin-top: 0; margin-bottom: 20px; font-weight: 400;">${options.headerSubtitle}</p>` : ''}

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #334155; font-size: 14px; line-height: 1.65;">
            ${options.bodyContentHtml}
          </div>
        </div>

        <!-- Standardized Institutional Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 28px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
          <p style="margin: 0 0 6px 0; color: #475569; font-weight: 600;">© 2026 LEADS Next Gen Centre &middot; MSRUAS Internal Operations Portal</p>
          <p style="margin: 0 0 8px 0; color: #94a3b8;">This is an automated operational notification. Authorised recipient access only.</p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 10px; color: #64748b; font-size: 10px;">
            All Intellectual Property, Copyrights & Development Licensing belong exclusively to <strong style="color: #0284c7;">Kayomarz Pavri</strong>.
          </div>
        </div>

      </div>
    </div>
  `;
}

export async function testEmailConnection(testRecipient: string): Promise<{ success: boolean; message: string }> {
  try {
    const { transporter: t, settings } = await buildTransporter();
    await t.verify();
    
    const from = `${settings.fromName || 'LEADS Next Gen Centre'} <${settings.fromEmail || 'leads@msruas.ac.in'}>`;
    
    const bodyHtml = wrapInMasterEmailTemplate({
      headerTitle: `SMTP Mail Server & Client Connection Verified`,
      headerSubtitle: `Diagnostic Health Check Successful`,
      badgeText: `✅ SMTP Operational`,
      badgeColor: `#15803d`,
      bodyContentHtml: `
        <p style="margin-top: 0; color: #0f172a; font-weight: 600;">Your LEADS Dashboard email client and SMTP server settings are operational.</p>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 10px; margin: 16px 0; font-size: 12px;">
          <p style="margin: 0 0 6px 0; color: #64748b;"><strong>Service Provider:</strong> <span style="color: #0284c7; font-weight: 700;">${settings.provider.toUpperCase()}</span></p>
          <p style="margin: 0 0 6px 0; color: #64748b;"><strong>SMTP Host & Port:</strong> <span style="color: #0f172a; font-family: monospace;">${settings.smtpHost}:${settings.smtpPort}</span></p>
          <p style="margin: 0; color: #64748b;"><strong>Sender Name:</strong> <span style="color: #0f172a;">${settings.fromName}</span></p>
        </div>
        <p style="color: #64748b; font-size: 11px; margin-bottom: 0;">Diagnostic executed at ${new Date().toLocaleString()}</p>
      `
    });

    await t.sendMail({
      from,
      to: testRecipient,
      subject: `[LEADS Test Email] SMTP Client Verification`,
      text: `Hello,\n\nThis is a test notification verifying that your LEADS Dashboard email client and SMTP server (${settings.provider.toUpperCase()} @ ${settings.smtpHost}) are properly configured and operational.\n\nSent at: ${new Date().toLocaleString()}`,
      html: bodyHtml,
    });

    return { success: true, message: `SMTP verification successful! Test message delivered to ${testRecipient}.` };
  } catch (err: any) {
    console.error('[email-service] SMTP Connection Test Failed:', err);
    return { success: false, message: err?.message || 'Failed to establish connection to SMTP server.' };
  }
}

export async function dispatchEmail(payload: SendEmailPayload): Promise<EmailLog> {
  const defaultFormattedHtml = wrapInMasterEmailTemplate({
    headerTitle: payload.subject,
    badgeText: payload.category ? `📩 ${payload.category}` : undefined,
    bodyContentHtml: `<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #1e293b;">${payload.bodyText}</div>`
  });

  const bodyHtml = payload.bodyHtml || defaultFormattedHtml;
  let status: 'SENT' | 'FAILED' = 'FAILED';

  try {
    const { transporter: t, settings } = await buildTransporter();
    const from = `${settings.fromName || 'LEADS Next Gen Centre'} <${settings.fromEmail || 'leads@msruas.ac.in'}>`;
    await t.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.bodyText,
      html: bodyHtml,
      replyTo: settings.replyTo || settings.fromEmail,
    });
    status = 'SENT';
  } catch (err) {
    console.error(`[email-service] Failed to send to ${payload.to}:`, err instanceof Error ? err.message : err);
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
