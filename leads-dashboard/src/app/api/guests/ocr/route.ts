import { NextResponse } from 'next/server';
import { performCardOcr } from '@/lib/visiting-card-ocr';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function base64ToBuffer(dataUrl: string): Buffer {
  const base64Data = dataUrl.replace(/^data:(image\/\w+|application\/pdf);base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.frontData || typeof body.frontData !== 'string') {
      return NextResponse.json({ error: 'Front card photo is required for OCR scanning.' }, { status: 400 });
    }

    const frontBuffer = base64ToBuffer(body.frontData);
    if (frontBuffer.length > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Front card image exceeds the 10 MB maximum limit.' }, { status: 400 });
    }

    let backBuffer: Buffer | undefined;
    if (body.backData && typeof body.backData === 'string' && body.backData.startsWith('data:')) {
      const bBuffer = base64ToBuffer(body.backData);
      if (bBuffer.length <= MAX_FILE_SIZE_BYTES) {
        backBuffer = bBuffer;
      }
    }

    const extracted = await performCardOcr(frontBuffer, backBuffer);
    return NextResponse.json(extracted);
  } catch (err: any) {
    console.error('OCR Card Scan Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to scan visiting card image.' }, { status: 500 });
  }
}
