on run argv
  set pageValue to "1"
  set pageSizeValue to "20"
  if (count of argv) ≥ 1 then set pageValue to item 1 of argv
  if (count of argv) ≥ 2 then set pageSizeValue to item 2 of argv

  set jsCode to "(() => {
    const page = " & pageValue & ";
    const pageSize = " & pageSizeValue & ";
    const input = encodeURIComponent(JSON.stringify({
      0: { json: null, meta: { values: ['undefined'] } },
      1: { json: { categoryCode: 'persona-magic', pageSize, page } },
      2: { json: null, meta: { values: ['undefined'] } }
    }));
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/trpc/product.getDiscountInfo,templateV2.fetchTemplates,user.getReqInfo?batch=1&input=' + input, false);
    xhr.send(null);
    return xhr.responseText;
  })()"

  tell application "Google Chrome"
    execute active tab of front window javascript jsCode
  end tell
end run
