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
  'associate', 'coordinator', 'head of', 'chief'
];

const ORG_MARKERS = [
  'pvt', 'ltd', 'limited', 'inc', 'incorporated', 'corp', 'corporation',
  'company', 'technologies', 'tech', 'solutions', 'services', 'group',
  'systems', 'enterprise', 'enterprises', 'labs', 'laboratory', 'studio',
  'university', 'institute', 'college', 'foundation', 'agency', 'ventures',
  'industries', 'global', 'software', 'pvt.', 'ltd.', 'inc.'
];

const ADDRESS_KEYWORDS = [
  'road', 'rd', 'street', 'st', 'avenue', 'ave', 'block', 'sector',
  'floor', 'suite', 'building', 'complex', 'area', 'nagar', 'layout',
  'district', 'city', 'state', 'pincode', 'pin', 'zip', 'india',
  'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'chennai'
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
    email = emailMatch[0].toLowerCase();
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
    if (/^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.(com|org|net|in|co|io|ai|edu|gov|ac\.in|co\.in)$/i.test(match) || match.startsWith('www.')) {
      website = match;
      break;
    }
  }

  // 4. Extract Phone
  const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}/g;
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
      // Check if address label
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
      // Ignore common headers
      if (/visiting card|business card|identity card|card/i.test(lower)) continue;

      // Clean prefix titles
      const cleaned = line.replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.|eng\.)\s+/i, '').trim();
      const words = cleaned.split(/\s+/);
      // Person name candidate: 1-4 words, alphabetic characters
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
  const pageCount = Math.min(pdf.numPages, 2); // Max 2 pages (Front & Back)

  const pages: Buffer[] = [];
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    // @ts-expect-error — @napi-rs/canvas context is API-compatible with pdfjs-dist
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push(canvas.encodeSync('png'));
  }

  await loadingTask.destroy();
  return pages;
}

/** Server-side OCR execution for card image/PDF buffer(s) */
export async function performCardOcr(
  frontBuffer: Buffer,
  backBuffer?: Buffer
): Promise<ExtractedCardDetails> {
  const worker = await getWorker();

  let frontImages: Buffer[] = [];
  if (isPdfBuffer(frontBuffer)) {
    frontImages = await convertPdfToImageBuffers(frontBuffer);
  } else {
    frontImages = [frontBuffer];
  }

  let combinedText = '';
  for (const imgBuf of frontImages) {
    const { data } = await worker.recognize(imgBuf);
    if (data.text) {
      combinedText += (combinedText ? '\n' : '') + data.text;
    }
  }

  if (backBuffer) {
    let backImages: Buffer[] = [];
    if (isPdfBuffer(backBuffer)) {
      backImages = await convertPdfToImageBuffers(backBuffer);
    } else {
      backImages = [backBuffer];
    }
    for (const imgBuf of backImages) {
      const { data } = await worker.recognize(imgBuf);
      if (data.text) {
        combinedText += '\n--- BACK OF CARD ---\n' + data.text;
      }
    }
  }

  return parseVisitingCardText(combinedText);
}
