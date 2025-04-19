/**
 * tabs-ui.js - UI components and handlers for tabs management
 */

import "../js/browser-polyfill.js";
import { copyToClipboard } from "../js/clipboard.js";
import {
  formatTabs,
  processTabs,
  generateFormatExample,
  formatSingleTab,
} from "../js/tabs-formatter.js";
import * as formatManager from "../js/format-manager.js";

// DOM element references
let tabPreview;
let includeTitlesToggle;
let formatMarkdownToggle;
let formatTemplateInput;
let plainTextTemplateInput;
let copyAllTabsBtn;
let copySelectedTabsBtn;
let sortByPositionToggle;
let groupByDomainToggle;
let showSelectedOnlyToggle;
let toggleLabel;
let snackbar;
let formatTemplateDropdown;
let plainTextTemplateDropdown;
let addFormatBtn;
let addPlainFormatBtn;
let addFormatModal;
let closeAddFormatModal;
let addFormatForm;
let formatTypeInput;
let formatNameInput;
let formatPatternInput;

// Global state variables
let currentTabs = [];
let selectedTabs = [];
let forceShowSelected = false;

/**
 * Initialize tabs UI components
 * @param {Object} elements - DOM elements
 * @returns {Promise<void>}
 */
export async function initTabsUI(elements) {
  console.log("Initializing tabs UI components");

  try {
    // Store DOM references
    tabPreview = elements.tabPreview;
    includeTitlesToggle = elements.includeTitlesToggle;
    formatMarkdownToggle = elements.formatMarkdownToggle;
    formatTemplateInput = elements.formatTemplateInput;
    plainTextTemplateInput = elements.plainTextTemplateInput;
    copyAllTabsBtn = elements.copyAllTabsBtn;
    copySelectedTabsBtn = elements.copySelectedTabsBtn;
    sortByPositionToggle = elements.sortByPositionToggle;
    groupByDomainToggle = elements.groupByDomainToggle;
    showSelectedOnlyToggle = elements.showSelectedOnlyToggle;
    toggleLabel = elements.toggleLabel;
    snackbar = elements.snackbar;
    formatTemplateDropdown = elements.formatTemplateDropdown;
    plainTextTemplateDropdown = elements.plainTextTemplateDropdown;
    addFormatBtn = elements.addFormatBtn;
    addPlainFormatBtn = elements.addPlainFormatBtn;
    addFormatModal = elements.addFormatModal;
    closeAddFormatModal = elements.closeAddFormatModal;
    addFormatForm = elements.addFormatForm;
    formatTypeInput = elements.formatTypeInput;
    formatNameInput = elements.formatNameInput;
    formatPatternInput = elements.formatPatternInput;

    // Verify essential DOM elements are found
    const requiredElements = [
      { name: "tabPreview", element: tabPreview },
      { name: "includeTitlesToggle", element: includeTitlesToggle },
      { name: "formatMarkdownToggle", element: formatMarkdownToggle },
    ];

    // Check which required elements are missing
    const missingElements = requiredElements
      .filter((item) => !item.element)
      .map((item) => item.name);

    if (missingElements.length > 0) {
      throw new Error(
        `Required DOM elements not found: ${missingElements.join(", ")}`
      );
    }

    console.log("All essential UI elements for tabs found");

    // Check if tabPreview container exists
    const tabContainer = tabPreview.closest(".tab-container");
    if (!tabContainer) {
      console.warn(
        "Tab container not found, some features may not work correctly"
      );
    }

    // Check template containers - these are used by updateTemplateVisibility
    const formatTemplateContainer = document.getElementById(
      "formatTemplateContainer"
    );
    const plainTextTemplateContainer = document.getElementById(
      "plainTextTemplateContainer"
    );

    if (!formatTemplateContainer || !plainTextTemplateContainer) {
      console.warn(
        "Template containers not found in DOM, template visibility features may not work"
      );
    }

    // Expose showSnackbar to format-manager to use
    window.showSnackbar = showSnackbar;
    // Expose saveSettings as well
    window.saveSettings = saveSettings;
    // Expose updateFormatExamples for dropdown changes
    window.updateFormatExamples = updateFormatExamples;

    // Initialize format manager
    formatManager.init({
      formatTemplateDropdown,
      plainTextTemplateDropdown,
      formatTemplateInput,
      plainTextTemplateInput,
      formatMarkdownToggle,
    });

    // Setup event listeners
    setupEventListeners();

    // Load tabs and initialize UI
    await loadTabs();

    console.log("Tabs UI initialization complete");
    return Promise.resolve();
  } catch (error) {
    console.error("Error initializing tabs UI:", error);
    return Promise.reject(error);
  }
}

