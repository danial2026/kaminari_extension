// DOM element references
const includeTitlesToggle = document.getElementById("includeTitles");
const includeUrlsToggle = document.getElementById("includeUrls");
const formatMarkdownToggle = document.getElementById("formatMarkdown");
const formatTemplateInput = document.getElementById("formatTemplate");
const plainTextTemplateInput = document.getElementById("plainTextTemplate");
const copyAllTabsBtn = document.getElementById("copyAllTabs");
const copySelectedTabsBtn = document.getElementById("copySelectedTabs");
const resetBtn = document.querySelector(".reset-btn");
const settingsIcon = document.querySelector(".settings-icon");
const settingsMenu = document.querySelector(".settings-menu");
const closeSettingsBtn = document.querySelector(".close-btn");
const snackbar = document.getElementById("snackbar");
const tabPreview = document.getElementById("tabPreview");
const sortByPositionToggle = document.getElementById("sortByPosition");
const groupByDomainToggle = document.getElementById("groupByDomain");
const showSelectedOnlyToggle = document.getElementById("showSelectedOnly");
const toggleLabel = document.getElementById("toggleLabel");

// Global state variables
let currentTabs = [];
let selectedTabs = [];
let forceShowSelected = false;
let currentPreviewRestoreButton = null; // Tracks the current preview restore button

// ============== FOLDER MANAGEMENT SYSTEM ================

/**
 * @typedef {Object} Tab
 * @property {string} t - Tab title
 * @property {string} u - Tab URL
 * @property {string} [f] - Optional favicon URL
 *
 * @typedef {Object} Folder
 * @property {string} id - Unique identifier (UUID or timestamp)
 * @property {string} name - Folder name
 * @property {string} createdAt - ISO date string
 * @property {Tab[]} tabs - Array of tabs in this folder
 */

// Global folder state
let folders = [];

/**
 * Loads all folders from storage
 * @returns {Promise<Folder[]>}
 */
async function loadFolders() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["folders"], (result) => {
      folders = result.folders || [];
      resolve(folders);
    });
  });
}

/**
 * Saves folders to storage
 * @returns {Promise<void>}
 */
async function saveFolders() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ folders }, resolve);
  });
}

/**
 * Generates a unique ID for a new folder
 * @returns {string}
 */
function generateFolderId() {
  return Date.now().toString();
}

/**
 * Creates a new folder
 * @param {string} name - Folder name
 * @param {Tab[]} tabs - Initial tabs to add
 * @returns {Folder}
 */
async function createFolder(name, tabs = []) {
  const folder = {
    id: generateFolderId(),
    name,
    createdAt: new Date().toISOString(),
    tabs: tabs.map((tab) => ({
      t: tab.title || "",
      u: tab.url || "",
      f: tab.favIconUrl || "",
    })),
  };

  folders.push(folder);
  await saveFolders();
  return folder;
}

/**
 * Updates an existing folder
 * @param {string} folderId - ID of folder to update
 * @param {Object} updates - Properties to update
 * @returns {Promise<Folder|null>}
 */
async function updateFolder(folderId, updates) {
  const index = folders.findIndex((f) => f.id === folderId);
  if (index === -1) return null;

  folders[index] = { ...folders[index], ...updates };
  await saveFolders();
  return folders[index];
}

/**
 * Adds tabs to an existing folder
 * @param {string} folderId - ID of folder to add tabs to
 * @param {Tab[]} tabs - Tabs to add
 * @returns {Promise<Folder|null>}
 */
async function addTabsToFolder(folderId, tabs) {
  const index = folders.findIndex((f) => f.id === folderId);
  if (index === -1) return null;

  const newTabs = tabs.map((tab) => ({
    t: tab.title || "",
    u: tab.url || "",
    f: tab.favIconUrl || "",
  }));

  folders[index].tabs = [...folders[index].tabs, ...newTabs];
  await saveFolders();
  return folders[index];
}

/**
 * Deletes a folder
 * @param {string} folderId - ID of folder to delete
 * @returns {Promise<boolean>}
 */
async function deleteFolder(folderId) {
  const index = folders.findIndex((f) => f.id === folderId);
  if (index === -1) return false;

  folders.splice(index, 1);
  await saveFolders();
  return true;
}

/**
 * Converts a Chrome tab to our compact tab format
 * @param {chrome.tabs.Tab} chromeTab
 * @returns {Tab}
 */
function chromeTabToCompactTab(chromeTab) {
  return {
    t: chromeTab.title || "",
    u: chromeTab.url || "",
    f: chromeTab.favIconUrl || "",
  };
}

/**
 * Converts our compact tab format back to a more readable format
 * @param {Tab} compactTab
 * @returns {Object}
 */
function compactTabToReadable(compactTab) {
  return {
    title: compactTab.t || "",
    url: compactTab.u || "",
    favIconUrl: compactTab.f || "",
  };
}

// Helper functions
function showSnackbar(message) {
  // Remove any existing show class first
  snackbar.classList.remove("show");

  // Force a reflow to restart animation
  void snackbar.offsetWidth;

  // Update message and show
  snackbar.textContent = message;
  snackbar.classList.add("show");

  // Remove show class after animation
  setTimeout(() => {
    snackbar.classList.remove("show");
  }, 3000);
}

/**
 * Extracts domain from a URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Extracted domain
 */
