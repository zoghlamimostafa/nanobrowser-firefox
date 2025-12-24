# 🦊 Firefox MCP Setup Guide

Complete guide to setting up Claude AI with Nanobrowser Firefox using Native Messaging.

## Overview

This integration allows Claude AI to control Firefox browser through:
- **Native Messaging** - Firefox's official extension communication protocol
- **WebExtensions API** - Firefox-native browser automation
- **MCP Protocol** - Model Context Protocol for AI tool usage

## Prerequisites

- ✅ Node.js >= 22.12.0
- ✅ Firefox browser installed
- ✅ Claude Desktop App OR VS Code with Cline
- ✅ pnpm package manager

## Architecture

```
Claude Desktop
      ↓
   (MCP stdio)
      ↓
Firefox MCP Server (Node.js process)
      ↓
(Native Messaging stdio)
      ↓
Nanobrowser Extension (Firefox)
      ↓
(WebExtensions API)
      ↓
Firefox Browser (Web Pages)
```

## Step-by-Step Setup

### Step 1: Build Firefox MCP Server

```bash
cd /home/user/Desktop/nanobrowser

# Use Node.js 22+ (via nvm if needed)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install dependencies and build
cd packages/firefox-mcp
npm install
npm run build
```

**Verify build:**
```bash
ls -la dist/
# Should see: index.js, firefox-client.js, install-native-host.js
```

---

### Step 2: Install Native Messaging Host

```bash
# Still in packages/firefox-mcp/
npm run install-host
```

This creates:
- **Launcher script**: `dist/launcher/nanobrowser-firefox-mcp.sh` (Unix) or `.bat` (Windows)
- **Manifest file**: Native messaging configuration

**Manifest locations:**
- **Linux**: `~/.mozilla/native-messaging-hosts/ai.nanobrowser.mcp.json`
- **macOS**: `~/Library/Application Support/Mozilla/NativeMessagingHosts/ai.nanobrowser.mcp.json`
- **Windows**: `%APPDATA%\Mozilla\NativeMessagingHosts\ai.nanobrowser.mcp.json`

**Verify installation:**
```bash
# Linux/macOS
cat ~/.mozilla/native-messaging-hosts/ai.nanobrowser.mcp.json

# Should show:
# {
#   "name": "ai.nanobrowser.mcp",
#   "description": "Nanobrowser Firefox MCP Server...",
#   "path": "/path/to/launcher/nanobrowser-firefox-mcp.sh",
#   "type": "stdio",
#   "allowed_extensions": ["nanobrowser@nanobrowser.ai"]
# }
```

---

### Step 3: Build & Load Firefox Extension

```bash
cd /home/user/Desktop/nanobrowser

# Build for Firefox
pnpm build:firefox
```

**Load in Firefox:**

1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click **"Load Temporary Add-on..."**
4. Select `manifest.json` from `/home/user/Desktop/nanobrowser/dist/`

**Verify extension loaded:**
- Extension should appear in the list
- Note the **Extension ID**: Should be `nanobrowser@nanobrowser.ai`
- Click **"Inspect"** to open devtools console

---

### Step 4: Configure Claude Desktop

Edit Claude Desktop configuration:

**Linux:**
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

**macOS:**
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Add this configuration:**

```json
{
  "mcpServers": {
    "nanobrowser-firefox": {
      "command": "node",
      "args": [
        "/home/user/Desktop/nanobrowser/packages/firefox-mcp/dist/index.js"
      ],
      "env": {
        "FIREFOX_EXTENSION_ID": "nanobrowser@nanobrowser.ai"
      }
    }
  }
}
```

⚠️ **Important:**
- Use **absolute paths** (not `~` or relative paths)
- Replace `/home/user/` with your actual home directory
- If you have other MCP servers, add this inside the existing `"mcpServers"` object

---

### Step 5: Restart Claude Desktop

**Complete restart required:**

1. Quit Claude Desktop completely (Cmd+Q / Ctrl+Q)
2. Wait 5 seconds
3. Reopen Claude Desktop

---

### Step 6: Test the Integration

Ask Claude:

```
Can you navigate to example.com in Firefox and tell me what's on the page?
```

**Expected behavior:**
1. Claude recognizes `nanobrowser-firefox` MCP tools
2. Uses `navigate_to_url` tool
3. Uses `get_page_state` to read the page
4. Describes the content

---

## Verification Checklist

### ✅ Native Messaging Host

```bash
# Check manifest exists
ls ~/.mozilla/native-messaging-hosts/ai.nanobrowser.mcp.json

# Check launcher is executable (Unix)
ls -la packages/firefox-mcp/dist/launcher/
# Should show: -rwxr-xr-x (executable)
```

### ✅ Firefox Extension

1. Open `about:debugging#/runtime/this-firefox`
2. Find "Nanobrowser" extension
3. Click "Inspect"
4. Console should show: "Native messaging handler initialized"

### ✅ Claude Configuration

