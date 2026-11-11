/**
 * longcat-avatar 计费时长规则：
 * - 最小 5 秒
 * - 最大 120 秒
 * - 按 5 秒块向上取整
 *
 * 注意：这里的返回值用于两处必须一致的场景：
 * 1) 前端积分估算（/api/ai/estimate-credits 的 params.duration）
 * 2) 实际生成请求（/api/ai/longcat-avatar/generate 的 duration）
 */
export function getLongcatAvatarBilledDuration(durationSeconds: number): number {
  const MIN_BILLING_SECONDS = 5;
  const MAX_BILLING_SECONDS = 120;

  const minDuration = Math.max(durationSeconds, MIN_BILLING_SECONDS);
  const cappedDuration = Math.min(minDuration, MAX_BILLING_SECONDS);
  return Math.ceil(cappedDuration / 5) * 5;
}

