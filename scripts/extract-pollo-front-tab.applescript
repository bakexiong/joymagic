set jsCode to "JSON.stringify((() => {
  const seen = new Set();
  const items = [];
  const blocked = new Set([
    'pollo.ai',
    'persona magic',
    'login',
    'log in',
    'sign up',
    'home',
    'pricing',
    'api',
    'blog',
    'about',
    'privacy',
    'terms',
    'cookies',
    'download on the app store',
    'get it on google play'
  ]);
  const clean = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
  const add = (name, imageUrl) => {
    const value = clean(name);
    if (!value) return;
    if (value.length > 120) return;
    if (!/[A-Za-z]/.test(value)) return;
    if (blocked.has(value.toLowerCase())) return;
    const lower = value.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);
    items.push({ name: value, imageUrl: imageUrl || undefined });
  };

  const nodes = Array.from(document.querySelectorAll('img, a, button, h1, h2, h3, h4, h5, h6, li, div'));

  for (const node of nodes) {
    const nestedImage = node.tagName === 'IMG' ? node : node.querySelector ? node.querySelector('img') : null;
    const src = nestedImage ? (nestedImage.currentSrc || nestedImage.src || '') : '';
    const text = clean(node.textContent || '');
    if (!text) continue;

    const lines = text
      .split(/(?=[A-Z][A-Z0-9 '\\-]{2,})|\\n+/)
      .map((value) => clean(value))
      .filter(Boolean);

    for (const line of lines) {
      add(line, src);
    }
  }

  return {
    title: document.title,
    count: items.length,
    items
  };
})())"

tell application "Google Chrome"
  execute active tab of front window javascript jsCode
end tell
