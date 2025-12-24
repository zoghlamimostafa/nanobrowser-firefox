# 🐧 Testing Claude MCP on Linux

Since Claude Desktop isn't available on Linux, here are the best alternatives for testing your MCP servers.

## Quick Comparison

| Tool | Ease of Use | MCP Support | Cost | Best For |
|------|-------------|-------------|------|----------|
| **Cline (VS Code)** | ⭐⭐⭐⭐⭐ | Full | Free | Daily use |
| **MCP Inspector** | ⭐⭐⭐⭐ | Full | Free | Testing/Debug |
| **Continue.dev** | ⭐⭐⭐⭐ | Full | Free | Development |
| **Open WebUI** | ⭐⭐⭐ | Partial | Free | Self-hosted |
| **Manual Testing** | ⭐⭐ | Full | Free | Advanced users |

---

## Option 1: Cline (Recommended) ⭐

### What is Cline?

Cline is an autonomous AI coding assistant for VS Code with full MCP support.

**GitHub:** https://github.com/cline/cline

### Installation

1. **Install VS Code** (if not already):
   ```bash
   # Download from https://code.visualstudio.com/
   # Or use snap:
   sudo snap install code --classic
   ```

2. **Install Cline Extension:**
   - Open VS Code
   - Press `Ctrl+Shift+X` (Extensions)
   - Search for "Cline"
   - Click "Install"

### Configuration

#### For Firefox MCP:

Create `.vscode/mcp.json` in your project:

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

#### For Chrome MCP:

```json
{
  "mcpServers": {
    "nanobrowser-chrome": {
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

#### Both Together:

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
    },
    "nanobrowser-chrome": {
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

### Setup Cline

1. **Open Cline:**
   - Press `Ctrl+Shift+P`
   - Type "Cline: Open"
   - Or click Cline icon in sidebar

2. **Add API Key:**
   - Click settings icon (⚙️) in Cline panel
   - Select "Anthropic" as provider
   - Add your API key from https://console.anthropic.com/
   - Select model: "Claude 3.5 Sonnet"

3. **Restart VS Code** to load MCP servers

### Testing

Ask Cline:
```
Can you list the available MCP tools?
```

Should show:
- All Nanobrowser tools (navigate, click, type, etc.)
- Firefox or Chrome specific tools

Try automation:
```
Can you navigate to example.com in Firefox and describe what you see?
```

---

## Option 2: MCP Inspector 🔍

Official testing tool from the MCP team.

### Installation

```bash
# No installation needed, use npx
npx @modelcontextprotocol/inspector
```

### Usage

#### Test Firefox MCP:

```bash
npx @modelcontextprotocol/inspector \
  node /home/user/Desktop/nanobrowser/packages/firefox-mcp/dist/index.js
```

#### Test Chrome MCP:

```bash
npx @modelcontextprotocol/inspector \
  node /home/user/Desktop/nanobrowser/packages/claude-mcp/dist/index.js
```

### Features

- 🔍 List all available tools
- 🎮 Test tool calls with custom parameters
- 📊 View responses and errors
- 🐛 Debug MCP protocol messages
- 📝 Inspect resources

### Example Test Flow

1. **Start inspector** (opens browser at http://localhost:5173)
2. **Connect to MCP server** (auto-connects)
3. **View tools** in the "Tools" tab
4. **Call a tool:**
   - Select `navigate_to_url`
   - Enter parameters: `{"url": "https://example.com"}`
   - Click "Call Tool"
5. **View response** in the output panel

---

## Option 3: Continue.dev 🔄

Another VS Code extension with MCP support.

### Installation

1. Open VS Code
2. Extensions → Search "Continue"
3. Install

### Configuration

Create `~/.continue/config.json`:

```json
{
  "mcpServers": {
    "nanobrowser": {
      "command": "node",
      "args": [
        "/home/user/Desktop/nanobrowser/packages/firefox-mcp/dist/index.js"
      ]
    }
  },
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-anthropic-api-key"
    }
  ]
}
```

### Usage

- Open Continue panel in VS Code
- Chat with Claude
- Claude can use Nanobrowser tools

---

## Option 4: Command-Line Testing 🖥️

### Quick Test Script

```bash
#!/bin/bash
# test-firefox-mcp.sh

echo "Testing Firefox MCP Server..."

# Start server
node /home/user/Desktop/nanobrowser/packages/firefox-mcp/dist/index.js &
PID=$!

echo "MCP Server started (PID: $PID)"

# Wait for startup
sleep 2

# Test (send JSONRPC request)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  nc localhost 12345  # Adjust if using different port

# Cleanup
kill $PID

echo "Test complete"
```

### Run Test

```bash
chmod +x test-firefox-mcp.sh
./test-firefox-mcp.sh
```

---

## Option 5: Open WebUI 🌐

Self-hosted AI interface with MCP support.

### Installation

```bash
# Using Docker
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

### Access

1. Open http://localhost:3000
2. Create account (local only)
3. Configure MCP servers in settings
4. Chat with AI using Nanobrowser tools

---

## Step-by-Step: Cline Setup 📝

### 1. Prerequisites

```bash
# Check Node.js version
node --version
# Should be >= 22.12.0

# Ensure MCP servers are built
cd /home/user/Desktop/nanobrowser/packages/firefox-mcp
npm run build

cd ../claude-mcp
npm run build
```

