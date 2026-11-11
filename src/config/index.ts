// Load .env files for scripts (tsx/ts-node) - but NOT in Edge Runtime or browser
// This ensures scripts can read DATABASE_URL and other env vars
// Check for real Node.js environment by looking at global 'process' properties
if (
  typeof process !== "undefined" &&
  typeof process.cwd === "function" &&
  !process.env.NEXT_RUNTIME // Skip if in Next.js runtime (already loaded)
) {
  try {
    const dotenv = require("dotenv");
    dotenv.config({ path: ".env.agent.development" });
    dotenv.config({ path: ".env.development" });
    dotenv.config({ path: ".env", override: false });
  } catch (e) {
    // Silently fail - dotenv might not be available in some environments
  }
}

export type ConfigMap = Record<string, string>;

export const envConfigs = {
  app_url: (process.env.NEXT_PUBLIC_APP_URL ?? "https://barkobear.com").replace(
    /\/+$/,
    "",
  ),
  ai_webhook_base_url: (process.env.AI_WEBHOOK_BASE_URL ?? "").replace(
    /\/+$/,
    "",
  ),
  app_name: process.env.NEXT_PUBLIC_APP_NAME ?? "Barko Bear",
  theme: process.env.NEXT_PUBLIC_THEME ?? "default",
  appearance: process.env.NEXT_PUBLIC_APPEARANCE ?? "dark",
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en",
  database_url: process.env.DATABASE_URL ?? "",
  database_provider: process.env.DATABASE_PROVIDER ?? "postgresql",
  db_singleton_enabled: process.env.DB_SINGLETON_ENABLED || "false",
  db_max_connections: process.env.DB_MAX_CONNECTIONS || "1",
  openrouter_api_key:
    process.env.OPENROUTER_API_KEY ?? process.env.openrouter_api_key ?? "",
  openrouter_api_url:
    process.env.OPENROUTER_API_URL ?? process.env.openrouter_api_url ?? "",
  gemini_api_key:
    process.env.GEMINI_API_KEY ?? process.env.gemini_api_key ?? "",
  gemini_api_url:
    process.env.GEMINI_API_URL ?? process.env.gemini_api_url ?? "",
  canvas_agent_model_id:
    process.env.CANVAS_AGENT_MODEL_ID ??
    process.env.canvas_agent_model_id ??
    "",
  canvas_agent_openrouter_model_id:
    process.env.CANVAS_AGENT_OPENROUTER_MODEL_ID ??
    process.env.canvas_agent_openrouter_model_id ??
    "",
  canvas_agent_openrouter_reasoning_enabled:
    process.env.CANVAS_AGENT_OPENROUTER_REASONING_ENABLED ??
    process.env.canvas_agent_openrouter_reasoning_enabled ??
    "",
  canvas_agent_openrouter_reasoning_effort:
    process.env.CANVAS_AGENT_OPENROUTER_REASONING_EFFORT ??
    process.env.canvas_agent_openrouter_reasoning_effort ??
    "",
  auth_url: (
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).replace(/\/+$/, ""),
  auth_secret: process.env.AUTH_SECRET ?? "", // openssl rand -base64 32
};
