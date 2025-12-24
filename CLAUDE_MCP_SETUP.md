# Claude MCP Integration Setup Guide

Complete guide to integrating Nanobrowser with Claude AI through Model Context Protocol (MCP).

## Overview

The Claude MCP integration allows Claude AI to directly control Nanobrowser for intelligent web automation, data extraction, form filling, and complex multi-step browser tasks.

## What Can Claude Do?

With this integration, Claude can:
- ✅ Navigate websites and follow links
- ✅ Extract information from web pages
- ✅ Fill out and submit forms
- ✅ Click buttons and interact with UI elements
- ✅ Take screenshots and analyze visual content
- ✅ Execute JavaScript in page context
- ✅ Manage multiple browser tabs
- ✅ Wait for elements and handle dynamic content
- ✅ Perform complex multi-step automation workflows

## Prerequisites

- ✅ Node.js >= 22.12.0
- ✅ Nanobrowser extension installed in Chrome/Edge
- ✅ Claude Desktop App OR VS Code with Cline extension
- ✅ pnpm package manager

## Quick Start

### 1. Build the Claude MCP Server

```bash
cd packages/claude-mcp
pnpm install
pnpm build
```

### 2. Configure Claude Desktop

#### macOS
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Windows
Edit: `%APPDATA%\Claude\claude_desktop_config.json`

#### Linux
Edit: `~/.config/Claude/claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "nanobrowser": {
      "command": "node",
      "args": [
        "/absolute/path/to/nanobrowser/packages/claude-mcp/dist/index.js"
      ],
      "env": {
        "NANOBROWSER_WS_URL": "ws://localhost:9222",
        "NANOBROWSER_HTTP_URL": "http://localhost:8080"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/nanobrowser` with your actual installation path.

### 3. Configure VS Code (Optional - for Cline)

Create or edit `.vscode/mcp.json` in your project:

```json
{
  "mcpServers": {
    "nanobrowser": {
      "command": "node",
      "args": [
        "/absolute/path/to/nanobrowser/packages/claude-mcp/dist/index.js"
      ],
      "env": {
        "NANOBROWSER_WS_URL": "ws://localhost:9222",
        "NANOBROWSER_HTTP_URL": "http://localhost:8080"
      }
    }
  }
}
```

### 4. Start Nanobrowser Extension

1. Open Chrome/Edge browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Load the Nanobrowser extension from `dist/` directory
5. Ensure the extension is running (check extension icon in toolbar)

### 5. Verify Connection

Restart Claude Desktop or VS Code, then ask Claude:

```
"Can you navigate to example.com and tell me what's on the page?"
```

If configured correctly, Claude will use the Nanobrowser tools to complete the task.

## Available MCP Tools

### Navigation
- **navigate_to_url** - Navigate to any URL
- **go_back** - Navigate back in history
- **go_forward** - Navigate forward in history
- **refresh_page** - Refresh current page

### DOM Interaction
- **click_element** - Click elements by selector
- **type_text** - Type into input fields
- **get_element_text** - Extract text from elements
- **get_element_attribute** - Get element attributes
- **select_dropdown** - Select dropdown options
- **check_checkbox** - Check/uncheck checkboxes

### Page Information
- **get_page_state** - Get current page URL, title, DOM
- **get_clickable_elements** - List all clickable elements
- **take_screenshot** - Capture page screenshots
- **execute_javascript** - Run custom JavaScript

### Scrolling
- **scroll_page** - Scroll up/down/top/bottom
- **scroll_to_element** - Scroll element into view

### Waiting
- **wait_for_element** - Wait for element to appear
- **wait_for_navigation** - Wait for page load

### Forms
- **fill_form** - Fill multiple form fields at once

### Tab Management
- **open_new_tab** - Open new browser tab
- **close_tab** - Close current tab
- **switch_tab** - Switch between tabs
- **list_tabs** - List all open tabs

### AI Task Execution
- **execute_task** - Let Nanobrowser's AI agents handle complex tasks

## Usage Examples

### Example 1: Web Search

```
Claude, please:
1. Navigate to google.com
2. Search for "Model Context Protocol"
3. Take a screenshot of the results
4. List the top 5 result titles
```

### Example 2: Form Filling

```
Please navigate to example.com/contact and fill out the contact form:
- Name: John Doe
- Email: john@example.com
- Message: Testing MCP integration
Then take a screenshot before submitting
```

### Example 3: Data Extraction

```
Go to news.ycombinator.com and extract:
1. The titles of the top 10 posts
2. Their scores
3. The number of comments for each
Format the results as a table
```

### Example 4: Multi-Step Workflow

```
I need you to:
1. Navigate to github.com
2. Search for "nanobrowser"
3. Click on the first repository result
4. Get the README content
5. Summarize what the project does
```

## MCP Resources

Claude can also access these resources directly:

- **nanobrowser://page/current** - Current page state (JSON)
- **nanobrowser://page/screenshot** - Page screenshot (PNG image)
- **nanobrowser://page/dom** - DOM tree structure (JSON)
- **nanobrowser://tabs/list** - All open tabs (JSON)

## Architecture

