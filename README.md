# Kaminari Extension

A browser extension that helps you easily copy tab links from your browser in various formats.


## Install

### Chrome Version
Available on [Chrome Web Store](https://chromewebstore.google.com/detail/kaminari/dmbbdjlpadjgnoolmlpodepoimflnolf)

### Firefox Version
Available on [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/kaminari/)


## Branches

### Main Branch (Chrome)
Contains the Chrome version of the extension

### Firefox Branch 
Contains the Firefox-specific version of the extension with required manifest v2 compatibility changes


## Changelog

### Version 0.1.x
- 0.1.0 (Initial commit - e504961)
- Core tab links copy utility functionality
- Basic popup interface
- Customizable formatting (Markdown/plain text)
- Tab filtering capabilities
- Additional 0.1.x features:
- Keyboard shortcut for copying all tab links (e9aaf65)
- Enhanced filtering to exclude browser-specific URLs (750aff6)
- Added icons and updated manifest (6aeb204, 17c8ec6)
- Build script for Chrome packaging (98fd8c6)

### Version 0.2.0 (1514f97)
- Enhanced error handling for tab selection/clipboard operations
- Folder management features
- Improved UI with privacy policy and terms sections
- Added data compression with LZString library
- QR code generation capabilities
- Web accessible resources support

### Version 0.3.0 (06b65cc)
- Refactored clipboard functionality with modular operations
- New UI components for folder management and settings
- Modal interfaces for creating/sharing folders
- Updated Content Security Policy
- Improved styling for popup and settings interfaces
- Format removal functionality enhancements (dd4842d)

### Version 0.4.0 (ff4c488)
- Cross-browser compatibility support
- Custom confirm dialog for user interactions
- New folder preview feature in the UI
- Updated manifest version to reflect these changes


## Features

- **Tab Management**:
  - Copy links from all tabs or selected tabs
  - Save collections of tabs to folders for later use
  - Preview tab collections before copying
  - Cross-browser compatibility (Chrome and Firefox)

- **Format Customization**:
  - Toggle between Markdown and plain text formatting
  - Include or exclude tab titles and URLs
  - Customizable templates with placeholders
  - Save your favorite formatting presets

- **Organization Options**:
  - Sort tabs by position in the browser
  - Group tabs by domain with automatic headers
  - Filter views to show all or selected tabs
  - Folder management for saved tab collections

- **Sharing Capabilities**:
  - Instant clipboard copy
  - QR code generation for tab collections
  - Share collections with compressed data URLs

- **User Experience**:
  - Clean, intuitive interface with dark theme
  - Live preview of formatted output
  - Keyboard shortcuts for common actions
  - Custom confirmation dialogs

## How to Use

1. **Basic Operation**:
   - Click the Kaminari extension icon in your browser
   - Adjust formatting options using the toggles and selectors
   - Click "Copy All Tabs" or "Copy Selected Tabs" to copy to clipboard

2. **Saving Tab Collections**:
   - Open the folder management panel
   - Name your collection and click "Save Current Tabs"
   - View and manage saved collections in the folders list

3. **Customizing Output Format**:
   - Toggle between Markdown and plain text using the format selector
   - Enable/disable tab titles and URLs with the respective toggles
   - Edit the format template to customize the output appearance
   - Preview your changes in real-time

4. **Sharing Collections**:
   - Select a saved folder and click "Share"
   - Choose between clipboard text, QR code, or compressed URL
   - Use the provided link or QR code to share with others

5. **Advanced Settings**:
   - Access the settings panel for additional options
   - Configure domain grouping and tab sorting preferences
   - Set keyboard shortcuts for quick access to features
   - Manage data and privacy settings

## Use Cases

1. **Research Collection**: Save and organize research sources by topic
2. **Project Management**: Group and share resource links with team members
3. **Content Creation**: Compile reference materials for articles or documentation
4. **Bookmark Management**: Create portable backups of important browser sessions
5. **Knowledge Sharing**: Easily share curated link collections with colleagues

## Related Links

- [Developer Website](https://danials.space)
- [Contact Developer](https://danials.space/contact)

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

This project is open source and available under the [GNU GENERAL PUBLIC LICENSE](LICENSE).