set jsCode to "JSON.stringify((() => {
  const scripts = Array.from(document.scripts).map((script) => script.textContent || '');
  const html = document.documentElement.outerHTML;

  const hrefMatches = Array.from(new Set((html.match(/\\/photo-effects\\/[a-z0-9-]+/g) || []))).sort();
  const apiMatches = Array.from(new Set((html.match(/https?:\\\\/\\\\/[^\\\"'\\s<]+|\\\\/api\\\\/[^\\\"'\\s<]+/g) || []))).filter((item) => /api|photo-effects|persona/i.test(item)).slice(0, 500);
  const scriptSnippets = scripts
    .filter((text) => /photo-effects|persona|api/i.test(text))
    .slice(0, 20)
    .map((text) => text.slice(0, 5000));

  return {
    title: document.title,
    hrefCount: hrefMatches.length,
    hrefMatches,
    apiMatches,
    scriptSnippetCount: scriptSnippets.length,
    scriptSnippets
  };
})())"

tell application "Google Chrome"
  execute active tab of front window javascript jsCode
end tell
