set jsCode to "JSON.stringify((() => {
  const html = document.documentElement.outerHTML;
  const hrefMatches = Array.from(new Set((html.match(/\\/photo-effects\\/[a-z0-9-]+/g) || []))).sort();
  return {
    title: document.title,
    hrefCount: hrefMatches.length,
    hrefMatches
  };
})())"

tell application "Google Chrome"
  execute active tab of front window javascript jsCode
end tell
