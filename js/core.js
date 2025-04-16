/**
 * core.js - Core functionality and shared utilities
 */

// DOM element references
export const elements = {
  includeTitlesToggle: document.getElementById("includeTitles"),
  formatMarkdownToggle: document.getElementById("formatMarkdown"),
  formatTemplateInput: document.getElementById("formatTemplate"),
  plainTextTemplateInput: document.getElementById("plainTextTemplate"),
  copyAllTabsBtn: document.getElementById("copyAllTabs"),
  copySelectedTabsBtn: document.getElementById("copySelectedTabs"),
  resetBtn: document.querySelector(".reset-btn"),
  settingsIcon: document.querySelector(".settings-icon"),
  settingsMenu: document.querySelector(".settings-menu"),
  closeSettingsBtn: document.querySelector(".close-btn"),
  snackbar: document.getElementById("snackbar"),
  tabPreview: document.getElementById("tabPreview"),
  sortByPositionToggle: document.getElementById("sortByPosition"),
  groupByDomainToggle: document.getElementById("groupByDomain"),
  showSelectedOnlyToggle: document.getElementById("showSelectedOnly"),
  toggleLabel: document.getElementById("toggleLabel"),
};

// Global state
export const state = {
  currentTabs: [],
  selectedTabs: [],
  forceShowSelected: false,
  currentPreviewRestoreButton: null, // Tracks the current preview restore button
};

/**
 * Shows a snackbar notification
 * @param {string} message - Message to display
 */
export function showSnackbar(message) {
  if (!elements.snackbar) {
    console.warn("Snackbar element not found");
    return;
  }

  // Find the text element within the snackbar
  const textElement = elements.snackbar.querySelector(".snackbar-text");
  if (!textElement) {
    console.warn("Snackbar text element not found");
    return;
  }

  // Update the message
  textElement.textContent = message;

  // Remove any existing show class first
  elements.snackbar.classList.remove("show");

  // Force a reflow to restart animation
  void elements.snackbar.offsetWidth;

  // Show the snackbar
  elements.snackbar.classList.add("show");

  // Set up the close button
  const closeButton = elements.snackbar.querySelector(".snackbar-close");
  if (closeButton) {
    closeButton.onclick = () => {
      elements.snackbar.classList.remove("show");
    };
  }

  // Auto-hide after 3 seconds
  setTimeout(() => {
    elements.snackbar.classList.remove("show");
  }, 3000);
}

/**
 * Extracts domain from a URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Extracted domain
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} - Whether copy was successful
 */
export async function copyToClipboard(text) {
  try {
    // Try using the Clipboard API first
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    try {
      // Fallback: Create temporary textarea
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      // Execute copy command
      document.execCommand("copy");
      textArea.remove();
      return true;
    } catch (err2) {
      console.error("Failed to copy text:", err2);
      return false;
    }
  }
}

/**
 * Formats a size in bytes to a human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
export function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Initialize core elements when DOM is loaded
export function initCore() {
  // Setup basic listeners
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize DOM references
    for (const key in elements) {
      if (elements[key] === null) {
        elements[key] =
          document.getElementById(key) || document.querySelector(`.${key}`);
      }
    }
  });
}
