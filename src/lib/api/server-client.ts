import 'server-only';

import createClient from 'openapi-fetch';
import type { paths } from '@/lib/api/generated/schema';

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const serverClient = createClient<paths>({
  baseUrl,
});
