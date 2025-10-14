import { NextRequest, NextResponse } from 'next/server';

/**
 * Generates possible AIRAC cycle dates (updated every 28 days)
 * Returns the last 5 possible dates to try
 */
function getAIRACDates(): string[] {
  const dates: string[] = [];
  const now = new Date();

  // Known AIRAC date: 02 OCT 2025
  const referenceDate = new Date('2025-10-02');
  const airacCycle = 28; // days

  // Calculate cycles backwards from now
  let currentDate = new Date(referenceDate);

  // Go back until we're before today, then take last 5 dates
  while (currentDate > now) {
    currentDate = new Date(currentDate.getTime() - airacCycle * 24 * 60 * 60 * 1000);
  }

  // Generate next 5 cycles (including future ones)
  for (let i = 0; i < 5; i++) {
    const month = currentDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    dates.push(`eAIP_${day}_${month}_${year}`);

    currentDate = new Date(currentDate.getTime() + airacCycle * 24 * 60 * 60 * 1000);
  }

  return dates.reverse(); // Most recent first
}

/**
 * Fetches VAC PDF from SIA website
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const icaoCode = searchParams.get('code')?.toUpperCase();

  if (!icaoCode || !/^LF[A-Z]{2}$/.test(icaoCode)) {
    return NextResponse.json(
      { error: 'Code OACI invalide. Format attendu : LFXX (ex: LFMA, LFMV)' },
      { status: 400 }
    );
  }

  const dates = getAIRACDates();
  const baseUrl = 'https://www.sia.aviation-civile.gouv.fr/media/dvd';

  // Try each date until we find a valid PDF
  for (const date of dates) {
    const url = `${baseUrl}/${date}/Atlas-VAC/PDF_AIPparSSection/VAC/AD/AD-2.${icaoCode}.pdf`;

    try {
      const response = await fetch(url, {
        method: 'HEAD', // Check if file exists without downloading
        cache: 'no-store'
      });

      if (response.ok) {
        // Found it! Now fetch the actual PDF
        const pdfResponse = await fetch(url, { cache: 'no-store' });

        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();

          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="VAC-${icaoCode}.pdf"`,
            },
          });
        }
      }
    } catch (error) {
      // Continue to next date
      continue;
    }
  }

  return NextResponse.json(
    {
      error: `Carte VAC introuvable pour ${icaoCode}. Vérifiez le code OACI ou utilisez l'upload manuel.`,
      triedDates: dates
    },
    { status: 404 }
  );
}
