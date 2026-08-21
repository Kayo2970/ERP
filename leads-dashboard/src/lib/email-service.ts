import nodemailer, { Transporter } from 'nodemailer';
import { mutateCollection, readCollection } from './server-db';

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  category: 'AUTH_OTP' | 'ANNOUNCEMENT' | 'TASK_ASSIGNMENT' | 'EVENT_ROSTER' | 'SYSTEM' | 'DIRECT_MESSAGE';
  status: 'SENT' | 'FAILED';
  sentAt: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  category: 'AUTH_OTP' | 'ANNOUNCEMENT' | 'TASK_ASSIGNMENT' | 'EVENT_ROSTER' | 'SYSTEM' | 'DIRECT_MESSAGE';
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

  const badgeHtml = options.badgeText
    ? `<span style="font-size: 11px; font-weight: 700; color: ${options.badgeColor || '#38bdf8'}; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 10px; border-radius: 8px; display: inline-block; margin-bottom: 14px;">${options.badgeText}</span>`
    : '';

  return `
    <div style="background-color: #090d16; padding: 32px 16px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #f8fafc; width: 100%; box-sizing: border-box;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
        
        <!-- Header Banner with Logo -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; border-bottom: 1px solid #1e293b; text-align: center;">
          <div style="display: inline-block; width: 56px; height: 56px; margin-bottom: 10px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; padding: 8px; vertical-align: middle;">
            <img src="${logoUrl}" alt="LEADS Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <h2 style="color: #38bdf8; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">LEADS Next Gen Centre</h2>
          <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0; font-weight: 500;">Ramaiah University of Applied Sciences &middot; Operations Portal</p>
        </div>

        <!-- Main Content Area -->
        <div style="padding: 32px 28px;">
          ${badgeHtml}
          ${options.headerTitle ? `<h3 style="margin-top: 0; color: #f8fafc; font-size: 18px; font-weight: 700; margin-bottom: ${options.headerSubtitle ? '4px' : '20px'};">${options.headerTitle}</h3>` : ''}
          ${options.headerSubtitle ? `<p style="color: #94a3b8; font-size: 13px; margin-top: 0; margin-bottom: 20px; font-weight: 400;">${options.headerSubtitle}</p>` : ''}

          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid #334155; border-radius: 14px; padding: 24px; color: #cbd5e1; font-size: 14px; line-height: 1.65;">
            ${options.bodyContentHtml}
          </div>
        </div>

        <!-- Standardized Institutional Footer -->
        <div style="background-color: #0b1120; border-top: 1px solid #1e293b; padding: 24px 28px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
          <p style="margin: 0 0 6px 0; color: #94a3b8; font-weight: 600;">© 2026 LEADS Next Gen Centre &middot; MSRUAS Internal Operations Portal</p>
          <p style="margin: 0 0 8px 0; color: #64748b;">This is an automated operational notification. Authorised recipient access only.</p>
          <div style="border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 10px; color: #475569; font-size: 10px;">
            All Intellectual Property, Copyrights & Development Licensing belong exclusively to <strong style="color: #38bdf8;">Kayomarz Pavri</strong>.
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
      badgeColor: `#22c55e`,
      bodyContentHtml: `
        <p style="margin-top: 0; color: #f8fafc; font-weight: 600;">Your LEADS Dashboard email client and SMTP server settings are operational.</p>
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; padding: 14px 18px; border-radius: 10px; margin: 16px 0; font-size: 12px;">
          <p style="margin: 0 0 6px 0; color: #94a3b8;"><strong>Service Provider:</strong> <span style="color: #38bdf8; font-weight: 700;">${settings.provider.toUpperCase()}</span></p>
          <p style="margin: 0 0 6px 0; color: #94a3b8;"><strong>SMTP Host & Port:</strong> <span style="color: #f8fafc; font-family: monospace;">${settings.smtpHost}:${settings.smtpPort}</span></p>
          <p style="margin: 0; color: #94a3b8;"><strong>Sender Name:</strong> <span style="color: #f8fafc;">${settings.fromName}</span></p>
        </div>
        <p style="color: #94a3b8; font-size: 11px; margin-bottom: 0;">Diagnostic executed at ${new Date().toLocaleString()}</p>
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
    bodyContentHtml: `<div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #f8fafc;">${payload.bodyText}</div>`
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
    badgeColor: `#f43f5e`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #f8fafc; font-size: 14px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">You requested a password reset for your LEADS account. Use the 6-digit verification code below to authorize your password update:</p>

      <div style="text-align: center; margin: 28px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px dashed rgba(56, 189, 248, 0.4); padding: 14px 28px; border-radius: 12px; display: inline-block;">
          ${otp}
        </span>
        <p style="color: #f43f5e; font-size: 12px; margin-top: 12px; font-weight: 700;">⏱️ Valid for 5 minutes only</p>
      </div>

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 0;">If you did not request this, you can safely ignore this message. Your password will remain unchanged.</p>
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
    badgeColor: `#38bdf8`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #cbd5e1;">Hello <strong>${memberName}</strong>,</p>
      <p style="color: #f8fafc; white-space: pre-wrap; font-size: 14px; line-height: 1.7;">${content}</p>
      <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #334155; text-align: center;">
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
    badgeColor: `#eab308`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #cbd5e1;">Hello <strong>${memberName}</strong>,</p>
      <p style="color: #cbd5e1; font-size: 14px;">You have been assigned a new deliverable on the LEADS Dashboard:</p>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; width: 120px;">Context:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #f8fafc;">${eventName || 'LEADS Operations'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Due Date:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #f43f5e;">${dueDate}</td>
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
    badgeColor: `#a855f7`,
    bodyContentHtml: `
      <p style="margin-top: 0; color: #cbd5e1;">Hello <strong>${memberName}</strong>,</p>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">You have been officially added to the <strong>${committeeName}</strong> committee for <strong>${eventTitle}</strong>.</p>
      
      <div style="background: rgba(56, 189, 248, 0.1); border-left: 4px solid #38bdf8; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 13px; color: #f8fafc;">📅 <strong>Event Start Date:</strong> ${startDate}</p>
      </div>

      <div style="margin-top: 20px; text-align: center;">
        <a href="https://leadsnextgencentre.online/dashboard/events" style="background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 12px; display: inline-block;">View Event Details &rarr;</a>
      </div>
    `
  });

  return { subject, bodyText, bodyHtml };
}
