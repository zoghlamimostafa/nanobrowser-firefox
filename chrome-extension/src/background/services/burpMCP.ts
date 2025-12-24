// MCP Client to connect to official Burp Suite MCP Server
// File: chrome-extension/src/background/services/burpMCP.ts

export interface BurpMCPConfig {
  host: string;
  port: number;
  useSSE: boolean;
}

export interface BurpScanResult {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress?: number;
  url?: string;
}

export interface BurpVulnerability {
  id: string;
  name: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  url: string;
  description: string;
  evidence?: string;
}

class BurpMCPClient {
  private config: BurpMCPConfig;
  private connected = false;

  constructor(config: Partial<BurpMCPConfig> = {}) {
    this.config = {
      host: config.host || '127.0.0.1',
      port: config.port || 9876,
      useSSE: config.useSSE || true,
      ...config,
    };
  }

  private get baseUrl(): string {
    const protocol = 'http'; // Burp MCP server uses HTTP
    const path = this.config.useSSE ? '/sse' : '';
    return `${protocol}://${this.config.host}:${this.config.port}${path}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test MCP server availability using a simple ping
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Burp MCP server responds to root endpoint
      this.connected = response.status === 404 || response.ok; // 404 is expected for MCP server root
      return this.connected;
    } catch (error) {
      console.error('Failed to connect to Burp MCP server:', error);
      this.connected = false;
      return false;
    }
  }

  private async mcpRequest(method: string, params: any = {}): Promise<any> {
    const requestId = Math.random().toString(36).substr(2, 9);
    
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: method,
          params: params,
          id: requestId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`MCP Error: ${result.error.message}`);
      }
      
      return result.result;
    } catch (error) {
      console.error(`MCP request failed for ${method}:`, error);
      throw error;
    }
  }

  async startScan(target: string): Promise<string> {
    if (!this.connected && !(await this.testConnection())) {
      throw new Error('Not connected to Burp MCP server');
    }

    try {
      const result = await this.mcpRequest('tools/call', {
        name: 'burp_scan_url',
        arguments: {
          url: target,
          scan_type: 'crawl_and_audit'
        }
      });

      return result.scan_id || 'scan_' + Date.now();
    } catch (error) {
      console.error('Error starting scan:', error);
      throw error;
    }
  }

  async getScanStatus(taskId: string): Promise<BurpScanResult> {
    if (!this.connected && !(await this.testConnection())) {
      throw new Error('Not connected to Burp MCP server');
    }

    try {
      const response = await fetch(`${this.baseUrl}/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'get_scan_status',
          arguments: { task_id: taskId }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const content = result.content?.[0]?.text;
      
      if (content) {
        return JSON.parse(content);
      }
      
      return {
        taskId,
        status: 'running',
        progress: 0
      };
    } catch (error) {
      console.error('Error getting scan status:', error);
      throw error;
    }
  }

  async getVulnerabilities(): Promise<BurpVulnerability[]> {
    if (!this.connected && !(await this.testConnection())) {
      throw new Error('Not connected to Burp MCP server');
    }

    try {
      const response = await fetch(`${this.baseUrl}/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'get_vulnerabilities',
          arguments: {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const content = result.content?.[0]?.text;
      
      if (content) {
        return JSON.parse(content);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting vulnerabilities:', error);
      throw error;
    }
  }

  async getProjects(): Promise<any[]> {
    if (!this.connected && !(await this.testConnection())) {
      throw new Error('Not connected to Burp MCP server');
    }

    try {
      const response = await fetch(`${this.baseUrl}/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'list_projects',
          arguments: {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const content = result.content?.[0]?.text;
      
      if (content) {
        return JSON.parse(content);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  async generatePayloads(type: string, count: number = 10): Promise<string[]> {
    if (!this.connected && !(await this.testConnection())) {
      throw new Error('Not connected to Burp MCP server');
    }

    try {
      const response = await fetch(`${this.baseUrl}/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'generate_payloads',
          arguments: {
            payload_type: type,
            count: count
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const content = result.content?.[0]?.text;
      
      if (content) {
        return JSON.parse(content);
      }
      
      return [];
    } catch (error) {
      console.error('Error generating payloads:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConfig(): BurpMCPConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<BurpMCPConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.connected = false; // Reset connection status
  }
}

// Export singleton instance
export const burpMCP = new BurpMCPClient();