/**
 * settings-ui.js - UI components and handlers for settings
 */

import "../js/browser-polyfill.js";
import { customConfirm } from "../js/custom-confirm.js";

// DOM element references
let settingsIcon;
let settingsMenu;
let closeSettingsBtn;
let resetBtn;
let snackbar;

// Add references for internal settings navigation
let privacyPolicyBtn;
let termsBtn;
let backButtons;
let mainSettingsLinks;
let privacyPolicyContent;
let termsContent;
let mainSettingsHeader;

// Add references for new elements
let deleteCacheBtn;
let versionDisplay;

/**
 * Initialize settings UI components
 * @param {Object} elements - DOM elements
 * @returns {Promise<void>}
 */
export async function initSettingsUI(elements) {
  console.log("Initializing settings UI components");

  try {
    // Store DOM references
    settingsIcon = elements.settingsIcon;
    settingsMenu = elements.settingsMenu;
    closeSettingsBtn = elements.closeSettingsBtn;
    resetBtn = elements.resetBtn;
    snackbar = elements.snackbar;

    // Get internal settings elements (might be null if component loading failed)
    privacyPolicyBtn = document.getElementById("privacyPolicyBtn");
    termsBtn = document.getElementById("termsBtn");
    backButtons = document.querySelectorAll(
      ".back-btn[data-target='mainSettings']"
    );
    mainSettingsLinks = document.getElementById("mainSettingsLinks");
    privacyPolicyContent = document.getElementById("privacyPolicyContent");
    termsContent = document.getElementById("termsContent");
    mainSettingsHeader = document.getElementById("mainSettingsHeader");

    // Get new elements
    deleteCacheBtn = document.getElementById("deleteCacheBtn");
    versionDisplay = document.getElementById("versionDisplay");

    // Log found elements for debugging
    console.log("Delete cache button found:", !!deleteCacheBtn);
    console.log("Version display found:", !!versionDisplay);

    // Verify essential elements
    if (!settingsIcon || !settingsMenu || !closeSettingsBtn) {
      throw new Error("Required settings UI elements not found");
    }

    // Setup event listeners
    setupEventListeners();

    // Set extension version from manifest
    setExtensionVersion();

    console.log("Settings UI initialization complete");
    return Promise.resolve();
  } catch (error) {
    console.error("Error initializing settings UI:", error);
    return Promise.reject(error);
  }
}

/**
 * Setup event listeners for settings UI
 */
function setupEventListeners() {
  // Settings icon click - show settings menu
  settingsIcon.addEventListener("click", showSettingsMenu);

  // Close settings button click - hide settings menu
  closeSettingsBtn.addEventListener("click", hideSettingsMenu);

  // Reset button click - reset settings
  if (resetBtn) {
    resetBtn.addEventListener("click", resetSettings);
  } else {
    console.warn("Reset button not found");
  }

  // Delete cache button click
  try {
    if (deleteCacheBtn) {
      console.log("Adding event listener to delete cache button");
      deleteCacheBtn.addEventListener("click", function (e) {
        e.preventDefault();
        console.log("Delete cache button clicked");
        deleteCache();
      });
    } else {
      console.warn("Delete cache button not found");
    }
  } catch (err) {
    console.error("Error setting up delete cache button:", err);
  }

  // Add listeners for internal settings navigation if elements exist
  if (privacyPolicyBtn) {
    privacyPolicyBtn.addEventListener("click", () => showSection("privacy"));
  } else {
    console.warn("Privacy policy button not found");
  }

  if (termsBtn) {
    termsBtn.addEventListener("click", () => showSection("terms"));
  } else {
    console.warn("Terms button not found");
  }

  if (backButtons && backButtons.length > 0) {
    backButtons.forEach((button) => {
      button.addEventListener("click", () => showSection("main"));
    });
  } else {
    console.warn("Back buttons not found");
  }

  // Close settings menu when clicking outside
  document.addEventListener("click", (e) => {
    // If clicked element is not part of settings menu or settings icon
    if (
      !e.target.closest(".settings-menu") &&
      !e.target.closest(".settings-icon") &&
      settingsMenu.classList.contains("show")
    ) {
      hideSettingsMenu();
    }
  });
}

