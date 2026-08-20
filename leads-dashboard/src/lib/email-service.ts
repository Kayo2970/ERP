import nodemailer, { Transporter } from 'nodemailer';
import { mutateCollection, readCollection } from './server-db';

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  category: 'AUTH_OTP' | 'ANNOUNCEMENT' | 'TASK_ASSIGNMENT' | 'EVENT_ROSTER' | 'SYSTEM';
  status: 'SENT' | 'FAILED';
  sentAt: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  category: 'AUTH_OTP' | 'ANNOUNCEMENT' | 'TASK_ASSIGNMENT' | 'EVENT_ROSTER' | 'SYSTEM';
}

let transporter: Transporter | null = null;

/**
 * The app never talks to Gmail (or any external mail API) directly — it hands
 * every message to Postfix running locally on this box, which is the thing
 * actually authenticated to relay through the org's Google Workspace account
 * (see /etc/postfix/sasl_passwd on the VPS; that credential never touches
 * this app or its env). SMTP_HOST/SMTP_PORT let a non-standard local setup
 * override the default; no auth is sent because Postfix only accepts
 * unauthenticated submission from localhost (mynetworks = 127.0.0.0/8).
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 25,
      secure: false,
      pool: true,
      maxConnections: 3,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 8000,
    });
  }
  return transporter;
}

/**
 * Dispatch an email notification through the local mail server and persist
 * the attempt to database.json under the `emails` collection. `status`
 * reflects whether the local Postfix submission actually succeeded — this
 * function never claims 'SENT' for a message that wasn't actually handed off.
 */
export async function dispatchEmail(payload: SendEmailPayload): Promise<EmailLog> {
  const bodyHtml = payload.bodyHtml || `<p style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">${payload.bodyText.replace(/\n/g, '<br/>')}</p>`;
  let status: 'SENT' | 'FAILED' = 'FAILED';

  try {
    const from = `${process.env.ANNOUNCEMENT_FROM_NAME || 'LEADS Next Gen Centre'} <${process.env.ANNOUNCEMENT_FROM_EMAIL || 'leads@msruas.ac.in'}>`;
    await getTransporter().sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.bodyText,
      html: bodyHtml,
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
