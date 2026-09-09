'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import styles from './interactive-keycard.module.css';

const CARD_EXTRACT_DURATION = 850;
const CARD_TUCK_DURATION = 800;
const COVER_OPEN_DURATION = 900;
const COVER_CLOSE_DURATION = 850;

export interface InteractiveKeycardProps {
  memberName: string;
  memberRole?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  serialNumber?: string;
  accessLevel?: string;
  validityPeriod?: string;
  issuingAuthority?: string;
  cardUrl?: string;
  qrUrl?: string;
  onSaveContact?: () => void;
  onAddToAppleWallet?: () => void;
  onAddToGoogleWallet?: () => void;
  isGeneratingWallet?: boolean;
  walletError?: string;
  showActions?: boolean;
  autoOpen?: boolean;
}

export function InteractiveKeycardHolder({
  memberName = 'Executive Member',
  memberRole = 'LEADS Member',
  phone = '+91 9608768647',
  email = 'member@leads-centre.org',
  photoUrl,
  serialNumber,
  accessLevel = 'Executive & Alumni Fellow (Tier 1)',
  validityPeriod,
  issuingAuthority = 'LEADS Next Gen Centre',
  cardUrl,
  qrUrl = '/card/leads-qr-code.png',
  onSaveContact,
  onAddToAppleWallet,
  onAddToGoogleWallet,
  isGeneratingWallet = false,
  walletError,
  showActions = true,
  autoOpen = false,
}: InteractiveKeycardProps) {
  const [stageState, setStageState] = useState<'init' | 'entered' | 'opened' | 'extracting' | 'extracted' | 'tucking' | 'closing'>('init');
  const [activeTab, setActiveTab] = useState<'card' | 'creds'>('card');
  const [isFlipped, setIsFlipped] = useState(false);
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ isDragging: false, startY: 0, currentDeltaY: 0, hasDragged: false });
  const holderDragInfo = useRef({ isDragging: false, startY: 0, hasDragged: false });

  const memberInitials = (memberName || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  // Compute 1-year dynamic validity if not passed
  const formattedValidity = React.useMemo(() => {
    if (validityPeriod) return validityPeriod;
    const now = new Date();
    const nextYear = new Date(now);
    nextYear.setFullYear(now.getFullYear() + 1);
    const formatDate = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${formatDate(now)} – ${formatDate(nextYear)} (1 Year)`;
  }, [validityPeriod]);


  // Compute unique serial ID if not passed
  const formattedSerial = React.useMemo(() => {
    if (serialNumber) return serialNumber;
    const hash = Math.abs(
      (memberName + email).split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    )
      .toString(36)
      .toUpperCase()
      .padStart(5, '0')
      .slice(0, 5);
    return `LEADS-DIR-${hash}`;
  }, [serialNumber, memberName, email]);

  // Dynamically generate QR code with LEADS logo in center
  useEffect(() => {
    let isMounted = true;

    const generateQr = async () => {
      let targetUrl = cardUrl || qrUrl;
      // If no valid URL string was provided or only default PNG path, compute public URL fallback
      if (!targetUrl || targetUrl.endsWith('.png') || targetUrl.endsWith('.jpg')) {
        if (cardUrl) {
          targetUrl = cardUrl;
        } else if (typeof window !== 'undefined') {
          targetUrl = window.location.href;
        } else {
          targetUrl = 'https://leads-centre.org';
        }
      }

      try {
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: 360,
          margin: 2,
          color: { dark: '#0B1B2E', light: '#ffffff' },
          errorCorrectionLevel: 'H',
        });

        const ctx = qrCanvas.getContext('2d');
        if (ctx) {
          const logo = new Image();
          logo.onload = () => {
            if (!isMounted) return;
            const size = qrCanvas.width;
            const logoSize = Math.round(size * 0.22);
            const pad = Math.round(logoSize * 0.16);
            const boxSize = logoSize + pad * 2;
            const boxX = (size - boxSize) / 2;
            const boxY = (size - boxSize) / 2;
            const radius = Math.round(boxSize * 0.15);

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(boxX + radius, boxY);
            ctx.arcTo(boxX + boxSize, boxY, boxX + boxSize, boxY + boxSize, radius);
            ctx.arcTo(boxX + boxSize, boxY + boxSize, boxX, boxY + boxSize, radius);
            ctx.arcTo(boxX, boxY + boxSize, boxX, boxY, radius);
            ctx.arcTo(boxX, boxY, boxX + boxSize, boxY, radius);
            ctx.closePath();
            ctx.fill();

            ctx.drawImage(logo, (size - logoSize) / 2, (size - logoSize) / 2, logoSize, logoSize);
            if (isMounted) {
              setDynamicQrUrl(qrCanvas.toDataURL('image/png'));
            }
          };
          logo.onerror = () => {
            if (isMounted) setDynamicQrUrl(qrCanvas.toDataURL('image/png'));
          };
          logo.src = '/card/leads-logo-clean.png';
        } else {
          if (isMounted) setDynamicQrUrl(qrCanvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.warn('[InteractiveKeycard] QR generation warning:', err);
      }
    };

    generateQr();
    return () => { isMounted = false; };
  }, [cardUrl, qrUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStageState(autoOpen ? 'opened' : 'entered');
    }, 350);
    return () => clearTimeout(timer);
  }, [autoOpen]);

  const handleHolderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(`.${styles.passCard}`) || (e.target as HTMLElement).closest(`.${styles.coverBack}`)) {
      return;
    }
    if (stageState === 'extracting' || stageState === 'tucking' || stageState === 'closing') return;
    holderDragInfo.current = { isDragging: true, startY: e.clientY, hasDragged: false };
  };

  const handleHolderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!holderDragInfo.current.isDragging) return;
    const deltaY = holderDragInfo.current.startY - e.clientY;
    if (Math.abs(deltaY) > 8) {
      holderDragInfo.current.hasDragged = true;
    }
  };

  const handleHolderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!holderDragInfo.current.isDragging) return;
    holderDragInfo.current.isDragging = false;
    if (stageState === 'extracting' || stageState === 'tucking' || stageState === 'closing') return;

    const deltaY = holderDragInfo.current.startY - e.clientY;
    const wasSwipe = holderDragInfo.current.hasDragged;

    if (stageState === 'entered') {
      if (!wasSwipe || deltaY > 40) {
        setStageState('opened');
        setActiveTab('card');
      }
    } else if (stageState === 'opened') {
      if (!wasSwipe || deltaY < -40) {
        setStageState('closing');
        setTimeout(() => {
          setStageState('entered');
        }, COVER_CLOSE_DURATION);
      }
    } else if (stageState === 'extracted') {
      if (!wasSwipe || deltaY < -40) {
        triggerExtract();
      }
    }
  };

  const triggerExtract = () => {
    if (stageState === 'opened') {
      setIsFlipped(false);
      setStageState('extracting');
      setTimeout(() => {
        setStageState('extracted');
      }, CARD_EXTRACT_DURATION);
    } else if (stageState === 'extracted') {
      setIsFlipped(false);
      setStageState('tucking');
      setTimeout(() => {
        setStageState('opened');
      }, CARD_TUCK_DURATION);
    }
  };

  const toggleFlip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (stageState === 'extracted') {
      setIsFlipped((prev) => !prev);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stageState !== 'opened' && stageState !== 'extracted') return;

    dragInfo.current = {
      isDragging: true,
      startY: e.clientY,
      currentDeltaY: 0,
      hasDragged: false,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDragging) return;
    const deltaY = dragInfo.current.startY - e.clientY;

    if (Math.abs(deltaY) > 8) {
      dragInfo.current.hasDragged = true;
    }

    if (stageState === 'opened' && cardRef.current) {
      if (deltaY > 0) {
        dragInfo.current.currentDeltaY = Math.min(deltaY, 200);
        const progress = dragInfo.current.currentDeltaY / 200;
        const zOffset = 2 + progress * 88;
        const yOffset = -26 * (1 - progress);
        cardRef.current.style.transition = 'none';
        cardRef.current.style.transform = `translateZ(${zOffset}px) translateY(${yOffset}px) scale(${1 + progress * 0.03})`;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDragging) return;
    dragInfo.current.isDragging = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (cardRef.current) {
      cardRef.current.style.transition = '';
      cardRef.current.style.transform = '';
    }

    if (dragInfo.current.hasDragged) {
      if (stageState === 'opened') {
        if (dragInfo.current.currentDeltaY > 40) {
          triggerExtract();
        }
      } else if (stageState === 'extracted') {
        if (dragInfo.current.currentDeltaY < -40) {
          triggerExtract();
        }
      }
    } else {
      if (stageState === 'opened') {
        triggerExtract();
      } else if (stageState === 'extracted') {
        toggleFlip();
      }
    }
    dragInfo.current.currentDeltaY = 0;
  };

  const handleReplay = () => {
    setStageState('init');
    setActiveTab('card');
    setIsFlipped(false);
    setTimeout(() => {
      setStageState('entered');
    }, 400);
  };

  const getHolderClasses = () => {
    const classes = [styles.holderWrap];
    if (stageState !== 'init') classes.push(styles.entered);
    if (stageState === 'opened' || stageState === 'extracting' || stageState === 'extracted' || stageState === 'tucking') {
      classes.push(styles.opened);
    }
    if (stageState === 'extracting') {
      classes.push(styles.cardExtracting, styles.cardExtracted);
    } else if (stageState === 'extracted') {
      classes.push(styles.cardExtracted);
    } else if (stageState === 'tucking') {
      classes.push(styles.cardTucking);
    }
    if (stageState === 'closing') {
      classes.push(styles.closing);
    }
    if (activeTab === 'creds') {
      classes.push(styles.showCreds);
    }
    return classes.join(' ');
  };

  const getPassCardClasses = () => {
    const classes = [styles.passCard];
    if (isFlipped) classes.push(styles.isFlipped);
    return classes.join(' ');
  };

  return (
    <div className={styles.stageContainer}>
      {/* SVG Mask Definition for Clean Blind Debossed Leather Mark */}
      <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <mask id="leads-deboss-mask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
            <image href="/card/leads-logo-clean.png" width="1" height="1" preserveAspectRatio="xMidYMid meet" />
          </mask>
        </defs>
      </svg>

      {/* Top Status Bar & Controls */}
      <div className={styles.headerPanel}>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot} />
          <span>
            {stageState === 'init' && 'Minting Credentials...'}
            {stageState === 'entered' && 'Tap leather holder to open'}
            {stageState === 'opened' && 'Tap card to pull forward'}
            {stageState === 'extracting' && 'Extracting card...'}
            {stageState === 'extracted' &&
              (isFlipped ? 'Viewing Back Details (5 Fields) · Tap to Flip ↻' : 'Card Ready · Tap card to flip ↻')}
            {stageState === 'tucking' && 'Tucking card back...'}
            {stageState === 'closing' && 'Closing leather holder...'}
          </span>
        </div>

        {(stageState === 'opened' || stageState === 'extracted' || stageState === 'extracting') && (
          <div className={styles.mobileFlapToggle}>
            <button
              type="button"
              className={`${styles.flapTab} ${activeTab === 'card' ? styles.flapTabActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('card');
              }}
            >
              💳 Keycard
            </button>
            <button
              type="button"
              className={`${styles.flapTab} ${activeTab === 'creds' ? styles.flapTabActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('creds');
              }}
            >
              📋 Credentials
            </button>
          </div>
        )}
      </div>

      {/* 3D Experience Stage */}
      <div className={styles.experienceStage}>
        <div
          className={getHolderClasses()}
          onPointerDown={handleHolderPointerDown}
          onPointerMove={handleHolderPointerMove}
          onPointerUp={handleHolderPointerUp}
          onPointerCancel={handleHolderPointerUp}
          style={{
            '--card-extract-duration': `${CARD_EXTRACT_DURATION}ms`,
            '--card-tuck-duration': `${CARD_TUCK_DURATION}ms`,
            '--cover-open-duration': `${COVER_OPEN_DURATION}ms`,
            '--cover-close-duration': `${COVER_CLOSE_DURATION}ms`,
          } as React.CSSProperties}
        >
          {/* Base Body & Inside Right Pocket */}
          <div className={`${styles.holderBase} ${styles.leatherTexture}`}>
            <div className={styles.baseStitch} />

            {/* Pass Card with 3D Flip Engine */}
            <div
              ref={cardRef}
              className={getPassCardClasses()}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              title="Click or drag to pull / flip card"
            >
              <div className={styles.passInner}>
                {/* FRONT FACE */}
                <div className={`${styles.passFace} ${styles.passFront}`}>
                  {/* Luxury Holographic Foil Shimmer */}
                  <div className={styles.holographicFoil} />

                  <div>
                    <div className={styles.passHeader}>
                      <img src="/card/leads-logo.png" alt="LEADS Logo" className={styles.passMiniLogo} />
                      <span className={styles.passBadgePill}>EXECUTIVE PASS</span>
                    </div>

                    {/* Member Photo & Executive Identity */}
                    <div className={styles.passAvatarArea}>
                      <div className={styles.passPhotoWrap}>
                        {photoUrl ? (
                          <img src={photoUrl} alt={memberName} className={styles.passPhotoImage} />
                        ) : (
                          <div className={styles.passPhotoInitials}>{memberInitials}</div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={styles.passLabel}>{memberRole}</div>
                        <div className={styles.passName} style={{ fontSize: '15px' }}>{memberName}</div>
                      </div>
                      <img src="/card/leads-logo-clean.png" alt="LEADS RUAS" className={styles.passSideLogo} />
                    </div>

                    <div className={styles.passGrid}>
                      <div>
                        <div className={styles.passLabel}>Phone Number</div>
                        <div className={styles.passVal}>{phone || '—'}</div>
                      </div>
                      <div>
                        <div className={styles.passLabel}>Email ID</div>
                        <div className={styles.passVal} title={email}>{email}</div>
                      </div>
                    </div>

                    <div className={styles.passQrBox}>
                      <img src={dynamicQrUrl || qrUrl || '/card/leads-qr-code.png'} alt="Card QR Code" />
                    </div>
                  </div>


                  <div className={styles.passCardFooter}>
                    <div className={styles.flipAffordanceHint}>
                      <span>↻</span>
                      <span>Tap to Flip for 5 Verification Fields</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8.5px' }}>
                      <span>💳</span>
                      <span>{issuingAuthority}</span>
                    </div>
                  </div>
                </div>

                {/* BACK FACE */}
                <div className={`${styles.passFace} ${styles.passBack}`}>
                  <div className={styles.passBackHeader}>
                    <div>
                      <div className={styles.passLabel}>EXECUTIVE CREDENTIALS</div>
                      <div className={styles.passBackTitle}>LEADS Pass Info</div>
                    </div>
                    <button className={styles.btnFlipPill} onClick={toggleFlip} title="Flip to front">
                      <span>↺</span>
                      <span>Front</span>
                    </button>
                  </div>

                  <div className={styles.passBackFields}>
                    <div className={styles.backFieldRow}>
                      <span className={styles.backFieldLabel}>1. Access Level</span>
                      <span className={styles.backFieldVal}>{accessLevel}</span>
                    </div>
                    <div className={styles.backFieldRow}>
                      <span className={styles.backFieldLabel}>2. Pass Serial ID</span>
                      <span className={styles.backFieldVal}>{formattedSerial}</span>
                    </div>
                    <div className={styles.backFieldRow}>
                      <span className={styles.backFieldLabel}>3. Validity Period</span>
                      <span className={styles.backFieldVal}>{formattedValidity}</span>
                    </div>
                    <div className={styles.backFieldRow}>
                      <span className={styles.backFieldLabel}>4. Issuing Authority</span>
                      <span className={styles.backFieldVal}>{issuingAuthority}</span>
                    </div>
                    <div className={styles.backFieldRow}>
                      <span className={styles.backFieldLabel}>5. Terms & Entry Verification</span>
                      <p className={styles.backNoticeText}>
                        Scan front QR code at entry turnstiles. Non-transferable pass.
                      </p>
                    </div>
                  </div>

                  <div className={styles.passBackFooter}>
                    <span>© 2026 {issuingAuthority}</span>
                    <span>Tap card to flip</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Curved Die-Cut Leather Pocket Sleeve */}
            <div className={styles.curvedPocketSleeve}>
              <div className={styles.curvedPocketStitch} />
              <div className={styles.pocketFooterContent}>
                <div className={styles.pocketBrandLabel}>
                  <svg className={styles.pocketIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>Pass Holder</span>
                </div>
                {stageState !== 'extracted' && stageState !== 'extracting' && (
                  <span className={styles.tapHintPill}>Tap Card &uarr;</span>
                )}
              </div>
            </div>
          </div>

          {/* 3D Flipping Leather Front Cover Leaf */}
          <div className={styles.coverLeaf}>
            {/* Front Side: True Physical Blind Debossed Leather Logo */}
            <div className={styles.coverFront}>
              <div className={styles.coverStitch} />
              <div className={styles.debossedLeatherMark} aria-label="LEADS Next Gen Centre">
                <div className={styles.debossCavity} />
                <div className={styles.debossShadowBevel} />
                <div className={styles.debossHighlightBevel} />
              </div>
              <div className={styles.coverPrompt}>Tap to Open &rarr;</div>
            </div>

            {/* Back Side: Interior Left Flap */}
            <div
              className={styles.coverBack}
              onClick={() => {
                if (stageState === 'opened') setActiveTab('creds');
              }}
            >
              <div className={styles.coverBackStitch} />
              <div className={styles.leftPanelHeader}>
                <div>
                  <div className={styles.leftPanelTitle}>LEADS Centre</div>
                  <div className={styles.leftPanelSub}>Executive Pass</div>
                </div>
                <span className={styles.leftBadgeTag}>Official</span>
              </div>

              <div className={styles.leftFormFields}>
                <div className={styles.formSlot}>
                  <span className={styles.formSlotLabel}>Member Name</span>
                  <div className={styles.formSlotPill}>{memberName}</div>
                </div>
                <div className={styles.formSlot}>
                  <span className={styles.formSlotLabel}>Designation / Role</span>
                  <div className={styles.formSlotPill}>{memberRole}</div>
                </div>
                <div className={styles.formSlot}>
                  <span className={styles.formSlotLabel}>Phone</span>
                  <div className={styles.formSlotPill}>{phone || '—'}</div>
                </div>
                <div className={styles.formSlot}>
                  <span className={styles.formSlotLabel}>Email</span>
                  <div className={styles.formSlotPill}>{email}</div>
                </div>
              </div>

              <div className={styles.leftPanelFooter}>
                M. S. Ramaiah University of Applied Sciences<br />
                New BEL Road, MSR Nagar, Bengaluru - 560054
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Panel */}
      {showActions && (
        <div className={styles.actionsPanel}>
          <button className={styles.btnAction} onClick={handleReplay}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Replay
          </button>

          {onSaveContact && (
            <button className={styles.btnAction} onClick={onSaveContact}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Save Contact
            </button>
          )}

          {onAddToAppleWallet && (
            <button
              className={`${styles.btnAction} ${styles.btnWallet}`}
              onClick={onAddToAppleWallet}
              disabled={isGeneratingWallet}
            >
              {isGeneratingWallet ? 'Generating Pass…' : 'Apple / Google Wallet'}
            </button>
          )}
        </div>
      )}

      {walletError && (
        <p style={{ color: '#f87171', fontSize: '11px', marginTop: '6px' }}>{walletError}</p>
      )}
    </div>
  );
}

export default InteractiveKeycardHolder;
