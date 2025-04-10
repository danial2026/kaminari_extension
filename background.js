// Listen for tab selection changes (highlighting)
chrome.tabs.onHighlighted.addListener(function (highlightInfo) {
  // Notify any open popups that tab selection has changed
  chrome.runtime.sendMessage({
    action: "tabsSelected",
    windowId: highlightInfo.windowId,
    tabIds: highlightInfo.tabIds,
  });
});
