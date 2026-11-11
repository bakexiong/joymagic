const fs = require("fs");
const path = require("path");

const PAGE_URL = "https://app.zencreator.pro/tools/generator-by-prompt";
const API_BASE =
  "https://api.zencreator.pro/api/v1/tools/templates?tool_name=by_prompt&page_size=12&public=true&sort_by=new_first_popularity&website_only=false";

const namePhraseMap = [
  ["midnight", "late-night"],
  ["moonlight", "lunar glow"],
  ["sunset", "golden dusk"],
  ["sunrise", "morning glow"],
  ["winter", "snowy"],
  ["autumn", "fall"],
  ["urban", "city"],
  ["street", "roadside"],
  ["girl", "woman"],
  ["lady", "woman"],
  ["hot tub", "spa soak"],
  ["selfie", "portrait snap"],
  ["beauty", "glamour"],
  ["bliss", "serenity"],
  ["dream", "reverie"],
  ["angel", "celestial muse"],
  ["cupid", "love-struck archer"],
  ["red", "crimson"],
  ["pink", "rose"],
  ["blue", "azure"],
  ["gold", "gilded"],
  ["silver", "silken silver"],
  ["party", "celebration"],
  ["night", "after-dark"],
  ["studio", "atelier"],
  ["beach", "shoreline"],
  ["pool", "billiards"],
  ["cowgirl", "western muse"],
  ["princess", "royal muse"],
  ["bunny", "hare-inspired"],
  ["rose", "floral"],
  ["vibes", "mood"],
];

const promptPhraseMap = [
  ["Photorealistic", "Hyper-realistic"],
  ["photorealistic", "hyper-realistic"],
  ["iPhone photo", "smartphone snapshot"],
  ["iPhone", "smartphone"],
  ["studio portrait", "editorial studio portrait"],
  ["lifestyle portrait", "editorial lifestyle portrait"],
  ["lifestyle photo", "editorial lifestyle photo"],
  ["high-fashion", "fashion-forward"],
  ["high fashion", "fashion editorial"],
  ["young woman", "young adult woman"],
  ["sexy woman", "glamorous woman"],
  ["beautiful woman", "striking woman"],
  ["clean minimal", "refined minimal"],
  ["clean shadows", "defined shadows"],
  ["soft lighting", "gentle lighting"],
  ["warm lighting", "warm ambient lighting"],
  ["dramatic lighting", "cinematic lighting"],
  ["high contrast", "pronounced contrast"],
  ["ultra sharp focus", "crisp focal clarity"],
  ["professional studio photography", "polished editorial photography"],
  ["high detail", "rich detail"],
  ["realistic pores", "lifelike skin texture"],
  ["realistic skin texture", "lifelike skin texture"],
  ["realistic skin", "natural-looking skin"],
  ["confident expression", "self-assured expression"],
  ["gentle smile", "soft smile"],
  ["soft pink", "muted pink"],
  ["bold red", "vivid red"],
  ["vibrant reds", "saturated crimson tones"],
  ["balanced exposure", "even exposure"],
  ["dark city background", "dim city backdrop"],
  ["snow piles", "snow banks"],
  ["outdoor hot tub", "open-air hot tub"],
  ["waist-deep", "standing immersed to the waist"],
  ["bright studio lighting", "bright controlled studio lighting"],
  ["direct flash", "on-camera flash"],
  ["cozy", "inviting"],
  ["sleek and straight", "sleek, straight styling"],
  ["standing in front of", "posed before"],
  ["holding", "grasping"],
  ["looking at the camera", "meeting the camera gaze"],
  ["eyes locked toward the camera", "eyes focused directly toward the lens"],
  ["No heavy cinematic grading", "Avoid heavy cinematic color grading"],
];

function titleCase(input) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function replaceAllCaseInsensitive(input, from, to) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return input.replace(new RegExp(escaped, "gi"), (match) => {
    if (match === match.toUpperCase()) {
      return to.toUpperCase();
    }
    if (match[0] === match[0].toUpperCase()) {
      return to.charAt(0).toUpperCase() + to.slice(1);
    }
    return to;
  });
}

function rewriteTemplateName(name) {
  let output = name;
  for (const [from, to] of namePhraseMap) {
    output = replaceAllCaseInsensitive(output, from, to);
  }

  output = output.replace(/\s+/g, " ").trim();
  output = titleCase(output);

  if (output.toLowerCase() === name.toLowerCase()) {
    output = `${output} Reimagined`;
  }

  return output;
}

function rewritePrompt(prompt) {
  if (!prompt) {
    return "";
  }

  let output = prompt.replace(/\r\n/g, "\n").trim();

  for (const [from, to] of promptPhraseMap) {
    output = replaceAllCaseInsensitive(output, from, to);
  }

  output = output
    .replace(/\bwith\b/gi, "featuring")
    .replace(/\band\b/gi, "plus")
    .replace(/standing standing immersed to the waist/gi, "standing immersed to the waist")
    .replace(/\b(\w+)\s+\1\b/gi, "$1")
    .replace(/standing immersed to the waist/gi, "immersed to the waist")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!/[.!?]$/.test(output)) {
    output += ".";
  }

  if (!/natural proportions|lifelike textures|polished finish/i.test(output)) {
    output += " Natural proportions, lifelike textures, polished final finish.";
  }

  return output;
}

async function fetchPage(page) {
  const response = await fetch(`${API_BASE}&page=${page}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: ${response.status}`);
  }
  return response.json();
}

async function main() {
  const firstPage = await fetchPage(1);
  const totalPages = firstPage.total_pages || 1;
  const allRows = [...(firstPage.data || [])];

  for (let page = 2; page <= totalPages; page += 1) {
    const json = await fetchPage(page);
    allRows.push(...(json.data || []));
  }

  const simplified = allRows.map((item) => ({
    TemplateName: item.name || "",
    prompt: item?.input?.positive_prompt || "",
  }));

  const rewritten = simplified.map((item) => ({
    TemplateName: rewriteTemplateName(item.TemplateName),
    prompt: rewritePrompt(item.prompt),
  }));

  const outDir = path.join(process.cwd(), "docs");
  const rawPath = path.join(outDir, "zencreator-generator-by-prompt.templates.simple.json");
  const rewrittenPath = path.join(
    outDir,
    "zencreator-generator-by-prompt.templates.rewritten.json"
  );

  fs.writeFileSync(
    rawPath,
    `${JSON.stringify(
      {
        source: PAGE_URL,
        api: API_BASE,
        collected_at: new Date().toISOString(),
        total_templates: simplified.length,
        templates: simplified,
      },
      null,
      2
    )}\n`
  );

  fs.writeFileSync(
    rewrittenPath,
    `${JSON.stringify(
      {
        source: PAGE_URL,
        rewritten_from: rawPath,
        generated_at: new Date().toISOString(),
        total_templates: rewritten.length,
        templates: rewritten,
      },
      null,
      2
    )}\n`
  );

  console.log(
    JSON.stringify(
      {
        source: PAGE_URL,
        total_templates: simplified.length,
        rawPath,
        rewrittenPath,
        sample: rewritten.slice(0, 3),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
