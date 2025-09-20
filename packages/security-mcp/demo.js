#!/usr/bin/env node

/**
 * Nanobrowser Security MCP Demo
 *
 * This script demonstrates the security testing capabilities
 * of the Nanobrowser Security MCP server.
 */

import { PayloadGenerator } from './dist/payloads/payload-generator.js';
import { ReconTools } from './dist/recon/recon-tools.js';
import { SecurityDatabase } from './dist/database/security-database.js';
import { ReportGenerator } from './dist/reporting/report-generator.js';

async function runDemo() {
  console.log('🔐 Nanobrowser Security MCP Demo\n');

  try {
    // Initialize components
    const payloadGen = new PayloadGenerator();
    const recon = new ReconTools();
    const database = new SecurityDatabase();

    // Wait for database initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Database initialized');

    // Create a demo project
    const project = await database.createProject({
      name: 'Demo Security Assessment',
      target: 'https://example.com',
      scope: '*.example.com',
      methodology: 'OWASP Testing Guide',
      status: 'active',
    });
    console.log(`✅ Created project: ${project.name} (ID: ${project.id})`);

    // Generate some payloads
    console.log('\n🎯 Generating Security Payloads...');

    const xssPayloads = await payloadGen.generateXSSPayloads('html', 'none', []);
    console.log(`   XSS Payloads: ${xssPayloads.length} generated`);

    const sqliPayloads = await payloadGen.generateSQLiPayloads('mysql', 'union', "'", ' -- ');
    console.log(`   SQL Injection Payloads: ${sqliPayloads.length} generated`);

    // Demo reconnaissance
    console.log('\n🔍 Reconnaissance Demo...');

    try {
      const tech = await recon.technologyFingerprint({
        url: 'https://httpbin.org',
        headers: true,
        content: false,
      });
      console.log(`   Technologies detected: ${tech.technologies.length}`);
      console.log(`   Server: ${tech.server || 'Unknown'}`);
    } catch (error) {
      console.log('   ⚠️  Technology fingerprinting failed (network/timeout)');
    }

    // Add some demo findings
    console.log('\n📊 Adding Demo Findings...');

    const findings = [
      {
        projectId: project.id,
        name: 'Reflected Cross-Site Scripting',
        severity: 'high',
        url: 'https://example.com/search?q=<script>alert(1)</script>',
        method: 'GET',
        parameter: 'q',
        payload: '<script>alert(1)</script>',
        description: 'User input is reflected in the response without proper encoding',
        impact: 'Attackers can execute arbitrary JavaScript in victim browsers',
        remediation: 'Implement proper output encoding',
        evidence: 'Alert dialog appeared',
        confidence: 'high',
        status: 'new',
      },
      {
        projectId: project.id,
        name: 'SQL Injection in Login Form',
        severity: 'high',
        url: 'https://example.com/login',
        method: 'POST',
        parameter: 'username',
        payload: "admin' OR '1'='1' -- ",
        description: 'Database error messages indicate SQL injection vulnerability',
        impact: 'Unauthorized database access and data exfiltration',
        remediation: 'Use parameterized queries',
        evidence: 'MySQL syntax error in response',
        confidence: 'high',
        status: 'new',
      },
    ];

    for (const finding of findings) {
      await database.addFinding(finding);
      console.log(`   ✅ Added ${finding.name} finding`);
    }

    // Generate a demo report
    console.log('\n📋 Generating Security Report...');

    const reporter = new ReportGenerator(database);
    const report = await reporter.generateReport(project.id, 'html', true);

    console.log(`   ✅ Report generated: ${report.filename}`);
    console.log(`   📁 Report saved to: ${report.path}`);
    console.log(`   📊 Report size: ${report.size}`);

    // Show project statistics
    const stats = await database.getProjectStats(project.id);
    console.log('\n📈 Project Statistics:');
    console.log(`   Total Findings: ${stats.total}`);
    console.log(`   High: ${stats.high}`);
    console.log(`   Medium: ${stats.medium}`);
    console.log(`   Low: ${stats.low}`);
    console.log(`   Info: ${stats.info}`);

    console.log('\n🎉 Demo completed successfully!');
    console.log('\n💡 Tips:');
    console.log('   • Use the MCP tools in VS Code for interactive testing');
    console.log('   • Configure Burp Suite for automated scanning');
    console.log('   • Always get permission before testing applications');
    console.log('   • Check the generated report for detailed findings');
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { runDemo };