function extractDomain(url) {
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
async function copyToClipboard(text) {
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
 * Processes tabs based on user settings
 * @param {Tab[]} tabs - Tabs to process
 * @returns {Tab[]} - Processed tabs
 */
function processTabs(tabs) {
  if (!tabs || tabs.length === 0) return [];

  let processedTabs = [...tabs];

  // Sort by position (default browser tab order)
  if (sortByPositionToggle.checked) {
    processedTabs.sort((a, b) => a.index - b.index);
  }

  // Group by domain if enabled
  if (groupByDomainToggle.checked) {
    // Group tabs by domain
    const domainGroups = {};

    processedTabs.forEach((tab) => {
      const domain = extractDomain(tab.url);
      if (!domainGroups[domain]) {
        domainGroups[domain] = [];
      }
      domainGroups[domain].push(tab);
    });

    // Flatten grouped tabs
    processedTabs = Object.values(domainGroups).flat();
  }

  return processedTabs;
}

// Format tabs into text based on user preferences
function formatTabs(tabs) {
  if (!tabs || tabs.length === 0) return "";

  const includeTitles = includeTitlesToggle.checked;
  const includeUrls = includeUrlsToggle.checked;
  const useMarkdown = formatMarkdownToggle.checked;

  // If neither title nor URL is selected, default to including URLs
  if (!includeTitles && !includeUrls) {
    includeUrlsToggle.checked = true;
  }

  // Get the appropriate template
  const template = useMarkdown
    ? formatTemplateInput.value || "- [{{title}}]({{url}})"
    : plainTextTemplateInput.value || "{{title}} - {{url}}";

  // Process tabs according to settings
  const processedTabs = processTabs(tabs);

  // Format with domain headers if grouping by domain
  if (groupByDomainToggle.checked) {
    let result = "";
    let currentDomain = null;
    let domainTabIndex = 0; // Index counter within each domain

    processedTabs.forEach((tab, globalIndex) => {
      const domain = extractDomain(tab.url);

      // Add domain header if it's a new domain
      if (domain !== currentDomain) {
        if (currentDomain !== null) {
          result += "\n\n";
        }

        result += useMarkdown ? `## ${domain}\n\n` : `${domain}\n\n`;
        currentDomain = domain;
        domainTabIndex = 0; // Reset counter for new domain
      }

      // Format tab
      let tabText = template;

      // Replace placeholders
      if (includeTitles) {
        tabText = tabText.replace(/{{title}}/g, tab.title || "");
      } else {
        tabText = tabText.replace(/{{title}}/g, "");
      }

      if (includeUrls) {
        tabText = tabText.replace(/{{url}}/g, tab.url || "");
      } else {
        tabText = tabText.replace(/{{url}}/g, "");
      }

      // Add index support
      tabText = tabText.replace(/{{@index}}/g, globalIndex + 1);
      tabText = tabText.replace(/{{@domainIndex}}/g, domainTabIndex + 1);

      // Clean up any artifacts from the template if a field was omitted
      tabText = tabText.replace(/\[\]/g, "");
      tabText = tabText.replace(/\(\)/g, "");
      tabText = tabText.replace(/ - $/g, "");
      tabText = tabText.replace(/^ - /g, "");
      tabText = tabText.replace(/ +/g, " ");

      result += tabText + "\n";
      domainTabIndex++; // Increment domain-specific counter
    });

    return result;
  } else {
    // Regular formatting without domains
    return processedTabs
      .map((tab, index) => {
        let result = template;

        if (includeTitles) {
          result = result.replace(/{{title}}/g, tab.title || "");
        } else {
          result = result.replace(/{{title}}/g, "");
        }

        if (includeUrls) {
          result = result.replace(/{{url}}/g, tab.url || "");
        } else {
          result = result.replace(/{{url}}/g, "");
        }

        // Add index support
        result = result.replace(/{{@index}}/g, index + 1);

        // Clean up any artifacts from the template if a field was omitted
        result = result.replace(/\[\]/g, "");
        result = result.replace(/\(\)/g, "");
        result = result.replace(/ - $/g, "");
        result = result.replace(/^ - /g, "");
        result = result.replace(/ +/g, " ");

        return result;
      })
      .join("\n");
  }
}

// Update toggle UI based on selection state
function updateToggleUI() {
  // Update toggle visibility - only show it when there are selected tabs
  const toggleContainer = document.getElementById("previewToggle");
  toggleContainer.style.display = selectedTabs.length > 0 ? "flex" : "none";

  // Update label based on toggle state
  if (showSelectedOnlyToggle.checked) {
    toggleLabel.textContent = "Showing selected";
  } else {
    toggleLabel.textContent = "Show selected";
  }
}

// Update the tab preview area
function updateTabPreview() {
  // Also update the format examples
  updateFormatExamples();

  // Determine which tabs to display - show selected tabs if toggle is on or force flag is set
  const showSelectedTabs =
    (showSelectedOnlyToggle && showSelectedOnlyToggle.checked) ||
    forceShowSelected;
  const tabsToDisplay =
    showSelectedTabs && selectedTabs.length > 0 ? selectedTabs : currentTabs;

  // Update toggle UI
  updateToggleUI();

  // Clear existing preview
  tabPreview.innerHTML = "";

  if (!tabsToDisplay || tabsToDisplay.length === 0) {
    tabPreview.innerHTML =
      "<p style='color: #5d7599; text-align: center;'>No tabs to display</p>";
    return;
  }

  // Process tabs according to settings
  const processedTabs = processTabs(tabsToDisplay);

  // Create a document fragment for efficient DOM updates
  const fragment = document.createDocumentFragment();

  const createTabElement = (tab) => {
    const tabDiv = document.createElement("div");
    tabDiv.style.display = "flex";
    tabDiv.style.alignItems = "center";
    tabDiv.style.marginBottom = "8px";
    tabDiv.style.overflow = "hidden";

    const img = document.createElement("img");
    const defaultFavicon =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16'%3E%3Cpath fill='%235d7599' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z'/%3E%3C/svg%3E";
    img.src = tab.favIconUrl || defaultFavicon;
    img.style.width = "16px";
    img.style.height = "16px";
    img.style.marginRight = "8px";
    img.style.minWidth = "16px";
    img.addEventListener("error", () => {
      img.src = defaultFavicon;
    });

    const titleDiv = document.createElement("div");
    titleDiv.style.flex = "1";
    titleDiv.style.overflow = "hidden";
    titleDiv.style.textOverflow = "ellipsis";
    titleDiv.style.whiteSpace = "nowrap";
    titleDiv.title = tab.title;
    titleDiv.textContent = tab.title;

    tabDiv.appendChild(img);
    tabDiv.appendChild(titleDiv);
    return tabDiv;
  };

  if (groupByDomainToggle.checked) {
    let currentDomain = null;
    processedTabs.forEach((tab) => {
      const domain = extractDomain(tab.url);
      if (domain !== currentDomain) {
        if (currentDomain !== null) {
          const divider = document.createElement("div");
          divider.style.margin = "10px 0 5px 0";
          divider.style.borderTop = "1px solid #5d7599";
          fragment.appendChild(divider);
        }
        const domainHeader = document.createElement("div");
        domainHeader.style.color = "#5d7599";
        domainHeader.style.fontWeight = "bold";
        domainHeader.style.marginBottom = "5px";
        domainHeader.textContent = domain;
        fragment.appendChild(domainHeader);
        currentDomain = domain;
      }
      fragment.appendChild(createTabElement(tab));
    });
  } else {
    processedTabs.forEach((tab) => {
      fragment.appendChild(createTabElement(tab));
    });
  }

  // Add counter info
  const totalCount = currentTabs.length;
  const selectedCount = selectedTabs.length;
  const counterDiv = document.createElement("div");
  counterDiv.style.color = "#5d7599";
  counterDiv.style.marginBottom = "10px";
  counterDiv.style.fontSize = "12px";
  counterDiv.style.textAlign = "center";

  if (showSelectedTabs && selectedCount > 0) {
    counterDiv.textContent = `Showing ${selectedCount} selected tab${
      selectedCount > 1 ? "s" : ""
    } (of ${totalCount} total)`;
  } else {
    counterDiv.textContent = `Showing all ${totalCount} tab${
      totalCount > 1 ? "s" : ""
    }${selectedCount > 0 ? " (" + selectedCount + " selected)" : ""}`;
  }
  // Prepend the counter to the fragment
  fragment.prepend(counterDiv);

  // Append the fragment to the DOM
  tabPreview.appendChild(fragment);
}

// Update the format example previews
function updateFormatExamples() {
  const formatExample = document.getElementById("formatExample");
  const plainTextExample = document.getElementById("plainTextExample");

  if (
    !formatExample ||
    !plainTextExample ||
    !currentTabs ||
    currentTabs.length === 0
  ) {
    return;
  }

  // Get the first tab for simple examples
  const exampleTab = currentTabs[0];
  if (!exampleTab) return;

  // Get templates
  const markdownTemplate = document.getElementById("formatTemplate").value;
  const plainTextTemplate = document.getElementById("plainTextTemplate").value;

  // Format examples
  let markdownExample = markdownTemplate;
  markdownExample = markdownExample.replace(
    /{{title}}/g,
    exampleTab.title || ""
  );
  markdownExample = markdownExample.replace(/{{url}}/g, exampleTab.url || "");
  markdownExample = markdownExample.replace(/{{@index}}/g, 1);
  markdownExample = markdownExample.replace(/{{@domainIndex}}/g, 1);

  let plainTextExampleText = plainTextTemplate;
  plainTextExampleText = plainTextExampleText.replace(
    /{{title}}/g,
    exampleTab.title || ""
  );
  plainTextExampleText = plainTextExampleText.replace(
    /{{url}}/g,
    exampleTab.url || ""
  );
  plainTextExampleText = plainTextExampleText.replace(/{{@index}}/g, 1);
  plainTextExampleText = plainTextExampleText.replace(/{{@domainIndex}}/g, 1);

  // Update display
  formatExample.textContent = "Example: " + markdownExample;
  plainTextExample.textContent = "Example: " + plainTextExampleText;
}

// Check for selected tabs and update preview
function checkSelectedTabs() {
  chrome.tabs.query(
    { currentWindow: true, highlighted: true },
    function (tabs) {
      selectedTabs = tabs;
      updateTabPreview();
    }
  );
}

// Add code to toggle template visibility based on formatMarkdown checkbox
function updateTemplateVisibility() {
  const isMarkdown = formatMarkdownToggle.checked;
  const markdownContainer = document.getElementById(
    "markdownTemplateContainer"
  );
  const plainTextContainer = document.getElementById(
    "plainTextTemplateContainer"
  );

  if (isMarkdown) {
    markdownContainer.style.display = "block";
    plainTextContainer.style.display = "none";
  } else {
    markdownContainer.style.display = "none";
    plainTextContainer.style.display = "block";
  }
}

// Initialize event listeners
document.addEventListener("DOMContentLoaded", async function () {
  await initFolderUI();

  // Settings menu navigation
  const settingsIcon = document.querySelector(".settings-icon");
  const settingsMenu = document.querySelector(".settings-menu");
  const closeSettingsBtn = document.querySelector(".close-btn");
  const mainSettingsLinks = document.getElementById("mainSettingsLinks");
  const privacyPolicyContent = document.getElementById("privacyPolicyContent");
  const termsContent = document.getElementById("termsContent");
  const privacyPolicyBtn = document.getElementById("privacyPolicyBtn");
  const termsBtn = document.getElementById("termsBtn");
  const backBtns = document.querySelectorAll(".back-btn");
  const mainSettingsHeader = document.getElementById("mainSettingsHeader");

  // Open settings menu
  if (settingsIcon && settingsMenu) {
    settingsIcon.addEventListener("click", () => {
      // Hide main content
      document
        .querySelectorAll("body > *:not(.settings-menu):not(#snackbar)")
        .forEach((el) => {
          el.style.display = "none";
        });
      // Show settings menu
      settingsMenu.classList.add("show");
      showMainSettings();
    });
  }

  // Close settings menu
  if (closeSettingsBtn && settingsMenu) {
    closeSettingsBtn.addEventListener("click", () => {
      // Hide settings menu
      settingsMenu.classList.remove("show");
      // Show main content again
      document
        .querySelectorAll("body > *:not(.settings-menu):not(#snackbar)")
        .forEach((el) => {
          el.style.display = "";
        });
    });
  }

  // Show privacy policy
  if (
    privacyPolicyBtn &&
    privacyPolicyContent &&
    mainSettingsLinks &&
    mainSettingsHeader
  ) {
    privacyPolicyBtn.addEventListener("click", () => {
      mainSettingsLinks.style.display = "none";
      mainSettingsHeader.style.display = "none";
      privacyPolicyContent.style.display = "block";
      if (termsContent) termsContent.style.display = "none";
    });
  }

  // Show terms of service
  if (termsBtn && termsContent && mainSettingsLinks && mainSettingsHeader) {
    termsBtn.addEventListener("click", () => {
      mainSettingsLinks.style.display = "none";
      mainSettingsHeader.style.display = "none";
      if (privacyPolicyContent) privacyPolicyContent.style.display = "none";
      termsContent.style.display = "block";
    });
  }

  // Back button functionality
  function showMainSettings() {
    if (mainSettingsLinks) mainSettingsLinks.style.display = "block";
    if (mainSettingsHeader) mainSettingsHeader.style.display = "flex";
    if (privacyPolicyContent) privacyPolicyContent.style.display = "none";
    if (termsContent) termsContent.style.display = "none";
  }

  backBtns.forEach((btn) => {
    btn.addEventListener("click", showMainSettings);
  });

  // Load all tabs and selected tabs when popup opens
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    currentTabs = tabs;

    // Now check for selected tabs
    checkSelectedTabs();
  });

  // Add a message listener for tab selection changes while popup is open
  chrome.runtime.onMessage.addListener(function (message) {
    if (message.action === "tabsSelected") {
      checkSelectedTabs();
    }
  });

  // Add tooltips to the template inputs
  addPlaceholderTooltips();

  // Set up template example dropdown handlers
  setupTemplateExamples();

  // Initialize template visibility based on current state
  updateTemplateVisibility();

  // Toggle button for showing selected tabs only
  if (showSelectedOnlyToggle) {
    showSelectedOnlyToggle.addEventListener("change", function () {
      updateTabPreview();
    });
  }

  // Format toggles and template inputs - update preview when changed
  [
    includeTitlesToggle,
    includeUrlsToggle,
    sortByPositionToggle,
    groupByDomainToggle,
  ].forEach((element) => {
    element.addEventListener("change", updateTabPreview);
  });

  // Handle formatMarkdown toggle separately since it needs to update visibility too
  formatMarkdownToggle.addEventListener("change", function () {
    updateTemplateVisibility();
    updateTabPreview();
    updateFormatExamples();
  });

  // Template inputs - live preview
  formatTemplateInput.addEventListener("input", function () {
    updateTabPreview();
    updateFormatExamples();
  });

  plainTextTemplateInput.addEventListener("input", function () {
    updateTabPreview();
    updateFormatExamples();
  });

  // Reset button
  resetBtn.addEventListener("click", function () {
    // Reset to defaults
    includeTitlesToggle.checked = true;
    includeUrlsToggle.checked = true;
    formatMarkdownToggle.checked = true;
    formatTemplateInput.value = "- [{{title}}]({{url}})";
    plainTextTemplateInput.value = "{{title}} - {{url}}";
    sortByPositionToggle.checked = true;
    groupByDomainToggle.checked = false;
    if (showSelectedOnlyToggle) showSelectedOnlyToggle.checked = false;
    forceShowSelected = false;
    showSnackbar("Settings reset to defaults");
    updateTabPreview();
  });

  // Copy all tabs button
  copyAllTabsBtn.addEventListener("click", async function () {
    try {
      chrome.tabs.query({ currentWindow: true }, async function (tabs) {
        currentTabs = tabs;
        // Ensure we're showing all tabs after copying all
        if (showSelectedOnlyToggle) showSelectedOnlyToggle.checked = false;
        forceShowSelected = false;
        updateTabPreview();

        const formattedText = formatTabs(tabs);

        if (!formattedText) {
          showSnackbar("No tabs to copy");
          return;
        }

        const copied = await copyToClipboard(formattedText);

        if (copied) {
          showSnackbar(`Copied ${tabs.length} tabs to clipboard!`);
          copyAllTabsBtn.textContent = "Copied!";
          setTimeout(() => {
            copyAllTabsBtn.textContent = "Copy All Tabs";
          }, 2000);
        } else {
          showSnackbar("Failed to copy to clipboard");
        }
      });
    } catch (error) {
      console.error("Error copying tabs:", error);
      showSnackbar("Error copying tabs");
    }
  });

  // Copy selected tabs button
  copySelectedTabsBtn.addEventListener("click", async function () {
    try {
      chrome.tabs.query(
        { currentWindow: true, highlighted: true },
        async function (tabs) {
          if (!tabs || tabs.length === 0) {
            showSnackbar("No tabs selected");
            return;
          }

          // Update selected tabs
          selectedTabs = tabs;

          // Force show selected tabs
          if (showSelectedOnlyToggle) showSelectedOnlyToggle.checked = true;
          forceShowSelected = true;
          updateTabPreview();

          const formattedText = formatTabs(tabs);
          const copied = await copyToClipboard(formattedText);

          if (copied) {
            showSnackbar(`Copied ${tabs.length} selected tab(s) to clipboard!`);
            copySelectedTabsBtn.textContent = "Copied!";
            setTimeout(() => {
              copySelectedTabsBtn.textContent = "Copy Selected Tabs";
            }, 2000);
          } else {
            showSnackbar("Failed to copy to clipboard");
          }
        }
      );
    } catch (error) {
      console.error("Error copying selected tabs:", error);
      showSnackbar("Error copying selected tabs");
    }
  });

  // Share folder form submission
  const shareFolderForm = document.getElementById("shareFolderForm");
  shareFolderForm.addEventListener("submit", handleShareFolder);

  // Copy share link button
  const copyShareLinkBtn = document.getElementById("copyShareLink");
  copyShareLinkBtn.addEventListener("click", copyShareLink);

  // Copy original link button
  const copyOriginalLinkBtn = document.getElementById("copyOriginalLink");
  copyOriginalLinkBtn.addEventListener("click", copyOriginalLink);

  // Password toggle setup
  const togglePasswordBtn = document.getElementById("togglePassword");
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", togglePasswordVisibility);
  }

  // Modal close buttons
  const closeCreateFolderBtn = document.getElementById(
    "closeCreateFolderModal"
  );
  const closeShareFolderBtn = document.getElementById("closeShareFolderModal");
  const createFolderModal = document.getElementById("createFolderModal");
  const shareFolderModal = document.getElementById("shareFolderModal");

  // ... rest of the modal event listeners ...
});

