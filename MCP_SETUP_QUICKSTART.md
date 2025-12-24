# 🔗 Burp Suite MCP Integration - Quick Setup

## ✅ Status
- ✅ MCP Proxy JAR: `mcp-proxy.jar` (12.4 MB) - **READY**
- ✅ Security MCP Server: `packages/security-mcp/` - **BUILT**
- ✅ VS Code Configuration: `.vscode/mcp.json` - **CONFIGURED**

## 🔧 Configuration Steps

### 1. Get Your Burp Suite API Key

1. Open **Burp Suite Professional/Enterprise**
2. Go to **User options** → **Misc** → **REST API**
3. Enable **"REST API"** 
4. Set port to **9876** (matches current configuration)
5. Click **"Generate API key"**
6. Copy the generated key (format: `api-key-xxxxxxxxxx`)

### 2. Update MCP Configuration

Edit `.vscode/mcp.json` and replace `"your-burp-api-key-here"` with your actual API key:

```jsonc
{
  "mcpServers": {
    "burp": {
      "command": "java",
      "args": [
        "-jar",
        "/home/user/Desktop/nanobrowser/mcp-proxy.jar",
        "--sse-url",
        "http://localhost:8080/mcp-bridge"
      ]
    },
    "nanobrowser-security": {
      "command": "node", 
      "args": ["/home/user/Desktop/nanobrowser/packages/security-mcp/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "BURP_API_KEY": "api-key-your-actual-key-here"
      }
    }
  }
}
```

### 3. Start Services

```bash
# 1. Start Burp Suite (ensure REST API is enabled on port 9876)

# 2. Test Security MCP server
cd packages/security-mcp
node demo.js

# 3. Restart VS Code to load MCP configuration
```

### 4. Verify Integration

1. Open VS Code
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Search for "MCP"
4. You should see both `burp` and `nanobrowser-security` servers available

## 🛠️ Available Tools

### Via `burp` MCP Server:
- Direct Burp Suite integration
- Real-time scan results
- Issue management

### Via `nanobrowser-security` MCP Server:
- `burp_scan_target` - Start automated scans
- `burp_get_findings` - Get vulnerability findings  
- `generate_xss_payloads` - XSS payload generation
- `generate_sqli_payloads` - SQL injection payloads
- `subdomain_enumeration` - Domain reconnaissance
- `technology_fingerprint` - Technology identification
- `generate_security_report` - Professional reporting
- `create_security_project` - Project management

## 🔍 Troubleshooting

### MCP Server Connection Issues
```bash
# Check if servers are responding
curl http://localhost:9876/v0.1/  # Burp API
node packages/security-mcp/dist/index.js  # Test MCP server
```

### Java Path Issues  
```bash
# Verify Java installation
java -version
which java
```

### API Key Issues
- Ensure Burp Suite is running
- Verify REST API is enabled
- Check API key format: `api-key-xxxxxxxxxx`
- Confirm port 9876 is correct

## 🎯 Next Steps

1. **Update API Key**: Replace placeholder with your actual Burp Suite API key
2. **Test Connection**: Verify both MCP servers are accessible
3. **Start Testing**: Use the security tools from VS Code via MCP integration