# 🔐 Nanobrowser Security MCP

Advanced security testing and penetration testing tools integrated with the Nanobrowser extension through Model Context Protocol (MCP).

## ✨ Features

### 🕷️ Burp Suite Integration
- **Professional API Integration**: Connect directly to Burp Suite Professional
- **Automated Scanning**: Start and manage security scans programmatically
- **Finding Management**: Retrieve and analyze vulnerability findings
- **Repeater Integration**: Send requests to Burp Repeater for manual testing

### 🎯 Payload Generation
- **XSS Payloads**: Context-aware Cross-Site Scripting payloads
- **SQL Injection**: Database-specific injection payloads
- **Command Injection**: OS-specific command injection payloads
- **Directory Traversal**: Path traversal and LFI payloads
- **NoSQL Injection**: MongoDB and other NoSQL database payloads
- **Filter Bypass**: Automatic evasion techniques

### 🔍 Vulnerability Scanning
- **Multi-threaded Scanning**: Fast, concurrent vulnerability detection
- **Comprehensive Coverage**: XSS, SQLi, LFI, RFI, Command Injection, SSRF
- **Smart Crawling**: Intelligent web application crawling
- **Confidence Scoring**: Risk assessment and confidence levels

### 🗂️ Reconnaissance Tools
- **Subdomain Enumeration**: DNS, Certificate Transparency, Wordlist-based
- **Technology Fingerprinting**: Identify web technologies and frameworks
- **Port Scanning**: Discover open services and ports
- **Metadata Gathering**: Extract robots.txt, sitemaps, and meta information

### 📊 Advanced Reporting
- **Multiple Formats**: HTML, PDF, Markdown, JSON reports
- **Executive Summaries**: High-level risk assessment
- **Detailed Findings**: Technical vulnerability details
- **Remediation Guidance**: Actionable security recommendations

### 🗄️ Project Management
- **SQLite Database**: Persistent storage for findings and projects
- **Project Organization**: Manage multiple security assessments
- **Finding Tracking**: Status management and false positive handling
- **Export Capabilities**: Complete project data export

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
cd packages/security-mcp
pnpm install

# Build the package
pnpm build
```

### 2. Start MCP Server

```bash
# Start the security MCP server
pnpm start

# Or use the CLI
npx nanobrowser-security start
```

### 3. VS Code MCP Integration

Add to your VS Code MCP configuration (`settings.json` or MCP config file):

```json
{
  "mcpServers": {
    "burp": {
      "command": "<path to Java executable packaged with Burp>",
      "args": [
        "-jar",
        "/path/to/mcp/proxy/jar/mcp-proxy-all.jar",
        "--sse-url",
        "<your Burp MCP server URL configured in the extension>"
      ]
    },
    "nanobrowser-security": {
      "command": "node",
      "args": ["/path/to/nanobrowser/packages/security-mcp/dist/index.js"],
      "env": {
        "BURP_API_KEY": "your-burp-api-key-here"
      }
    }
  }
}
```

#### Configuration Details:

- **`burp`**: Direct Burp Suite MCP proxy integration
  - Requires Burp Suite Professional/Enterprise with MCP proxy JAR
  - Uses SSE (Server-Sent Events) for real-time communication
  - Configure the SSE URL in your Burp Suite extension settings

- **`nanobrowser-security`**: Native Nanobrowser Security MCP server
  - Provides security testing tools and payload generation
  - Integrates with Burp Suite via REST API (port 1337)
  - Set `BURP_API_KEY` environment variable for authentication

## 🛠️ Usage Examples

### Create Security Project

```typescript
// Create a new security testing project
const project = await createSecurityProject({
  name: "E-commerce Security Assessment",
  target: "https://shop.example.com",
  scope: "*.example.com",
  methodology: "OWASP Testing Guide"
});
```

### Burp Suite Integration

```typescript
// Start automated scan in Burp Suite
const scan = await burpScanTarget({
  url: "https://example.com",
  scanType: "crawl_and_audit",
  scope: "https://example.com/*"
});

