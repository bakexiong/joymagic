import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, "src", "mastra", "public");
const publicDotMastraPath = path.join(publicDir, ".mastra");
const rootDotMastraPath = path.join(projectRoot, ".mastra");
const relativeTarget = path.relative(publicDir, rootDotMastraPath);

fs.mkdirSync(publicDir, { recursive: true });

try {
  const existing = fs.lstatSync(publicDotMastraPath);
  if (existing.isSymbolicLink()) {
    const currentTarget = fs.readlinkSync(publicDotMastraPath);
    if (currentTarget === relativeTarget) {
      process.exit(0);
    }
  }

  fs.rmSync(publicDotMastraPath, { recursive: true, force: true });
} catch {
  // no existing link or directory, continue
}

fs.symlinkSync(relativeTarget, publicDotMastraPath, "dir");
