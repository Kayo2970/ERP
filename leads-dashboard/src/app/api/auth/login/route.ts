import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';
import { verifyPassword } from '@/lib/password';

/**
 * Real server-side login check. Password verification (scrypt + timing-safe
 * compare) can only run server-side — Node's crypto isn't available in the
 * browser — so this replaces what used to be a client-side-only check
 * against a plaintext field. passwordHash is never included in the response.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const members = await readCollection<any>('members');
    const matchedUser = members.find(m => m.email.toLowerCase() === trimmedEmail);

    if (!matchedUser) {
      return NextResponse.json(
        { error: "We couldn't find an account with that email. Contact your committee head if you believe this is a mistake." },
        { status: 401 }
      );
    }

    if (matchedUser.status === 'Terminated') {
      return NextResponse.json(
        { error: 'This account has been deactivated. Contact your Centre Head if you believe this is a mistake.' },
        { status: 403 }
      );
    }

    if (!verifyPassword(password, matchedUser.passwordHash)) {
      return NextResponse.json(
        { error: "Incorrect password. If you forgot your password, click 'Forgot Password?' below." },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stripped from the response on purpose
    const { passwordHash, ...safeUser } = matchedUser;
    return NextResponse.json({ user: safeUser });
  } catch (err: any) {
    console.error('[login-api] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