```bash
# Check config syntax
cat ~/.config/Claude/claude_desktop_config.json | jq .
# Should parse without errors
```

### ✅ MCP Server

```bash
# Test MCP server can start
cd packages/firefox-mcp
node dist/index.js
# Should output: "Nanobrowser Firefox MCP Server running"
# Press Ctrl+C to stop
```

---

## Troubleshooting

### Issue 1: "Native host not found"

**Error in Firefox console:**
```
Error: Native messaging host ai.nanobrowser.mcp not found
```

**Solutions:**

1. **Re-run installer:**
   ```bash
   cd packages/firefox-mcp
   npm run install-host
   ```

2. **Check manifest location:**
   ```bash
   ls ~/.mozilla/native-messaging-hosts/ai.nanobrowser.mcp.json
   ```

3. **Verify permissions (Unix):**
   ```bash
   chmod +x packages/firefox-mcp/dist/launcher/nanobrowser-firefox-mcp.sh
   ```

4. **Check Node.js path:**
   ```bash
   which node
   # Update launcher script if needed
   ```

---

### Issue 2: "Extension not allowed"

**Error:**
```
Extension [id] is not allowed to connect to native host
```

**Solutions:**

1. **Check extension ID matches:**
   - Firefox: Go to `about:debugging`, check actual extension ID
   - Manifest: Check `allowed_extensions` in native messaging manifest
   - Should be: `"nanobrowser@nanobrowser.ai"`

2. **Update manifest if needed:**
   ```bash
   nano ~/.mozilla/native-messaging-hosts/ai.nanobrowser.mcp.json
   # Update "allowed_extensions" to match actual extension ID
   ```

3. **Reload extension:**
   - Go to `about:debugging`
   - Click "Reload" on Nanobrowser extension

---

### Issue 3: "Claude doesn't see tools"

**Claude says:** "I don't have access to browser automation tools"

**Solutions:**

1. **Check Claude logs:**
   ```bash
   # Linux
   tail -f ~/.config/Claude/logs/mcp.log

   # macOS
   tail -f ~/Library/Logs/Claude/mcp.log
   ```

2. **Verify config path is absolute:**
   ```json
   {
     "args": [
       "/home/user/Desktop/nanobrowser/packages/firefox-mcp/dist/index.js"
       // NOT: "~/Desktop/..." or "./packages/..."
     ]
   }
   ```

3. **Test MCP server manually:**
   ```bash
   node packages/firefox-mcp/dist/index.js
   # Should start without errors
   ```

4. **Completely restart Claude:**
   - Quit (not just close window)
   - Wait 10 seconds
   - Reopen

---

### Issue 4: "Connection timeout"

**Error:** Commands time out after 30 seconds

**Solutions:**

1. **Check Firefox is running:**
   - Ensure Firefox browser is open
   - Extension must be loaded

2. **Check extension console:**
   - `about:debugging` → Inspect extension
   - Look for error messages

3. **Test simpler command first:**
   ```
   Claude, can you list all open tabs in Firefox?
   ```

4. **Verify native messaging works:**
   - Extension console should show connection logs
   - Check for "Native messaging port connected"

---

### Issue 5: "Permission denied" (Unix/macOS)

**Error:**
```
Error: spawn EACCES
```

**Solutions:**

```bash
# Make launcher executable
chmod +x packages/firefox-mcp/dist/launcher/nanobrowser-firefox-mcp.sh

# Verify
ls -la packages/firefox-mcp/dist/launcher/
# Should show: -rwxr-xr-x
```

---

## Available Tools

Claude can use these 20 tools with Firefox:

### Navigation (4)
- `navigate_to_url` - Go to any URL
- `go_back` - History back
- `go_forward` - History forward
- `refresh_page` - Reload page

### DOM Interaction (4)
- `click_element` - Click elements
- `type_text` - Type into inputs
- `get_element_text` - Extract text
- `get_element_attribute` - Get attributes

### Page Information (4)
- `get_page_state` - Get URL, title, status
- `get_clickable_elements` - List interactive elements
- `take_screenshot` - Capture page
- `execute_javascript` - Run JS code

### Scrolling (2)
- `scroll_page` - Scroll up/down/top/bottom
- `scroll_to_element` - Scroll to element

### Waiting (1)
- `wait_for_element` - Wait for elements

### Forms (1)
- `fill_form` - Fill multiple fields

### Tab Management (4)
- `open_new_tab` - Open new tab
- `close_tab` - Close current tab
- `switch_tab` - Switch between tabs
- `list_tabs` - List all tabs

---

## Usage Examples

### Example 1: Basic Navigation

```
Claude, can you open Firefox, navigate to news.ycombinator.com,
and tell me the top 3 post titles?
```

Claude will:
1. Use `navigate_to_url` to go to HN
2. Use `get_clickable_elements` to find links
3. Use `get_element_text` to extract titles
4. Report the top 3 titles

---

### Example 2: Form Filling

```
Go to example.com/contact in Firefox and fill out:
- Name: John Doe
- Email: john@example.com
- Message: Testing Firefox MCP
Then take a screenshot
```

