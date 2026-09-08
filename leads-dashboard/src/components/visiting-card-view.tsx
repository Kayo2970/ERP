'use client';

import React, { useState } from 'react';
import { Phone, Mail, Download, Wallet, AlertCircle } from 'lucide-react';
import { Linkedin } from '@/components/ui/linkedin-icon';

export interface VisitingCardData {
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  socials?: {
    linkedin?: string;
  };
}

interface VisitingCardViewProps {
  card: VisitingCardData;
  slug: string;
  /** Set false in the Settings live-preview, where downloads/actions don't apply yet. */
  showActions?: boolean;
  appleWalletAvailable?: boolean;
  googleWalletAvailable?: boolean;
  /**
   * Set true only for the Visiting Card page's own Live Preview. In this
   * mode the wallet buttons read `?cacheOnly=1` — whatever pass is already
   * sitting cached on this VPS from the last Save/Publish — and never call
   * WalletWallet's live API themselves, so clicking around your own draft
   * can never burn an API call or eat into your rate limit. The real
   * published card (previewMode false/unset) can still generate on demand
   * as a fallback.
   */
  previewMode?: boolean;
  onShowQr?: () => void;
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

/**
 * Shared card visual — used both in the Settings live-preview and the public
 * /card/[slug] page, so the two can never visually drift apart.
 */
export function VisitingCardView({
  card,
  slug,
  showActions = true,
  appleWalletAvailable = false,
  googleWalletAvailable = false,
  previewMode = false,
  onShowQr,
}: VisitingCardViewProps) {
  const socials = card.socials || {};
  const hasSocials = Boolean(socials.linkedin);
  const anyWalletAvailable = appleWalletAvailable || googleWalletAvailable;
  const [isOpeningGoogleWallet, setIsOpeningGoogleWallet] = useState(false);
  const [isOpeningAppleWallet, setIsOpeningAppleWallet] = useState(false);
  const [walletError, setWalletError] = useState('');

  const cacheOnlySuffix = previewMode ? '?cacheOnly=1' : '';

  const handleAddToAppleWallet = async () => {
    setWalletError('');
    setIsOpeningAppleWallet(true);
    try {
      const res = await fetch(`/api/card/${slug}/apple-pass${cacheOnlySuffix}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setWalletError(data.error || 'Could not fetch the Apple Wallet pass.');
        return;
      }
      // Deliberately NOT an <a download> — that forces a plain file save.
      // Navigating to a blob: URL that keeps the response's
      // application/vnd.apple.pkpass type is what lets Safari present its
      // native "Add to Apple Wallet" sheet, same as navigating straight to
      // the API route would.
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.location.href = blobUrl;
    } catch {
      setWalletError('Could not fetch the Apple Wallet pass.');
    } finally {
      setIsOpeningAppleWallet(false);
    }
  };

  // Unlike Apple's route (which streams the .pkpass file directly), Google's
  // endpoint returns { saveUrl } — the actual pay.google.com/gp/v/save/<jwt>
  // link — so this needs a fetch-then-navigate instead of a plain <a href>.
  const handleAddToGoogleWallet = async () => {
    setWalletError('');
    setIsOpeningGoogleWallet(true);
    try {
      const res = await fetch(`/api/card/${slug}/google-pass${cacheOnlySuffix}`);
      const data = await res.json();
      if (res.ok && data.saveUrl) {
        window.location.href = data.saveUrl;
      } else if (!res.ok) {
        setWalletError(data.error || 'Could not fetch the Google Wallet pass.');
      }
    } catch {
      setWalletError('Could not fetch the Google Wallet pass.');
    } finally {
      setIsOpeningGoogleWallet(false);
    }
  };

  return (
    <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden border border-white/20 dark:border-white/15 shadow-2xl backdrop-blur-2xl bg-theme-card/90">
      {/* Header band */}
      <div
        className="relative px-6 pt-8 pb-14 text-center"
        style={{
          background:
            'linear-gradient(135deg, #0B1B2E 0%, #0F2A47 45%, #1E4D7B 100%)',
        }}
      >
        <div className="mx-auto h-24 w-24 rounded-full ring-4 ring-white/15 shadow-xl overflow-hidden bg-[#1E4D7B] flex items-center justify-center">
          {card.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.photoUrl} alt={card.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-white">{initials(card.name || '?')}</span>
          )}
        </div>
      </div>

      {/* Body — overlaps the header band */}
      <div className="px-6 -mt-8 pb-6 text-center">
        <div className="glass-panel inline-block rounded-2xl px-5 py-3 border border-white/15 bg-theme-card/95 shadow-lg">
          <h1 className="text-lg font-bold text-theme-text-primary">{card.name}</h1>
          {card.designation && (
            <p className="text-sm font-medium text-accent mt-0.5">{card.designation}</p>
          )}
        </div>

        {(card.phone || card.email) && (
          <div className="mt-4 flex flex-col items-center gap-1.5 text-xs text-theme-text-secondary">
            {card.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-accent" /> {card.phone}
              </span>
            )}
            {card.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-accent" /> {card.email}
              </span>
            )}
          </div>
        )}

        {hasSocials && (
          <div className="mt-4 flex items-center justify-center gap-3">
            {socials.linkedin && (
              <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="h-9 w-9 flex items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        {showActions && (
          <div className="mt-6 space-y-2">
            <a
              href={`/api/card/${slug}/vcf`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent hover:bg-primary-light text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-accent/20"
            >
              <Download className="h-4 w-4" />
              Save Contact
            </a>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={appleWalletAvailable ? handleAddToAppleWallet : undefined}
                disabled={!appleWalletAvailable || isOpeningAppleWallet}
                className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-semibold rounded-xl transition-all border ${
                  appleWalletAvailable
                    ? 'bg-black text-white border-black/50 hover:bg-neutral-800 cursor-pointer disabled:opacity-70'
                    : 'bg-theme-border/15 text-theme-text-secondary border-theme-border/30 cursor-not-allowed opacity-60'
                }`}
              >
                <Wallet className="h-3.5 w-3.5" />
                {appleWalletAvailable ? (isOpeningAppleWallet ? 'Opening…' : 'Add to Apple Wallet') : 'Apple Wallet — coming soon'}
              </button>
              <button
                type="button"
                onClick={googleWalletAvailable ? handleAddToGoogleWallet : undefined}
                disabled={!googleWalletAvailable || isOpeningGoogleWallet}
                className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-semibold rounded-xl transition-all border ${
                  googleWalletAvailable
                    ? 'bg-[#1a73e8] text-white border-[#1a73e8]/60 hover:bg-[#1765cc] cursor-pointer disabled:opacity-70'
                    : 'bg-theme-border/15 text-theme-text-secondary border-theme-border/30 cursor-not-allowed opacity-60'
                }`}
              >
                <Wallet className="h-3.5 w-3.5" />
                {googleWalletAvailable ? (isOpeningGoogleWallet ? 'Opening…' : 'Add to Google Wallet') : 'Google Wallet — coming soon'}
              </button>
            </div>

            {walletError && (
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-danger pt-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {walletError}
              </p>
            )}

            {onShowQr && (
              <button
                onClick={onShowQr}
                className="w-full px-4 py-2 text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors"
              >
                Show QR code
              </button>
            )}

            {!anyWalletAvailable && (
              <p className="text-[10px] text-theme-text-secondary/70 pt-1">
                Wallet passes aren&apos;t set up yet — use Save Contact for now.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
