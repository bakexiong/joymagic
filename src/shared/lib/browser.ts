import { headers } from 'next/headers';

export async function getPathname() {
  const headersList = await headers();
  const direct = headersList.get('x-pathname');
  if (direct) return direct;

  const maybePath =
    headersList.get('next-url') ||
    headersList.get('x-next-url') ||
    headersList.get('x-matched-path') ||
    headersList.get('x-nextjs-matched-path');
  if (maybePath?.startsWith('/')) {
    return maybePath.split('?')[0] || '';
  }

  const maybeUrl = headersList.get('x-url') || headersList.get('referer');
  if (maybeUrl) {
    try {
      return new URL(maybeUrl).pathname;
    } catch {
      // ignore
    }
  }

  return '';
}
