set jsCode to "JSON.stringify((() => {
  const clean = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
  const rows = [];
  const buttons = Array.from(document.querySelectorAll('button, a')).filter((node) => /Create Similar Photo/i.test(clean(node.textContent || '')));

  for (const button of buttons) {
    let card = button.parentElement;

    while (card && card !== document.body) {
      const text = clean(card.textContent || '');
      const createCount = (text.match(/Create Similar Photo/gi) || []).length;
      if (createCount >= 1 && text.length < 300) {
        const img = card.querySelector('img');
        rows.push({
          text,
          imageUrl: img ? (img.currentSrc || img.src || '') : '',
          html: card.outerHTML.slice(0, 1500)
        });
        break;
      }
      card = card.parentElement;
    }
  }

  return {
    title: document.title,
    count: rows.length,
    rows
  };
})())"

tell application "Google Chrome"
  execute active tab of front window javascript jsCode
end tell
