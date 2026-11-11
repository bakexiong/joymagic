import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src/config/locale/messages');

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && ent.name === 'landing.json') out.push(p);
  }
  return out;
}

function pickFirstChildIconUrl(scene) {
  if (!scene || !Array.isArray(scene.children)) return undefined;
  for (const child of scene.children) {
    if (child?.icon_url) return child.icon_url;
  }
  return undefined;
}

function fixFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error('SKIP (invalid json):', file);
    return { changed: false, fixes: 0 };
  }

  const items = json?.header?.nav?.items;
  if (!Array.isArray(items)) return { changed: false, fixes: 0 };

  let fixes = 0;

  for (const top of items) {
    if (!top || !Array.isArray(top.children) || top.children.length === 0) continue;

    // Only for AI menus
    if (top.icon !== 'Image' && top.icon !== 'Video') continue;

    for (const scene of top.children) {
      if (!scene || !Array.isArray(scene.children) || scene.children.length === 0) continue;
      if (!scene.icon_url) {
        const iconUrl = pickFirstChildIconUrl(scene);
        if (iconUrl) {
          scene.icon_url = iconUrl;
          fixes++;
        }
      }
    }
  }

  if (fixes > 0) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
    return { changed: true, fixes };
  }

  return { changed: false, fixes: 0 };
}

const files = walk(root);
let totalFixes = 0;
let changedFiles = 0;

for (const f of files) {
  const { changed, fixes } = fixFile(f);
  if (changed) {
    changedFiles++;
    totalFixes += fixes;
  }
}

console.log(`Done. changedFiles=${changedFiles}, totalFixes=${totalFixes}`);
