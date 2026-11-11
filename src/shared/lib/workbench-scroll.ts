const WORKBENCH_SCROLL_KEY = "ai-workbench-scroll-anchor";
const WORKBENCH_SCROLL_TTL = 15_000;

type StoredWorkbenchScroll = {
  top: number;
  timestamp: number;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function captureWorkbenchScroll(element: HTMLElement | null) {
  if (!element || !canUseStorage()) return;

  const payload: StoredWorkbenchScroll = {
    top: element.getBoundingClientRect().top,
    timestamp: Date.now(),
  };

  sessionStorage.setItem(WORKBENCH_SCROLL_KEY, JSON.stringify(payload));
}

export function restoreWorkbenchScroll(element: HTMLElement | null) {
  if (!element || !canUseStorage()) return false;

  const rawValue = sessionStorage.getItem(WORKBENCH_SCROLL_KEY);
  if (!rawValue) return false;

  let payload: StoredWorkbenchScroll | null = null;
  try {
    payload = JSON.parse(rawValue) as StoredWorkbenchScroll;
  } catch {
    sessionStorage.removeItem(WORKBENCH_SCROLL_KEY);
    return false;
  }

  if (!payload || Date.now() - payload.timestamp > WORKBENCH_SCROLL_TTL) {
    sessionStorage.removeItem(WORKBENCH_SCROLL_KEY);
    return false;
  }

  const nextTop = element.getBoundingClientRect().top;
  const delta = nextTop - payload.top;

  sessionStorage.removeItem(WORKBENCH_SCROLL_KEY);

  if (Math.abs(delta) < 1) {
    return false;
  }

  window.scrollBy(0, delta);
  return true;
}
