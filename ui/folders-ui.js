/**
 * folders-ui.js - UI components and handlers for folder management
 */

import "../js/browser-polyfill.js";
import { copyToClipboard } from "../js/clipboard.js";
import { formatTabs } from "../js/tabs-formatter.js";
import { generateShareURL } from "../js/share.js";
import { customConfirm } from "../js/custom-confirm.js";
import { showSnackbar } from "../js/utils.js";
import * as folderService from "../js/folders.js";

// DOM element references
let folderList;
let createFolderModal;
let shareFolderModal;
let shareResult;
let qrcodeDiv;
let shareStatsDiv;

/**
 * Initialize folder UI components
 * @param {Object} elements - DOM elements
 * @returns {Promise<void>}
 */
export async function initFolderUI(elements) {
  console.log("Initializing folder UI components");

  try {
    // Store DOM references
    folderList = elements.folderList;
    createFolderModal = elements.createFolderModal;
    shareFolderModal = elements.shareFolderModal;
    shareResult = elements.shareResult;
    qrcodeDiv = elements.qrcodeDiv;
    shareStatsDiv = elements.shareStatsDiv;

    // Verify essential elements with specific error messages
    const requiredElements = [
      { name: "folderList", element: folderList },
      { name: "createFolderModal", element: createFolderModal },
      { name: "shareFolderModal", element: shareFolderModal },
    ];

    const missingElements = requiredElements
      .filter((item) => !item.element)
      .map((item) => item.name);

    if (missingElements.length > 0) {
      throw new Error(
        `Required folder UI elements not found: ${missingElements.join(", ")}`
      );
    }

    // Warn about optional elements that may be missing
    const optionalElements = [
      { name: "createFolderBtn", element: elements.createFolderBtn },
      {
        name: "closeCreateFolderModal",
        element: elements.closeCreateFolderModal,
      },
      { name: "createFolderForm", element: elements.createFolderForm },
      {
        name: "closeShareFolderModal",
        element: elements.closeShareFolderModal,
      },
      { name: "shareFolderForm", element: elements.shareFolderForm },
      { name: "togglePasswordBtn", element: elements.togglePasswordBtn },
      { name: "copyShareLinkBtn", element: elements.copyShareLinkBtn },
      { name: "copyOriginalLinkBtn", element: elements.copyOriginalLinkBtn },
    ];

    const missingOptionalElements = optionalElements
      .filter((item) => !item.element)
      .map((item) => item.name);

    if (missingOptionalElements.length > 0) {
      console.warn(
        `Optional folder UI elements not found: ${missingOptionalElements.join(
          ", "
        )}. Some functionality may not work.`
      );
    }

    // Setup event listeners
    setupEventListeners(elements);

    // Render initial folder list
    await renderFolderList();

    console.log("Folder UI initialization complete");
    return Promise.resolve();
  } catch (error) {
    console.error("Error initializing folder UI:", error);
    return Promise.reject(error);
  }
}

/**
 * Setup event listeners for folder UI
 * @param {Object} elements - DOM elements
 */
function setupEventListeners(elements) {
  // Create folder button
  if (elements.createFolderBtn) {
    elements.createFolderBtn.addEventListener("click", showCreateFolderModal);
  }

  // Close create folder modal
  if (elements.closeCreateFolderModal) {
    elements.closeCreateFolderModal.addEventListener(
      "click",
      hideCreateFolderModal
    );
  }

  // Create folder form
  if (elements.createFolderForm) {
    elements.createFolderForm.addEventListener("submit", handleCreateFolder);
  }

  // Close share folder modal
  if (elements.closeShareFolderModal) {
    elements.closeShareFolderModal.addEventListener(
      "click",
      hideShareFolderModal
    );
  }

  // Share folder form
  if (elements.shareFolderForm) {
    elements.shareFolderForm.addEventListener("submit", handleShareFolder);
  }

  // Toggle password visibility
  if (elements.togglePasswordBtn) {
    elements.togglePasswordBtn.addEventListener(
      "click",
      togglePasswordVisibility
    );
  }

  // Copy share link
  if (elements.copyShareLinkBtn) {
    elements.copyShareLinkBtn.addEventListener("click", copyShareLink);
  }

  // Copy original link
  if (elements.copyOriginalLinkBtn) {
    elements.copyOriginalLinkBtn.addEventListener("click", copyOriginalLink);
  }
}

