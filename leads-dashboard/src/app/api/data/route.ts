import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

// Ensure database file exists
function readDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return null;
}

function writeDatabase(data: any) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to database file:', err);
    return false;
  }
}

export async function GET() {
  const db = readDatabase();
  if (db) {
    return NextResponse.json(db);
  }
  return NextResponse.json({ error: 'Database not initialized' }, { status: 404 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = readDatabase() || {};
    
    // Merge existing database with updated collections
    const updated = {
      ...existing,
      ...body,
      lastUpdated: new Date().toISOString()
    };

    const success = writeDatabase(updated);
    if (success) {
      return NextResponse.json({ success: true, lastUpdated: updated.lastUpdated });
    }
    return NextResponse.json({ error: 'Failed to write to database file' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid payload' }, { status: 400 });
  }
}
