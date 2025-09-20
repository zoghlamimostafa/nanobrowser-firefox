#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';

import { BurpSuiteClient } from './burp-suite/client.js';
import { VulnerabilityScanner } from './scanner/vulnerability-scanner.js';
import { PayloadGenerator } from './payloads/payload-generator.js';
import { ReconTools } from './recon/recon-tools.js';
import { ReportGenerator } from './reporting/report-generator.js';
import { SecurityDatabase } from './database/security-database.js';

class SecurityMCPServer {
  private server: Server;
  private burpClient: BurpSuiteClient;
  private scanner: VulnerabilityScanner;
  private payloadGen: PayloadGenerator;
  private recon: ReconTools;
  private reporter: ReportGenerator;
  private database: SecurityDatabase;

  constructor() {
    this.server = new Server(
      {
        name: 'nanobrowser-security-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.burpClient = new BurpSuiteClient();
    this.scanner = new VulnerabilityScanner();
    this.payloadGen = new PayloadGenerator();
    this.recon = new ReconTools();
    this.reporter = new ReportGenerator();
    this.database = new SecurityDatabase();

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Burp Suite Integration
        {
          name: 'burp_scan_target',
          description: 'Start an automated scan of a target URL using Burp Suite Professional',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Target URL to scan' },
              scanType: {
                type: 'string',
                enum: ['active', 'passive', 'crawl_and_audit'],
                description: 'Type of scan to perform',
              },
              scope: { type: 'string', description: 'Scan scope configuration' },
            },
            required: ['url'],
          },
        },
        {
          name: 'burp_get_findings',
          description: 'Retrieve vulnerability findings from Burp Suite',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'Scan task ID' },
              severity: {
                type: 'string',
                enum: ['high', 'medium', 'low', 'info'],
                description: 'Filter by severity level',
              },
            },
          },
        },

        // Payload Generation
        {
          name: 'generate_xss_payloads',
          description: 'Generate XSS payloads for testing',
          inputSchema: {
            type: 'object',
            properties: {
              context: {
                type: 'string',
                enum: ['html', 'attribute', 'javascript', 'css'],
                description: 'XSS context for payload generation',
              },
              encoding: { type: 'string', description: 'Encoding requirements' },
              filters: { type: 'array', items: { type: 'string' }, description: 'Known filters to bypass' },
            },
            required: ['context'],
          },
        },
        {
          name: 'generate_sqli_payloads',
          description: 'Generate SQL injection payloads',
          inputSchema: {
            type: 'object',
            properties: {
              dbType: {
                type: 'string',
                enum: ['mysql', 'postgresql', 'mssql', 'oracle', 'sqlite'],
                description: 'Database type',
              },
              technique: {
                type: 'string',
                enum: ['union', 'boolean', 'time', 'error'],
                description: 'SQL injection technique',
              },
              prefix: { type: 'string', description: 'Payload prefix' },
              suffix: { type: 'string', description: 'Payload suffix' },
            },
            required: ['dbType', 'technique'],
          },
        },

        // Reconnaissance
        {
          name: 'subdomain_enumeration',
          description: 'Enumerate subdomains for a target domain',
          inputSchema: {
            type: 'object',
            properties: {
              domain: { type: 'string', description: 'Target domain' },
              methods: {
                type: 'array',
                items: { type: 'string' },
                description: 'Enumeration methods to use',
              },
              wordlist: { type: 'string', description: 'Custom wordlist file path' },
            },
            required: ['domain'],
          },
        },
        {
          name: 'technology_fingerprint',
          description: 'Identify technologies used by a web application',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Target URL' },
              headers: { type: 'boolean', description: 'Analyze response headers' },
              content: { type: 'boolean', description: 'Analyze page content' },
            },
            required: ['url'],
          },
        },

        // Vulnerability Scanning
        {
          name: 'custom_vulnerability_scan',
          description: 'Perform custom vulnerability scanning',
          inputSchema: {
            type: 'object',
            properties: {
              target: { type: 'string', description: 'Target URL or IP' },
              scanModules: {
                type: 'array',
                items: { type: 'string' },
                description: 'Vulnerability modules to run',
              },
              depth: { type: 'integer', description: 'Crawling depth' },
              threads: { type: 'integer', description: 'Number of threads' },
            },
            required: ['target'],
          },
        },

        // Reporting
        {
          name: 'generate_security_report',
          description: 'Generate a comprehensive security testing report',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string', description: 'Security testing project ID' },
              format: {
                type: 'string',
                enum: ['html', 'pdf', 'markdown', 'json'],
                description: 'Report format',
              },
              includeDetails: { type: 'boolean', description: 'Include detailed vulnerability information' },
            },
            required: ['projectId'],
          },
        },

        // Database Operations
        {
          name: 'create_security_project',
          description: 'Create a new security testing project',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Project name' },
              target: { type: 'string', description: 'Target application URL' },
              scope: { type: 'string', description: 'Testing scope description' },
              methodology: { type: 'string', description: 'Testing methodology' },
            },
            required: ['name', 'target'],
          },
        },
        {
          name: 'list_security_projects',
          description: 'List all security testing projects',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['active', 'completed', 'paused'],
                description: 'Filter by project status',
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'burp_scan_target':
            return await this.handleBurpScan(args);
          case 'burp_get_findings':
            return await this.handleBurpFindings(args);
          case 'generate_xss_payloads':
            return await this.handleXSSPayloads(args);
          case 'generate_sqli_payloads':
            return await this.handleSQLiPayloads(args);
          case 'subdomain_enumeration':
            return await this.handleSubdomainEnum(args);
          case 'technology_fingerprint':
            return await this.handleTechFingerprint(args);
          case 'custom_vulnerability_scan':
            return await this.handleVulnScan(args);
          case 'generate_security_report':
            return await this.handleReportGeneration(args);
          case 'create_security_project':
            return await this.handleCreateProject(args);
          case 'list_security_projects':
            return await this.handleListProjects(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  }

  // Tool handlers
  private async handleBurpScan(args: any) {
    const result = await this.burpClient.startScan(args.url, args.scanType, args.scope);
    return {
      content: [
        {
          type: 'text',
          text: `Started Burp Suite scan with task ID: ${result.taskId}\nTarget: ${args.url}\nScan Type: ${args.scanType}\nStatus: ${result.status}`,
        },
      ],
    };
  }

  private async handleBurpFindings(args: any) {
    const findings = await this.burpClient.getFindings(args.taskId, args.severity);
    return {
      content: [
        {
          type: 'text',
          text:
            `Found ${findings.length} vulnerabilities:\n\n` +
            findings.map(f => `• ${f.severity}: ${f.name} - ${f.url}`).join('\n'),
        },
      ],
    };
  }

  private async handleXSSPayloads(args: any) {
    const payloads = await this.payloadGen.generateXSSPayloads(args.context, args.encoding, args.filters);
    return {
      content: [
        {
          type: 'text',
          text:
            `Generated ${payloads.length} XSS payloads for ${args.context} context:\n\n` +
            payloads
              .slice(0, 10)
              .map((p, i) => `${i + 1}. ${p}`)
              .join('\n') +
            (payloads.length > 10 ? `\n\n... and ${payloads.length - 10} more payloads` : ''),
        },
      ],
    };
  }

  private async handleSQLiPayloads(args: any) {
    const payloads = await this.payloadGen.generateSQLiPayloads(args.dbType, args.technique, args.prefix, args.suffix);
    return {
      content: [
        {
          type: 'text',
          text:
            `Generated ${payloads.length} SQL injection payloads for ${args.dbType} (${args.technique}):\n\n` +
            payloads
              .slice(0, 10)
              .map((p, i) => `${i + 1}. ${p}`)
              .join('\n') +
            (payloads.length > 10 ? `\n\n... and ${payloads.length - 10} more payloads` : ''),
        },
      ],
    };
  }

  private async handleSubdomainEnum(args: any) {
    const subdomains = await this.recon.enumerateSubdomains(args.domain, args.methods, args.wordlist);
    return {
      content: [
        {
          type: 'text',
          text:
            `Found ${subdomains.length} subdomains for ${args.domain}:\n\n` +
            subdomains.map(s => `• ${s.subdomain} (${s.ip}) - ${s.status}`).join('\n'),
        },
      ],
    };
  }

  private async handleTechFingerprint(args: any) {
    const technologies = await this.recon.identifyTechnologies(args.url, args.headers, args.content);
    return {
      content: [
        {
          type: 'text',
          text:
            `Technology fingerprint for ${args.url}:\n\n` +
            Object.entries(technologies)
              .map(([category, techs]) => `${category}:\n${(techs as string[]).map(t => `  • ${t}`).join('\n')}`)
              .join('\n\n'),
        },
      ],
    };
  }

  private async handleVulnScan(args: any) {
    const results = await this.scanner.performScan(args.target, args.scanModules, args.depth, args.threads);
    return {
      content: [
        {
          type: 'text',
          text:
            `Vulnerability scan completed for ${args.target}:\n\n` +
            `• ${results.high} High severity vulnerabilities\n` +
            `• ${results.medium} Medium severity vulnerabilities\n` +
            `• ${results.low} Low severity vulnerabilities\n` +
            `• ${results.info} Informational findings\n\n` +
            'Detailed results saved to database.',
        },
      ],
    };
  }

  private async handleReportGeneration(args: any) {
    const report = await this.reporter.generateReport(args.projectId, args.format, args.includeDetails);
    return {
      content: [
        {
          type: 'text',
          text: `Security report generated:\n\nFormat: ${args.format}\nFile: ${report.filename}\nSize: ${report.size}\n\nReport includes:\n• Executive Summary\n• Vulnerability Details\n• Risk Assessment\n• Remediation Recommendations`,
        },
      ],
    };
  }

  private async handleCreateProject(args: any) {
    const project = await this.database.createProject({
      name: args.name,
      target: args.target,
      scope: args.scope,
      methodology: args.methodology,
      status: args.status || 'active',
    });
    return {
      content: [
        {
          type: 'text',
          text: `Created security testing project:\n\nID: ${project.id}\nName: ${project.name}\nTarget: ${project.target}\nCreated: ${project.created}\nStatus: ${project.status}`,
        },
      ],
    };
  }

  private async handleListProjects(args: any) {
    const projects = await this.database.listProjects(args.status);
    return {
      content: [
        {
          type: 'text',
          text:
            `Security Testing Projects:\n\n` + projects.map(p => `• ${p.name} (${p.status}) - ${p.target}`).join('\n'),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Nanobrowser Security MCP Server running on stdio');
  }
}

async function main() {
  const server = new SecurityMCPServer();
  await server.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SecurityMCPServer };
