import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const trimmed = rawUrl.trim();

  try {
    // 1. Follow HTTP redirects on server side
    const response = await fetch(trimmed, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const finalUrl = response.url;
    const html = await response.text();

    let lat: number | undefined;
    let lng: number | undefined;
    let name: string | undefined;
    let address: string | undefined;

    // Pattern A: /@lat,lng,zoom in final URL
    const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }

    // Pattern B: Protobuf coords in URL: !3d<lat>!4d<lng>
    if (lat === undefined || lng === undefined) {
      const protoMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (protoMatch) {
        lat = parseFloat(protoMatch[1]);
        lng = parseFloat(protoMatch[2]);
      }
    }

    // Pattern C: Query params with q=lat,lng or ll=lat,lng
    if (lat === undefined || lng === undefined) {
      const qCoordMatch = finalUrl.match(/[?&](?:q|ll|daddr|saddr)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qCoordMatch) {
        lat = parseFloat(qCoordMatch[1]);
        lng = parseFloat(qCoordMatch[2]);
      }
    }

    // Pattern D: Check HTML meta tags or content for coordinates
    if (lat === undefined || lng === undefined) {
      const metaCoordMatch = html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)|location=(-?\d+\.\d+)%2C(-?\d+\.\d+)|"latitude":\s*(-?\d+\.\d+),\s*"longitude":\s*(-?\d+\.\d+)/);
      if (metaCoordMatch) {
        const foundLat = metaCoordMatch[1] || metaCoordMatch[3] || metaCoordMatch[5];
        const foundLng = metaCoordMatch[2] || metaCoordMatch[4] || metaCoordMatch[6];
        if (foundLat && foundLng) {
          lat = parseFloat(foundLat);
          lng = parseFloat(foundLng);
        }
      }
    }

    // Extract Place Name from URL /place/Name+Here/...
    const placeMatch = finalUrl.match(/\/maps\/place\/([^/@?]+)/);
    if (placeMatch) {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    // Extract Place Name from og:title if available
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch && ogTitleMatch[1] && !ogTitleMatch[1].includes('Google Maps')) {
      name = ogTitleMatch[1].replace(/ - Google Maps$/, '').trim();
    }

    // Extract og:description for address
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (ogDescMatch && ogDescMatch[1] && !ogDescMatch[1].includes('Google Maps')) {
      address = ogDescMatch[1].trim();
    }

    return NextResponse.json({
      success: true,
      originalUrl: trimmed,
      finalUrl,
      lat: lat !== undefined ? Number(lat.toFixed(6)) : null,
      lng: lng !== undefined ? Number(lng.toFixed(6)) : null,
      name: name || null,
      address: address || null,
    });
  } catch (err: any) {
    console.error('Error resolving Google Maps URL:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to resolve URL', success: false },
      { status: 500 }
    );
  }
}
