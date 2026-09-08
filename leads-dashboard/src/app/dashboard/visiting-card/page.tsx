'use client';

import React, { useState, useEffect } from 'react';
import { Save, QrCode, Copy, ExternalLink, RotateCw, AlertCircle } from 'lucide-react';
import { getMembers, saveMembers, updateMemberCard, updateMemberCardPhoto, authHeaders } from '@/lib/local-data';
import { FileDropzone, useUploadTask } from '@/components/ui/file-dropzone';
import { VisitingCardView } from '@/components/visiting-card-view';
import { CardQrModal } from '@/components/card-qr-modal';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export default function VisitingCardPage() {
  const [user, setUser] = useState<any>(null);

  const [cardEnabled, setCardEnabled] = useState(false);
  const [cardSlug, setCardSlug] = useState('');
  const [cardBio, setCardBio] = useState('');
  const [cardPhone, setCardPhone] = useState('');
  const [cardLinkedin, setCardLinkedin] = useState('');
  const [cardPhotoUrl, setCardPhotoUrl] = useState('');
  const [cardPhotoFile, setCardPhotoFile] = useState<File | null>(null);
  const [cardPhotoPreviewUrl, setCardPhotoPreviewUrl] = useState<string | null>(null);
  const [cardPhotoSizeError, setCardPhotoSizeError] = useState('');
  const [isCardQrOpen, setIsCardQrOpen] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);

  // Wallet Setup (Super User only). Apple + Google passes are both issued
  // through a single WalletWallet API key (https://walletwallet.dev) —
  // see docs/wallet-setup.md.
  const [walletStatus, setWalletStatus] = useState<any>(null);
  const [walletWalletApiKey, setWalletWalletApiKey] = useState('');
  const [isSavingWallet, setIsSavingWallet] = useState(false);

  // Whether Apple/Google Wallet buttons are actually live right now — every
  // member can see this (unlike walletStatus above, which needs Super User),
  // so the Live Preview shows real buttons instead of always "coming soon".
  const [walletAvailability, setWalletAvailability] = useState({
    appleWalletAvailable: false,
    googleWalletAvailable: false,
    samsungWalletAvailable: false,
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };
  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const isWalletAdmin = user && user.tier === 1;

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return;
    try {
      const u = JSON.parse(savedUser);
      setUser(u);
      const allMembers = getMembers();
      const me = allMembers.find(m => m.id === u.id || m.email.toLowerCase() === u.email.toLowerCase());
      setCardEnabled(Boolean(me?.cardEnabled));
      setCardSlug(me?.cardSlug || '');
      setCardBio(me?.cardBio || '');
      setCardPhone(me?.cardPhone || '');
      setCardLinkedin(me?.cardSocials?.linkedin || '');
      setCardPhotoUrl(me?.cardPhotoUrl || '');
      if (u.tier === 1) fetchWalletStatus();
    } catch (e) {
      console.error(e);
    }
    fetchWalletAvailability();
  }, []);

  const fetchWalletStatus = async () => {
    const res = await fetch('/api/admin/wallet-settings', { headers: authHeaders() });
    if (res.ok) setWalletStatus(await res.json());
  };

  const fetchWalletAvailability = async () => {
    const res = await fetch('/api/wallet-availability', { headers: authHeaders() });
    if (res.ok) setWalletAvailability(await res.json());
  };

  const cardPhotoUpload = useUploadTask(async (file, onProgress) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read that file.')));
      reader.onerror = () => reject(new Error('Could not read that file.'));
      reader.readAsDataURL(file);
    });

    const result = await updateMemberCardPhoto(user.id, dataUrl, file.name, onProgress);
    const members = getMembers();
    const idx = members.findIndex(m => m.id === user.id);
    if (idx !== -1) {
      members[idx] = { ...members[idx], cardPhotoUrl: result.cardPhotoUrl, cardPhotoStorageKey: result.cardPhotoStorageKey };
      saveMembers(members);
    }
    setCardPhotoUrl(result.cardPhotoUrl);
    triggerSuccess('Visiting card photo updated successfully.');
  });

  const handleCardPhotoFilesSelected = (files: File[]) => {
    const file = files[0];
    if (!file || !user) return;

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setCardPhotoSizeError(`Image size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 2 MB maximum limit.`);
      return;
    }
    setCardPhotoSizeError('');
    setCardPhotoFile(file);
    cardPhotoUpload.start(file);
  };

  useEffect(() => {
    if (!cardPhotoFile) {
      setCardPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(cardPhotoFile);
    setCardPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cardPhotoFile]);

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingCard(true);
    try {
      const changes = {
        cardEnabled,
        cardBio: cardBio.trim(),
        cardPhone: cardPhone.trim(),
        cardSocials: {
          linkedin: cardLinkedin.trim(),
        },
      };
      const updated = await updateMemberCard(user.id, changes, user.name);
      if (!updated) {
        triggerError('Could not find your member record to update.');
        return;
      }
      if (updated.cardSlug) setCardSlug(updated.cardSlug);
      triggerSuccess(cardEnabled ? 'Digital visiting card published successfully.' : 'Digital visiting card settings saved.');
    } catch (err: any) {
      triggerError(err?.message || 'Failed to save visiting card settings.');
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleSaveWalletSettings = async () => {
    if (!walletWalletApiKey.trim()) {
      triggerError('Enter a WalletWallet API key first.');
      return;
    }
    setIsSavingWallet(true);
    try {
      const res = await fetch('/api/admin/wallet-settings', {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ walletwallet: { apiKey: walletWalletApiKey.trim() } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        triggerError(data.error || 'Failed to save wallet settings.');
        return;
      }
      setWalletWalletApiKey('');
      await Promise.all([fetchWalletStatus(), fetchWalletAvailability()]);
      triggerSuccess('Wallet credentials saved.');
    } finally {
      setIsSavingWallet(false);
    }
  };

  // Dynamically generated the moment the card is first published — see the
  // slug-minting logic in src/app/api/members/[id]/route.ts's PATCH handler.
  const cardPublicUrl = cardSlug && typeof window !== 'undefined' ? `${window.location.origin}/card/${cardSlug}` : '';

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-danger/15 border border-danger/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <AlertCircle className="h-5 w-5 text-danger shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-theme-text-primary">Digital Visiting Card</h1>
        <p className="text-xs text-theme-text-secondary">Share a public, QR-scannable business card — anyone can save your contact instantly, and add it to Apple or Google Wallet.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-theme-text-primary">Card Details</h3>
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <span className="text-[11px] font-semibold text-theme-text-secondary">{cardEnabled ? 'Published' : 'Unpublished'}</span>
              <button
                type="button"
                onClick={() => setCardEnabled(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${cardEnabled ? 'bg-accent' : 'bg-theme-border/40'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${cardEnabled ? 'translate-x-4' : ''}`} />
              </button>
            </label>
          </div>

          <form onSubmit={handleUpdateCard} className="space-y-4 text-xs">
            <div className="flex items-center gap-4 pb-2">
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-accent flex items-center justify-center shadow-md shadow-accent/20 overflow-hidden relative">
                {cardPhotoPreviewUrl ? (
                  <img src={cardPhotoPreviewUrl} alt={user?.name} className="h-full w-full object-cover" />
                ) : cardPhotoUrl ? (
                  <img src={cardPhotoUrl} alt={user?.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-base">
                    {(user?.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
                {cardPhotoUpload.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">
                    {cardPhotoUpload.progress}%
                  </div>
                )}
              </div>
              <div className="space-y-1.5 flex-1 max-w-sm">
                <FileDropzone
                  onFilesSelected={handleCardPhotoFilesSelected}
                  accept="image/*"
                  disabled={cardPhotoUpload.status === 'uploading'}
                  label="Upload Card Photo"
                  hint="JPG, PNG, or GIF. Max size 2 MB. Falls back to your profile photo if unset."
                  compact
                />
                {cardPhotoSizeError && <p className="text-[11px] text-danger">{cardPhotoSizeError}</p>}
                {cardPhotoUpload.status === 'error' && (
                  <div className="flex items-center justify-between gap-2 text-[11px] text-danger">
                    <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 shrink-0" />{cardPhotoUpload.error}</span>
                    <button
                      type="button"
                      onClick={cardPhotoUpload.retry}
                      className="flex items-center gap-1 font-semibold text-accent hover:underline cursor-pointer shrink-0"
                    >
                      <RotateCw className="h-3 w-3" />
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Designation</label>
                <input
                  type="text"
                  disabled
                  value={user?.role || ''}
                  className="w-full px-4 py-2.5 bg-theme-background/10 border border-theme-border/30 rounded-xl text-theme-text-secondary cursor-not-allowed opacity-70"
                />
                <p className="text-[10px] text-theme-text-secondary/70">Matches your role as set in the Members Directory — not editable here.</p>
              </div>
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Phone</label>
                <input
                  type="tel"
                  value={cardPhone}
                  onChange={(e) => setCardPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">About / What you're studying or doing</label>
              <textarea
                value={cardBio}
                onChange={(e) => setCardBio(e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="e.g. MBA student specializing in Marketing, passionate about community building and events."
                className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-theme-text-secondary">LinkedIn</label>
              <input type="url" value={cardLinkedin} onChange={(e) => setCardLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent" />
            </div>

            {cardPublicUrl && (
              <div className="flex items-center gap-2 p-3 bg-theme-background/30 border border-theme-border/30 rounded-xl">
                <span className="flex-1 text-[11px] font-mono text-accent truncate">{cardPublicUrl}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(cardPublicUrl)}
                  className="p-1.5 rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCardQrOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
                  title="Show QR"
                >
                  <QrCode className="h-3.5 w-3.5" />
                </button>
                <a
                  href={cardPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all"
                  title="Open card"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingCard}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSavingCard ? 'Saving…' : cardEnabled ? 'Save & Publish' : 'Save'}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] font-semibold text-theme-text-secondary uppercase tracking-wider self-start">Live Preview</p>
          <VisitingCardView
            card={{
              name: user?.name || '',
              designation: user?.role || '',
              bio: cardBio,
              phone: cardPhone,
              email: user?.email,
              photoUrl: cardPhotoPreviewUrl || cardPhotoUrl || user?.avatarUrl,
              socials: { linkedin: cardLinkedin },
            }}
            slug={cardSlug || 'preview'}
            showActions={Boolean(cardSlug)}
            appleWalletAvailable={walletAvailability.appleWalletAvailable}
            googleWalletAvailable={walletAvailability.googleWalletAvailable}
            samsungWalletAvailable={walletAvailability.samsungWalletAvailable}
          />
        </div>

        <CardQrModal
          isOpen={isCardQrOpen}
          onClose={() => setIsCardQrOpen(false)}
          url={cardPublicUrl}
          title="Your Visiting Card QR"
          subtitle={user?.name}
        />

        {isWalletAdmin && (
          <div className="glass-panel rounded-2xl p-6 lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-theme-text-primary">Wallet Setup (Super User)</h3>
                <p className="text-xs text-theme-text-secondary">
                  Apple &amp; Google Wallet passes are both issued through{' '}
                  <a href="https://walletwallet.dev" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    WalletWallet
                  </a>{' '}
                  — no Apple/Google developer certificates needed. Sign up, grab an API key, paste it below.
                  See <code className="text-accent">docs/wallet-setup.md</code> for details.
                </p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${walletStatus?.walletWalletConfigured ? 'bg-success/15 text-success' : 'bg-theme-border/30 text-theme-text-secondary'}`}>
                {walletStatus?.walletWalletConfigured ? 'Configured' : 'Not configured'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 text-xs max-w-lg">
              <input
                type="password"
                value={walletWalletApiKey}
                onChange={(e) => setWalletWalletApiKey(e.target.value)}
                placeholder="ww_live_..."
                className="flex-1 px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleSaveWalletSettings}
                disabled={isSavingWallet}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Save className="h-4 w-4" />
                {isSavingWallet ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
