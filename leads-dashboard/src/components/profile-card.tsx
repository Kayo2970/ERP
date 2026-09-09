'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  Download,
  Wallet,
  AlertCircle,
  QrCode,
  Sparkles,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { Linkedin } from '@/components/ui/linkedin-icon';
import styles from './profile-card.module.css';

export interface ProfileCardProps {
  name: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  avatarUrl?: string;
  showUserInfo?: boolean;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  behindGlowEnabled?: boolean;
  innerGradient?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  slug?: string;
  appleWalletAvailable?: boolean;
  googleWalletAvailable?: boolean;
  isOpeningAppleWallet?: boolean;
  isOpeningGoogleWallet?: boolean;
  walletError?: string;
  onContactClick?: () => void;
  onAppleWalletClick?: () => void;
  onGoogleWalletClick?: () => void;
  onShowQr?: () => void;
}

export function ProfileCard({
  name,
  title = 'Executive Member',
  handle = 'leads.msruas',
  status = 'Verified Member',
  contactText = 'Save Contact',
  avatarUrl,
  showUserInfo = true,
  enableTilt = true,
  enableMobileTilt = true,
  behindGlowEnabled = true,
  innerGradient = 'linear-gradient(145deg, rgba(96,73,110,0.45) 0%, rgba(113,196,255,0.22) 100%)',
  phone,
  email,
  linkedin,
  slug,
  appleWalletAvailable = false,
  googleWalletAvailable = false,
  isOpeningAppleWallet = false,
  isOpeningGoogleWallet = false,
  walletError = '',
  onContactClick,
  onAppleWalletClick,
  onGoogleWalletClick,
  onShowQr,
}: ProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [glareStyle, setGlareStyle] = useState<{ x: string; y: string; opacity: number }>({
    x: '50%',
    y: '50%',
    opacity: 0,
  });
  const [gyroActive, setGyroActive] = useState(false);

  // Desktop Pointer / Mouse Tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    const glareX = `${(x / rect.width) * 100}%`;
    const glareY = `${(y / rect.height) * 100}%`;

    setTransformStyle(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlareStyle({ x: glareX, y: glareY, opacity: 0.75 });
  };

  const handleMouseLeave = () => {
    if (!enableTilt) return;
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlareStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  // Mobile Gyroscope Device Orientation Tilt
  useEffect(() => {
    if (!enableMobileTilt) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma; // Left to right [-90, 90]
      const beta = event.beta; // Front to back [-180, 180]

      if (gamma === null || beta === null) return;
      setGyroActive(true);

      // Clamp angles
      const clampedGamma = Math.max(-30, Math.min(30, gamma));
      const clampedBeta = Math.max(10, Math.min(70, beta)) - 40; // centered at ~40 deg holding angle

      const rotateY = (clampedGamma / 30) * 15;
      const rotateX = -(clampedBeta / 30) * 15;

      const glareX = `${50 + (clampedGamma / 30) * 40}%`;
      const glareY = `${50 + (clampedBeta / 30) * 40}%`;

      setTransformStyle(
        `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`
      );
      setGlareStyle({ x: glareX, y: glareY, opacity: 0.45 });
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, [enableMobileTilt]);

  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className={styles.cardWrapper}>
      {behindGlowEnabled && <div className={styles.glowBehind} />}

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={styles.cardContainer}
        style={{
          transform: transformStyle || undefined,
        }}
      >
        {/* Dynamic Glare Highlight */}
        <div
          className={styles.cardGlare}
          style={
            {
              '--glare-x': glareStyle.x,
              '--glare-y': glareStyle.y,
              '--glare-opacity': glareStyle.opacity,
            } as React.CSSProperties
          }
        />

        {/* Custom Inner Gradient Layer */}
        <div className={styles.cardInnerGradient} style={{ background: innerGradient }} />

        {/* Card Content */}
        <div className={styles.cardContent}>
          {/* Executive Avatar Ring */}
          <div className={styles.avatarWrapper}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarInitials}>{initials}</div>
            )}
            <span className={styles.statusIndicator} title={status} />
          </div>

          {/* User Info */}
          {showUserInfo && (
            <>
              <h1 className={styles.userName}>{name}</h1>
              {title && <p className={styles.userTitle}>{title}</p>}
              {handle && <p className={styles.userHandle}>@{handle.replace(/^@/, '')}</p>}

              <div className={styles.orgBadge}>
                <ShieldCheck className="h-3 w-3 text-sky-400" />
                <span>LEADS Next Gen Centre</span>
              </div>
            </>
          )}

          {/* Contact Details */}
          {(phone || email) && (
            <div className={styles.contactGrid}>
              {phone && (
                <a href={`tel:${phone}`} className={styles.contactRow}>
                  <Phone className="h-3.5 w-3.5 text-sky-400" />
                  <span>{phone}</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className={styles.contactRow}>
                  <Mail className="h-3.5 w-3.5 text-sky-400" />
                  <span className="truncate max-w-[260px]">{email}</span>
                </a>
              )}
            </div>
          )}

          {/* LinkedIn Social Link */}
          {linkedin && (
            <div className="mt-3 flex items-center justify-center">
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn Profile"
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-sky-400 transition-colors"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actionsContainer}>
            {slug ? (
              <a
                href={`/api/card/${slug}/vcf`}
                onClick={onContactClick}
                className={styles.primaryActionButton}
              >
                <Download className="h-4 w-4" />
                {contactText}
              </a>
            ) : (
              <button
                type="button"
                onClick={onContactClick}
                className={styles.primaryActionButton}
              >
                <Download className="h-4 w-4" />
                {contactText}
              </button>
            )}

            {/* Apple & Google Wallet Buttons */}
            <div className={styles.walletGrid}>
              <button
                type="button"
                onClick={appleWalletAvailable ? onAppleWalletClick : undefined}
                disabled={!appleWalletAvailable || isOpeningAppleWallet}
                className={`${styles.appleWalletBtn} ${!appleWalletAvailable ? styles.disabledBtn : ''}`}
              >
                {isOpeningAppleWallet ? (
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wallet className="h-3.5 w-3.5" />
                )}
                {appleWalletAvailable
                  ? isOpeningAppleWallet
                    ? 'Opening Apple Pass…'
                    : 'Add to Apple Wallet'
                  : 'Apple Wallet — coming soon'}
              </button>

              <button
                type="button"
                onClick={googleWalletAvailable ? onGoogleWalletClick : undefined}
                disabled={!googleWalletAvailable || isOpeningGoogleWallet}
                className={`${styles.googleWalletBtn} ${!googleWalletAvailable ? styles.disabledBtn : ''}`}
              >
                {isOpeningGoogleWallet ? (
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wallet className="h-3.5 w-3.5" />
                )}
                {googleWalletAvailable
                  ? isOpeningGoogleWallet
                    ? 'Opening Google Pass…'
                    : 'Add to Google Wallet'
                  : 'Google Wallet — coming soon'}
              </button>
            </div>

            {walletError && (
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-rose-400 pt-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {walletError}
              </p>
            )}

            {onShowQr && (
              <button
                type="button"
                onClick={onShowQr}
                className="mt-1 w-full py-1.5 text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5" />
                Display QR Code
              </button>
            )}
          </div>

          {/* Gyroscope active micro-badge */}
          {gyroActive && (
            <div className={styles.gyroscopeHint}>
              <Smartphone className="h-3 w-3 text-sky-400 animate-pulse" />
              <span>3D Gyroscope Active — Tilt Phone</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;
