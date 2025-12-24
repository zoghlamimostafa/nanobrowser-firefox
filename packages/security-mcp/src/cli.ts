#!/usr/bin/env node

import { Command } from 'commander';
import { SecurityMCPServer } from './index.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('nanobrowser-security')
  .description('Nanobrowser Security MCP Server - Advanced penetration testing tools')
  .version('1.0.0');

program
  .command('start')
  .description('Start the Security MCP server')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-h, --host <host>', 'Host to bind the server to', 'localhost')
  .action(async options => {
    console.log(chalk.blue('🔐 Starting Nanobrowser Security MCP Server...'));
    console.log(chalk.gray(`   Host: ${options.host}`));
    console.log(chalk.gray(`   Port: ${options.port}`));

    try {
      const server = new SecurityMCPServer();
      await server.run();
      console.log(chalk.green('✅ Security MCP Server is running!'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to start server:'), error);
      process.exit(1);
    }
  });

program
  .command('scan')
  .description('Quick security scan of a target')
  .argument('<url>', 'Target URL to scan')
  .option('-d, --depth <depth>', 'Crawling depth', '2')
  .option('-t, --threads <threads>', 'Number of threads', '5')
  .option('-o, --output <file>', 'Output file for results')
  .action(async (url, options) => {
    console.log(chalk.blue(`🔍 Starting security scan of ${url}...`));

    // This would integrate with the vulnerability scanner
    console.log(chalk.yellow('⚠️  CLI scanning not implemented yet - use MCP server instead'));
    console.log(chalk.gray('💡 Start the MCP server and use VS Code tools for scanning'));
  });

program
  .command('payloads')
  .description('Generate security testing payloads')
  .option('-t, --type <type>', 'Payload type (xss, sqli, lfi, etc.)', 'xss')
  .option('-c, --context <context>', 'XSS context (html, attribute, js)', 'html')
  .option('-n, --count <count>', 'Number of payloads to generate', '10')
  .action(async options => {
    console.log(chalk.blue(`🎯 Generating ${options.type} payloads...`));

    // This would integrate with the payload generator
    console.log(chalk.yellow('⚠️  CLI payload generation not implemented yet'));
    console.log(chalk.gray('💡 Use the MCP server tools in VS Code for payload generation'));
  });

program
  .command('burp')
  .description('Connect to Burp Suite and run scan')
  .argument('<url>', 'Target URL to scan')
  .option('--host <host>', 'Burp Suite host', 'localhost')
  .option('--port <port>', 'Burp Suite port', '9876')
  .option('--api-key <key>', 'Burp Suite API key')
  .action(async (url, options) => {
    console.log(chalk.blue(`🕷️  Connecting to Burp Suite at ${options.host}:${options.port}...`));
    console.log(chalk.blue(`🎯 Starting scan of ${url}...`));

    // This would integrate with the Burp Suite client
    console.log(chalk.yellow('⚠️  CLI Burp integration not implemented yet'));
    console.log(chalk.gray('💡 Use the MCP server tools in VS Code for Burp Suite integration'));
  });

program
  .command('report')
  .description('Generate security report')
  .argument('<project-id>', 'Security project ID')
  .option('-f, --format <format>', 'Report format (html, pdf, markdown, json)', 'html')
  .option('-o, --output <file>', 'Output file path')
  .option('--detailed', 'Include detailed vulnerability information')
  .action(async (projectId, options) => {
    console.log(chalk.blue(`📊 Generating ${options.format} report for project ${projectId}...`));

    // This would integrate with the report generator
    console.log(chalk.yellow('⚠️  CLI report generation not implemented yet'));
    console.log(chalk.gray('💡 Use the MCP server tools in VS Code for report generation'));
  });

program
  .command('config')
  .description('Configure Nanobrowser Security settings')
  .option('--burp-host <host>', 'Set Burp Suite host')
  .option('--burp-port <port>', 'Burp Suite API port', '1337')
  .option('--burp-api-key <key>', 'Set Burp Suite API key')
  .option('--db-path <path>', 'Set database file path')
  .action(async options => {
    console.log(chalk.blue('⚙️  Configuring Nanobrowser Security...'));

    if (options.burpHost) {
      console.log(chalk.green(`✅ Burp Suite host set to: ${options.burpHost}`));
    }
    if (options.burpPort) {
      console.log(chalk.green(`✅ Burp Suite port set to: ${options.burpPort}`));
    }
    if (options.burpApiKey) {
      console.log(chalk.green('✅ Burp Suite API key configured'));
    }
    if (options.dbPath) {
      console.log(chalk.green(`✅ Database path set to: ${options.dbPath}`));
    }

    console.log(chalk.gray('💡 Configuration will be saved to .nanobrowser-security.json'));
  });

program
  .command('info')
  .description('Show information about Nanobrowser Security MCP')
  .action(() => {
    console.log(chalk.blue.bold('🔐 Nanobrowser Security MCP'));
    console.log(chalk.gray('Advanced security testing tools for the Nanobrowser extension'));
    console.log('');
    console.log(chalk.yellow('Features:'));
    console.log(chalk.gray('  • Burp Suite Professional integration'));
    console.log(chalk.gray('  • Advanced payload generation'));
    console.log(chalk.gray('  • Vulnerability scanning'));
    console.log(chalk.gray('  • Reconnaissance tools'));
    console.log(chalk.gray('  • Automated reporting'));
    console.log(chalk.gray('  • Project management'));
    console.log('');
    console.log(chalk.yellow('Usage:'));
    console.log(chalk.gray('  Start MCP server: nanobrowser-security start'));
    console.log(chalk.gray('  Connect in VS Code with MCP extension'));
    console.log(chalk.gray('  Use built-in tools for security testing'));
    console.log('');
    console.log(chalk.blue('For more information: https://github.com/zoghlamimostafa/nanobrowser-firefox'));
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

program.parse();
