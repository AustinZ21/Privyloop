export const runtime = 'nodejs';

// 1x1 transparent PNG as a fallback favicon to avoid 404s
const TRANSPARENT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

export async function GET() {
  const buffer = Buffer.from(TRANSPARENT_PNG_BASE64, 'base64');
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

