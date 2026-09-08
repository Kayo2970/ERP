import { NextResponse } from 'next/server';
import { readCollection } from '@/lib/server-db';

// Escapes a value for use inside a VCARD 3.0 text field (RFC 6350 §3.4):
// backslash, comma, semicolon and newline must be backslash-escaped.
function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const members = await readCollection<any>('members');
  const member = members.find((m) => m.cardSlug === slug);

  if (!member || !member.cardEnabled || member.status === 'Terminated') {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const nameParts = (member.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');
  const socials = member.cardSocials || {};

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardText(lastName)};${escapeVCardText(firstName)};;;`,
    `FN:${escapeVCardText(member.name || '')}`,
    'ORG:LEADS Next Gen Centre',
  ];
  if (member.cardDesignation || member.role) {
    lines.push(`TITLE:${escapeVCardText(member.cardDesignation || member.role)}`);
  }
  if (member.cardPhone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCardText(member.cardPhone)}`);
  }
  if (member.email) {
    lines.push(`EMAIL:${escapeVCardText(member.email)}`);
  }
  if (socials.linkedin) lines.push(`URL;TYPE=LinkedIn:${escapeVCardText(socials.linkedin)}`);
  if (socials.instagram) lines.push(`URL;TYPE=Instagram:${escapeVCardText(socials.instagram)}`);
  if (socials.twitter) lines.push(`URL;TYPE=Twitter:${escapeVCardText(socials.twitter)}`);
  if (socials.website) lines.push(`URL;TYPE=Website:${escapeVCardText(socials.website)}`);
  if (member.cardBio) lines.push(`NOTE:${escapeVCardText(member.cardBio)}`);
  lines.push('END:VCARD');

  const body = lines.join('\r\n') + '\r\n';

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.vcf"`,
    },
  });
}
