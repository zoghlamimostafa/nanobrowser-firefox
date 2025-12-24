// Utility functions for communicating with background script
// File: pages/side-panel/src/utils/backgroundMessaging.ts

let port: chrome.runtime.Port | null = null;

export interface BackgroundMessage {
  type: string;
  [key: string]: any;
}

export interface BackgroundResponse {
  type: string;
  [key: string]: any;
}

// Initialize connection to background script
export function initializeConnection(): chrome.runtime.Port {
  if (!port) {
    port = chrome.runtime.connect({ name: 'side-panel-connection' });
    
    port.onDisconnect.addListener(() => {
      console.log('Background connection disconnected');
      port = null;
    });
  }
  
  return port;
}

// Send message to background script and wait for response
export function sendMessageToBackground(message: BackgroundMessage): Promise<BackgroundResponse> {
  return new Promise((resolve, reject) => {
    const currentPort = initializeConnection();
    
    const timeout = setTimeout(() => {
      reject(new Error('Background message timeout'));
    }, 30000); // 30 second timeout
    
    const messageHandler = (response: BackgroundResponse) => {
      clearTimeout(timeout);
      currentPort.onMessage.removeListener(messageHandler);
      resolve(response);
    };
    
    currentPort.onMessage.addListener(messageHandler);
    currentPort.postMessage(message);
  });
}

// Burp Suite MCP specific functions
export async function testBurpConnection() {
  return sendMessageToBackground({ type: 'burp_test_connection' });
}

export async function startBurpScan(target: string) {
  return sendMessageToBackground({ 
    type: 'burp_start_scan', 
    target 
  });
}

export async function getBurpScanStatus(taskId: string) {
  return sendMessageToBackground({ 
    type: 'burp_get_scan_status', 
    taskId 
  });
}

export async function getBurpVulnerabilities() {
  return sendMessageToBackground({ 
    type: 'burp_get_vulnerabilities' 
  });
}

export async function getBurpProjects() {
  return sendMessageToBackground({ 
    type: 'burp_get_projects' 
  });
}

export async function generateBurpPayloads(payloadType: string, count: number = 10) {
  return sendMessageToBackground({ 
    type: 'burp_generate_payloads', 
    payloadType: payloadType,
    count 
  });
}

export async function updateBurpConfig(config: any) {
  return sendMessageToBackground({ 
    type: 'burp_update_config', 
    config 
  });
}