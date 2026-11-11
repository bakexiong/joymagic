import { respData, respErr } from "@/shared/lib/resp";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";

import { db } from "@/core/db";
import { config as configTable } from "@/config/db/schema";

function getTurnstileSecretKey(): string | undefined {
    // Prefer Cloudflare runtime env if available
    try {
        const cf = getCloudflareContext();
        const fromCf = (cf as any)?.env?.CF_TURNSTILE_SECRET_KEY as string | undefined;
        if (fromCf) return fromCf;
    } catch {
        // Not in Cloudflare runtime, fall through to process.env
    }
    return process.env.CF_TURNSTILE_SECRET_KEY;
}

async function getTurnstileSecretKeyFromDb(): Promise<string | undefined> {
    try {
        const [row] = await db()
            .select()
            .from(configTable)
            .where(eq(configTable.name, "cf_turnstile_secret_key"))
            .limit(1);
        return row?.value ?? undefined;
    } catch (e) {
        console.error("load turnstile secret from db failed");
        return undefined;
    }
}

export async function POST(req: Request) {
    try {
        let TURNSTILE_SECRET_KEY = getTurnstileSecretKey();
        if (!TURNSTILE_SECRET_KEY) {
            TURNSTILE_SECRET_KEY = await getTurnstileSecretKeyFromDb();
        }
        if (!TURNSTILE_SECRET_KEY) {
            // 未配置密钥时直接放行，避免阻断正常登录（可按需改为严格模式）
            return respData({ success: true, skipped: true });
        }

        const { token } = (await req.json()) || {};
        if (!token) {
            return respErr("missing token");
        }

        const formData = new FormData();
        formData.append("secret", TURNSTILE_SECRET_KEY);
        formData.append("response", token);

        const result = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                body: formData,
            }
        );

        const data = await result.json();

        if (!data.success) {
            console.log("Turnstile verify failed:", JSON.stringify(data));
            return respData({ success: false, error: "verification_failed" });
        }

        return respData({ success: true });
    } catch (e) {
        console.log("verify turnstile failed:" + e);
        // 失败时不暴露细节
        return respData({ success: false, error: "verification_error" });
    }
}


