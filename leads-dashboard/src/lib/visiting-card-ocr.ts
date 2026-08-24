import path from 'path';
import { createWorker, type Worker } from 'tesseract.js';

const OCR_CACHE_DIR = path.join(process.cwd(), 'data', 'ocr-cache');

let workerPromise: Promise<Worker> | null = null;
async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', undefined, {
      cachePath: OCR_CACHE_DIR,
    }).catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

export interface ExtractedCardDetails {
  name: string;
  organization: string;
  designation: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  linkedin: string;
  notes: string;
  rawText: string;
}

const DESIGNATION_KEYWORDS = [
  'director', 'manager', 'executive', 'officer', 'founder', 'co-founder',
  'ceo', 'cto', 'cfo', 'coo', 'cio', 'president', 'vice president', 'vp',
  'consultant', 'engineer', 'developer', 'specialist', 'lead', 'head',
  'architect', 'designer', 'analyst', 'professor', 'prof', 'dean', 'principal',
  'trustee', 'chairman', 'chairperson', 'secretary', 'advisor', 'partner',
  'associate', 'coordinator', 'head of', 'chief', 'registrar', 'chancellor',
  'superintendent', 'administrator', 'hod'
];

const ORG_MARKERS = [
  'pvt', 'ltd', 'limited', 'inc', 'incorporated', 'corp', 'corporation',
  'company', 'technologies', 'tech', 'solutions', 'services', 'group',
  'systems', 'enterprise', 'enterprises', 'labs', 'laboratory', 'studio',
  'university', 'institute', 'college', 'foundation', 'agency', 'ventures',
  'industries', 'global', 'software', 'pvt.', 'ltd.', 'inc.', 'co.', 'hospital',
  'clinic', 'school', 'academy', 'trust', 'society', 'council', 'federation'
];

const ADDRESS_KEYWORDS = [
  'road', 'rd', 'street', 'st', 'avenue', 'ave', 'block', 'sector',
  'floor', 'suite', 'building', 'complex', 'area', 'nagar', 'layout',
  'district', 'city', 'state', 'pincode', 'pin', 'zip', 'india',
  'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'chennai',
  'kolkata', 'pune', 'ahmedabad', 'gurgaon', 'noida', 'karnataka', 'maharashtra'
];

