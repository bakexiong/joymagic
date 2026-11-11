import fs from "node:fs/promises";
import path from "node:path";

const API_URL = "https://wavespeed.ai/center/default/api/v1/model_product/find";
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/lib/wavespeed-model-products.json",
);
const PAGE_SIZE = 200;

type WavespeedModelProduct = {
  model_id: number;
  model_uuid: string;
  model_name: string;
  type?: string;
  tags?: string[];
  visits?: number;
  cover_url?: string;
  poster?: string;
  description?: string;
};

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

async function fetchPage(page: number) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      origin: "https://wavespeed.ai",
      referer: "https://wavespeed.ai/image-generator",
      "user-agent": "Mozilla/5.0 (compatible; z-image.ai sync bot)",
    },
    body: JSON.stringify({
      page,
      page_size: PAGE_SIZE,
      sort: "visits desc",
    }),
  });

  if (!response.ok) {
    throw new Error(`请求 WaveSpeed 模型列表失败: HTTP ${response.status}`);
  }

  return (await response.json()) as FindResponse;
}

async function main() {
  const firstPage = await fetchPage(1);
  const total = firstPage.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = [...(firstPage.data?.items || [])];

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await fetchPage(page);
    items.push(...(result.data?.items || []));
    console.log(`fetched page ${page}/${totalPages}`);
  }

  await fs.writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        total,
        pageSize: PAGE_SIZE,
        items,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`saved ${items.length} models to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
