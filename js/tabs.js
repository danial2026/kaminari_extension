/**
 * tabs.js - Functions for working with browser tabs
 */

import { elements, state, extractDomain } from "./core.js";
import { showSnackbar, createElement } from "./utils.js";

/**
 * Get all tabs from the current window
 * @returns {Promise<Array>} - Promise that resolves to array of tab objects
 */
export async function getCurrentWindowTabs() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs;
  } catch (error) {
    console.error("Error getting tabs:", error);
    return [];
  }
}

/**
 * Get simplified tab data (only needed properties)
 * @param {Array} tabs - Array of full Chrome tab objects
 * @returns {Array} - Array of simplified tab objects
 */
export function simplifyTabs(tabs) {
  return tabs.map((tab) => ({
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl || "",
  }));
}

/**
 * Save current tabs to a new session
 * @returns {Promise<Array>} - Promise that resolves to array of simplified tab objects
 */
export async function saveCurrentTabs() {
  try {
    const tabs = await getCurrentWindowTabs();
    return simplifyTabs(tabs);
  } catch (error) {
    console.error("Error saving current tabs:", error);
    return [];
  }
}

/**
 * Open a URL in a new tab
 * @param {string} url - URL to open
 * @returns {Promise<chrome.tabs.Tab>} - Promise that resolves to the created tab
 */
export async function openTab(url) {
  try {
    return await chrome.tabs.create({ url });
  } catch (error) {
    console.error("Error opening tab:", error);
    throw new Error("Failed to open tab");
  }
}

/**
 * Open multiple tabs in a new window
 * @param {Array} urls - Array of URLs to open
 * @returns {Promise<chrome.windows.Window>} - Promise that resolves to the created window
 */
export async function openTabsInNewWindow(urls) {
  try {
    if (!urls || !urls.length) {
      throw new Error("No URLs provided");
    }

    return await chrome.windows.create({
      url: urls,
      focused: true,
    });
  } catch (error) {
    console.error("Error opening tabs in new window:", error);
    throw new Error("Failed to open tabs in new window");
  }
}

/**
 * Close all tabs in the current window except the extension
 * @returns {Promise<void>}
 */
export async function closeAllTabs() {
  try {
    const tabs = await getCurrentWindowTabs();

    // Filter out extension tabs
    const extensionUrl = chrome.runtime.getURL("");
    const tabsToClose = tabs.filter((tab) => !tab.url.startsWith(extensionUrl));

    const tabIds = tabsToClose.map((tab) => tab.id);
    if (tabIds.length > 0) {
      await chrome.tabs.remove(tabIds);
    }
  } catch (error) {
    console.error("Error closing tabs:", error);
    throw new Error("Failed to close tabs");
  }
}

/**
 * Updates the state with current tabs
 */
export async function updateTabsState() {
  state.currentTabs = await getCurrentTabs();
  renderTabs();
}

/**
 * Renders tabs in the preview area
 */
export function renderTabs() {
  if (!elements.tabPreview) return;

  elements.tabPreview.innerHTML = "";

  // Get tabs to display based on filter settings
  let tabsToDisplay = [...state.currentTabs];

  // Apply sort by position if enabled
  if (elements.sortByPositionToggle && elements.sortByPositionToggle.checked) {
    tabsToDisplay.sort((a, b) => a.index - b.index);
  }

  // Show only selected if toggled
  if (
    (elements.showSelectedOnlyToggle &&
      elements.showSelectedOnlyToggle.checked) ||
    state.forceShowSelected
  ) {
    tabsToDisplay = tabsToDisplay.filter((tab) =>
      state.selectedTabs.some((t) => t.id === tab.id)
    );
  }

  // Group by domain if enabled
  if (elements.groupByDomainToggle && elements.groupByDomainToggle.checked) {
    renderTabsByDomain(tabsToDisplay);
  } else {
    renderTabsList(tabsToDisplay);
  }

  // Update selected count
  updateSelectedCount();
}

/**
 * Renders tabs grouped by domain
 * @param {Array} tabs - Array of tabs to render
 */
function renderTabsByDomain(tabs) {
  // Create a map to group tabs by domain
  const domainGroups = {};

  tabs.forEach((tab) => {
    const domain = extractDomain(tab.url);
    if (!domainGroups[domain]) {
      domainGroups[domain] = [];
    }
    domainGroups[domain].push(tab);
  });

  // Render each domain group
  Object.entries(domainGroups).forEach(([domain, domainTabs]) => {
    // Create domain header
    const domainHeader = createElement("div", {
      className: "domain-header",
      textContent: domain,
    });
    elements.tabPreview.appendChild(domainHeader);

    // Render tabs for this domain
    domainTabs.forEach((tab) => {
      elements.tabPreview.appendChild(createTabElement(tab));
    });
  });
}

