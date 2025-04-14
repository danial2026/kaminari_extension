/**
 * format-manager.js - Handles custom formats for tab exports
 */

import {
  saveToStorage,
  loadFromStorage,
  showModal,
  hideModal,
  createElement,
  showSnackbar,
  generateUniqueId,
  handleDropdownChange,
  createDeleteButton,
} from "./utils.js";

// Store custom formats
let customMarkdownFormats = [];
let customPlainTextFormats = [];

// DOM element references
let formatTemplateDropdown;
let plainTextTemplateDropdown;
let formatTemplateInput;
let plainTextTemplateInput;
let formatMarkdownToggle;

/**
 * Initialize format manager
 * @param {Object} elements - DOM elements
 */
export function init(elements) {
  formatTemplateDropdown = elements.formatTemplateDropdown;
  plainTextTemplateDropdown = elements.plainTextTemplateDropdown;
  formatTemplateInput = elements.formatTemplateInput;
  plainTextTemplateInput = elements.plainTextTemplateInput;
  formatMarkdownToggle = elements.formatMarkdownToggle;

  // Expose removeFormat to window for use by the deleteButton
  window.removeFormat = removeFormat;

  // Setup format dropdowns
  setupFormatDropdowns();

  // Load saved formats and initialize the dropdowns with saved values
  loadCustomFormats();

  // Log elements
  console.log("Format manager initialized with elements:", {
    markdown: !!formatTemplateDropdown,
    plaintext: !!plainTextTemplateDropdown,
    markdownInput: !!formatTemplateInput,
    plaintextInput: !!plainTextTemplateInput,
    toggle: !!formatMarkdownToggle,
  });
}

/**
 * Setup format dropdown event listeners
 */
function setupFormatDropdowns() {
  // Format template dropdown (Markdown)
  if (formatTemplateDropdown) {
    formatTemplateDropdown.addEventListener("change", () => {
      console.log("Markdown format changed to:", formatTemplateDropdown.value);
      handleDropdownChange(
        formatTemplateDropdown,
        formatTemplateInput,
        "formatTemplate"
      );
    });
  }

  // Plain text template dropdown
  if (plainTextTemplateDropdown) {
    plainTextTemplateDropdown.addEventListener("change", () => {
      console.log(
        "Plaintext format changed to:",
        plainTextTemplateDropdown.value
      );
      handleDropdownChange(
        plainTextTemplateDropdown,
        plainTextTemplateInput,
        "plainTextTemplate"
      );
    });
  }
}

/**
 * Loads custom formats from storage
 * @returns {Promise<void>}
 */
export async function loadCustomFormats() {
  try {
    const keys = [
      "markdownFormats",
      "plainTextFormats",
      "formatTemplate",
      "plainTextTemplate",
    ];

    const result = await loadFromStorage(keys);

    customMarkdownFormats = result.markdownFormats || [];
    customPlainTextFormats = result.plainTextFormats || [];

    // Get saved templates or use defaults
    const savedMarkdownTemplate =
      result.formatTemplate || "[{{title}}]({{url}})";
    const savedPlainTextTemplate =
      result.plainTextTemplate || "{{title}} - {{url}}";

    console.log("Loaded formats and templates:", {
      markdownFormats: customMarkdownFormats,
      plainTextFormats: customPlainTextFormats,
      markdownTemplate: savedMarkdownTemplate,
      plainTextTemplate: savedPlainTextTemplate,
    });

    // Update dropdowns with loaded formats
    updateFormatDropdown(
      formatTemplateDropdown,
      customMarkdownFormats,
      savedMarkdownTemplate
    );
    updateFormatDropdown(
      plainTextTemplateDropdown,
      customPlainTextFormats,
      savedPlainTextTemplate
    );
  } catch (error) {
    console.error("Error loading custom formats:", error);
  }
}

/**
 * Saves custom formats to storage
 * @param {string} key - Storage key
 * @param {Array} formats - Formats to save
 * @returns {Promise<void>}
 */
async function saveCustomFormats(key, formats) {
  return saveToStorage({ [key]: formats });
}

