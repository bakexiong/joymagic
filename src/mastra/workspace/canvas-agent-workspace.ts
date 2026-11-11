import path from "path";
import fs from "fs";
import { LocalFilesystem, Workspace } from "@mastra/core/workspace";

function getProjectRoot() {
  return process.cwd();
}

export function getCanvasAgentSkillsDirectory() {
  return path.join(getProjectRoot(), "src/mastra/skills");
}

export function createCanvasAgentWorkspace() {
  return new Workspace({
    id: "canvas-agent-workspace",
    name: "Canvas Agent Workspace",
    filesystem: new LocalFilesystem({
      basePath: getProjectRoot(),
    }),
    skills: () => {
      const skillsDirectory = getCanvasAgentSkillsDirectory();
      const entries = fs.existsSync(skillsDirectory)
        ? fs
            .readdirSync(skillsDirectory, { withFileTypes: true })
            .filter(
              (entry) => entry.isDirectory() && !entry.name.startsWith("_"),
            )
            .map((entry) => path.join(skillsDirectory, entry.name))
        : [];

      return entries;
    },
  });
}
