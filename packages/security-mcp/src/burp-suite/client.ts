import axios, { type AxiosInstance } from 'axios';

export interface BurpScanResult {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress?: number;
  url?: string;
  scanMetrics?: {
    requestCount: number;
    responseCount: number;
    errorCount: number;
  };
}

export interface BurpRawIssue {
  serialNumber: number;
  type: number;
  name: string;
  issue_name?: string;
  host: string;
  path: string;
  severity: string;
  confidence: string;
  issueBackground?: string;
  issue_background?: string;
  description?: string;
  remediationBackground?: string;
  remediation_background?: string;
  remediation?: string;
  issueDetail?: string;
  remediationDetail?: string;
  evidence?: string;
  origin?: string;
  url?: string;
}

export interface BurpVulnerability {
  serialNumber: number;
  type: number;
  name: string;
  host: string;
  path: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  confidence: 'certain' | 'firm' | 'tentative';
  issueBackground?: string;
  remediationBackground?: string;
  issueDetail?: string;
  remediationDetail?: string;
  requestResponse?: {
    request: string;
    response: string;
  };
}

export interface BurpScanConfig {
  urls: string[];
  scanType?: 'crawl_and_audit' | 'crawl_only' | 'audit_only';
  scope?: {
    include?: string[];
    exclude?: string[];
  };
  resourcePool?: number;
  reportType?: 'XML' | 'HTML' | 'JSON';
}

export interface BurpProject {
  projectId: string;
  name: string;
  description?: string;
  created: string;
}

export interface BurpConfig {
  apiKey: string;
  baseUrl: string;
  port?: number;
}

export class BurpSuiteClient {
  private config: BurpConfig;
  private client: AxiosInstance;

  constructor(config?: Partial<BurpConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.BURP_API_KEY || '',
      baseUrl: config?.baseUrl || 'http://127.0.0.1',
      port: config?.port || 1337, // Burp Suite REST API default port
    };

    this.client = axios.create({
      baseURL: `${this.config.baseUrl}:${this.config.port}/v0.1`,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Test connection to Burp Suite
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/v0.1/knowledge_base/');
      return response.status === 200;
    } catch (error) {
      console.warn('Burp Suite connection test failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Get Burp Suite version info
  async getVersion(): Promise<string> {
    try {
      const response = await this.client.get('/v0.1/version');
      return response.data.version || 'Unknown';
    } catch (error) {
      throw new Error(`Failed to get version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create a new scan
  async startScan(config: BurpScanConfig): Promise<BurpScanResult> {
    try {
      const payload = {
        urls: config.urls,
        scan_configurations: [
          {
            name: config.scanType || 'crawl_and_audit',
            type: 'NamedConfiguration',
          },
        ],
        ...(config.scope && {
          scope: {
            include: config.scope.include?.map(rule => ({ rule })) || [],
            exclude: config.scope.exclude?.map(rule => ({ rule })) || [],
          },
        }),
        ...(config.resourcePool && { resource_pool: config.resourcePool }),
      };

      const response = await this.client.post('/v0.1/scan', payload);

      return {
        taskId: response.data.task_id,
        status: 'running',
        url: config.urls[0],
      };
    } catch (error) {
      console.error('Error starting Burp scan:', error);
      throw new Error(`Failed to start Burp scan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getScanStatus(taskId: string): Promise<BurpScanResult> {
    try {
      const response = await this.client.get(`/v0.1/scan/${taskId}`);

      return {
        taskId,
        status: this.mapBurpStatus(response.data.scan_status),
        progress: response.data.scan_metrics?.crawl_and_audit_progress || 0,
      };
    } catch (error) {
      console.error('Error getting scan status:', error);
      throw new Error(`Failed to get scan status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFindings(taskId?: string, severity?: string): Promise<BurpVulnerability[]> {
    try {
      let endpoint = '/v0.1/knowledge_base/issue_definitions';
      if (taskId) {
        endpoint = `/v0.1/scan/${taskId}/issues`;
      }

      const response = await this.client.get(endpoint);
      const issues = response.data.issues || response.data;

      return issues
        .filter((issue: BurpRawIssue) => !severity || issue.severity === severity)
        .map((issue: BurpRawIssue) => this.mapBurpIssue(issue));
    } catch (error) {
      console.error('Error getting findings:', error);
      throw new Error(`Failed to get findings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportScan(taskId: string, format: 'html' | 'xml' | 'json' = 'json'): Promise<string> {
    try {
      const response = await this.client.get(`/v0.1/scan/${taskId}/report`, {
        params: { report_type: format },
        responseType: format === 'json' ? 'json' : 'text',
      });

      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error('Error exporting scan:', error);
      throw new Error(`Failed to export scan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendToRepeater(
    url: string,
    method: string = 'GET',
    headers?: Record<string, string>,
    body?: string,
  ): Promise<boolean> {
    try {
      const payload = {
        url,
        method,
        headers: headers || {},
        body: body || '',
      };

      await this.client.post('/v0.1/repeater/send', payload);
      return true;
    } catch (error) {
      console.error('Error sending to Repeater:', error);
      return false;
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const response = await this.client.get('/v0.1/');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  private mapBurpStatus(status: string): 'running' | 'completed' | 'failed' {
    switch (status.toLowerCase()) {
      case 'running':
      case 'queued':
        return 'running';
      case 'succeeded':
      case 'finished':
        return 'completed';
      case 'failed':
      case 'cancelled':
        return 'failed';
      default:
        return 'running';
    }
  }

  private mapBurpIssue(issue: BurpRawIssue): BurpVulnerability {
    return {
      serialNumber: issue.serialNumber || 0,
      type: issue.type || 0,
      name: issue.issue_name || issue.name || 'Unknown vulnerability',
      host: issue.host || 'Unknown host',
      path: issue.path || '/',
      severity: this.mapSeverity(issue.severity),
      confidence: this.mapConfidence(issue.confidence),
      issueBackground: issue.issue_background || issue.issueBackground || 'No description available',
      remediationBackground: issue.remediation_background || issue.remediationBackground || 'No remediation available',
      issueDetail: issue.issueDetail || issue.evidence || 'No details available',
      remediationDetail: issue.remediationDetail || 'No remediation details available',
    };
  }

  private mapSeverity(severity: string): 'high' | 'medium' | 'low' | 'info' {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      case 'information':
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }

  private mapConfidence(confidence: string): 'certain' | 'firm' | 'tentative' {
    switch (confidence?.toLowerCase()) {
      case 'certain':
        return 'certain';
      case 'firm':
        return 'firm';
      case 'tentative':
        return 'tentative';
      default:
        return 'tentative';
    }
  }
}
