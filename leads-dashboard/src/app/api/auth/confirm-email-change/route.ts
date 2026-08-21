import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';

/**
 * Self-service email change, step 2 of 2. Verifies the OTP that was sent to
 * the OLD email address, then applies the new email directly against the
 * members collection server-side — never through the generic member PATCH
 * route, so the email field can never be set to an unverified value.
 */
export async function POST(request: Request) {
  try {
    const { memberId, otp } = await request.json();
    if (!memberId || !otp) {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    const changes = await readCollection<any>('emailChanges');
    const matchedChange = changes.find((r: any) => r.memberId === memberId && r.otp === String(otp).trim());
    if (!matchedChange) {
      return NextResponse.json({ error: 'Invalid verification code. Please check your email and try again.' }, { status: 400 });
    }
    if (Date.now() > matchedChange.expiresAt) {
      return NextResponse.json({ error: 'The 5-minute verification code has expired. Please request a new one.' }, { status: 400 });
    }

    const members = await readCollection<any>('members');
    if (members.some((m: any) => m.id !== memberId && m.email.toLowerCase() === matchedChange.newEmail)) {
      return NextResponse.json({ error: 'That email address was claimed by another account in the meantime.' }, { status: 409 });
    }

    let memberUpdated = false;
    let memberName = 'User';
    await mutateCollection('members', (current) =>
      (current || []).map((m: any) => {
        if (m.id === memberId) {
          memberUpdated = true;
          memberName = m.name;
          return { ...m, email: matchedChange.newEmail };
        }
        return m;
      })
    );

    if (!memberUpdated) {
      return NextResponse.json({ error: 'Account not found in registered members database.' }, { status: 404 });
    }

    await mutateCollection('emailChanges', (current) => (current || []).filter((r: any) => r.id !== matchedChange.id));

    const auditLog = {
      id: `audit-${Date.now()}`,
      action: 'EMAIL_CHANGED',
      user: memberName,
      details: `Login email changed from ${matchedChange.oldEmail} to ${matchedChange.newEmail} via 5-minute OTP confirmation`,
      timestamp: new Date().toISOString(),
    };
    await mutateCollection('auditLogs', (current) => [auditLog, ...(current || [])]);

    return NextResponse.json({
      success: true,
      message: 'Email address updated successfully! Use your new email to log in from now on.',
      newEmail: matchedChange.newEmail,
    });
  } catch (err: any) {
    console.error('[confirm-email-change-api] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
