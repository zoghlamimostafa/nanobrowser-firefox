# Nanobrowser Firefox MCP Server

Firefox-native Model Context Protocol (MCP) server that allows Claude AI to control Firefox browser through WebExtensions Native Messaging.

## Overview

Unlike the Chrome version which uses Chrome DevTools Protocol (CDP), this Firefox version uses:
- **Native Messaging**: Firefox's official extension communication protocol
- **WebExtensions API**: Firefox-native browser automation
- **Stdio Transport**: Direct stdin/stdout communication

## Features

- ✅ **24 Browser Automation Tools** - Full control over Firefox
- ✅ **Native Messaging** - Uses Firefox's official protocol
- ✅ **No CDP Dependency** - Pure WebExtensions API
- ✅ **Privacy-Focused** - Everything runs locally
- ✅ **Cross-Platform** - Linux, macOS, Windows support

## Architecture

```
┌──────────────────────────────────────────┐
│          Claude AI Assistant             │
│      (Claude Desktop / Cline)            │
└──────────────┬───────────────────────────┘
               │
               │ MCP Protocol (stdio)
               │
┌──────────────▼───────────────────────────┐
│    Firefox MCP Server Process            │
│  (packages/firefox-mcp/dist/index.js)    │
└──────────────┬───────────────────────────┘
               │
               │ Native Messaging (stdio)
               │ (Firefox native protocol)
               │
┌──────────────▼───────────────────────────┐
│     Nanobrowser Firefox Extension        │
│    (Background Script + Content)         │
└──────────────┬───────────────────────────┘
               │
               │ WebExtensions API
               │
┌──────────────▼───────────────────────────┐
│          Firefox Browser                 │
│          (Actual Web Pages)              │
└──────────────────────────────────────────┘
```

## Installation

### 1. Build the MCP Server

```bash
cd packages/firefox-mcp
npm install
npm run build
```

### 2. Install Native Messaging Host

```bash
npm run install-host
```

This will:
- Create a launcher script
- Generate the native messaging manifest
- Install it in Firefox's native messaging directory

**Locations:**
- **Linux**: `~/.mozilla/native-messaging-hosts/ai.nanobrowser.mcp.json`
- **macOS**: `~/Library/Application Support/Mozilla/NativeMessagingHosts/ai.nanobrowser.mcp.json`
- **Windows**: `%APPDATA%\Mozilla\NativeMessagingHosts\ai.nanobrowser.mcp.json`

### 3. Configure Claude Desktop

Edit your Claude Desktop config file:

**Linux:** `~/.config/Claude/claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add:

```json
{
  "mcpServers": {
    "nanobrowser-firefox": {
      "command": "node",
      "args": [
        "/absolute/path/to/nanobrowser/packages/firefox-mcp/dist/index.js"
      ],
      "env": {
        "FIREFOX_EXTENSION_ID": "nanobrowser@nanobrowser.ai"
      }
    }
  }
}
```

### 4. Load Nanobrowser in Firefox

```bash
# Build the Firefox extension
cd /path/to/nanobrowser
pnpm build:firefox

# Load in Firefox
# 1. Open Firefox
# 2. Go to about:debugging#/runtime/this-firefox
# 3. Click "Load Temporary Add-on"
# 4. Select manifest.json from dist/ folder
```

### 5. Test Connection

Restart Claude Desktop and ask:

```
Can you open Firefox and navigate to example.com?
```

## Available Tools

### Navigation (4)
- `navigate_to_url` - Navigate to URL
- `go_back` - Go back in history
- `go_forward` - Go forward in history
- `refresh_page` - Refresh page

### DOM Interaction (4)
- `click_element` - Click elements
- `type_text` - Type into inputs
- `get_element_text` - Extract text
- `get_element_attribute` - Get attributes

### Page Information (4)
- `get_page_state` - Get page info
- `get_clickable_elements` - List clickable elements
- `take_screenshot` - Capture screenshots
- `execute_javascript` - Run JavaScript

### Scrolling (2)
- `scroll_page` - Scroll page
- `scroll_to_element` - Scroll to element

### Waiting (1)
- `wait_for_element` - Wait for elements

### Forms (1)
- `fill_form` - Fill multiple fields

### Tab Management (4)
- `open_new_tab` - Open new tab
- `close_tab` - Close tab
- `switch_tab` - Switch tabs
- `list_tabs` - List all tabs

### AI Tasks (1)
- `execute_task` - Use Nanobrowser AI agents

## Resources

- `firefox://page/current` - Current page state
- `firefox://page/screenshot` - Page screenshot
- `firefox://tabs/list` - All open tabs

