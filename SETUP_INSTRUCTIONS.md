# 🚀 Setup Instructions - Claude MCP Integration

## ⚠️ Important: Node.js Version Required

**Your current Node.js version: v18.19.1**
**Required version: >= 22.12.0**

You need to upgrade Node.js before building Claude MCP.

---

## Step 1: Upgrade Node.js

### Option A: Using NVM (Recommended)

```bash
# Install NVM if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Close and reopen your terminal, then:
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version  # Should show v22.x.x
```

### Option B: Direct Download

Download from: https://nodejs.org/en/download/

Choose "Current" version (22.x.x or higher)

---

## Step 2: Build Claude MCP

Once Node.js 22+ is installed:

```bash
cd /home/user/Desktop/nanobrowser

# Install dependencies for all packages
pnpm install

# Build Claude MCP specifically
cd packages/claude-mcp
pnpm build

# Verify build succeeded
ls -la dist/
# You should see: index.js and browser-client.js
```

---

## Step 3: Configure Claude Desktop

### For macOS:

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nanobrowser": {
      "command": "node",
      "args": [
        "/home/user/Desktop/nanobrowser/packages/claude-mcp/dist/index.js"
      ],
      "env": {
        "NANOBROWSER_WS_URL": "ws://localhost:9222",
        "NANOBROWSER_HTTP_URL": "http://localhost:8080"
      }
    }
  }
}
```

### For Windows:

Edit: `%APPDATA%\Claude\claude_desktop_config.json`

(Use Windows path format)

### For Linux:

Edit: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nanobrowser": {
      "command": "node",
      "args": [
        "/home/user/Desktop/nanobrowser/packages/claude-mcp/dist/index.js"
      ],
      "env": {
        "NANOBROWSER_WS_URL": "ws://localhost:9222",
        "NANOBROWSER_HTTP_URL": "http://localhost:8080"
      }
    }
  }
}
```

---

## Step 4: Install & Start Nanobrowser Extension

1. **Build the extension:**
   ```bash
   cd /home/user/Desktop/nanobrowser
   pnpm build
   ```

2. **Load in Chrome/Edge:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select: `/home/user/Desktop/nanobrowser/dist/`

3. **Verify it's running:**
   - You should see the Nanobrowser icon in your browser toolbar
   - Click the icon to open the side panel

---

## Step 5: Test Claude MCP

1. **Restart Claude Desktop** (completely quit and reopen)

2. **Test with Claude:**

```
Hey Claude, can you use Nanobrowser to navigate to example.com
and tell me what's on the page?
```

3. **Expected behavior:**
   - Claude should recognize the `nanobrowser` MCP tools
   - It will use `navigate_to_url` tool
   - It will use `get_page_state` to see the content
   - It will describe what's on example.com

---

## Quick Start Script (After Node.js Upgrade)

Or just run the automated setup script:

```bash
cd /home/user/Desktop/nanobrowser
./claude-mcp-quickstart.sh
```

This script will:
- ✅ Check Node.js version
- ✅ Install dependencies
- ✅ Build the MCP server
- ✅ Generate configuration
- ✅ Optionally update Claude Desktop config

---

## Troubleshooting

### "Cannot find module" errors

```bash
cd /home/user/Desktop/nanobrowser
rm -rf node_modules packages/*/node_modules
pnpm install
```

### Claude doesn't see the tools

1. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/mcp.log`
   - Linux: `~/.config/Claude/logs/mcp.log`

2. Verify the path in config is absolute (not relative)

3. Make sure to restart Claude Desktop completely

### Extension not connecting

1. Check browser console (F12) for errors
2. Verify extension is loaded in `chrome://extensions/`
3. Try reloading the extension
4. Make sure you're on a regular webpage (not chrome:// URLs)

---

## What You Can Do With Claude MCP

Once configured, ask Claude to:

### Web Research
```
"Search Google for 'Model Context Protocol' and
summarize the first result"
```

### Form Automation
```
"Go to example.com/contact and fill out the form:
- Name: John Doe
- Email: john@example.com
Then take a screenshot"
```

### Data Extraction
```
"Navigate to news.ycombinator.com and extract
the titles of the top 10 posts"
```

### Multi-Step Tasks
```
"Search GitHub for 'nanobrowser', click the first repo,
and summarize what it does"
```

---

## Available Tools (24 total)

Claude can use these tools:

**Navigation:** navigate_to_url, go_back, go_forward, refresh_page

**Interaction:** click_element, type_text, get_element_text, get_element_attribute, select_dropdown, check_checkbox

**Information:** get_page_state, get_clickable_elements, take_screenshot, execute_javascript

**Scrolling:** scroll_page, scroll_to_element

**Waiting:** wait_for_element, wait_for_navigation

**Forms:** fill_form

**Tabs:** open_new_tab, close_tab, switch_tab, list_tabs

**AI Tasks:** execute_task (uses Nanobrowser's AI agents)

---

## Next Steps After Setup

1. ✅ Upgrade Node.js to 22+
2. ✅ Run `pnpm install` and `pnpm build`
3. ✅ Load extension in browser
4. ✅ Configure Claude Desktop
5. ✅ Restart Claude Desktop
6. ✅ Test with a simple navigation command

---

## Support & Documentation

- **Full Setup Guide:** [CLAUDE_MCP_SETUP.md](./CLAUDE_MCP_SETUP.md)
- **Integration Details:** [CLAUDE_MCP_INTEGRATION_COMPLETE.md](./CLAUDE_MCP_INTEGRATION_COMPLETE.md)
- **Package README:** [packages/claude-mcp/README.md](./packages/claude-mcp/README.md)
- **GitHub Issues:** https://github.com/nanobrowser/nanobrowser/issues

---

## Summary Checklist

- [ ] Upgrade Node.js to version 22+
- [ ] Install pnpm: `npm install -g pnpm` or use installer
- [ ] Build extension: `pnpm build`
- [ ] Build Claude MCP: `cd packages/claude-mcp && pnpm build`
- [ ] Load extension in Chrome/Edge
- [ ] Configure Claude Desktop with MCP server
- [ ] Restart Claude Desktop
- [ ] Test with Claude

**Once these steps are complete, Claude can control your browser! 🤖✨**
