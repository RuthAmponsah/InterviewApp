/**
 * extract-cv-text Edge Function
 *
 * Accepts a base64 PDF/DOCX/DOC/TXT CV upload and returns extracted text.
 *
 * Deploy:
 *   npx supabase functions deploy extract-cv-text
 *
 * Client:
 *   supabase.functions.invoke('extract-cv-text', {
 *     body: { fileName, mimeType, base64 }
 *   })
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decompressSync, unzipSync, strFromU8 } from 'https://esm.sh/fflate@0.8.2';
import * as pdfjs from 'https://esm.sh/pdfjs-dist@4.10.38/legacy/build/pdf.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_RESPONSE_CHARS = 80000;

const supportedExtensions = ['.pdf', '.docx', '.doc', '.txt'];

const normalizeWhitespace = (text: string) =>
  text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const repairSpacedPdfText = (text: string) => {
  let repaired = normalizeWhitespace(text);

  repaired = repaired
    .split('\n')
    .map((line) => {
      const tokens = line.match(/[A-Za-z]+/g) || [];
      const shortTokens = tokens.filter((token) => token.length <= 2).length;
      const averageLength = tokens.length
        ? tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length
        : 0;
      const looksFragmented =
        tokens.length >= 4 &&
        shortTokens / tokens.length > 0.55 &&
        averageLength < 3.2;

      return looksFragmented
        ? line.replace(/([A-Za-z])\s+(?=[A-Za-z])/g, '$1')
        : line;
    })
    .join('\n')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/\s+([)\]])/g, '$1');

  const commonPhraseFixes: Array<[RegExp, string]> = [
    [/Communicationskills/gi, 'Communication skills'],
    [/Timemanagement/gi, 'Time management'],
    [/BachelorofArtsinEducation/gi, 'Bachelor of Arts in Education'],
    [/MasterofArtsinEducation/gi, 'Master of Arts in Education'],
    [/CertificateinTeachingEnglishasaSecondLanguage/gi, 'Certificate in Teaching English as a Second Language'],
    [/CertificateofAppreciationforoutstandingteachingpractice/gi, 'Certificate of Appreciation for outstanding teaching practice'],
    [/CertificateofCompletionforteachertrainingprogram/gi, 'Certificate of Completion for teacher training program'],
    [/Availableuponrequest/gi, 'Available upon request'],
  ];

  for (const [pattern, replacement] of commonPhraseFixes) {
    repaired = repaired.replace(pattern, replacement);
  }

  return normalizeWhitespace(repaired);
};

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

const decodeBase64 = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const decodePdfHexString = (hexValue: string) => {
  const cleanHex = hexValue.replace(/\s+/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.slice(i, i + 2).padEnd(2, '0'), 16);
    if (!Number.isNaN(byte)) bytes.push(byte);
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let result = '';
    for (let i = 2; i + 1 < bytes.length; i += 2) {
      result += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    }
    return result;
  }

  const likelyUtf16 = bytes.length > 4 && bytes.filter((byte, index) => index % 2 === 0 && byte === 0).length > bytes.length / 4;
  if (likelyUtf16) {
    let result = '';
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      result += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    }
    return result;
  }

  return String.fromCharCode(...bytes);
};

const decodePdfLiteralString = (value: string) =>
  value
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\b/g, '')
    .replace(/\\f/g, '')
    .replace(/\\([()\\])/g, '$1');

const getExtension = (fileName = '') => {
  const lower = fileName.toLowerCase();
  return supportedExtensions.find((ext) => lower.endsWith(ext)) || '';
};

const extractDocxText = (bytes: Uint8Array) => {
  const files = unzipSync(bytes);
  const documentXml = files['word/document.xml'];
  if (!documentXml) {
    throw new Error('DOCX document.xml not found');
  }

  const xml = strFromU8(documentXml);
  return normalizeWhitespace(
    xml
      .replace(/<w:tab\/>/g, ' ')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .split('\n')
      .map((line) => decodeXmlEntities(line).trim())
      .filter(Boolean)
      .join('\n')
  );
};

const collectPdfTextStreams = (bytes: Uint8Array) => {
  const raw = new TextDecoder('latin1').decode(bytes);
  const streams = [raw];
  let streamCount = 0;
  let decodedStreamCount = 0;
  let searchFrom = 0;

  while (searchFrom < raw.length) {
    const streamMarker = raw.indexOf('stream', searchFrom);
    if (streamMarker === -1) break;

    const endMarker = raw.indexOf('endstream', streamMarker);
    if (endMarker === -1) break;

    const dictStart = Math.max(0, raw.lastIndexOf('<<', streamMarker));
    const dict = raw.slice(dictStart, streamMarker);
    const hasFlate = /\/Filter\s*(?:\/FlateDecode|\[[^\]]*\/FlateDecode[^\]]*\])/.test(dict);

    let dataStart = streamMarker + 'stream'.length;
    if (raw[dataStart] === '\r' && raw[dataStart + 1] === '\n') {
      dataStart += 2;
    } else if (raw[dataStart] === '\n' || raw[dataStart] === '\r') {
      dataStart += 1;
    }

    let dataEnd = endMarker;
    if (raw[dataEnd - 2] === '\r' && raw[dataEnd - 1] === '\n') {
      dataEnd -= 2;
    } else if (raw[dataEnd - 1] === '\n' || raw[dataEnd - 1] === '\r') {
      dataEnd -= 1;
    }

    const streamBytes = bytes.slice(dataStart, dataEnd);
    streamCount += 1;
    try {
      const textBytes = hasFlate ? decompressSync(streamBytes) : streamBytes;
      const decoded = new TextDecoder('latin1').decode(textBytes);
      streams.push(decoded);
      decodedStreamCount += 1;
    } catch (error) {
      console.warn('Unable to decode PDF stream:', error);
    }

    searchFrom = endMarker + 'endstream'.length;
  }

  return { streams, streamCount, decodedStreamCount, pageCount: countPdfPages(raw) };
};

const countPdfPages = (raw: string) => {
  const matches = raw.match(/\/Type\s*\/Page\b/g);
  return matches?.length || 1;
};

const extractTextOperators = (source: string) => {
  const chunks: string[] = [];

  const literalMatches = source.matchAll(/\((?:\\.|[^\\)]){1,}\)\s*Tj/g);
  for (const match of literalMatches) {
    const literal = match[0].replace(/\)\s*Tj$/, '').slice(1);
    chunks.push(decodePdfLiteralString(literal));
  }

  const hexMatches = source.matchAll(/<([0-9A-Fa-f\s]{2,})>\s*Tj/g);
  for (const match of hexMatches) {
    chunks.push(decodePdfHexString(match[1]));
  }

  const arrayMatches = source.matchAll(/\[(.*?)\]\s*TJ/gs);
  for (const match of arrayMatches) {
    const arrayBody = match[1] || '';
    const parts: string[] = [];

    for (const literal of arrayBody.matchAll(/\((?:\\.|[^\\)])+\)/g)) {
      parts.push(decodePdfLiteralString(literal[0].slice(1, -1)));
    }

    for (const hex of arrayBody.matchAll(/<([0-9A-Fa-f\s]{2,})>/g)) {
      parts.push(decodePdfHexString(hex[1]));
    }

    if (parts.length) chunks.push(parts.join(' '));
  }

  return chunks;
};

const extractPdfTextBestEffort = (bytes: Uint8Array) => {
  const { streams, streamCount, decodedStreamCount, pageCount } = collectPdfTextStreams(bytes);
  const chunks = streams.flatMap(extractTextOperators);
  return {
    text: repairSpacedPdfText(chunks.join('\n')),
    metadata: {
      pageCount,
      streamCount,
      decodedStreamCount,
    },
  };
};

type PdfExtractionResult = {
  text: string;
  metadata: Record<string, number>;
};

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  hasEOL?: boolean;
};

const getPdfItemX = (item: PdfTextItem) => item.transform?.[4] ?? 0;
const getPdfItemY = (item: PdfTextItem) => item.transform?.[5] ?? 0;

type OrderedPdfItem = {
  text: string;
  x: number;
  width: number;
  y: number;
  hasEOL: boolean;
};

const makeOrderedItems = (items: PdfTextItem[]) =>
  items
    .filter((item) => item.str && item.str.trim().length > 0)
    .map((item) => ({
      text: item.str || '',
      x: getPdfItemX(item),
      width: item.width ?? 0,
      y: getPdfItemY(item),
      hasEOL: Boolean(item.hasEOL),
    }));

const renderItemsAsLines = (textItems: OrderedPdfItem[]) => {
  const sortedTextItems = [...textItems].sort((a, b) => {
    const yDelta = b.y - a.y;
    if (Math.abs(yDelta) > 3) return yDelta;
    return a.x - b.x;
  });

  const lines: Array<{ y: number; items: OrderedPdfItem[] }> = [];

  for (const item of sortedTextItems) {
    const existingLine = lines.find((line) => Math.abs(line.y - item.y) <= 3);
    if (existingLine) {
      existingLine.items.push(item);
      existingLine.y = (existingLine.y + item.y) / 2;
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) => {
      const sortedItems = line.items.sort((a, b) => a.x - b.x);
      const parts: string[] = [];
      let previousEnd: number | null = null;

      for (const item of sortedItems) {
        const gap = previousEnd === null ? 0 : item.x - previousEnd;
        const separator = gap > 80 ? '\n' : ' ';
        parts.push(`${parts.length ? separator : ''}${item.text}`);
        previousEnd = item.x + item.width;
      }

      return parts.join('');
    })
    .join('\n');
};

const splitItemsIntoColumns = (textItems: OrderedPdfItem[]) => {
  if (textItems.length < 12) return [textItems];

  const sortedByX = [...textItems].sort((a, b) => a.x - b.x);
  let biggestGap = 0;
  let splitIndex = -1;

  for (let i = 1; i < sortedByX.length; i += 1) {
    const previousEnd = sortedByX[i - 1].x + sortedByX[i - 1].width;
    const gap = sortedByX[i].x - previousEnd;
    if (gap > biggestGap) {
      biggestGap = gap;
      splitIndex = i;
    }
  }

  const left = sortedByX.slice(0, splitIndex);
  const right = sortedByX.slice(splitIndex);
  const enoughTextOnBothSides = left.length >= 5 && right.length >= 5;
  const strongColumnGap = biggestGap > 90;

  if (!enoughTextOnBothSides || !strongColumnGap) {
    return [textItems];
  }

  return [left, right];
};

const extractOrderedPageText = (items: PdfTextItem[]) => {
  const textItems = makeOrderedItems(items);
  const columns = splitItemsIntoColumns(textItems);

  return {
    text: columns
      .map((columnItems) => renderItemsAsLines(columnItems))
      .filter(Boolean)
      .join('\n\n'),
    columnCount: columns.length,
  };
};

const extractPdfTextWithPdfJs = async (bytes: Uint8Array) => {
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    disableFontFace: true,
    disableWorker: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  });

  const document = await loadingTask.promise;
  const pageCount = document.numPages;
  const pages: string[] = [];
  let complexLayoutPages = 0;

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageResult = extractOrderedPageText(content.items as PdfTextItem[]);
    if (pageResult.columnCount > 1) {
      complexLayoutPages += 1;
    }

    pages.push(`--- PDF PAGE ${pageNumber} OF ${pageCount} ---\n${pageResult.text}`);
  }

  await document.destroy();

  const pagesWithText = pages.filter((pageText) => normalizeWhitespace(pageText).length > 0).length;

  return {
    text: repairSpacedPdfText(pages.join('\n\n')),
    metadata: {
      pageCount,
      pagesRead: pages.length,
      pagesWithText,
      complexLayoutPages,
    },
  };
};

const mergePdfExtractionResults = (
  primary: PdfExtractionResult,
  fallback: PdfExtractionResult
): PdfExtractionResult => {
  const primaryText = normalizeWhitespace(primary.text);
  const fallbackText = normalizeWhitespace(fallback.text);
  const fallbackAddsUsefulText =
    fallbackText.length > primaryText.length + 800 &&
    !primaryText.includes(fallbackText.slice(0, 500));

  return {
    text: fallbackAddsUsefulText
      ? `${primaryText}\n\n--- ADDITIONAL PDF TEXT RECOVERED ---\n${fallbackText}`
      : primaryText,
    metadata: {
      ...primary.metadata,
      fallbackCharCount: fallbackText.length,
      recoveredExtraText: fallbackAddsUsefulText ? 1 : 0,
    },
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileName, mimeType, base64 } = await req.json();
    if (!fileName || !base64) {
      return new Response(
        JSON.stringify({ error: 'fileName and base64 are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extension = getExtension(fileName);
    if (!extension) {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload PDF, DOCX, DOC or TXT.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bytes = decodeBase64(base64);
    if (bytes.byteLength > MAX_FILE_BYTES) {
      return new Response(
        JSON.stringify({ error: 'File is too large. Please upload a CV smaller than 5 MB.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let text = '';
    let warning: string | undefined;
    let metadata: Record<string, number> | undefined;

    if (extension === '.docx') {
      text = extractDocxText(bytes);
    } else if (extension === '.pdf') {
      let pdfResult: PdfExtractionResult;
      try {
        const pdfJsResult = await extractPdfTextWithPdfJs(bytes);
        const fallbackResult = extractPdfTextBestEffort(bytes);
        pdfResult = mergePdfExtractionResults(pdfJsResult, fallbackResult);
      } catch (pdfJsError) {
        console.warn('PDF.js extraction failed; using stream fallback:', pdfJsError);
        pdfResult = extractPdfTextBestEffort(bytes);
      }
      text = pdfResult.text;
      metadata = pdfResult.metadata;
      if (text.length < 50) {
        warning = 'Aya could not read enough text from this PDF. It may be scanned, image-based, or use unsupported PDF encoding. Please try DOCX or paste your CV text.';
      }
    } else if (extension === '.txt') {
      text = normalizeWhitespace(new TextDecoder().decode(bytes));
    } else {
      warning = 'Legacy .doc files are not always readable. Please export as DOCX/PDF or paste the CV text.';
      text = normalizeWhitespace(new TextDecoder('latin1').decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, ' '));
    }

    return new Response(
      JSON.stringify({
        text: text.slice(0, MAX_RESPONSE_CHARS),
        charCount: text.length,
        fileName,
        mimeType,
        metadata,
        warning,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('extract-cv-text error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
