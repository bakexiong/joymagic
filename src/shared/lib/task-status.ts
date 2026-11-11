const COMPLETED_STATUSES = new Set(['completed', 'success']);
const FAILED_STATUSES = new Set(['failed', 'error']);
const PROCESSING_STATUSES = new Set([
    'processing',
    'pending',
    'created',
    'starting',
    'running',
    'in_progress',
    'queued',
]);

export const isTaskCompleted = (status: string): boolean => COMPLETED_STATUSES.has(status);

export const isTaskFailed = (status: string): boolean => FAILED_STATUSES.has(status);

export const isTaskProcessing = (status: string): boolean => PROCESSING_STATUSES.has(status);
