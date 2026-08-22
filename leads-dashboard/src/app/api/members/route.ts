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
    const updated = await mutateCollection('members', (current) => {
      // Check for duplicate email
      if (current.some((m: any) => m.email?.toLowerCase() === member.email?.toLowerCase())) {
        throw new Error(`Member with email ${member.email} already exists`);
      }
      return [...current, member];
    });
    const created = updated.find((m: any) => m.id === member.id);

    // Send the "welcome, set up your account" email — never lets a mail
    // hiccup fail the member-creation response itself (see tasks/events
    // routes for the same pattern with their own notification emails).
    if (created && created.email && !created.passwordHash) {
      try {
        await createActivationTokenAndSendEmail({ id: created.id, name: created.name, email: created.email });
      } catch (emailErr) {
        console.error('[members-api] Welcome email dispatch failed:', emailErr);
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
