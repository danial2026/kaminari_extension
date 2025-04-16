/**
 * share.js - Functions for sharing and retrieving shared content
 */

import { encrypt, decrypt } from "./encryption.js";
import { createElement, showSnackbar } from "./utils.js";

// Base URL for sharing
const SHARE_BASE_URL = "https://danials.space/share.html";

/**
 * Generates a shareable URL for a folder
 * @param {Object} folder - The folder object to share
 * @param {string} password - Password to encrypt the folder data
 * @returns {Promise<string>} - The shareable URL
 */
export async function generateShareURL(folder, password) {
  // Convert folder to JSON string
  const folderData = JSON.stringify(folder);

  // Encrypt the data
  const encrypted = await encrypt(folderData, password);

  // Convert the encrypted payload to JSON and then to base64url
  const payload = JSON.stringify(encrypted);
  const payloadBase64 = btoa(payload)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Create the shareable URL using the external share.html page
  return `https://danials.space/share.html#data=${payloadBase64}`;
}

/**
 * Retrieves and decrypts shared folder data from URL hash
 * @param {string} encryptedHash - The encrypted hash from URL
 * @param {string} password - Password to decrypt data
 * @returns {Promise<Object>} - The decrypted folder data
 */
export async function retrieveSharedData(encryptedHash, password) {
  if (!encryptedHash || !password) {
    throw new Error("Encrypted data and password are required");
  }

  try {
    // Decrypt the data
    const decryptedJson = await decrypt(encryptedHash, password);
    const folderData = JSON.parse(decryptedJson);

    return folderData;
  } catch (error) {
    console.error("Error retrieving shared data:", error);
    throw new Error(
      "Failed to decrypt shared data. Check your password and try again."
    );
  }
}

/**
 * Renders shared folder content in the UI
 * @param {Object} folderData - The decrypted folder data
 * @param {HTMLElement} container - The container to render content in
 */
export function renderSharedContent(folderData, container) {
  if (!folderData || !container) {
    console.error("Folder data and container are required");
    return;
  }

  try {
    // Clear container
    container.innerHTML = "";

    // Create folder header
    const header = createElement(
      "div",
      { className: "shared-header" },
      {},
      `
        <h2>${folderData.name}</h2>
        <div class="shared-meta">
          Shared ${new Date(folderData.timestamp).toLocaleDateString()}
        </div>
      `
    );
    container.appendChild(header);

    // Create tabs list
    const tabsList = createElement("div", { className: "shared-tabs-list" });

    if (folderData.tabs && folderData.tabs.length > 0) {
      folderData.tabs.forEach((tab) => {
        const tabItem = createElement("div", { className: "shared-tab-item" });

        // Create favicon
        const favicon = createElement("img", {
          className: "shared-tab-favicon",
          src: tab.favIconUrl || "icons/link.svg",
        });

        favicon.onerror = () => {
          favicon.src = "icons/link.svg";
        };

        // Create link
        const link = createElement("a", {
          className: "shared-tab-link",
          href: tab.url,
          target: "_blank",
          rel: "noopener noreferrer",
          textContent: tab.title || tab.url,
        });

        // Assemble tab item
        tabItem.appendChild(favicon);
        tabItem.appendChild(link);
        tabsList.appendChild(tabItem);
      });
    } else {
      tabsList.innerHTML =
        '<div class="shared-empty">No tabs in this folder</div>';
    }

    container.appendChild(tabsList);

    // Add open all button if there are tabs
    if (folderData.tabs && folderData.tabs.length > 0) {
      const openAllBtn = createElement("button", {
        className: "shared-open-all-btn",
        textContent: "Open All Tabs",
      });

      openAllBtn.addEventListener("click", () => {
        folderData.tabs.forEach((tab) => {
          window.open(tab.url, "_blank");
        });
      });

      container.appendChild(openAllBtn);
    }
  } catch (error) {
    console.error("Error rendering shared content:", error);
    container.innerHTML =
      '<div class="error">Error displaying shared content</div>';
  }
}

/**
 * Initializes the share page from URL hash
 * @param {HTMLElement} container - The container to render content in
 * @param {HTMLElement} passwordForm - The password form element
 * @param {HTMLElement} loadingIndicator - The loading indicator element
 */
export function initSharePage(container, passwordForm, loadingIndicator) {
  // Check if there's encrypted data in the URL
  const hashData = window.location.hash.substring(1);

  if (!hashData) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>No Shared Content</h2>
        <p>This page is used to view shared tab collections.</p>
      </div>
    `;
    passwordForm.style.display = "none";
    return;
  }

  // Show password form
  passwordForm.style.display = "block";

  // Handle password submission
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const passwordInput = passwordForm.querySelector('input[type="password"]');
    const password = passwordInput.value.trim();

    if (!password) {
      showSnackbar("Please enter the password");
      return;
    }

    try {
      // Show loading
      loadingIndicator.style.display = "block";
      container.style.display = "none";

      // Decrypt and retrieve data
      const decryptedData = await retrieveSharedData(hashData, password);

      // Render content
      renderSharedContent(decryptedData, container);

      // Hide password form and loading indicator
      passwordForm.style.display = "none";
      loadingIndicator.style.display = "none";
      container.style.display = "block";
    } catch (error) {
      // Hide loading indicator
      loadingIndicator.style.display = "none";
      container.style.display = "block";

      // Show error
      showSnackbar(error.message || "Failed to decrypt shared data");
      passwordInput.value = "";
      passwordInput.focus();
    }
  });
}