/**
 * Sets up template example dropdown handlers
 */
function setupTemplateExamples() {
  const markdownTemplateExamples = document.getElementById(
    "markdownTemplateExamples"
  );
  const plainTextTemplateExamples = document.getElementById(
    "plainTextTemplateExamples"
  );

  if (markdownTemplateExamples) {
    markdownTemplateExamples.addEventListener("change", function () {
      const selectedValue = this.value;
      if (selectedValue) {
        // Update the template input field
        formatTemplateInput.value = selectedValue;

        // Trigger the input event to update previews
        const event = new Event("input");
        formatTemplateInput.dispatchEvent(event);

        // Keep the selected option visible in the dropdown
      }
    });
  }

  if (plainTextTemplateExamples) {
    plainTextTemplateExamples.addEventListener("change", function () {
      const selectedValue = this.value;
      if (selectedValue) {
        // Update the template input field
        plainTextTemplateInput.value = selectedValue;

        // Trigger the input event to update previews
        const event = new Event("input");
        plainTextTemplateInput.dispatchEvent(event);

        // Keep the selected option visible in the dropdown
      }
    });
  }
}

/**
 * Adds tooltips to template inputs explaining available placeholders
 */
function addPlaceholderTooltips() {
  const tooltipText = `Available placeholders:
• {{title}} - Tab title
• {{url}} - Tab URL
• {{@index}} - Tab number (starts at 1)
• {{@domainIndex}} - Domain-specific numbering`;

  // Add title attribute to the template inputs
  const formatTemplateInput = document.getElementById("formatTemplate");
  const plainTextTemplateInput = document.getElementById("plainTextTemplate");

  if (formatTemplateInput) {
    formatTemplateInput.title = tooltipText;
  }

  if (plainTextTemplateInput) {
    plainTextTemplateInput.title = tooltipText;
  }

  // Also add placeholder information to the template examples dropdowns
  const markdownTemplateExamples = document.getElementById(
    "markdownTemplateExamples"
  );
  const plainTextTemplateExamples = document.getElementById(
    "plainTextTemplateExamples"
  );

  if (markdownTemplateExamples) {
    markdownTemplateExamples.title = "Select a template example";
  }

  if (plainTextTemplateExamples) {
    plainTextTemplateExamples.title = "Select a template example";
  }
}

