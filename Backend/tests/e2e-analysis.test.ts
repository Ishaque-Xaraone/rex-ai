import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';
import { ProjectService } from '../src/services/project.service.js';
import { AnalysisService } from '../src/services/analysis.service.js';
import { StorageService } from '../src/services/storage.service.js';
import { DatabaseQueries } from '../src/database/queries/index.js';
import { checkDatabaseHealth } from '../src/database/connection.js';
import { SecurityError } from '../src/utils/security.js';

describe('Phase 2: End-to-End Real Project Analysis & Security', () => {
  let tempZipPath: string;
  let maliciousZipPath: string;
  let corruptZipPath: string;

  beforeAll(async () => {
    // 1. Build a valid real TypeScript fixture project in a zip archive
    const zip = new AdmZip();

    const authFileContent = `import { validateToken } from './token.js';
import path from 'node:path';

export interface Session {
  userId: string;
  expiresAt: number;
}

export class AuthService {
  private apiKey = 'sk-12345678901234567890123456';

  public async authenticate(token: string): Promise<boolean> {
    try {
      return validateToken(token);
    } catch {
      // Empty catch
    }
    return false;
  }

  public dangerousEval(script: string): unknown {
    return eval(script);
  }
}
`;

    const tokenFileContent = `import crypto from 'node:crypto';

export const validateToken = (token: string): boolean => {
  return token.length > 10;
};
`;

    zip.addFile('src/auth.ts', Buffer.from(authFileContent, 'utf-8'));
    zip.addFile('src/token.ts', Buffer.from(tokenFileContent, 'utf-8'));

    tempZipPath = path.join(os.tmpdir(), `rex-valid-fixture-${Date.now()}.zip`);
    zip.writeZip(tempZipPath);

    // 2. Build a malicious ZIP slip archive
    const badZip = new AdmZip();
    badZip.addFile('evil-escape.js', Buffer.from('console.log("hacked");', 'utf-8'));
    badZip.getEntries()[0]!.entryName = '../evil-escape.js';
    maliciousZipPath = path.join(os.tmpdir(), `rex-malicious-${Date.now()}.zip`);
    badZip.writeZip(maliciousZipPath);

    // 3. Build a corrupt archive
    corruptZipPath = path.join(os.tmpdir(), `rex-corrupt-${Date.now()}.zip`);
    await fs.writeFile(corruptZipPath, 'This is definitely not a valid zip file binary buffer');
  });

  afterAll(async () => {
    try {
      await fs.unlink(tempZipPath);
      await fs.unlink(maliciousZipPath);
      await fs.unlink(corruptZipPath);
    } catch {
      // Ignore cleanup error
    }
  });

  describe('Security & Archive Ingestion Guardrails', () => {
    it('rejects ZIP slip attempts containing directory traversal sequences', async () => {
      const dummyTarget = path.join(os.tmpdir(), `rex-target-${Date.now()}`);
      await expect(
        StorageService.extractZipArchive(maliciousZipPath, dummyTarget)
      ).rejects.toThrow(SecurityError);
    });

    it('rejects corrupted or non-ZIP input files cleanly', async () => {
      const dummyTarget = path.join(os.tmpdir(), `rex-target-${Date.now()}`);
      await expect(
        StorageService.extractZipArchive(corruptZipPath, dummyTarget)
      ).rejects.toThrow(SecurityError);
    });
  });

  describe('Real End-to-End Analysis Workflow', () => {
    let createdProjectId: string;
    let launchedAnalysisId: string;

    it('imports project archive, extracts safely, and discovers source files', async () => {
      const importResponse = await ProjectService.importArchive(
        'E2E-Authentication-Service',
        tempZipPath,
        'Production security audit test project'
      );

      expect(importResponse.projectId).toBeDefined();
      expect(importResponse.name).toBe('E2E-Authentication-Service');
      expect(importResponse.importedFilesCount).toBe(2);
      expect(importResponse.totalSizeBytes).toBeGreaterThan(0);
      expect(importResponse.detectedLanguages.some((l) => l.language === 'typescript')).toBe(true);

      createdProjectId = importResponse.projectId;

      // Verify files in database/service
      const files = await ProjectService.getProjectFiles(createdProjectId);
      expect(files.length).toBe(2);
      const filePaths = files.map((f) => f.relativePath);
      expect(filePaths).toContain('src/auth.ts');
      expect(filePaths).toContain('src/token.ts');
    });

    it('triggers analysis, executes AST traversal, and persists results to PostgreSQL', async () => {
      const job = await AnalysisService.triggerAnalysis(createdProjectId);
      expect(job.id).toBeDefined();
      expect(job.projectId).toBe(createdProjectId);
      expect(job.status).toBe('running');

      launchedAnalysisId = job.id;

      // Poll until analysis completes
      let completedJob = await AnalysisService.getAnalysisJob(launchedAnalysisId);
      let attempts = 0;
      while (completedJob && completedJob.status === 'running' && attempts < 30) {
        await new Promise((r) => setTimeout(r, 200));
        completedJob = await AnalysisService.getAnalysisJob(launchedAnalysisId);
        attempts++;
      }

      expect(completedJob).not.toBeNull();
      expect(['completed', 'partial']).toContain(completedJob!.status);
      expect(completedJob!.progressPercent).toBe(100);
      expect(completedJob!.completedAt).toBeDefined();
      expect(completedJob!.summary).toBeDefined();
      expect(completedJob!.summary!.totalFiles).toBe(2);
      expect(completedJob!.summary!.totalLinesOfCode).toBeGreaterThan(15);
    });

    it('extracts AST symbols (functions, classes, interfaces, methods, constants)', async () => {
      const dbHealth = await checkDatabaseHealth();
      if (dbHealth.connected) {
        const symbols = await DatabaseQueries.getSymbolsByProjectId(createdProjectId);
        expect(symbols.length).toBeGreaterThanOrEqual(4);

        const symbolNames = symbols.map((s) => s.name);
        expect(symbolNames).toContain('AuthService'); // Class
        expect(symbolNames).toContain('authenticate'); // Method
        expect(symbolNames).toContain('dangerousEval'); // Method
        expect(symbolNames).toContain('Session'); // Interface
        expect(symbolNames).toContain('validateToken'); // Exported arrow function
      }
    });

    it('extracts dependency edges and resolves internal module paths', async () => {
      const graph = await AnalysisService.getGraphData(launchedAnalysisId);
      expect(graph.nodes.length).toBeGreaterThanOrEqual(2);
      expect(graph.edges.length).toBeGreaterThanOrEqual(2);

      // Verify internal edge between src/auth.ts and src/token.js
      const internalEdge = graph.edges.find((e) => e.source === 'src/auth.ts');
      expect(internalEdge).toBeDefined();
      expect(internalEdge!.target).toContain('token');

      // Verify external package edges (node:path, node:crypto)
      const externalNode = graph.nodes.find((n) => n.id === 'node:path' || n.id === 'node:crypto');
      expect(externalNode).toBeDefined();
    });

    it('detects and persists security vulnerabilities (eval and hardcoded secrets)', async () => {
      const findings = await AnalysisService.getFindings(launchedAnalysisId);
      expect(findings.length).toBeGreaterThanOrEqual(2);

      const ruleIds = findings.map((f) => f.ruleId);
      expect(ruleIds).toContain('SEC-001'); // eval()
      expect(ruleIds).toContain('SEC-003'); // hardcoded API key
      expect(ruleIds).toContain('QUAL-001'); // empty catch block

      const evalFinding = findings.find((f) => f.ruleId === 'SEC-001');
      expect(evalFinding).toBeDefined();
      expect(evalFinding!.severity).toBe('critical');
      expect(evalFinding!.evidence.filePath).toBe('src/auth.ts');
      expect(evalFinding!.evidence.snippet).toContain('eval(script)');
      expect(evalFinding!.evidence.lineReference.startLine).toBeGreaterThan(0);
    });

    it('generates structured audit report metadata', async () => {
      const report = await AnalysisService.getReport(launchedAnalysisId);
      expect(report.analysisId).toBe(launchedAnalysisId);
      expect(report.projectName).toBe('E2E-Authentication-Service');
      expect(report.status).toBe('generated');
      expect(report.totalFindings).toBeGreaterThanOrEqual(2);
      expect(report.findingsBySeverity.critical).toBeGreaterThanOrEqual(2);
      expect(report.executiveSummary).toContain('E2E-Authentication-Service');
    });
  });
});
