export function resolveCanvasAgentOutputLanguage(message: string) {
  const text = message.trim();

  if (!text) return "English";

  if (/[\u4E00-\u9FFF]/u.test(text)) return "Chinese";
  if (/[\u3040-\u30FF]/u.test(text)) return "Japanese";
  if (/[\uAC00-\uD7AF]/u.test(text)) return "Korean";
  if (/[\u0600-\u06FF]/u.test(text)) return "Arabic";
  if (/[\u0400-\u04FF]/u.test(text)) return "Russian";

  return "English";
}
