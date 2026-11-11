export interface AccessCheckResult {
  passed: boolean;
  reason?: "not_logged_in" | "restricted";
  errorMessage?: string;
}

export interface GenerationConfig {
  apiEndpoint: string;
  scenario: string;
  requestBody: Record<string, any>;
  requiredCredits: number | null;
  remainingCredits: number;
  maxPollingAttempts?: number;
  pollingInterval?: number;
  buildStatusEndpoint?: (requestId: string) => string;
}

export interface GenerationCallbacks {
  checkAccess: () => AccessCheckResult;
  modelUrl?: string;
  modelLabel?: string;
  showPricingModal: () => void;
  showSignModal: () => void;
  fetchUserInfo: () => Promise<void>;
  onStatusUpdate: (status: string) => void;
  onTaskSubmitted?: (payload: {
    requestId: string;
    scenario: string;
  }) => void | Promise<void>;
  deferPolling?: boolean;
  onError: (error: string) => void;
  translateApiError?: (
    translationKey: string,
    errorCode: string,
  ) => string | undefined;
}

export interface GenerationResult {
  success: boolean;
  accepted?: boolean;
  url?: string;
  outputs?: string[];
  error?: string;
  requestId?: string;
  scenario?: string;
  data?: any;
}

export type TranslationFunction = (
  key: string,
  params?: Record<string, any>,
) => string;
