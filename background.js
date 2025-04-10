// Listen for tab selection changes (highlighting)
browser.tabs.onHighlighted.addListener(function (highlightInfo) {
  // Notify any open popups that tab selection has changed
  browser.runtime.sendMessage({
    action: "tabsSelected",
    windowId: highlightInfo.windowId,
    tabIds: highlightInfo.tabIds,
  });
});

// Store clipboard text globally before injection
let clipboardText = "";

// Function to copy text to clipboard - Firefox compatible approach
async function copyTextToClipboard(text) {
  try {
    // Store text for the injection function
    clipboardText = text;

    // Find a suitable tab for script injection
    const tabs = await browser.tabs.query({ currentWindow: true });

    // Filter out internal Firefox pages
    const allowedTabs = tabs.filter(
      (tab) =>
        !tab.url.startsWith("about:") &&
        !tab.url.startsWith("moz-extension:") &&
        !tab.url.startsWith("firefox:")
    );

    if (allowedTabs.length === 0) {
      // No usable tabs found
      showBadge("!", "#e74c3c");
      return;
    }

    // Prefer active tab if possible
    const targetTab = allowedTabs.find((tab) => tab.active) || allowedTabs[0];

    // Execute script to copy to clipboard with the text as an argument
    const results = await browser.scripting.executeScript({
      target: { tabId: targetTab.id },
      func: executeClipboardCopy,
      args: [clipboardText],
    });

    // Reset global clipboard text
    clipboardText = "";

    // Check results
    if (results && results[0] && results[0].result === true) {
      // Show success badge
      showBadge("✓", "#5d7599");
    } else {
      // Show error badge
      showBadge("!", "#e74c3c");
    }
  } catch (error) {
    // Reset global clipboard text in case of error
    clipboardText = "";
    console.error("Error copying text:", error);
    showBadge("!", "#e74c3c");
  }
}

// Function to be injected into tab to handle clipboard operation
// Takes the text to copy as an argument
function executeClipboardCopy(textToCopy) {
  try {
    // Create temporary element for copying
    const textarea = document.createElement("textarea");
    textarea.value = textToCopy;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    // Execute copy command
    const success = document.execCommand("copy");

    // Clean up
    document.body.removeChild(textarea);

    // Return success status
    return success;
  } catch (e) {
    console.error("Error in executeClipboardCopy:", e);
    return false;
  }
}

// Helper function to show action badge
function showBadge(text, color) {
  browser.action.setBadgeText({ text: text });
  browser.action.setBadgeBackgroundColor({ color: color });

  // Clear the badge after 3 seconds
  setTimeout(() => {
    browser.action.setBadgeText({ text: "" });
  }, 3000);
}

// Listen for keyboard shortcut commands
browser.commands.onCommand.addListener(async (command) => {
  if (command === "copy_all_tabs") {
    // Get all tabs in the current window
    const tabs = await browser.tabs.query({ currentWindow: true });

    if (!tabs || tabs.length === 0) {
      return;
    }

    // Filter out chrome:// and about: URLs from the formatted output
    const linksText = tabs
      .filter(
        (tab) =>
          tab.url &&
          !tab.url.startsWith("about:") &&
          !tab.url.startsWith("moz-extension:") &&
          !tab.url.startsWith("firefox:")
      )
      .map((tab) => `- [${tab.title}](${tab.url})`)
      .join("\n");

    // If we have no tabs to copy after filtering, show an error
    if (!linksText) {
      browser.action.setBadgeText({ text: "0" });
      browser.action.setBadgeBackgroundColor({ color: "#e74c3c" });

      // Clear the badge after 3 seconds
      setTimeout(() => {
        browser.action.setBadgeText({ text: "" });
      }, 3000);
      return;
    }

    // Copy to clipboard using our offscreen helper function
    await copyTextToClipboard(linksText);
  }
});
