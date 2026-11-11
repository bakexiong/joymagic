import { getAllConfigs } from "@/shared/models/config";

type CreemDiscountRecord = {
  id?: string;
  code?: string;
  type?: string;
  percentage?: number;
  duration?: string;
  expiry_date?: string | null;
  applies_to_products?: string[];
  redeem_count?: number;
};

function getCreemBaseUrl(environment?: string) {
  return environment === "production"
    ? "https://api.creem.io"
    : "https://test-api.creem.io";
}

function parseCreemProductIds(raw?: string | null) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Array.from(
      new Set(
        Object.values(parsed)
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );
  } catch (error) {
    console.error("[creem-discounts] failed to parse creem_product_ids", error);
    return [];
  }
}

async function requestCreem(
  endpoint: string,
  method: string,
  apiKey: string,
  environment?: string,
  data?: unknown,
) {
  const requestUrl = `${getCreemBaseUrl(environment)}${endpoint}`;
  console.log("[creem-discounts] request", {
    method,
    requestUrl,
    endpoint,
    environment: environment || "sandbox",
    payload: data || null,
  });

  const response = await fetch(requestUrl, {
    method,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (response.status === 404 && method === "GET") {
    console.log("[creem-discounts] response", {
      method,
      requestUrl,
      endpoint,
      status: response.status,
      result: null,
    });
    return null;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[creem-discounts] request failed", {
      method,
      requestUrl,
      endpoint,
      status: response.status,
      result: text || null,
    });
    throw new Error(
      text || `request creem api failed with status: ${response.status}`,
    );
  }

  const text = await response.text();
  if (!text) {
    console.log("[creem-discounts] response", {
      method,
      requestUrl,
      endpoint,
      status: response.status,
      result: null,
    });
    return null;
  }

  const parsed = JSON.parse(text);
  console.log("[creem-discounts] response", {
    method,
    requestUrl,
    endpoint,
    status: response.status,
    result: parsed,
  });

  return parsed;
}

async function getCreemDiscountByCode(opts: {
  apiKey: string;
  environment?: string;
  code: string;
}) {
  const result = (await requestCreem(
    `/v1/discounts?discount_code=${encodeURIComponent(opts.code)}`,
    "GET",
    opts.apiKey,
    opts.environment,
  )) as CreemDiscountRecord | null;

  if (!result || (result as any)?.error) {
    return null;
  }

  return result;
}

async function deleteCreemDiscountById(opts: {
  apiKey: string;
  environment?: string;
  discountId: string;
}) {
  await requestCreem(
    `/v1/discounts/${opts.discountId}/delete`,
    "DELETE",
    opts.apiKey,
    opts.environment,
  );
}

export async function deleteAffiliateDiscountCodeFromCreem(
  code?: string | null,
) {
  const normalizedCode = String(code || "").trim();
  if (!normalizedCode) {
    return;
  }

  const configs = await getAllConfigs();
  if (configs.creem_enabled !== "true" || !configs.creem_api_key) {
    return;
  }

  const existing = await getCreemDiscountByCode({
    apiKey: configs.creem_api_key,
    environment: configs.creem_environment,
    code: normalizedCode,
  });

  if (existing?.id) {
    await deleteCreemDiscountById({
      apiKey: configs.creem_api_key,
      environment: configs.creem_environment,
      discountId: existing.id,
    });
  }
}

export async function syncAffiliateDiscountCodeToCreem(opts: {
  code: string;
  name?: string | null;
  percentage: number;
  enabled: boolean;
  expiryDate?: string | null;
}) {
  const code = String(opts.code || "").trim();
  if (!code) {
    console.log("[creem-discounts] sync skipped", {
      code,
      reason: "missing_code",
    });
    return { skipped: true, reason: "missing_code" as const };
  }

  const configs = await getAllConfigs();
  if (configs.creem_enabled !== "true" || !configs.creem_api_key) {
    console.log("[creem-discounts] sync skipped", {
      code,
      reason: "creem_disabled",
    });
    return { skipped: true, reason: "creem_disabled" as const };
  }

  const appliesToProducts = parseCreemProductIds(configs.creem_product_ids);
  if (!appliesToProducts.length) {
    console.log("[creem-discounts] sync skipped", {
      code,
      reason: "missing_products",
    });
    return { skipped: true, reason: "missing_products" as const };
  }

  const apiKey = configs.creem_api_key;
  const environment = configs.creem_environment;
  const desiredPercentage = Number(opts.percentage.toFixed(2));
  const desiredExpiryDate = opts.expiryDate || null;
  const existing = await getCreemDiscountByCode({
    apiKey,
    environment,
    code,
  });

  console.log("[creem-discounts] sync prepare", {
    code,
    enabled: opts.enabled,
    desiredPercentage,
    desiredExpiryDate,
    existing: existing || null,
  });

  if (!opts.enabled) {
    if (existing?.id) {
      await deleteCreemDiscountById({
        apiKey,
        environment,
        discountId: existing.id,
      });
    }
    console.log("[creem-discounts] sync skipped", {
      code,
      reason: "disabled",
      existing: existing || null,
    });
    return { skipped: true, reason: "disabled" as const };
  }

  const existingProducts = [...(existing?.applies_to_products || [])].sort();
  const desiredProducts = [...appliesToProducts].sort();
  const matchesExisting =
    existing?.id &&
    existing.type === "percentage" &&
    Number(existing.percentage || 0) === desiredPercentage &&
    existing.duration === "once" &&
    (existing.expiry_date || null) === desiredExpiryDate &&
    JSON.stringify(existingProducts) === JSON.stringify(desiredProducts);

  if (matchesExisting) {
    console.log("[creem-discounts] sync skipped", {
      code,
      reason: "matches_existing",
      discountId: existing.id,
    });
    return { skipped: false, synced: true as const, discountId: existing.id };
  }

  if (existing?.id) {
    await deleteCreemDiscountById({
      apiKey,
      environment,
      discountId: existing.id,
    });
  }

  const created = (await requestCreem(
    "/v1/discounts",
    "POST",
    apiKey,
    environment,
    {
      name: opts.name || `Affiliate ${code}`,
      code,
      type: "percentage",
      percentage: desiredPercentage,
      duration: "once",
      expiry_date: desiredExpiryDate,
      applies_to_products: appliesToProducts,
    },
  )) as CreemDiscountRecord | null;

  return {
    skipped: false,
    synced: true as const,
    discountId: created?.id,
  };
}
