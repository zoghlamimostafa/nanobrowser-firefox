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
import { BrowserClient } from './browser-client.js';

/**
 * Claude MCP Server for Nanobrowser
 * Exposes browser automation capabilities to Claude AI through MCP protocol
 */
class ClaudeMCPServer {
  private server: Server;
  private browserClient: BrowserClient;

  constructor() {
    this.server = new Server(
      {
        name: 'nanobrowser-claude-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    );

    this.browserClient = new BrowserClient();
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Navigation Tools
        {
          name: 'navigate_to_url',
          description: 'Navigate to a specified URL in the browser',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to navigate to',
              },
              waitUntil: {
                type: 'string',
                enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
                description: 'When to consider navigation successful',
                default: 'load',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'go_back',
          description: 'Navigate back in browser history',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'go_forward',
          description: 'Navigate forward in browser history',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'refresh_page',
          description: 'Refresh the current page',
          inputSchema: {
            type: 'object',
            properties: {
              hardRefresh: {
                type: 'boolean',
                description: 'Perform a hard refresh (bypass cache)',
                default: false,
              },
            },
          },
        },

        // DOM Interaction Tools
        {
          name: 'click_element',
          description: 'Click on an element on the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector or XPath of the element to click',
              },
              elementId: {
                type: 'string',
                description: 'Element ID from previous page state',
              },
              waitForNavigation: {
                type: 'boolean',
                description: 'Wait for navigation after clicking',
                default: false,
              },
            },
          },
        },
        {
          name: 'type_text',
          description: 'Type text into an input field',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of the input element',
              },
              text: {
                type: 'string',
                description: 'Text to type',
              },
              clear: {
                type: 'boolean',
                description: 'Clear the field before typing',
                default: false,
              },
              pressEnter: {
                type: 'boolean',
                description: 'Press Enter after typing',
                default: false,
              },
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
              selector: {
                type: 'string',
                description: 'CSS selector of the element',
              },
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
              selector: {
                type: 'string',
                description: 'CSS selector of the element',
              },
              attribute: {
                type: 'string',
                description: 'Attribute name to retrieve',
              },
            },
            required: ['selector', 'attribute'],
          },
        },
        {
          name: 'select_dropdown',
          description: 'Select an option from a dropdown',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of the select element',
              },
              value: {
                type: 'string',
                description: 'Value to select',
              },
            },
            required: ['selector', 'value'],
          },
        },
        {
          name: 'check_checkbox',
          description: 'Check or uncheck a checkbox',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of the checkbox',
              },
              checked: {
                type: 'boolean',
                description: 'Whether to check or uncheck',
                default: true,
              },
            },
            required: ['selector'],
          },
        },

        // Page Information Tools
        {
          name: 'get_page_state',
          description: 'Get the current page state including URL, title, and DOM structure',
          inputSchema: {
            type: 'object',
            properties: {
              includeScreenshot: {
                type: 'boolean',
                description: 'Include a screenshot of the page',
                default: false,
              },
              includeDOM: {
                type: 'boolean',
                description: 'Include DOM tree information',
                default: true,
              },
            },
          },
        },
        {
          name: 'get_clickable_elements',
          description: 'Get all clickable elements on the current page',
          inputSchema: {
            type: 'object',
            properties: {
              withBoundingBoxes: {
                type: 'boolean',
                description: 'Include bounding box coordinates',
                default: false,
              },
            },
          },
        },
        {
          name: 'take_screenshot',
          description: 'Take a screenshot of the current page',
          inputSchema: {
            type: 'object',
            properties: {
              fullPage: {
                type: 'boolean',
                description: 'Capture the full page',
                default: false,
              },
              selector: {
                type: 'string',
                description: 'Capture only a specific element',
              },
            },
          },
        },
        {
          name: 'execute_javascript',
          description: 'Execute JavaScript code in the page context',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'JavaScript code to execute',
              },
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
              amount: {
                type: 'number',
                description: 'Amount to scroll in pixels (for up/down)',
              },
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
              selector: {
                type: 'string',
                description: 'CSS selector of the element',
              },
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
              selector: {
                type: 'string',
                description: 'CSS selector of the element to wait for',
              },
              timeout: {
                type: 'number',
                description: 'Timeout in milliseconds',
                default: 30000,
              },
              visible: {
                type: 'boolean',
                description: 'Wait for element to be visible',
                default: true,
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'wait_for_navigation',
          description: 'Wait for page navigation to complete',
          inputSchema: {
            type: 'object',
            properties: {
              timeout: {
                type: 'number',
                description: 'Timeout in milliseconds',
                default: 30000,
              },
            },
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
              submit: {
                type: 'boolean',
                description: 'Submit the form after filling',
                default: false,
              },
              submitButtonSelector: {
                type: 'string',
                description: 'Selector of the submit button',
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
              url: {
                type: 'string',
                description: 'URL to open in the new tab',
              },
            },
          },
        },
        {
          name: 'close_tab',
          description: 'Close the current tab',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'switch_tab',
          description: 'Switch to a different tab',
          inputSchema: {
            type: 'object',
            properties: {
              tabId: {
                type: 'number',
                description: 'ID of the tab to switch to',
              },
            },
            required: ['tabId'],
          },
        },
        {
          name: 'list_tabs',
          description: 'List all open tabs',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },

        // Task Execution
        {
          name: 'execute_task',
          description: 'Execute a high-level task using Nanobrowser agents',
          inputSchema: {
            type: 'object',
            properties: {
              task: {
                type: 'string',
                description: 'Natural language description of the task to execute',
              },
              url: {
                type: 'string',
                description: 'Starting URL for the task (optional)',
              },
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
          uri: 'nanobrowser://page/current',
          name: 'Current Page State',
          description: 'The current state of the active browser page',
          mimeType: 'application/json',
        },
        {
          uri: 'nanobrowser://page/screenshot',
          name: 'Current Page Screenshot',
          description: 'Screenshot of the current page',
          mimeType: 'image/png',
        },
        {
          uri: 'nanobrowser://page/dom',
          name: 'Page DOM Structure',
          description: 'The DOM tree structure of the current page',
          mimeType: 'application/json',
        },
        {
          uri: 'nanobrowser://tabs/list',
          name: 'Open Tabs',
          description: 'List of all open browser tabs',
          mimeType: 'application/json',
        },
      ],
    }));

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case 'nanobrowser://page/current':
            return await this.handleGetPageResource();
          case 'nanobrowser://page/screenshot':
            return await this.handleGetScreenshotResource();
          case 'nanobrowser://page/dom':
            return await this.handleGetDOMResource();
          case 'nanobrowser://tabs/list':
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
            return await this.handleRefresh(args);

          // DOM Interaction
          case 'click_element':
            return await this.handleClick(args);
          case 'type_text':
            return await this.handleType(args);
          case 'get_element_text':
            return await this.handleGetText(args);
          case 'get_element_attribute':
            return await this.handleGetAttribute(args);
          case 'select_dropdown':
            return await this.handleSelectDropdown(args);
          case 'check_checkbox':
            return await this.handleCheckbox(args);

          // Page Information
          case 'get_page_state':
            return await this.handleGetPageState(args);
          case 'get_clickable_elements':
            return await this.handleGetClickableElements(args);
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
          case 'wait_for_navigation':
            return await this.handleWaitForNavigation(args);

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
    const result = await this.browserClient.navigate(args.url, args.waitUntil);
    return {
      content: [
        {
          type: 'text',
          text: `Navigated to ${args.url}\nStatus: ${result.status}\nTitle: ${result.title}`,
        },
      ],
    };
  }

  private async handleGoBack() {
    const result = await this.browserClient.goBack();
    return {
      content: [{ type: 'text', text: `Navigated back to: ${result.url}` }],
    };
  }

  private async handleGoForward() {
    const result = await this.browserClient.goForward();
    return {
      content: [{ type: 'text', text: `Navigated forward to: ${result.url}` }],
    };
  }

  private async handleRefresh(args: any) {
    await this.browserClient.refresh(args.hardRefresh);
    return {
      content: [{ type: 'text', text: 'Page refreshed successfully' }],
    };
  }

  private async handleClick(args: any) {
    const result = await this.browserClient.click(args.selector || args.elementId, args.waitForNavigation);
    return {
      content: [{ type: 'text', text: `Clicked element: ${args.selector || args.elementId}\nResult: ${result.message}` }],
    };
  }

  private async handleType(args: any) {
    await this.browserClient.type(args.selector, args.text, args.clear, args.pressEnter);
    return {
      content: [{ type: 'text', text: `Typed text into: ${args.selector}` }],
    };
  }

  private async handleGetText(args: any) {
    const text = await this.browserClient.getText(args.selector);
    return {
      content: [{ type: 'text', text: `Text content: ${text}` }],
    };
  }

  private async handleGetAttribute(args: any) {
    const value = await this.browserClient.getAttribute(args.selector, args.attribute);
    return {
      content: [{ type: 'text', text: `${args.attribute}: ${value}` }],
    };
  }

  private async handleSelectDropdown(args: any) {
    await this.browserClient.selectDropdown(args.selector, args.value);
    return {
      content: [{ type: 'text', text: `Selected ${args.value} in dropdown: ${args.selector}` }],
    };
  }

  private async handleCheckbox(args: any) {
    await this.browserClient.setCheckbox(args.selector, args.checked);
    return {
      content: [{ type: 'text', text: `Checkbox ${args.checked ? 'checked' : 'unchecked'}: ${args.selector}` }],
    };
  }

  private async handleGetPageState(args: any) {
    const state = await this.browserClient.getPageState(args.includeScreenshot, args.includeDOM);
    return {
      content: [
        {
          type: 'text',
          text: `Current Page State:\n\nURL: ${state.url}\nTitle: ${state.title}\nScroll Position: ${state.scrollY}/${state.scrollHeight}\n\n${args.includeDOM ? `DOM Elements: ${state.elementCount}` : ''}`,
        },
      ],
    };
  }

  private async handleGetClickableElements(args: any) {
    const elements = await this.browserClient.getClickableElements(args.withBoundingBoxes);
    return {
      content: [
        {
          type: 'text',
          text:
            `Found ${elements.length} clickable elements:\n\n` +
            elements
              .slice(0, 20)
              .map((el, i) => `${i + 1}. ${el.tagName} - ${el.text || el.attributes.alt || el.attributes.title || '(no text)'}`)
              .join('\n') +
            (elements.length > 20 ? `\n\n... and ${elements.length - 20} more` : ''),
        },
      ],
    };
  }

  private async handleTakeScreenshot(args: any) {
    const screenshot = await this.browserClient.takeScreenshot(args.fullPage, args.selector);
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
    const result = await this.browserClient.executeScript(args.code);
    return {
      content: [{ type: 'text', text: `Execution result: ${JSON.stringify(result, null, 2)}` }],
    };
  }

  private async handleScroll(args: any) {
    await this.browserClient.scroll(args.direction, args.amount);
    return {
      content: [{ type: 'text', text: `Scrolled ${args.direction}${args.amount ? ` by ${args.amount}px` : ''}` }],
    };
  }

  private async handleScrollToElement(args: any) {
    await this.browserClient.scrollToElement(args.selector);
    return {
      content: [{ type: 'text', text: `Scrolled to element: ${args.selector}` }],
    };
  }

  private async handleWaitForElement(args: any) {
    await this.browserClient.waitForElement(args.selector, args.timeout, args.visible);
    return {
      content: [{ type: 'text', text: `Element appeared: ${args.selector}` }],
    };
  }

  private async handleWaitForNavigation(args: any) {
    await this.browserClient.waitForNavigation(args.timeout);
    return {
      content: [{ type: 'text', text: 'Navigation completed' }],
    };
  }

  private async handleFillForm(args: any) {
    await this.browserClient.fillForm(args.fields, args.submit, args.submitButtonSelector);
    return {
      content: [{ type: 'text', text: `Form filled with ${args.fields.length} fields${args.submit ? ' and submitted' : ''}` }],
    };
  }

  private async handleOpenTab(args: any) {
    const tab = await this.browserClient.openNewTab(args.url);
    return {
      content: [{ type: 'text', text: `Opened new tab (ID: ${tab.id})${args.url ? ` at ${args.url}` : ''}` }],
    };
  }

  private async handleCloseTab() {
    await this.browserClient.closeCurrentTab();
    return {
      content: [{ type: 'text', text: 'Tab closed' }],
    };
  }

  private async handleSwitchTab(args: any) {
    await this.browserClient.switchToTab(args.tabId);
    return {
      content: [{ type: 'text', text: `Switched to tab ${args.tabId}` }],
    };
  }

  private async handleListTabs() {
    const tabs = await this.browserClient.listTabs();
    return {
      content: [
        {
          type: 'text',
          text:
            `Open tabs (${tabs.length}):\n\n` +
            tabs.map((tab, i) => `${i + 1}. [${tab.id}] ${tab.title} - ${tab.url}`).join('\n'),
        },
      ],
    };
  }

  private async handleExecuteTask(args: any) {
    const result = await this.browserClient.executeTask(args.task, args.url);
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
    const state = await this.browserClient.getPageState(false, true);
    return {
      contents: [
        {
          uri: 'nanobrowser://page/current',
          mimeType: 'application/json',
          text: JSON.stringify(state, null, 2),
        },
      ],
    };
  }

  private async handleGetScreenshotResource() {
    const screenshot = await this.browserClient.takeScreenshot(false);
    return {
      contents: [
        {
          uri: 'nanobrowser://page/screenshot',
          mimeType: 'image/png',
          blob: screenshot,
        },
      ],
    };
  }

  private async handleGetDOMResource() {
    const dom = await this.browserClient.getDOMStructure();
    return {
      contents: [
        {
          uri: 'nanobrowser://page/dom',
          mimeType: 'application/json',
          text: JSON.stringify(dom, null, 2),
        },
      ],
    };
  }

  private async handleGetTabsResource() {
    const tabs = await this.browserClient.listTabs();
    return {
      contents: [
        {
          uri: 'nanobrowser://tabs/list',
          mimeType: 'application/json',
          text: JSON.stringify(tabs, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Nanobrowser Claude MCP Server running on stdio');
  }
}

async function main() {
  const server = new ClaudeMCPServer();
  await server.run();
}

// ES module check
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ClaudeMCPServer };
