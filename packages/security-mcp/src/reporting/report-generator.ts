import * as fs from 'fs';
import * as path from 'path';

export interface ReportData {
  filename: string;
  size: string;
  path: string;
}

export class ReportGenerator {
  async generateReport(
    projectId: string,
    format: 'html' | 'pdf' | 'markdown' | 'json' = 'html',
    includeDetails: boolean = true,
  ): Promise<ReportData> {
    try {
      // This would integrate with SecurityDatabase to get project data
      // For now, returning a mock response

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `security-report-${projectId}-${timestamp}.${format}`;
      const reportPath = path.join(process.cwd(), 'reports', filename);

      // Ensure reports directory exists
      const reportsDir = path.dirname(reportPath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      let reportContent = '';

      switch (format) {
        case 'html':
          reportContent = this.generateHTMLReport(projectId, includeDetails);
          break;
        case 'markdown':
          reportContent = this.generateMarkdownReport(projectId, includeDetails);
          break;
        case 'json':
          reportContent = this.generateJSONReport(projectId, includeDetails);
          break;
        case 'pdf':
          // Would require a PDF library like puppeteer
          reportContent = this.generateHTMLReport(projectId, includeDetails);
          break;
        default:
          reportContent = this.generateHTMLReport(projectId, includeDetails);
      }

      fs.writeFileSync(reportPath, reportContent);

      const stats = fs.statSync(reportPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      return {
        filename,
        size: `${sizeInMB} MB`,
        path: reportPath,
      };
    } catch (error) {
      throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateHTMLReport(projectId: string, includeDetails: boolean): string {
    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nanobrowser Security Assessment Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007acc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007acc;
            margin: 0;
            font-size: 2.5em;
        }
        .header .subtitle {
            color: #666;
            font-size: 1.2em;
            margin-top: 10px;
        }
        .meta-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 6px;
        }
        .meta-item {
            display: flex;
            flex-direction: column;
        }
        .meta-label {
            font-weight: bold;
            color: #007acc;
            margin-bottom: 5px;
        }
        .severity-high { color: #dc3545; font-weight: bold; }
        .severity-medium { color: #ffc107; font-weight: bold; }
        .severity-low { color: #28a745; font-weight: bold; }
        .severity-info { color: #17a2b8; font-weight: bold; }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #007acc;
            border-bottom: 2px solid #007acc;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .vulnerability {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .vulnerability h3 {
            margin-top: 0;
            color: #333;
        }
        .vuln-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            text-align: center;
            padding: 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
        }
        .stat-high { background-color: #dc3545; }
        .stat-medium { background-color: #ffc107; }
        .stat-low { background-color: #28a745; }
        .stat-info { background-color: #17a2b8; }
        .stat-total { background-color: #6c757d; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
        }
        .code {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            margin: 10px 0;
            overflow-x: auto;
        }
        @media print {
            body { background-color: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Security Assessment Report</h1>
            <div class="subtitle">Comprehensive Vulnerability Analysis</div>
        </div>

        <div class="meta-info">
            <div class="meta-item">
                <span class="meta-label">Project ID:</span>
                <span>${projectId}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Assessment Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Tool:</span>
                <span>Nanobrowser Security MCP</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Report Type:</span>
                <span>${includeDetails ? 'Detailed' : 'Summary'}</span>
            </div>
        </div>

        <div class="section">
            <h2>Executive Summary</h2>
            <div class="stats-grid">
                <div class="stat-card stat-total">
                    <div style="font-size: 2em;">12</div>
                    <div>Total Issues</div>
                </div>
                <div class="stat-card stat-high">
                    <div style="font-size: 2em;">3</div>
                    <div>High Risk</div>
                </div>
                <div class="stat-card stat-medium">
                    <div style="font-size: 2em;">5</div>
                    <div>Medium Risk</div>
                </div>
                <div class="stat-card stat-low">
                    <div style="font-size: 2em;">2</div>
                    <div>Low Risk</div>
                </div>
                <div class="stat-card stat-info">
                    <div style="font-size: 2em;">2</div>
                    <div>Informational</div>
                </div>
            </div>
            <p>This security assessment identified <strong>12 security issues</strong> across the target application. 
            The findings include <span class="severity-high">3 high-risk vulnerabilities</span> that require immediate attention, 
            along with several medium and low-risk issues that should be addressed to improve the overall security posture.</p>
        </div>

        ${
          includeDetails
            ? `
        <div class="section">
            <h2>Detailed Findings</h2>
            
            <div class="vulnerability">
                <h3><span class="severity-high">HIGH</span> - Cross-Site Scripting (XSS)</h3>
                <div class="vuln-meta">
                    <div><strong>URL:</strong> https://example.com/search</div>
                    <div><strong>Parameter:</strong> q</div>
                    <div><strong>Method:</strong> GET</div>
                    <div><strong>Confidence:</strong> High</div>
                </div>
                <p><strong>Description:</strong> A reflected cross-site scripting vulnerability was identified in the search parameter.</p>
                <p><strong>Impact:</strong> An attacker could execute malicious JavaScript in the context of other users' browsers.</p>
                <div class="code">Payload: &lt;script&gt;alert('XSS')&lt;/script&gt;</div>
                <p><strong>Remediation:</strong> Implement proper input validation and output encoding for all user-supplied data.</p>
            </div>

            <div class="vulnerability">
                <h3><span class="severity-high">HIGH</span> - SQL Injection</h3>
                <div class="vuln-meta">
                    <div><strong>URL:</strong> https://example.com/product</div>
                    <div><strong>Parameter:</strong> id</div>
                    <div><strong>Method:</strong> GET</div>
                    <div><strong>Confidence:</strong> High</div>
                </div>
                <p><strong>Description:</strong> SQL injection vulnerability allows unauthorized database access.</p>
                <p><strong>Impact:</strong> Attacker could extract, modify, or delete sensitive database information.</p>
                <div class="code">Payload: 1' UNION SELECT user(),database(),version()--</div>
                <p><strong>Remediation:</strong> Use parameterized queries and input validation to prevent SQL injection attacks.</p>
            </div>

            <div class="vulnerability">
                <h3><span class="severity-medium">MEDIUM</span> - Missing Security Headers</h3>
                <div class="vuln-meta">
                    <div><strong>URL:</strong> https://example.com/</div>
                    <div><strong>Headers:</strong> X-Frame-Options, CSP</div>
                    <div><strong>Method:</strong> GET</div>
                    <div><strong>Confidence:</strong> High</div>
                </div>
                <p><strong>Description:</strong> The application is missing important security headers.</p>
                <p><strong>Impact:</strong> Increased risk of clickjacking and XSS attacks.</p>
                <p><strong>Remediation:</strong> Implement security headers including X-Frame-Options, Content-Security-Policy, and X-XSS-Protection.</p>
            </div>
        </div>
        `
            : ''
        }

        <div class="section">
            <h2>Risk Assessment Matrix</h2>
            <p>The following matrix categorizes vulnerabilities by impact and likelihood:</p>
            <ul>
                <li><span class="severity-high">High Risk:</span> Critical vulnerabilities requiring immediate remediation</li>
                <li><span class="severity-medium">Medium Risk:</span> Important vulnerabilities that should be addressed promptly</li>
                <li><span class="severity-low">Low Risk:</span> Minor issues that should be addressed during regular maintenance</li>
                <li><span class="severity-info">Informational:</span> Best practice recommendations and observations</li>
            </ul>
        </div>

        <div class="section">
            <h2>Recommendations</h2>
            <ol>
                <li><strong>Immediate Actions:</strong> Address all high-risk vulnerabilities immediately</li>
                <li><strong>Input Validation:</strong> Implement comprehensive input validation across all user inputs</li>
                <li><strong>Security Headers:</strong> Deploy security headers to prevent common attack vectors</li>
                <li><strong>Regular Testing:</strong> Establish regular security testing as part of the development lifecycle</li>
                <li><strong>Security Training:</strong> Provide security awareness training to development teams</li>
            </ol>
        </div>

        <div class="footer">
            <p>Report generated by Nanobrowser Security MCP on ${new Date().toLocaleString()}</p>
            <p>This assessment was performed using automated tools and may require manual verification</p>
        </div>
    </div>
</body>
</html>`;

    return template;
  }

  private generateMarkdownReport(projectId: string, includeDetails: boolean): string {
    return `# Security Assessment Report

**Project ID:** ${projectId}  
**Assessment Date:** ${new Date().toLocaleDateString()}  
**Tool:** Nanobrowser Security MCP  
**Report Type:** ${includeDetails ? 'Detailed' : 'Summary'}

## Executive Summary

This security assessment identified **12 security issues** across the target application:

- 🔴 **3 High Risk** vulnerabilities requiring immediate attention
- 🟡 **5 Medium Risk** vulnerabilities 
- 🟢 **2 Low Risk** vulnerabilities
- 🔵 **2 Informational** findings

${
  includeDetails
    ? `
## Detailed Findings

### 🔴 HIGH - Cross-Site Scripting (XSS)

**URL:** https://example.com/search  
**Parameter:** q  
**Method:** GET  
**Confidence:** High

**Description:** A reflected cross-site scripting vulnerability was identified in the search parameter.

**Impact:** An attacker could execute malicious JavaScript in the context of other users' browsers.

**Payload:**
\`\`\`
<script>alert('XSS')</script>
\`\`\`

**Remediation:** Implement proper input validation and output encoding for all user-supplied data.

### 🔴 HIGH - SQL Injection

**URL:** https://example.com/product  
**Parameter:** id  
**Method:** GET  
**Confidence:** High

**Description:** SQL injection vulnerability allows unauthorized database access.

**Impact:** Attacker could extract, modify, or delete sensitive database information.

**Payload:**
\`\`\`
1' UNION SELECT user(),database(),version()--
\`\`\`

**Remediation:** Use parameterized queries and input validation to prevent SQL injection attacks.
`
    : ''
}

## Risk Assessment

- **High Risk:** Critical vulnerabilities requiring immediate remediation
- **Medium Risk:** Important vulnerabilities that should be addressed promptly  
- **Low Risk:** Minor issues that should be addressed during regular maintenance
- **Informational:** Best practice recommendations and observations

## Recommendations

1. **Immediate Actions:** Address all high-risk vulnerabilities immediately
2. **Input Validation:** Implement comprehensive input validation across all user inputs
3. **Security Headers:** Deploy security headers to prevent common attack vectors
4. **Regular Testing:** Establish regular security testing as part of the development lifecycle
5. **Security Training:** Provide security awareness training to development teams

---
*Report generated by Nanobrowser Security MCP on ${new Date().toLocaleString()}*
`;
  }

  private generateJSONReport(projectId: string, includeDetails: boolean): string {
    const report = {
      metadata: {
        projectId,
        generatedAt: new Date().toISOString(),
        tool: 'Nanobrowser Security MCP',
        version: '1.0.0',
        reportType: includeDetails ? 'detailed' : 'summary',
      },
      summary: {
        totalIssues: 12,
        riskBreakdown: {
          high: 3,
          medium: 5,
          low: 2,
          info: 2,
        },
      },
      findings: includeDetails
        ? [
            {
              id: 'xss-001',
              name: 'Cross-Site Scripting (XSS)',
              severity: 'high',
              url: 'https://example.com/search',
              method: 'GET',
              parameter: 'q',
              payload: '<script>alert("XSS")</script>',
              description: 'Reflected XSS vulnerability in search parameter',
              impact: 'Attacker could execute malicious JavaScript in user browsers',
              remediation: 'Implement proper input validation and output encoding',
              confidence: 'high',
              status: 'new',
            },
            {
              id: 'sqli-001',
              name: 'SQL Injection',
              severity: 'high',
              url: 'https://example.com/product',
              method: 'GET',
              parameter: 'id',
              payload: "1' UNION SELECT user(),database(),version()--",
              description: 'SQL injection vulnerability allows database access',
              impact: 'Attacker could extract, modify, or delete database data',
              remediation: 'Use parameterized queries and input validation',
              confidence: 'high',
              status: 'new',
            },
          ]
        : [],
      recommendations: [
        'Address all high-risk vulnerabilities immediately',
        'Implement comprehensive input validation',
        'Deploy security headers',
        'Establish regular security testing',
        'Provide security awareness training',
      ],
    };

    return JSON.stringify(report, null, 2);
  }
}
