import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { envConfigs } from '@/config';
import { isCloudflareWorker } from '@/shared/lib/env';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 使用 globalThis 存储连接，防止 Next.js HMR 导致连接泄漏
const globalForDb = globalThis as unknown as {
  dbInstance: ReturnType<typeof drizzle> | null;
  dbClient: ReturnType<typeof postgres> | null;
};

export function db() {
  let databaseUrl = envConfigs.database_url;

  let isHyperdrive = false;

  if (isCloudflareWorker) {
    const cfContext = getCloudflareContext();
    if (cfContext) {
      const { env } = cfContext;
      // Detect if set Hyperdrive
      isHyperdrive = 'HYPERDRIVE' in env;
      if (isHyperdrive) {
        databaseUrl = env.HYPERDRIVE.connectionString;
      }
    }
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  // In Cloudflare Workers, create new connection each time
  if (isCloudflareWorker) {
    const client = postgres(databaseUrl, {
      prepare: false,
      max: 1,
      idle_timeout: 10,
      connect_timeout: 5,
    });

    return drizzle(client);
  }

  // Singleton mode: reuse existing connection (good for traditional servers and serverless warm starts)
  if (envConfigs.db_singleton_enabled === 'true') {
    if (globalForDb.dbInstance) {
      return globalForDb.dbInstance;
    }

    globalForDb.dbClient = postgres(databaseUrl, {
      prepare: false,
      max: Number(envConfigs.db_max_connections) || 1,
      idle_timeout: 30,
      connect_timeout: 10,
    });

    globalForDb.dbInstance = drizzle({ client: globalForDb.dbClient });
    return globalForDb.dbInstance;
  }

  // Non-singleton mode: create new connection each time (good for serverless)
  const serverlessClient = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    connection: {
      application_name: 'z-image-ai',
    },
  });

  return drizzle({ client: serverlessClient });
}

export async function closeDb() {
  if (envConfigs.db_singleton_enabled && globalForDb.dbClient) {
    await globalForDb.dbClient.end();
    globalForDb.dbClient = null;
    globalForDb.dbInstance = null;
  }
}
