import { NextResponse } from 'next/server';
import { mutateCollection } from '@/lib/server-db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    let found = false;
    const updated = await mutateCollection('reimbursements', (current) =>
      current.map((item: any) => {
        if (item.id === id) { found = true; return { ...item, ...updates }; }
        return item;
      })
    );
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated.find((r: any) => r.id === id));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let found = false;
    await mutateCollection('reimbursements', (current) => {
      const filtered = current.filter((r: any) => r.id !== id);
      found = filtered.length < current.length;
      return filtered;
    });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
