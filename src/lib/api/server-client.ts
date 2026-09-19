import 'server-only';

import createClient from 'openapi-fetch';
import { API_BASE_URL } from '@/lib/api/api-base-url';
import type { paths } from '@/lib/api/generated/schema';

export const serverClient = createClient<paths>({
  baseUrl: API_BASE_URL,
});
