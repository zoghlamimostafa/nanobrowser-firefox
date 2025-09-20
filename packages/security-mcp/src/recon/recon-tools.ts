import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SubdomainResult {
  subdomain: string;
  ip: string;
  status: string;
  ports?: number[];
}

export interface TechnologyStack {
  webServer: string[];
  framework: string[];
  cms: string[];
  database: string[];
  cdn: string[];
  analytics: string[];
  javascript: string[];
  programming: string[];
}

export class ReconTools {
  async enumerateSubdomains(domain: string, methods?: string[], wordlist?: string): Promise<SubdomainResult[]> {
    const results: SubdomainResult[] = [];
    const enabledMethods = methods || ['dns', 'certificate', 'wordlist'];

    try {
      // DNS enumeration
      if (enabledMethods.includes('dns')) {
        const dnsResults = await this.dnsEnumeration(domain);
        results.push(...dnsResults);
      }

      // Certificate transparency logs
      if (enabledMethods.includes('certificate')) {
        const certResults = await this.certificateTransparency(domain);
        results.push(...certResults);
      }

      // Wordlist-based enumeration
      if (enabledMethods.includes('wordlist')) {
        const wordlistResults = await this.wordlistEnumeration(domain, wordlist);
        results.push(...wordlistResults);
      }

      // Remove duplicates
      const uniqueResults = this.deduplicateSubdomains(results);

      // Validate and get status for each subdomain
      return await this.validateSubdomains(uniqueResults);
    } catch (error) {
      console.error('Error in subdomain enumeration:', error);
      return [];
    }
  }

