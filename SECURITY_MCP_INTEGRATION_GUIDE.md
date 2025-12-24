// Security MCP Client Service for Nanobrowser
// Location: chrome-extension/src/background/services/securityMCP.ts

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface SecurityMCPService {
  startBurpScan(target: string): Promise<string>;
  getBurpScanStatus(taskId: string): Promise<any>;
  generatePayloads(type: string): Promise<string[]>;
  getFindings(): Promise<any[]>;
  getProjects(): Promise<any[]>;
}

class SecurityMCPClient implements SecurityMCPService {
  private client: Client | null = null;
  private connected = false;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      // Connect to the Security MCP Server
      // The server should be running: node packages/security-mcp/src/index.ts
      const transport = new StdioClientTransport({
        command: 'node',
        args: ['packages/security-mcp/src/index.ts'],
        cwd: process.cwd(),
      });

      this.client = new Client(
        {
          name: 'nanobrowser-security-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        },
      );

      await this.client.connect(transport);
      this.connected = true;
      console.log('Security MCP Client connected successfully');
    } catch (error) {
      console.error('Failed to connect to Security MCP Server:', error);
      this.connected = false;
    }
  }

  async startBurpScan(target: string): Promise<string> {
    if (!this.client || !this.connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: 'burp_start_scan',
            arguments: {
              urls: [target],
              scanType: 'crawl_and_audit'
            }
          }
        },
        { timeout: 30000 }
      );

      return response.content[0].text; // Returns taskId
    } catch (error) {
      console.error('Error starting Burp scan:', error);
      throw error;
    }
  }

  async getBurpScanStatus(taskId: string): Promise<any> {
    if (!this.client || !this.connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: 'burp_scan_status',
            arguments: { taskId }
          }
        },
        { timeout: 10000 }
      );

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error getting scan status:', error);
      throw error;
    }
  }

  async generatePayloads(type: string): Promise<string[]> {
    if (!this.client || !this.connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: 'generate_payloads',
            arguments: {
              type,
              count: 10,
              context: 'web_application'
            }
          }
        },
        { timeout: 15000 }
      );

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error generating payloads:', error);
      throw error;
    }
  }

  async getFindings(): Promise<any[]> {
    if (!this.client || !this.connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: 'get_vulnerabilities',
            arguments: {}
          }
        },
        { timeout: 10000 }
      );

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error getting findings:', error);
      throw error;
    }
  }

  async getProjects(): Promise<any[]> {
    if (!this.client || !this.connected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.request(
        {
          method: 'tools/call',
          params: {
            name: 'list_projects',
            arguments: {}
          }
        },
        { timeout: 10000 }
      );

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
    }
  }
}

// Export singleton instance
export const securityMCP = new SecurityMCPClient();