/**
 * Updates a format dropdown with custom formats
 * @param {HTMLSelectElement} dropdown - Dropdown to update
 * @param {Array} formats - Custom formats to add
 * @param {string} savedTemplate - The saved template value to select
 */
function updateFormatDropdown(dropdown, formats, savedTemplate) {
  if (!dropdown) return;

  // Remember the currently selected value
  const currentValue = savedTemplate || dropdown.value;
  console.log(`Updating dropdown with saved template: ${currentValue}`);

  // Remove existing custom formats (keep default options)
  // Only remove if it's the markdown dropdown
  if (dropdown === formatTemplateDropdown) {
    const defaultCount =
      Array.from(dropdown.options).findIndex((opt) => opt.value === "custom") +
      1;
    // Make sure defaultCount is valid before removing
    if (defaultCount > 0) {
      while (dropdown.options.length > defaultCount) {
        dropdown.remove(defaultCount);
      }
    }
  }

  // Only add custom formats to the markdown dropdown
  if (dropdown === formatTemplateDropdown) {
    formats.forEach((format) => {
      const option = createElement("option", {
        value: format.pattern,
        textContent: format.name,
        dataset: {
          custom: "true",
          formatId: format.id,
        },
      });
      dropdown.add(option);
    });
  }

  // Try to restore the saved template selection
  let found = false;
  for (let i = 0; i < dropdown.options.length; i++) {
    if (dropdown.options[i].value === currentValue) {
      dropdown.selectedIndex = i;
      found = true;
      console.log(`Found saved template at index ${i}`);
      break;
    }
  }

  // If saved template wasn't found in dropdown options
  if (!found) {
    if (dropdown === formatTemplateDropdown && currentValue !== "custom") {
      // For markdown, we can use the custom option
      for (let i = 0; i < dropdown.options.length; i++) {
        if (dropdown.options[i].value === "custom") {
          dropdown.selectedIndex = i;
          const input = formatTemplateInput;
          input.value = currentValue;
          input.classList.add("show");
          console.log(`Using custom option with value: ${currentValue}`);
          found = true;
          break;
        }
      }
    }

    // If still not found or not markdown dropdown, default to first option
    if (!found) {
      dropdown.selectedIndex = 0;
      console.log(`Defaulting to first option: ${dropdown.options[0].value}`);
    }
  }

  // Add delete buttons for custom formats (only needed for markdown dropdown)
  if (dropdown === formatTemplateDropdown) {
    addDeleteButtonsToDropdown(dropdown);
  }

  // Update input visibility and value based on dropdown selection
  const input =
    dropdown === formatTemplateDropdown
      ? formatTemplateInput
      : plainTextTemplateInput;

  if (dropdown === formatTemplateDropdown && dropdown.value === "custom") {
    input.value = currentValue; // Make sure the input has the saved value
    input.classList.add("show");
  } else {
    // Always update input value if not custom
    input.value = dropdown.value;
    input.classList.remove("show");
  }

  // Update the input field with the current template
  if (dropdown === formatTemplateDropdown) {
    formatTemplateInput.value =
      dropdown.value === "custom" ? currentValue : dropdown.value;
  } else {
    plainTextTemplateInput.value = dropdown.value;
  }
}

/**
 * Adds delete buttons to custom format options
 * @param {HTMLSelectElement} dropdown - Dropdown element
 */
