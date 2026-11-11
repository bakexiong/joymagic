import { randomUUID } from "crypto";

import { and, desc, eq, inArray } from "drizzle-orm";

import {
  workbenchCanvasProject,
  workbenchCanvasProjectCreation,
  workbenchCanvasSnapshot,
  workbenchCreation,
} from "@/config/db/schema";
import { db } from "@/core/db";
import type { CanvasGraph } from "@/shared/blocks/creator-workbench/canvas/core/canvas-types";

const DEFAULT_PROJECT_NAME = "未命名画布";

export type CreateWorkbenchCanvasProjectInput = {
  userId: string;
  name?: string | null;
  entrySceneId?: string | null;
  entryModelUrl?: string | null;
  initialGraph?: CanvasGraph | null;
  meta?: Record<string, any> | null;
};

export type UpdateWorkbenchCanvasProjectInput = {
  id: string;
  userId: string;
  name?: string;
  coverUrl?: string | null;
  status?: string;
};

function normalizeProjectName(name?: string | null) {
  const normalized = String(name || "")
    .trim()
    .replace(/\s+/g, " ");
  return normalized || DEFAULT_PROJECT_NAME;
}

function createEmptyGraph(): CanvasGraph {
  return {
    nodes: [],
    edges: [],
    viewport: { x: 140, y: 120, scale: 1 },
    selection: { nodeId: null, edgeId: null },
    composer: { nodeId: null, references: [] },
    commandMenu: null,
  };
}

function serializeGraph(graph: CanvasGraph) {
  return JSON.stringify({
    ...graph,
    commandMenu: null,
  });
}

function parseGraph(graphJson: string | null | undefined): CanvasGraph {
  if (!graphJson) return createEmptyGraph();

  try {
    const parsed = JSON.parse(graphJson);
    return {
      nodes: Array.isArray(parsed?.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed?.edges) ? parsed.edges : [],
      viewport:
        parsed?.viewport &&
        typeof parsed.viewport.x === "number" &&
        typeof parsed.viewport.y === "number" &&
        typeof parsed.viewport.scale === "number"
          ? parsed.viewport
          : { x: 140, y: 120, scale: 1 },
      selection: {
        nodeId:
          typeof parsed?.selection?.nodeId === "string"
            ? parsed.selection.nodeId
            : null,
        edgeId:
          typeof parsed?.selection?.edgeId === "string"
            ? parsed.selection.edgeId
            : null,
      },
      composer: {
        nodeId:
          typeof parsed?.composer?.nodeId === "string"
            ? parsed.composer.nodeId
            : null,
        references: Array.isArray(parsed?.composer?.references)
          ? parsed.composer.references
          : [],
      },
      commandMenu: null,
    };
  } catch {
    return createEmptyGraph();
  }
}

function parseMeta(metaJson: string | null | undefined) {
  if (!metaJson) return null;
  try {
    return JSON.parse(metaJson);
  } catch {
    return null;
  }
}

function getCoverUrlFromGraph(graph: CanvasGraph): string | null {
  const imageResults = graph.nodes.filter(
    (node) => node.kind === "result" && node.data.mediaKind === "image" && node.data.url,
  );
  const latest = imageResults.at(-1);
  return latest?.kind === "result" ? latest.data.url || null : null;
}

function extractCanvasProjectCreationMappings(graph: CanvasGraph) {
  const mappings = new Map<
    string,
    { creationId: string; sourceNodeId: string | null }
  >();

  graph.nodes.forEach((node) => {
    if (node.kind !== "workflow") return;
    const creationId = node.data.generatedCreationRecordId?.trim();
    if (!creationId) return;
    mappings.set(creationId, {
      creationId,
      sourceNodeId: node.id,
    });
  });

  graph.nodes.forEach((node) => {
    if (node.kind !== "result") return;
    const creationId = node.data.creationRecordId?.trim();
    if (!creationId) return;
    mappings.set(creationId, {
      creationId,
      sourceNodeId: node.id,
    });
  });

  return Array.from(mappings.values());
}