// ============== ENCRYPTION UTILITIES FOR SHARING ================

/**
 * Compresses a string using LZString compression
 * @param {string} data - String to compress
 * @returns {string} - Compressed string
 */
function compressData(data) {
  // Simple polyfill for LZString
  if (typeof LZString === "undefined") {
    // This is a simplified version of LZString for compression
    return btoa(data);
  }
  return LZString.compressToBase64(data);
}

/**
 * Converts a string to Uint8Array
 * @param {string} str - String to convert
 * @returns {Uint8Array}
 */
function stringToUint8Array(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Converts a Uint8Array to string
 * @param {Uint8Array} array - Array to convert
 * @returns {string}
 */
function uint8ArrayToString(array) {
  const decoder = new TextDecoder();
  return decoder.decode(array);
}

/**
 * Converts a Uint8Array to Base64Url string (URL-safe base64)
 * @param {Uint8Array} array - Array to convert
 * @returns {string} - Base64Url encoded string
 */
function uint8ArrayToBase64Url(array) {
  // First convert to regular base64
  let binaryString = "";
  const len = array.byteLength;
  for (let i = 0; i < len; i++) {
    binaryString += String.fromCharCode(array[i]);
  }
  const base64 = btoa(binaryString);

  // Then make it URL-safe by replacing + with - and / with _
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Converts a Base64Url string to Uint8Array
 * @param {string} base64url - Base64Url encoded string
 * @returns {Uint8Array}
 */
function base64UrlToUint8Array(base64url) {
  // Convert URL-safe base64 to regular base64
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");

  // Decode base64 to binary string
  const binaryString = atob(base64);

  // Convert to Uint8Array
  const len = binaryString.length;
  const array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    array[i] = binaryString.charCodeAt(i);
  }

  return array;
}

/**
 * Derives a cryptographic key from a password
 * @param {string} password - User-provided password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt) {
  // Convert password to key material
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import as raw key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive actual key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data with a password
 * @param {string} data - Data to encrypt
 * @param {string} password - Password for encryption
 * @returns {Promise<{v: number, s: string, i: string, d: string}>} - Encrypted payload
 */
async function encryptData(data, password) {
  // Generate random salt and iv
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from password
  const key = await deriveKey(password, salt);

  // Compress the data before encryption
  const compressedData = compressData(data);
  const dataBuffer = stringToUint8Array(compressedData);

  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    dataBuffer
  );

  // Convert to Uint8Array
  const encryptedArray = new Uint8Array(encryptedBuffer);

  // Package everything together
  return {
    v: 1, // Version
    s: uint8ArrayToBase64Url(salt),
    i: uint8ArrayToBase64Url(iv),
    d: uint8ArrayToBase64Url(encryptedArray),
  };
}

