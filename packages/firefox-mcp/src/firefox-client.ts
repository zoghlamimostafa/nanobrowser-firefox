import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * Firefox Native Messaging Client
 * Communicates with Firefox extension via native messaging protocol
 */
export class FirefoxClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>();
  private buffer = '';

  constructor(private extensionId?: string) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Firefox native messaging uses stdin/stdout
        // The extension ID is passed as environment variable
        const env = { ...process.env };
        if (this.extensionId) {
          env.FIREFOX_EXTENSION_ID = this.extensionId;
        }

        // We communicate through stdin/stdout with the extension
        // Firefox handles the routing based on native messaging manifest
        this.setupStdioMessaging();

        console.error('Firefox MCP: Connected to extension via native messaging');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupStdioMessaging(): void {
    // Read from stdin (messages from Firefox extension)
    process.stdin.on('data', (chunk) => {
      this.buffer += chunk.toString();
      this.processMessages();
    });

    process.stdin.on('end', () => {
      console.error('Firefox MCP: Connection closed');
      this.emit('close');
    });

    process.stdin.on('error', (error) => {
      console.error('Firefox MCP: Error reading from stdin:', error);
      this.emit('error', error);
    });
  }

  private processMessages(): void {
    // Firefox native messaging uses length-prefixed messages
    // Format: 4 bytes (uint32) for length, then JSON message
    while (this.buffer.length >= 4) {
      // Read length (first 4 bytes as uint32 little-endian)
      const lengthBuffer = Buffer.from(this.buffer.slice(0, 4), 'binary');
      const length = lengthBuffer.readUInt32LE(0);

      if (this.buffer.length < 4 + length) {
        // Not enough data yet
        break;
      }

      // Extract message
      const messageStr = this.buffer.slice(4, 4 + length);
      this.buffer = this.buffer.slice(4 + length);

      try {
        const message = JSON.parse(messageStr);
        this.handleMessage(message);
      } catch (error) {
        console.error('Firefox MCP: Error parsing message:', error);
      }
    }
  }

  private handleMessage(message: any): void {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error));
      } else {
        resolve(message.result);
      }
    } else {
      // Unsolicited message (event, notification, etc.)
      this.emit('message', message);
    }
  }

  private sendNativeMessage(message: any): void {
    const messageStr = JSON.stringify(message);
    const messageBuffer = Buffer.from(messageStr, 'utf8');

    // Write length (4 bytes, uint32 little-endian)
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(messageBuffer.length, 0);

    // Write to stdout (to Firefox extension)
    process.stdout.write(lengthBuffer);
    process.stdout.write(messageBuffer);
  }

  async sendCommand(command: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pendingRequests.set(id, { resolve, reject });

      const message = {
        id,
        command,
        params,
      };

      this.sendNativeMessage(message);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Command timeout'));
        }
      }, 30000);
    });
  }

  // Navigation methods
  async navigate(url: string): Promise<any> {
    return this.sendCommand('navigate', { url });
  }

  async goBack(): Promise<any> {
    return this.sendCommand('goBack');
  }

  async goForward(): Promise<any> {
    return this.sendCommand('goForward');
  }

  async refresh(): Promise<void> {
    await this.sendCommand('refresh');
  }

  // DOM interaction
  async click(selector: string): Promise<any> {
    return this.sendCommand('click', { selector });
  }

  async type(selector: string, text: string, clear: boolean = false): Promise<void> {
    await this.sendCommand('type', { selector, text, clear });
  }

  async getText(selector: string): Promise<string> {
    const result = await this.sendCommand('getText', { selector });
    return result.text;
  }

  async getAttribute(selector: string, attribute: string): Promise<string> {
    const result = await this.sendCommand('getAttribute', { selector, attribute });
    return result.value;
  }

  // Page information
  async getPageState(): Promise<any> {
    return this.sendCommand('getPageState');
  }

  async getClickableElements(): Promise<any[]> {
    const result = await this.sendCommand('getClickableElements');
    return result.elements;
  }

  async takeScreenshot(fullPage: boolean = false): Promise<string> {
    const result = await this.sendCommand('takeScreenshot', { fullPage });
    return result.screenshot;
  }

  async executeScript(code: string): Promise<any> {
    const result = await this.sendCommand('executeScript', { code });
    return result.value;
  }

  // Scrolling
  async scroll(direction: string, amount?: number): Promise<void> {
    await this.sendCommand('scroll', { direction, amount });
  }

  async scrollToElement(selector: string): Promise<void> {
    await this.sendCommand('scrollToElement', { selector });
  }

  // Wait
  async waitForElement(selector: string, timeout: number = 30000): Promise<void> {
    await this.sendCommand('waitForElement', { selector, timeout });
  }

  // Forms
  async fillForm(fields: Array<{ selector: string; value: string }>): Promise<void> {
    await this.sendCommand('fillForm', { fields });
  }

  // Tabs
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
    return this.sendCommand('executeTask', { task, url });
  }

  close(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
