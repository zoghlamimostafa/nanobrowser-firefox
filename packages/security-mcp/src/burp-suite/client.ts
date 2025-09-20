import axios, { AxiosInstance } from 'axios';

export interface BurpScanResult {
  taskId: string;
  status: 'running' | 'completed' | 'failed';
  progress?: number;
}

export interface BurpVulnerability {
  name: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  url: string;
  description: string;
  evidence: string;
  remediation: string;
  confidence: 'certain' | 'firm' | 'tentative';
}

export interface BurpConfig {
  host: string;
  port: number;
  apiKey?: string;
  useHttps?: boolean;
}

export class BurpSuiteClient {
  private client: AxiosInstance;
  private config: BurpConfig;

  constructor(config?: Partial<BurpConfig>) {
    this.config = {
      host: config?.host || 'localhost',
      port: config?.port || 1337,
      apiKey: config?.apiKey || '',
      useHttps: config?.useHttps || false,
      ...config,
    };

    const baseURL = `${this.config.useHttps ? 'https' : 'http'}://${this.config.host}:${this.config.port}`;

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
    });
  }

  async startScan(url: string, scanType: string = 'crawl_and_audit', scope?: string): Promise<BurpScanResult> {
    try {
      const payload = {
        urls: [url],
        scan_configurations: [
          {
            name: scanType,
            type: scanType === 'active' ? 'NamedConfiguration' : 'CustomConfiguration',
          },
        ],
        ...(scope && { scope: { include: [{ rule: scope }] } }),
      };

      const response = await this.client.post('/v0.1/scan', payload);

      return {
        taskId: response.data.task_id,
        status: 'running',
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
        .filter((issue: any) => !severity || issue.severity === severity)
        .map((issue: any) => this.mapBurpIssue(issue));
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

  private mapBurpIssue(issue: any): BurpVulnerability {
    return {
      name: issue.issue_name || issue.name || 'Unknown vulnerability',
      severity: this.mapSeverity(issue.severity),
      url: issue.origin || issue.url || 'Unknown URL',
      description: issue.issue_background || issue.description || 'No description available',
      evidence: issue.evidence || 'No evidence available',
      remediation: issue.remediation_background || issue.remediation || 'No remediation available',
      confidence: this.mapConfidence(issue.confidence),
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
