import {
  R2Provider,
  S3Provider,
  OSSProvider,
  StorageManager,
} from '@/extensions/storage';
import { Configs, getAllConfigs } from '@/shared/models/config';

/**
 * get storage service with configs
 */
export function getStorageServiceWithConfigs(configs: Configs) {
  const storageManager = new StorageManager();

  // Get user's preferred storage provider
  const preferredProvider = configs.storage_provider || 'oss';

  // Add OSS provider if configured
  const ossConfigured =
    configs.oss_access_key_id &&
    configs.oss_access_key_secret &&
    configs.oss_bucket &&
    configs.oss_region;

  if (ossConfigured) {
    storageManager.addProvider(
      new OSSProvider({
        region: configs.oss_region,
        accessKeyId: configs.oss_access_key_id,
        accessKeySecret: configs.oss_access_key_secret,
        bucket: configs.oss_bucket,
        endpoint: configs.oss_endpoint,
        publicDomain: configs.oss_domain,
      }),
      preferredProvider === 'oss' // Set as default if preferred
    );
  }

  // Add R2 provider if configured
  const r2Configured =
    configs.r2_access_key &&
    configs.r2_secret_key &&
    configs.r2_bucket_name;

  if (r2Configured) {
    const accountId = configs.r2_account_id || '';

    storageManager.addProvider(
      new R2Provider({
        accountId: accountId,
        accessKeyId: configs.r2_access_key,
        secretAccessKey: configs.r2_secret_key,
        bucket: configs.r2_bucket_name,
        region: 'auto',
        endpoint: configs.r2_endpoint,
        publicDomain: configs.r2_domain,
      }),
      preferredProvider === 'r2' // Set as default if preferred
    );
  }

  // Add S3 provider if configured
  const s3Configured =
    configs.s3_access_key && configs.s3_secret_key && configs.s3_bucket;

  if (s3Configured) {
    storageManager.addProvider(
      new S3Provider({
        endpoint: configs.s3_endpoint,
        region: configs.s3_region,
        accessKeyId: configs.s3_access_key,
        secretAccessKey: configs.s3_secret_key,
        bucket: configs.s3_bucket,
        publicDomain: configs.s3_domain,
      }),
      preferredProvider === 's3' // Set as default if preferred
    );
  }

  return storageManager;
}

/**
 * global storage service
 */
let storageService: StorageManager | null = null;

/**
 * get storage service instance
 */
export async function getStorageService(): Promise<StorageManager> {
  if (true) {
    const configs = await getAllConfigs();
    storageService = getStorageServiceWithConfigs(configs);
  }
  return storageService;
}
