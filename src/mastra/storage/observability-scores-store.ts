import {
  ScoresStorage,
  type ObservabilityStorage,
} from "@mastra/core/storage";
import type {
  ListScoresResponse,
  SaveScorePayload,
  ScoreRowData,
  ScoringSource,
} from "@mastra/core/evals";

type ObservabilityListScoresArgs = {
  filters?: {
    scorerId?: string | string[];
    source?: string;
    traceId?: string;
    spanId?: string;
    entityId?: string;
    entityType?: string;
    resourceId?: string;
    runId?: string;
    threadId?: string;
  };
  pagination?: {
    page?: number;
    perPage?: number | false;
  };
  orderBy?: {
    field?: "timestamp" | "score";
    direction?: "ASC" | "DESC";
  };
};

type ObservabilityScoreRecord = {
  scoreId?: string | null;
  metadata?: Record<string, unknown> | null;
  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;
  resourceId?: string | null;
  runId?: string | null;
  threadId?: string | null;
  timestamp: Date;
  traceId?: string | null;
  spanId?: string | null;
  scorerId: string;
  scorerName?: string | null;
  scorerVersion?: string | null;
  source?: string | null;
  score: number;
  reason?: string | null;
};

function normalizePagination(pagination?: { page?: number; perPage?: number | false }) {
  return {
    page: pagination?.page ?? 0,
    perPage: pagination?.perPage ?? 10,
  };
}

function normalizeScoringSource(source?: string | null): ScoringSource {
  return source === "TEST" ? "TEST" : "LIVE";
}

function toScoreRowData(record: ObservabilityScoreRecord): ScoreRowData {
  const entityId = record.entityId ?? "";
  const traceId = record.traceId ?? undefined;
  const spanId = record.spanId ?? undefined;
  const id =
    record.scoreId ??
    [traceId, spanId, record.scorerId, record.timestamp.toISOString()]
      .filter(Boolean)
      .join(":");

  return {
    createdAt: record.timestamp,
    updatedAt: null,
    id,
    scorerId: record.scorerId,
    entityId,
    runId: record.runId ?? traceId ?? id,
    input: undefined,
    output: {},
    additionalContext: undefined,
    requestContext: undefined,
    extractStepResult: undefined,
    extractPrompt: undefined,
    score: record.score,
    analyzeStepResult: undefined,
    analyzePrompt: undefined,
    reason: record.reason ?? undefined,
    reasonPrompt: undefined,
    scorer: {
      id: record.scorerId,
      name: record.scorerName ?? record.scorerId,
      version: record.scorerVersion ?? undefined,
    },
    metadata: record.metadata ?? undefined,
    source: normalizeScoringSource(record.source),
    entity: {
      id: entityId,
      name: record.entityName ?? entityId,
      type: record.entityType ?? undefined,
    },
    entityType: record.entityType ?? undefined,
    structuredOutput: undefined,
    traceId,
    spanId,
    resourceId: record.resourceId ?? undefined,
    threadId: record.threadId ?? undefined,
    preprocessStepResult: undefined,
    preprocessPrompt: undefined,
    generateScorePrompt: undefined,
    generateReasonPrompt: undefined,
  };
}

async function listObservabilityScores(
  observability: ObservabilityStorage,
  args: ObservabilityListScoresArgs,
): Promise<ListScoresResponse> {
  const result = await observability.listScores(
    args as Parameters<ObservabilityStorage["listScores"]>[0],
  );

  return {
    pagination: result.pagination,
    scores: result.scores.map(toScoreRowData),
  };
}

export class ObservabilityScoresStore extends ScoresStorage {
  constructor(private readonly observability: ObservabilityStorage) {
    super();
  }

  async getScoreById({ id }: { id: string }): Promise<ScoreRowData | null> {
    const result = await this.observability.listScores({
      pagination: {
        page: 0,
        perPage: false,
      },
    });

    const match = (result.scores as ObservabilityScoreRecord[]).find(
      (score) => score.scoreId === id,
    );
    return match ? toScoreRowData(match) : null;
  }