async function syncWorkbenchCanvasProjectCreations(input: {
  projectId: string;
  userId: string;
  graph: CanvasGraph;
}) {
  const nextMappings = extractCanvasProjectCreationMappings(input.graph);
  const nextCreationIds = nextMappings.map((item) => item.creationId);

  const existingMappings = await db()
    .select({
      id: workbenchCanvasProjectCreation.id,
      creationId: workbenchCanvasProjectCreation.creationId,
    })
    .from(workbenchCanvasProjectCreation)
    .where(
      and(
        eq(workbenchCanvasProjectCreation.projectId, input.projectId),
        eq(workbenchCanvasProjectCreation.userId, input.userId),
      ),
    );

  const existingByCreationId = new Map(
    existingMappings.map((item) => [item.creationId, item]),
  );

  const staleMappings = existingMappings.filter(
    (item) => !nextCreationIds.includes(item.creationId),
  );

  if (staleMappings.length > 0) {
    await db()
      .delete(workbenchCanvasProjectCreation)
      .where(
        inArray(
          workbenchCanvasProjectCreation.id,
          staleMappings.map((item) => item.id),
        ),
      );
  }

  if (nextCreationIds.length === 0) {
    return [];
  }

  const ownedCreations = await db()
    .select({ id: workbenchCreation.id })
    .from(workbenchCreation)
    .where(
      and(
        eq(workbenchCreation.userId, input.userId),
        inArray(workbenchCreation.id, nextCreationIds),
      ),
    );
  const ownedCreationIds = new Set(ownedCreations.map((item) => item.id));

  const insertRows = nextMappings
    .filter(
      (item) =>
        ownedCreationIds.has(item.creationId) &&
        !existingByCreationId.has(item.creationId),
    )
    .map((item) => ({
      id: randomUUID(),
      userId: input.userId,
      projectId: input.projectId,
      creationId: item.creationId,
      sourceNodeId: item.sourceNodeId,
    }));

  if (insertRows.length > 0) {
    await db().insert(workbenchCanvasProjectCreation).values(insertRows);
  }

  await Promise.all(
    nextMappings
      .filter(
        (item) =>
          ownedCreationIds.has(item.creationId) &&
          existingByCreationId.has(item.creationId),
      )
      .map((item) =>
        db()
          .update(workbenchCanvasProjectCreation)
          .set({
            sourceNodeId: item.sourceNodeId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(workbenchCanvasProjectCreation.projectId, input.projectId),
              eq(workbenchCanvasProjectCreation.userId, input.userId),
              eq(workbenchCanvasProjectCreation.creationId, item.creationId),
            ),
          ),
      ),
  );

  return nextMappings.filter((item) => ownedCreationIds.has(item.creationId));
}

export async function createWorkbenchCanvasProject(
  input: CreateWorkbenchCanvasProjectInput,
) {
  const projectId = randomUUID();
  const snapshotId = randomUUID();
  const now = new Date();
  const initialGraph = input.initialGraph ?? createEmptyGraph();
  const coverUrl = getCoverUrlFromGraph(initialGraph);

  const [project] = await db()
    .insert(workbenchCanvasProject)
    .values({
      id: projectId,
      userId: input.userId,
      name: normalizeProjectName(input.name),
      mode: "canvas",
      status: "draft",
      coverUrl,
      entrySceneId: input.entrySceneId || null,
      entryModelUrl: input.entryModelUrl || null,
      lastOpenedAt: now,
    })
    .returning();

  const [snapshot] = await db()
    .insert(workbenchCanvasSnapshot)
    .values({
      id: snapshotId,
      projectId,
      userId: input.userId,
      version: 1,
      graphJson: serializeGraph(initialGraph),
      metaJson: input.meta ? JSON.stringify(input.meta) : null,
    })
    .returning();

  await syncWorkbenchCanvasProjectCreations({
    projectId,
    userId: input.userId,
    graph: initialGraph,
  });

  return {
    project,
    snapshot: {
      ...snapshot,
      graph: initialGraph,
      meta: parseMeta(snapshot.metaJson),
    },
  };
}

export async function listWorkbenchCanvasProjects(userId: string) {
  return db()
    .select()
    .from(workbenchCanvasProject)
    .where(eq(workbenchCanvasProject.userId, userId))
    .orderBy(
      desc(workbenchCanvasProject.lastOpenedAt),
      desc(workbenchCanvasProject.updatedAt),
      desc(workbenchCanvasProject.createdAt),
    );
}

export async function getWorkbenchCanvasProjectById(id: string, userId: string) {
  const [project] = await db()
    .select()
    .from(workbenchCanvasProject)
    .where(
      and(eq(workbenchCanvasProject.id, id), eq(workbenchCanvasProject.userId, userId)),
    )
    .limit(1);

  if (!project) {
    return null;
  }

  const [snapshot] = await db()
    .select()
    .from(workbenchCanvasSnapshot)
    .where(
      and(
        eq(workbenchCanvasSnapshot.projectId, project.id),
        eq(workbenchCanvasSnapshot.userId, userId),
      ),
    )
    .limit(1);

  const creations = await db()
    .select({
      creationId: workbenchCanvasProjectCreation.creationId,
      sourceNodeId: workbenchCanvasProjectCreation.sourceNodeId,
      createdAt: workbenchCanvasProjectCreation.createdAt,
    })
    .from(workbenchCanvasProjectCreation)
    .where(
      and(
        eq(workbenchCanvasProjectCreation.projectId, project.id),
        eq(workbenchCanvasProjectCreation.userId, userId),
      ),
    )
    .orderBy(desc(workbenchCanvasProjectCreation.createdAt));

  return {
    project,
    snapshot: snapshot
      ? {
          ...snapshot,
          graph: parseGraph(snapshot.graphJson),
          meta: parseMeta(snapshot.metaJson),
        }
      : null,
    creations,
  };
}

export async function touchWorkbenchCanvasProject(id: string, userId: string) {
  const [updated] = await db()
    .update(workbenchCanvasProject)
    .set({
      lastOpenedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(workbenchCanvasProject.id, id), eq(workbenchCanvasProject.userId, userId)),
    )
    .returning();

  return updated;
}

