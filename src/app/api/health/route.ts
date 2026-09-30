import { connection } from 'next/server';
import { API_RESPONSE_STATUS } from '@/lib/api/constants';
import { CACHE_CONTROL, HTTP_HEADERS, HTTP_STATUS } from '@/lib/http/constants';

const { OK: HTTP_OK } = HTTP_STATUS;
const { OK: RESPONSE_OK } = API_RESPONSE_STATUS;
const { CACHE_CONTROL: CACHE_CONTROL_HEADER } = HTTP_HEADERS;
const { NO_STORE } = CACHE_CONTROL;

export const runtime = 'nodejs';

export async function GET() {
  await connection();

  return Response.json(
    { status: RESPONSE_OK },
    {
      status: HTTP_OK,
      headers: {
        [CACHE_CONTROL_HEADER]: NO_STORE,
      },
    },
  );
}
