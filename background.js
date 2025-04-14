/**
 * background.js - Main service worker for Kaminari extension
 */

import { copyTextToClipboard, showBadge } from "./js/clipboard.js";

// Listen for tab selection changes (highlighting)
chrome.tabs.onHighlighted.addListener(function (highlightInfo) {
  // Notify any open popups that tab selection has changed
  // Add error handling to prevent "Receiving end does not exist" errors
  try {
    chrome.runtime.sendMessage(
      {
        action: "tabsSelected",
        windowId: highlightInfo.windowId,
        tabIds: highlightInfo.tabIds,
      },
      // Add a response callback that handles potential errors
      (response) => {
        const lastError = chrome.runtime.lastError;
        // Just suppress the error - we don't need to do anything if the popup isn't open
        if (lastError) {
          console.log(
            "Tab selection change message not delivered: popup may not be open"
          );
        }
      }
    );
  } catch (error) {
    console.log("Error sending tab selection message:", error);
  }
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message types
  if (message.action === "copyToClipboard") {
    copyTextToClipboard(message.text);
    sendResponse({ success: true });
    return true; // Keep the message channel open for async response
  }

  return false;
});

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "copy_all_tabs") {
    try {
      // Get all tabs in the current window
      const tabs = await chrome.tabs.query({ currentWindow: true });

      if (!tabs || tabs.length === 0) {
        return;
      }

      // Filter out chrome:// URLs from the formatted output
      const linksText = tabs
        .filter(
          (tab) =>
            tab.url &&
            !tab.url.startsWith("chrome://") &&
            !tab.url.startsWith("about:") &&
            !tab.url.startsWith("edge://") &&
            !tab.url.startsWith("brave://") &&
            !tab.url.startsWith("opera://") &&
            !tab.url.startsWith("vivaldi://")
        )
        .map((tab) => `- [${tab.title}](${tab.url})`)
        .join("\n");

      // If we have no tabs to copy after filtering, show an error
      if (!linksText) {
        showBadge("0", "#e74c3c");
        return;
      }

      // Copy to clipboard using our helper function
      copyTextToClipboard(linksText);
    } catch (error) {
      console.error("Error in command listener:", error);
      showBadge("!", "#e74c3c");
    }
  }
});