## How Native Messaging Works

### Message Format

Firefox native messaging uses length-prefixed messages:

```
[4 bytes: uint32 length][JSON message]
```

### Communication Flow

1. **Claude → MCP Server**: Stdio (MCP protocol)
2. **MCP Server → Firefox Extension**: Stdio (Native Messaging)
3. **Firefox Extension → Web Page**: WebExtensions API
4. **Response flows back** through the same chain

### Message Example

```javascript
// MCP Server sends to Firefox:
{
  "id": 1,
  "command": "navigate",
  "params": { "url": "https://example.com" }
}

// Firefox Extension responds:
{
  "id": 1,
  "result": { "url": "https://example.com", "title": "Example Domain" }
}
```

## Differences from Chrome Version

| Feature | Chrome MCP | Firefox MCP |
|---------|------------|-------------|
| Protocol | Chrome DevTools (CDP) | Native Messaging |
| Communication | WebSocket/HTTP | Stdio (pipes) |
| Browser Control | Puppeteer | WebExtensions API |
| Setup Complexity | Medium | Higher (native host) |
| Capabilities | Full CDP access | WebExtensions only |

## Troubleshooting

### Host Not Found

```
Error: Native messaging host not found
```

**Solutions:**
1. Run `npm run install-host`
2. Check manifest location exists
3. Verify file permissions (Unix: executable)
4. On Windows, check registry entry

### Extension ID Mismatch

```
Error: Extension not allowed
```

**Solutions:**
1. Check extension ID in manifest matches `nanobrowser@nanobrowser.ai`
2. Verify extension is loaded in Firefox
3. Check `about:debugging` for extension ID

### Communication Timeout

```
Error: Command timeout
```

**Solutions:**
1. Ensure extension is loaded and active
2. Check Firefox console for errors (F12)
3. Verify native messaging host is executable
4. Test with simpler command first

### Permission Denied

```
Error: Cannot execute native messaging host
```

**Solutions:**
1. Unix: `chmod +x launcher/nanobrowser-firefox-mcp.sh`
2. Check file ownership
3. Verify Node.js is in PATH

## Development

### Watch Mode

```bash
npm run dev
```

### Testing Native Messaging

You can test the native messaging host directly:

```bash
# Start the host
node dist/index.js

# In another terminal, send a test message (length-prefixed JSON)
echo -e '\x0e\x00\x00\x00{"id":1,"command":"getPageState"}' | node dist/index.js
```

### Debugging

Enable Firefox extension debugging:
1. Open `about:debugging`
2. Click "Inspect" on Nanobrowser extension
3. Check console for native messaging errors

## Security Considerations

- ✅ **Local Only**: All communication stays on your machine
- ✅ **Extension ID Whitelist**: Only Nanobrowser can connect
- ✅ **Stdio Transport**: No network exposure
- ✅ **Sandboxed**: Firefox's extension sandbox
- ⚠️ **JavaScript Execution**: `execute_javascript` tool can run arbitrary code

## Performance

- **Startup Time**: ~100-200ms (native messaging handshake)
- **Command Latency**: ~50-100ms per command
- **Screenshot**: ~200-500ms depending on page size
- **Task Execution**: Varies by complexity

## Limitations

### vs Chrome MCP

❌ **No CDP access** - Can't access low-level browser internals
❌ **Limited DevTools** - No protocol-level debugging
❌ **No Puppeteer** - Pure WebExtensions API only

### Firefox Restrictions

❌ **Content Script limitations** - Some pages block automation
❌ **CSP restrictions** - Content Security Policy may block actions
❌ **No chrome:// pages** - Can't automate Firefox internal pages

## Future Enhancements

- [ ] WebDriver BiDi support (when stable)
- [ ] Better element selector strategies
- [ ] Network request interception
- [ ] Cookie management
- [ ] Download handling
- [ ] Multiple Firefox profiles

## Related Packages

- `@extension/claude-mcp` - Chrome/Edge MCP server (uses CDP)
- `@extension/security-mcp` - Security testing MCP server

## License

MIT

## Support

- **GitHub Issues**: https://github.com/nanobrowser/nanobrowser/issues
- **Documentation**: See FIREFOX_MCP_SETUP.md
- **Discord**: https://discord.gg/NN3ABHggMK

