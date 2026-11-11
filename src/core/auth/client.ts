import { oneTapClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { envConfigs } from '@/config';

const sessionOptions = {
  refetchOnWindowFocus: false,
  refetchWhenOffline: false,
  refetchInterval: 0,
} as const;

// create default auth client, with default redirect plugin (used for sign-in etc.)
export const authClient = createAuthClient({
  baseURL: envConfigs.auth_url,
  sessionOptions,
});

// create auth client without default redirect plugin, used where we want full manual control
const authClientNoRedirect = createAuthClient({
  baseURL: envConfigs.auth_url,
  disableDefaultFetchPlugins: true,
  sessionOptions,
});

// export default auth client methods
export const { useSession, signIn, signUp, signOut } = authClient;

// email sign up without automatic redirect (used by SignUp UI)
export async function signUpEmailWithoutRedirect(body: {
  email: string;
  password: string;
  name: string;
  callbackURL?: string;
}) {
  return authClientNoRedirect.$fetch('/sign-up/email', {
    method: 'POST',
    body,
    throw: false,
  });
}

// resend email verification link
export async function resendVerificationEmail(body: {
  email: string;
  callbackURL?: string;
}) {
  return authClientNoRedirect.$fetch('/send-verification-email', {
    method: 'POST',
    body,
    throw: false,
  });
}

// Expose helpers for password reset flow
export async function requestPasswordReset(email: string, redirectTo: string) {
  return authClient.$fetch('/request-password-reset', {
    method: 'POST',
    body: {
      email,
      redirectTo,
    },
  });
}

export async function resetPassword(token: string, newPassword: string) {
  // Do not throw automatically, we want to inspect error and surface message
  const result = await authClient.$fetch('/reset-password', {
    method: 'POST',
    body: {
      token,
      newPassword,
    },
    // Ensure BetterFetch does not throw so we can handle the error manually
    throw: false,
  });

  return result as { data: any; error?: any };
}

// get auth client with plugins
export function getAuthClient(configs: Record<string, string>) {
  const authClientWithPlugins = createAuthClient({
    baseURL: envConfigs.auth_url,
    sessionOptions,
    plugins: getAuthPlugins(configs),
  });

  return authClientWithPlugins;
}

// get auth plugins with configs
function getAuthPlugins(configs: Record<string, string>) {
  const authPlugins = [];

  // google one tap plugin
  if (configs.google_client_id && configs.google_one_tap_enabled === 'true') {
    authPlugins.push(
      oneTapClient({
        clientId: configs.google_client_id,
        // Optional client configuration:
        autoSelect: false,
        cancelOnTapOutside: false,
        context: 'signin',
        additionalOptions: {
          // Any extra options for the Google initialize method
          // Disable FedCM to avoid noisy AbortError logs from GSI in some browsers/navigation flows.
          use_fedcm_for_prompt: false,
        },
        // Configure prompt behavior and exponential backoff:
        promptOptions: {
          baseDelay: 1000, // Base delay in ms (default: 1000)
          maxAttempts: 1, // Only attempt once to avoid multiple error logs (default: 5)
        },
      })
    );
  }

  return authPlugins;
}
