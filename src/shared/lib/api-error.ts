const NSFW_BLOCKED_ERROR_CODE = "NSFW_BLOCKED";

const ERROR_TRANSLATION_KEY_MAP: Record<string, string> = {
  [NSFW_BLOCKED_ERROR_CODE]: "nsfw_blocked",
};

export function getApiErrorCode(payload: any): string | undefined {
  const errorCode =
    payload?.errorCode ||
    payload?.data?.errorCode ||
    payload?.message;

  return typeof errorCode === "string" ? errorCode : undefined;
}

export function getApiErrorTranslationKey(payload: any): string | undefined {
  const errorCode = getApiErrorCode(payload);
  if (!errorCode) {
    return undefined;
  }

  return ERROR_TRANSLATION_KEY_MAP[errorCode];
}

export function resolveApiErrorMessage(params: {
  payload?: any;
  fallback?: string;
  translate?: (translationKey: string, errorCode: string) => string | undefined;
}) {
  const { payload, fallback, translate } = params;
  const errorCode = getApiErrorCode(payload);

  if (!errorCode) {
    return fallback || "";
  }

  const translationKey = ERROR_TRANSLATION_KEY_MAP[errorCode];
  if (translationKey && translate) {
    const translatedMessage = translate(translationKey, errorCode);
    if (translatedMessage) {
      return translatedMessage;
    }
  }

  return fallback || errorCode;
}

export { NSFW_BLOCKED_ERROR_CODE };
