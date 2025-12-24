#!/bin/bash

# Security Testing Quick Start Demo
# This script demonstrates the security testing setup and basic usage

echo "🛡️  Nanobrowser Security Testing - Quick Start Demo"
echo "=================================================="
echo ""

echo "🔧 1. Extension Setup Status"
echo "-----------------------------"

# Check if Firefox extension is built
if [ -f "/home/user/Desktop/nanobrowser/dist/manifest.json" ]; then
    echo "✅ Firefox Extension: Ready for installation"
    echo "   📁 Location: /home/user/Desktop/nanobrowser/dist/"
    echo "   📋 Install: about:debugging → Load Temporary Add-on → Select manifest.json"
else
    echo "❌ Firefox Extension: Not built"
    echo "   🔧 Run: npm run build:firefox"
fi

echo ""
echo "🎯 2. Security MCP Server"
echo "-------------------------"

cd /home/user/Desktop/nanobrowser/packages/security-mcp

if [ -f "src/index.ts" ]; then
    echo "✅ Security MCP Server: Available"
    echo "   🛠️  Features:"
    echo "   - Payload Generation (XSS, SQLi, CMD)"
    echo "   - Burp Suite API Integration"
    echo "   - Vulnerability Database"
    echo "   - Professional Report Generation"
    echo "   - Reconnaissance Tools"
    
    # Test if it builds
    if npm run build > /dev/null 2>&1; then
        echo "   ✅ Build Status: Success"
    else
        echo "   ⚠️  Build Status: Check for errors"
    fi
else
    echo "❌ Security MCP Server: Not found"
fi

echo ""
echo "📱 3. Security Dashboard UI"
echo "----------------------------"

if [ -f "/home/user/Desktop/nanobrowser/pages/side-panel/src/components/SecurityDashboard.tsx" ]; then
    echo "✅ Security Dashboard: Integrated"
    echo "   🎨 Features:"
    echo "   - 📊 Overview: Project stats and status"
    echo "   - 🎯 Projects: Security project management"
    echo "   - ⚡ Scans: Automated security scanning"
    echo "   - 💻 Payloads: Interactive payload generation"
    echo "   - 🔍 Recon: Reconnaissance and fingerprinting"
else
    echo "❌ Security Dashboard: Not found"
fi

echo ""
echo "🚀 4. Quick Start Instructions"
echo "-------------------------------"
echo "Step 1: Install Extension"
echo "  1. Open Firefox"
echo "  2. Go to about:debugging"
echo "  3. Click 'This Firefox'"
echo "  4. Click 'Load Temporary Add-on'"
echo "  5. Select: /home/user/Desktop/nanobrowser/dist/manifest.json"
echo ""
echo "Step 2: Access Security Features"
echo "  1. Click Nanobrowser extension icon"
echo "  2. In side panel, click Security icon (🛡️)"
echo "  3. Explore the 5 tabs: Overview, Projects, Scans, Payloads, Recon"
echo ""
echo "Step 3: Create First Security Project"
echo "  1. Go to Projects tab"
echo "  2. Click 'New Project'"
echo "  3. Enter target URL (e.g., https://httpbin.org)"
echo "  4. Click 'Quick Scan' to test"
echo ""

echo "🔒 5. Security Testing Examples"
echo "--------------------------------"
echo ""
echo "XSS Payload Testing:"
echo "  Target: Any input field or parameter"
echo "  Payload: <script>alert('XSS Test')</script>"
echo "  Context: Form inputs, URL parameters, headers"
echo ""
echo "SQL Injection Testing:"
echo "  Target: Database-driven applications"
echo "  Payload: ' OR 1=1--"
echo "  Context: Login forms, search fields, ID parameters"
echo ""
echo "Command Injection Testing:"
echo "  Target: System command execution points"
echo "  Payload: ; ls -la"
echo "  Context: File uploads, system utilities, APIs"
echo ""

echo "🎓 6. Practice Targets (Safe for Testing)"
echo "-------------------------------------------"
echo "🔗 DVWA (Damn Vulnerable Web App):"
echo "   GitHub: https://github.com/digininja/DVWA"
echo "   Purpose: Practice XSS, SQLi, Command Injection"
echo ""
echo "🔗 WebGoat:"
echo "   Website: https://owasp.org/www-project-webgoat/"
echo "   Purpose: OWASP Top 10 vulnerabilities"
echo ""
echo "🔗 OWASP Juice Shop:"
echo "   GitHub: https://github.com/juice-shop/juice-shop"
echo "   Purpose: Modern web application security"
echo ""
echo "🔗 HTTPBin (Safe for basic testing):"
echo "   Website: https://httpbin.org"
echo "   Purpose: HTTP request/response testing"
echo ""

echo "⚠️  7. Important Security Notes"
echo "--------------------------------"
echo "🚨 ETHICAL TESTING ONLY:"
echo "   - Only test applications you own"
echo "   - Get explicit permission before testing"
echo "   - Use designated test environments"
echo "   - Follow responsible disclosure practices"
echo ""
echo "🔒 LEGAL COMPLIANCE:"
echo "   - Respect terms of service"
echo "   - Follow local cybersecurity laws"
echo "   - Document all testing activities"
echo "   - Avoid testing production systems without authorization"
echo ""

echo "🎉 Setup Complete!"
echo "=================="
echo "Your Nanobrowser extension is ready for security testing!"
echo ""
echo "Next steps:"
echo "1. Install the extension in Firefox"
echo "2. Click the Security icon (🛡️) in the side panel"
echo "3. Start with the Overview tab to see the dashboard"
echo "4. Create a test project with a safe target like HTTPBin"
echo "5. Generate some payloads and explore the features"
echo ""
echo "For detailed instructions, see: SECURITY_TESTING_SETUP.md"
echo ""
echo "Happy Ethical Security Testing! 🛡️"

cd /home/user/Desktop/nanobrowser