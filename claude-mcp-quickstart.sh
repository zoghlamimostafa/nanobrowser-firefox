#!/bin/bash

# Claude MCP Quickstart Setup Script
# Sets up Nanobrowser Claude MCP integration

set -e

echo "=================================="
echo "Claude MCP Quickstart Setup"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the absolute path to the nanobrowser directory
NANOBROWSER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_MCP_DIR="$NANOBROWSER_DIR/packages/claude-mcp"

echo -e "${BLUE}Nanobrowser Directory:${NC} $NANOBROWSER_DIR"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js >= 22.12.0 from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo -e "${RED}❌ Node.js version is too old ($(node -v))${NC}"
    echo "Please install Node.js >= 22.12.0"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version:${NC} $(node -v)"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm is not installed${NC}"
    echo "Installing pnpm..."
    npm install -g pnpm
fi

echo -e "${GREEN}✅ pnpm version:${NC} $(pnpm -v)"
echo ""

# Install and build
echo -e "${BLUE}📦 Installing dependencies...${NC}"
cd "$CLAUDE_MCP_DIR"
pnpm install

echo ""
echo -e "${BLUE}🔨 Building Claude MCP server...${NC}"
pnpm build

if [ ! -f "$CLAUDE_MCP_DIR/dist/index.js" ]; then
    echo -e "${RED}❌ Build failed - dist/index.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Detect OS for config path
OS="$(uname -s)"
case "$OS" in
    Darwin*)
        CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
        OS_NAME="macOS"
        ;;
    Linux*)
        CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
        OS_NAME="Linux"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
        OS_NAME="Windows"
        ;;
    *)
        CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
        OS_NAME="Unknown"
        ;;
esac

echo -e "${BLUE}📝 Configuration${NC}"
echo "OS: $OS_NAME"
echo "Claude Config Path: $CONFIG_PATH"
echo ""

# Generate configuration
echo -e "${YELLOW}MCP Configuration:${NC}"
echo ""
cat <<EOF
{
  "mcpServers": {
    "nanobrowser": {
      "command": "node",
      "args": [
        "$CLAUDE_MCP_DIR/dist/index.js"
      ],
      "env": {
        "NANOBROWSER_WS_URL": "ws://localhost:9222",
        "NANOBROWSER_HTTP_URL": "http://localhost:8080"
      }
    }
  }
}
EOF
echo ""

# Ask if user wants to automatically update config
echo -e "${YELLOW}Would you like to automatically add this to your Claude Desktop config?${NC}"
echo "This will create/update: $CONFIG_PATH"
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$CONFIG_PATH")"

    # Check if config file exists
    if [ -f "$CONFIG_PATH" ]; then
        echo -e "${YELLOW}⚠️  Config file already exists${NC}"
        echo "Creating backup..."
        cp "$CONFIG_PATH" "$CONFIG_PATH.backup.$(date +%Y%m%d-%H%M%S)"
        echo -e "${GREEN}✅ Backup created${NC}"

        # TODO: Merge with existing config (requires jq)
        if command -v jq &> /dev/null; then
            echo "Merging with existing configuration..."
            NEW_SERVER=$(cat <<EOF
{
  "command": "node",
  "args": ["$CLAUDE_MCP_DIR/dist/index.js"],
  "env": {
    "NANOBROWSER_WS_URL": "ws://localhost:9222",
    "NANOBROWSER_HTTP_URL": "http://localhost:8080"
  }
}
EOF
)
            jq --argjson server "$NEW_SERVER" '.mcpServers.nanobrowser = $server' "$CONFIG_PATH" > "$CONFIG_PATH.tmp"
            mv "$CONFIG_PATH.tmp" "$CONFIG_PATH"
            echo -e "${GREEN}✅ Configuration merged${NC}"
        else
            echo -e "${YELLOW}⚠️  jq not found, cannot merge automatically${NC}"
            echo "Please manually add the nanobrowser server to your config"
        fi
    else
        # Create new config file
        cat > "$CONFIG_PATH" <<EOF
{
  "mcpServers": {
    "nanobrowser": {
      "command": "node",
      "args": [
        "$CLAUDE_MCP_DIR/dist/index.js"
      ],
      "env": {
        "NANOBROWSER_WS_URL": "ws://localhost:9222",
        "NANOBROWSER_HTTP_URL": "http://localhost:8080"
      }
    }
  }
}
EOF
        echo -e "${GREEN}✅ Configuration file created${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping automatic configuration${NC}"
    echo "Please manually add the configuration to: $CONFIG_PATH"
fi

echo ""
echo -e "${GREEN}=================================="
echo "✅ Setup Complete!"
echo "==================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Make sure Nanobrowser extension is installed in Chrome/Edge"
echo "2. Open your browser and ensure the extension is running"
echo "3. Restart Claude Desktop completely (quit and reopen)"
echo "4. Ask Claude: 'Can you navigate to example.com?'"
echo ""
echo -e "${BLUE}Troubleshooting:${NC}"
echo "- If Claude can't find the tools, check Claude logs:"
echo "  $HOME/Library/Logs/Claude/mcp.log (macOS)"
echo "  $HOME/.config/Claude/logs/mcp.log (Linux)"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "- Full setup guide: $NANOBROWSER_DIR/CLAUDE_MCP_SETUP.md"
echo "- Package README: $CLAUDE_MCP_DIR/README.md"
echo ""
echo -e "${GREEN}Happy automating! 🤖✨${NC}"