/**
 * Renders the folder list
 */
export async function renderFolderList() {
  const folders = await folderService.loadFolders();

  if (!folderList) return;

  // Clear the list
  folderList.innerHTML = "";

  if (folders.length === 0) {
    folderList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        </div>
        <h3>No Folders Yet</h3>
        <p>Create folders to organize and share your tabs</p>
        <button id="emptyStateCreateFolder" class="empty-state-btn">Create Folder</button>
      </div>
    `;

    // Add event listener to empty state create button
    document
      .getElementById("emptyStateCreateFolder")
      .addEventListener("click", showCreateFolderModal);
    return;
  }

  // Sort folders by creation date (newest first)
  const sortedFolders = [...folders].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Create folder items
  sortedFolders.forEach((folder) => {
    // Skip folders with invalid data
    if (!folder || !folder.id || typeof folder.name === "undefined") {
      console.warn("Invalid folder data:", folder);
      return;
    }

    // Create a container for the folder item and add button
    const folderContainer = document.createElement("div");
    folderContainer.className = "folder-container";

    // Create the folder item
    const folderItem = document.createElement("div");
    folderItem.className = "folder-item";
    folderItem.dataset.folderId = folder.id;

    // Format creation date
    let formattedDate = "Unknown date";
    try {
      const creationDate = new Date(folder.createdAt);
      formattedDate = creationDate.toLocaleDateString();
    } catch (e) {
      console.warn("Error formatting date:", e);
    }

    // Calculate tab count
    const tabCount = folder.tabs ? folder.tabs.length : 0;

    // Ensure folder name is not empty and hide raw IDs
    let folderName = folder.name || "Unnamed Folder";

    folderItem.innerHTML = `
      <div class="folder-header">
        <div class="folder-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        </div>
        <div class="folder-info">
          <div class="folder-name">${folderName}</div>
          <div class="folder-meta">${formattedDate} • ${tabCount} tabs</div>
        </div>
      </div>
      <div class="folder-actions">
        <button class="folder-action open-folder" title="Open folder in new tab">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
          </svg>
        </button>
        <button class="folder-action copy-folder" title="Copy folder links">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        </button>
        <button class="folder-action share-folder" title="Share folder">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
        </button>
        <button class="folder-action delete-folder" title="Delete folder">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5d7599">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    `;

    // Create the add button outside the folder item
    const addButton = document.createElement("button");
    addButton.className = "folder-add-button";
    addButton.title = "Add tabs to folder";
    addButton.dataset.folderId = folder.id;
    addButton.style.background = "none"; // Remove background
    addButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5d7a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    `;

    // Add the folder item and add button to the container
    folderContainer.appendChild(folderItem);
    folderContainer.appendChild(addButton);

    // Add the container to the folder list
    folderList.appendChild(folderContainer);

    // Add event listener to the add button
    addButton.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering folder card click
      addSelectedTabsToFolder(folder.id);
    });

    // Add event listeners for other folder actions
    const openBtn = folderItem.querySelector(".open-folder");
    openBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering folder card click
      openFolderInNewTab(folder.id);
    });

    const copyBtn = folderItem.querySelector(".copy-folder");
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering folder card click
      copyFolderToClipboard(folder.id);
    });

    const shareBtn = folderItem.querySelector(".share-folder");
    shareBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering folder card click
      showShareFolderModal(folder.id);
    });

    const deleteBtn = folderItem.querySelector(".delete-folder");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering folder card click
      confirmDeleteFolder(folder.id);
    });

    // Add click event to the folder card itself to show preview
    folderItem.addEventListener("click", () => {
      viewFolderContents(folder.id);
    });
  });
}

/**
 * Opens a folder in a new tab
 * @param {string} folderId - ID of folder to open
 */
export const openFolderInNewTab = (folderId) => {
  const url = `/folder-preview.html?folderId=${encodeURIComponent(folderId)}`;
  window.open(url, "_blank");
};

/**
 * Shows the create folder modal
 */
export function showCreateFolderModal() {
  createFolderModal.style.display = "flex";
  document.getElementById("folderName").focus();
}

/**
 * Hides the create folder modal
 */
export function hideCreateFolderModal() {
  createFolderModal.style.display = "none";
  document.getElementById("createFolderForm").reset();
}

/**
 * Handles folder creation form submission
 * @param {Event} e - Form submit event
 */
export async function handleCreateFolder(e) {
  e.preventDefault();

  const folderName = document.getElementById("folderName").value.trim();
  const tabsToAddOption = document.querySelector(
    'input[name="tabsToAdd"]:checked'
  ).value;

  if (!folderName) {
    showSnackbar("Please enter a folder name");
    return;
  }

  try {
    let tabsToAdd = [];

    // Get tabs based on selection
    if (tabsToAddOption === "all") {
      const allTabs = await browser.tabs.query({ currentWindow: true });
      tabsToAdd = allTabs;
    } else if (tabsToAddOption === "selected") {
      const selectedTabsInfo = await browser.tabs.query({
        currentWindow: true,
        highlighted: true,
      });
      tabsToAdd = selectedTabsInfo;
    }

    // Create folder
    await folderService.createFolder(folderName, tabsToAdd);

    // Hide modal and update UI
    hideCreateFolderModal();
    renderFolderList();
    showSnackbar(`Folder "${folderName}" created`);
  } catch (error) {
    console.error("Error creating folder:", error);
    showSnackbar("Error creating folder");
  }
}

/**
 * Asks for confirmation before deleting a folder
 * @param {string} folderId - ID of folder to delete
 */
export async function confirmDeleteFolder(folderId) {
  try {
    // First, get the folder data
    console.log("Delete folder triggered, fetching folder:", folderId);
    const folder = await folderService.getFolderById(folderId);

    // Check if folder exists
    if (!folder) {
      console.error("Folder not found:", folderId);
      return;
    }

    const folderName = folder.name;
    console.log("Found folder for deletion:", folderName);

    // Then show confirmation dialog BEFORE deleting
    console.log("Showing confirm dialog for folder:", folderName);
    const confirmed = await customConfirm(`Delete folder "${folderName}"?`);
    console.log("Confirm result:", confirmed);

    // Only delete if confirmed
    if (confirmed) {
      console.log("Confirmed - deleting folder:", folderName);
      await folderService.deleteFolder(folderId);
      console.log("Folder deleted, updating UI");
      await renderFolderList();
      showSnackbar(`Folder "${folderName}" deleted`);
    } else {
      console.log("Deletion cancelled for folder:", folderName);
    }
  } catch (error) {
    console.error("Error in confirmDeleteFolder:", error);
  }
}

/**
 * Shows folder contents in the main view
 * @param {string} folderId - ID of folder to view
 */
export async function viewFolderContents(folderId) {
  // Always reload the folder data to ensure we have the latest version
  const folder = await folderService.getFolderById(folderId);
  if (!folder) {
    console.warn(`Folder with ID ${folderId} not found`);
    showSnackbar("Folder not found");
    return;
  }

  console.log(
    "Loading folder contents:",
    folder.name,
    "with",
    folder.tabs?.length || 0,
    "tabs"
  );

  // Mark folder item as active
  document.querySelectorAll(".folder-item").forEach((item) => {
    item.classList.remove("active");

    if (item.dataset.folderId === folderId) {
      item.classList.add("active");
    }
  });

  // Add preview mode class to tab container - keep the class name consistent with CSS
  const tabContainer = document.querySelector(".tab-container");
  if (!tabContainer) {
    console.warn("Tab container not found");
    return;
  }

  tabContainer.classList.add("preview-mode");

  // Hide the "Show selected" toggle when in folder view
  const previewToggle = document.getElementById("previewToggle");
  if (previewToggle) {
    previewToggle.style.display = "none";
  }

  // Get tab preview element
  const tabPreview = document.getElementById("tabPreview");
  if (!tabPreview) {
    console.warn("Tab preview element not found");
    return;
  }

  // Clear preview
  tabPreview.innerHTML = "";

  // Ensure folder has a name
  let folderName = folder.name || formatFolderId(folder.id) || "Unnamed Folder";

  // Add header with folder name
  const previewHeader = document.createElement("div");
  previewHeader.className = "preview-header"; // Keep consistent with CSS
  previewHeader.innerHTML = `
    <h3>Folder: ${folderName}</h3>
    <button id="folderCloseBtn" class="folder-close-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#5d7599">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;
  tabPreview.appendChild(previewHeader);

  // Add exit button event listener
  document
    .getElementById("folderCloseBtn")
    .addEventListener("click", closeViewFolder);

  // Check if folder has tabs
  if (!folder.tabs || folder.tabs.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#5d7599">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      </div>
      <h3>No Tabs in This Folder</h3>
      <p>This folder does not contain any tabs</p>
    `;
    tabPreview.appendChild(emptyState);
    return;
  }

  // Create preview tabs
  const tabs = folder.tabs.map((tab) => ({
    title: tab.t || "Untitled",
    url: tab.u || "",
    favIconUrl: tab.f || "",
  }));

  // Display tabs
  tabs.forEach((tab, index) => {
    const tabElement = document.createElement("div");
    tabElement.className = "tab-item preview-tab";

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

    // Create title with max length protection and clean handling of long titles
    const title = document.createElement("div");
    title.className = "tab-title";

    // Ensure title is a reasonable length for display
    let displayTitle = tab.title || "Untitled";
    title.textContent = displayTitle;
    title.title = displayTitle; // Add tooltip with full title for hover

    // Create URL
    const url = document.createElement("div");
    url.className = "tab-url";
    url.textContent = tab.url || "";
    url.title = tab.url || ""; // Add tooltip with full URL for hover

    // Assemble tab
    tabContent.appendChild(title);
    tabContent.appendChild(url);
    tabElement.appendChild(favicon);
    tabElement.appendChild(tabContent);

    // Add bin/remove icon
    const removeBtn = document.createElement("button");
    removeBtn.className = "tab-remove-btn";
    removeBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#5d7599">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;
    removeBtn.title = "Remove from folder";

    // Prevent click propagation from bin icon to parent
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeTabFromFolder(folderId, index);
    });

    tabElement.appendChild(removeBtn);

    // Add click event to open tab (excluding bin icon clicks)
    tabElement.addEventListener("click", () => {
      browser.tabs.create({ url: tab.url });
    });

    tabPreview.appendChild(tabElement);
  });
}

/**
 * Closes the folder view and resets state
 */
export function closeViewFolder() {
  // Remove active class from any folder items
  document.querySelectorAll(".folder-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Remove preview mode class from tab container
  const tabContainer = document.querySelector(".tab-container");
  if (tabContainer) {
    tabContainer.classList.remove("preview-mode");
  }

  // Show the "Show selected" toggle again
  const previewToggle = document.getElementById("previewToggle");
  if (previewToggle) {
    previewToggle.style.display = "flex";
  }

  // Clear preview content
  const tabPreview = document.getElementById("tabPreview");
  if (tabPreview) {
    tabPreview.innerHTML = "";
  }

  // Refresh the tabs display to show normal tabs again
  if (window.updateTabPreview) {
    window.updateTabPreview();
  } else if (typeof updateTabPreview === "function") {
    updateTabPreview();
  } else {
    // If updateTabPreview is not available, try to reload tabs
    try {
      if (typeof loadTabs === "function") {
        loadTabs();
      } else if (window.loadTabs) {
        window.loadTabs();
      } else {
        // As a last resort, manually trigger tab rendering using browser API
        browser.tabs.query({ currentWindow: true }).then((tabs) => {
          if (!tabPreview) return;

          // Simple rendering to show something rather than empty space
          tabs.forEach((tab) => {
            const tabElement = document.createElement("div");
            tabElement.className = "tab-item";

            tabElement.innerHTML = `
              <img src="${
                tab.favIconUrl || "icons/link.svg"
              }" class="tab-favicon" 
                  onerror="this.src='icons/link.svg'" />
              <div class="tab-content">
                <div class="tab-title">${tab.title || "Untitled"}</div>
                <div class="tab-url">${tab.url}</div>
              </div>
            `;

            tabPreview.appendChild(tabElement);
          });
        });
      }
    } catch (e) {
      console.error("Error reloading tabs after folder close:", e);
    }
  }
}

/**
 * Copies a folder's formatted tabs to clipboard
 * @param {string} folderId - ID of folder to copy
 */
export async function copyFolderToClipboard(folderId) {
  try {
    const folder = await folderService.getFolderById(folderId);
    if (!folder) return;

    // Convert compact tabs to readable format
    const tabs = folder.tabs.map((tab) => ({
      title: tab.t || "",
      url: tab.u || "",
    }));

    // Get user preferences
    const options = await browser.storage.local.get([
      "includeTitles",
      "includeUrls",
      "formatMarkdown",
    ]);

    // Format tabs
    const formattedText = formatTabs(tabs, {
      includeTitles: options.includeTitles !== false,
      includeUrls: options.includeUrls !== false,
      formatMarkdown: options.formatMarkdown !== false,
    });

    // Copy to clipboard
    await copyToClipboard(formattedText);
    showSnackbar(`Folder "${folder.name}" copied to clipboard`);
  } catch (error) {
    console.error("Error copying folder:", error);
    showSnackbar("Error copying folder");
  }
}

/**
 * Shows the share folder modal
 * @param {string} folderId - ID of folder to share
 */
export function showShareFolderModal(folderId) {
  const folder = folderService.getFolderById(folderId);
  if (!folder) return;

  shareFolderModal.style.display = "flex";
  document.getElementById("shareFolderId").value = folderId;
  document.getElementById("sharePassword").focus();

  // Hide the share result initially
  shareResult.style.display = "none";
}

/**
 * Hides the share folder modal
 */
export function hideShareFolderModal() {
  shareFolderModal.style.display = "none";
  document.getElementById("shareFolderForm").reset();
  shareResult.style.display = "none";

  // Clear any previous QR code
  qrcodeDiv.innerHTML = "";
}

/**
 * Toggles password visibility in the share modal
 */
export function togglePasswordVisibility() {
  const passwordInput = document.getElementById("sharePassword");
  const toggleIcon = document.querySelector("#togglePassword svg");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.innerHTML = `
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
    `;
  } else {
    passwordInput.type = "password";
    toggleIcon.innerHTML = `
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    `;
  }
}

/**
 * Shortens a URL using a URL shortening service
 * @param {string} url - URL to shorten
 * @returns {Promise<string>} - Shortened URL
 */
export async function shortenUrl(url) {
  try {
    const response = await fetch("https://sorame.danials.space/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: url,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to shorten URL");
    }

    const data = await response.json();
    return `https://sorame.danials.space/link/${data.share_id}`;
  } catch (error) {
    console.error("Error shortening URL:", error);
    return url; // Return original URL on error
  }
}

