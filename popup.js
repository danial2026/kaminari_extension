/**
 * popup.js - Main entry point for the popup UI
 */

// Import polyfill and UI components
import "./js/browser-polyfill.js";
import { initCustomConfirm } from "./js/custom-confirm.js";
import {
  initTabsUI,
  updateTabPreview,
  handleTabSelectionChange,
} from "./ui/tabs-ui.js";
import { initFolderUI } from "./ui/folders-ui.js";
import { initSettingsUI } from "./ui/settings-ui.js";

// Function to load HTML components
async function loadComponent(componentName, placeholderId) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) {
    console.error(`Placeholder element not found: ${placeholderId}`);
    return;
  }
  try {
    const response = await fetch(`components/${componentName}.html`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    placeholder.innerHTML = html;
    console.log(`Component ${componentName} loaded into ${placeholderId}`);
  } catch (error) {
    console.error(`Error loading component ${componentName}:`, error);
    placeholder.innerHTML = `<p style="color: red;">Error loading ${componentName}.</p>`;
  }
}

// Initialize the UI when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing custom confirm dialog first");

  // Initialize confirm dialog as the first thing we do
  try {
    initCustomConfirm();
    console.log("Custom confirm dialog initialized successfully");
  } catch (error) {
    console.error("Error initializing custom confirm dialog:", error);
  }

  // Then start loading components and continue with initialization
  loadComponentsAndInitUI();
});

// Function to load components and initialize the UI
async function loadComponentsAndInitUI() {
  console.log("Starting component loading");

  try {
    await Promise.all([
      loadComponent("settings_panel", "settingsMenuPlaceholder"),
      loadComponent("create_folder_modal", "createFolderModalPlaceholder"),
      loadComponent("share_folder_modal", "shareFolderModalPlaceholder"),
      loadComponent("add_format_modal", "addFormatModalPlaceholder"),
    ]);
    console.log("All components loaded, initializing UI components");
  } catch (error) {
    console.error("Error loading components:", error);
    // Optionally display an error message to the user in the UI
    return; // Stop initialization if components failed to load
  }

  try {
    // Get DOM elements
    const elements = {
      // Tab UI elements
      tabPreview: document.getElementById("tabPreview"),
      includeTitlesToggle: document.getElementById("includeTitles"),
      formatMarkdownToggle: document.getElementById("formatMarkdown"),
      formatTemplateInput: document.getElementById("formatTemplate"),
      plainTextTemplateInput: document.getElementById("plainTextTemplate"),
      formatTemplateDropdown: document.getElementById("formatTemplateDropdown"),
      plainTextTemplateDropdown: document.getElementById(
        "plainTextTemplateDropdown"
      ),
      copyAllTabsBtn: document.getElementById("copyAllTabs"),
      copySelectedTabsBtn: document.getElementById("copySelectedTabs"),
      sortByPositionToggle: document.getElementById("sortByPosition"),
      groupByDomainToggle: document.getElementById("groupByDomain"),
      showSelectedOnlyToggle: document.getElementById("showSelectedOnly"),
      toggleLabel: document.getElementById("toggleLabel"),

      // Folder UI elements
      folderList: document.getElementById("folderList"),
      createFolderBtn: document.getElementById("createFolderBtn"),
      createFolderModal: document.getElementById("createFolderModal"),
      closeCreateFolderModal: document.getElementById("closeCreateFolderModal"),
      createFolderForm: document.getElementById("createFolderForm"),
      shareFolderModal: document.getElementById("shareFolderModal"),
      closeShareFolderModal: document.getElementById("closeShareFolderModal"),
      shareFolderForm: document.getElementById("shareFolderForm"),
      shareResult: document.getElementById("shareResult"),
      qrcodeDiv: document.getElementById("qrcode"),
      shareStatsDiv: document.getElementById("shareStats"),
      togglePasswordBtn: document.getElementById("togglePassword"),
      copyShareLinkBtn: document.getElementById("copyShareLink"),
      copyOriginalLinkBtn: document.getElementById("copyOriginalLink"),

      // Settings UI elements
      settingsIcon:
        document.getElementById("settingsToggleBtn") ||
        document.querySelector(".settings-icon"),
      settingsMenu: document.querySelector(".settings-menu"),
      closeSettingsBtn: document.querySelector(".close-btn"),
      resetBtn: document.querySelector(".reset-btn"),

      // Common elements
      snackbar: document.getElementById("snackbar"),

      // Format UI elements
      addFormatBtn: document.getElementById("addFormatBtn"),
      addPlainFormatBtn: document.getElementById("addPlainFormatBtn"),
      addFormatModal: document.getElementById("addFormatModal"),
      closeAddFormatModal: document.getElementById("closeAddFormatModal"),
      addFormatForm: document.getElementById("addFormatForm"),
      formatTypeInput: document.getElementById("formatType"),
      formatNameInput: document.getElementById("formatName"),
      formatPatternInput: document.getElementById("formatPattern"),
    };

    // Validate essential UI elements
    const requiredElements = [
      "tabPreview",
      "includeTitlesToggle",
      "formatMarkdownToggle",
      "folderList",
      "snackbar",
    ];

    const missingElements = requiredElements.filter((name) => !elements[name]);
    if (missingElements.length > 0) {
      throw new Error(
        `Missing required UI elements: ${missingElements.join(", ")}`
      );
    }

    console.log("All required UI elements found");

    // Initialize UI components in sequence
    console.log("Initializing tabs UI");
    await initTabsUI(elements);

    console.log("Initializing folder UI");
    await initFolderUI(elements);

    console.log("Initializing settings UI");
    await initSettingsUI(elements);

    // Set up message listener for tab selection changes
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "tabsSelected") {
        handleTabSelectionChange(message.tabIds);
      }
    });

    console.log("UI components initialized successfully");
  } catch (error) {
    console.error("Error initializing UI:", error);
    const snackbar = document.getElementById("snackbar");
    if (snackbar) {
      snackbar.textContent =
        "Error initializing UI. Check console for details.";
      snackbar.classList.add("show");
      setTimeout(() => snackbar.classList.remove("show"), 3000);
    }
  }
}
