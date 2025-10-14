import { PDFDocument, PDFPage, degrees } from 'pdf-lib';

export type PrintMode = 'booklet' | 'cut';

// Page size constants
const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  A5: { width: 420.95, height: 595.28 }
} as const;

// Types
interface ScaledPageInfo {
  width: number;
  height: number;
  x: number;
  y: number;
  scale: number;
}

interface SheetLayout {
  recto: [number | null, number | null];
  verso: [number | null, number | null];
}

/**
 * Formats a VAC card PDF for printing
 * VAC cards are A5 size and assembled onto A4 pages
 * @param pdfBuffer - Source PDF buffer
 * @param mode - 'booklet' for complete booklet, 'cut' for individual cards after cutting
 */
export async function formatPDFForBooklet(pdfBuffer: ArrayBuffer, mode: PrintMode = 'booklet'): Promise<Uint8Array> {
  if (mode === 'cut') {
    return formatPDFForCut(pdfBuffer);
  }
  return formatPDFForBookletMode(pdfBuffer);
}

/**
 * Calculates dimensions and position to fit a source page into a target area
 */
function calculateScaledPageInfo(
  sourcePage: PDFPage,
  targetWidth: number,
  targetHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
): ScaledPageInfo {
  const { width: srcWidth, height: srcHeight } = sourcePage.getSize();
  const scaleX = targetWidth / srcWidth;
  const scaleY = targetHeight / srcHeight;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = srcWidth * scale;
  const scaledHeight = srcHeight * scale;

  // Center in target area
  const x = offsetX + (targetWidth - scaledWidth) / 2;
  const y = offsetY + (targetHeight - scaledHeight) / 2;

  return { width: scaledWidth, height: scaledHeight, x, y, scale };
}

/**
 * Draws a source page onto a destination page
 */
async function drawEmbeddedPage(
  outputPdf: PDFDocument,
  sourcePdf: PDFDocument,
  sourcePage: PDFPage,
  targetPage: PDFPage,
  pageIndex: number,
  targetWidth: number,
  targetHeight: number,
  offsetX: number = 0,
  offsetY: number = 0,
  rotate: boolean = false
): Promise<void> {
  const [embeddedPage] = await outputPdf.embedPdf(sourcePdf, [pageIndex]);
  const pageInfo = calculateScaledPageInfo(sourcePage, targetWidth, targetHeight, offsetX, offsetY);

  if (rotate) {
    // 180° rotation: adjust coordinates
    const rotatedX = pageInfo.x + pageInfo.width;
    const rotatedY = pageInfo.y + pageInfo.height;
    targetPage.drawPage(embeddedPage, {
      x: rotatedX,
      y: rotatedY,
      width: pageInfo.width,
      height: pageInfo.height,
      rotate: degrees(180)
    });
  } else {
    targetPage.drawPage(embeddedPage, {
      x: pageInfo.x,
      y: pageInfo.y,
      width: pageInfo.width,
      height: pageInfo.height
    });
  }
}

/**
 * Generates sheet layout for booklet mode
 * For an 8-page booklet: [1,2,3,4,5,6,7,8]
 * Sheet 1 recto: [8][1]  verso: [2][7]
 * Sheet 2 recto: [6][3]  verso: [4][5]
 */
function generateBookletLayout(totalPages: number): SheetLayout[] {
  const sheets: SheetLayout[] = [];
  let leftPage = 0;
  let rightPage = totalPages - 1;

  while (leftPage <= rightPage) {
    sheets.push({
      recto: [
        leftPage <= rightPage ? leftPage : null,
        rightPage >= leftPage ? rightPage : null,
      ],
      verso: [
        rightPage - 1 >= leftPage ? rightPage - 1 : null,
        leftPage + 1 <= rightPage ? leftPage + 1 : null,
      ]
    });

    leftPage += 2;
    rightPage -= 2;
  }

  return sheets;
}

/**
 * Booklet mode: all pages are used to create a complete booklet
 */
