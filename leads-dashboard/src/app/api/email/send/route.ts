import { NextResponse } from 'next/server';
import { dispatchEmail, SendEmailPayload } from '@/lib/email-service';
import { readCollection } from '@/lib/server-db';
import { Member, EventPassItem } from '@/lib/local-data';
import { renderBoardingPassPng } from '@/lib/pass-image';
import { getPassTheme } from '@/lib/pass-theme';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { gateEventPassAction } from '@/lib/approval-gate';
import { submitPassApproval } from '@/lib/event-pass-approvals';

/**
 * Client-supplied attachments arrive as base64 (JSON has no Buffer type) —
 * decode here into the Buffer shape dispatchEmail/nodemailer expect. Used
 * e.g. to attach a generated .pkpass wallet file to an event pass email.
 */
function decodeAttachments(
  raw: unknown
): SendEmailPayload['attachments'] {
  if (!Array.isArray(raw)) return undefined;
  const decoded = raw
    .filter((a) => a && typeof a === 'object' && typeof a.filename === 'string' && typeof a.contentBase64 === 'string')
    .map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.contentBase64, 'base64'),
      contentType: typeof a.contentType === 'string' ? a.contentType : undefined,
    }));
  return decoded.length > 0 ? decoded : undefined;
}

// This route is used by real app features beyond the admin Email Management
// panel (e.g. member-termination notices from Directory, guest-invite
// mail-merge sends), so it is gated with requireSession only — any signed-in
// member may dispatch mail through it. The specific workflows that call it
// each already enforce their own permission check before reaching here
// (e.g. canTerminateMember, canManageGuestInvites); the admin Email
// Management page itself is a normal authenticated feature too.
export async function POST(request: Request) {
  try {
    const sessionUser = await requireSession(request);
    const body = await request.json();
    const {
      scope,
      recipientEmail,
      to,
      subject,
      bodyText,
      bodyHtml,
      body: rawBody,
      content,
      category,
      badgeText,
      badgeColor,
      attachments: rawAttachments,
      passSerial,
    } = body;

    const attachments = decodeAttachments(rawAttachments) || [];

    // Event pass emails are an Event Passes action: policy-gated, and held for approval when the policy says so.
    if (typeof passSerial === 'string' && passSerial) {
      const gate = await gateEventPassAction(sessionUser, 'dispatch');
      if (!gate.allowed) {
        return NextResponse.json({ error: "You don't have permission to email event passes." }, { status: 403 });
      }
      if (gate.requiresApproval) {
        const target = (await readCollection<EventPassItem>('event_passes')).find((p) => p.serialNumber.toLowerCase() === passSerial.toLowerCase());
        if (!target) return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
        const to0 = recipientEmail || to;
        await submitPassApproval({
          action: 'dispatch', pass: target, actor: sessionUser, gate,
          uniqueSuffix: String(to0).toLowerCase(),
          message: `${sessionUser.name} wants to email ${target.attendeeName}'s pass to ${to0}. It is sent only after you approve${gate.policyName ? ` (policy: ${gate.policyName})` : ''}.`,
          payload: { email: { to: to0, subject, bodyText: bodyText || rawBody || content, bodyHtml, passSerial, category, badgeText, badgeColor } },
        });
        return NextResponse.json({ count: 0, dispatched: [], approvalPending: true }, { status: 202 });
      }
    }

    // Event pass emails: render the boarding-pass image and attach it inline (cid:leads-pass-image)
    if (typeof passSerial === 'string' && passSerial) {
      try {
        const passes = await readCollection<EventPassItem>('event_passes');
        const pass = passes.find((p) => p.serialNumber.toLowerCase() === passSerial.toLowerCase());
        if (pass && pass.status !== 'Cancelled') {
          const origin = new URL(request.url).origin;
          const png = await renderBoardingPassPng(pass, `${origin}/pass/${pass.serialNumber}`, await getPassTheme(pass.eventId));
          attachments.push({ filename: `${pass.serialNumber}.png`, content: png, contentType: 'image/png', cid: 'leads-pass-image' });
        }
      } catch (imgErr) {
        console.warn('[email-send] Boarding-pass image skipped:', imgErr);
      }
    }
    const emailTo = recipientEmail || to;
    const finalSubject = subject;
    const textContent = bodyText || rawBody || content;

    if (!finalSubject || !textContent) {
      return NextResponse.json({ error: 'Subject and email content are required' }, { status: 400 });
    }

    // 1. Single recipient dispatch (explicit SINGLE, or to/recipientEmail passed directly)
    if (scope === 'SINGLE' || (!scope && emailTo) || (scope !== 'ALL' && scope !== 'All Members' && emailTo)) {
      if (!emailTo) {
        return NextResponse.json({ error: 'Recipient email address is required' }, { status: 400 });
      }
      const log = await dispatchEmail({
        to: emailTo,
        subject: finalSubject,
        bodyText: textContent,
        bodyHtml,
        badgeText: badgeText || (category === 'EVENT_INVITATION' || category === 'EVENT_PASS' ? 'Official Event Pass' : undefined),
        badgeColor,
        category: category || (category === 'EVENT_INVITATION' || category === 'EVENT_PASS' ? category : 'DIRECT_MESSAGE'),
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      return NextResponse.json({ count: 1, dispatched: [log] });
    }

    // 2. Scope broadcast dispatch
    const members = await readCollection<Member>('members');
    let targetMembers = members || [];

    if (scope !== 'ALL' && scope !== 'All Members') {
      targetMembers = targetMembers.filter(m => m.division === scope || m.role === scope);
    }

    const recipientEmails = Array.from(new Set(targetMembers.map(m => m.email).filter(Boolean)));
    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: 'No members found matching the selected target scope' }, { status: 404 });
    }

    const dispatchedLogs = [];
    for (const email of recipientEmails) {
      const log = await dispatchEmail({
        to: email,
        subject,
        bodyText,
        bodyHtml,
        badgeText,
        badgeColor,
        category: category || 'ANNOUNCEMENT',
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      dispatchedLogs.push(log);
    }

    return NextResponse.json({ count: dispatchedLogs.length, dispatched: dispatchedLogs });
  } catch (err: any) {
    return apiError(err, 'email-send-api-post', 500);
  }
}
