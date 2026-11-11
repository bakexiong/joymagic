import type {
  StorageConfigs,
  StorageDownloadUploadOptions,
  StorageProvider,
  StorageUploadOptions,
  StorageUploadResult,
} from '.';

/**
 * 阿里云 OSS 存储配置
 * @docs https://help.aliyun.com/document_detail/31947.html
 */
export interface OSSConfigs extends StorageConfigs {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint?: string;
  publicDomain?: string;
}

/**
 * 阿里云 OSS 存储 Provider 实现
 * @website https://www.aliyun.com/product/oss
 */
export class OSSProvider implements StorageProvider {
  readonly name = 'oss';
  configs: OSSConfigs;

  constructor(configs: OSSConfigs) {
    this.configs = configs;
  }

  /**
   * 生成 OSS 签名
   */
  private async generateSignature(
    method: string,
    contentType: string,
    date: string,
    canonicalizedResource: string
  ): Promise<string> {
    const stringToSign = `${method}\n\n${contentType}\n${date}\n${canonicalizedResource}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.configs.accessKeySecret);
    const messageData = encoder.encode(stringToSign);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    // 转换为 base64
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));

    return signatureBase64;
  }

  async uploadFile(
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    try {
      const uploadBucket = options.bucket || this.configs.bucket;
      if (!uploadBucket) {
        return {
          success: false,
          error: 'Bucket is required',
          provider: this.name,
        };
      }

      // 处理不同的 body 类型
      let body: Uint8Array | ReadableStream<Uint8Array>;
      let contentLength: string | undefined;

      if (options.body instanceof ReadableStream) {
        body = options.body;
        if (options.contentLength !== undefined) {
          contentLength = options.contentLength.toString();
        } else {
          return {
            success: false,
            error: 'contentLength is required for streaming uploads',
            provider: this.name,
          };
        }
      } else {
        body =
          options.body instanceof Buffer
            ? new Uint8Array(options.body)
            : options.body;
        contentLength = body.length.toString();
      }

      // OSS endpoint 格式: https://<bucket>.<region>.aliyuncs.com
      const endpoint =
        this.configs.endpoint ||
        `https://${uploadBucket}.${this.configs.region}.aliyuncs.com`;
      const url = `${endpoint}/${options.key}`;

      // 生成签名所需的参数
      const date = new Date().toUTCString();
      const contentType = options.contentType || 'application/octet-stream';
      const canonicalizedResource = `/${uploadBucket}/${options.key}`;

      // 生成签名
      const signature = await this.generateSignature(
        'PUT',
        contentType,
        date,
        canonicalizedResource
      );

      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Length': contentLength,
        Date: date,
        Authorization: `OSS ${this.configs.accessKeyId}:${signature}`,
      };

      if (options.disposition) {
        headers['Content-Disposition'] = options.disposition;
      }

      const requestInit: RequestInit & { duplex?: 'half' } = {
        method: 'PUT',
        headers,
        body: body as any,
      };

      if (options.body instanceof ReadableStream) {
        requestInit.duplex = 'half';
      }

      // 添加超时控制（120秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let response: Response;
      try {
        response = await fetch(url, {
          ...requestInit,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'OSS upload timeout after 120 seconds',
            provider: this.name,
          };
        }
        throw error;
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Upload failed: ${response.statusText} - ${errorText}`,
          provider: this.name,
        };
      }

      const publicUrl = this.configs.publicDomain
        ? `${this.configs.publicDomain}/${options.key}`
        : url;

      return {
        success: true,
        location: url,
        bucket: uploadBucket,
        key: options.key,
        filename: options.key.split('/').pop(),
        url: publicUrl,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }

  async downloadAndUpload(
    options: StorageDownloadUploadOptions
  ): Promise<StorageUploadResult> {
    try {
      const response = await fetch(options.url);
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`,
          provider: this.name,
        };
      }

      if (!response.body) {
        return {
          success: false,
          error: 'No body in response',
          provider: this.name,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const body = new Uint8Array(arrayBuffer);

      return this.uploadFile({
        body,
        key: options.key,
        bucket: options.bucket,
        contentType: options.contentType,
        disposition: options.disposition,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }
}

/**
 * 创建阿里云 OSS provider
 */
export function createOSSProvider(configs: OSSConfigs): OSSProvider {
  return new OSSProvider(configs);
}