/**
 * Handles folder sharing form submission
 * @param {Event} e - Form submit event
 */
export async function handleShareFolder(e) {
  e.preventDefault();

  const folderId = document.getElementById("shareFolderId").value;
  const password = document.getElementById("sharePassword").value;

  if (!password) {
    showSnackbar("Please enter a password");
    return;
  }

  const folder = await folderService.getFolderById(folderId);
  if (!folder) return;

  try {
    const shareableUrl = await generateShareURL(folder, password);
    const shortenedUrl = await shortenUrl(shareableUrl);

    // Remove password field, submit button and label
    const shareFolderForm = document.getElementById("shareFolderForm");
    if (shareFolderForm) {
      shareFolderForm.style.display = "none";
    }

    // Update UI with shortened URL
    const shareLinkInput = document.getElementById("shareLink");
    shareLinkInput.value = shortenedUrl;

    // Update original link input
    const originalLinkInput = document.getElementById("originalLink");
    originalLinkInput.value = shareableUrl;

    // Show share result section
    shareResult.style.display = "block";

    // Generate QR code
    qrcodeDiv.innerHTML = ""; // Clear existing QR code

    try {
      // Create QR code instance
      const qr = qrcode(0, "M");
      qr.addData(shortenedUrl);
      qr.make();

      // Create QR code image
      const qrImage = qr.createImgTag(5);
      qrcodeDiv.innerHTML = qrImage;
    } catch (qrError) {
      console.error("Error generating QR code:", qrError);
      qrcodeDiv.innerHTML =
        '<div style="color: #ff4757; text-align: center;">Failed to generate QR code</div>';
    }

    // Update stats
    const folderSize = new TextEncoder().encode(JSON.stringify(folder)).length;
    shareStatsDiv.textContent = `Folder size: ${formatSize(folderSize)}`;
  } catch (error) {
    console.error("Error sharing folder:", error);
    showSnackbar("Error generating shareable link");
  }
}

