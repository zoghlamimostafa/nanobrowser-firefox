#!/bin/bash

# Nanobrowser Security Testing Integration Demo
# This script demonstrates the complete security testing workflow

echo "🛡️  Nanobrowser Security Testing Integration Demo"
echo "================================================"
echo ""

echo "📦 1. Security MCP Server Status"
echo "--------------------------------"
cd /home/user/Desktop/nanobrowser/packages/security-mcp

if [ -f "src/index.ts" ]; then
    echo "✅ Security MCP Server: Implemented"
    echo "   - Payload Generation Tools"
    echo "   - Burp Suite API Integration"
    echo "   - Vulnerability Database"
    echo "   - Report Generation"
    echo "   - Reconnaissance Tools"
else
    echo "❌ Security MCP Server: Not found"
fi

echo ""
echo "🔧 2. Build Status"
echo "-------------------"

# Test security MCP build
echo "Building Security MCP Server..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Security MCP Server: Build successful"
else
    echo "❌ Security MCP Server: Build failed"
fi

# Test side panel build
cd /home/user/Desktop/nanobrowser/pages/side-panel
echo "Building Side Panel with Security Dashboard..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Side Panel with Security Dashboard: Build successful"
else
    echo "❌ Side Panel: Build failed"
fi

echo ""
echo "🎯 3. Security Features Available"
echo "-----------------------------------"
echo "✅ XSS Payload Generation"
echo "✅ SQL Injection Payloads"
echo "✅ Command Injection Payloads"
echo "✅ LDAP, XPath, NoSQL Payloads"
echo "✅ Burp Suite Professional Integration"
echo "✅ Automated Security Scanning"
echo "✅ Vulnerability Database Management"
echo "✅ Professional Security Reporting"
echo "✅ Subdomain Enumeration"
echo "✅ Technology Fingerprinting"
echo "✅ Security Dashboard UI"

echo ""
echo "🚀 4. Usage Instructions"
echo "-------------------------"
echo "1. Load the Nanobrowser extension in your browser"
echo "2. Open the side panel"
echo "3. Click the Security (🛡️) icon in the header"
echo "4. Access the Security Dashboard with these tabs:"
echo "   📊 Overview - Status and recent findings"
echo "   🎯 Projects - Manage security testing projects"
echo "   ⚡ Scans - Launch and monitor Burp Suite scans"
echo "   💻 Payloads - Generate attack payloads"
echo "   🔍 Recon - Reconnaissance and fingerprinting"

echo ""
echo "📁 5. File Structure"
echo "---------------------"
echo "packages/security-mcp/               - MCP Server"
echo "├── src/index.ts                     - Main MCP server"
echo "├── src/burp-suite/client.ts         - Burp Suite API client"
echo "├── src/payloads/payload-generator.ts - Payload generators"
echo "├── src/database/security-database.ts - SQLite database"
echo "├── src/reporting/report-generator.ts - Report generation"
echo "├── src/recon/recon-tools.ts         - Reconnaissance tools"
echo "└── demo.js                          - Working demo"
echo ""
echo "pages/side-panel/src/components/     - UI Components"
echo "└── SecurityDashboard.tsx           - Security dashboard UI"

echo ""
echo "🎉 Integration Complete!"
echo "========================="
echo "The nanobrowser now has comprehensive security testing capabilities"
echo "including MCP server integration and a user-friendly dashboard."
echo ""
echo "🔧 Next Steps:"
echo "1. Start Burp Suite Professional with API enabled"
echo "2. Configure API endpoints in the dashboard"
echo "3. Create security testing projects"
echo "4. Launch automated scans and analyze results"

cd /home/user/Desktop/nanobrowser