/**
 * Setup event listeners for tabs UI
 */
function setupEventListeners() {
  console.log("Setting up tabs UI event listeners");

  // Format toggles
  includeTitlesToggle.addEventListener("change", () => {
    updateTabPreview();
    saveSettings();
    updateFormatExamples();
  });

  formatMarkdownToggle.addEventListener("change", () => {
    updateTemplateVisibility();
    updateTabPreview();
    saveSettings();
    updateFormatExamples();

    // Log format type when toggle changes
    const formatType = formatManager.getCurrentFormatType(
      formatMarkdownToggle.checked
    );
    console.log("Format type changed to:", formatType);
  });

  // Format template input
  formatTemplateInput.addEventListener("input", () => {
    updateTabPreview();
    saveSettings();
    updateFormatExamples();
  });

  // Plain text template input
  plainTextTemplateInput.addEventListener("input", () => {
    updateTabPreview();
    saveSettings();
    updateFormatExamples();
  }); // Sort and group toggles

  // Sort and group toggles
  sortByPositionToggle.addEventListener("change", () => {
    updateTabPreview();
    saveSettings();
  });

  groupByDomainToggle.addEventListener("change", () => {
    updateTabPreview();
    saveSettings();
  });

  showSelectedOnlyToggle.addEventListener("change", () => {
    forceShowSelected = showSelectedOnlyToggle.checked;

    // Update the toggle label to reflect current state
    if (toggleLabel) {
      const count = selectedTabs.length;
      if (count === 0) {
        toggleLabel.textContent = "Show selected tabs only (none selected)";
      } else if (showSelectedOnlyToggle.checked) {
        toggleLabel.textContent = `Show ${selectedTabs.length} selected tab${
          selectedTabs.length !== 1 ? "s" : ""
        }`;
      } else {
        toggleLabel.textContent = `Show all tab${
          selectedTabs.length !== 1 ? "s" : ""
        }`;
      }
    }

    updateTabPreview();
    saveSettings();
  });

  // Copy buttons
  copyAllTabsBtn.addEventListener("click", copyAllTabs);
  copySelectedTabsBtn.addEventListener("click", copySelectedTabs);

  // Format add buttons
  if (addFormatBtn) {
    addFormatBtn.addEventListener("click", () => {
      // Determine format type based on the toggle state
      const formatType = formatMarkdownToggle.checked
        ? "markdown"
        : "plaintext";
      formatManager.showAddFormatModal(
        formatType,
        addFormatModal,
        formatTypeInput,
        formatNameInput
      );
    });
  }

  // Close add format modal
  if (closeAddFormatModal) {
    closeAddFormatModal.addEventListener("click", () => {
      formatManager.hideAddFormatModal(addFormatModal, addFormatForm);
    });
  }

  // Add format form submit
  if (addFormatForm) {
    addFormatForm.addEventListener("submit", (e) => {
      formatManager.handleAddFormat(
        e,
        formatTypeInput,
        formatNameInput,
        formatPatternInput,
        addFormatModal,
        addFormatForm
      );
      // These updates might need adjustment if addFormat changes behavior based on type
      updateTabPreview();
      updateFormatExamples();
    });
  }
}

