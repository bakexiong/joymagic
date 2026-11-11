import { NewApiClient } from './client';
import { NewApiProvider } from './types';

let newApiInstance: NewApiProvider | null = null;

export function getNewApiService(): NewApiProvider | null {
  if (newApiInstance) {
    return newApiInstance;
  }

  const baseUrl = process.env.NEWAPI_BASE_URL;
  const adminKey = process.env.NEWAPI_ADMIN_KEY;

  if (!baseUrl || !adminKey) {
    console.warn(
      '[NewAPI] NEWAPI_BASE_URL or NEWAPI_ADMIN_KEY not configured, NewAPI integration disabled'
    );
    return null;
  }

  const timeout = parseInt(process.env.NEWAPI_TIMEOUT || '10000', 10);
  newApiInstance = new NewApiClient(baseUrl, adminKey, timeout);

  return newApiInstance;
}

export * from './types';
export { NewApiClient } from './client';
