/**
 * utils.js - Common utility functions for the extension
 */

import { customConfirm } from "./custom-confirm.js";

/**
 * Saves data to Chrome storage
 * @param {Object} data - Key-value pairs to save to storage
 * @returns {Promise} - Promise that resolves when the data is saved
 */
export function saveToStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log("Data saved:", data);
        resolve();
      }
    });
  });
}

/**
 * Loads data from Chrome storage
 * @param {string|Array|Object} keys - The keys to load from storage
 * @returns {Promise} - Promise that resolves with the loaded data
 */
export function loadFromStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log("Data loaded:", result);
        resolve(result);
      }
    });
  });
}

/**
 * Shows a modal dialog
 * @param {HTMLElement} modal - The modal element to show
 * @param {Function} setupFn - Optional function to run when the modal is shown
 */
export function showModal(modal, setupFn) {
  if (!modal) return;

  modal.style.display = "flex";

  if (typeof setupFn === "function") {
    setupFn();
  }

  document.body.classList.add("modal-open");
}

/**
 * Hides a modal dialog
 * @param {HTMLElement} modal - The modal element to hide
 * @param {HTMLElement} form - Optional form to reset
 */
export function hideModal(modal, form) {
  if (!modal) return;

  modal.style.display = "none";

  if (form) {
    form.reset();
  }

  document.body.classList.remove("modal-open");
}

/**
 * Creates a DOM element with the specified attributes and styles
 * @param {string} tag - The tag name of the element to create
 * @param {Object} attributes - Key-value pairs of attributes to set
 * @param {Object} styles - Key-value pairs of styles to set
 * @param {string} content - Optional HTML content to set
 * @returns {HTMLElement} - The created element
 */
export function createElement(tag, attributes = {}, styles = {}, content = "") {
  const element = document.createElement(tag);

  // Set attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "dataset") {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue;
      }
    } else if (key === "textContent") {
      element.textContent = value;
    } else {
      element[key] = value;
    }
  }

  // Set styles
  for (const [key, value] of Object.entries(styles)) {
    element.style[key] = value;
  }

  // Set content
  if (content) {
    element.innerHTML = content;
  }

  return element;
}

/**
 * Formats text using a template with placeholders
 * @param {string} template - Template string with {{placeholders}}
 * @param {Object} data - Key-value pairs to replace placeholders
 * @returns {string} - Formatted text
 */
export function formatWithTemplate(template, data) {
  if (!template) return "";

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

/**
 * Shows a snackbar message or logs it to the console
 * @param {string} message - The message to show
 */
export function showSnackbar(message) {
  const snackbar = document.getElementById("snackbar");

  if (snackbar) {
    snackbar.textContent = message;
    snackbar.className = "show";
    setTimeout(() => {
      snackbar.className = snackbar.className.replace("show", "");
    }, 3000);
  } else {
    console.log("Snackbar message:", message);
  }
}

/**
 * Generates a unique ID with an optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export function generateUniqueId(prefix = "") {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handles dropdown change event with optional input field
 * @param {HTMLSelectElement} dropdown - The dropdown element
 * @param {HTMLInputElement} input - The associated input element
 * @param {string} storageKey - The key to use for storage
 */
export function handleDropdownChange(dropdown, input, storageKey) {
  if (!dropdown || !input) return;

  // If "custom" is selected, show the input field
  if (dropdown.value === "custom") {
    input.classList.add("show");
    input.focus();
  } else {
    input.classList.remove("show");
    input.value = dropdown.value;
  }

  // Save the current template to storage
  const templateValue =
    dropdown.value === "custom" ? input.value : dropdown.value;
  const data = { [storageKey]: templateValue };
  updateFormatExamples();
  saveToStorage(data);
}

/**
 * Creates a delete button with a trash icon
 * @param {string|Function} param1 - Either a click handler function or format type string
 * @param {string} param2 - Either a title string or format ID
 * @param {string} param3 - Optional format name
 * @returns {HTMLElement} - The delete button element
 */
export function createDeleteButton(param1, param2, param3) {
  // Check if first parameter is a function (legacy usage) or format type (new usage)
  let onClick;
  let title = "Remove";

  if (typeof param1 === "function") {
    // Legacy usage: createDeleteButton(onClick, title)
    onClick = param1;
    if (param2) title = param2;
  } else {
    // New usage: createDeleteButton(formatType, formatId, formatName)
    const formatType = param1;
    const formatId = param2;
    if (param3) title = `Remove "${param3}"`;

    // Create click handler for format removal
    onClick = async (e) => {
      e.stopPropagation(); // Prevent dropdown from opening/closing

      console.log("Showing delete format confirm dialog for:", param3);

      // Use customConfirm with await
      const confirmed = await customConfirm(`Remove format "${param3}"?`);

      console.log("Confirm result:", confirmed);

      if (confirmed) {
        // Use the removeFormat function from format-manager if available in window scope
        if (window.removeFormat) {
          window.removeFormat(formatType, formatId);
        } else if (typeof removeFormat === "function") {
          removeFormat(formatType, formatId);
        } else {
          console.error("removeFormat function not available");
        }
      }
    };
  }

  const deleteBtn = createElement(
    "button",
    {
      className: "delete-btn",
      title: title,
    },
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: "4px",
    },
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="red" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
  );

  if (typeof onClick === "function") {
    deleteBtn.addEventListener("click", onClick);
  }

  return deleteBtn;
}