/**
 * Load tabs from Chrome API
 * @returns {Promise<void>}
 */
export async function loadTabs() {
  console.log("Loading tabs data");

  try {
    // Get all tabs in current window
    const tabs = await browser.tabs.query({ currentWindow: true });
    console.log(`Loaded ${tabs.length} tabs from current window`);

    // Get highlighted (selected) tabs
    const highlightedTabs = await browser.tabs.query({
      currentWindow: true,
      highlighted: true,
    });
    console.log(`Found ${highlightedTabs.length} highlighted tabs`);

    // Update global state
    currentTabs = tabs;
    selectedTabs = highlightedTabs;

    // Verify UI elements exist before proceeding
    if (!tabPreview || !includeTitlesToggle || !formatMarkdownToggle) {
      throw new Error("Required UI elements not found during tabs loading");
    }

    // Load saved settings
    await loadSettings();

    try {
      // Update template visibility based on current format toggle state
      updateTemplateVisibility();
      console.log("Template visibility updated");
    } catch (e) {
      console.error("Error updating template visibility:", e);
    }

    try {
      // Update UI in a safe way, catching any errors for individual operations
      updateTabPreview();
      console.log("Tab preview updated");
    } catch (e) {
      console.error("Error updating tab preview:", e);
    }

    try {
      updateFormatExamples();
      console.log("Format examples updated");
    } catch (e) {
      console.error("Error updating format examples:", e);
    }

    try {
      checkSelectedTabs();
      console.log("Selected tabs checked");
    } catch (e) {
      console.error("Error checking selected tabs:", e);
    }

    // Set up template tooltips
    try {
      addPlaceholderTooltips();
      console.log("Placeholder tooltips added");
    } catch (e) {
      console.error("Error adding placeholder tooltips:", e);
    }

    console.log("Tabs data loaded successfully");
  } catch (error) {
    console.error("Error loading tabs:", error);
    if (snackbar) {
      showSnackbar("Error loading tabs");
    }
    throw error;
  }
}

/**
 * Loads user settings from storage
 */
async function loadSettings() {
  return new Promise((resolve) => {
    browser.storage.local.get(
      [
        "includeTitles",
        "formatMarkdown",
        "formatTemplate",
        "plainTextTemplate",
        "sortByPosition",
        "groupByDomain",
        "showSelectedOnly",
      ],
      (result) => {
        // Format settings
        includeTitlesToggle.checked = result.includeTitles !== false;
        formatMarkdownToggle.checked = result.formatMarkdown !== false;

        // Template settings - ensure we have defaults
        const markdownTemplate =
          result.formatTemplate || "[{{title}}]({{url}})";
        const plainTemplate = result.plainTextTemplate || "{{title}} - {{url}}";

        formatTemplateInput.value = markdownTemplate;
        plainTextTemplateInput.value = plainTemplate;

        // Set dropdown values based on the saved templates
        setDropdownValue(formatTemplateDropdown, markdownTemplate);
        setDropdownValue(plainTextTemplateDropdown, plainTemplate);

        // Display settings
        sortByPositionToggle.checked = result.sortByPosition !== false;
        groupByDomainToggle.checked = result.groupByDomain === true;
        showSelectedOnlyToggle.checked = result.showSelectedOnly === true;
        forceShowSelected = result.showSelectedOnly === true;

        // Log loaded settings for debugging
        console.log("Loaded settings:", {
          markdownTemplate,
          plainTemplate,
          formatMarkdown: formatMarkdownToggle.checked,
        });

        resolve();
      }
    );
  });
}

/**
 * Sets the dropdown value based on a template pattern
 * If the template isn't found in the dropdown options, uses the "custom" option
 * @param {HTMLSelectElement} dropdown - The dropdown element
 * @param {string} templateValue - The template value to select
 */
