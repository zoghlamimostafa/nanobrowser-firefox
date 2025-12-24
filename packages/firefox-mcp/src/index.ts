#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { FirefoxClient } from './firefox-client.js';

/**
 * Firefox-Native Claude MCP Server for Nanobrowser
 * Uses Firefox WebExtensions Native Messaging instead of CDP
 */
class FirefoxMCPServer {
  private server: Server;
  private firefoxClient: FirefoxClient;

  constructor() {
    this.server = new Server(
      {
        name: 'nanobrowser-firefox-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    );

    this.firefoxClient = new FirefoxClient(process.env.FIREFOX_EXTENSION_ID);
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Navigation Tools
        {
          name: 'navigate_to_url',
          description: 'Navigate to a specified URL in Firefox',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'The URL to navigate to' },
            },
            required: ['url'],
          },
        },
        {
          name: 'go_back',
          description: 'Navigate back in browser history',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'go_forward',
          description: 'Navigate forward in browser history',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'refresh_page',
          description: 'Refresh the current page',
          inputSchema: { type: 'object', properties: {} },
        },

        // DOM Interaction Tools
        {
          name: 'click_element',
          description: 'Click on an element on the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector of the element to click' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'type_text',
          description: 'Type text into an input field',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector of the input element' },
              text: { type: 'string', description: 'Text to type' },
              clear: { type: 'boolean', description: 'Clear the field before typing', default: false },
            },
            required: ['selector', 'text'],
          },
        },
        {
          name: 'get_element_text',
          description: 'Get the text content of an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector of the element' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'get_element_attribute',
          description: 'Get an attribute value from an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector of the element' },
              attribute: { type: 'string', description: 'Attribute name to retrieve' },
            },
            required: ['selector', 'attribute'],
          },
        },

        // Page Information Tools
        {
          name: 'get_page_state',
          description: 'Get the current page state including URL, title, and DOM structure',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'get_clickable_elements',
          description: 'Get all clickable elements on the current page',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'take_screenshot',
          description: 'Take a screenshot of the current page',
          inputSchema: {
            type: 'object',
            properties: {
              fullPage: { type: 'boolean', description: 'Capture the full page', default: false },
            },
          },
        },
        {
          name: 'execute_javascript',
          description: 'Execute JavaScript code in the page context',
          inputSchema: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'JavaScript code to execute' },
            },
            required: ['code'],
          },
        },

        // Scrolling Tools
        {
          name: 'scroll_page',
          description: 'Scroll the page',
          inputSchema: {
            type: 'object',
            properties: {
              direction: {
                type: 'string',
                enum: ['up', 'down', 'top', 'bottom'],
                description: 'Scroll direction',
              },
              amount: { type: 'number', description: 'Amount to scroll in pixels (for up/down)' },
            },
            required: ['direction'],
          },
        },
        {
          name: 'scroll_to_element',
          description: 'Scroll to make an element visible',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector of the element' },
            },
            required: ['selector'],
          },
        },

        // Wait Tools
        {
          name: 'wait_for_element',
          description: 'Wait for an element to appear on the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector of the element to wait for' },
              timeout: { type: 'number', description: 'Timeout in milliseconds', default: 30000 },
            },
            required: ['selector'],
          },
        },

        // Form Tools
        {
          name: 'fill_form',
          description: 'Fill multiple form fields at once',
          inputSchema: {
            type: 'object',
            properties: {
              fields: {
                type: 'array',
                description: 'Array of form fields to fill',
                items: {
                  type: 'object',
                  properties: {
                    selector: { type: 'string' },
                    value: { type: 'string' },
                  },
                  required: ['selector', 'value'],
                },
              },
            },
            required: ['fields'],
          },
        },

        // Tab Management
        {
          name: 'open_new_tab',
          description: 'Open a new browser tab',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to open in the new tab' },
            },
          },
        },
        {
          name: 'close_tab',
          description: 'Close the current tab',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'switch_tab',
          description: 'Switch to a different tab',
          inputSchema: {
            type: 'object',
            properties: {
              tabId: { type: 'number', description: 'ID of the tab to switch to' },
            },
            required: ['tabId'],
          },
        },
        {
          name: 'list_tabs',
          description: 'List all open tabs',
          inputSchema: { type: 'object', properties: {} },
        },

        // Task Execution
        {
          name: 'execute_task',
          description: 'Execute a high-level task using Nanobrowser AI agents',
          inputSchema: {
            type: 'object',
            properties: {
              task: { type: 'string', description: 'Natural language description of the task to execute' },
              url: { type: 'string', description: 'Starting URL for the task (optional)' },
            },
            required: ['task'],
          },
        },
      ],
    }));

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'firefox://page/current',
          name: 'Current Page State',
          description: 'The current state of the active Firefox page',
          mimeType: 'application/json',
        },
        {
          uri: 'firefox://page/screenshot',
          name: 'Current Page Screenshot',
          description: 'Screenshot of the current Firefox page',
          mimeType: 'image/png',
        },
        {
          uri: 'firefox://tabs/list',
          name: 'Open Tabs',
          description: 'List of all open Firefox tabs',
          mimeType: 'application/json',
        },
      ],
    }));

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case 'firefox://page/current':
            return await this.handleGetPageResource();
          case 'firefox://page/screenshot':
            return await this.handleGetScreenshotResource();
          case 'firefox://tabs/list':
            return await this.handleGetTabsResource();
          default:
            throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error reading resource ${uri}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });

    // Tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Navigation
          case 'navigate_to_url':
            return await this.handleNavigate(args);
          case 'go_back':
            return await this.handleGoBack();
          case 'go_forward':
            return await this.handleGoForward();
          case 'refresh_page':
            return await this.handleRefresh();

          // DOM Interaction
          case 'click_element':
            return await this.handleClick(args);
          case 'type_text':
            return await this.handleType(args);
          case 'get_element_text':
            return await this.handleGetText(args);
          case 'get_element_attribute':
            return await this.handleGetAttribute(args);

          // Page Information
          case 'get_page_state':
            return await this.handleGetPageState();
          case 'get_clickable_elements':
            return await this.handleGetClickableElements();
          case 'take_screenshot':
            return await this.handleTakeScreenshot(args);
          case 'execute_javascript':
            return await this.handleExecuteJS(args);

          // Scrolling
          case 'scroll_page':
            return await this.handleScroll(args);
          case 'scroll_to_element':
            return await this.handleScrollToElement(args);

          // Wait
          case 'wait_for_element':
            return await this.handleWaitForElement(args);

          // Form
          case 'fill_form':
            return await this.handleFillForm(args);

          // Tabs
          case 'open_new_tab':
            return await this.handleOpenTab(args);
          case 'close_tab':
            return await this.handleCloseTab();
          case 'switch_tab':
            return await this.handleSwitchTab(args);
          case 'list_tabs':
            return await this.handleListTabs();

          // Task Execution
          case 'execute_task':
            return await this.handleExecuteTask(args);

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
  private async handleNavigate(args: any) {
    const result = await this.firefoxClient.navigate(args.url);
    return {
      content: [
        {
          type: 'text',
          text: `Navigated to ${args.url}\nTitle: ${result.title || 'Unknown'}`,
        },
      ],
    };
  }

  private async handleGoBack() {
    const result = await this.firefoxClient.goBack();
    return {
      content: [{ type: 'text', text: `Navigated back to: ${result.url || 'previous page'}` }],
    };
  }

  private async handleGoForward() {
    const result = await this.firefoxClient.goForward();
    return {
      content: [{ type: 'text', text: `Navigated forward to: ${result.url || 'next page'}` }],
    };
  }

  private async handleRefresh() {
    await this.firefoxClient.refresh();
    return {
      content: [{ type: 'text', text: 'Page refreshed successfully' }],
    };
  }

  private async handleClick(args: any) {
    await this.firefoxClient.click(args.selector);
    return {
      content: [{ type: 'text', text: `Clicked element: ${args.selector}` }],
    };
  }

  private async handleType(args: any) {
    await this.firefoxClient.type(args.selector, args.text, args.clear);
    return {
      content: [{ type: 'text', text: `Typed text into: ${args.selector}` }],
    };
  }

  private async handleGetText(args: any) {
    const text = await this.firefoxClient.getText(args.selector);
    return {
      content: [{ type: 'text', text: `Text content: ${text}` }],
    };
  }

  private async handleGetAttribute(args: any) {
    const value = await this.firefoxClient.getAttribute(args.selector, args.attribute);
    return {
      content: [{ type: 'text', text: `${args.attribute}: ${value}` }],
    };
  }

  private async handleGetPageState() {
    const state = await this.firefoxClient.getPageState();
    return {
      content: [
        {
          type: 'text',
          text: `Current Page State:\n\nURL: ${state.url}\nTitle: ${state.title}\nReady: ${state.ready}`,
        },
      ],
    };
  }

  private async handleGetClickableElements() {
    const elements = await this.firefoxClient.getClickableElements();
    return {
      content: [
        {
          type: 'text',
          text:
            `Found ${elements.length} clickable elements:\n\n` +
            elements
              .slice(0, 20)
              .map((el, i) => `${i + 1}. ${el.tagName} - ${el.text || el.alt || '(no text)'}`)
              .join('\n') +
            (elements.length > 20 ? `\n\n... and ${elements.length - 20} more` : ''),
        },
      ],
    };
  }

  private async handleTakeScreenshot(args: any) {
    const screenshot = await this.firefoxClient.takeScreenshot(args.fullPage);
    return {
      content: [
        {
          type: 'image',
          data: screenshot,
          mimeType: 'image/png',
        },
      ],
    };
  }

  private async handleExecuteJS(args: any) {
    const result = await this.firefoxClient.executeScript(args.code);
    return {
      content: [{ type: 'text', text: `Execution result: ${JSON.stringify(result, null, 2)}` }],
    };
  }

  private async handleScroll(args: any) {
    await this.firefoxClient.scroll(args.direction, args.amount);
    return {
      content: [{ type: 'text', text: `Scrolled ${args.direction}${args.amount ? ` by ${args.amount}px` : ''}` }],
    };
  }

  private async handleScrollToElement(args: any) {
    await this.firefoxClient.scrollToElement(args.selector);
    return {
      content: [{ type: 'text', text: `Scrolled to element: ${args.selector}` }],
    };
  }

  private async handleWaitForElement(args: any) {
    await this.firefoxClient.waitForElement(args.selector, args.timeout);
    return {
      content: [{ type: 'text', text: `Element appeared: ${args.selector}` }],
    };
  }

  private async handleFillForm(args: any) {
    await this.firefoxClient.fillForm(args.fields);
    return {
      content: [{ type: 'text', text: `Form filled with ${args.fields.length} fields` }],
    };
  }

  private async handleOpenTab(args: any) {
    const tab = await this.firefoxClient.openNewTab(args.url);
    return {
      content: [{ type: 'text', text: `Opened new tab (ID: ${tab.id})${args.url ? ` at ${args.url}` : ''}` }],
    };
  }

  private async handleCloseTab() {
    await this.firefoxClient.closeCurrentTab();
    return {
      content: [{ type: 'text', text: 'Tab closed' }],
    };
  }

  private async handleSwitchTab(args: any) {
    await this.firefoxClient.switchToTab(args.tabId);
    return {
      content: [{ type: 'text', text: `Switched to tab ${args.tabId}` }],
    };
  }

  private async handleListTabs() {
    const tabs = await this.firefoxClient.listTabs();
    return {
      content: [
        {
          type: 'text',
          text: `Open tabs (${tabs.length}):\n\n` + tabs.map((tab, i) => `${i + 1}. [${tab.id}] ${tab.title} - ${tab.url}`).join('\n'),
        },
      ],
    };
  }

  private async handleExecuteTask(args: any) {
    const result = await this.firefoxClient.executeTask(args.task, args.url);
    return {
      content: [
        {
          type: 'text',
          text: `Task: ${args.task}\n\nResult: ${result.status}\nSteps executed: ${result.steps}\n\nOutput:\n${result.output}`,
        },
      ],
    };
  }

  // Resource handlers
  private async handleGetPageResource() {
    const state = await this.firefoxClient.getPageState();
    return {
      contents: [
        {
          uri: 'firefox://page/current',
          mimeType: 'application/json',
          text: JSON.stringify(state, null, 2),
        },
      ],
    };
  }

  private async handleGetScreenshotResource() {
    const screenshot = await this.firefoxClient.takeScreenshot(false);
    return {
      contents: [
        {
          uri: 'firefox://page/screenshot',
          mimeType: 'image/png',
          blob: screenshot,
        },
      ],
    };
  }

  private async handleGetTabsResource() {
    const tabs = await this.firefoxClient.listTabs();
    return {
      contents: [
        {
          uri: 'firefox://tabs/list',
          mimeType: 'application/json',
          text: JSON.stringify(tabs, null, 2),
        },
      ],
    };
  }

  async run() {
    // Connect to Firefox extension via native messaging
    await this.firefoxClient.connect();

    // Start MCP server on stdio
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Nanobrowser Firefox MCP Server running');
    console.error('Connected to Firefox extension via native messaging');
  }
}

async function main() {
  const server = new FirefoxMCPServer();
  await server.run();
}

// ES module check
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { FirefoxMCPServer };
