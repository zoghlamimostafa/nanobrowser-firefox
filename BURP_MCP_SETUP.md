# 🔗 Burp Suite MCP Integration Setup Guide

This guide explains how to set up both the direct Burp Suite MCP proxy and the Nanobrowser Security MCP server for use with VS Code.

## 📋 Prerequisites

- Burp Suite Professional or Enterprise
- VS Code with MCP extension
- Java Runtime Environment (for Burp MCP proxy)
- Node.js (for Nanobrowser Security MCP)

## 🔧 Configuration Steps

### 1. Burp Suite MCP Proxy Setup

#### Download MCP Proxy JAR
```bash
# Download the Burp MCP proxy JAR file
# (Replace with actual download URL when available)
wget https://releases.burpsuite.com/mcp/mcp-proxy-all.jar
```

#### Configure Burp Suite
1. Open Burp Suite Professional/Enterprise
2. Go to **Extensions** → **BApp Store**
3. Install the **MCP Bridge** extension (if available)
4. Configure the MCP server URL in extension settings

#### Find Java Executable Path
```bash
# Find your Java installation
which java
# or
java -version

# Typical paths:
# Windows: C:\Program Files\Java\jdk-11\bin\java.exe
# macOS: /usr/bin/java
# Linux: /usr/bin/java
```

### 2. Nanobrowser Security MCP Setup

#### Build the Security MCP Server
```bash
cd packages/security-mcp
pnpm install
pnpm build
```

#### Get Burp Suite API Key
1. Open Burp Suite
2. Go to **User options** → **Misc** → **REST API**
3. Enable REST API on port **9876**
4. Generate API key
5. Copy the key (format: `api-key-xxxxxxxxxx`)

### 3. VS Code MCP Configuration

Create or update your VS Code MCP configuration file:

**File: `.vscode/mcp-config.json` or VS Code settings.json**

```json
{
  "mcpServers": {
    "burp": {
      "command": "/usr/bin/java",
      "args": [
        "-jar",
        "/path/to/mcp-proxy-all.jar",
        "--sse-url",
        "http://localhost:8080/mcp-bridge"
      ]
    },
    "nanobrowser-security": {
      "command": "node",
      "args": [
        "/home/user/Desktop/nanobrowser/packages/security-mcp/dist/index.js"
      ],
      "env": {
        "BURP_API_KEY": "api-key-your-actual-key-here"
      }
    }
  }
}
```

### 4. Environment Variables (Alternative)

Instead of embedding the API key in config, use environment variables:

```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
export BURP_API_KEY="api-key-your-actual-key-here"
```

Then update the config:
```json
{
  "mcpServers": {
    "nanobrowser-security": {
      "command": "node",
      "args": ["/path/to/nanobrowser/packages/security-mcp/dist/index.js"]
    }
  }
}
```

## 🧪 Testing the Setup

### Test Burp Suite Connection
```bash
# Test if Burp API is accessible
curl -H "Authorization: Bearer api-key-your-key" http://localhost:9876/v0.1/

# Test Nanobrowser Security MCP
cd packages/security-mcp
node demo.js
```

### VS Code Integration Test
1. Open VS Code
2. Open Command Palette (`Ctrl+Shift+P`)
3. Search for "MCP" commands
4. You should see both `burp` and `nanobrowser-security` servers available

## 🔍 Troubleshooting

### Common Issues

1. **Java Path Error**
   ```bash
   # Verify Java installation
   java -version
   which java
   ```

2. **MCP Proxy JAR Not Found**
   - Ensure the JAR file path is correct
   - Check file permissions

3. **Burp API Connection Failed**
   - Verify Burp Suite is running
   - Check API port (9876) is correct
   - Validate API key format

4. **Permission Denied**
   ```bash
   # Make JAR executable
   chmod +x /path/to/mcp-proxy-all.jar
   ```

## 📚 Available MCP Tools

Once configured, you'll have access to:

### Burp Suite Direct Tools
- Real-time scan results
- Issue management
- Repeater integration
- Project management

### Nanobrowser Security Tools
- `burp_scan_target` - Start automated scans
- `burp_get_findings` - Retrieve vulnerabilities
- `generate_xss_payloads` - XSS payload generation
- `generate_sqli_payloads` - SQL injection payloads
- `subdomain_enumeration` - Domain reconnaissance
- `technology_fingerprint` - Tech stack identification
- `generate_security_report` - Professional reporting
- `create_security_project` - Project management

## 🔗 Integration Benefits

- **Unified Interface**: Access both Burp Suite and custom security tools from VS Code
- **Real-time Updates**: Live scan results and findings
- **Automated Workflows**: Combine reconnaissance, scanning, and reporting
- **Professional Reporting**: Generate comprehensive security reports
- **Custom Payloads**: Context-aware attack vector generation

## 🔒 Security Notes

- Keep API keys secure and never commit them to version control
- Use environment variables for sensitive configuration
- Ensure proper network security when running MCP servers
- Follow responsible disclosure practices for any findings