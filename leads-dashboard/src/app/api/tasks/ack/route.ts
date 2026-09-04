import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession, sessionErrorStatus } from '@/lib/session';
import { canChangeTaskStatus, getAccessLevelSettingsServer } from '@/lib/permissions-server';

export async function POST(request: Request) {
  try {
    const actor = await requireSession(request);
    const { taskIds, email } = await request.json();

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'taskIds array is required.' }, { status: 400 });
    }

    const settings = await getAccessLevelSettingsServer();
    const now = new Date().toISOString();
    const updatedTasks: any[] = [];

    await mutateCollection('tasks', async (current: any[]) => {
      const idSet = new Set(taskIds.map(id => String(id).trim()));
      const next: any[] = [];
      for (const task of current) {
        // Only acknowledge tasks the caller is actually allowed to act on —
        // requested ids that aren't theirs pass through unchanged rather than
        // failing the whole batch.
        if (idSet.has(task.id) && await canChangeTaskStatus(task, actor, settings)) {
          const updated = {
            ...task,
            acknowledged: true,
            acknowledgedAt: task.acknowledgedAt || now,
            acknowledgedByEmail: email || task.assigneeEmail || task.acknowledgedByEmail,
          };
          updatedTasks.push(updated);
          next.push(updated);
        } else {
          next.push(task);
        }
      }
      return next;
    });

    return NextResponse.json({
      message: `Successfully acknowledged ${updatedTasks.length} task(s).`,
      acknowledgedCount: updatedTasks.length,
      tasks: updatedTasks,
    });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message || 'Failed to acknowledge tasks.' }, { status: status || 500 });
  }
}

export async function GET(request: Request) {
  try {
    const actor = await requireSession(request);
    const { searchParams } = new URL(request.url);
    const ack = searchParams.get('ack') || searchParams.get('id');
    const email = searchParams.get('email');

    if (!ack) {
      return NextResponse.json({ error: 'No task IDs provided in ack query parameter.' }, { status: 400 });
    }

    const settings = await getAccessLevelSettingsServer();
    const taskIds = ack.split(',').map(id => id.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const updatedTasks: any[] = [];

    await mutateCollection('tasks', async (current: any[]) => {
      const idSet = new Set(taskIds);
      const next: any[] = [];
      for (const task of current) {
        if (idSet.has(task.id) && await canChangeTaskStatus(task, actor, settings)) {
          const updated = {
            ...task,
            acknowledged: true,
            acknowledgedAt: task.acknowledgedAt || now,
            acknowledgedByEmail: email || task.assigneeEmail || task.acknowledgedByEmail,
          };
          updatedTasks.push(updated);
          next.push(updated);
        } else {
          next.push(task);
        }
      }
      return next;
    });

    return NextResponse.json({
      message: `Successfully acknowledged ${updatedTasks.length} task(s).`,
      acknowledgedCount: updatedTasks.length,
      tasks: updatedTasks,
    });
  } catch (err: any) {
    const status = sessionErrorStatus(err);
    return NextResponse.json({ error: err.message || 'Failed to acknowledge tasks.' }, { status: status || 500 });
  }
}