/**
 * Creates a shareable URL for a folder
 * @param {Folder} folder - Folder to share
 * @param {string} password - Password for encryption
 * @returns {Promise<string>} - Shareable URL
 */
async function createShareableUrl(folder, password) {
  // Convert folder to JSON string
  const folderData = JSON.stringify(folder);

  // Encrypt the data
  const encrypted = await encryptData(folderData, password);

  // Convert the encrypted payload to JSON and then to base64url
  const payload = JSON.stringify(encrypted);
  const payloadBase64 = btoa(payload)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Create the shareable URL using the external share.html page
  return `https://danials.space/share.html#data=${payloadBase64}`;
}

// ============== FOLDER UI IMPLEMENTATION ================

// DOM elements for folder UI
const folderList = document.getElementById("folderList");
const createFolderBtn = document.getElementById("createFolderBtn");
const saveToFolderBtn = document.getElementById("saveToFolderBtn");
const createFolderModal = document.getElementById("createFolderModal");
const closeCreateFolderModal = document.getElementById(
  "closeCreateFolderModal"
);
const createFolderForm = document.getElementById("createFolderForm");
const folderNameInput = document.getElementById("folderName");
const addAllTabsToggle = document.getElementById("addAllTabs");
const addSelectedTabsToggle = document.getElementById("addSelectedTabs");
const shareFolderModal = document.getElementById("shareFolderModal");
const closeShareFolderModal = document.getElementById("closeShareFolderModal");
const shareFolderForm = document.getElementById("shareFolderForm");
const shareFolderIdInput = document.getElementById("shareFolderId");
const sharePasswordInput = document.getElementById("sharePassword");
const togglePasswordBtn = document.getElementById("togglePassword");
const shareResult = document.getElementById("shareResult");
const shareLinkInput = document.getElementById("shareLink");
const copyShareLinkBtn = document.getElementById("copyShareLink");
const originalLinkInput = document.getElementById("originalLink");
const copyOriginalLinkBtn = document.getElementById("copyOriginalLink");
const qrcodeDiv = document.getElementById("qrcode");
const shareStatsDiv = document.getElementById("shareStats");

