/**
 * ocr-spellcheck.ts — Server-side OCR + spell-check for Design Portal
 * uploads (posters/images and PDFs). Fully self-hosted/local: OCR runs via
 * tesseract.js (WASM, in-process) and spelling is checked against a local
 * Hunspell-style dictionary (nspell + dictionary-en) — no third-party API
 * calls, consistent with the rest of this app.
 *
 * A PDF's first 5 pages are rendered to images (via pdfjs-dist + the
 * @napi-rs/canvas it uses under the hood on Node) and OCR'd individually;
 * a longer PDF is scanned partially rather than rejected outright.
 */
import path from 'path';
import { createWorker, type Worker } from 'tesseract.js';
import nspell from 'nspell';
import type { OcrScanResult, OcrScanIssue } from './local-data';

const OCR_CACHE_DIR = path.join(process.cwd(), 'data', 'ocr-cache');
const MAX_PDF_PAGES = 5;

// A handful of org-specific/proper-noun terms that would otherwise be
// flagged on nearly every poster. Kept intentionally small — this is an
// advisory pass, not a validator, so an occasional false positive is fine.
const CUSTOM_WHITELIST = [
  'leads', 'msruas', 'ruas', 'ramaiah', 'bengaluru', 'bangalore', 'ms', 'msr',
];

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

let spellPromise: Promise<ReturnType<typeof nspell>> | null = null;
async function getSpellChecker() {
  if (!spellPromise) {
    spellPromise = (async () => {
      // British/Indian-English spellings (e.g. "Centre", "organise") are the
      // norm across this app's own copy — dictionary-en-gb avoids flagging
      // those as errors, unlike the American-English dictionary.
      const dictionary = (await import('dictionary-en-gb')).default;
      const spell = nspell({ aff: Buffer.from(dictionary.aff), dic: Buffer.from(dictionary.dic) });
      for (const word of CUSTOM_WHITELIST) spell.add(word);
      return spell;
    })();
  }
  return spellPromise;
}

/** Render a PDF's pages (up to `maxPages`) to PNG buffers using pdfjs-dist. */
async function renderPdfPagesToPngBuffers(buffer: Buffer, maxPages: number): Promise<{ pages: Buffer[]; totalPages: number }> {
  const { createCanvas } = await import('@napi-rs/canvas');
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts') + path.sep,
  });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pageCount = Math.min(totalPages, maxPages);

  const pages: Buffer[] = [];
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 }); // upscale for better OCR accuracy
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    // @ts-expect-error — @napi-rs/canvas's context is API-compatible with the
    // DOM CanvasRenderingContext2D that pdfjs-dist expects, but not the same type.
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push(canvas.encodeSync('png'));
  }

  await loadingTask.destroy();
  return { pages, totalPages };
}

/** Split OCR'd text into candidate words, dropping numbers/URLs/emails/short tokens. */
function extractCandidateWords(text: string): string[] {
  const tokens = text.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const raw of tokens) {
    const word = raw.replace(/^'+|'+$/g, '');
    if (word.length < 3) continue;
    const lower = word.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    candidates.push(word);
  }
  return candidates;
}

export async function scanForTextIssues(buffer: Buffer, mimeType: string): Promise<OcrScanResult> {
  let pageImages: Buffer[];
  let totalPages: number;
  let partial = false;

  if (mimeType === 'application/pdf') {
    const rendered = await renderPdfPagesToPngBuffers(buffer, MAX_PDF_PAGES);
    pageImages = rendered.pages;
    totalPages = rendered.totalPages;
    partial = totalPages > MAX_PDF_PAGES;
  } else if (mimeType.startsWith('image/')) {
    pageImages = [buffer];
    totalPages = 1;
  } else {
    throw new Error('Unsupported file type for OCR scan. Only images and PDFs are supported.');
  }

  const worker = await getWorker();
  const pageTexts: string[] = [];
  for (const pageImage of pageImages) {
    const { data } = await worker.recognize(pageImage);
    pageTexts.push(data.text.trim());
  }
  const extractedText = pageTexts
    .map((text, i) => (pageImages.length > 1 ? `--- Page ${i + 1} ---\n${text}` : text))
    .join('\n\n')
    .trim();

  const spell = await getSpellChecker();
  const candidates = extractCandidateWords(extractedText);
  const issues: OcrScanIssue[] = [];
  for (const word of candidates) {
    if (spell.correct(word)) continue;
    const suggestions = spell.suggest(word).slice(0, 3);
    issues.push({ word, suggestions });
  }

  return {
    extractedText,
    pageCount: pageImages.length,
    totalPages,
    partial,
    issues,
    scannedAt: new Date().toISOString(),
  };
}
