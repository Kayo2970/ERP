import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/api-error';
import { EventPassItem } from '@/lib/local-data';
import { purgeEventPassArtifacts } from '@/lib/cascade-delete';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; passId: string }> }
) {
  try {
    await requireSession(request);
    const { passId } = await params;

    const passes = await readCollection<EventPassItem>('event_passes');
    const target = passes.find((p) => p.id === passId || p.serialNumber === passId);
    if (!target) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
    }

    await mutateCollection<EventPassItem>('event_passes', (current = []) =>
      current.filter((p) => p.id !== passId && p.serialNumber !== passId)
    );

    await purgeEventPassArtifacts(target);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return apiError(err, 'event-passes-delete', 500);
  }
}
