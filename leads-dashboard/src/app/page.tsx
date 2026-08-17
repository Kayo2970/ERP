'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogIn, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock validation: check if email contains msruas or standard domains. 
    // If empty or invalid, show the spec-defined error
    if (!email || !email.includes('@')) {
      setTimeout(() => {
        setError("We couldn't find an account with that email. Contact your committee head if you believe this is a mistake.");
        setIsLoading(false);
      }, 800);
      return;
    }

    // Redirect to home dashboard
    setTimeout(() => {
      router.push('/dashboard/home');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-space-theme dark flex flex-col items-center justify-center p-4">
      {/* Main Glass Panel */}
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 flex flex-col space-y-8 relative overflow-hidden transition-all duration-300">
        
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
            <h1 className="text-2xl font-bold tracking-tight text-white">
              LEADS All-in-One Dashboard
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-1.5">
              Sign in with your MSRUAS email to continue
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="flex gap-3 p-4 bg-danger/10 border border-danger/25 rounded-2xl text-danger text-xs leading-relaxed animate-in fade-in duration-200">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-[#6B7280]" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@msruas.ac.in"
                className="w-full pl-12 pr-4 py-3 bg-black/25 border border-white/5 rounded-2xl text-white placeholder-[#6B7280] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Password
              </label>
              <a href="#" className="text-xs text-accent hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-[#6B7280]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-black/25 border border-white/5 rounded-2xl text-white placeholder-[#6B7280] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-accent/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign in
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-[#6B7280] space-y-1">
        <p>© 2026 LEADS Next Gen Centre, MSRUAS.</p>
        <p>Private Internal System · Authorised Access Only</p>
      </footer>
    </div>
  );
}
