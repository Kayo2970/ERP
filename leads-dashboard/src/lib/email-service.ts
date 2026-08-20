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

export async function testEmailConnection(testRecipient: string): Promise<{ success: boolean; message: string }> {
  try {
    const { transporter: t, settings } = await buildTransporter();
    await t.verify();
    
    const from = `${settings.fromName || 'LEADS Next Gen Centre'} <${settings.fromEmail || 'leads@msruas.ac.in'}>`;
    await t.sendMail({
      from,
      to: testRecipient,
      subject: `[LEADS Test Email] SMTP Client Verification`,
      text: `Hello,\n\nThis is a test notification verifying that your LEADS Dashboard email client and SMTP server (${settings.provider.toUpperCase()} @ ${settings.smtpHost}) are properly configured and operational.\n\nSent at: ${new Date().toLocaleString()}`,
      html: `<div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
        <h3 style="color: #38bdf8; margin-top: 0;">✅ SMTP Connection & Email Client Verified</h3>
        <p style="color: #cbd5e1;">Your LEADS Dashboard email server settings are operational.</p>
        <p style="font-size: 12px; color: #94a3b8;"><strong>Provider:</strong> ${settings.provider.toUpperCase()} | <strong>Host:</strong> ${settings.smtpHost}:${settings.smtpPort}</p>
        <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">Timestamp: ${new Date().toLocaleString()}</p>
      </div>`,
    });

    return { success: true, message: `SMTP verification successful! Test message delivered to ${testRecipient}.` };
  } catch (err: any) {
    console.error('[email-service] SMTP Connection Test Failed:', err);
    return { success: false, message: err?.message || 'Failed to establish connection to SMTP server.' };
  }
}

export async function dispatchEmail(payload: SendEmailPayload): Promise<EmailLog> {
  const bodyHtml = payload.bodyHtml || `<p style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">${payload.bodyText.replace(/\n/g, '<br/>')}</p>`;
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

  const bodyHtml = `
    <div style="max-width: 560px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 32px; color: #f8fafc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700; tracking-tight: -0.02em;">LEADS Next Gen Dashboard</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Ramaiah University of Applied Sciences</p>
      </div>

      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; color: #f8fafc; font-size: 16px;">Password Reset Request</h3>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">You requested a password reset for your LEADS account. Use the 6-digit verification code below to authorize your password update:</p>

        <div style="text-align: center; margin: 28px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; background: #0284c71a; border: 1px dashed #38bdf866; padding: 12px 24px; border-radius: 10px; display: inline-block;">
            ${otp}
          </span>
          <p style="color: #f43f5e; font-size: 12px; margin-top: 10px; font-weight: 600;">⏱️ Valid for 5 minutes only</p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 0;">If you did not request this, you can safely ignore this message. Your password will remain unchanged.</p>
      </div>

      <div style="text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px;">
        <p>© 2026 LEADS Next Gen Centre · MSRUAS Internal Operations Portal</p>
      </div>
    </div>
  `;

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

  const bodyHtml = `
    <div style="max-width: 560px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 32px; color: #f8fafc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">LEADS Announcement Alert</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Published by ${author}</p>
      </div>

      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; color: #f8fafc; font-size: 18px; border-bottom: 1px solid #334155; padding-bottom: 12px;">${title}</h3>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${content}</p>
      </div>

      <div style="text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px;">
        <p>© 2026 LEADS Next Gen Centre · MSRUAS</p>
      </div>
    </div>
  `;

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

  const bodyHtml = `
    <div style="max-width: 560px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 32px; color: #f8fafc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">New Task Assigned</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Action Required</p>
      </div>

      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; color: #f8fafc; font-size: 17px; margin-bottom: 16px;">${taskTitle}</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; width: 120px;">Context:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #f8fafc;">${eventName || 'LEADS Operations'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Due Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #f43f5e;">${dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Assigned By:</td>
            <td style="padding: 6px 0; color: #38bdf8;">${creatorName || 'Committee Admin'}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px;">
        <p>© 2026 LEADS Next Gen Centre · MSRUAS</p>
      </div>
    </div>
  `;

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

  const bodyHtml = `
    <div style="max-width: 560px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 32px; color: #f8fafc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">Event Roster Assignment</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">${eventTitle}</p>
      </div>

      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #cbd5e1; font-size: 14px;">Hello <strong>${memberName}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">You have been officially added to the <strong>${committeeName}</strong> committee for <strong>${eventTitle}</strong>.</p>
        
        <div style="background: #0284c71a; border-left: 4px solid #38bdf8; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #f8fafc;">📅 <strong>Event Date:</strong> ${startDate}</p>
        </div>
      </div>

      <div style="text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px;">
        <p>© 2026 LEADS Next Gen Centre · MSRUAS</p>
      </div>
    </div>
  `;

  return { subject, bodyText, bodyHtml };
}
