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
 *
 * Each flagged word carries the pixel bounding box tesseract detected it
 * at, plus a page preview image, so the UI can draw a highlight box right
 * over the mistake instead of just listing it in prose.
 */
import path from 'path';
import { createWorker, type Worker } from 'tesseract.js';
import nspell from 'nspell';
import type { OcrScanResult, OcrScanIssue, OcrScanPageImage } from './local-data';

const OCR_CACHE_DIR = path.join(process.cwd(), 'data', 'ocr-cache');
const MAX_PDF_PAGES = 5;
// Preview images are capped on their longest side purely to keep the JSON
// response small — bbox percentages are computed against the ORIGINAL
// (pre-downscale) pixel dimensions, so highlight boxes stay accurate
// regardless of what resolution the preview itself was saved at.
const MAX_PREVIEW_DIMENSION = 1400;

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

/** Strip leading/trailing punctuation tesseract sometimes attaches to a word. */
function cleanWord(raw: string): string {
  return raw.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
}

export async function scanForTextIssues(buffer: Buffer, mimeType: string): Promise<OcrScanResult> {
  let pageBuffers: Buffer[];
  let totalPages: number;
  let partial = false;

  if (mimeType === 'application/pdf') {
    const rendered = await renderPdfPagesToPngBuffers(buffer, MAX_PDF_PAGES);
    pageBuffers = rendered.pages;
    totalPages = rendered.totalPages;
    partial = totalPages > MAX_PDF_PAGES;
  } else if (mimeType.startsWith('image/')) {
    pageBuffers = [buffer];
    totalPages = 1;
  } else {
    throw new Error('Unsupported file type for OCR scan. Only images and PDFs are supported.');
  }

  const worker = await getWorker();
  const spell = await getSpellChecker();
  const { loadImage, createCanvas } = await import('@napi-rs/canvas');

  const pageTexts: string[] = [];
  const pageImages: OcrScanPageImage[] = [];
  const issues: OcrScanIssue[] = [];

  for (let pageIndex = 0; pageIndex < pageBuffers.length; pageIndex++) {
    const pageBuffer = pageBuffers[pageIndex];
    const { data } = await worker.recognize(pageBuffer, {}, { blocks: true });
    pageTexts.push(data.text.trim());

    const img = await loadImage(pageBuffer);
    const width = img.width;
    const height = img.height;

    // Downscale only the returned preview, never the buffer OCR already ran against.
    const scale = Math.min(1, MAX_PREVIEW_DIMENSION / Math.max(width, height));
    let previewDataUrl: string;
    if (scale < 1) {
      const previewCanvas = createCanvas(Math.round(width * scale), Math.round(height * scale));
      const ctx = previewCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
      previewDataUrl = `data:image/png;base64,${previewCanvas.encodeSync('png').toString('base64')}`;
    } else {
      previewDataUrl = `data:image/png;base64,${pageBuffer.toString('base64')}`;
    }
    pageImages.push({ dataUrl: previewDataUrl, width, height });

    for (const block of data.blocks || []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          for (const word of line.words) {
            const cleaned = cleanWord(word.text);
            if (cleaned.length < 3 || !/^[A-Za-z'-]+$/.test(cleaned)) continue;
            if (spell.correct(cleaned)) continue;
            issues.push({
              word: cleaned,
              suggestions: spell.suggest(cleaned).slice(0, 3),
              pageIndex,
              bbox: word.bbox,
            });
          }
        }
      }
    }
  }

  const extractedText = pageTexts
    .map((text, i) => (pageBuffers.length > 1 ? `--- Page ${i + 1} ---\n${text}` : text))
    .join('\n\n')
    .trim();

  return {
    extractedText,
    pageCount: pageBuffers.length,
    totalPages,
    partial,
    issues,
    pageImages,
    scannedAt: new Date().toISOString(),
  };
}
