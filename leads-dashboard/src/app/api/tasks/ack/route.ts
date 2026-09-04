import { NextResponse } from 'next/server';
import { readCollection, mutateCollection } from '@/lib/server-db';
import { requireSession } from '@/lib/session';
import { canChangeTaskStatus, getAccessLevelSettingsServer } from '@/lib/permissions-server';
import { apiError } from '@/lib/api-error';

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

    // mutateCollection's mutator must be synchronous, but canChangeTaskStatus
    // (committee-assignee branch) needs to read the events collection — so
    // resolve which of the requested ids the caller may actually act on
    // first, then apply that precomputed allow-set inside the mutator.
    const idSet = new Set(taskIds.map(id => String(id).trim()));
    const existingTasks = await readCollection<any>('tasks');
    const allowedIds = new Set<string>();
    for (const task of existingTasks) {
      if (idSet.has(task.id) && await canChangeTaskStatus(task, actor, settings)) {
        allowedIds.add(task.id);
      }
    }

    await mutateCollection('tasks', (current: any[]) => {
      return current.map(task => {
        // Only acknowledge tasks the caller is actually allowed to act on —
        // requested ids that aren't theirs pass through unchanged rather than
        // failing the whole batch.
        if (allowedIds.has(task.id)) {
          const updated = {
            ...task,
            acknowledged: true,
            acknowledgedAt: task.acknowledgedAt || now,
            acknowledgedByEmail: email || task.assigneeEmail || task.acknowledgedByEmail,
          };
          updatedTasks.push(updated);
          return updated;
        }
        return task;
      });
    });

    return NextResponse.json({
      message: `Successfully acknowledged ${updatedTasks.length} task(s).`,
      acknowledgedCount: updatedTasks.length,
      tasks: updatedTasks,
    });
  } catch (err: any) {
    return apiError(err, 'tasks-ack-api-post', 500);
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

    const idSet = new Set(taskIds);
    const existingTasks = await readCollection<any>('tasks');
    const allowedIds = new Set<string>();
    for (const task of existingTasks) {
      if (idSet.has(task.id) && await canChangeTaskStatus(task, actor, settings)) {
        allowedIds.add(task.id);
      }
    }

    await mutateCollection('tasks', (current: any[]) => {
      return current.map(task => {
        if (allowedIds.has(task.id)) {
          const updated = {
            ...task,
            acknowledged: true,
            acknowledgedAt: task.acknowledgedAt || now,
            acknowledgedByEmail: email || task.assigneeEmail || task.acknowledgedByEmail,
          };
          updatedTasks.push(updated);
          return updated;
        }
        return task;
      });
    });

    return NextResponse.json({
      message: `Successfully acknowledged ${updatedTasks.length} task(s).`,
      acknowledgedCount: updatedTasks.length,
      tasks: updatedTasks,
    });
  } catch (err: any) {
    return apiError(err, 'tasks-ack-api-get', 500);
  }
}
