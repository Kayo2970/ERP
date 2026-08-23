import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { dispatchEmail, generateNewMemberWelcomeTemplate } from '@/lib/email-service';

export async function GET() {
  const members = await readCollection('members');
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  try {
    const member = await request.json();
    const newMemberPayload = {
      ...member,
      mustSetupPassword: true,
    };
    const updated = await mutateCollection('members', (current) => {
      // Check for duplicate email
      if (current.some((m: any) => m.email?.toLowerCase() === member.email?.toLowerCase())) {
        throw new Error(`Member with email ${member.email} already exists`);
      }
      return [...current, newMemberPayload];
    });
    const created = updated.find((m: any) => m.id === member.id);

    // Send official welcome email with designation, division, department, and password setup prompt
    if (created && created.email) {
      try {
        const tmpl = generateNewMemberWelcomeTemplate(created);
        await dispatchEmail({
          to: created.email,
          subject: tmpl.subject,
          bodyText: tmpl.bodyText,
          bodyHtml: tmpl.bodyHtml,
          category: 'ACCOUNT_ACTIVATION',
        });
      } catch (emailErr) {
        console.error('[members-api] Welcome email dispatch failed:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
