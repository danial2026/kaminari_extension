/**
 * browser-polyfill.js - Compatibility layer for Chrome and Firefox extensions
 *
 * This polyfill makes chrome.* APIs available as browser.* APIs and vice versa
 * to ensure extension code works consistently across browsers.
 */

(function () {
  "use strict";

  if (
    typeof globalThis.browser === "undefined" &&
    typeof globalThis.chrome !== "undefined"
  ) {
    // Chrome environment - expose Chrome APIs as browser.*
    globalThis.browser = {
      // Core APIs
      runtime: chrome.runtime,
      tabs: chrome.tabs,
      storage: chrome.storage,
      scripting: chrome.scripting,
      commands: chrome.commands,

      // Expose action as browserAction for compatibility
      action: chrome.action,
    };
  } else if (
    typeof globalThis.chrome === "undefined" &&
    typeof globalThis.browser !== "undefined"
  ) {
    // Firefox environment - expose Firefox APIs as chrome.*
    globalThis.chrome = {
      // Core APIs
      runtime: browser.runtime,
      tabs: browser.tabs,
      storage: browser.storage,
      scripting: browser.scripting,
      commands: browser.commands,

      // Expose browserAction as action for compatibility
      action: browser.browserAction || browser.action,
    };
  }

  // Ensure promises work consistently across browsers
  if (globalThis.chrome) {
    // Add lastError for Firefox
    if (!globalThis.chrome.runtime.lastError) {
      Object.defineProperty(globalThis.chrome.runtime, "lastError", {
        get: function () {
          return null;
        },
      });
    }
  }
})();
