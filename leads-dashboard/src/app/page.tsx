'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { getMembers, logAuditEvent } from '@/lib/local-data';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic password validation
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

    // Save logged-in user to localStorage
    localStorage.setItem('user', JSON.stringify(matchedUser));
    logAuditEvent('USER_LOGIN', matchedUser.name, `Logged in successfully with role ${matchedUser.role} (Tier ${matchedUser.tier})`);

    // Redirect to home dashboard
    setTimeout(() => {
      router.push('/dashboard/home');
    }, 600);
  };

  if (!themeLoaded) return null;

  return (
    <div className="min-h-screen bg-space-theme flex flex-col items-center justify-center p-4">
      {/* Main Glass Panel */}
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 flex flex-col space-y-7 relative overflow-hidden transition-all duration-300 border border-white/15 shadow-2xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
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
        </div>

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
              <span className="text-[11px] text-accent">
                Use any password (e.g. leads2026)
              </span>
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

      {/* Footer Info */}
      <footer className="mt-6 text-center text-[11px] text-theme-text-secondary space-y-0.5">
        <p>© 2026 LEADS Next Gen Centre, MSRUAS.</p>
        <p>Private Internal System · Authorised Access Only</p>
      </footer>
    </div>
  );
}
