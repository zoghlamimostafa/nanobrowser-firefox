# Burp Suite MCP Integration Guide

## 🎯 Integration Points for Burp Suite MCP

### 1. **Background Script Integration** (Recommended Primary)

**Location:** `chrome-extension/src/background/services/securityMCP.ts`

```typescript
// Create this new service file
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

class SecurityMCPClient {
  private client: Client | null = null;
  
  async startBurpScan(target: string): Promise<string> {
    // Connect to Security MCP Server and call burp_start_scan
  }
  
  async getBurpScanStatus(taskId: string): Promise<any> {
    // Get scan progress from Burp Suite via MCP
  }
}

export const securityMCP = new SecurityMCPClient();
```

**Then integrate in:** `chrome-extension/src/background/index.ts`

```typescript
import { securityMCP } from './services/securityMCP';

// Add message listener for security operations
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SECURITY_SCAN_START') {
    securityMCP.startBurpScan(message.target)
      .then(taskId => sendResponse({ success: true, taskId }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
  
  if (message.type === 'SECURITY_GET_FINDINGS') {
    securityMCP.getFindings()
      .then(findings => sendResponse({ success: true, findings }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
```

### 2. **Side Panel Integration** (UI Layer)

**Location:** `pages/side-panel/src/components/SecurityDashboard.tsx`

Replace the TODO comments with actual MCP calls:

```typescript
// Add at the top
const sendMessageToBackground = (message: any): Promise<any> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
};

// Replace handleStartScan function
const handleStartScan = async (target: string) => {
  setIsLoading(true);
  try {
    const response = await sendMessageToBackground({
      type: 'SECURITY_SCAN_START',
      target
    });
    
    if (response.success) {
      // Add scan to state
      setBurpScans(prev => [...prev, {
        taskId: response.taskId,
        status: 'running',
        url: target,
        progress: 0
      }]);
    } else {
      alert(`Scan failed: ${response.error}`);
    }
  } catch (error) {
    alert(`Error starting scan: ${error}`);
  } finally {
    setIsLoading(false);
  }
};

// Replace generatePayloads function
const generatePayloads = async (type: string) => {
  setIsLoading(true);
  try {
    const response = await sendMessageToBackground({
      type: 'SECURITY_GENERATE_PAYLOADS',
      payloadType: type
    });
    
    if (response.success) {
      console.log('Generated payloads:', response.payloads);
      // Handle payload display/storage
    }
  } catch (error) {
    alert(`Error generating payloads: ${error}`);
  } finally {
    setIsLoading(false);
  }
};

// Add useEffect for loading data
useEffect(() => {
  const loadSecurityData = async () => {
    try {
      const [projectsRes, findingsRes] = await Promise.all([
        sendMessageToBackground({ type: 'SECURITY_GET_PROJECTS' }),
        sendMessageToBackground({ type: 'SECURITY_GET_FINDINGS' })
      ]);
      
      if (projectsRes.success) setProjects(projectsRes.projects);
      if (findingsRes.success) setFindings(findingsRes.findings);
    } catch (error) {
      console.error('Error loading security data:', error);
    }
  };
  
  loadSecurityData();
}, []);
```

### 3. **MCP Server Setup** (Already Complete)

**Location:** `packages/security-mcp/src/index.ts`

The MCP server is already implemented with:
- ✅ Burp Suite Professional API integration
- ✅ Payload generation tools
- ✅ Vulnerability scanning
- ✅ Reconnaissance tools
- ✅ Security database
- ✅ Report generation

### 4. **Direct HTTP Integration** (Alternative)

**Location:** `pages/side-panel/src/utils/securityAPI.ts`

```typescript
// Create direct HTTP client (if you prefer not using MCP)
class SecurityAPI {
  private burpAPIUrl = 'http://localhost:1337'; // Burp Suite Enterprise
  
  async startScan(target: string): Promise<string> {
    const response = await fetch(`${this.burpAPIUrl}/v0.1/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: { include: [{ rule: target }] },
        application_logins: [],
        scan_configurations: []
      })
    });
    
    const data = await response.json();
    return data.task_id;
  }
}

export const securityAPI = new SecurityAPI();
```

## 🚀 **Quick Setup Steps**

### Step 1: Start Security MCP Server
```bash
cd /home/user/Desktop/nanobrowser
node packages/security-mcp/src/index.ts
```

### Step 2: Configure Burp Suite
1. Start Burp Suite Professional
2. Enable REST API on port 1337
3. Configure API key if needed

### Step 3: Add Background Service (Option A - MCP)
```bash
# Create the service file
touch chrome-extension/src/background/services/securityMCP.ts
# Copy the MCP client code above
```

### Step 4: Update Side Panel (Option A - MCP)
```typescript
// Replace TODO comments in SecurityDashboard.tsx with MCP calls
```

### Step 5: Alternative Direct Integration (Option B - Direct HTTP)
```bash
# Create API utility
touch pages/side-panel/src/utils/securityAPI.ts
# Use direct HTTP calls to Burp Suite
```

## 📋 **Integration Checklist**

- [ ] **MCP Server Running**: `node packages/security-mcp/src/index.ts`
- [ ] **Burp Suite Professional**: API enabled on port 1337
- [ ] **Background Service**: Add `securityMCP.ts` service
- [ ] **Message Handling**: Update `background/index.ts`
- [ ] **UI Integration**: Replace TODO comments in `SecurityDashboard.tsx`
- [ ] **Error Handling**: Add try/catch blocks
- [ ] **State Management**: Update React state with real data
- [ ] **Testing**: Test scan functionality

## 🔧 **Recommended Approach**

**Primary**: Use Background Script + MCP (Option A)
- ✅ Clean separation of concerns
- ✅ Persistent connection to MCP server
- ✅ Better error handling
- ✅ Extension security compliance

**Alternative**: Direct HTTP calls (Option B)
- ✅ Simpler setup
- ❌ CORS issues possible
- ❌ Less secure
- ❌ No persistent connection

Choose **Option A (Background + MCP)** for production use!