  async identifyTechnologies(
    url: string,
    analyzeHeaders: boolean = true,
    analyzeContent: boolean = true,
  ): Promise<TechnologyStack> {
    const technologies: TechnologyStack = {
      webServer: [],
      framework: [],
      cms: [],
      database: [],
      cdn: [],
      analytics: [],
      javascript: [],
      programming: [],
    };

    try {
      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)',
        },
      });

      if (analyzeHeaders) {
        this.analyzeHeaders(response.headers, technologies);
      }

      if (analyzeContent) {
        const content = await response.text();
        this.analyzeContent(content, technologies);
      }

      // Additional checks
      await this.performAdditionalChecks(url, technologies);
    } catch (error) {
      console.error('Error identifying technologies:', error);
    }

    return technologies;
  }

  async performPortScan(target: string, ports?: number[]): Promise<{ open: number[]; closed: number[] }> {
    const commonPorts = ports || [
      21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 1433, 3306, 3389, 5432, 6379, 8080, 8443,
    ];
    const openPorts: number[] = [];
    const closedPorts: number[] = [];

    for (const port of commonPorts) {
      try {
        const isOpen = await this.checkPort(target, port);
        if (isOpen) {
          openPorts.push(port);
        } else {
          closedPorts.push(port);
        }
      } catch (error) {
        closedPorts.push(port);
      }
    }

    return { open: openPorts, closed: closedPorts };
  }

  async gatherMetadata(url: string): Promise<Record<string, any>> {
    const metadata: Record<string, any> = {};

    try {
      const response = await fetch(url);
      const content = await response.text();

      // Extract meta tags
      const metaRegex = /<meta\s+([^>]*?)>/gi;
      const metas: any[] = [];
      let match;

      while ((match = metaRegex.exec(content)) !== null) {
        const attrs = this.parseAttributes(match[1]);
        metas.push(attrs);
      }

      metadata.meta = metas;

      // Extract title
      const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }

      // Extract robots.txt
      try {
        const robotsUrl = new URL('/robots.txt', url).toString();
        const robotsResponse = await fetch(robotsUrl);
        if (robotsResponse.ok) {
          metadata.robots = await robotsResponse.text();
        }
      } catch (error) {
        // Robots.txt not found or error
      }

      // Extract sitemap.xml
      try {
        const sitemapUrl = new URL('/sitemap.xml', url).toString();
        const sitemapResponse = await fetch(sitemapUrl);
        if (sitemapResponse.ok) {
          metadata.sitemap = await sitemapResponse.text();
        }
      } catch (error) {
        // Sitemap not found or error
      }
    } catch (error) {
      console.error('Error gathering metadata:', error);
    }

    return metadata;
  }

  private async dnsEnumeration(domain: string): Promise<SubdomainResult[]> {
    const subdomains: SubdomainResult[] = [];
    const commonSubdomains = ['www', 'mail', 'admin', 'api', 'dev', 'test', 'staging', 'ftp', 'blog', 'shop'];

    for (const sub of commonSubdomains) {
      try {
        const fullDomain = `${sub}.${domain}`;
        const resolved = await this.resolveDomain(fullDomain);
        if (resolved) {
          subdomains.push({
            subdomain: fullDomain,
            ip: resolved,
            status: 'resolved',
          });
        }
      } catch (error) {
        // Domain doesn't resolve
      }
    }

    return subdomains;
  }

  private async certificateTransparency(domain: string): Promise<SubdomainResult[]> {
    try {
      // This would typically use Certificate Transparency APIs like crt.sh
      const response = await fetch(`https://crt.sh/?q=${domain}&output=json`);
      const certificates = await response.json();

      const subdomains = new Set<string>();

      (certificates as any[]).forEach((cert: any) => {
        if (cert.name_value) {
          const names = cert.name_value.split('\n');
          names.forEach((name: string) => {
            if (name.includes(domain) && !name.startsWith('*')) {
              subdomains.add(name.trim());
            }
          });
        }
      });

      return Array.from(subdomains).map(subdomain => ({
        subdomain,
        ip: '',
        status: 'found_in_ct',
      }));
    } catch (error) {
      console.error('Error in certificate transparency lookup:', error);
      return [];
    }
  }

  private async wordlistEnumeration(domain: string, wordlistPath?: string): Promise<SubdomainResult[]> {
    const wordlist = wordlistPath ? await this.loadWordlist(wordlistPath) : this.getDefaultWordlist();
    const results: SubdomainResult[] = [];

    for (const word of wordlist.slice(0, 100)) {
      // Limit to avoid overwhelming
      try {
        const subdomain = `${word}.${domain}`;
        const ip = await this.resolveDomain(subdomain);
        if (ip) {
          results.push({
            subdomain,
            ip,
            status: 'resolved',
          });
        }
      } catch (error) {
        // Domain doesn't resolve
      }
    }

    return results;
  }

  private async resolveDomain(domain: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`nslookup ${domain}`);
      const ipMatch = stdout.match(/Address: (\d+\.\d+\.\d+\.\d+)/);
      return ipMatch ? ipMatch[1] : null;
    } catch (error) {
      return null;
    }
  }

  private async checkPort(target: string, port: number, timeout: number = 3000): Promise<boolean> {
    return new Promise(resolve => {
      const net = require('net');
      const socket = new net.Socket();

      const timer = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, timeout);

      socket.on('connect', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timer);
        resolve(false);
      });

      socket.connect(port, target);
    });
  }

  private analyzeHeaders(headers: Headers, technologies: TechnologyStack): void {
    headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      const lowerValue = value.toLowerCase();

      // Web server detection
      if (lowerKey === 'server') {
        if (lowerValue.includes('apache')) technologies.webServer.push('Apache');
        if (lowerValue.includes('nginx')) technologies.webServer.push('Nginx');
        if (lowerValue.includes('iis')) technologies.webServer.push('IIS');
        if (lowerValue.includes('cloudflare')) technologies.cdn.push('Cloudflare');
      }

      // Framework detection
      if (lowerKey === 'x-powered-by') {
        if (lowerValue.includes('php')) technologies.programming.push('PHP');
        if (lowerValue.includes('asp.net')) technologies.framework.push('ASP.NET');
        if (lowerValue.includes('express')) technologies.framework.push('Express.js');
      }

      // CDN detection
      if (lowerKey.includes('cf-') || lowerKey.includes('cloudflare')) {
        technologies.cdn.push('Cloudflare');
      }
    });
  }

  private analyzeContent(content: string, technologies: TechnologyStack): void {
    // CMS detection
    if (content.includes('/wp-content/') || content.includes('wordpress')) {
      technologies.cms.push('WordPress');
    }
    if (content.includes('Drupal.settings') || content.includes('/sites/default/')) {
      technologies.cms.push('Drupal');
    }
    if (content.includes('Joomla')) {
      technologies.cms.push('Joomla');
    }

    // JavaScript libraries
    if (content.includes('jquery')) technologies.javascript.push('jQuery');
    if (content.includes('angular')) technologies.javascript.push('Angular');
    if (content.includes('react')) technologies.javascript.push('React');
    if (content.includes('vue')) technologies.javascript.push('Vue.js');

    // Analytics
    if (content.includes('google-analytics') || content.includes('gtag')) {
      technologies.analytics.push('Google Analytics');
    }
    if (content.includes('_gaq') || content.includes('ga(')) {
      technologies.analytics.push('Google Analytics');
    }

    // Programming languages
    if (content.includes('<?php')) technologies.programming.push('PHP');
    if (content.includes('asp.net') || content.includes('__doPostBack')) {
      technologies.programming.push('ASP.NET');
    }
  }

  private async performAdditionalChecks(url: string, technologies: TechnologyStack): Promise<void> {
    try {
      // Check common framework endpoints
      const endpoints = ['/api/', '/.well-known/', '/admin/', '/wp-admin/', '/phpmyadmin/', '/api/v1/', '/graphql'];

      for (const endpoint of endpoints) {
        try {
          const testUrl = new URL(endpoint, url).toString();
          const response = await fetch(testUrl, { method: 'HEAD' });

          if (response.status === 200) {
            if (endpoint.includes('wp-')) technologies.cms.push('WordPress');
            if (endpoint.includes('phpmyadmin')) technologies.database.push('MySQL');
            if (endpoint.includes('graphql')) technologies.framework.push('GraphQL');
          }
        } catch (error) {
          // Endpoint not accessible
        }
      }
    } catch (error) {
      // Additional checks failed
    }
  }

  private async validateSubdomains(subdomains: SubdomainResult[]): Promise<SubdomainResult[]> {
    const validatedResults: SubdomainResult[] = [];

    for (const subdomain of subdomains) {
      try {
        if (!subdomain.ip) {
          subdomain.ip = (await this.resolveDomain(subdomain.subdomain)) || 'Unknown';
        }

        // Check if subdomain is accessible
        try {
          const response = await fetch(`http://${subdomain.subdomain}`, {
            method: 'HEAD',
            timeout: 5000,
          } as any);
          subdomain.status = `HTTP ${response.status}`;
        } catch (error) {
          try {
            const response = await fetch(`https://${subdomain.subdomain}`, {
              method: 'HEAD',
              timeout: 5000,
            } as any);
            subdomain.status = `HTTPS ${response.status}`;
          } catch (httpsError) {
            subdomain.status = 'Resolved but not accessible';
          }
        }

        validatedResults.push(subdomain);
      } catch (error) {
        // Skip invalid subdomains
      }
    }

    return validatedResults;
  }

  private deduplicateSubdomains(subdomains: SubdomainResult[]): SubdomainResult[] {
    const seen = new Set<string>();
    return subdomains.filter(sub => {
      const key = sub.subdomain.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async loadWordlist(filePath: string): Promise<string[]> {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf8');
      return content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
    } catch (error) {
      console.error('Error loading wordlist:', error);
      return this.getDefaultWordlist();
    }
  }

  private getDefaultWordlist(): string[] {
    return [
      'www',
      'mail',
      'ftp',
      'admin',
      'test',
      'dev',
      'staging',
      'api',
      'blog',
      'shop',
      'news',
      'support',
      'help',
      'docs',
      'cdn',
      'static',
      'img',
      'images',
      'media',
      'assets',
      'css',
      'js',
      'app',
      'mobile',
      'secure',
      'vpn',
      'portal',
      'dashboard',
      'panel',
      'cpanel',
      'webmail',
      'email',
      'smtp',
      'pop',
      'imap',
      'ns1',
      'ns2',
      'dns',
      'mx',
      'gateway',
      'proxy',
      'lb',
      'loadbalancer',
      'backup',
      'archive',
    ];
  }

  private parseAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const regex = /(\w+)=["']([^"']*)["']/g;
    let match;

    while ((match = regex.exec(attrString)) !== null) {
      attrs[match[1]] = match[2];
    }

    return attrs;
  }
}
