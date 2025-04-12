# Kaminari Extension

A browser extension that helps you easily copy tab links from your browser in various formats.


## Download

### Chrome Version
Coming soon to Chrome Web Store

### Firefox Version
Available on [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/kaminari/)


## Branches

### Main Branch
Contains the Chrome version of the extension

### Firefox Branch 
Contains the Firefox-specific version of the extension with required manifest v2 compatibility changes


## Features

- **Copy All Tabs**: Copy links from all tabs in the current window
- **Copy Selected Tabs**: Copy links from only the selected tabs
- **Format Options**:
  - Include/exclude tab titles
  - Include/exclude URLs
  - Format as Markdown or plain text
  - Customizable templates with placeholders
- **Organization Features**:
  - Sort tabs by position
  - Group tabs by domain with automatic headers
  - Toggle between showing all tabs or only selected tabs
- **Live Preview**: See how your tabs will be formatted before copying
- **Instant Copy**: Automatically copies formatted tab links to clipboard
- **User-Friendly Interface**: Clean, intuitive design with a dark theme

## How to Use

1. Click the Kaminari extension icon in your browser
2. Adjust formatting options as needed:
   - Toggle "Include Tab Titles" to include/exclude page titles
   - Toggle "Include URLs" to include/exclude the actual URLs
   - Toggle "Format as Markdown" to switch between Markdown and plain text
   - Customize the format templates if needed
3. Select tabs in your browser to work with specific tabs:
   - The preview section will show a toggle to switch between viewing all tabs or only selected tabs
   - Toggle "Show selected" to focus on just your selected tabs
4. Open settings to access additional options:
   - Enable/disable sorting by tab position
   - Enable/disable grouping by domain
5. Click "Copy All Tabs" to copy all open tabs in the current window
6. Or click "Copy Selected Tabs" to copy only the tabs you've selected
7. The formatted links will be automatically copied to your clipboard

## Format Templates

Kaminari uses customizable templates with these placeholders:
- `{{title}}`: The title of the tab
- `{{url}}`: The URL of the tab

Default templates:
- Markdown: `- [{{title}}]({{url}})`
- Plain text: `{{title}} - {{url}}`

When grouping by domain is enabled, domain headers are automatically added in the format:
- Markdown: `## domain.com`
- Plain text: `domain.com`

## Examples

### Markdown Format Examples

#### Basic Bulleted List