export async function updateWorkbenchCanvasProject(
  input: UpdateWorkbenchCanvasProjectInput,
) {
  const next: Partial<typeof workbenchCanvasProject.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    next.name = normalizeProjectName(input.name);
  }
  if (input.coverUrl !== undefined) {
    next.coverUrl = input.coverUrl;
  }
  if (input.status !== undefined) {
    next.status = input.status;
  }

  const [updated] = await db()
    .update(workbenchCanvasProject)
    .set(next)
    .where(
      and(eq(workbenchCanvasProject.id, input.id), eq(workbenchCanvasProject.userId, input.userId)),
    )
    .returning();

  return updated;
}

export async function deleteWorkbenchCanvasProjectById(id: string, userId: string) {
  const [deleted] = await db()
    .delete(workbenchCanvasProject)
    .where(
      and(eq(workbenchCanvasProject.id, id), eq(workbenchCanvasProject.userId, userId)),
    )
    .returning();

  return deleted;
}

export async function duplicateWorkbenchCanvasProjectById(
  id: string,
  userId: string,
) {
  const existing = await getWorkbenchCanvasProjectById(id, userId);
  if (!existing) {
    return null;
  }

  const duplicatedName = `${existing.project.name} 副本`;
  return createWorkbenchCanvasProject({
    userId,
    name: duplicatedName,
    entrySceneId: existing.project.entrySceneId,
    entryModelUrl: existing.project.entryModelUrl,
    initialGraph: existing.snapshot?.graph ?? createEmptyGraph(),
    meta: {
      ...(existing.snapshot?.meta && typeof existing.snapshot.meta === "object"
        ? existing.snapshot.meta
        : {}),
      duplicatedFromProjectId: existing.project.id,
      source: "duplicate",
    },
  });
}

export async function saveWorkbenchCanvasSnapshot(input: {
  projectId: string;
  userId: string;
  graph: CanvasGraph;
  expectedVersion?: number | null;
  meta?: Record<string, any> | null;
}) {
  const [project] = await db()
    .select()
    .from(workbenchCanvasProject)
    .where(
      and(
        eq(workbenchCanvasProject.id, input.projectId),
        eq(workbenchCanvasProject.userId, input.userId),
      ),
    )
    .limit(1);

  if (!project) {
    throw new Error("canvas project not found");
  }

  const [current] = await db()
    .select()
    .from(workbenchCanvasSnapshot)
    .where(
      and(
        eq(workbenchCanvasSnapshot.projectId, input.projectId),
        eq(workbenchCanvasSnapshot.userId, input.userId),
      ),
    )
    .limit(1);

  if (
    current &&
    input.expectedVersion !== undefined &&
    input.expectedVersion !== null &&
    current.version !== input.expectedVersion
  ) {
    throw new Error("snapshot conflict");
  }

  const nextVersion = (current?.version ?? 0) + 1;
  const now = new Date();
  const graphJson = serializeGraph(input.graph);
  const metaJson = input.meta ? JSON.stringify(input.meta) : current?.metaJson || null;
  const coverUrl = getCoverUrlFromGraph(input.graph);

  const [snapshot] = current
    ? await db()
        .update(workbenchCanvasSnapshot)
        .set({
          version: nextVersion,
          graphJson,
          metaJson,
          updatedAt: now,
        })
        .where(eq(workbenchCanvasSnapshot.id, current.id))
        .returning()
    : await db()
        .insert(workbenchCanvasSnapshot)
        .values({
          id: randomUUID(),
          projectId: input.projectId,
          userId: input.userId,
          version: nextVersion,
          graphJson,
          metaJson,
        })
        .returning();

  await db()
    .update(workbenchCanvasProject)
    .set({
      coverUrl,
      lastOpenedAt: now,
      updatedAt: now,
    })
    .where(eq(workbenchCanvasProject.id, input.projectId));

  await syncWorkbenchCanvasProjectCreations({
    projectId: input.projectId,
    userId: input.userId,
    graph: input.graph,
  });

  return {
    ...snapshot,
    graph: parseGraph(snapshot.graphJson),
    meta: parseMeta(snapshot.metaJson),
  };
}

export async function listWorkbenchCanvasProjectCreations(
  projectId: string,
  userId: string,
) {
  return db()
    .select({
      creationId: workbenchCanvasProjectCreation.creationId,
      sourceNodeId: workbenchCanvasProjectCreation.sourceNodeId,
      createdAt: workbenchCanvasProjectCreation.createdAt,
      url: workbenchCreation.url,
      mediaType: workbenchCreation.mediaType,
      prompt: workbenchCreation.prompt,
      sceneId: workbenchCreation.sceneId,
      modelUrl: workbenchCreation.modelUrl,
    })
    .from(workbenchCanvasProjectCreation)
    .innerJoin(
      workbenchCreation,
      eq(workbenchCreation.id, workbenchCanvasProjectCreation.creationId),
    )
    .where(
      and(
        eq(workbenchCanvasProjectCreation.projectId, projectId),
        eq(workbenchCanvasProjectCreation.userId, userId),
      ),
    )
    .orderBy(desc(workbenchCanvasProjectCreation.createdAt));
}