/**
 * Delete all cached data
 */
async function deleteCache() {
  try {
    console.log("Delete cache triggered, showing confirm dialog");

    // Use customConfirm with await
    const confirmed = await customConfirm(
      "Are you sure you want to delete all cached data? This will remove your custom formats and preferences."
    );

    console.log("Confirm result:", confirmed);

    if (confirmed) {
      // Use callback pattern instead of Promise/await
      browser.storage.local.clear(() => {
        if (browser.runtime.lastError) {
          console.error("Error clearing cache:", browser.runtime.lastError);
          showSnackbar("Error clearing cache");
          return;
        }

        // Show success message
        showSnackbar("Cache cleared successfully");

        // Reload the page to reset UI
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      });
    }
  } catch (error) {
    console.error("Error in deleteCache:", error);
  }
}

/**
 * Set the extension version from manifest
 */
function setExtensionVersion() {
  if (!versionDisplay) return;

  try {
    // Get the manifest (this is synchronous in MV3)
    const manifest = browser.runtime.getManifest();

    // Set the version text
    if (manifest && manifest.version) {
      versionDisplay.textContent = `Version ${manifest.version}`;
    }
  } catch (error) {
    console.error("Error getting extension version:", error);
    // Keep the default version text that's in the HTML
  }
}

/**
 * Shows the settings menu
 */
function showSettingsMenu() {
  settingsMenu.classList.add("show");
  // Show the main section by default when opening
  showSection("main");
}

/**
 * Hides the settings menu
 */
function hideSettingsMenu() {
  settingsMenu.classList.remove("show");
}

/**
 * Resets all settings to defaults
 */
async function resetSettings() {
  // Default settings
  const defaultSettings = {
    includeTitles: true,
    includeUrls: true,
    formatMarkdown: true,
    sortByPosition: true,
    groupByDomain: false,
    formatTemplate: "[{{title}}]({{url}})",
    plainTextTemplate: "{{title}} - {{url}}",
  };

  // Save default settings
  await browser.storage.local.set(defaultSettings);

  // Reload the page to apply settings
  window.location.reload();
}

/**
 * Helper function to show specific section within the settings panel
 * @param {string} section - 'main', 'privacy', or 'terms'
 */
function showSection(section) {
  // Ensure elements exist before trying to modify style
  if (
    !mainSettingsLinks ||
    !privacyPolicyContent ||
    !termsContent ||
    !mainSettingsHeader
  ) {
    console.error(
      "Cannot show section: one or more content elements or the main header not found."
    );
    return;
  }

  // Hide all content sections first
  mainSettingsLinks.style.display = "none";
  privacyPolicyContent.style.display = "none";
  termsContent.style.display = "none";

  // Show requested section and manage main header visibility
  if (section === "main") {
    mainSettingsLinks.style.display = "block";
    mainSettingsHeader.style.display = "flex";
  } else if (section === "privacy") {
    privacyPolicyContent.style.display = "block";
    mainSettingsHeader.style.display = "none";
  } else if (section === "terms") {
    termsContent.style.display = "block";
    mainSettingsHeader.style.display = "none";
  }
}

/**
 * Shows a snackbar message
 * @param {string} message - Message to show
 */
function showSnackbar(message) {
  if (!snackbar) {
    console.warn("Snackbar element not found");
    return;
  }

  // Find the text element within the snackbar
  const textElement = snackbar.querySelector(".snackbar-text");
  if (!textElement) {
    console.warn("Snackbar text element not found");
    return;
  }

  // Update the message
  textElement.textContent = message;

  // Remove any existing show class first
  snackbar.classList.remove("show");

  // Force a reflow to restart animation
  void snackbar.offsetWidth;

  // Show the snackbar
  snackbar.classList.add("show");

  // Set up the close button
  const closeButton = snackbar.querySelector(".snackbar-close");
  if (closeButton) {
    closeButton.onclick = () => {
      snackbar.classList.remove("show");
    };
  }

  // Auto-hide after 3 seconds
  setTimeout(() => {
    snackbar.classList.remove("show");
  }, 3000);
}
