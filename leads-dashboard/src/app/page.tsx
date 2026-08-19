'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogIn, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2, Clock, ArrowLeft, Send } from 'lucide-react';
import { getMembers, logAuditEvent, requestPasswordReset, submitPasswordReset } from '@/lib/local-data';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Forgot Password Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState('05:00');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setThemeLoaded(true);

    // If already logged in, route to home
    const currentUser = localStorage.getItem('user');
    if (currentUser) {
      router.push('/dashboard/home');
    }
  }, [router]);

  // 5-minute countdown timer effect for OTP
  useEffect(() => {
    if (!expiresAt || forgotStep !== 'VERIFY') return;

    const interval = setInterval(() => {
      const remainingMs = expiresAt - Date.now();
      if (remainingMs <= 0) {
        setTimeLeftStr('00:00');
        setForgotError('The 5-minute verification code has expired. Please request a new code.');
        clearInterval(interval);
      } else {
        const totalSec = Math.floor(remainingMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setTimeLeftStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, forgotStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    if (!password || password.length < 4) {
      setTimeout(() => {
        setError('Please enter a valid password (minimum 4 characters).');
        setIsLoading(false);
      }, 400);
      return;
    }

    const membersList = getMembers();
    const matchedUser = membersList.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!matchedUser) {
      setTimeout(() => {
        setError("We couldn't find an account with that email. Contact your committee head if you believe this is a mistake.");
        setIsLoading(false);
      }, 600);
      return;
    }

    // Check custom password if set
    if (matchedUser.customPassword && matchedUser.customPassword !== password) {
      setTimeout(() => {
        setError("Incorrect password. If you forgot your password, click 'Forgot Password?' below.");
        setIsLoading(false);
      }, 500);
      return;
    }

    // Save logged-in user to localStorage
    localStorage.setItem('user', JSON.stringify(matchedUser));
    logAuditEvent('USER_LOGIN', matchedUser.name, `Logged in successfully with role ${matchedUser.role} (Tier ${matchedUser.tier})`);

    // Redirect to home dashboard
    setTimeout(() => {
      router.push('/dashboard/home');
    }, 600);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setIsForgotLoading(true);

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      setIsForgotLoading(false);
      return;
    }

    const res = await requestPasswordReset(forgotEmail.trim());
    setIsForgotLoading(false);

    if (!res.success) {
      setForgotError(res.error || 'Account not found or error requesting OTP.');
      return;
    }

    setForgotSuccess(res.message || 'OTP code sent! Valid for 5 minutes.');
    if (res.expiresAt) {
      setExpiresAt(res.expiresAt);
    } else {
      setExpiresAt(Date.now() + 5 * 60 * 1000);
    }
    setForgotStep('VERIFY');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setIsForgotLoading(true);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setForgotError('Please enter the complete 6-digit OTP code.');
      setIsForgotLoading(false);
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setForgotError('New password must be at least 4 characters long.');
      setIsForgotLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('New password and confirmation do not match.');
      setIsForgotLoading(false);
      return;
    }

    const res = await submitPasswordReset(forgotEmail.trim(), otpCode.trim(), newPassword);
    setIsForgotLoading(false);

    if (!res.success) {
      setForgotError(res.error || 'Password reset failed.');
      return;
    }

    setForgotSuccess('Password reset successfully! Redirecting to login...');
    setTimeout(() => {
      setEmail(forgotEmail.trim());
      setPassword(newPassword);
      setShowForgotModal(false);
      setForgotStep('REQUEST');
      setForgotError('');
      setForgotSuccess('');
    }, 1500);
  };

  if (!themeLoaded) return null;

  return (
    <div className="min-h-screen bg-space-theme flex flex-col items-center justify-center p-4">
      {/* Main Glass Panel */}
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 flex flex-col space-y-7 relative overflow-hidden transition-all duration-300 border border-white/15 shadow-2xl">
        
        {/* Brand Header */}
        <Link 
          href="/" 
          className="flex flex-col items-center text-center space-y-3 hover:opacity-90 transition-all cursor-pointer select-none"
          title="LEADS Home"
        >
          <div className="h-16 w-16 flex items-center justify-center">
            <img 
              src="/images/leads-short-logo.png" 
              alt="LEADS Logo" 
              className="h-full w-full object-contain filter drop-shadow-[0_4px_10px_rgba(46,117,182,0.35)]"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-theme-text-primary">
              LEADS All-in-One Dashboard
            </h1>
            <p className="text-xs text-theme-text-secondary mt-1">
              Sign in with your MSRUAS email to continue
            </p>
          </div>
        </Link>

        {/* Error Alert Box */}
        {error && (
          <div className="flex gap-3 p-3.5 bg-danger/10 border border-danger/25 rounded-2xl text-danger text-xs leading-relaxed animate-in fade-in duration-200">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-theme-text-secondary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@msruas.ac.in"
                className="w-full pl-10 pr-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:border-accent text-xs transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError('');
                  setForgotSuccess('');
                  setForgotStep('REQUEST');
                  setShowForgotModal(true);
                }}
                className="text-[11px] text-accent hover:underline cursor-pointer font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-theme-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:border-accent text-xs transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-0.5 rounded text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
                title={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-7 flex flex-col space-y-5 border border-white/20 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-theme-card-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-accent/15 rounded-xl text-accent">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-theme-text-primary">
                    {forgotStep === 'REQUEST' ? 'Reset Account Password' : 'Verify OTP Code'}
                  </h3>
                  <p className="text-[11px] text-theme-text-secondary">
                    {forgotStep === 'REQUEST' ? 'Enter your registered MSRUAS email address' : 'Enter the 5-minute code sent to your email'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-theme-text-secondary hover:text-theme-text-primary text-sm p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="flex gap-2.5 p-3 bg-danger/15 border border-danger/30 rounded-xl text-danger text-xs leading-relaxed animate-in fade-in duration-150">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="flex gap-2.5 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs leading-relaxed animate-in fade-in duration-150">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 'REQUEST' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-theme-text-secondary" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@msruas.ac.in"
                      className="w-full pl-10 pr-4 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:border-accent text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/3 py-2.5 bg-white/5 hover:bg-white/10 text-theme-text-secondary font-medium rounded-xl transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-2/3 py-2.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isForgotLoading ? (
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Send 5-Min OTP
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
                <div className="p-3 bg-theme-background/50 border border-theme-card-border/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-theme-text-secondary">
                    <Clock className="h-3.5 w-3.5 text-accent animate-pulse" />
                    <span>OTP Expiry Timer:</span>
                  </div>
                  <span className="font-mono font-bold text-accent text-sm tracking-wider bg-accent/10 px-2.5 py-0.5 rounded-lg border border-accent/20">
                    {timeLeftStr}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                    6-Digit Verification OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[8px] font-mono text-base font-bold py-2 bg-theme-background/40 border border-theme-card-border rounded-xl text-accent focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full px-3.5 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-theme-text-secondary uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3.5 py-2.5 bg-theme-background/40 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('REQUEST')}
                    className="w-1/3 py-2.5 bg-white/5 hover:bg-white/10 text-theme-text-secondary font-medium rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isForgotLoading ? (
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="mt-6 text-center text-[11px] text-theme-text-secondary space-y-0.5">
        <p>© 2026 LEADS Next Gen Centre, MSRUAS.</p>
        <p>Private Internal System · Authorised Access Only</p>
      </footer>
    </div>
  );
}
