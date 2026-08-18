import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await mutateCollection('designs', (current) => {
      const idx = current.findIndex((d: any) => d.id === id);
      if (idx === -1) return current;
      current[idx] = { ...current[idx], ...body };
      return [...current];
    });

    const target = updated.find((d: any) => d.id === id);
    if (!target) {
      return NextResponse.json({ error: 'Design submission not found' }, { status: 404 });
    }

    return NextResponse.json(target);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await mutateCollection('designs', (current) =>
      current.filter((d: any) => d.id !== id)
    );
    return NextResponse.json({ success: true, count: updated.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
