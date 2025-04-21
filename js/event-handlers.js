/**
 * event-handlers.js
 * This file handles DOM events without using inline event handlers
 * to comply with Content Security Policy restrictions.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Attach event listeners to elements instead of using inline handlers
  // This approach complies with CSP restrictions that block inline event handlers

  // Custom confirm dialog handlers
  const confirmDialog = document.getElementById("customConfirmDialog");
  if (confirmDialog) {
    const confirmCancelBtn = document.getElementById("confirmCancelBtn");
    const confirmOkBtn = document.getElementById("confirmOkBtn");

    if (confirmCancelBtn) {
      confirmCancelBtn.addEventListener("click", function () {
        confirmDialog.style.display = "none";
        // Trigger cancel callback if it exists
        if (window.confirmCancelCallback) {
          window.confirmCancelCallback();
        }
      });
    }

    if (confirmOkBtn) {
      confirmOkBtn.addEventListener("click", function () {
        confirmDialog.style.display = "none";
        // Trigger confirm callback if it exists
        if (window.confirmCallback) {
          window.confirmCallback();
        }
      });
    }
  }

  // Settings toggle button
  const settingsToggleBtn = document.getElementById("settingsToggleBtn");
  if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener("click", function () {
      // Dispatch a custom event that your popup.js can listen for
      document.dispatchEvent(new CustomEvent("toggleSettings"));
    });
  }

  // Add format button
  const addFormatBtn = document.getElementById("addFormatBtn");
  if (addFormatBtn) {
    addFormatBtn.addEventListener("click", function () {
      document.dispatchEvent(new CustomEvent("addFormat"));
    });
  }

  // Reset button
  const resetBtn = document.querySelector(".reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      document.dispatchEvent(new CustomEvent("resetOptions"));
    });
  }

  // Toggle switches and checkboxes
  const toggles = document.querySelectorAll('input[type="checkbox"]');
  toggles.forEach((toggle) => {
    toggle.addEventListener("change", function () {
      // Dispatch a custom event with the toggle ID and checked state
      document.dispatchEvent(
        new CustomEvent("toggleChange", {
          detail: {
            id: this.id,
            checked: this.checked,
          },
        })
      );
    });
  });

  // Format template dropdowns
  const formatTemplateDropdown = document.getElementById(
    "formatTemplateDropdown"
  );
  if (formatTemplateDropdown) {
    formatTemplateDropdown.addEventListener("change", function () {
      document.dispatchEvent(
        new CustomEvent("formatTemplateChange", {
          detail: {
            value: this.value,
          },
        })
      );

      // Directly call the updateFormatExamples function
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  const plainTextTemplateDropdown = document.getElementById(
    "plainTextTemplateDropdown"
  );
  if (plainTextTemplateDropdown) {
    plainTextTemplateDropdown.addEventListener("change", function () {
      document.dispatchEvent(
        new CustomEvent("plainTextTemplateChange", {
          detail: {
            value: this.value,
          },
        })
      );

      // Directly call the updateFormatExamples function
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  // Add listeners for the format template input and checkbox changes
  const formatTemplateInput = document.getElementById("formatTemplate");
  if (formatTemplateInput) {
    formatTemplateInput.addEventListener("input", function () {
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  const plainTextTemplateInput = document.getElementById("plainTextTemplate");
  if (plainTextTemplateInput) {
    plainTextTemplateInput.addEventListener("input", function () {
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  // Also add event handlers for the toggle switches that affect formatting
  const includeTitlesToggle = document.getElementById("includeTitles");
  if (includeTitlesToggle) {
    includeTitlesToggle.addEventListener("change", function () {
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  const formatMarkdownToggle = document.getElementById("formatMarkdown");
  if (formatMarkdownToggle) {
    formatMarkdownToggle.addEventListener("change", function () {
      if (typeof window.updateFormatExamples === "function") {
        window.updateFormatExamples();
      }
    });
  }

  // Handle image error events (folder-preview.js)
  const favicons = document.querySelectorAll(".tab-favicon");
  favicons.forEach((img) => {
    img.addEventListener("error", function () {
      this.src = "../icons/link.svg";
    });
  });

  // If this is folder-preview page, add tab item event listeners
  if (window.location.pathname.includes("folder-preview.html")) {
    // Add click handlers for tab items - will be re-attached when tabs are rendered
    const setupTabItemListeners = () => {
      const tabItems = document.querySelectorAll(".tab-item");
      const removeButtons = document.querySelectorAll(".tab-remove-btn");

      tabItems.forEach((item) => {
        item.addEventListener("click", function () {
          const url = this.querySelector(".tab-url").textContent;
          if (url) {
            window.open(url, "_blank");
          }
        });
      });

      removeButtons.forEach((btn) => {
        btn.addEventListener("click", function (e) {
          e.stopPropagation(); // Prevent opening the tab

          // Get the tab index from a data attribute that needs to be added
          const tabItem = this.closest(".tab-item");
          const tabIndex = tabItem.dataset.tabIndex;

          if (tabIndex !== undefined) {
            // Dispatch a custom event to handle tab removal
            document.dispatchEvent(
              new CustomEvent("removeTabFromFolder", {
                detail: {
                  tabIndex: parseInt(tabIndex, 10),
                },
              })
            );
          }
        });
      });
    };

    // Set up observer to watch for DOM changes and reattach listeners
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          setupTabItemListeners();
        }
      }
    });

    // Start observing
    const tabList = document.getElementById("tabList");
    if (tabList) {
      observer.observe(tabList, { childList: true, subtree: true });
      // Initial setup
      setupTabItemListeners();
    }
  }
});
