import {
  buildWavespeedMappingCandidates,
  type WavespeedModelProduct,
} from "../src/shared/lib/wavespeed-model-discovery";

const API_URL = "https://wavespeed.ai/center/default/api/v1/model_product/find";

type FindResponse = {
  code?: number;
  message?: string;
  data?: {
    page: number;
    page_size: number;
    total: number;
    items: WavespeedModelProduct[];
  };
};

async function fetchPage(page: number, pageSize: number) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      origin: "https://wavespeed.ai",
      referer: "https://wavespeed.ai/image-generator",
      "user-agent": "Mozilla/5.0 (compatible; z-image.ai mapping discovery)",
    },
    body: JSON.stringify({
      page,
      page_size: pageSize,
      sort: "visits desc",
    }),
  });

  if (!response.ok) {
    throw new Error(`请求 WaveSpeed 模型列表失败: HTTP ${response.status}`);
  }

  return (await response.json()) as FindResponse;
}

async function main() {
  const pageSize = 200;
  const firstPage = await fetchPage(1, pageSize);
  const total = firstPage.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const products = [...(firstPage.data?.items || [])];

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await fetchPage(page, pageSize);
    products.push(...(result.data?.items || []));
  }

  const candidates = buildWavespeedMappingCandidates(products);
  console.log(JSON.stringify(candidates, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