```
┌──────────────────────────────────────────┐
│          Claude AI Assistant             │
│  (Claude Desktop / VS Code + Cline)      │
└──────────────┬───────────────────────────┘
               │
               │ MCP Protocol
               │ (stdio transport)
               │
┌──────────────▼───────────────────────────┐
│      Claude MCP Server Process           │
│   (packages/claude-mcp/dist/index.js)    │
└──────────────┬───────────────────────────┘
               │
               │ WebSocket / HTTP
               │ (localhost:9222 / 8080)
               │
┌──────────────▼───────────────────────────┐
│    Nanobrowser Chrome Extension          │
│   (Background Service Worker)            │
└──────────────┬───────────────────────────┘
               │
               │ Chrome DevTools Protocol
               │ (CDP via Puppeteer)
               │
┌──────────────▼───────────────────────────┐
│         Chrome/Edge Browser              │
│         (Actual Web Pages)               │
└──────────────────────────────────────────┘
```

## Configuration Options

### Environment Variables

**NANOBROWSER_WS_URL** (default: `ws://localhost:9222`)
- WebSocket URL for real-time communication with extension
- Used for quick commands like click, type, navigate

**NANOBROWSER_HTTP_URL** (default: `http://localhost:8080`)
- HTTP URL for extension API
- Used for long-running tasks like execute_task

### Custom Ports

If you need to use different ports, update both:
1. The MCP configuration (env variables)
2. The Nanobrowser extension settings

## Troubleshooting

### Claude Can't Find Nanobrowser Tools

**Problem**: Claude says it doesn't have access to Nanobrowser tools

**Solutions**:
1. Restart Claude Desktop completely (quit and reopen)
2. Check that the MCP config file path is correct
3. Verify the node path in the config is absolute (not relative)
4. Check Claude Desktop logs: `~/Library/Logs/Claude/mcp.log` (macOS)

### Connection Refused Errors

**Problem**: "Connection refused" or "ECONNREFUSED" errors

**Solutions**:
1. Ensure Nanobrowser extension is installed and active
2. Check that Chrome/Edge browser is running
3. Verify the extension icon appears in the browser toolbar
4. Open browser console (F12) and check for errors
5. Try reloading the extension

### Tools Timeout

**Problem**: Tools time out after 30 seconds

**Solutions**:
1. Ensure the page has fully loaded
2. Use `wait_for_element` before interacting with dynamic content
3. Check for JavaScript errors on the page
4. Try splitting complex tasks into smaller steps

### Selector Not Found

**Problem**: "Element not found" errors

**Solutions**:
1. Use browser DevTools (F12) to verify the selector
2. Wait for dynamic content with `wait_for_element`
3. Try different selector strategies (ID, class, XPath)
4. Check if element is in an iframe
5. Ensure page has fully loaded

### Permission Denied

**Problem**: Cannot interact with certain pages

**Solutions**:
1. Some pages block automation (chrome://, about:, etc.)
2. Check Content Security Policy (CSP) restrictions
3. Verify extension has necessary permissions
4. Try on a different website to isolate the issue

## Security Considerations

- 🔒 MCP server runs locally on your machine
- 🔒 Only accepts localhost connections by default
- 🔒 No data sent to external servers
- 🔒 Claude interacts with your browser directly
- ⚠️ Be cautious when letting Claude execute JavaScript
- ⚠️ Review automation actions before confirming sensitive operations

## Advanced Usage

### Custom Task Execution

Use the `execute_task` tool to let Nanobrowser's AI agents handle complex multi-step workflows:

```
Claude, use the execute_task tool to:
"Book a flight from San Francisco to New York on December 25th,
searching for the cheapest options under $500"
```

This leverages Nanobrowser's Planner, Navigator, and Validator agents.

### Multi-Tab Workflows

```
Claude, please:
1. Open 3 tabs to google.com, bing.com, and duckduckgo.com
2. Search for "AI browser automation" in each
3. Take screenshots of all three
4. Compare the results
```

### Combining with Other MCP Servers

Claude MCP works alongside other MCP servers:

```json
{
  "mcpServers": {
    "nanobrowser": { ... },
    "nanobrowser-security": { ... },
    "filesystem": { ... },
    "github": { ... }
  }
}
```

Claude can then combine capabilities: "Use Nanobrowser to scrape data from the website, then save it to a file using the filesystem MCP"

## Development

### Building from Source

```bash
cd packages/claude-mcp
pnpm install
pnpm build
```

### Development Mode (Watch)

```bash
pnpm dev
```

### Running Tests

```bash
pnpm test
```

### Adding New Tools

1. Add tool definition to `setupHandlers()` in `src/index.ts`
2. Implement handler method
3. Add corresponding method to `BrowserClient` if needed
4. Update documentation
5. Rebuild: `pnpm build`

## Performance Tips

1. **Use Caching**: Page state is cached to reduce redundant operations
2. **Batch Operations**: Use `fill_form` instead of multiple `type_text` calls
3. **Selective DOM**: Set `includeDOM: false` when you don't need DOM tree
4. **Smart Screenshots**: Only capture screenshots when necessary
5. **Parallel Tabs**: Open multiple tabs for parallel scraping

## Limitations

- Cannot automate chrome:// or extension pages
- Some sites may block automation
- CAPTCHA challenges cannot be bypassed
- Rate limiting may apply on some sites
- File downloads require additional handling

## Related Documentation

- [Security MCP Setup](./SECURITY_MCP_INTEGRATION_GUIDE.md)
- [Burp Suite Integration](./BURP_MCP_SETUP.md)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/model-context-protocol)

## Example Scripts

See [examples/claude-mcp/](./examples/claude-mcp/) for sample automation scripts and use cases.

## Support

- **GitHub Issues**: https://github.com/nanobrowser/nanobrowser/issues
- **Discussions**: https://github.com/nanobrowser/nanobrowser/discussions
- **Documentation**: https://docs.nanobrowser.ai

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details

---

**Happy Automating! 🤖✨**

For questions or issues, please open a GitHub issue or join our community discussions.
