/**
 * browser-polyfill.js - Compatibility layer for Chrome and Firefox extensions
 *
 * This polyfill makes browser.* APIs available as browser.* APIs and vice versa
 * to ensure extension code works consistently across browsers.
 */

(function () {
  "use strict";

  if (
    typeof globalThis.browser === "undefined" &&
    typeof globalThis.browser !== "undefined"
  ) {
    // Chrome environment - expose Chrome APIs as browser.*
    globalThis.browser = {
      // Core APIs
      runtime: browser.runtime,
      tabs: browser.tabs,
      storage: browser.storage,
      scripting: browser.scripting,
      commands: browser.commands,

      // Expose action as browserAction for compatibility
      action: browser.action,
    };
  } else if (
    typeof globalThis.browser === "undefined" &&
    typeof globalThis.browser !== "undefined"
  ) {
    // Firefox environment - expose Firefox APIs as browser.*
    globalThis.browser = {
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
  if (globalThis.browser) {
    // Add lastError for Firefox
    if (!globalThis.browser.runtime.lastError) {
      Object.defineProperty(globalThis.browser.runtime, "lastError", {
        get: function () {
          return null;
        },
      });
    }
  }
})();