/**
 * Copies the shortened share link to clipboard
 */
export async function copyShareLink() {
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
 * Copies the original share link to clipboard
 */
export async function copyOriginalLink() {
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

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
export function formatSize(bytes) {
  if (bytes < 1024) {
    return bytes + " bytes";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
}

/**
 * Formats a folder ID for display
 * @param {string} folderId - Raw folder ID
 * @returns {string} - Formatted folder name or ID
 */
function formatFolderId(folderId) {
  // If it's already a formatted folder ID, return it as is
  if (!folderId.includes("folder_")) {
    return folderId;
  }

  // Try to extract a readable ID part
  try {
    // Just return a generic name instead of the ID
    return "Folder";
  } catch (e) {
    // Fallback to a generic name
    return "Folder";
  }
}

// Function to remove a tab from a folder
async function removeTabFromFolder(folderId, tabIndex) {
  try {
    // Get the folder
    const folder = await folderService.getFolderById(folderId);
    if (!folder || !folder.tabs) return;

    // Create a new array without the tab at tabIndex
    const updatedTabs = folder.tabs.filter((_, index) => index !== tabIndex);

    // Update the folder
    await folderService.updateFolder(folderId, { tabs: updatedTabs });

    // Show success message
    showSnackbar("Tab removed from folder");

    // Refresh the folder preview
    await viewFolderContents(folderId);
  } catch (error) {
    console.error("Error removing tab:", error);
    showSnackbar("Error removing tab");
  }
}

/**
 * Adds tabs to the specified folder based on the "Show selected" toggle state
 * @param {string} folderId - ID of folder to add tabs to
 */
export async function addSelectedTabsToFolder(folderId) {
  try {
    // Get the folder
    const folder = await folderService.getFolderById(folderId);
    if (!folder) {
      showSnackbar("Folder not found");
      return;
    }

    // Get the show selected only toggle state
    const showSelectedOnlyToggle = document.getElementById("showSelectedOnly");
    const isShowSelectedOnly = showSelectedOnlyToggle
      ? showSelectedOnlyToggle.checked
      : false;

    // Get tabs based on the toggle state
    let tabs = [];
    let selectionMessage = "";

    if (isShowSelectedOnly) {
      // Add only selected tabs when toggle is on
      tabs = await browser.tabs.query({
        currentWindow: true,
        highlighted: true,
      });
      selectionMessage = "selected";
    } else {
      // Add all tabs when toggle is off
      tabs = await browser.tabs.query({
        currentWindow: true,
      });
      selectionMessage = "all";
    }

    if (!tabs || tabs.length === 0) {
      showSnackbar("No tabs to add");
      return;
    }

    // Add tabs to folder
    const updatedFolder = await folderService.addTabsToFolder(folderId, tabs);

    // Update UI
    await renderFolderList();

    // Show success message
    showSnackbar(
      `Added ${tabs.length} ${selectionMessage} tab(s) to "${folder.name}"`
    );
  } catch (error) {
    console.error("Error adding tabs to folder:", error);
    showSnackbar("Error adding tabs to folder");
  }
}
