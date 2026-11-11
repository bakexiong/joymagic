import { revalidateTag, unstable_cache } from 'next/cache.js';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { config } from '@/config/db/schema';
import { publicSettingNames } from '@/shared/services/settings';

export type Config = typeof config.$inferSelect;
export type NewConfig = typeof config.$inferInsert;
export type UpdateConfig = Partial<Omit<NewConfig, 'name'>>;

export type Configs = Record<string, string>;

export const CACHE_TAG_CONFIGS = 'configs';
const CONFIGS_MEMORY_CACHE_TTL_MS = 60 * 1000;

type ConfigsMemoryCache = {
  expiresAt: number;
  promise: Promise<Configs>;
} | null;

let configsMemoryCache: ConfigsMemoryCache = null;

function isUnstableCacheUnavailable(error: unknown) {
  return error instanceof Error &&
    error.message.includes('incrementalCache missing in unstable_cache');
}

function isNextIncrementalCacheRuntimeAvailable() {
  return typeof process.env.NEXT_RUNTIME === 'string' &&
    process.env.NEXT_RUNTIME.length > 0;
}

function invalidateConfigsMemoryCache() {
  configsMemoryCache = null;
}

export async function saveConfigs(configs: Record<string, string>) {
  const result = await db().transaction(async (tx) => {
    const configEntries = Object.entries(configs);
    const results = [];

    for (const [name, configValue] of configEntries) {
      const [upsertResult] = await tx
        .insert(config)
        .values({ name, value: configValue })
        .onConflictDoUpdate({
          target: config.name,
          set: { value: configValue },
        })
        .returning();

      results.push(upsertResult);
    }

    return results;
  });

  invalidateConfigsMemoryCache();
  revalidateTag(CACHE_TAG_CONFIGS);

  return result;
}

export async function addConfig(newConfig: NewConfig) {
  const [result] = await db().insert(config).values(newConfig).returning();
  invalidateConfigsMemoryCache();
  revalidateTag(CACHE_TAG_CONFIGS);

  return result;
}

export const getConfigs = unstable_cache(
  async (): Promise<Configs> => {
    const configs: Record<string, string> = {};

    if (!envConfigs.database_url) {
      return configs;
    }

    const result = await db().select().from(config);
    if (!result) {
      return configs;
    }
    for (const config of result) {
      configs[config.name] = config.value ?? '';
    }

    return configs;
  },
  ['configs'],
  {
    revalidate: 3600,
    tags: [CACHE_TAG_CONFIGS],
  }
);

/**
 * 直接从数据库查询配置（不使用缓存）
 * 用于需要实时获取配置的场景
 */
export async function getConfigsDirectly(): Promise<Configs> {
  const configs: Record<string, string> = {};

  if (!envConfigs.database_url) {
    console.log("[getConfigsDirectly] database_url is not set");
    return configs;
  }

  try {
    const result = await db().select().from(config);
    if (result) {
      for (const cfg of result) {
        configs[cfg.name] = cfg.value ?? '';
      }
    }
  } catch (error: any) {
    console.error('[getConfigsDirectly] 从数据库查询配置失败:', error);
    throw error;
  }

  return configs;
}

async function getConfigsWithMemoryCache(): Promise<Configs> {
  const now = Date.now();

  if (configsMemoryCache && configsMemoryCache.expiresAt > now) {
    return configsMemoryCache.promise;
  }

  const promise = getConfigsDirectly().catch((error) => {
    if (configsMemoryCache?.promise === promise) {
      invalidateConfigsMemoryCache();
    }
    throw error;
  });

  configsMemoryCache = {
    expiresAt: now + CONFIGS_MEMORY_CACHE_TTL_MS,
    promise,
  };

  return promise;
}

async function getCachedConfigsForCurrentRuntime(): Promise<Configs> {
  if (isNextIncrementalCacheRuntimeAvailable()) {
    return getConfigs();
  }

  return getConfigsWithMemoryCache();
}

export async function getAllConfigs(): Promise<Configs> {
  let dbConfigs: Configs = {};

  // only get configs from db in server side
  if (envConfigs.database_url) {
    try {
      dbConfigs = await getCachedConfigsForCurrentRuntime();
    } catch (e) {
      if (isUnstableCacheUnavailable(e)) {
        try {
          dbConfigs = await getConfigsWithMemoryCache();
        } catch (directError) {
          console.log(`get configs from db failed:`, directError);
          dbConfigs = {};
        }
      } else {
        console.log(`get configs from db failed:`, e);
        dbConfigs = {};
      }
    }
  }

  const configs = {
    ...envConfigs,
    ...dbConfigs,
  };

  return configs;
}

/**
 * 直接从数据库查询配置并合并环境变量配置
 * 用于需要实时获取配置且需要容错的场景
 */
export async function getAllConfigsDirectly(): Promise<Configs> {
  let dbConfigs: Configs = {};

  // only get configs from db in server side
  if (envConfigs.database_url) {
    try {
      dbConfigs = await getConfigsDirectly();
    } catch (e: any) {
      console.error('[getAllConfigsDirectly] 从数据库查询配置失败:', e);
      // 继续使用环境变量配置
      dbConfigs = {};
    }
  }

  const configs = {
    ...envConfigs,
    ...dbConfigs,
  };

  return configs;
}

export async function getPublicConfigs(): Promise<Configs> {
  let dbConfigs: Configs = {};

  // only get configs from db in server side
  if (typeof window === 'undefined' && envConfigs.database_url) {
    try {
      dbConfigs = await getCachedConfigsForCurrentRuntime();
    } catch (e) {
      if (isUnstableCacheUnavailable(e)) {
        try {
          dbConfigs = await getConfigsWithMemoryCache();
        } catch (directError) {
          console.log('get configs from db failed:', directError);
          dbConfigs = {};
        }
      } else {
        console.log('get configs from db failed:', e);
        dbConfigs = {};
      }
    }
  }

  const publicConfigs: Record<string, string> = {};

  // get public configs from db
  for (const key in dbConfigs) {
    if (publicSettingNames.includes(key)) {
      publicConfigs[key] = String(dbConfigs[key]);
    }
  }

  const configs = {
    ...publicConfigs,
  };

  return configs;
}
