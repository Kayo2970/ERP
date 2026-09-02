import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { saveBase64File } from '@/lib/file-storage';

export const maxDuration = 60; // 60s execution limit for large uploads (up to 25 MB)

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function GET() {
  const items = await readCollection('eventReports');
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const item = await request.json();

    if (!item.eventId || !item.fileName || !item.fileSize) {
      return NextResponse.json({ error: 'Event, file name, and file size are required.' }, { status: 400 });
    }
    if (item.fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size exceeds the maximum limit of 25 MB.' }, { status: 400 });
    }

    const id = item.id || 'evrep_' + Date.now();
    const newReport = { ...item, id };

    if (typeof newReport.fileData === 'string' && newReport.fileData.startsWith('data:')) {
      const stored = await saveBase64File('event-reports', id, 0, newReport.fileName, newReport.fileData);
      newReport.fileUrl = stored.url;
      newReport.storageKey = stored.storageKey;
      newReport.fileSize = stored.size;
      delete newReport.fileData;
    }

    const updated = await mutateCollection('eventReports', (current) => [newReport, ...(current || [])]);
    const created = updated.find((r: any) => r.id === id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
