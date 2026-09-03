import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { createActivationTokenAndSendEmail } from '@/lib/account-activation';

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
      if ((current || []).some((m: any) => m.email?.toLowerCase() === member.email?.toLowerCase())) {
        throw new Error(`Member with email ${member.email} already exists`);
      }
      return [...(current || []), newMemberPayload];
    });
    const created = updated.find((m: any) => m.id === member.id);

    let activationLink = '';
    let activationEmailSent = false;
    let activationEmailError: string | undefined;
    // A submission awaiting Centre Head sign-off (approvalStatus 'pending_create',
    // see local-data.ts's submitMemberCreate) can't log in yet, so the welcome
    // email is deliberately withheld until approveMemberCreate dispatches it.
    if (created && created.email && created.approvalStatus !== 'pending_create') {
      try {
        const host = request.headers.get('host');
        const proto = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
        const origin = request.headers.get('origin') || (host ? `${proto}://${host}` : undefined);

        const result = await createActivationTokenAndSendEmail({ id: created.id, name: created.name, email: created.email }, 'Super User', origin, request);
        activationLink = result.activationLink;
        activationEmailSent = result.emailSent;
        activationEmailError = result.emailError;
      } catch (emailErr) {
        console.error('[members-api] Welcome email dispatch failed:', emailErr);
        activationEmailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
      }
    }

    return NextResponse.json({ ...created, activationLink, activationEmailSent, activationEmailError }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
