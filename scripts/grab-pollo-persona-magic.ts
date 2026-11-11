import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { chromium } from "playwright";

type EffectRecord = {
  name: string;
  imageUrl?: string;
};

type OutputPayload = {
  pageUrl: string;
  savedAt: string;
  title: string;
  effects: EffectRecord[];
};

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function autoScroll(page: Parameters<typeof chromium.launch>[0] extends never ? never : any) {
  let stableRounds = 0;
  let previousHeight = 0;

  for (let round = 0; round < 30; round += 1) {
    const beforeCount = await page.locator("img").count();

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(1800);

    const loadMoreButton = page
      .locator("button")
      .filter({ hasText: /load more|show more|more/i })
      .first();

    if (await loadMoreButton.isVisible().catch(() => false)) {
      await loadMoreButton.click().catch(() => undefined);
      await page.waitForTimeout(1800);
    }

    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    const afterCount = await page.locator("img").count();

    if (currentHeight === previousHeight && afterCount === beforeCount) {
      stableRounds += 1;
    } else {
      stableRounds = 0;
    }

    previousHeight = currentHeight;

    if (stableRounds >= 3) {
      break;
    }
  }
}

async function extractEffects(
  page: Parameters<typeof chromium.launch>[0] extends never ? never : any,
): Promise<EffectRecord[]> {
  return page.evaluate(() => {
    const textSet = new Set<string>();
    const effects: Array<{ name: string; imageUrl?: string }> = [];
    const badTexts = new Set([
      "pollo.ai",
      "persona magic",
      "privacy",
      "terms",
      "log in",
      "sign up",
      "home",
      "pricing",
      "api",
      "blog",
    ]);

    const pushName = (name: string, imageUrl?: string) => {
      const normalized = name.replace(/\s+/g, " ").trim();

      if (!normalized) return;
      if (normalized.length > 80) return;
      if (normalized.split(" ").length > 8) return;
      if (badTexts.has(normalized.toLowerCase())) return;
      if (!/[a-z]/i.test(normalized)) return;
      if (textSet.has(normalized.toLowerCase())) return;

      textSet.add(normalized.toLowerCase());
      effects.push({ name: normalized, imageUrl });
    };

    const imageElements = Array.from(document.querySelectorAll("img"));

    for (const img of imageElements) {
      const src = img.currentSrc || img.getAttribute("src") || undefined;

      const candidates = [
        img.getAttribute("alt"),
        img.getAttribute("title"),
        img.parentElement?.textContent,
        img.closest("a")?.textContent,
        img.closest("button")?.textContent,
        img.closest("div")?.textContent,
      ];

      for (const candidate of candidates) {
        if (!candidate) continue;

        const lines = candidate
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);

        for (const line of lines) {
          pushName(line, src);
        }
      }
    }

    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, [role='heading']"),
    );

    for (const heading of headings) {
      const text = heading.textContent?.trim();
      if (text) {
        pushName(text);
      }
    }

    return effects;
  });
}

async function main() {
  const pageUrl =
    getArgValue("url") || "https://pollo.ai/app/photo-effects/persona-magic";
  const outputPath = path.resolve(
    process.cwd(),
    getArgValue("output") || "tmp/pollo-persona-magic.json",
  );
  const userDataDir =
    getArgValue("user-data-dir") ||
    path.join(
      process.env.HOME || "",
      "Library/Application Support/Google/Chrome",
    );
  const profileDirectory = getArgValue("profile-directory") || "Default";
  const headless = process.argv.includes("--headed") ? false : true;
  const waitForManual = process.argv.includes("--wait-for-manual");

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless,
    viewport: { width: 1440, height: 1600 },
    args: [
      "--disable-blink-features=AutomationControlled",
      `--profile-directory=${profileDirectory}`,
    ],
  });

  const page = context.pages()[0] || (await context.newPage());

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(5000);

  if (waitForManual) {
    const rl = readline.createInterface({ input, output });
    try {
      console.log("请在打开的浏览器窗口中完成 Pollo 页面验证，然后回到终端按回车继续抓取...");
      await rl.question("");
    } finally {
      rl.close();
    }
    await page.waitForTimeout(3000);
  }

  await autoScroll(page);

  const title = await page.title();
  const effects = await extractEffects(page);

  await context.close();

  const payload: OutputPayload = {
    pageUrl,
    savedAt: new Date().toISOString(),
    title,
    effects,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        outputPath,
        title,
        count: effects.length,
        effects: effects.map((item) => item.name),
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
