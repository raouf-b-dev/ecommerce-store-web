import { setupServer } from 'msw/node';
import { handlers } from '@/lib/mock/handlers';

export const server = setupServer(...handlers);
