/**
 * tabs-formatter.js - Functions for formatting tabs
 */

import { formatWithTemplate } from "./utils.js";

/**
 * Extracts domain from a URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Extracted domain
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return "";
  }
}

/**
 * Process tabs before displaying or formatting
 * @param {Array} tabs - Array of tab objects
 * @param {Object} options - Processing options
 * @returns {Array} - Processed tabs
 */
export function processTabs(tabs, options = {}) {
  const {
    sortByPosition = false,
    groupByDomain = false,
    showSelectedOnly = false,
    selectedTabs = [],
  } = options;

  // Filter tabs if showSelectedOnly is enabled
  let processedTabs = tabs;
  if (showSelectedOnly && selectedTabs.length > 0) {
    const selectedIds = selectedTabs.map((tab) => tab.id);
    processedTabs = tabs.filter((tab) => selectedIds.includes(tab.id));
  }

  // Sort tabs
  if (sortByPosition) {
    processedTabs = [...processedTabs].sort((a, b) => a.index - b.index);
  }

  // Group tabs by domain
  if (groupByDomain) {
    // Extract unique domains
    const domains = [
      ...new Set(processedTabs.map((tab) => extractDomain(tab.url || ""))),
    ];

    // Create groups for each domain
    const domainGroups = domains.map((domain) => {
      const domainTabs = processedTabs.filter(
        (tab) => extractDomain(tab.url || "") === domain
      );
      return {
        domain,
        tabs: domainTabs,
      };
    });

    return domainGroups;
  }

  return processedTabs;
}

/**
 * Format tabs according to user preferences
 * @param {Array} tabs - Array of tab objects
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted text
 */
export function formatTabs(tabs, options = {}) {
  const {
    includeTitles = true,
    formatMarkdown = true,
    formatTemplate = "[{{title}}]({{url}})",
    plainTextTemplate = "{{title}} - {{url}}",
    groupByDomain = false,
  } = options;

  if (!tabs || tabs.length === 0) {
    return "";
  }

  // If no title to include and we can't use URLs in the template, return empty string
  if (!includeTitles) {
    return "";
  }

  // Handle domain groups if groupByDomain is true
  if (groupByDomain && tabs[0] && tabs[0].domain) {
    return tabs
      .map((group) => {
        const domainHeader = formatMarkdown
          ? `## ${group.domain || "Unknown Domain"}\n\n`
          : `${group.domain || "Unknown Domain"}\n\n`;

        const formattedTabs = group.tabs
          .map((tab) =>
            formatSingleTab(
              tab,
              includeTitles,
              formatMarkdown,
              formatTemplate,
              plainTextTemplate
            )
          )
          .join("\n");

        return `${domainHeader}${formattedTabs}`;
      })
      .join("\n\n");
  }

  // Regular tab formatting
  return tabs
    .map((tab) =>
      formatSingleTab(
        tab,
        includeTitles,
        formatMarkdown,
        formatTemplate,
        plainTextTemplate
      )
    )
    .join("\n");
}

/**
 * Format a single tab according to user preferences
 * @param {Object} tab - Tab object
 * @param {boolean} includeTitles - Whether to include titles
 * @param {boolean} formatMarkdown - Whether to format as Markdown
 * @param {string} formatTemplate - Template for Markdown formatting
 * @param {string} plainTextTemplate - Template for plain text formatting
 * @returns {string} - Formatted tab text
 */
export function formatSingleTab(
  tab,
  includeTitles,
  formatMarkdown,
  formatTemplate,
  plainTextTemplate
) {
  // Prepare tab data
  const title = tab.title || "";
  const url = tab.url || "";

  // Only include title if requested, but always include URL
  if (!includeTitles) {
    // Return formatted URL if titles should not be included
    return formatMarkdown ? `<${url}>` : url;
  }

  // Format according to selected format
  if (formatMarkdown) {
    // Use the Markdown template
    return formatWithTemplate(formatTemplate, { title, url });
  } else {
    // Use the plain text template
    return formatWithTemplate(plainTextTemplate, { title, url });
  }
}

/**
 * Generate an example of formatted output
 * @param {Object} options - Formatting options
 * @returns {string} - Example formatted text
 */
export function generateFormatExample(options = {}) {
  const {
    includeTitles = true,
    formatMarkdown = true,
    formatTemplate = "[{{title}}]({{url}})",
    plainTextTemplate = "{{title}} - {{url}}",
  } = options;

  const sampleTab = {
    title: "Example Website",
    url: "https://example.com",
  };

  return formatSingleTab(
    sampleTab,
    includeTitles,
    formatMarkdown,
    formatTemplate,
    plainTextTemplate
  );
}
