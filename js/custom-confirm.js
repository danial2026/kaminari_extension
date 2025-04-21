/**
 * custom-confirm.js - Custom confirm dialog implementation
 *
 * A Firefox-compatible confirm dialog utility that replaces the native browser
 * confirm dialog, which can be problematic in Firefox extensions.
 */

// Check if we're in a window context before accessing window
const isWindowContext = typeof window !== "undefined";

let confirmDialog;
let confirmMessage;
let confirmOkBtn;
let confirmCancelBtn;
let confirmPromiseResolve = null;

// Only override window.confirm in window contexts
if (isWindowContext) {
  // Directly override window.confirm as early as possible
  const originalConfirm = window.confirm;
  window.confirm = function (message) {
    console.log("window.confirm intercepted:", message);

    if (confirmDialog && confirmMessage) {
      console.log("Using custom dialog implementation");
      return customConfirm(message);
    } else {
      console.warn("Custom confirm not initialized, using original");
      return originalConfirm.call(window, message);
    }
  };
}

/**
 * Initialize the custom confirm dialog
 */
export function initCustomConfirm() {
  // Skip in non-window contexts like service workers
  if (!isWindowContext) return;

  // Get dialog elements
  confirmDialog = document.getElementById("customConfirmDialog");
  confirmMessage = document.getElementById("confirmMessage");
  confirmOkBtn = document.getElementById("confirmOkBtn");
  confirmCancelBtn = document.getElementById("confirmCancelBtn");

  if (!confirmDialog || !confirmMessage || !confirmOkBtn || !confirmCancelBtn) {
    console.error("Custom confirm dialog elements not found");
    return;
  }

  // Set up event listeners
  confirmOkBtn.addEventListener("click", () => {
    console.log("Confirm OK clicked");
    hideConfirmDialog();
    if (confirmPromiseResolve) {
      confirmPromiseResolve(true);
      confirmPromiseResolve = null;
    }
  });

  confirmCancelBtn.addEventListener("click", () => {
    console.log("Confirm Cancel clicked");
    hideConfirmDialog();
    if (confirmPromiseResolve) {
      confirmPromiseResolve(false);
      confirmPromiseResolve = null;
    }
  });

  console.log("Custom confirm dialog initialized successfully");
}

/**
 * Show the custom confirm dialog
 * @param {string} message - Message to display
 * @returns {Promise<boolean>} - Promise resolving to user's choice (true for OK, false for Cancel)
 */
export function customConfirm(message) {
  // Skip in non-window contexts
  if (!isWindowContext) return Promise.resolve(false);

  if (!confirmDialog || !confirmMessage) {
    console.error("Custom confirm dialog not initialized");
    return Promise.resolve(false);
  }

  console.log("Showing custom confirm dialog with message:", message);

  // Set the message
  confirmMessage.textContent = message;

  // Return a promise that will be resolved when a button is clicked
  return new Promise((resolve) => {
    confirmPromiseResolve = resolve;
    confirmDialog.style.display = "flex";
  });
}

/**
 * Hide the confirm dialog
 */
function hideConfirmDialog() {
  if (confirmDialog) {
    confirmDialog.style.display = "none";
  }
}