async function formatPDFForBookletMode(pdfBuffer: ArrayBuffer): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const sourcePages = sourcePdf.getPages();
  const totalPages = sourcePages.length;
  const outputPdf = await PDFDocument.create();

  // A4 landscape format: A4 height x A4 width
  const a4Width = PAGE_SIZES.A4.width;
  const a4Height = PAGE_SIZES.A4.height;
  const a5Width = a4Height / 2; // ~420.95
  const a5Height = a4Width;     // 595.28

  const sheets = generateBookletLayout(totalPages);

  // Create output PDF pages
  for (const sheet of sheets) {
    // RECTO (front side)
    const rectoPage = outputPdf.addPage([a4Height, a4Width]);

    // Left side of recto
    if (sheet.recto[1] !== null) {
      const pageIndex = sheet.recto[1];
      await drawEmbeddedPage(
        outputPdf, sourcePdf, sourcePages[pageIndex], rectoPage,
        pageIndex, a5Width, a5Height, 0, 0, false
      );
    }

    // Right side of recto
    if (sheet.recto[0] !== null) {
      const pageIndex = sheet.recto[0];
      await drawEmbeddedPage(
        outputPdf, sourcePdf, sourcePages[pageIndex], rectoPage,
        pageIndex, a5Width, a5Height, a5Width, 0, false
      );
    }

    // VERSO (back side, pages rotated 180° for duplex printing)
    const versoPage = outputPdf.addPage([a4Height, a4Width]);

    // Left side of verso (rotated 180°)
    if (sheet.verso[0] !== null) {
      const pageIndex = sheet.verso[0];
      await drawEmbeddedPage(
        outputPdf, sourcePdf, sourcePages[pageIndex], versoPage,
        pageIndex, a5Width, a5Height, 0, 0, true
      );
    }

    // Right side of verso (rotated 180°)
    if (sheet.verso[1] !== null) {
      const pageIndex = sheet.verso[1];
      await drawEmbeddedPage(
        outputPdf, sourcePdf, sourcePages[pageIndex], versoPage,
        pageIndex, a5Width, a5Height, a5Width, 0, true
      );
    }
  }

  return await outputPdf.save();
}

/**
 * Cut mode: each VAC page alternates left/right
 * After folding → individual cards with printed front, blank back
 *
 * Example for 8 pages:
 * A4 Page #1: [blank][page 1]
 * A4 Page #2: [page 8][blank]
 * A4 Page #3: [blank][page 2]
 * A4 Page #4: [page 7][blank]
 * A4 Page #5: [blank][page 3]
 * A4 Page #6: [page 6][blank]
 * A4 Page #7: [blank][page 4]
 * A4 Page #8: [page 5][blank]
 */
async function formatPDFForCut(pdfBuffer: ArrayBuffer): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const sourcePages = sourcePdf.getPages();
  const totalPages = sourcePages.length;
  const outputPdf = await PDFDocument.create();

  const a4Width = PAGE_SIZES.A4.width;
  const a4Height = PAGE_SIZES.A4.height;
  const a5Width = a4Height / 2;
  const a5Height = a4Width;

  let leftIndex = 0;
  let rightIndex = totalPages - 1;
  let useLeft = false; // Start with right side for first page
  let pageA4Count = 0;

  while (leftIndex <= rightIndex) {
    const page = outputPdf.addPage([a4Height, a4Width]);
    const shouldRotate = pageA4Count % 2 === 1;

    const pageIndex = useLeft ? rightIndex : leftIndex;
    const offsetX = useLeft ? 0 : a5Width;

    await drawEmbeddedPage(
      outputPdf, sourcePdf, sourcePages[pageIndex], page,
      pageIndex, a5Width, a5Height, offsetX, 0, shouldRotate
    );

    if (useLeft) {
      rightIndex--;
    } else {
      leftIndex++;
    }

    useLeft = !useLeft;
    pageA4Count++;
  }

  return await outputPdf.save();
}
