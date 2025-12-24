/**
 * Native Messaging Handler for Firefox MCP
 * Handles commands from the Claude MCP server via Firefox native messaging
 */

import { Page } from '../browser/page';

export class NativeMessagingHandler {
  private port: any = null;
  private pages: Map<number, Page> = new Map();

  constructor() {
    this.setupNativeMessaging();
  }

  private setupNativeMessaging() {
    // Firefox native messaging
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onConnect) {
      browser.runtime.onConnect.addListener(port => {
        if (port.name === 'ai.nanobrowser.mcp') {
          this.port = port;
          console.log('Native messaging port connected');

          port.onMessage.addListener((message: any) => {
            this.handleMessage(message);
          });

          port.onDisconnect.addListener(() => {
            console.log('Native messaging port disconnected');
            this.port = null;
          });
        }
      });
    }
  }

  private async handleMessage(message: any) {
    const { id, command, params } = message;

    try {
      let result;

      switch (command) {
        case 'navigate':
          result = await this.handleNavigate(params);
          break;
        case 'goBack':
          result = await this.handleGoBack();
          break;
        case 'goForward':
          result = await this.handleGoForward();
          break;
        case 'refresh':
          result = await this.handleRefresh();
          break;
        case 'click':
          result = await this.handleClick(params);
          break;
        case 'type':
          result = await this.handleType(params);
          break;
        case 'getText':
          result = await this.handleGetText(params);
          break;
        case 'getAttribute':
          result = await this.handleGetAttribute(params);
          break;
        case 'getPageState':
          result = await this.handleGetPageState();
          break;
        case 'getClickableElements':
          result = await this.handleGetClickableElements();
          break;
        case 'takeScreenshot':
          result = await this.handleTakeScreenshot(params);
          break;
        case 'executeScript':
          result = await this.handleExecuteScript(params);
          break;
        case 'scroll':
          result = await this.handleScroll(params);
          break;
        case 'scrollToElement':
          result = await this.handleScrollToElement(params);
          break;
        case 'waitForElement':
          result = await this.handleWaitForElement(params);
          break;
        case 'fillForm':
          result = await this.handleFillForm(params);
          break;
        case 'openNewTab':
          result = await this.handleOpenNewTab(params);
          break;
        case 'closeCurrentTab':
          result = await this.handleCloseCurrentTab();
          break;
        case 'switchToTab':
          result = await this.handleSwitchToTab(params);
          break;
        case 'listTabs':
          result = await this.handleListTabs();
          break;
        case 'executeTask':
          result = await this.handleExecuteTask(params);
          break;
        default:
          throw new Error(`Unknown command: ${command}`);
      }

      this.sendResponse(id, result);
    } catch (error) {
      this.sendError(id, error instanceof Error ? error.message : String(error));
    }
  }

  private sendResponse(id: number, result: any) {
    if (this.port) {
      this.port.postMessage({ id, result });
    }
  }

  private sendError(id: number, error: string) {
    if (this.port) {
      this.port.postMessage({ id, error });
    }
  }

  private async getCurrentTab(): Promise<any> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error('No active tab found');
    }
    return tabs[0];
  }

  private async handleNavigate(params: any) {
    const { url } = params;
    const tab = await this.getCurrentTab();
    await browser.tabs.update(tab.id, { url });
    // Wait a bit for navigation to start
    await new Promise(resolve => setTimeout(resolve, 500));
    const updatedTab = await browser.tabs.get(tab.id);
    return { url: updatedTab.url, title: updatedTab.title };
  }

  private async handleGoBack() {
    await browser.tabs.goBack();
    await new Promise(resolve => setTimeout(resolve, 300));
    const tab = await this.getCurrentTab();
    return { url: tab.url };
  }

  private async handleGoForward() {
    await browser.tabs.goForward();
    await new Promise(resolve => setTimeout(resolve, 300));
    const tab = await this.getCurrentTab();
    return { url: tab.url };
  }

  private async handleRefresh() {
    const tab = await this.getCurrentTab();
    await browser.tabs.reload(tab.id);
    return { success: true };
  }

  private async handleClick(params: any) {
    const { selector } = params;
    const tab = await this.getCurrentTab();
    await browser.tabs.sendMessage(tab.id, {
      action: 'click',
      selector,
    });
    return { success: true };
  }

  private async handleType(params: any) {
    const { selector, text, clear } = params;
    const tab = await this.getCurrentTab();
    await browser.tabs.sendMessage(tab.id, {
      action: 'type',
      selector,
      text,
      clear,
    });
    return { success: true };
  }

  private async handleGetText(params: any) {
    const { selector } = params;
    const tab = await this.getCurrentTab();
    const result = await browser.tabs.sendMessage(tab.id, {
      action: 'getText',
      selector,
    });
    return { text: result };
  }

  private async handleGetAttribute(params: any) {
    const { selector, attribute } = params;
    const tab = await this.getCurrentTab();
    const result = await browser.tabs.sendMessage(tab.id, {
      action: 'getAttribute',
      selector,
      attribute,
    });
    return { value: result };
  }

  private async handleGetPageState() {
    const tab = await this.getCurrentTab();
    return {
      url: tab.url,
      title: tab.title,
      ready: tab.status === 'complete',
    };
  }

  private async handleGetClickableElements() {
    const tab = await this.getCurrentTab();
    const result = await browser.tabs.sendMessage(tab.id, {
      action: 'getClickableElements',
    });
    return { elements: result };
  }

  private async handleTakeScreenshot(params: any) {
    const { fullPage } = params;
    const screenshot = await browser.tabs.captureVisibleTab(undefined, {
      format: 'png',
    });
    return { screenshot };
  }

  private async handleExecuteScript(params: any) {
    const { code } = params;
    const tab = await this.getCurrentTab();
    const results = await browser.tabs.executeScript(tab.id, { code });
    return { value: results[0] };
  }

  private async handleScroll(params: any) {
    const { direction, amount } = params;
    const tab = await this.getCurrentTab();
    await browser.tabs.sendMessage(tab.id, {
      action: 'scroll',
      direction,
      amount,
    });
    return { success: true };
  }

  private async handleScrollToElement(params: any) {
    const { selector } = params;
    const tab = await this.getCurrentTab();
    await browser.tabs.sendMessage(tab.id, {
      action: 'scrollToElement',
      selector,
    });
    return { success: true };
  }

  private async handleWaitForElement(params: any) {
    const { selector, timeout } = params;
    const tab = await this.getCurrentTab();
    await browser.tabs.sendMessage(tab.id, {
      action: 'waitForElement',
      selector,
      timeout,
    });
    return { success: true };
  }

  private async handleFillForm(params: any) {
    const { fields } = params;
    const tab = await this.getCurrentTab();
    await browser.tabs.sendMessage(tab.id, {
      action: 'fillForm',
      fields,
    });
    return { success: true };
  }

  private async handleOpenNewTab(params: any) {
    const { url } = params;
    const tab = await browser.tabs.create({ url });
    return { id: tab.id, url: tab.url };
  }

  private async handleCloseCurrentTab() {
    const tab = await this.getCurrentTab();
    await browser.tabs.remove(tab.id);
    return { success: true };
  }

  private async handleSwitchToTab(params: any) {
    const { tabId } = params;
    await browser.tabs.update(tabId, { active: true });
    return { success: true };
  }

  private async handleListTabs() {
    const tabs = await browser.tabs.query({});
    return {
      tabs: tabs.map(tab => ({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: tab.active,
      })),
    };
  }

  private async handleExecuteTask(params: any) {
    const { task, url } = params;
    // This would integrate with Nanobrowser's agent system
    // For now, return a placeholder
    return {
      status: 'Task execution not yet implemented via native messaging',
      task,
      url,
      steps: 0,
      output: 'Please use the extension UI for complex task execution',
    };
  }
}

// Initialize native messaging handler
if (typeof browser !== 'undefined') {
  const nativeMessagingHandler = new NativeMessagingHandler();
  console.log('Native messaging handler initialized');
}
