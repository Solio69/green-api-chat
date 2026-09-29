import { connection } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  await connection();

  return Response.json(
    { status: 'ok' },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
