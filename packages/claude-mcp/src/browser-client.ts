import WebSocket from 'ws';
import axios from 'axios';

/**
 * Client for communicating with the Nanobrowser Chrome extension
 * Bridges MCP protocol with browser automation commands
 */
export class BrowserClient {
  private wsUrl: string;
  private httpUrl: string;
  private ws: WebSocket | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>();

  constructor() {
    // Connection to Nanobrowser extension
    this.wsUrl = process.env.NANOBROWSER_WS_URL || 'ws://localhost:9222';
    this.httpUrl = process.env.NANOBROWSER_HTTP_URL || 'http://localhost:8080';
  }

  private async ensureConnection(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
          console.error('Connected to Nanobrowser extension');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.id && this.pendingRequests.has(message.id)) {
              const { resolve, reject } = this.pendingRequests.get(message.id)!;
              this.pendingRequests.delete(message.id);

              if (message.error) {
                reject(new Error(message.error));
              } else {
                resolve(message.result);
              }
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });

        this.ws.on('error', error => {
          console.error('WebSocket error:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.error('Disconnected from Nanobrowser extension');
          this.ws = null;
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async sendCommand(command: string, params: any = {}): Promise<any> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pendingRequests.set(id, { resolve, reject });

      const message = {
        id,
        command,
        params,
      };

      this.ws!.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Command timeout'));
        }
      }, 30000);
    });
  }

  private async sendHttpCommand(endpoint: string, params: any = {}): Promise<any> {
    try {
      const response = await axios.post(`${this.httpUrl}${endpoint}`, params);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  // Navigation methods
  async navigate(url: string, waitUntil?: string): Promise<any> {
    return this.sendCommand('navigate', { url, waitUntil });
  }

  async goBack(): Promise<any> {
    return this.sendCommand('goBack');
  }

  async goForward(): Promise<any> {
    return this.sendCommand('goForward');
  }

  async refresh(hardRefresh: boolean = false): Promise<void> {
    await this.sendCommand('refresh', { hardRefresh });
  }

  // DOM interaction methods
  async click(selector: string, waitForNavigation: boolean = false): Promise<any> {
    return this.sendCommand('click', { selector, waitForNavigation });
  }

  async type(selector: string, text: string, clear: boolean = false, pressEnter: boolean = false): Promise<void> {
    await this.sendCommand('type', { selector, text, clear, pressEnter });
  }

  async getText(selector: string): Promise<string> {
    const result = await this.sendCommand('getText', { selector });
    return result.text;
  }

  async getAttribute(selector: string, attribute: string): Promise<string> {
    const result = await this.sendCommand('getAttribute', { selector, attribute });
    return result.value;
  }

  async selectDropdown(selector: string, value: string): Promise<void> {
    await this.sendCommand('selectDropdown', { selector, value });
  }

  async setCheckbox(selector: string, checked: boolean): Promise<void> {
    await this.sendCommand('setCheckbox', { selector, checked });
  }

  // Page information methods
  async getPageState(includeScreenshot: boolean = false, includeDOM: boolean = true): Promise<any> {
    return this.sendCommand('getPageState', { includeScreenshot, includeDOM });
  }

  async getClickableElements(withBoundingBoxes: boolean = false): Promise<any[]> {
    const result = await this.sendCommand('getClickableElements', { withBoundingBoxes });
    return result.elements;
  }

  async takeScreenshot(fullPage: boolean = false, selector?: string): Promise<string> {
    const result = await this.sendCommand('takeScreenshot', { fullPage, selector });
    return result.screenshot;
  }

  async executeScript(code: string): Promise<any> {
    const result = await this.sendCommand('executeScript', { code });
    return result.value;
  }

  async getDOMStructure(): Promise<any> {
    return this.sendCommand('getDOMStructure');
  }

  // Scrolling methods
  async scroll(direction: string, amount?: number): Promise<void> {
    await this.sendCommand('scroll', { direction, amount });
  }

  async scrollToElement(selector: string): Promise<void> {
    await this.sendCommand('scrollToElement', { selector });
  }

  // Wait methods
  async waitForElement(selector: string, timeout: number = 30000, visible: boolean = true): Promise<void> {
    await this.sendCommand('waitForElement', { selector, timeout, visible });
  }

  async waitForNavigation(timeout: number = 30000): Promise<void> {
    await this.sendCommand('waitForNavigation', { timeout });
  }

  // Form methods
  async fillForm(fields: Array<{ selector: string; value: string }>, submit: boolean = false, submitButtonSelector?: string): Promise<void> {
    await this.sendCommand('fillForm', { fields, submit, submitButtonSelector });
  }

  // Tab management methods
  async openNewTab(url?: string): Promise<any> {
    return this.sendCommand('openNewTab', { url });
  }

  async closeCurrentTab(): Promise<void> {
    await this.sendCommand('closeCurrentTab');
  }

  async switchToTab(tabId: number): Promise<void> {
    await this.sendCommand('switchToTab', { tabId });
  }

  async listTabs(): Promise<any[]> {
    const result = await this.sendCommand('listTabs');
    return result.tabs;
  }

  // Task execution
  async executeTask(task: string, url?: string): Promise<any> {
    // Use HTTP for long-running tasks
    return this.sendHttpCommand('/api/execute-task', { task, url });
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
