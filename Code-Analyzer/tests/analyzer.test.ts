import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RexCodeAnalyzer } from '../src/core/analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('RexCodeAnalyzer', () => {
  it('analyzes fixture directory and returns normalized analysis result', async () => {
    const analyzer = new RexCodeAnalyzer();
    const fixtureDir = path.resolve(__dirname, 'fixtures');

    const result = await analyzer.analyzeDirectory(fixtureDir, {
      projectId: 'proj-123',
      analysisId: 'analysis-456',
    });

    expect(result.job.status).toBe('completed');
    expect(result.summary.totalFiles).toBeGreaterThanOrEqual(1);
    expect(result.symbols.length).toBeGreaterThanOrEqual(1);
    expect(result.findings.length).toBeGreaterThanOrEqual(1);
  });
});
