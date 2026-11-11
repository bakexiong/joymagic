import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

type ExampleRecord = {
  groupId?: string;
  inputImageUrl?: string;
  outputImageUrl?: string;
};

type CapturedResponse = {
  url: string;
  status: number;
  contentType: string;
  bodySnippet?: string;
};

type OutputPayload = {
  pageUrl: string;
  savedAt: string;
  examples: ExampleRecord[];
  exampleImageUrls: string[];
  networkHits: CapturedResponse[];
};

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function getExampleGroupId(url?: string) {
  if (!url) {
    return undefined;
  }

  return url.match(/https:\/\/static\.wavespeed\.ai\/examples\/([^/]+)\//i)?.[1];
}

function buildExampleMappings(urls: string[]) {
  const groups = new Map<string, ExampleRecord>();

  for (const url of urls) {
    const match = url.match(
      /https:\/\/static\.wavespeed\.ai\/examples\/([^/]+)\/([^/?#]+)/i,
    );

    if (!match) {
      continue;
    }

    const [, groupId, filename] = match;
    const entry = groups.get(groupId) || { groupId };
    const isOutput = /^1\.(jpg|jpeg|png|webp)$/i.test(filename);

    if (isOutput) {
      entry.outputImageUrl = url;
    } else if (!entry.inputImageUrl) {
      entry.inputImageUrl = url;
    }

    groups.set(groupId, entry);
  }

  return [...groups.values()].sort((left, right) =>
    (left.groupId || "").localeCompare(right.groupId || ""),
  );
}

function dedupeExamples(examples: ExampleRecord[]) {
  const seen = new Set<string>();
  const deduped: ExampleRecord[] = [];

  for (const example of examples) {
    const inputGroupId = getExampleGroupId(example.inputImageUrl);
    const outputGroupId = getExampleGroupId(example.outputImageUrl);

    if (inputGroupId && outputGroupId && inputGroupId !== outputGroupId) {
      continue;
    }

    const key = `${example.inputImageUrl || ""}::${example.outputImageUrl || ""}`;

    if (seen.has(key) || (!example.inputImageUrl && !example.outputImageUrl)) {
      continue;
    }

    seen.add(key);
    deduped.push(example);
  }

  return deduped;
}

function extractExampleUrlsFromText(source: string) {
  return source.match(
    /https:\/\/static\.wavespeed\.ai\/examples\/[^"'\\\s<]+\.(?:jpg|jpeg|png|webp)/gi,
  ) || [];
}

async function main() {
  const pageUrl =
    getArgValue("url") ||
    "https://wavespeed.ai/models/image-effects/advanced-photography";
  const outputPath = path.resolve(
    process.cwd(),
    getArgValue("output") || "examples.json",
  );
  const waitMs = Number(getArgValue("wait-ms") || "5000");
  const channel = getArgValue("channel") || "chrome";
  const headless = process.argv.includes("--headed") ? false : true;
  const locale = getArgValue("locale") || "en-US";
  const userDataDir = getArgValue("user-data-dir");
  const profileDirectory = getArgValue("profile-directory");

  const context = userDataDir
    ? await chromium.launchPersistentContext(userDataDir, {
        channel,
        headless,
        locale,
        viewport: { width: 1440, height: 960 },
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        args: [
          "--disable-blink-features=AutomationControlled",
          ...(profileDirectory ? [`--profile-directory=${profileDirectory}`] : []),
        ],
      })
    : await chromium.launch({
        channel,
        headless,
        args: ["--disable-blink-features=AutomationControlled"],
      }).then((browser) =>
        browser.newContext({
          locale,
          viewport: { width: 1440, height: 960 },
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        }),
      );

  const page = context.pages()[0] || (await context.newPage());

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  const networkHits: CapturedResponse[] = [];
  const networkExampleUrls = new Set<string>();

  page.on("response", async (response) => {
    const responseUrl = response.url();
    const contentType = response.headers()["content-type"] || "";

    if (
      !/example|examples|static\.wavespeed\.ai|advanced-photography|model_uuid/i.test(
        responseUrl,
      )
    ) {
      return;
    }

    try {
      const text = await response.text();
      const foundUrls = extractExampleUrlsFromText(text);

      for (const url of foundUrls) {
        networkExampleUrls.add(url);
      }

      networkHits.push({
        url: responseUrl,
        status: response.status(),
        contentType,
        bodySnippet: text.slice(0, 1000),
      });
    } catch {
      networkHits.push({
        url: responseUrl,
        status: response.status(),
        contentType,
      });
    }
  });

  await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

  try {
    await page.waitForLoadState("networkidle", { timeout: 15_000 });
  } catch {
    // Wavespeed 会持续发起部分请求，networkidle 超时不影响我们抓取已渲染内容。
  }

  await page.waitForTimeout(waitMs);

  const domImageUrls = await page.evaluate(() => {
    const candidates = new Set<string>();

    for (const image of document.querySelectorAll("img")) {
      if (image.currentSrc) {
        candidates.add(image.currentSrc);
      }

      if (image.src) {
        candidates.add(image.src);
      }
    }

    return [...candidates].filter((url) =>
      /https:\/\/static\.wavespeed\.ai\/examples\//i.test(url),
    );
  });

  const html = await page.content();
  const htmlExampleUrls = extractExampleUrlsFromText(html);

  await context.close();

  const exampleImageUrls = [...new Set([
    ...domImageUrls,
    ...htmlExampleUrls,
    ...networkExampleUrls,
  ])].sort((left, right) => left.localeCompare(right));

  const examples = dedupeExamples(buildExampleMappings(exampleImageUrls));

  const payload: OutputPayload = {
    pageUrl,
    savedAt: new Date().toISOString(),
    examples,
    exampleImageUrls,
    networkHits,
  };

  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        pageUrl,
        outputPath,
        exampleCount: examples.length,
        imageUrlCount: exampleImageUrls.length,
        networkHitCount: networkHits.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
