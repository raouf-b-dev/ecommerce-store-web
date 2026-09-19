export async function register() {
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK !== 'true') {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { server } = await import('@/lib/mock/server');
    server.listen({ onUnhandledRequest: 'bypass' });
  }
}