/**
 * Initializes the folder management UI
 */
async function initFolderUI() {
  // Load folders from storage
  await loadFolders();

  // Render folder list
  renderFolderList();

  // Set up event listeners
  createFolderBtn.addEventListener("click", showCreateFolderModal);
  closeCreateFolderModal.addEventListener("click", hideCreateFolderModal);
  createFolderForm.addEventListener("submit", handleCreateFolder);
  saveToFolderBtn.addEventListener("click", showSaveToFolderModal);
  closeShareFolderModal.addEventListener("click", hideShareFolderModal);
  shareFolderForm.addEventListener("submit", handleShareFolder);
  togglePasswordBtn.addEventListener("click", togglePasswordVisibility);
  copyShareLinkBtn.addEventListener("click", copyShareLink);
  copyOriginalLinkBtn.addEventListener("click", copyOriginalLink);

  // Close modals when clicking outside
  createFolderModal.addEventListener("click", (e) => {
    if (e.target === createFolderModal) {
      hideCreateFolderModal();
    }
  });

  shareFolderModal.addEventListener("click", (e) => {
    if (e.target === shareFolderModal) {
      hideShareFolderModal();
    }
  });

  // Make add tab toggles mutually exclusive
  addAllTabsToggle.addEventListener("change", () => {
    if (addAllTabsToggle.checked) {
      addSelectedTabsToggle.checked = false;
    }
  });

  addSelectedTabsToggle.addEventListener("change", () => {
    if (addSelectedTabsToggle.checked) {
      addAllTabsToggle.checked = false;
    }
  });
}

/**
 * Renders the folder list in the UI
 */
