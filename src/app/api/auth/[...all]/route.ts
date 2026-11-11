import { toNextJsHandler } from 'better-auth/next-js';

import { getAuth } from '@/core/auth';
import { requestContext } from '@/core/auth/config';
import { getClientIPFromRequest } from '@/shared/lib/geo-server';

async function handleAuthRequest(
  request: Request,
  handler: ReturnType<typeof toNextJsHandler>
) {
  // Get client IP from request headers
  const clientIP = getClientIPFromRequest(request.headers);

  // Store IP in request context for use in database hooks
  return requestContext.run({ ip: clientIP }, async () => {
    // Process the auth request
    const response = await handler.POST(request);
    return response;
  });
}

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);

    // Handle auth request with country detection
    return handleAuthRequest(request, handler);
  } catch (error: any) {
    console.error('[Auth] POST error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Authentication error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);

    return handler.GET(request);
  } catch (error: any) {
    console.error('[Auth] GET error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Authentication error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
