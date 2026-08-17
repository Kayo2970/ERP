import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';

export async function GET() {
  const members = await readCollection('members');
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  try {
    const member = await request.json();
    const updated = await mutateCollection('members', (current) => {
      // Check for duplicate email
      if (current.some((m: any) => m.email?.toLowerCase() === member.email?.toLowerCase())) {
        throw new Error(`Member with email ${member.email} already exists`);
      }
      return [...current, member];
    });
    const created = updated.find((m: any) => m.id === member.id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