/** Parse raw text extracted from visiting card images into structured fields */
export function parseVisitingCardText(rawText: string): ExtractedCardDetails {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let email = '';
  let website = '';
  let linkedin = '';
  let phone = '';
  let designation = '';
  let organization = '';
  let name = '';
  const addressLines: string[] = [];
  const unusedLines: string[] = [];

  // 1. Extract Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const emailMatch = rawText.match(emailRegex);
  if (emailMatch && emailMatch.length > 0) {
    email = emailMatch[0].toLowerCase()
      .replace(/gmai1\.com$/i, 'gmail.com')
      .replace(/gmaiI\.com$/i, 'gmail.com')
      .replace(/yaoo\.com$/i, 'yahoo.com')
      .replace(/outl0ok\.com$/i, 'outlook.com');
  }

  // 2. Extract LinkedIn
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;
  const linkedinMatch = rawText.match(linkedinRegex);
  if (linkedinMatch && linkedinMatch.length > 0) {
    linkedin = linkedinMatch[0];
  }

  // 3. Extract Website
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
  const webMatches = rawText.match(websiteRegex) || [];
  for (const match of webMatches) {
    if (match.toLowerCase().includes('@') || match.toLowerCase().includes('linkedin.com')) continue;
    if (/^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.(com|org|net|in|co|io|ai|edu|gov|ac\.in|co\.in|org\.in)$/i.test(match) || match.startsWith('www.')) {
      website = match;
      break;
    }
  }

  // 4. Extract Phone (Supports Indian +91, landline 080-, 10-digit mobile numbers)
  const phoneRegex = /(?:\+?91[\s.-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}|\b[6789]\d{9}\b/g;
  const phoneMatches = rawText.match(phoneRegex) || [];
  for (const p of phoneMatches) {
    const digits = p.replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 13) {
      phone = p.trim();
      break;
    }
  }

  // Process line by line for Name, Designation, Organization, and Address
  for (const line of lines) {
    const lower = line.toLowerCase();

    // Skip lines that are purely contacts/links already extracted
    if (email && lower.includes(email)) continue;
    if (website && lower.includes(website.toLowerCase())) continue;
    if (linkedin && lower.includes(linkedin.toLowerCase())) continue;
    if (/^(tel|phone|mob|mobile|cell|fax|mail|email|web|website|site|address|location|add):/i.test(line)) {
      if (/^(address|location|add):/i.test(line)) {
        addressLines.push(line.replace(/^(address|location|add):/i, '').trim());
      }
      continue;
    }

    // Check Designation
    if (!designation && DESIGNATION_KEYWORDS.some((kw) => lower.includes(kw))) {
      designation = line;
      continue;
    }

    // Check Organization
    if (!organization && ORG_MARKERS.some((marker) => new RegExp(`\\b${marker}\\b`, 'i').test(lower))) {
      organization = line;
      continue;
    }

    // Check Address
    const hasPinCode = /\b\d{5,6}\b/.test(line);
    const hasAddressKw = ADDRESS_KEYWORDS.some((kw) => lower.includes(kw));
    if (hasPinCode || hasAddressKw) {
      addressLines.push(line);
      continue;
    }

    // Check Name candidate
    if (!name) {
      if (/visiting card|business card|identity card|card/i.test(lower)) continue;

      // Clean honorifics
      const cleaned = line.replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.|eng\.|er\.|adv\.|shri|smt\.|ca|cs)\s+/i, '').trim();
      const words = cleaned.split(/\s+/);
      if (words.length >= 1 && words.length <= 4 && words.every((w) => /^[A-Za-z.'-]+$/.test(w))) {
        name = line;
        continue;
      }
    }

    unusedLines.push(line);
  }

  // Fallback for organization if top line is uppercase/title
  if (!organization && unusedLines.length > 0) {
    const candidate = unusedLines[0];
    if (candidate !== name && candidate.length > 2 && candidate.length < 60) {
      organization = candidate;
      unusedLines.shift();
    }
  }

  const address = addressLines.join(', ');
  const notes = unusedLines.length > 0 ? `OCR Extracted Context:\n${unusedLines.join('\n')}` : '';

  return {
    name: name.trim(),
    organization: organization.trim(),
    designation: designation.trim(),
    phone: phone.trim(),
    email: email.trim(),
    website: website.trim(),
    address: address.trim(),
    linkedin: linkedin.trim(),
    notes: notes.trim(),
    rawText: rawText.trim(),
  };
}

function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.subarray(0, 4).toString('utf-8') === '%PDF';
}

async function convertPdfToImageBuffers(pdfBuffer: Buffer): Promise<Buffer[]> {
  const { createCanvas } = await import('@napi-rs/canvas');
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    standardFontDataUrl: path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts') + path.sep,
  });
  const pdf = await loadingTask.promise;
  const pageCount = Math.min(pdf.numPages, 2);

  const pages: Buffer[] = [];
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    // @ts-expect-error context type match for pdfjs-dist
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push(canvas.encodeSync('png'));
  }

  await loadingTask.destroy();
  return pages;
}

/** Pre-process image buffer using Canvas: upscale to >= 1800px, boost contrast, and generate dark-card auto-inversion */
async function preprocessCardImageBuffer(inputBuffer: Buffer): Promise<{ normal: Buffer; inverted: Buffer }> {
  const { createCanvas, loadImage } = await import('@napi-rs/canvas');
  const img = await loadImage(inputBuffer);

  const minWidth = 1800;
  const scale = img.width < minWidth ? minWidth / img.width : 1;
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Calculate average luminance to detect dark-background cards
  let totalLuminance = 0;
  const numPixels = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
  }
  const avgBrightness = totalLuminance / numPixels;
  const isDarkTheme = avgBrightness < 128;

  const normalCanvas = createCanvas(width, height);
  const normalCtx = normalCanvas.getContext('2d');
  const normalData = normalCtx.createImageData(width, height);

  const invertedCanvas = createCanvas(width, height);
  const invertedCtx = invertedCanvas.getContext('2d');
  const invertedData = invertedCtx.createImageData(width, height);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const contrasted = gray > 180 ? 255 : gray < 70 ? 0 : Math.round((gray - 70) * (255 / 110));

    normalData.data[i] = contrasted;
    normalData.data[i + 1] = contrasted;
    normalData.data[i + 2] = contrasted;
    normalData.data[i + 3] = a;

    const inv = 255 - contrasted;
    invertedData.data[i] = inv;
    invertedData.data[i + 1] = inv;
    invertedData.data[i + 2] = inv;
    invertedData.data[i + 3] = a;
  }

  normalCtx.putImageData(normalData, 0, 0);
  invertedCtx.putImageData(invertedData, 0, 0);

  return {
    normal: isDarkTheme ? invertedCanvas.encodeSync('png') : normalCanvas.encodeSync('png'),
    inverted: isDarkTheme ? normalCanvas.encodeSync('png') : invertedCanvas.encodeSync('png'),
  };
}

