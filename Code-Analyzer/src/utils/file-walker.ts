import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_EXCLUDED_DIRS,
  DEFAULT_EXCLUDED_EXTENSIONS,
  SECURITY_LIMITS,
} from '@rex/shared';

export interface DiscoveredFile {
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
}

export interface FileWalkerOptions {
  excludedDirectories?: readonly string[];
  excludedExtensions?: readonly string[];
  maxFiles?: number;
  maxFileSize?: number;
}

export class FileWalker {
  public static async discoverFiles(
    rootDir: string,
    options?: FileWalkerOptions
  ): Promise<DiscoveredFile[]> {
    const excludedDirs = new Set(options?.excludedDirectories ?? DEFAULT_EXCLUDED_DIRS);
    const excludedExts = new Set(options?.excludedExtensions ?? DEFAULT_EXCLUDED_EXTENSIONS);
    const maxFiles = options?.maxFiles ?? SECURITY_LIMITS.MAX_FILE_COUNT;
    const maxFileSize = options?.maxFileSize ?? SECURITY_LIMITS.MAX_SINGLE_FILE_BYTES;

    const results: DiscoveredFile[] = [];
    const rootNormalized = path.resolve(rootDir);

    async function walk(currentDir: string): Promise<void> {
      if (results.length >= maxFiles) {
        return;
      }

      let entries;
      try {
        entries = await fs.readdir(currentDir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (results.length >= maxFiles) {
          break;
        }

        const fullPath = path.join(currentDir, entry.name);

        // Security check: ensure path is strictly under root (defense against traversal)
        const resolvedPath = path.resolve(fullPath);
        if (!resolvedPath.startsWith(rootNormalized)) {
          continue;
        }

        if (entry.isDirectory()) {
          if (excludedDirs.has(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (excludedExts.has(ext)) {
            continue;
          }

          try {
            const stats = await fs.stat(fullPath);
            if (stats.size > maxFileSize) {
              continue; // Exclude individual files exceeding maximum single-file size
            }

            results.push({
              absolutePath: fullPath,
              relativePath: path.relative(rootNormalized, fullPath).replace(/\\/g, '/'),
              sizeBytes: stats.size,
            });
          } catch {
            // Ignore unreadable files
          }
        }
      }
    }

    await walk(rootNormalized);
    return results;
  }
}
