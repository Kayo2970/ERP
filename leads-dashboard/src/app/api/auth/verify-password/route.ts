import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { verifyPassword } from '@/lib/password';

/**
 * Read-only re-authentication check — confirms the caller still knows their
 * own account password without mutating anything (unlike change-password).
 * Used to gate access to sensitive settings (e.g. SMTP configuration) behind
 * a "confirm your password" step.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const members = await readCollection<any>('members');
    const matchedUser = members.find(m => m.email?.toLowerCase() === trimmedEmail);

    if (!matchedUser || !verifyPassword(password, matchedUser.passwordHash)) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[verify-password-api] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
