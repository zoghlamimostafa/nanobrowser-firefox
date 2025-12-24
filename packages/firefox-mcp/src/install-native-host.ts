#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Install script for Firefox Native Messaging host
 * Creates the manifest and registers it with Firefox
 */

const EXTENSION_ID = 'nanobrowser@nanobrowser.ai';
const HOST_NAME = 'ai.nanobrowser.mcp';

function getManifestPath(): string {
  const platform = os.platform();
  const home = os.homedir();

  switch (platform) {
    case 'linux':
      return path.join(home, '.mozilla', 'native-messaging-hosts', `${HOST_NAME}.json`);
    case 'darwin': // macOS
      return path.join(home, 'Library', 'Application Support', 'Mozilla', 'NativeMessagingHosts', `${HOST_NAME}.json`);
    case 'win32':
      // Windows uses registry, but we'll create the file first
      return path.join(process.env.APPDATA || '', 'Mozilla', 'NativeMessagingHosts', `${HOST_NAME}.json`);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function createManifest(scriptPath: string): any {
  return {
    name: HOST_NAME,
    description: 'Nanobrowser Firefox MCP Server - Native messaging host for browser automation',
    path: scriptPath,
    type: 'stdio',
    allowed_extensions: [EXTENSION_ID],
  };
}

function createLauncherScript(indexPath: string): string {
  const platform = os.platform();
  const launcherDir = path.join(path.dirname(indexPath), 'launcher');

  // Create launcher directory
  if (!fs.existsSync(launcherDir)) {
    fs.mkdirSync(launcherDir, { recursive: true });
  }

  if (platform === 'win32') {
    // Windows batch script
    const batchPath = path.join(launcherDir, 'nanobrowser-firefox-mcp.bat');
    const batchContent = `@echo off
"${process.execPath}" "${indexPath}" %*
`;
    fs.writeFileSync(batchPath, batchContent);
    return batchPath;
  } else {
    // Unix shell script
    const shellPath = path.join(launcherDir, 'nanobrowser-firefox-mcp.sh');
    const shellContent = `#!/bin/bash
exec "${process.execPath}" "${indexPath}" "$@"
`;
    fs.writeFileSync(shellPath, shellContent);
    fs.chmodSync(shellPath, 0o755);
    return shellPath;
  }
}

async function install() {
  console.log('🦊 Installing Nanobrowser Firefox MCP Native Messaging Host...\n');

  try {
    // Get the path to the built index.js
    const indexPath = path.resolve(__dirname, 'index.js');

    if (!fs.existsSync(indexPath)) {
      console.error('❌ Error: index.js not found. Please run `pnpm build` first.');
      process.exit(1);
    }

    console.log(`📁 MCP Server location: ${indexPath}`);

    // Create launcher script
    const launcherPath = createLauncherScript(indexPath);
    console.log(`📄 Launcher script created: ${launcherPath}`);

    // Create manifest
    const manifest = createManifest(launcherPath);
    const manifestPath = getManifestPath();

    // Ensure directory exists
    const manifestDir = path.dirname(manifestPath);
    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }

    // Write manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`\n✅ Native messaging host installed successfully!`);
    console.log(`📄 Manifest location: ${manifestPath}`);
    console.log(`🔗 Host name: ${HOST_NAME}`);
    console.log(`🆔 Extension ID: ${EXTENSION_ID}\n`);

    // Platform-specific instructions
    const platform = os.platform();
    if (platform === 'win32') {
      console.log('📝 Windows users: You may need to register the host in the registry:');
      console.log(`   Run as Administrator:`);
      console.log(
        `   REG ADD "HKEY_CURRENT_USER\\Software\\Mozilla\\NativeMessagingHosts\\${HOST_NAME}" /ve /d "${manifestPath}" /f\n`,
      );
    }

    console.log('🔧 Next steps:');
    console.log('1. Load the Nanobrowser extension in Firefox');
    console.log('2. Configure Claude Desktop with Firefox MCP server');
    console.log('3. Test the connection with Claude\n');

    console.log('📖 See FIREFOX_MCP_SETUP.md for complete setup instructions');
  } catch (error) {
    console.error('❌ Installation failed:', error);
    process.exit(1);
  }
}

// Run installation
install().catch(console.error);