function addDeleteButtonsToDropdown(dropdown) {
  // Only proceed if it's the markdown dropdown
  if (dropdown !== formatTemplateDropdown) {
    return;
  }

  // Get parent container for dropdown
  const container = dropdown.parentNode;
  if (!container) return;

  // Add delete button container if it doesn't exist
  let deleteContainer = container.querySelector(".format-delete-container");
  if (!deleteContainer) {
    deleteContainer = createElement(
      "div",
      { className: "format-delete-container" },
      {
        position: "absolute",
        right: "30px",
        top: "50%",
        transform: "translateY(-50%)",
        display: "none",
        zIndex: "1",
      }
    );
    container.style.position = "relative";
    container.appendChild(deleteContainer);
  } else {
    // Clear existing buttons
    deleteContainer.innerHTML = "";
  }

  // Determine format type - should always be markdown here
  const formatType = "markdown";

  // Add delete button for the currently selected option
  const selectedOption = dropdown.options[dropdown.selectedIndex];
  if (selectedOption && selectedOption.dataset.custom === "true") {
    const formatId = selectedOption.dataset.formatId;
    const deleteBtn = createDeleteButton(
      formatType,
      formatId,
      selectedOption.textContent
    );
    deleteContainer.appendChild(deleteBtn);
    deleteContainer.style.display = "block";
  }

  // Show/hide delete button on dropdown change
  dropdown.addEventListener("change", () => {
    deleteContainer.innerHTML = "";
    const option = dropdown.options[dropdown.selectedIndex];
    if (option && option.dataset.custom === "true") {
      // Use the current toggle state here too - still should be markdown
      const formatId = option.dataset.formatId;
      const deleteBtn = createDeleteButton(
        "markdown", // Explicitly markdown
        formatId,
        option.textContent
      );
      deleteContainer.appendChild(deleteBtn);
      deleteContainer.style.display = "block";
    } else {
      deleteContainer.style.display = "none";
    }
  });
}

/**
 * Adds a new custom format
 * @param {string} type - Format type (markdown or plaintext)
 * @param {string} name - Format name
 * @param {string} pattern - Format pattern
 * @returns {Promise<string>} - Format ID
 */
export async function addFormat(type, name, pattern) {
  // Prevent adding plaintext formats
  if (type === "plaintext") {
    console.warn("Adding custom plaintext formats is not supported.");
    showSnackbar("Cannot add custom plain text formats.");
    return;
  }

  try {
    console.log(`Adding format: ${type}, ${name}, ${pattern}`);

    // Should only be markdown formats now
    let formats = [...customMarkdownFormats];
    const storageKey = "markdownFormats";

    // Check if format exists by pattern
    const existingIndex = formats.findIndex((f) => f.pattern === pattern);
    let formatId;

    if (existingIndex >= 0) {
      // Update existing format
      formats[existingIndex].name = name;
      formatId = formats[existingIndex].id;
      console.log(`Updated existing format at index ${existingIndex}`);
    } else {
      // Add new format with a unique ID
      formatId = generateUniqueId("fmt_");
      formats.push({ id: formatId, name, pattern });
      console.log(`Added new format with ID: ${formatId}`);
    }

    // Update state and storage
    customMarkdownFormats = formats;
    await saveCustomFormats(storageKey, formats);

    // Update dropdown (always markdown dropdown)
    const dropdown = formatTemplateDropdown;
    const input = formatTemplateInput;

    updateFormatDropdown(dropdown, formats);

    // Select the newly added format
    for (let i = 0; i < dropdown.options.length; i++) {
      if (dropdown.options[i].value === pattern) {
        dropdown.selectedIndex = i;
        input.value = pattern;
        input.classList.remove("show");
        dropdown.dispatchEvent(new Event("change"));
        console.log(`Selected format at index ${i}`);
        break;
      }
    }

    return formatId;
  } catch (error) {
    console.error("Error adding format:", error);
    throw error;
  }
}

/**
 * Removes a custom format
 * @param {string} type - Format type (markdown or plaintext)
 * @param {string} formatId - ID of format to remove
 */
