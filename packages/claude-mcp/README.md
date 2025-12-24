# Nanobrowser Claude MCP Server

A Model Context Protocol (MCP) server that exposes Nanobrowser's browser automation capabilities to Claude AI, enabling intelligent web automation and interaction.

## Overview

This MCP server allows Claude to:
- Navigate and interact with web pages
- Extract information from websites
- Fill forms and submit data
- Take screenshots and analyze page content
- Execute complex multi-step browser automation tasks
- Manage browser tabs and sessions

## Installation

```bash
cd packages/claude-mcp
pnpm install
pnpm build
```

## Configuration

### For Claude Desktop

Add to your Claude Desktop MCP configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "nanobrowser": {
      "command": "node",
      "args": [
        "/path/to/nanobrowser/packages/claude-mcp/dist/index.js"
      ],
      "env": {
        "NANOBROWSER_WS_URL": "ws://localhost:9222",
        "NANOBROWSER_HTTP_URL": "http://localhost:8080"
      }
    }
  }
}
```

### For VS Code / Cline

Add to your `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "nanobrowser": {
      "command": "node",
      "args": [
        "/path/to/nanobrowser/packages/claude-mcp/dist/index.js"
      ],
      "env": {
        "NANOBROWSER_WS_URL": "ws://localhost:9222",
        "NANOBROWSER_HTTP_URL": "http://localhost:8080"
      }
    }
  }
}
```

## Available Tools

### Navigation Tools
- `navigate_to_url` - Navigate to a URL
- `go_back` - Go back in browser history
- `go_forward` - Go forward in browser history
- `refresh_page` - Refresh the current page

### DOM Interaction Tools
- `click_element` - Click on an element
- `type_text` - Type text into an input field
- `get_element_text` - Get text content of an element
- `get_element_attribute` - Get an element's attribute
- `select_dropdown` - Select an option from a dropdown
- `check_checkbox` - Check or uncheck a checkbox

### Page Information Tools
- `get_page_state` - Get current page state (URL, title, DOM)
- `get_clickable_elements` - Get all clickable elements
- `take_screenshot` - Take a screenshot
- `execute_javascript` - Execute custom JavaScript

### Scrolling Tools
- `scroll_page` - Scroll the page
- `scroll_to_element` - Scroll to make an element visible

### Wait Tools
- `wait_for_element` - Wait for an element to appear
- `wait_for_navigation` - Wait for navigation to complete

### Form Tools
- `fill_form` - Fill multiple form fields at once

### Tab Management
- `open_new_tab` - Open a new browser tab
- `close_tab` - Close the current tab
- `switch_tab` - Switch to a different tab
- `list_tabs` - List all open tabs

### Task Execution
- `execute_task` - Execute a high-level task using Nanobrowser's AI agents

## Available Resources

- `nanobrowser://page/current` - Current page state (JSON)
- `nanobrowser://page/screenshot` - Current page screenshot (PNG)
- `nanobrowser://page/dom` - Page DOM structure (JSON)
- `nanobrowser://tabs/list` - List of all open tabs (JSON)

## Usage Examples

### With Claude Desktop

Once configured, you can ask Claude to perform browser automation tasks:

```
"Can you navigate to google.com and search for 'Model Context Protocol'?"

"Please go to example.com/login and fill out the login form with username 'test@example.com'"

"Take a screenshot of the current page and describe what you see"

"List all the clickable links on this page"
```

### Programmatic Usage

```typescript
import { ClaudeMCPServer } from '@extension/claude-mcp';

const server = new ClaudeMCPServer();
await server.run();
```

## Architecture

```
┌─────────────────┐
│   Claude AI     │
└────────┬────────┘
         │ MCP Protocol
┌────────▼────────┐
│  Claude MCP     │
│    Server       │
└────────┬────────┘
         │ WebSocket/HTTP
┌────────▼────────┐
│  Nanobrowser    │
│   Extension     │
└────────┬────────┘
         │ Chrome DevTools Protocol
┌────────▼────────┐
│   Browser       │
└─────────────────┘
```

## Requirements

- Node.js >= 22.12.0
- Nanobrowser extension installed and running
- Chrome/Edge browser
- MCP-compatible AI client (Claude Desktop, VS Code with Cline, etc.)

## Development

```bash
# Watch mode for development
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Environment Variables

- `NANOBROWSER_WS_URL` - WebSocket URL for Nanobrowser extension (default: `ws://localhost:9222`)
- `NANOBROWSER_HTTP_URL` - HTTP URL for Nanobrowser API (default: `http://localhost:8080`)

## Security Considerations

- The MCP server communicates with your local browser
- Only accepts connections from localhost by default
- Ensure your browser extension is from a trusted source
- Review automation scripts before execution

## Troubleshooting

### Connection Issues

If Claude cannot connect to the browser:

1. Ensure Nanobrowser extension is installed and running
2. Check that the browser is open
3. Verify the WebSocket URL and port are correct
4. Check browser console for error messages

### Tool Execution Failures

- Verify selectors are correct using browser DevTools
- Ensure pages are fully loaded before interacting
- Check for CORS or content security policy issues
- Use `wait_for_element` before interacting with dynamic content

## License

MIT

## Contributing

Contributions are welcome! Please see the main Nanobrowser repository for contribution guidelines.

## Related Packages

- `@extension/security-mcp` - Security testing MCP server with Burp Suite integration
- Main Nanobrowser extension - Browser automation and AI agents

## Support

For issues and questions:
- GitHub Issues: https://github.com/nanobrowser/nanobrowser/issues
- Documentation: https://docs.nanobrowser.ai