function renderFolderList() {
  folderList.innerHTML = "";

  if (folders.length === 0) {
    folderList.innerHTML = `<div style="text-align: center; padding: 20px; color: #999;">
      No folders yet. Create one to save tabs.
    </div>`;
    return;
  }

  // Sort folders by creation date (newest first)
  const sortedFolders = [...folders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  sortedFolders.forEach((folder) => {
    const folderElement = document.createElement("div");
    folderElement.className = "folder-item";
    folderElement.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="margin-right: 8px; min-width: 16px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        </div>
        <div class="folder-name">${folder.name}</div>
      </div>
      <div class="folder-tabs-count">${folder.tabs.length} tab${
      folder.tabs.length !== 1 ? "s" : ""
    }</div>
      <div class="folder-actions">
        <button class="folder-action" title="Preview tabs" data-action="preview" data-id="${
          folder.id
        }">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </button>
        <button class="folder-action" title="Copy to clipboard" data-action="copy" data-id="${
          folder.id
        }">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        </button>
        <button class="folder-action share-action" title="Share folder" data-action="share" data-id="${
          folder.id
        }">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
        </button>
        <button class="folder-action delete-action" title="Delete folder" data-action="delete" data-id="${
          folder.id
        }">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    `;

    folderList.appendChild(folderElement);

    // Add event listeners for folder actions
    const actionButtons = folderElement.querySelectorAll("[data-action]");
    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.getAttribute("data-action");
        const folderId = button.getAttribute("data-id");

        switch (action) {
          case "preview":
            previewFolder(folderId);
            break;
          case "copy":
            copyFolderToClipboard(folderId);
            break;
          case "share":
            showShareFolderModal(folderId);
            break;
          case "delete":
            confirmDeleteFolder(folderId);
            break;
        }
      });
    });
  });
}

/**
 * Shows the create folder modal
 */
function showCreateFolderModal() {
  createFolderModal.style.display = "flex";
  folderNameInput.focus();

  // Default to adding selected tabs if any are selected
  addSelectedTabsToggle.checked = selectedTabs.length > 0;
  addAllTabsToggle.checked = selectedTabs.length === 0;
}

/**
 * Hides the create folder modal
 */
function hideCreateFolderModal() {
  createFolderModal.style.display = "none";
  createFolderForm.reset();
}

/**
 * Shows the save to folder modal (to be implemented)
 */
function showSaveToFolderModal() {
  if (selectedTabs.length === 0) {
    showSnackbar("Please select at least one tab first");
    return;
  }

  // For simplicity, we'll just show the create folder modal
  // with selected tabs option checked
  showCreateFolderModal();
  addSelectedTabsToggle.checked = true;
  addAllTabsToggle.checked = false;
}

/**
 * Handles folder creation
 * @param {Event} e - Form submit event
 */
async function handleCreateFolder(e) {
  e.preventDefault();

  const name = folderNameInput.value.trim();
  if (!name) return;

  let tabsToAdd = [];

  if (addAllTabsToggle.checked) {
    // Add all tabs
    tabsToAdd = [...currentTabs];
  } else if (addSelectedTabsToggle.checked) {
    // Add selected tabs
    tabsToAdd = selectedTabs;
  }

  await createFolder(name, tabsToAdd);
  renderFolderList();
  hideCreateFolderModal();

  showSnackbar(`Folder "${name}" created with ${tabsToAdd.length} tabs`);
}

/**
 * Shows a confirmation dialog for folder deletion
 * @param {string} folderId - ID of folder to delete
 */
async function confirmDeleteFolder(folderId) {
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return;

  if (
    confirm(`Delete folder "${folder.name}" with ${folder.tabs.length} tabs?`)
  ) {
    await deleteFolder(folderId);
    renderFolderList();
    showSnackbar(`Folder "${folder.name}" deleted`);
  }
}

/**
 * Exits the current folder preview if one exists
 */
function exitFolderPreview() {
  if (currentPreviewRestoreButton) {
    // Simulate clicking the exit button
    currentPreviewRestoreButton.click();
    currentPreviewRestoreButton = null;
    return true;
  }
  return false;
}

/**
 * Previews a folder's tabs in the tab preview area
 * @param {string} folderId - ID of folder to preview
 */
function previewFolder(folderId) {
  // First exit any existing preview
  exitFolderPreview();

  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return;

  // Convert compact tabs to format expected by preview function
  const previewTabs = folder.tabs.map((tab) => compactTabToReadable(tab));

  // Save current tabs temporarily
  const originalTabs = currentTabs;
  const originalSelectedTabs = selectedTabs;

  // Replace with folder tabs for preview
  currentTabs = previewTabs;
  selectedTabs = previewTabs;
  forceShowSelected = true;

  // Update the preview
  updateTabPreview();

  showSnackbar(`Previewing folder "${folder.name}"`);

  // Add a button to restore the original tabs
  const restoreButton = document.createElement("button");
  restoreButton.textContent = "Exit Folder Preview";
  restoreButton.className = "generate-btn";
  restoreButton.style.backgroundColor = "#e74c3c";
  restoreButton.style.marginTop = "10px";

  const parent = tabPreview.parentElement;
  parent.insertBefore(restoreButton, tabPreview.nextSibling);

  // Store the current restore button for future reference
  currentPreviewRestoreButton = restoreButton;

  restoreButton.addEventListener("click", () => {
    // Restore original tabs
    currentTabs = originalTabs;
    selectedTabs = originalSelectedTabs;
    forceShowSelected = false;
    updateTabPreview();
    restoreButton.remove();
    currentPreviewRestoreButton = null; // Clear the reference
    showSnackbar("Returned to current tabs");
  });
}

/**
 * Copies a folder's tabs to clipboard
 * @param {string} folderId - ID of folder to copy
 */
async function copyFolderToClipboard(folderId) {
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return;

  // Convert compact tabs to format expected by formatTabs
  const formattedTabs = folder.tabs.map((tab) => compactTabToReadable(tab));

  // Format the tabs
  const tabText = formatTabs(formattedTabs);

  // Copy to clipboard
  const success = await copyToClipboard(tabText);

  if (success) {
    showSnackbar(
      `Copied ${folder.tabs.length} tabs from "${folder.name}" to clipboard`
    );
  } else {
    showSnackbar("Failed to copy to clipboard");
  }
}

