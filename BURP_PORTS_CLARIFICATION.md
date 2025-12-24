# 🎯 **IMPORTANT: Burp Suite has TWO different ports!**

## 📍 **Port Configuration Clarification**

Based on your Burp Suite setup, there are **two separate services**:

### 🔗 **REST API Service** (Port 1337)
- **Purpose**: Direct API calls to Burp Suite
- **URL**: `http://127.0.0.1:1337`
- **Status**: ✅ **WORKING** - Confirmed with curl test
- **Used by**: Nanobrowser Security MCP server
- **Authentication**: Requires API key

### 🔗 **MCP Server Service** (Port 9876) 
- **Purpose**: Model Context Protocol bridge for VS Code
- **URL**: `http://127.0.0.1:9876` 
- **Status**: ✅ **WORKING** - SSE endpoint confirmed
- **Used by**: VS Code MCP integration via proxy JAR
- **Authentication**: Through MCP protocol

## 🎯 **Immediate Actions Required**

### 1. Create API Key for REST API (Port 1337)
In your current Burp Suite REST API settings:
1. **Click "New"** in the API Keys section
2. **Enter name**: "Nanobrowser Security"
3. **Click "Enable"** 
4. **Copy the API key** (format: `api-key-xxxxxxxxxx`)

### 2. Extract MCP Proxy JAR (For Port 9876)
- Go back to **Extensions** → **MCP Server** tab
- **Click "Extract server proxy jar"** button
- Note the file path where it saves the JAR

### 3. Set Environment Variable
```bash
export BURP_API_KEY="your-api-key-from-step-1"
```

## 🧪 **Test Both Services**

### Test REST API (Port 1337)
```bash
# Test without API key (should show auth required)
curl -i http://127.0.0.1:1337/v0.1/issue_definitions

# Test with API key (after creating it)
curl -H "Authorization: Bearer your-api-key" http://127.0.0.1:1337/v0.1/issue_definitions
```

### Test MCP Service (Port 9876) 
```bash
# SSE endpoint (already working)
curl -i http://127.0.0.1:9876/sse
```

## 🔧 **Updated Configuration Files**

All configuration files have been updated with the correct ports:

- **Nanobrowser Security MCP**: Uses port **1337** for REST API
- **VS Code MCP Integration**: Uses port **9876** for MCP bridge

**Next Step**: Create that API key and extract the MCP proxy JAR! 🚀