### 2. Install Cline

1. Open VS Code
2. Press `Ctrl+Shift+X`
3. Search "Cline"
4. Click "Install"
5. Restart VS Code

### 3. Create MCP Config

```bash
# In your project directory
mkdir -p .vscode

cat > .vscode/mcp.json << 'EOF'
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
EOF
```

### 4. Configure Anthropic API

1. Get API key from https://console.anthropic.com/
2. Open Cline in VS Code
3. Click settings icon (⚙️)
4. Select "Anthropic" provider
5. Paste API key
6. Choose "claude-3-5-sonnet-20241022"

### 5. Test Connection

Ask Cline:
```
List all available MCP servers and tools
```

Expected output:
```
MCP Servers:
- nanobrowser-firefox

Available Tools:
- navigate_to_url
- click_element
- type_text
... (20 total tools)
```

### 6. Test Automation

```
Can you navigate to news.ycombinator.com in Firefox,
get the top 3 post titles, and list them?
```

Cline will:
1. Connect to Firefox MCP
2. Use `navigate_to_url` tool
3. Use `get_clickable_elements` tool
4. Extract and list titles

---

## Troubleshooting

### Cline doesn't see MCP servers

**Check:**
1. Is `.vscode/mcp.json` in your project root?
2. Are paths absolute (not relative)?
3. Did you restart VS Code after creating config?

**Fix:**
```bash
# Verify config
cat .vscode/mcp.json

# Check paths exist
ls /home/user/Desktop/nanobrowser/packages/firefox-mcp/dist/index.js

# Restart VS Code completely
```

### MCP server fails to start

**Check logs:**
```bash
# Test server manually
node /home/user/Desktop/nanobrowser/packages/firefox-mcp/dist/index.js

# Should output: "Nanobrowser Firefox MCP Server running"
```

**Common issues:**
- Node.js version too old (need >= 22)
- Server not built (`npm run build`)
- Missing dependencies (`npm install`)

### Cline can't execute tools

**For Firefox MCP:**
1. Ensure Firefox is running
2. Extension must be loaded
3. Check extension console for errors

**For Chrome MCP:**
1. Ensure Chrome is running
2. Extension must be loaded
3. Check port 9222 is available

---

## Comparison: Testing Methods

### Cline vs MCP Inspector

| Feature | Cline | MCP Inspector |
|---------|-------|---------------|
| **UI** | VS Code panel | Web interface |
| **AI Chat** | ✅ Full Claude | ❌ Manual testing |
| **Tool Testing** | ✅ Automatic | ✅ Manual |
| **Debugging** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Daily Use** | ✅ Perfect | ❌ Testing only |
| **Setup** | Medium | Easy |

**Recommendation:**
- **Development:** MCP Inspector (debugging)
- **Daily Use:** Cline (full AI assistance)

---

## Example Workflows

### Workflow 1: Basic Testing

```
1. Start MCP Inspector
   npx @modelcontextprotocol/inspector node packages/firefox-mcp/dist/index.js

2. Test "navigate_to_url"
   Parameters: {"url": "https://example.com"}

3. Test "get_page_state"
   Parameters: {}

4. Verify responses
```

### Workflow 2: Full Automation with Cline

```
1. Open VS Code with Cline
2. Load Firefox with extension
3. Ask Cline:
   "Search Google for 'Model Context Protocol',
    click the first result, and summarize it"
4. Watch Cline use multiple tools automatically
```

---

## API Keys

### Anthropic API Key

**Get key:**
1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Go to "API Keys"
4. Create new key
5. Copy key

**Pricing:**
- Claude 3.5 Sonnet: $3/million input tokens, $15/million output
- First $5 free for new accounts

**Alternative - Use Local Models:**

If you don't want to pay, use Ollama:
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.1

# Configure Cline to use Ollama
# In Cline settings, select "Ollama" provider
```

---

## Summary

### Recommended Setup for Linux:

**Best option:** Cline + VS Code
- ✅ Free (with your own API key)
- ✅ Works perfectly on Linux
- ✅ Full MCP support
- ✅ Easy to use
- ✅ Active development

**For testing/debugging:** MCP Inspector
- ✅ Official tool
- ✅ Great for development
- ✅ Visual tool testing

### Quick Start

```bash
# 1. Install VS Code
sudo snap install code --classic

# 2. Install Cline extension
# (In VS Code: Extensions → "Cline")

# 3. Create MCP config
mkdir -p .vscode
cat > .vscode/mcp.json << 'EOF'
{
  "mcpServers": {
    "nanobrowser-firefox": {
      "command": "node",
      "args": ["/home/user/Desktop/nanobrowser/packages/firefox-mcp/dist/index.js"],
      "env": {"FIREFOX_EXTENSION_ID": "nanobrowser@nanobrowser.ai"}
    }
  }
}
EOF

# 4. Open Cline, add API key, test!
```

---

## Links

- **Cline:** https://github.com/cline/cline
- **MCP Inspector:** https://github.com/modelcontextprotocol/inspector
- **Continue.dev:** https://continue.dev/
- **Open WebUI:** https://github.com/open-webui/open-webui
- **Anthropic API:** https://console.anthropic.com/

---

**Now you can test Claude MCP on Linux! 🐧✨**
