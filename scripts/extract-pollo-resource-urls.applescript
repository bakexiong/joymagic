set jsCode to "JSON.stringify((() => {
  const entries = performance.getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((name) => /api|photo-effects|persona|graphql|trpc|effect/i.test(name));

  return {
    title: document.title,
    count: entries.length,
    entries: Array.from(new Set(entries)).sort()
  };
})())"

tell application "Google Chrome"
  execute active tab of front window javascript jsCode
end tell
