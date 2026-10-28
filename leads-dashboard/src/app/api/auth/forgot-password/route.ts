import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { z } from 'zod';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { dispatchEmail, generateOtpEmailTemplate } from '@/lib/email-service';
import { parseJsonBody } from '@/lib/validation';
import { apiError } from '@/lib/api-error';
import { createActivationTokenAndSendEmail } from '@/lib/account-activation';

const ForgotPasswordSchema = z.object({
  email: z.string().trim().min(1).max(254).email(),
}).strict();

export async function POST(request: Request) {
  try {
    const { email } = await parseJsonBody(request, ForgotPasswordSchema);
    const trimmedEmail = email.trim().toLowerCase();
    const members = await readCollection('members');
    const member = members.find((m: any) => m.email.toLowerCase() === trimmedEmail);

    if (!member) {
      // Deliberately indistinguishable from the "OTP sent" success response
      // below — a distinct "no account found" message here would let anyone
      // enumerate which emails have accounts by submitting them one at a time.
      return NextResponse.json({
        success: true,
        message: `If an account exists for ${trimmedEmail}, a verification code has been sent to it. Valid for 5 minutes.`,
        email: trimmedEmail,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
    }

    // Never activated (no password yet): an OTP can't help, the password is set through the activation link.
    // Email a fresh link instead of leaving them with nothing.
    if (!member.passwordHash) {
      const host = request.headers.get('host');
      const proto = request.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
      const origin = request.headers.get('origin') || (host ? `${proto}://${host}` : undefined);
      const result = await createActivationTokenAndSendEmail({ id: member.id, name: member.name, email: member.email }, 'Self-service', origin, request);
      if (!result.emailSent) {
        console.error(`[forgot-password-api] Activation email to ${member.email} was not delivered: ${result.emailError || 'unknown error'}`);
        return NextResponse.json(
          { error: "We couldn't email your account setup link right now. Please try again in a few minutes, or ask a Super User to resend it from the Members Directory." },
          { status: 503 }
        );
      }
      return NextResponse.json({
        activationLinkSent: true,
        email: member.email,
        message: `Your account isn't activated yet, so there's no password to reset. We've emailed a fresh account setup link to ${member.email}.`,
      });
    }

    if (member.mustSetupPassword) {
      return NextResponse.json({
        adminOverride: true,
        email: member.email,
        name: member.name,
        message: 'Super User has requested a password reset for your account. You can set a new password directly without an OTP code.',
      });
    }

    // Generate 6-digit OTP code (cryptographically strong, not Math.random())
    const otp = randomInt(100000, 1000000).toString();
    
    // 5 minutes expiry enforcement
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const resetToken = {
      id: `reset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: trimmedEmail,
      otp,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    // Store in passwordResets collection, keeping existing or purging old resets for this email
    await mutateCollection('passwordResets', (current) => {
      const filtered = (current || []).filter((r: any) => r.email !== trimmedEmail);
      return [resetToken, ...filtered];
    });

    // Generate HTML email template
    const template = generateOtpEmailTemplate(member.name, otp);

    // Dispatch email
    const sent = await dispatchEmail({
      to: member.email,
      subject: template.subject,
      bodyText: template.bodyText,
      bodyHtml: template.bodyHtml,
      category: 'AUTH_OTP',
    });

    // Never tell someone a code is on its way when the mail server rejected or couldn't send it — that left people
    // waiting for an email that was never going to arrive. Drop the unusable code and say what to do instead.
    if (sent.status !== 'SENT') {
      await mutateCollection('passwordResets', (current) => (current || []).filter((r: any) => r.id !== resetToken.id));
      console.error(`[forgot-password-api] OTP email to ${member.email} was not delivered (${sent.status}): ${sent.errorMessage || 'unknown error'}`);
      return NextResponse.json(
        {
          error: "We couldn't email your verification code right now (the mail server isn't reachable or rejected it). Please try again in a few minutes, or ask a Super User to reset your password from the Members Directory.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${member.email}. Valid for 5 minutes.`,
      email: member.email,
      // Note: for development preview, returning expiry in response
      expiresAt,
    });
  } catch (err: any) {
    return apiError(err, 'forgot-password-api');
  }
}
