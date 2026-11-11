export type UploadServiceMediaType = "image" | "video";

export type UploadServiceTransferInput = {
  url: string;
  mediaType: UploadServiceMediaType;
  targetPrefix?: string;
  filename?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
};

export type UploadServiceTransferResult = {
  success: true;
  sourceUrl: string;
  url: string;
  key: string;
  bucket: string;
  mediaType: UploadServiceMediaType;
  contentType: string;
  size: number;
  thumbnailUrl?: string;
};

type UploadServiceErrorResult = {
  success: false;
  sourceUrl?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

function getUploadServiceConfig() {
  const baseUrl = process.env.UPLOAD_SERVICE_URL?.replace(/\/+$/, "");
  const token = process.env.UPLOAD_SERVICE_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "UPLOAD_SERVICE_URL or UPLOAD_SERVICE_TOKEN is not configured",
    );
  }

  return { baseUrl, token };
}

async function parseUploadServiceResponse(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!payload) {
    throw new Error(`Upload service returned ${response.status}`);
  }

  if (!response.ok || payload.code !== 0) {
    const message =
      payload?.data?.error?.message ||
      payload?.error?.message ||
      payload?.message ||
      `Upload service returned ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

export async function transferMediaFromUrl(
  input: UploadServiceTransferInput,
): Promise<UploadServiceTransferResult> {
  const { baseUrl, token } = getUploadServiceConfig();
  console.log("[upload-service-client] transfer media from url", {
    baseUrl,
    mediaType: input.mediaType,
    targetPrefix: input.targetPrefix,
    url: input.url,
  });

  const response = await fetch(`${baseUrl}/v1/transfer`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await parseUploadServiceResponse(response);
  if (!data?.success || typeof data.url !== "string") {
    const failure = data as UploadServiceErrorResult;
    throw new Error(failure.error?.message || "Upload service transfer failed");
  }

  console.log("[upload-service-client] transfer media success", {
    sourceUrl: data.sourceUrl,
    url: data.url,
    key: data.key,
  });

  return data as UploadServiceTransferResult;
}

export async function transferMediaBatchFromUrl(
  items: UploadServiceTransferInput[],
) {
  const { baseUrl, token } = getUploadServiceConfig();
  const response = await fetch(`${baseUrl}/v1/transfer/batch`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ items }),
  });

  const data = await parseUploadServiceResponse(response);
  return data?.results || [];
}
