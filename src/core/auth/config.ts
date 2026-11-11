import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oneTap } from "better-auth/plugins";
import { AsyncLocalStorage } from "async_hooks";

import { db } from "@/core/db";
import { envConfigs } from "@/config";
import * as schema from "@/config/db/schema";
import { getUuid } from "@/shared/lib/hash";
import { bindAffiliateReferralOnUserRegistration } from "@/shared/models/affiliate";
import { grantCreditsForNewUser } from "@/shared/models/credit";
import { emailService } from "@/shared/lib/email";
import {
  findUserByEmailIdentity,
  normalizeEmail,
  updateUser,
} from "@/shared/models/user";
import { isIPBlacklisted } from "@/shared/models/ip-blacklist";

// Request context to store IP address for user creation
export const requestContext = new AsyncLocalStorage<{ ip?: string | null }>();

// Static auth options - NO database connection
// This ensures zero database calls during build time
const authOptions = {
  appName: envConfigs.app_name,
  baseURL: envConfigs.auth_url,
  secret: envConfigs.auth_secret,
  trustedOrigins: envConfigs.app_url ? [envConfigs.app_url] : [],
  advanced: {
    database: {
      generateId: () => getUuid(),
    },
  },
  logger: {
    verboseLogging: false,
    // Disable all logs during build and production
    disabled: true,
  },
};

// get auth options with configs
export async function getAuthOptions(configs: Record<string, string>) {
  return {
    ...authOptions,
    // Add database connection only when actually needed (runtime)
    database: envConfigs.database_url
      ? drizzleAdapter(db(), {
          provider: getDatabaseProvider(envConfigs.database_provider),
          schema: schema,
        })
      : null,
    databaseHooks: {
      user: {
        create: {
          before: async (user: any) => {
            const normalizedEmail = normalizeEmail(String(user.email || ""));
            if (!normalizedEmail) {
              throw new Error("email is required");
            }

            const existingUser = await findUserByEmailIdentity(normalizedEmail);
            if (existingUser) {
              throw new Error("email already exists");
            }

            user.email = normalizedEmail;

            // Get IP from request context if available
            const context = requestContext.getStore();
            const clientIP = context?.ip;

            if (clientIP) {
              user.ip = clientIP;
            }
          },
          after: async (user: any) => {
            try {
              if (!user.id) {
                throw new Error("user id is required");
              }

              // Ensure IP is set (backup in case before hook didn't work)
              const context = requestContext.getStore();
              if (context?.ip && !user.ip) {
                await updateUser(user.id, { ip: context.ip });
                user.ip = context.ip;
              }

              await grantCreditsForNewUser(user);
              await bindAffiliateReferralOnUserRegistration(user.id);

              // Note: Country will be updated in the auth API route
              // where we have access to request headers
            } catch (e) {
              console.log("grant credits for new user failed", e);
            }
          },
        },
      },
    },
    emailAndPassword: {
      enabled: configs.email_auth_enabled !== "false",
      // Require email verification for email+password users
      requireEmailVerification: true,
      // Do not auto sign in after sign up, wait for verification
      autoSignIn: false,
      /**
       * Enable password reset by sending reset link email.
       * better-auth will call this function when user requests a reset.
       */
      async sendResetPassword(params: any) {
        const { user, url } = params || {};
        if (!user?.email || !url) {
          console.error(
            "[Auth] sendResetPassword called with invalid params",
            params,
          );
          return;
        }

        const appName = configs.app_name || envConfigs.app_name || "Barko Bear";

        console.log("[Auth] sendResetPassword sending email to", user.email);
        const result = await emailService.sendResetPasswordEmail({
          email: user.email,
          url,
          appName,
          configs,
        });
        if (!result.success) {
          console.error("[Auth] sendResetPassword email failed", result.error);
          // Surface error so caller / frontend can see failure instead of silent success
          throw new Error(
            result.error || "Failed to send reset password email",
          );
        }
      },
      // Revoke all existing sessions after a successful password reset
      revokeSessionsOnPasswordReset: true,
    },
    emailVerification: {
      // Also send verification email on sign up
      sendOnSignUp: true,
      /**
       * Send email verification link for new users and email change.
       */
      async sendVerificationEmail(params: any) {
        const { user, url } = params || {};
        if (!user?.email || !url) {
          console.error(
            "[Auth] sendVerificationEmail called with invalid params",
            params,
          );
          return;
        }

        // 在发送验证邮件之前检查 IP 黑名单：
        // 黑名单用户仍然允许注册（写库），但不触发发送验证邮件，避免成本/滥用。
        // 同时不向用户暴露真实原因。
        const context = requestContext.getStore();
        const clientIP = context?.ip;
        if (clientIP) {
          const blacklisted = await isIPBlacklisted(clientIP);
          if (blacklisted) {
            console.warn("[Auth] verification email skipped");
            return;
          }
        }

        const appName = configs.app_name || envConfigs.app_name || "Barko Bear";

        console.log(
          "[Auth] sendVerificationEmail sending email to",
          user.email,
        );
        const result = await emailService.sendEmailVerificationEmail({
          email: user.email,
          url,
          appName,
          configs,
        });
        if (!result.success) {
          console.error(
            "[Auth] sendVerificationEmail email failed",
            result.error,
          );
          throw new Error(
            result.error || "Failed to send email verification email",
          );
        }
      },
    },
    socialProviders: getSocialProviders(configs), // Remove await - this is synchronous
    plugins:
      configs.google_client_id && configs.google_one_tap_enabled === "true"
        ? [oneTap()]
        : [],
  };
}

// get social providers with configs (synchronous - no async needed)
export function getSocialProviders(configs: Record<string, string>) {
  const providers: any = {};

  // google auth
  if (configs.google_client_id && configs.google_client_secret) {
    providers.google = {
      clientId: configs.google_client_id,
      clientSecret: configs.google_client_secret,
    };
  }

  // github auth
  if (configs.github_client_id && configs.github_client_secret) {
    providers.github = {
      clientId: configs.github_client_id,
      clientSecret: configs.github_client_secret,
    };
  }

  return providers;
}

// convert database provider to better-auth database provider
export function getDatabaseProvider(
  provider: string,
): "sqlite" | "pg" | "mysql" {
  switch (provider) {
    case "sqlite":
      return "sqlite";
    case "postgresql":
      return "pg";
    case "mysql":
      return "mysql";
    default:
      throw new Error(
        `Unsupported database provider for auth: ${envConfigs.database_provider}`,
      );
  }
}