Claude will:
1. Navigate to the URL
2. Use `fill_form` with the field data
3. Use `take_screenshot`
4. Show you the result

---

### Example 3: Research Task

```
Search Google in Firefox for "Firefox WebExtensions API",
click the first result, and summarize the content
```

Claude will:
1. Navigate to Google
2. Type in search box
3. Click search
4. Click first result
5. Read and summarize page content

---

## Comparison: Firefox MCP vs Chrome MCP

| Feature | Firefox MCP | Chrome MCP |
|---------|-------------|------------|
| **Protocol** | Native Messaging | Chrome DevTools (CDP) |
| **Communication** | Stdio pipes | WebSocket/HTTP |
| **Setup** | Native host installation | Port configuration |
| **Capabilities** | WebExtensions API | Full CDP access |
| **Permissions** | Extension manifest | Browser flag |
| **Startup** | ~100-200ms | ~50-100ms |
| **Debugging** | Extension console | Network tab + console |

---

## Advanced Configuration

### Custom Extension ID

If your extension has a different ID:

1. **Find actual ID:**
   ```
   about:debugging → Check extension details
   ```

2. **Update native messaging manifest:**
   ```bash
   nano ~/.mozilla/native-messaging-hosts/ai.nanobrowser.mcp.json
   ```

   ```json
   {
     "allowed_extensions": ["your-actual-extension-id@example.com"]
   }
   ```

3. **Update Claude config:**
   ```json
   {
     "env": {
       "FIREFOX_EXTENSION_ID": "your-actual-extension-id@example.com"
     }
   }
   ```

### Multiple Firefox Profiles

To use different Firefox profiles:

```json
{
  "mcpServers": {
    "firefox-work": {
      "command": "node",
      "args": ["/path/to/firefox-mcp/dist/index.js"],
      "env": {
        "FIREFOX_EXTENSION_ID": "nanobrowser@nanobrowser.ai",
        "FIREFOX_PROFILE": "work"
      }
    },
    "firefox-personal": {
      "command": "node",
      "args": ["/path/to/firefox-mcp/dist/index.js"],
      "env": {
        "FIREFOX_EXTENSION_ID": "nanobrowser@nanobrowser.ai",
        "FIREFOX_PROFILE": "personal"
      }
    }
  }
}
```

---

## Security Considerations

- ✅ **Local only** - All communication on your machine
- ✅ **Extension whitelist** - Only Nanobrowser can connect
- ✅ **Stdio transport** - No network exposure
- ✅ **Firefox sandbox** - Extension runs in sandbox
- ⚠️ **JavaScript execution** - Be careful with `execute_javascript`
- ⚠️ **Native host** - Has full Node.js permissions

---

## Performance Tips

1. **Keep Firefox open** - Starting browser adds latency
2. **Use specific selectors** - CSS IDs faster than complex queries
3. **Batch operations** - Use `fill_form` instead of multiple `type_text`
4. **Limit screenshots** - Only capture when needed
5. **Close unused tabs** - Reduces memory usage

---

## Limitations

### vs Chrome MCP:
- ❌ No CDP access (low-level browser control)
- ❌ No Puppeteer support
- ❌ Limited DevTools integration
- ✅ More privacy-focused
- ✅ Firefox-native integration

### Firefox Restrictions:
- ❌ Can't automate `about:*` pages
- ❌ Content Security Policy may block some actions
- ❌ Some sites detect automation

---

## Uninstallation

### Remove Native Messaging Host

```bash
# Linux/macOS
rm ~/.mozilla/native-messaging-hosts/ai.nanobrowser.mcp.json
rm -rf packages/firefox-mcp/dist/launcher/

# Windows (as Administrator)
REG DELETE "HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\ai.nanobrowser.mcp" /f
del %APPDATA%\Mozilla\NativeMessagingHosts\ai.nanobrowser.mcp.json
```

### Remove from Claude

Delete the `nanobrowser-firefox` entry from your Claude config.

### Remove Extension

1. Go to `about:addons`
2. Find Nanobrowser
3. Click "Remove"

---

## Support

- **Documentation**: [FIREFOX_AI_BROWSER_GUIDE.md](FIREFOX_AI_BROWSER_GUIDE.md)
- **Package README**: [packages/firefox-mcp/README.md](packages/firefox-mcp/README.md)
- **GitHub Issues**: https://github.com/nanobrowser/nanobrowser/issues
- **Discord**: https://discord.gg/NN3ABHggMK

---

## Summary

✅ **What you did:**
1. Built Firefox MCP server
2. Installed native messaging host
3. Loaded Firefox extension
4. Configured Claude Desktop
5. Tested the integration

✅ **What Claude can do:**
- Control Firefox through natural language
- Navigate websites
- Extract data
- Fill forms
- Take screenshots
- Manage tabs
- Execute complex tasks

🦊 **Firefox MCP is now ready! Claude can control your Firefox browser!**
