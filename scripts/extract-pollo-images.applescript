set jsCode to "JSON.stringify((() => {
  const clean = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
  const images = Array.from(document.querySelectorAll('img')).filter((img) => {
    const src = img.currentSrc || img.src || '';
    return /videocdn\\.pollo\\.ai|cdn\\.pollo\\.ai/i.test(src);
  });

  const rows = images.map((img) => {
    let card = img.parentElement;

    while (card && card !== document.body) {
      const text = clean(card.textContent || '');
      if (/Create Similar Photo/i.test(text) && text.length < 500) {
        return {
          imageUrl: img.currentSrc || img.src || '',
          text,
          html: card.outerHTML.slice(0, 4000)
        };
      }
      card = card.parentElement;
    }

    return {
      imageUrl: img.currentSrc || img.src || '',
      text: clean(img.parentElement ? img.parentElement.textContent || '' : ''),
      html: img.outerHTML.slice(0, 2000)
    };
  });

  return {
    title: document.title,
    count: rows.length,
    rows
  };
})())"

tell application "Google Chrome"
  execute active tab of front window javascript jsCode
end tell
