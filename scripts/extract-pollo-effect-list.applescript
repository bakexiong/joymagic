set jsCode to "JSON.stringify((() => {
  const items = [];
  const seen = new Set();

  for (const link of Array.from(document.querySelectorAll('a[href^=\"/photo-effects/\"]'))) {
    const href = link.getAttribute('href') || '';
    const img = link.parentElement ? link.parentElement.querySelector('img') : link.querySelector('img');
    const name = (img ? (img.getAttribute('alt') || '') : '').replace(/\\s+/g, ' ').trim();
    const imageUrl = img ? (img.currentSrc || img.src || '') : '';

    if (!name) continue;
    if (seen.has(href)) continue;

    seen.add(href);
    items.push({
      name,
      slug: href.replace('/photo-effects/', ''),
      href,
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