function setDropdownValue(dropdown, templateValue) {
  if (!dropdown) return;

  // Look for the option with matching value
  let found = false;
  for (let i = 0; i < dropdown.options.length; i++) {
    if (dropdown.options[i].value === templateValue) {
      dropdown.selectedIndex = i;
      found = true;
      break;
    }
  }

  // If not found and dropdown has a "custom" option, select that
  if (!found) {
    for (let i = 0; i < dropdown.options.length; i++) {
      if (dropdown.options[i].value === "custom") {
        dropdown.selectedIndex = i;
        if (dropdown === formatTemplateDropdown) {
          formatTemplateInput.classList.add("show");
        }
        break;
      }
    }
  } else {
    // Make sure the input is hidden if we found a matching option
    if (dropdown === formatTemplateDropdown) {
      formatTemplateInput.classList.remove("show");
    }
  }
}

/**
 * Saves user preferences to storage
 */
function saveSettings() {
  // Get current settings
  const settings = {
    includeTitles: includeTitlesToggle.checked,
    formatMarkdown: formatMarkdownToggle.checked,
    formatTemplate: formatTemplateInput.value || "[{{title}}]({{url}})",
    plainTextTemplate: plainTextTemplateInput.value || "{{title}} - {{url}}",
    sortByPosition: sortByPositionToggle.checked,
    groupByDomain: groupByDomainToggle.checked,
    showSelectedOnly: showSelectedOnlyToggle.checked,
  };

  // Save to storage
  browser.storage.local.set(settings, function () {
    console.log("Settings saved:", settings);
  });
}

/**
 * Updates the tab preview based on current settings
 */
