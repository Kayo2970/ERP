import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { saveBase64File } from '@/lib/file-storage';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET() {
  const guests = await readCollection('guests');
  return NextResponse.json(guests);
}

export async function POST(request: Request) {
  try {
    const guest = await request.json();

    if (!guest.name || !guest.id) {
      return NextResponse.json({ error: 'Guest name and id are required.' }, { status: 400 });
    }

    // Persist the visiting card as a real file on disk under data/uploads/,
    // same as designs and reimbursement receipts — never keep the raw
    // base64 payload inline in guests.json.
    if (typeof guest.visitingCardData === 'string' && guest.visitingCardData.startsWith('data:')) {
      const approxSize = Math.ceil((guest.visitingCardData.length * 3) / 4);
      if (approxSize > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'Visiting card image exceeds the 10 MB maximum limit.' }, { status: 400 });
      }
      const stored = await saveBase64File('guests', guest.id, 0, guest.visitingCardFileName || 'card.jpg', guest.visitingCardData);
      guest.visitingCardUrl = stored.url;
      guest.visitingCardStorageKey = stored.storageKey;
    }
    delete guest.visitingCardData;
    delete guest.visitingCardFileName;

    const updated = await mutateCollection('guests', (current) => {
      const idx = current.findIndex((g: any) => g.id === guest.id);
      if (idx >= 0) {
        current[idx] = guest;
        return [...current];
      }
      return [guest, ...current];
    });

    const created = updated.find((g: any) => g.id === guest.id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
