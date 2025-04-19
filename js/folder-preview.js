import { getFolderById, updateFolder } from "./folders.js";

// Function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Function to show snackbar notification
function showSnackbar(message) {
  const snackbar = document.createElement("div");
  snackbar.className = "snackbar";
  snackbar.textContent = message;
  document.body.appendChild(snackbar);

  // Show the snackbar
  setTimeout(() => {
    snackbar.classList.add("show");
  }, 100);

  // After 3 seconds, remove the snackbar
  setTimeout(() => {
    snackbar.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(snackbar);
    }, 300);
  }, 3000);
}

// Function to render folder info
function renderFolderInfo(folder) {
  const folderInfoEl = document.getElementById("folderInfo");
  const createdDate = formatDate(folder.createdAt);

  folderInfoEl.innerHTML = `
    <div class="folder-name">${folder.name || "Unnamed Folder"}</div>
    <div class="folder-meta">
      Created on ${createdDate} • ${folder.tabs.length} tabs
    </div>
  `;
}

// Function to remove a tab from a folder
async function removeTabFromFolder(folderId, tabIndex) {
  try {
    // Get the folder
    const folder = await getFolderById(folderId);
    if (!folder || !folder.tabs) return;

    // Create a new array without the tab at tabIndex
    const updatedTabs = folder.tabs.filter((_, index) => index !== tabIndex);

    // Update the folder
    await updateFolder(folderId, { tabs: updatedTabs });

    // Show success message
    showSnackbar("Tab removed from folder");

    // Reload folder and refresh the view
    const updatedFolder = await getFolderById(folderId);
    if (updatedFolder) {
      renderFolderInfo(updatedFolder);
      renderTabs(updatedFolder.tabs, folderId);
    }
  } catch (error) {
    console.error("Error removing tab:", error);
    showSnackbar("Error removing tab");
  }
}

// Function to render tabs
function renderTabs(tabs, folderId) {
  const tabListEl = document.getElementById("tabList");

  if (!tabs || tabs.length === 0) {
    tabListEl.innerHTML = "";
    tabListEl.appendChild(createEmptyState());
    return;
  }

  tabListEl.innerHTML = "";
  tabs.forEach((tab, index) => {
    const tabItem = document.createElement("div");
    tabItem.className = "tab-item";

    // Create tab content with delete button
    tabItem.innerHTML = `
      <img src="${tab.f || "../icons/link.svg"}" class="tab-favicon" 
           onerror="this.src='../icons/link.svg'" />
      <div class="tab-content">
        <div class="tab-title">${tab.t || "Untitled"}</div>
        <div class="tab-url">${tab.u}</div>
      </div>
      <button class="tab-remove-btn" title="Remove from folder">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    `;

    // Get delete button and add click event
    const deleteBtn = tabItem.querySelector(".tab-remove-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent opening the tab
      removeTabFromFolder(folderId, index);
    });

    // Add click event to open the tab
    tabItem.addEventListener("click", () => {
      window.open(tab.u, "_blank");
    });

    tabListEl.appendChild(tabItem);
  });
}

// Create empty state
const createEmptyState = () => {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";

  const heading = document.createElement("h3");
  heading.textContent = "No Tabs in This Folder";

  const paragraph = document.createElement("p");
  paragraph.textContent =
    "When you add tabs to this folder, they will appear here. Add tabs using the extension popup on any webpage.";

  emptyState.appendChild(heading);
  emptyState.appendChild(paragraph);

  return emptyState;
};

// Main function to load and display folder
async function loadFolder() {
  try {
    // Get folder ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const folderId = urlParams.get("folderId");

    if (!folderId) {
      throw new Error("No folder ID provided");
    }

    const folder = await getFolderById(folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    // Update page title
    document.title = `${folder.name} - Kaminari`;

    // Render folder information and tabs
    renderFolderInfo(folder);
    renderTabs(folder.tabs, folderId);
  } catch (error) {
    console.error("Error loading folder:", error);
    document.getElementById("folderInfo").style.display = "none";

    const errorState = document.createElement("div");
    errorState.className = "empty-state";

    const heading = document.createElement("h3");
    heading.textContent = "Folder Not Found";

    const paragraph = document.createElement("p");
    paragraph.textContent = `${error.message}. Please check the URL or return to the extension.`;

    errorState.appendChild(heading);
    errorState.appendChild(paragraph);

    const tabListEl = document.getElementById("tabList");
    tabListEl.innerHTML = "";
    tabListEl.appendChild(errorState);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", loadFolder);
