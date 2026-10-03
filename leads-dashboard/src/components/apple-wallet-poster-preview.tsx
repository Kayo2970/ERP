'use client';

import React from 'react';

export interface ApplePosterPreviewProps {
  attendeeName: string;
  guestCategory?: string;
  passType: string;
  roomOrVenue?: string;
  eventName: string;
  validity: string;
  serialNumber: string;
  validDaysCount?: number;
  logoText?: string;
  logoUrl?: string;
  /** Portrait artwork (690×1010 crop) — exactly what WalletWallet receives as backgroundURL. */
  backgroundUrl?: string;
  baseColor?: string;
}

/**
 * Mirrors Apple's iOS 27 "poster" pass layout as WalletWallet renders it when `backgroundURL` is set:
 * full-bleed artwork, logo + logoText top-left, ONE header field, up to FOUR primary fields, up to TWO
 * footer fields and the barcode over the image. Text is always white with light labels — Apple controls it.
 */
export function AppleWalletPosterPreview({
  attendeeName,
  guestCategory = 'Guest Attendee',
  passType,
  roomOrVenue = 'Main Auditorium',
  eventName,
  validity,
  serialNumber,
  validDaysCount = 0,
  logoText = 'LEADS Next Gen Centre',
  logoUrl = '/card/leads-logo.png',
  backgroundUrl,
  baseColor = '#0b1526',
}: ApplePosterPreviewProps) {
  const label: React.CSSProperties = {
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
    fontWeight: 600,
  };
  const value: React.CSSProperties = { color: '#fff', fontWeight: 700, lineHeight: 1.15 };

  const primary: Array<[string, string, number]> = [
    [guestCategory, attendeeName.trim() || 'Attendee Name', 22],
    ['Event', eventName, 14],
    ['Venue', roomOrVenue, 14],
    ['Valid', validity, 14],
  ];

  return (
    <div
      style={{
        width: 300,
        aspectRatio: '690 / 1010',
        borderRadius: 22,
        overflow: 'hidden',
        position: 'relative',
        background: baseColor,
        boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
      }}
    >
      {backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backgroundUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {/* Apple darkens the poster slightly so white text stays readable */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.05) 38%, rgba(0,0,0,0.62) 100%)' }} />

      <div style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: 14, display: 'flex', flexDirection: 'column' }}>
        {/* Logo + logoText / ONE header field */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{logoText}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={label}>Access</div>
            <div style={{ ...value, fontSize: 11 }}>{(passType || 'VIP PASS').toUpperCase()}</div>
          </div>
        </div>

        {/* Up to four primary fields */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {primary.map(([k, v, size]) => (
            <div key={k}>
              <div style={label}>{k}</div>
              <div style={{ ...value, fontSize: size, textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Barcode over the artwork */}
        <div style={{ margin: '10px auto 6px', background: '#fff', borderRadius: 12, padding: 6, textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/card/leads-qr-code.png" alt="QR" style={{ width: 70, height: 70, display: 'block', margin: '0 auto' }} />
        </div>

        {/* Up to two footer fields */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={label}>Pass ID</div>
            <div style={{ ...value, fontSize: 9, fontFamily: 'monospace' }}>{serialNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={label}>Entry</div>
            <div style={{ ...value, fontSize: 9 }}>{validDaysCount > 1 ? `One pass · ${validDaysCount} days` : 'Scan QR at gate'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppleWalletPosterPreview;