/** Optional Multimodal Gemini Vision AI OCR execution */
async function tryGeminiVisionOcr(frontBuffer: Buffer, backBuffer?: Buffer): Promise<ExtractedCardDetails | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const parts: any[] = [
      {
        text: `You are an expert visiting card OCR and entity parsing system.
Analyze the visiting card image(s) provided and extract contact details into JSON:
- "name": Full name
- "organization": Company, University, or Institution name
- "designation": Job title / role
- "phone": Primary contact phone number
- "email": Primary email address
- "website": Website URL
- "address": Address or location
- "linkedin": LinkedIn link
- "notes": Any other text on the card

Respond strictly with valid JSON inside a \`\`\`json block.`
      },
      {
        inline_data: {
          mime_type: isPdfBuffer(frontBuffer) ? 'application/pdf' : 'image/png',
          data: frontBuffer.toString('base64'),
        }
      }
    ];

    if (backBuffer) {
      parts.push({
        inline_data: {
          mime_type: isPdfBuffer(backBuffer) ? 'application/pdf' : 'image/png',
          data: backBuffer.toString('base64'),
        }
      });
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const textResp = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = textResp.match(/```json\s*([\s\S]*?)\s*```/) || textResp.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    return {
      name: (parsed.name || '').trim(),
      organization: (parsed.organization || '').trim(),
      designation: (parsed.designation || '').trim(),
      phone: (parsed.phone || '').trim(),
      email: (parsed.email || '').trim(),
      website: (parsed.website || '').trim(),
      address: (parsed.address || '').trim(),
      linkedin: (parsed.linkedin || '').trim(),
      notes: (parsed.notes || '').trim(),
      rawText: textResp,
    };
  } catch (err) {
    console.warn('[Gemini Vision OCR] Error, falling back to local OCR:', err);
    return null;
  }
}

/** Server-side OCR execution for card image/PDF buffer(s) */
export async function performCardOcr(
  frontBuffer: Buffer,
  backBuffer?: Buffer
): Promise<ExtractedCardDetails> {
  // 1. Try Gemini Multimodal AI Vision OCR if GEMINI_API_KEY is configured
  const geminiResult = await tryGeminiVisionOcr(frontBuffer, backBuffer);
  if (geminiResult && (geminiResult.name || geminiResult.email || geminiResult.phone || geminiResult.organization)) {
    return geminiResult;
  }

  // 2. Enhanced Local Pre-processing + Multi-Pass Tesseract OCR
  const worker = await getWorker();

  let frontRawBuffers: Buffer[] = [];
  if (isPdfBuffer(frontBuffer)) {
    frontRawBuffers = await convertPdfToImageBuffers(frontBuffer);
  } else {
    frontRawBuffers = [frontBuffer];
  }

  let combinedText = '';

  for (const rawBuf of frontRawBuffers) {
    try {
      const { normal, inverted } = await preprocessCardImageBuffer(rawBuf);

      const { data: normData } = await worker.recognize(normal);
      if (normData.text) combinedText += '\n' + normData.text;

      const { data: invData } = await worker.recognize(inverted);
      if (invData.text) combinedText += '\n' + invData.text;
    } catch (e) {
      const { data } = await worker.recognize(rawBuf);
      if (data.text) combinedText += '\n' + data.text;
    }
  }

  if (backBuffer) {
    let backRawBuffers: Buffer[] = [];
    if (isPdfBuffer(backBuffer)) {
      backRawBuffers = await convertPdfToImageBuffers(backBuffer);
    } else {
      backRawBuffers = [backBuffer];
    }
    combinedText += '\n--- BACK OF CARD ---\n';
    for (const rawBuf of backRawBuffers) {
      try {
        const { normal, inverted } = await preprocessCardImageBuffer(rawBuf);
        const { data: normData } = await worker.recognize(normal);
        if (normData.text) combinedText += '\n' + normData.text;

        const { data: invData } = await worker.recognize(inverted);
        if (invData.text) combinedText += '\n' + invData.text;
      } catch (e) {
        const { data } = await worker.recognize(rawBuf);
        if (data.text) combinedText += '\n' + data.text;
      }
    }
  }

  return parseVisitingCardText(combinedText);
}
