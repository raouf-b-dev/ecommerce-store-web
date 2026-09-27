export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';
}