export function updateTabPreview() {
  if (!tabPreview) {
    console.warn("Tab preview element not found");
    return;
  }

  // Check if tab container exists
  const tabContainer = tabPreview.closest(".tab-container");
  if (!tabContainer) {
    console.warn("Tab container not found");
    return;
  }

  // Skip preview updates while in folder preview mode
  if (tabContainer.classList.contains("preview-mode")) {
    return;
  }

  // Process tabs
  const processedTabs = processTabs(currentTabs, {
    sortByPosition: sortByPositionToggle?.checked || false,
    groupByDomain: groupByDomainToggle?.checked || false,
    showSelectedOnly: forceShowSelected,
    selectedTabs: selectedTabs,
  });

  // Clear the preview
  tabPreview.innerHTML = "";

  // Don't render if no tabs
  if (!processedTabs || processedTabs.length === 0) {
    tabPreview.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        </div>
        <h3>No Tabs Available</h3>
        <p>There are no tabs matching your filters</p>
      </div>
    `;
    return;
  }

  // Handle domain groups if groupByDomain is true
  if (groupByDomainToggle?.checked) {
    processedTabs.forEach((group) => {
      // Add domain header
      const domainHeader = document.createElement("div");
      domainHeader.className = "domain-header";
      domainHeader.textContent = group.domain || "Unknown Domain";
      tabPreview.appendChild(domainHeader);

      // Add tabs for this domain
      group.tabs.forEach((tab) => {
        const tabElement = createTabElement(tab);
        tabPreview.appendChild(tabElement);
      });
    });
  } else {
    // Regular tab rendering
    processedTabs.forEach((tab) => {
      const tabElement = createTabElement(tab);
      tabPreview.appendChild(tabElement);
    });
  }
}

/**
 * Creates a tab element for preview
 * @param {Object} tab - Tab object
 * @returns {HTMLElement} - Tab element
 */
function createTabElement(tab) {
  const tabElement = document.createElement("div");
  tabElement.className = "tab-item";
  tabElement.dataset.tabId = tab.id;

  // Check if tab is selected
  if (selectedTabs.some((selectedTab) => selectedTab.id === tab.id)) {
    tabElement.classList.add("selected");
  }

  // Create favicon
  const favicon = document.createElement("img");
  favicon.className = "tab-favicon";
  favicon.src = tab.favIconUrl || "icons/link.svg";
  favicon.onerror = () => {
    favicon.src = "icons/link.svg";
  };

  // Create tab content
  const tabContent = document.createElement("div");
  tabContent.className = "tab-content";

  // Create title
  const title = document.createElement("div");
  title.className = "tab-title";
  title.textContent = tab.title || "Untitled";
  title.title = tab.title || "Untitled";

  // Create URL
  const url = document.createElement("div");
  url.className = "tab-url";
  url.textContent = tab.url || "";
  url.title = tab.url || "";

  // Assemble tab
  tabContent.appendChild(title);
  tabContent.appendChild(url);
  tabElement.appendChild(favicon);
  tabElement.appendChild(tabContent);

  // Add click event to focus the tab
  tabElement.addEventListener("click", () => {
    browser.tabs.update(tab.id, { active: true });
  });

  return tabElement;
}

/**
 * Updates template visibility based on format toggle
 */
function updateTemplateVisibility() {
  const formatTemplateContainer = document.getElementById(
    "formatTemplateContainer"
  );
  const plainTextTemplateContainer = document.getElementById(
    "plainTextTemplateContainer"
  );

  // Add null checks to prevent errors
  if (!formatTemplateContainer || !plainTextTemplateContainer) {
    console.warn("Template containers not found in the DOM");
    return;
  }

  if (formatMarkdownToggle.checked) {
    // Show markdown format, hide plaintext format
    formatTemplateContainer.style.display = "block";
    plainTextTemplateContainer.style.display = "none";
  } else {
    // Hide markdown format, show plaintext format
    formatTemplateContainer.style.display = "none";
    plainTextTemplateContainer.style.display = "block";
  }

  // Log the current format type for debugging
  console.log(
    "Format type updated:",
    formatMarkdownToggle.checked ? "markdown" : "plaintext"
  );
}

/**
 * Updates format examples based on current settings
 */
function updateFormatExamples() {
  const formatExample = document.getElementById("formatExample");
  if (!formatExample) {
    console.warn("Format example element not found in the DOM");
    return;
  }

  // Set default templates if they're empty
  if (!formatTemplateInput.value) {
    formatTemplateInput.value = "[{{title}}]({{url}})";
  }

  if (!plainTextTemplateInput.value) {
    plainTextTemplateInput.value = "{{title}} - {{url}}";
  }

  const options = {
    includeTitles: includeTitlesToggle.checked,
    formatMarkdown: formatMarkdownToggle.checked,
    formatTemplate: formatTemplateInput.value,
    plainTextTemplate: plainTextTemplateInput.value,
  };

  formatExample.textContent = generateFormatExample(options);
}

/**
 * Checks if any tabs are selected and updates UI accordingly
 */
function checkSelectedTabs() {
  if (!copySelectedTabsBtn || !toggleLabel) {
    console.warn("Required UI elements for checking selected tabs not found");
    return;
  }

  if (selectedTabs.length > 0) {
    copySelectedTabsBtn.disabled = false;

    // Update toggle label based on current toggle state
    if (showSelectedOnlyToggle && showSelectedOnlyToggle.checked) {
      toggleLabel.textContent = `Show ${selectedTabs.length} selected tab${
        selectedTabs.length !== 1 ? "s" : ""
      }`;
    } else {
      toggleLabel.textContent = `Show all tab${
        selectedTabs.length !== 1 ? "s" : ""
      }`;
    }
  } else {
    copySelectedTabsBtn.disabled = true;
    toggleLabel.textContent = "Show selected tabs only (none selected)";
  }
}

/**
 * Adds tooltips to template input fields
 */
function addPlaceholderTooltips() {
  // Ensure required elements exist
  if (!formatTemplateInput || !plainTextTemplateInput) {
    console.warn("Template input elements not found, can't add tooltips");
    return;
  }

  const placeholders = [
    { text: "{{title}}", desc: "Tab title" },
    { text: "{{url}}", desc: "Tab URL" },
  ];

  const tooltipContainer = document.createElement("div");
  tooltipContainer.className = "template-tooltip";
  tooltipContainer.style.display = "none";
  document.body.appendChild(tooltipContainer);

  // Add tooltips to format template input
  formatTemplateInput.addEventListener("focus", () => {
    const tooltipContent = placeholders
      .map((p) => `<div><code>${p.text}</code> - ${p.desc}</div>`)
      .join("");
    tooltipContainer.innerHTML = `
      <div class="tooltip-title">Available Placeholders:</div>
      ${tooltipContent}
    `;

    const inputRect = formatTemplateInput.getBoundingClientRect();
    tooltipContainer.style.top = inputRect.bottom + 5 + "px";
    tooltipContainer.style.left = inputRect.left + "px";
    tooltipContainer.style.display = "block";
  });

  formatTemplateInput.addEventListener("blur", () => {
    tooltipContainer.style.display = "none";
  });

  // Add tooltips to plain text template input
  plainTextTemplateInput.addEventListener("focus", () => {
    const tooltipContent = placeholders
      .map((p) => `<div><code>${p.text}</code> - ${p.desc}</div>`)
      .join("");
    tooltipContainer.innerHTML = `
      <div class="tooltip-title">Available Placeholders:</div>
      ${tooltipContent}
    `;

    const inputRect = plainTextTemplateInput.getBoundingClientRect();
    tooltipContainer.style.top = inputRect.bottom + 5 + "px";
    tooltipContainer.style.left = inputRect.left + "px";
    tooltipContainer.style.display = "block";
  });

  plainTextTemplateInput.addEventListener("blur", () => {
    tooltipContainer.style.display = "none";
  });
}

/**
 * Copies all tabs to clipboard
 */
export async function copyAllTabs() {
  try {
    // Process tabs
    const processedTabs = processTabs(currentTabs, {
      sortByPosition: sortByPositionToggle.checked,
      groupByDomain: groupByDomainToggle.checked,
    });

    // Format tabs
    const formattedText = formatTabs(processedTabs, {
      includeTitles: includeTitlesToggle.checked,
      formatMarkdown: formatMarkdownToggle.checked,
      formatTemplate: formatTemplateInput.value,
      plainTextTemplate: plainTextTemplateInput.value,
      groupByDomain: groupByDomainToggle.checked,
    });

    // Copy to clipboard
    await copyToClipboard(formattedText);
    showSnackbar("All tabs copied to clipboard");
  } catch (error) {
    console.error("Error copying all tabs:", error);
    showSnackbar("Error copying tabs");
  }
}

/**
 * Handles copying selected tabs to clipboard
 */
export async function copySelectedTabs() {
  // Don't do anything if no tabs are selected
  if (!selectedTabs || selectedTabs.length === 0) {
    showSnackbar("No tabs selected");
    return;
  }

  try {
    // Get options
    const processedTabs = processTabs(selectedTabs, {
      sortByPosition: sortByPositionToggle?.checked || false,
      groupByDomain: groupByDomainToggle?.checked || false,
    });

    // Format according to settings
    const formattedText = formatTabs(processedTabs, {
      includeTitles: includeTitlesToggle.checked,
      formatMarkdown: formatMarkdownToggle.checked,
      formatTemplate: formatTemplateInput.value,
      plainTextTemplate: plainTextTemplateInput.value,
      groupByDomain: groupByDomainToggle?.checked || false,
    });

    // Copy to clipboard
    await copyToClipboard(formattedText);
    showSnackbar(`${selectedTabs.length} tab(s) copied to clipboard`);
  } catch (error) {
    console.error("Error copying selected tabs:", error);
    showSnackbar("Error copying tabs");
  }
}

/**
 * Handles tab selection change
 * @param {number[]} tabIds - Selected tab IDs
 */
export function handleTabSelectionChange(tabIds) {
  // Update selected tabs
  selectedTabs = currentTabs.filter((tab) => tabIds.includes(tab.id));

  // Update UI
  checkSelectedTabs();
  updateTabPreview();
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