export async function removeFormat(type, formatId) {
  try {
    console.log(`Removing format: ${type}, ${formatId}`);

    // Get the appropriate format list
    let formats =
      type === "markdown"
        ? [...customMarkdownFormats]
        : [...customPlainTextFormats];
    const storageKey =
      type === "markdown" ? "markdownFormats" : "plainTextFormats";

    // Find format by ID
    const index = formats.findIndex((f) => f.id === formatId);
    if (index === -1) {
      console.error(`Format not found: ${formatId}`);
      showSnackbar("Error: Format not found");
      return;
    }

    // Get format info for notification
    const formatName = formats[index].name;
    const formatPattern = formats[index].pattern;

    // Get UI elements
    const dropdown =
      type === "markdown" ? formatTemplateDropdown : plainTextTemplateDropdown;
    const input =
      type === "markdown" ? formatTemplateInput : plainTextTemplateInput;

    // Check if this format is currently selected
    const wasSelected = dropdown.value === formatPattern;

    // Remove the format
    formats.splice(index, 1);
    console.log(`Removed format at index ${index}`);

    // Update state and storage
    if (type === "markdown") {
      customMarkdownFormats = formats;
    } else {
      customPlainTextFormats = formats;
    }

    await saveCustomFormats(storageKey, formats);

    // Update dropdown
    updateFormatDropdown(dropdown, formats);

    // Reset to default if the removed format was selected
    if (wasSelected) {
      const defaultValue =
        type === "markdown" ? "[{{title}}]({{url}})" : "{{title}} - {{url}}";
      dropdown.value = defaultValue;
      input.value = defaultValue;
      dropdown.dispatchEvent(new Event("change"));
      console.log(`Reset to default format: ${defaultValue}`);
    }

    // Show success message
    showSnackbar(`Format "${formatName}" removed`);
  } catch (error) {
    console.error("Error removing format:", error);
    showSnackbar("Error removing format");
  }
}

/**
 * Shows modal to add a format
 * @param {string} type - Format type (markdown or plaintext)
 * @param {HTMLElement} modal - Modal element
 * @param {HTMLElement} typeInput - Type input element
 * @param {HTMLElement} nameInput - Name input element
 */
export function showAddFormatModal(type, modal, typeInput, nameInput) {
  showModal(modal, () => {
    if (typeInput) typeInput.value = type;
    if (nameInput) nameInput.focus();

    // Update modal title
    const modalTitle = modal?.querySelector(".folder-modal-title");
    if (modalTitle) {
      modalTitle.textContent =
        type === "markdown" ? "Add Markdown Format" : "Add Plain Text Format";
    }
  });
}

/**
 * Hides format modal
 * @param {HTMLElement} modal - Modal element
 * @param {HTMLElement} form - Form element
 */
export function hideAddFormatModal(modal, form) {
  hideModal(modal, form);
}

/**
 * Handles add format form submission
 * @param {Event} e - Form event
 * @param {HTMLElement} typeInput - Type input element
 * @param {HTMLElement} nameInput - Name input element
 * @param {HTMLElement} patternInput - Pattern input element
 * @param {HTMLElement} modal - Modal element
 * @param {HTMLElement} form - Form element
 */
export async function handleAddFormat(
  e,
  typeInput,
  nameInput,
  patternInput,
  modal,
  form
) {
  e.preventDefault();

  if (!typeInput || !nameInput || !patternInput) return;

  const type = typeInput.value;
  const name = nameInput.value.trim();
  const pattern = patternInput.value.trim();

  // Prevent adding plaintext formats here too
  if (type === "plaintext") {
    console.warn("Attempted to submit plaintext format via form.");
    showSnackbar("Cannot add custom plain text formats.");
    hideAddFormatModal(modal, form);
    return;
  }

  if (!name || !pattern) {
    showSnackbar("Please enter a name and pattern");
    return;
  }

  try {
    await addFormat(type, name, pattern);
    hideAddFormatModal(modal, form);
    showSnackbar(`Format "${name}" added`);
  } catch (error) {
    console.error("Error adding format:", error);
    showSnackbar("Error adding format");
  }
}

/**
 * Gets all custom formats
 * @returns {Object} - Object containing markdown and plaintext formats
 */
export function getAllFormats() {
  return {
    markdown: customMarkdownFormats,
    plaintext: customPlainTextFormats,
  };
}

/**
 * Gets the current format type based on the Markdown toggle
 * @param {boolean} isMarkdownChecked - State of the Format as Markdown toggle
 * @returns {string} - "markdown" or "plaintext"
 */
export function getCurrentFormatType(isMarkdownChecked) {
  return isMarkdownChecked ? "markdown" : "plaintext";
}
