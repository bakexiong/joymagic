import { PinoLogger } from "@mastra/loggers";

export const mastraLogger = new PinoLogger({
  name: "canvas-mastra",
});

export function getLocalMastraObservabilityDuckDbPath() {
  if (process.env.MASTRA_DUCKDB_PATH?.trim()) {
    return process.env.MASTRA_DUCKDB_PATH.trim();
  }

  return `.mastra/observability-${process.pid}.duckdb`;
}
