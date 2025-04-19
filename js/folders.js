/**
 * folders.js - Service for managing folders
 */

import { loadFromStorage, saveToStorage, generateUniqueId } from "./utils.js";

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

// Folder state
let folders = [];

/**
 * Loads all folders from storage
 * @returns {Promise<Folder[]>}
 */
export async function loadFolders() {
  try {
    const result = await loadFromStorage("folders");
    folders = result.folders || [];
    return folders;
  } catch (error) {
    console.error("Error loading folders:", error);
    return [];
  }
}

/**
 * Saves folders to storage
 * @returns {Promise<void>}
 */
export async function saveFolders() {
  try {
    await saveToStorage({ folders });
  } catch (error) {
    console.error("Error saving folders:", error);
  }
}

/**
 * Gets a folder by ID
 * @param {string} folderId - Folder ID to find
 * @returns {Folder|null} - Found folder or null
 */
export async function getFolderById(folderId) {
  // Always reload folders to ensure we have the most up-to-date data
  await loadFolders();

  const folder = folders.find((f) => f.id === folderId) || null;
  if (!folder) {
    console.warn(`Folder with ID ${folderId} not found in storage`);
  }

  return folder;
}

/**
 * Generates a unique ID for a new folder
 * @returns {string}
 */
function generateFolderId() {
  return generateUniqueId("folder_");
}

/**
 * Creates a new folder
 * @param {string} name - Folder name
 * @param {Tab[]} tabs - Initial tabs to add
 * @returns {Folder}
 */
export async function createFolder(name, tabs = []) {
  // Load folders first to ensure we have the latest data
  await loadFolders();

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
export async function updateFolder(folderId, updates) {
  // Load folders first to ensure we have the latest data
  await loadFolders();

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
export async function addTabsToFolder(folderId, tabs) {
  // Load folders first to ensure we have the latest data
  await loadFolders();

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
export async function deleteFolder(folderId) {
  // Load folders first to ensure we have the latest data
  await loadFolders();

  const index = folders.findIndex((f) => f.id === folderId);
  if (index === -1) return false;

  folders.splice(index, 1);
  await saveFolders();
  return true;
}

/**
 * Converts a Chrome tab to our compact tab format
 * @param {browser.tabs.Tab} chromeTab
 * @returns {Tab}
 */
export function chromeTabToCompactTab(chromeTab) {
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
export function compactTabToReadable(compactTab) {
  return {
    title: compactTab.t || "",
    url: compactTab.u || "",
    favIconUrl: compactTab.f || "",
  };
}
