set jsCode to "JSON.stringify((() => {
  const clean = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
  const seen = new Set();
  const items = [];

  for (const link of Array.from(document.querySelectorAll('a[href^=\"/photo-effects/\"]'))) {
    const href = link.getAttribute('href') || '';
    if (!href || href === '/photo-effects/persona-magic') continue;
    if (seen.has(href)) continue;

    const card = link.parentElement || link;
    const img = card.querySelector('img') || link.querySelector('img');
    const titleNode = card.querySelector('p') || card.querySelector('[class*=truncate]') || card;
    const name = clean((img && img.getAttribute('alt')) || (titleNode && titleNode.textContent) || '');
    const imageUrl = img ? (img.currentSrc || img.src || '') : '';

    seen.add(href);
    items.push({
      href,
      slug: href.replace('/photo-effects/', ''),
      name,
      imageUrl
    });
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
