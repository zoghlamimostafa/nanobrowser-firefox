# 🛡️ Security Testing Setup Guide

This guide will walk you through setting up and using the Security Testing features in Nanobrowser.

## 📋 Prerequisites

### 1. Install the Extension
1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from the `/dist` folder in your nanobrowser directory

### 2. Install Burp Suite Professional (Optional but Recommended)
1. Download [Burp Suite Professional](https://portswigger.net/burp/pro) (free trial available)
2. Install and launch Burp Suite
3. Enable the REST API:
   - Go to **Settings** → **Suite** → **REST API**
   - Check "Enable REST API"
   - Set API key (optional but recommended for security)
   - Note the API URL (usually `http://localhost:1337`)

## 🚀 Getting Started

### 1. Access Security Dashboard
1. Click the Nanobrowser extension icon in Firefox
2. In the side panel, click the **Security** icon (🛡️) in the header
3. The Security Dashboard will open with 5 main tabs

### 2. Dashboard Overview

#### 📊 **Overview Tab**
- **Active Projects**: Shows number of current security testing projects
- **Total Findings**: Displays discovered vulnerabilities
- **Burp Suite Status**: Connection status with Burp Suite Professional
- **Recent Findings**: Latest discovered security issues

#### 🎯 **Projects Tab**
- Create and manage security testing projects
- Set target URLs and scope
- Track project status (active, completed, paused)
- View findings count per project

#### ⚡ **Scans Tab**
- Launch automated security scans
- Monitor scan progress in real-time
- View scan results and findings
- Integration with Burp Suite Professional

#### 💻 **Payloads Tab**
- Generate custom attack payloads
- Support for multiple attack vectors:
  - **XSS (Cross-Site Scripting)**
  - **SQL Injection**
  - **Command Injection**
- Context-aware payload generation
- Copy payloads to clipboard for manual testing

#### 🔍 **Recon Tab**
- **Subdomain Enumeration**: Discover subdomains for target domains
- **Technology Fingerprinting**: Identify technologies used by websites
- **Network Reconnaissance**: Gather information about targets

## 🔧 Configuration

### Burp Suite Integration
1. **Start Burp Suite Professional**
2. **Enable REST API** (Settings → Suite → REST API)
3. **Configure API Access**:
   - URL: `http://localhost:1337`
   - API Key: (if configured in Burp Suite)
4. **Test Connection** in the Overview tab

### Security Projects
1. Click **"New Project"** in the Projects tab
2. Enter project details:
   - **Project Name**: Descriptive name for your test
   - **Target URL**: Website or application to test
   - **Scope**: Define what's in scope for testing
3. Save the project

## 📈 Usage Workflows

### 1. Quick Vulnerability Scan
```
1. Projects Tab → Create New Project
2. Enter target URL (e.g., https://example.com)
3. Click "Quick Scan" to launch automated testing
4. Monitor progress in Scans Tab
5. Review findings in Overview Tab
```

### 2. Manual Payload Testing
```
1. Payloads Tab → Select attack type (XSS/SQLi/CMD)
2. Generate custom payloads
3. Copy payloads to clipboard
4. Manually test in target application
5. Document findings in project notes
```

### 3. Reconnaissance Workflow
```
1. Recon Tab → Subdomain Enumeration
2. Enter target domain (e.g., example.com)
3. Click "Enumerate" to discover subdomains
4. Technology Fingerprinting → Enter full URL
5. Click "Fingerprint" to identify technologies
6. Use results to plan targeted attacks
```

### 4. Comprehensive Security Assessment
```
1. Create security project for target
2. Perform reconnaissance to gather information
3. Launch automated scans via Burp Suite integration
4. Generate custom payloads for manual testing
5. Document all findings in the project
6. Export professional security reports
```

## 🎯 Attack Vector Examples

### XSS (Cross-Site Scripting)
- **Stored XSS**: `<script>alert('Stored XSS')</script>`
- **Reflected XSS**: `"><script>alert('Reflected XSS')</script>`
- **DOM-based XSS**: `javascript:alert('DOM XSS')`

### SQL Injection
- **Union-based**: `' UNION SELECT 1,2,3--`
- **Boolean-based**: `' AND 1=1--`
- **Time-based**: `'; WAITFOR DELAY '00:00:05'--`

### Command Injection
- **Linux**: `; ls -la`
- **Windows**: `& dir`
- **Universal**: `| whoami`

## 📊 Report Generation

### Available Report Formats
1. **HTML Reports**: Interactive web-based reports
2. **PDF Reports**: Professional documents for stakeholders
3. **Markdown Reports**: Developer-friendly documentation
4. **JSON Reports**: Machine-readable data export

### Generating Reports
1. Complete security testing project
2. Go to Projects Tab → Select project
3. Click "Generate Report"
4. Choose format and export location
5. Reports include:
   - Executive summary
   - Technical findings
   - Remediation recommendations
   - CVSS scoring

## 🔒 Security Best Practices

### Ethical Testing Guidelines
- **Only test applications you own or have explicit permission to test**
- **Respect rate limits and don't overwhelm target systems**
- **Follow responsible disclosure for discovered vulnerabilities**
- **Document all testing activities for audit trails**

### Target Selection
- **Start with staging/test environments**
- **Verify scope and permissions before testing**
- **Use isolated test targets when possible**
- **Avoid testing production systems without proper authorization**

## 🐛 Troubleshooting

### Common Issues

#### Burp Suite Connection Failed
```
Problem: "Disconnected" status in Overview tab
Solution:
1. Verify Burp Suite Professional is running
2. Check REST API is enabled (Settings → Suite → REST API)
3. Confirm API URL is http://localhost:1337
4. Check firewall settings
```

#### Payloads Not Working
```
Problem: Generated payloads don't trigger vulnerabilities
Solution:
1. Verify target is actually vulnerable
2. Check payload encoding/filtering
3. Try different payload contexts
4. Review application security controls
```

#### Scan Results Empty
```
Problem: Automated scans return no findings
Solution:
1. Verify target URL is accessible
2. Check scan scope configuration
3. Ensure Burp Suite has proper proxy settings
4. Review scan logs for errors
```

## 📚 Advanced Features

### Custom Payload Development
- Modify payload generators in the MCP server
- Add new attack vector support
- Implement custom encoding schemes
- Create context-specific payloads

### Integration with External Tools
- Export findings to vulnerability management systems
- Import scan results from other security tools
- Integrate with CI/CD pipelines for automated testing
- Connect with SIEM systems for monitoring

### Automated Reporting
- Schedule regular security scans
- Generate automated compliance reports
- Set up finding notifications
- Create custom report templates

## 🎓 Learning Resources

### Recommended Reading
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Burp Suite Documentation](https://portswigger.net/burp/documentation)
- [Web Application Security Testing](https://owasp.org/www-project-top-ten/)

### Practice Platforms
- **DVWA (Damn Vulnerable Web Application)**
- **WebGoat**
- **bWAPP**
- **OWASP Juice Shop**

## 📞 Support

### Getting Help
- Check the troubleshooting section above
- Review error logs in browser developer tools
- Verify all prerequisites are met
- Test with simple targets first

### Feature Requests
- Document your use case clearly
- Provide examples of desired functionality
- Consider contributing to the project
- Share feedback on existing features

---

## 🎉 Quick Start Checklist

- [ ] Install Nanobrowser extension in Firefox
- [ ] Access Security Dashboard (🛡️ icon)
- [ ] Install Burp Suite Professional (optional)
- [ ] Create your first security project
- [ ] Generate test payloads
- [ ] Run reconnaissance on a test target
- [ ] Review findings and generate report

**Happy Security Testing! 🛡️**

> ⚠️ **Remember**: Always test ethically and only on systems you own or have explicit permission to test!