// Get findings
const findings = await burpGetFindings({
  taskId: scan.taskId,
  severity: "high"
});
```

### Payload Generation

```typescript
// Generate XSS payloads
const xssPayloads = await generateXssPayloads({
  context: "html",
  encoding: "url",
  filters: ["script", "alert"]
});

// Generate SQL injection payloads
const sqliPayloads = await generateSqliPayloads({
  dbType: "mysql",
  technique: "union",
  prefix: "'",
  suffix: "--"
});
```

### Reconnaissance

```typescript
// Enumerate subdomains
const subdomains = await subdomainEnumeration({
  domain: "example.com",
  methods: ["dns", "certificate", "wordlist"],
  wordlist: "/path/to/custom/wordlist.txt"
});

// Technology fingerprinting
const technologies = await technologyFingerprint({
  url: "https://example.com",
  headers: true,
  content: true
});
```

### Vulnerability Scanning

```typescript
// Custom vulnerability scan
const results = await customVulnerabilityScan({
  target: "https://example.com",
  scanModules: ["xss", "sqli", "lfi", "cmd_injection"],
  depth: 3,
  threads: 10
});
```

### Report Generation

```typescript
// Generate comprehensive security report
const report = await generateSecurityReport({
  projectId: "sec_abc123",
  format: "html",
  includeDetails: true
});
```

## 🔧 Configuration

### Burp Suite Setup

1. **Enable Burp API**: Go to User Options → Misc → REST API
2. **Set API Key**: Generate and configure API key
3. **Configure MCP**: Set Burp host, port, and API key

```bash
nanobrowser-security config \
  --burp-host localhost \
  --burp-port 1337 \
  --burp-api-key "your-api-key"
```

### Database Configuration

```bash
# Set custom database path
nanobrowser-security config --db-path "/path/to/security.db"
```

## 📋 Available MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `burp_scan_target` | Start Burp Suite scan | url, scanType, scope |
| `burp_get_findings` | Get scan findings | taskId, severity |
| `generate_xss_payloads` | Generate XSS payloads | context, encoding, filters |
| `generate_sqli_payloads` | Generate SQL injection payloads | dbType, technique, prefix, suffix |
| `subdomain_enumeration` | Find subdomains | domain, methods, wordlist |
| `technology_fingerprint` | Identify technologies | url, headers, content |
| `custom_vulnerability_scan` | Run vulnerability scan | target, scanModules, depth, threads |
| `generate_security_report` | Create security report | projectId, format, includeDetails |
| `create_security_project` | New security project | name, target, scope, methodology |
| `list_security_projects` | List all projects | status |

## 🎯 Integration with Nanobrowser

This MCP server is designed to work seamlessly with the Nanobrowser extension:

- **Browser Context**: Leverage extension's browser access for testing
- **Real-time Testing**: Test vulnerabilities in live browser sessions
- **DOM Analysis**: Deep inspection of rendered content
- **Session Management**: Maintain authentication during testing
- **Cookie Handling**: Automatic session cookie management

## 🔒 Security Considerations

- **Authorized Testing Only**: Only test applications you own or have permission to test
- **API Key Security**: Keep Burp Suite API keys secure and rotate regularly
- **Database Encryption**: Consider encrypting the SQLite database for sensitive projects
- **Network Security**: Use secure connections when possible
- **Rate Limiting**: Implement request throttling to avoid overwhelming targets

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🔗 Related Projects

- [Nanobrowser Extension](../../chrome-extension/) - Main browser extension
- [Nanobrowser Firefox](https://github.com/zoghlamimostafa/nanobrowser-firefox) - Firefox version
- [Model Context Protocol](https://github.com/modelcontextprotocol/servers) - MCP specification

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/zoghlamimostafa/nanobrowser-firefox/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zoghlamimostafa/nanobrowser-firefox/discussions)
- **Security**: For security issues, please email security@nanobrowser.com

---

**⚠️ Disclaimer**: This tool is for authorized security testing only. Users are responsible for ensuring they have proper permission before testing any systems. Unauthorized testing is illegal and unethical.