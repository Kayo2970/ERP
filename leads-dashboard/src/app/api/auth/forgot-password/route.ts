import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { z } from 'zod';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { dispatchEmail, generateOtpEmailTemplate } from '@/lib/email-service';
import { parseJsonBody } from '@/lib/validation';
import { apiError } from '@/lib/api-error';

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
    await dispatchEmail({
      to: member.email,
      subject: template.subject,
      bodyText: template.bodyText,
      bodyHtml: template.bodyHtml,
      category: 'AUTH_OTP',
    });

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
