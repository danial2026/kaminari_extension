# Kaminari Extension

A browser extension that helps you easily copy tab links from your browser in various formats.


## Download

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
```
- [{{title}}]({{url}})
```
Output:
```
- [GitHub: Where the world builds software](https://github.com)
- [Stack Overflow - Where Developers Learn, Share, & Build Careers](https://stackoverflow.com)
```

#### Numbered List
```
1. [{{title}}]({{url}})
```
Output:
```
1. [GitHub: Where the world builds software](https://github.com)
2. [Stack Overflow - Where Developers Learn, Share, & Build Careers](https://stackoverflow.com)
```

#### Task List
```
- [ ] [{{title}}]({{url}})
```
Output:
```
- [ ] [GitHub: Where the world builds software](https://github.com)
- [ ] [Stack Overflow - Where Developers Learn, Share, & Build Careers](https://stackoverflow.com)
```

#### With Group By Domain Enabled
When grouping is enabled, domains are automatically added as headers:
```
## github.com
- [GitHub: Where the world builds software](https://github.com)
- [GitHub - microsoft/vscode: Visual Studio Code](https://github.com/microsoft/vscode)

## stackoverflow.com
- [Stack Overflow - Where Developers Learn, Share, & Build Careers](https://stackoverflow.com)
```

### Plain Text Examples

#### Basic URL List
```
{{url}}
```
Output:
```
https://github.com
https://stackoverflow.com
```

#### Title and URL
```
{{title}} - {{url}}
```
Output:
```
GitHub: Where the world builds software - https://github.com
Stack Overflow - Where Developers Learn, Share, & Build Careers - https://stackoverflow.com
```

#### URLs with Numbers
```
{{@index}}. {{url}}
```
Output:
```
1. https://github.com
2. https://stackoverflow.com
```

#### Custom Format for Documentation
```
URL: {{url}}
Title: {{title}}
---
```
Output:
```
URL: https://github.com
Title: GitHub: Where the world builds software
---
URL: https://stackoverflow.com
Title: Stack Overflow - Where Developers Learn, Share, & Build Careers
---
```

### Use Cases

1. **Research Collection**: Use Markdown format to create a list of reference links for research
2. **Sharing Resources**: Copy links to share with colleagues or friends
3. **Documentation**: Create formatted documentation with links to relevant resources
4. **Bookmarking**: Save a backup of your current browsing session
5. **Project Management**: Create task lists with links to project resources

## Installation

1. Download the extension from [Chrome Web Store](#) (coming soon)
2. Click "Add to Chrome"
3. The Kaminari icon will appear in your browser toolbar

## Privacy & Security

- All operations happen locally in your browser
- No data is ever sent to servers or stored online
- No tracking or analytics
- Open source - verify the code yourself

## Related Links

- [Source Code](https://github.com/danial2026/kaminari_extension)
- [Developer Website](https://danials.space)
- [Contact Developer](https://danials.space/contact)

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

This project is open source and available under the [GNU GENERAL PUBLIC LICENSE](LICENSE).