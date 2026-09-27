import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession, requirePermission } from '@/lib/session';
import { canEvaluateEventStudent, getAccessLevelSettingsServer, isFaculty, isSocialMediaTeamMember, isSocialMediaPostTask } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await readCollection('ratings');
    return NextResponse.json(items);
  } catch (err: any) {
    return apiError(err, 'ratings-api-get', 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    const settings = await getAccessLevelSettingsServer();
    requirePermission(await canEvaluateEventStudent(actor, settings), 'You do not have permission to submit ratings.');
    const item = await request.json();

    const members = await readCollection<any>('members');
    const targetMember = members.find((m: any) => m.id === item.targetId || (m.name && m.name.toLowerCase() === (item.targetName || '').toLowerCase()));
    if ((targetMember && isFaculty(targetMember)) || /prof\.|professor|faculty/i.test(item.targetName || '')) {
      return NextResponse.json({ error: 'Professors and faculty members cannot receive performance ratings.' }, { status: 400 });
    }
    if (item.taskId) {
      const tasks = await readCollection<any>('tasks');
      const task = tasks.find((t: any) => t.id === item.taskId);
      if (task && isSocialMediaPostTask(task)) {
        if (!targetMember || !isSocialMediaTeamMember(targetMember)) {
          return NextResponse.json({ error: 'Only student members of the Social Media team can be evaluated for social media posts.' }, { status: 400 });
        }
      }
    }

    const updated = await mutateCollection('ratings', (current) => [item, ...current]);
    const created = updated.find((r: any) => r.id === item.id);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return apiError(err, 'ratings-api-post', 400);
  }
}