/**
 * Renders tabs as a flat list
 * @param {Array} tabs - Array of tabs to render
 */
function renderTabsList(tabs) {
  tabs.forEach((tab) => {
    elements.tabPreview.appendChild(createTabElement(tab));
  });
}

/**
 * Creates a DOM element for a tab
 * @param {Object} tab - Tab object
 * @returns {HTMLElement} - Tab element
 */
function createTabElement(tab) {
  // Check if this tab is selected
  const isSelected = state.selectedTabs.some((t) => t.id === tab.id);

  // Create the main tab element
  const tabElement = createElement("div", {
    className: isSelected ? "tab-item selected" : "tab-item",
    dataset: {
      tabId: tab.id,
    },
  });

  // Create favicon element
  const favicon = createElement("img", {
    className: "tab-favicon",
    src: tab.favIconUrl || "icons/globe.svg",
  });

  favicon.onerror = () => {
    favicon.src = "icons/globe.svg";
  };

  // Create title element
  const title = createElement("div", {
    className: "tab-title",
    textContent: tab.title,
    title: tab.title,
  });

  // Add elements to tab
  tabElement.appendChild(favicon);
  tabElement.appendChild(title);

  // Add click handler
  tabElement.addEventListener("click", () => toggleTabSelection(tab));

  return tabElement;
}

/**
 * Toggles the selection state of a tab
 * @param {Object} tab - Tab to toggle
 */
export function toggleTabSelection(tab) {
  const isSelected = state.selectedTabs.some((t) => t.id === tab.id);

  if (isSelected) {
    // Remove from selection
    state.selectedTabs = state.selectedTabs.filter((t) => t.id !== tab.id);
  } else {
    // Add to selection
    state.selectedTabs.push(tab);
  }

  // Update UI
  renderTabs();
}

/**
 * Updates the selected count display
 */
function updateSelectedCount() {
  if (elements.toggleLabel) {
    elements.toggleLabel.textContent = `Only show selected (${state.selectedTabs.length})`;
  }
}

/**
 * Gets formatted tab content based on user settings
 * @param {Array} tabs - Array of tabs to format
 * @returns {string} - Formatted tab content
 */
export function getFormattedTabContent(tabs) {
  const includeTitles = elements.includeTitlesToggle.checked;
  const formatAsMarkdown = elements.formatMarkdownToggle.checked;

  let template;
  if (formatAsMarkdown) {
    template = elements.formatTemplateInput.value;
  } else {
    template = elements.plainTextTemplateInput.value;
  }

  return tabs
    .map((tab) => {
      let output = template;

      if (includeTitles) {
        output = output.replace(/\{\{title\}\}/g, tab.title);
      } else {
        output = output.replace(/\{\{title\}\}/g, "");
      }

      // Always include URLs
      output = output.replace(/\{\{url\}\}/g, tab.url);

      // Clean up any artifacts from empty replacements
      output = output.replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim();

      return output;
    })
    .join("\n")
    .trim();
}

/**
 * Handles copying all tabs
 */
export async function copyAllTabs() {
  const content = getFormattedTabContent(state.currentTabs);
  const success = await copyToClipboard(content);

  if (success) {
    showSnackbar("All tabs copied to clipboard!");
  } else {
    showSnackbar("Failed to copy tabs. Please try again.");
  }
}

/**
 * Handles copying selected tabs
 */
export async function copySelectedTabs() {
  if (state.selectedTabs.length === 0) {
    showSnackbar("No tabs selected. Please select tabs first.");
    return;
  }

  const content = getFormattedTabContent(state.selectedTabs);
  const success = await copyToClipboard(content);

  if (success) {
    showSnackbar(`${state.selectedTabs.length} tabs copied to clipboard!`);
  } else {
    showSnackbar("Failed to copy tabs. Please try again.");
  }
}

// Initialize tab functionality
export function initTabs() {
  // Setup listeners
  document.addEventListener("DOMContentLoaded", async () => {
    // Update tabs when extension opens
    await updateTabsState();

    // Setup event listeners for tab actions
    if (elements.copyAllTabsBtn) {
      elements.copyAllTabsBtn.addEventListener("click", copyAllTabs);
    }

    if (elements.copySelectedTabsBtn) {
      elements.copySelectedTabsBtn.addEventListener("click", copySelectedTabs);
    }

    // Setup filter toggles
    if (elements.sortByPositionToggle) {
      elements.sortByPositionToggle.addEventListener("change", renderTabs);
    }

    if (elements.groupByDomainToggle) {
      elements.groupByDomainToggle.addEventListener("change", renderTabs);
    }

    if (elements.showSelectedOnlyToggle) {
      elements.showSelectedOnlyToggle.addEventListener("change", renderTabs);
    }
  });
}
