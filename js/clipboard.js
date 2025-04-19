/**
 * clipboard.js - Functions for handling clipboard operations
 */

import "./browser-polyfill.js";
import { saveToStorage, loadFromStorage } from "./utils.js";

/**
 * Copy text to clipboard via background script
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    try {
      navigator.clipboard
        .writeText(text)
        .then(() => resolve())
        .catch((err) => {
          console.log("Clipboard API failed, using fallback method:", err);
          // Fallback to message passing if Clipboard API fails
          browser.runtime.sendMessage(
            { action: "copyToClipboard", text },
            (response) => {
              if (browser.runtime.lastError) {
                reject(browser.runtime.lastError);
              } else if (response && response.success) {
                resolve();
              } else {
                reject(new Error("Failed to copy text"));
              }
            }
          );
        });
    } catch (error) {
      // Fallback if navigator.clipboard is not available
      browser.runtime.sendMessage(
        { action: "copyToClipboard", text },
        (response) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else if (response && response.success) {
            resolve();
          } else {
            reject(new Error("Failed to copy text"));
          }
        }
      );
    }
  });
}

/**
 * Function to copy text to clipboard (for background script)
 * @param {string} text - Text to copy
 */
export function copyTextToClipboard(text) {
  // Store text in local storage for retrieval
  saveToStorage({ clipboard_text: text })
    .then(() => {
      // Find a non-browser:// tab to execute our script in
      browser.tabs.query({ currentWindow: true }, function (tabs) {
        // Filter out browser-specific URLs
        const allowedTabs = tabs.filter(
          (tab) =>
            tab.url &&
            !tab.url.startsWith("browser://") &&
            !tab.url.startsWith("about:") &&
            !tab.url.startsWith("moz-extension://")
        );

        if (allowedTabs.length === 0) {
          // No usable tabs found, show error
          browser.action.setBadgeText({ text: "!" });
          browser.action.setBadgeBackgroundColor({ color: "#e74c3c" });

          // Clear the badge after 3 seconds
          setTimeout(() => {
            browser.action.setBadgeText({ text: "" });
          }, 3000);
          return;
        }

        // Try to use the active tab if it's not a restricted URL
        let targetTabId;
        const activeNonRestrictedTabs = allowedTabs.filter((tab) => tab.active);
        if (activeNonRestrictedTabs.length > 0) {
          targetTabId = activeNonRestrictedTabs[0].id;
        } else {
          // Otherwise use the first available non-restricted tab
          targetTabId = allowedTabs[0].id;
        }

        browser.scripting
          .executeScript({
            target: { tabId: targetTabId },
            function: executeClipboardCopy,
          })
          .then(() => {
            // Show success badge
            browser.action.setBadgeText({ text: "✓" });
            browser.action.setBadgeBackgroundColor({ color: "#5d7599" });

            // Clear the badge after 3 seconds
            setTimeout(() => {
              browser.action.setBadgeText({ text: "" });
            }, 3000);
          })
          .catch((error) => {
            console.error("Failed to execute script:", error);

            // Show error badge
            browser.action.setBadgeText({ text: "!" });
            browser.action.setBadgeBackgroundColor({ color: "#e74c3c" });

            // Clear the badge after 3 seconds
            setTimeout(() => {
              browser.action.setBadgeText({ text: "" });
            }, 3000);
          });
      });
    })
    .catch((error) => {
      console.error("Failed to save clipboard text to storage:", error);
    });
}

/**
 * This function will be injected into the active tab to perform the copy
 * Note: Cannot be an arrow function due to browser.scripting usage
 */
export function executeClipboardCopy() {
  try {
    browser.storage.local.get(["clipboard_text"], function (result) {
      if (browser.runtime.lastError) {
        console.error("Error accessing storage:", browser.runtime.lastError);
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
        browser.storage.local.remove(["clipboard_text"], function () {
          if (browser.runtime.lastError) {
            console.error(
              "Error removing clipboard text:",
              browser.runtime.lastError
            );
          }
        });
      }
    });
  } catch (error) {
    console.error("Error in clipboard copy function:", error);
  }
}

/**
 * Show a status badge in the extension icon
 * @param {string} text - Badge text
 * @param {string} color - Badge color
 * @param {number} duration - Duration to show the badge in ms
 */
export function showBadge(text, color = "#5d7599", duration = 3000) {
  browser.action.setBadgeText({ text });
  browser.action.setBadgeBackgroundColor({ color });

  // Clear the badge after the specified duration
  setTimeout(() => {
    browser.action.setBadgeText({ text: "" });
  }, duration);
}
