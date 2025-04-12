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

// Function to copy text to clipboard
function copyTextToClipboard(text) {
  // In background scripts, we can't directly use navigator.clipboard.writeText
  // We need to create a temporary element in an offscreen document

  // Store text in local storage for retrieval
  chrome.storage.local.set({ clipboard_text: text }, function () {
    // Find a non-chrome:// tab to execute our script in
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      // Filter out chrome:// URLs
      const allowedTabs = tabs.filter(
        (tab) => !tab.url.startsWith("chrome://")
      );

      if (allowedTabs.length === 0) {
        // No usable tabs found, show error
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#e74c3c" });

        // Clear the badge after 3 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: "" });
        }, 3000);
        return;
      }

      // Try to use the active tab if it's not a chrome:// URL
      let targetTabId;
      const activeNonChromeTabs = allowedTabs.filter((tab) => tab.active);
      if (activeNonChromeTabs.length > 0) {
        targetTabId = activeNonChromeTabs[0].id;
      } else {
        // Otherwise use the first available non-chrome:// tab
        targetTabId = allowedTabs[0].id;
      }

      chrome.scripting
        .executeScript({
          target: { tabId: targetTabId },
          function: executeClipboardCopy,
        })
        .then(() => {
          // Show success badge
          chrome.action.setBadgeText({ text: "✓" });
          chrome.action.setBadgeBackgroundColor({ color: "#5d7599" });

          // Clear the badge after 3 seconds
          setTimeout(() => {
            chrome.action.setBadgeText({ text: "" });
          }, 3000);
        })
        .catch((error) => {
          console.error("Failed to execute script:", error);

          // Show error badge
          chrome.action.setBadgeText({ text: "!" });
          chrome.action.setBadgeBackgroundColor({ color: "#e74c3c" });

          // Clear the badge after 3 seconds
          setTimeout(() => {
            chrome.action.setBadgeText({ text: "" });
          }, 3000);
        });
    });
  });
}

// This function will be injected into the active tab to perform the copy
function executeClipboardCopy() {
  try {
    chrome.storage.local.get(["clipboard_text"], function (result) {
      if (chrome.runtime.lastError) {
        console.error("Error accessing storage:", chrome.runtime.lastError);
        return;
      }

      if (result.clipboard_text) {
        // Create a temporary textarea element
        const textarea = document.createElement("textarea");
        textarea.value = result.clipboard_text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        // Execute the copy command
        document.execCommand("copy");

        // Clean up
        document.body.removeChild(textarea);

        // Clear the stored text
        chrome.storage.local.remove(["clipboard_text"], function () {
          if (chrome.runtime.lastError) {
            console.error(
              "Error removing clipboard text:",
              chrome.runtime.lastError
            );
          }
        });
      }
    });
  } catch (error) {
    console.error("Error in clipboard copy function:", error);
  }
}

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
        chrome.action.setBadgeText({ text: "0" });
        chrome.action.setBadgeBackgroundColor({ color: "#e74c3c" });

        // Clear the badge after 3 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: "" });
        }, 3000);
        return;
      }

      // Copy to clipboard using our helper function
      copyTextToClipboard(linksText);
    } catch (error) {
      console.error("Error in command listener:", error);

      // Show error badge
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#e74c3c" });

      // Clear the badge after 3 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 3000);
    }
  }
});
