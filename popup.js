// Get DOM elements
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

// Global tabs state
let currentTabs = [];
let selectedTabs = [];
let forceShowSelected = false;

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

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

// Clipboard operations
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

// Process tabs based on settings
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

  if (!tabsToDisplay || tabsToDisplay.length === 0) {
    tabPreview.innerHTML =
      "<p style='color: #5d7599; text-align: center;'>No tabs to display</p>";
    return;
  }

  // Process tabs according to settings
  const processedTabs = processTabs(tabsToDisplay);

  // Generate preview HTML
  let previewHTML = "";

  if (groupByDomainToggle.checked) {
    let currentDomain = null;

    processedTabs.forEach((tab) => {
      const domain = extractDomain(tab.url);

      // Add domain header if it's a new domain
      if (domain !== currentDomain) {
        if (currentDomain !== null) {
          previewHTML +=
            "<div style='margin: 10px 0 5px 0; border-top: 1px solid #5d7599;'></div>";
        }

        previewHTML += `<div style='color: #5d7599; font-weight: bold; margin-bottom: 5px;'>${domain}</div>`;
        currentDomain = domain;
      }

      // Add tab preview
      previewHTML += `
        <div style="display: flex; align-items: center; margin-bottom: 8px; overflow: hidden;">
          <img src="${
            tab.favIconUrl || "icons/favicon.png"
          }" style="width: 16px; height: 16px; margin-right: 8px;">
          <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${
            tab.title
          }">
            ${tab.title}
          </div>
        </div>
      `;
    });
  } else {
    // Regular preview without domains
    previewHTML = processedTabs
      .map((tab) => {
        return `
        <div style="display: flex; align-items: center; margin-bottom: 8px; overflow: hidden;">
          <img src="${
            tab.favIconUrl || "icons/favicon.png"
          }" style="width: 16px; height: 16px; margin-right: 8px;">
          <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${
            tab.title
          }">
            ${tab.title}
          </div>
        </div>
      `;
      })
      .join("");
  }

  tabPreview.innerHTML = previewHTML;

  // Add counter info
  const totalCount = currentTabs.length;
  const selectedCount = selectedTabs.length;

  // Add different message based on what's being shown
  if (showSelectedTabs && selectedCount > 0) {
    tabPreview.insertAdjacentHTML(
      "afterbegin",
      `<div style="color: #5d7599; margin-bottom: 10px; font-size: 12px; text-align: center;">
        Showing ${selectedCount} selected tab${
        selectedCount > 1 ? "s" : ""
      } (of ${totalCount} total)
      </div>`
    );
  } else {
    tabPreview.insertAdjacentHTML(
      "afterbegin",
      `<div style="color: #5d7599; margin-bottom: 10px; font-size: 12px; text-align: center;">
        Showing all ${totalCount} tab${totalCount > 1 ? "s" : ""}${
        selectedCount > 0 ? " (" + selectedCount + " selected)" : ""
      }
      </div>`
    );
  }
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

  // Settings menu toggle
  settingsIcon.addEventListener("click", function () {
    // Hide main content to fix scrolling issues
    document.body.style.overflow = "hidden";
    document
      .querySelectorAll("body > *:not(.settings-menu)")
      .forEach((element) => {
        element.style.display = "none";
      });
    // Show settings menu
    settingsMenu.classList.add("show");
  });

  closeSettingsBtn.addEventListener("click", function () {
    // Hide settings menu
    settingsMenu.classList.remove("show");
    // Restore main content
    document.body.style.overflow = "auto";
    document
      .querySelectorAll("body > *:not(.settings-menu)")
      .forEach((element) => {
        if (element.id !== "snackbar") {
          // Keep snackbar hidden unless active
          element.style.display = "";
        }
      });
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
});

// Set up template example dropdown handlers
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

// Add tooltips to template inputs explaining available placeholders
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
