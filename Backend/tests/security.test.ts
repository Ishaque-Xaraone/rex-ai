import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { SecurityUtils, SecurityError } from '../src/utils/security.js';

describe('SecurityUtils', () => {
  it('blocks path traversal attempts in assertSafeSubpath', () => {
    const baseDir = path.resolve('storage/projects');

    expect(() => {
      SecurityUtils.assertSafeSubpath(baseDir, '../../windows/system32/cmd.exe');
    }).toThrow(SecurityError);

    expect(() => {
      SecurityUtils.assertSafeSubpath(baseDir, '../etc/passwd');
    }).toThrow(SecurityError);
  });

  it('permits valid subpaths in assertSafeSubpath', () => {
    const baseDir = path.resolve('storage/projects');
    const safeTarget = 'project-123/src/index.ts';
    const result = SecurityUtils.assertSafeSubpath(baseDir, safeTarget);

    expect(result.startsWith(baseDir)).toBe(true);
  });

  it('rejects zip slip entry names in validateArchiveEntryName', () => {
    expect(SecurityUtils.validateArchiveEntryName('../evil.js')).toBe(false);
    expect(SecurityUtils.validateArchiveEntryName('foo/../../bar.js')).toBe(false);
    expect(SecurityUtils.validateArchiveEntryName('/absolute/path.js')).toBe(false);
    expect(SecurityUtils.validateArchiveEntryName('C:\\evil.js')).toBe(false);
    expect(SecurityUtils.validateArchiveEntryName('src/components/button.tsx')).toBe(true);
  });
});
