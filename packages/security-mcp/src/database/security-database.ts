import sqlite3 from 'sqlite3';

export type SqlValue = string | number | boolean | null;
export type SqlParams = SqlValue[];

export interface SecurityProject {
  id: string;
  name: string;
  target: string;
  scope?: string;
  methodology?: string;
  status: 'active' | 'completed' | 'paused';
  created: string;
  updated: string;
}

export interface Finding {
  id: string;
  projectId: string;
  name: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  url: string;
  method: string;
  parameter?: string;
  payload?: string;
  description: string;
  impact: string;
  remediation: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'new' | 'confirmed' | 'false_positive' | 'fixed';
  created: string;
  updated: string;
}

export class SecurityDatabase {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || './security_testing.db';
    this.db = new (sqlite3.verbose().Database)(this.dbPath);
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    const queries = [
      `
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          target TEXT NOT NULL,
          scope TEXT,
          methodology TEXT,
          status TEXT DEFAULT 'active',
          created TEXT DEFAULT CURRENT_TIMESTAMP,
          updated TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS findings (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          severity TEXT NOT NULL,
          url TEXT NOT NULL,
          method TEXT NOT NULL,
          parameter TEXT,
          payload TEXT,
          description TEXT NOT NULL,
          impact TEXT NOT NULL,
          remediation TEXT NOT NULL,
          evidence TEXT NOT NULL,
          confidence TEXT NOT NULL,
          status TEXT DEFAULT 'new',
          created TEXT DEFAULT CURRENT_TIMESTAMP,
          updated TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id)
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS scan_history (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          scan_type TEXT NOT NULL,
          target TEXT NOT NULL,
          start_time TEXT DEFAULT CURRENT_TIMESTAMP,
          end_time TEXT,
          status TEXT DEFAULT 'running',
          findings_count INTEGER DEFAULT 0,
          FOREIGN KEY (project_id) REFERENCES projects (id)
        )
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_findings_project ON findings(project_id);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
      `,
    ];

    for (const query of queries) {
      await this.runQuery(query);
    }
  }

  async createProject(projectData: Omit<SecurityProject, 'id' | 'created' | 'updated'>): Promise<SecurityProject> {
    const id = this.generateId();
    const created = new Date().toISOString();

    const query = `
      INSERT INTO projects (id, name, target, scope, methodology, status, created, updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.runQuery(query, [
      id,
      projectData.name,
      projectData.target,
      projectData.scope || '',
      projectData.methodology || '',
      projectData.status || 'active',
      created,
      created,
    ]);

    return {
      id,
      name: projectData.name,
      target: projectData.target,
      scope: projectData.scope,
      methodology: projectData.methodology,
      status: projectData.status || 'active',
      created,
      updated: created,
    };
  }

  async listProjects(status?: string): Promise<SecurityProject[]> {
    let query = 'SELECT * FROM projects';
    const params: SqlParams = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created DESC';

    const rows = await this.allQuery(query, params);

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      target: row.target,
      scope: row.scope,
      methodology: row.methodology,
      status: row.status,
      created: row.created,
      updated: row.updated,
    }));
  }

  async getProject(id: string): Promise<SecurityProject | null> {
    const query = 'SELECT * FROM projects WHERE id = ?';
    const row = await this.getQuery(query, [id]);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      target: row.target,
      scope: row.scope,
      methodology: row.methodology,
      status: row.status,
      created: row.created,
      updated: row.updated,
    };
  }

  async updateProjectStatus(id: string, status: 'active' | 'completed' | 'paused'): Promise<void> {
    const query = 'UPDATE projects SET status = ?, updated = ? WHERE id = ?';
    await this.runQuery(query, [status, new Date().toISOString(), id]);
  }

  async addFinding(finding: Omit<Finding, 'id' | 'created' | 'updated'>): Promise<Finding> {
    const id = this.generateId();
    const created = new Date().toISOString();

    const query = `
      INSERT INTO findings (
        id, project_id, name, severity, url, method, parameter, payload,
        description, impact, remediation, evidence, confidence, status,
        created, updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.runQuery(query, [
      id,
      finding.projectId,
      finding.name,
      finding.severity,
      finding.url,
      finding.method,
      finding.parameter || '',
      finding.payload || '',
      finding.description,
      finding.impact,
      finding.remediation,
      finding.evidence,
      finding.confidence,
      finding.status,
      created,
      created,
    ]);

    return {
      id,
      ...finding,
      created,
      updated: created,
    };
  }

  async getFindings(projectId: string, severity?: string, status?: string): Promise<Finding[]> {
    let query = 'SELECT * FROM findings WHERE project_id = ?';
    const params: SqlParams = [projectId];

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY severity DESC, created DESC';

    const rows = await this.allQuery(query, params);

    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      severity: row.severity,
      url: row.url,
      method: row.method,
      parameter: row.parameter,
      payload: row.payload,
      description: row.description,
      impact: row.impact,
      remediation: row.remediation,
      evidence: row.evidence,
      confidence: row.confidence,
      status: row.status,
      created: row.created,
      updated: row.updated,
    }));
  }

  async updateFindingStatus(id: string, status: 'new' | 'confirmed' | 'false_positive' | 'fixed'): Promise<void> {
    const query = 'UPDATE findings SET status = ?, updated = ? WHERE id = ?';
    await this.runQuery(query, [status, new Date().toISOString(), id]);
  }

  async getProjectStats(projectId: string): Promise<{
    total: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    fixed: number;
    confirmed: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) as info,
        SUM(CASE WHEN status = 'fixed' THEN 1 ELSE 0 END) as fixed,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
      FROM findings 
      WHERE project_id = ?
    `;

    const row = await this.getQuery(query, [projectId]);

    return {
      total: row?.total || 0,
      high: row?.high || 0,
      medium: row?.medium || 0,
      low: row?.low || 0,
      info: row?.info || 0,
      fixed: row?.fixed || 0,
      confirmed: row?.confirmed || 0,
    };
  }

  async deleteFinding(id: string): Promise<void> {
    const query = 'DELETE FROM findings WHERE id = ?';
    await this.runQuery(query, [id]);
  }

  async deleteProject(id: string): Promise<void> {
    // Delete all findings first
    await this.runQuery('DELETE FROM findings WHERE project_id = ?', [id]);
    await this.runQuery('DELETE FROM scan_history WHERE project_id = ?', [id]);

    // Delete the project
    await this.runQuery('DELETE FROM projects WHERE id = ?', [id]);
  }

  async exportProject(projectId: string): Promise<{
    project: SecurityProject;
    findings: Finding[];
    stats: Record<string, number>;
  }> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const findings = await this.getFindings(projectId);
    const stats = await this.getProjectStats(projectId);

    return {
      project,
      findings,
      stats,
    };
  }

  private runQuery(query: string, params: SqlParams = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getQuery(query: string, params: SqlParams = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private allQuery(query: string, params: SqlParams = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  private generateId(): string {
    return 'sec_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  close(): void {
    this.db.close();
  }
}
