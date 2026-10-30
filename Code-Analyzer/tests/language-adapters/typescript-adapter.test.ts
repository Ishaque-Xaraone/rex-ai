import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TypeScriptAdapter } from '../../src/adapters/typescript/typescript-adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TypeScriptAdapter', () => {
  it('correctly extracts symbols, dependencies, and security findings', async () => {
    const adapter = new TypeScriptAdapter();
    const fixturePath = path.resolve(__dirname, '../fixtures/sample.ts');
    const content = await fs.readFile(fixturePath, 'utf-8');

    const result = await adapter.analyzeFile({
      filePath: fixturePath,
      relativePath: 'sample.ts',
      content,
      projectId: 'test-project',
      analysisId: 'test-analysis',
      fileId: 'test-file-1',
    });

    // Check symbols
    expect(result.symbols.length).toBeGreaterThanOrEqual(4);
    const symbolNames = result.symbols.map((s) => s.name);
    expect(symbolNames).toContain('UserConfig');
    expect(symbolNames).toContain('ConfigManager');
    expect(symbolNames).toContain('loadConfig');
    expect(symbolNames).toContain('parseData');

    // Check imports/dependencies
    expect(result.dependencies.length).toBe(2);
    const specifiers = result.dependencies.map((d) => d.specifier);
    expect(specifiers).toContain('node:fs/promises');
    expect(specifiers).toContain('node:path');

    // Check findings (eval and empty catch block)
    const ruleIds = result.findings.map((f) => f.ruleId);
    expect(ruleIds).toContain('SEC-001'); // eval()
    expect(ruleIds).toContain('QUAL-001'); // empty catch
  });
});
