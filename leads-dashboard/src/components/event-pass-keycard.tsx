'use client';

import React from 'react';
import { InteractiveKeycardHolder } from '@/components/interactive-keycard-holder';
import { EventPassItem, PassTheme, formatValidDaysLabel, getPassValidDays } from '@/lib/local-data';

export type KeycardPass = Pick<EventPassItem, 'attendeeName' | 'passType' | 'serialNumber'> &
  Partial<Pick<EventPassItem,
    'eventName' | 'eventDate' | 'eventVenue' | 'guestCategory' | 'roomOrVenue' | 'attendeeOrg' | 'validityDate' |
    'validDays' | 'passColor' | 'passGradient' | 'textColor' | 'labelColor'>>;

/**
 * THE issued pass design. Used by the public /pass/<serial> page, the Studio's live preview and the Edit Pass
 * dialog, so what a designer sees while building is exactly what the recipient gets.
 */
export function EventPassKeycard({
  pass,
  theme,
  origin,
  ...holderProps
}: {
  pass: KeycardPass;
  theme?: PassTheme;
  origin?: string;
} & Partial<React.ComponentProps<typeof InteractiveKeycardHolder>>) {
  const venue = pass.roomOrVenue || pass.eventVenue || 'Main Auditorium';
  const days = getPassValidDays({ validDays: pass.validDays });
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return (
    <InteractiveKeycardHolder
      isEventPass
      memberName={pass.attendeeName}
      memberRole={`${pass.passType}${pass.guestCategory ? ` • ${pass.guestCategory}` : ''}`}
      phone=""
      email=""
      serialNumber={pass.serialNumber}
      eventName={pass.eventName}
      eventDate={pass.eventDate}
      passType={String(pass.passType)}
      guestCategory={pass.guestCategory}
      roomOrVenue={venue}
      attendeeOrg={pass.attendeeOrg || ''}
      accessLevel={`${pass.passType} — ${venue}`}
      validityPeriod={days.length > 0 ? formatValidDaysLabel(days) : pass.validityDate || pass.eventDate || '2026'}
      issuingAuthority={pass.eventName ? `${pass.eventName} • RUAS` : 'LEADS Next Gen Centre • RUAS'}
      brandHeader="LEADS Next Gen Centre"
      passColor={pass.passColor}
      passGradient={pass.passGradient}
      theme={{
        ...(theme || {}),
        ...(pass.textColor ? { foregroundColor: pass.textColor } : {}),
        ...(pass.labelColor ? { labelColor: pass.labelColor } : {}),
      }}
      cardUrl={`${base}/pass/${pass.serialNumber}`}
      qrUrl="/card/leads-qr-code.png"
      {...holderProps}
    />
  );
}