/**
 * Shows the share folder modal
 * @param {string} folderId - ID of folder to share
 */
function showShareFolderModal(folderId) {
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return;

  shareFolderModal.style.display = "flex";
  shareFolderIdInput.value = folderId;
  sharePasswordInput.focus();

  // Hide the share result initially
  shareResult.style.display = "none";
}

/**
 * Hides the share folder modal
 */
function hideShareFolderModal() {
  shareFolderModal.style.display = "none";
  shareFolderForm.reset();
  shareResult.style.display = "none";

  // Clear any previous QR code
  qrcodeDiv.innerHTML = "";
}

/**
 * Toggles password visibility
 */
function togglePasswordVisibility() {
  const passwordInput = document.getElementById("sharePassword");
  const toggleBtn = document.getElementById("togglePassword");

  if (!passwordInput || !toggleBtn) return;

  const svg = toggleBtn.querySelector("svg");
  const path = svg ? svg.querySelector("path") : null;

  if (!path) return;

  const eyeVisiblePath =
    "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";
  const eyeHiddenPath =
    "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z";

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    path.setAttribute("d", eyeHiddenPath); // Set to hidden eye icon (because password is now visible)
    toggleBtn.title = "Hide password";
  } else {
    passwordInput.type = "password";
    path.setAttribute("d", eyeVisiblePath); // Set to visible eye icon (because password is now hidden)
    toggleBtn.title = "Show password";
  }
}

/**
 * Shortens a URL using the Sorame URL shortening service
 * @param {string} url - URL to shorten
 * @returns {Promise<string>} - Shortened URL or original URL if shortening fails
 */
async function shortenUrl(url) {
  try {
    const response = await fetch("https://sorame.danials.space/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: url }),
    });

    if (!response.ok) {
      throw new Error("Failed to shorten URL");
    }

    const data = await response.json();
    return `https://sorame.danials.space/link/${data.share_id}`;
  } catch (error) {
    console.error("Error shortening URL:", error);
    return url; // Return original URL if shortening fails
  }
}

/**
 * Handles folder sharing form submission
 * @param {Event} e - Form submit event
 */
async function handleShareFolder(e) {
  e.preventDefault();

  const folderId = document.getElementById("shareFolderId").value;
  const password = document.getElementById("sharePassword").value;

  if (!password) {
    showSnackbar("Please enter a password");
    return;
  }

  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return;

  try {
    const shareableUrl = await createShareableUrl(folder, password);
    const shortenedUrl = await shortenUrl(shareableUrl);

    // Remove password field, submit button and label
    const shareFolderForm = document.getElementById("shareFolderForm");
    if (shareFolderForm) {
      shareFolderForm.remove();
    }

    // Update UI with shortened URL
    const shareLinkInput = document.getElementById("shareLink");
    shareLinkInput.value = shortenedUrl;

    // Update original link input
    const originalLinkInput = document.getElementById("originalLink");
    originalLinkInput.value = shareableUrl;

    // Show share result section
    const shareResult = document.getElementById("shareResult");
    shareResult.style.display = "block";

    // Generate QR code
    const qrcodeContainer = document.getElementById("qrcode");
    qrcodeContainer.innerHTML = ""; // Clear existing QR code

    try {
      // Create QR code instance
      const qr = qrcode(0, "M");
      qr.addData(shortenedUrl);
      qr.make();

      // Create QR code image
      const qrImage = qr.createImgTag(5);
      qrcodeContainer.innerHTML = qrImage;
    } catch (qrError) {
      console.error("Error generating QR code:", qrError);
      qrcodeContainer.innerHTML =
        '<div style="color: #ff4757; text-align: center;">Failed to generate QR code</div>';
    }

    // Update stats
    const shareStats = document.getElementById("shareStats");
    const folderSize = new TextEncoder().encode(JSON.stringify(folder)).length;
    shareStats.textContent = `Folder size: ${formatSize(folderSize)}`;
  } catch (error) {
    console.error("Error sharing folder:", error);
    showSnackbar("Error generating shareable link");
  }
}

/**
 * Copies the shortened share link to clipboard
 */
async function copyShareLink() {
  const shareLinkInput = document.getElementById("shareLink");
  const shareLink = shareLinkInput.value;

  try {
    await copyToClipboard(shareLink);
    showSnackbar("Link copied to clipboard!");
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    showSnackbar("Failed to copy link");
  }
}

/**
 * Copies the original (unshortened) share link to clipboard
 */
async function copyOriginalLink() {
  const originalLinkInput = document.getElementById("originalLink");
  const originalLink = originalLinkInput.value;

  try {
    await copyToClipboard(originalLink);
    showSnackbar("Link copied to clipboard!");
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    showSnackbar("Failed to copy link");
  }
}

// Initialize folder UI when the popup is loaded
document.addEventListener("DOMContentLoaded", async () => {
  await initFolderUI();

  // Add event listeners for share functionality
  const shareFolderForm = document.getElementById("shareFolderForm");
  if (shareFolderForm) {
    shareFolderForm.addEventListener("submit", handleShareFolder);
  }

  const copyShareLinkBtn = document.getElementById("copyShareLink");
  if (copyShareLinkBtn) {
    copyShareLinkBtn.addEventListener("click", copyShareLink);
  }

  const copyOriginalLinkBtn = document.getElementById("copyOriginalLink");
  if (copyOriginalLinkBtn) {
    copyOriginalLinkBtn.addEventListener("click", copyOriginalLink);
  }

  // Use the proper togglePasswordVisibility function for the password toggle
  const togglePasswordBtn = document.getElementById("togglePassword");
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", togglePasswordVisibility);
  }
});

/**
 * Formats a size in bytes to a human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