  async saveScore(score: SaveScorePayload): Promise<{ score: ScoreRowData }> {
    const timestamp = new Date();

    await this.observability.createScore({
      score: {
        timestamp,
        scoreId: score.runId,
        traceId: score.traceId ?? null,
        spanId: score.spanId ?? null,
        scorerId: score.scorerId,
        scorerName:
          typeof score.scorer?.name === "string" ? score.scorer.name : null,
        scorerVersion: null,
        scoreSource: null,
        source: score.source,
        score: score.score,
        reason: score.reason ?? null,
        entityId: score.entityId,
        entityName:
          typeof score.entity?.name === "string" ? score.entity.name : null,
        entityType: (score.entityType ?? null) as never,
        parentEntityId: null,
        parentEntityName: null,
        parentEntityType: null,
        rootEntityId: null,
        rootEntityName: null,
        rootEntityType: null,
        userId: null,
        organizationId: null,
        resourceId: score.resourceId ?? null,
        runId: score.runId,
        sessionId: null,
        threadId: score.threadId ?? null,
        requestId: null,
        environment: null,
        serviceName: null,
        scope: score.metadata ?? null,
        entityVersionId: null,
        parentEntityVersionId: null,
        rootEntityVersionId: null,
        experimentId: null,
        scoreTraceId: null,
        executionSource: null,
        tags: null,
        metadata: score.metadata ?? null,
      },
    });

    return {
      score: {
        createdAt: timestamp,
        updatedAt: null,
        id: score.runId,
        scorerId: score.scorerId,
        entityId: score.entityId,
        runId: score.runId,
        input: score.input,
        output: score.output,
        additionalContext: score.additionalContext,
        requestContext: score.requestContext,
        extractStepResult: score.extractStepResult,
        extractPrompt: score.extractPrompt,
        score: score.score,
        analyzeStepResult: score.analyzeStepResult,
        analyzePrompt: score.analyzePrompt,
        reason: score.reason,
        reasonPrompt: score.reasonPrompt,
        scorer: score.scorer,
        metadata: score.metadata,
        source: score.source,
        entity: score.entity,
        entityType: score.entityType,
        structuredOutput: score.structuredOutput,
        traceId: score.traceId,
        spanId: score.spanId,
        resourceId: score.resourceId,
        threadId: score.threadId,
        preprocessStepResult: score.preprocessStepResult,
        preprocessPrompt: score.preprocessPrompt,
        generateScorePrompt: score.generateScorePrompt,
        generateReasonPrompt: score.generateReasonPrompt,
      },
    };
  }

  async listScoresByScorerId({
    scorerId,
    pagination,
    entityId,
    entityType,
    source,
  }: {
    scorerId: string;
    pagination: { page: number; perPage: number | false };
    entityId?: string;
    entityType?: string;
    source?: ScoringSource;
  }): Promise<ListScoresResponse> {
    return listObservabilityScores(this.observability, {
      filters: {
        scorerId,
        entityId,
        entityType,
        source,
      },
      pagination: normalizePagination(pagination),
    });
  }

  async listScoresByRunId({
    runId,
    pagination,
  }: {
    runId: string;
    pagination: { page: number; perPage: number | false };
  }): Promise<ListScoresResponse> {
    return listObservabilityScores(this.observability, {
      filters: {
        runId,
      },
      pagination: normalizePagination(pagination),
    });
  }

  async listScoresByEntityId({
    entityId,
    entityType,
    pagination,
  }: {
    pagination: { page: number; perPage: number | false };
    entityId: string;
    entityType: string;
  }): Promise<ListScoresResponse> {
    return listObservabilityScores(this.observability, {
      filters: {
        entityId,
        entityType,
      },
      pagination: normalizePagination(pagination),
    });
  }

  async listScoresBySpan({
    traceId,
    spanId,
    pagination,
  }: {
    traceId: string;
    spanId: string;
    pagination: { page: number; perPage: number | false };
  }): Promise<ListScoresResponse> {
    return listObservabilityScores(this.observability, {
      filters: {
        traceId,
        spanId,
      },
      pagination: normalizePagination(pagination),
    });
  }

  async dangerouslyClearAll(): Promise<void> {
    await this.observability.dangerouslyClearAll();
  }
}
