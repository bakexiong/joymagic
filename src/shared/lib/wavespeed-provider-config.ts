import { getPricingConfigFromDB } from "@/shared/models/pricing-config";

export type WavespeedProviderRuntimeConfig = {
  providerKey: string;
  apiKey: string;
  baseUrl: string;
};

function isWavespeedProvider(providerKey: string, provider: any) {
  return (
    providerKey.toLowerCase().includes("wavespeed") ||
    String(provider?.name || "")
      .toLowerCase()
      .includes("wavespeed") ||
    String(provider?.baseUrl || "").includes("api.wavespeed.ai")
  );
}

export async function getWavespeedProviderRuntimeConfig(): Promise<WavespeedProviderRuntimeConfig> {
  const pricingConfig = await getPricingConfigFromDB();
  const providers = pricingConfig?.providers || {};
  const entry = Object.entries(providers).find(([providerKey, provider]) =>
    isWavespeedProvider(providerKey, provider),
  );

  if (!entry) {
    throw new Error("pricing_config 中未配置 WaveSpeed provider");
  }

  const [providerKey, provider] = entry;
  const apiKey = String(provider.apiKey || "").trim();

  if (!apiKey) {
    throw new Error(`pricing_config.providers.${providerKey}.apiKey 未配置`);
  }

  return {
    providerKey,
    apiKey,
    baseUrl: String(provider.baseUrl || "https://api.wavespeed.ai").replace(
      /\/+$/,
      "",
    ),
  };
}
