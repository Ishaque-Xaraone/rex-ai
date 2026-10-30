import path from 'node:path';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class SecurityUtils {
  /**
   * Validates and ensures that targetPath is strictly inside baseDir.
   * Prevents directory traversal attacks (e.g. ../../etc/passwd).
   */
  public static assertSafeSubpath(baseDir: string, targetPath: string): string {
    const resolvedBase = path.resolve(baseDir);
    const resolvedTarget = path.resolve(resolvedBase, targetPath);

    const relative = path.relative(resolvedBase, resolvedTarget);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new SecurityError(`Path traversal attempt blocked: ${targetPath}`);
    }

    return resolvedTarget;
  }

  /**
   * Sanitizes filename to prevent malicious character injection or shell escapes.
   */
  public static sanitizeFilename(filename: string): string {
    const base = path.basename(filename);
    return base.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Validates ZIP archive entry name to prevent ZIP Slip.
   */
  public static validateArchiveEntryName(entryName: string): boolean {
    if (!entryName || typeof entryName !== 'string') {
      return false;
    }

    // Normalize forward and back slashes
    const normalized = entryName.replace(/\\/g, '/');

    // Reject absolute paths
    if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
      return false;
    }

    // Check for directory traversal sequences
    const parts = normalized.split('/');
    for (const part of parts) {
      if (part === '..' || part === '.') {
        return false;
      }
    }

    return true;
  }
}
