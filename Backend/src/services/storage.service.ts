import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import {
  FileMetadata,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '@rex/shared';
import { config } from '../config/index.js';
import { SecurityUtils, SecurityError } from '../utils/security.js';
import { LanguageDetector } from '@rex/code-analyzer';

export class StorageService {
  private static async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  public static getProjectDir(projectId: string): string {
    return SecurityUtils.assertSafeSubpath(config.storageDir, `projects/${projectId}`);
  }

  public static async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }

  public static async extractZipArchive(
    zipFilePath: string,
    targetDir: string
  ): Promise<{ fileCount: number; totalSizeBytes: number }> {
    await this.ensureDir(targetDir);

    let zip: AdmZip;
    let entries: AdmZip.IZipEntry[];

    try {
      zip = new AdmZip(zipFilePath);
      entries = zip.getEntries();
    } catch (err) {
      throw new SecurityError(`Invalid or corrupted ZIP archive: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (entries.length > config.security.maxFileCount) {
      throw new SecurityError(
        `Archive exceeds maximum allowed file count limit of ${config.security.maxFileCount} files.`
      );
    }

    let totalExpandedBytes = 0;
    let extractedFileCount = 0;

    for (const entry of entries) {
      if (entry.isDirectory) {
        continue;
      }

      // Check for ZIP Slip vulnerabilities
      if (!SecurityUtils.validateArchiveEntryName(entry.entryName)) {
        throw new SecurityError(`Unsafe archive entry path detected: ${entry.entryName}`);
      }

      totalExpandedBytes += entry.header.size;
      if (totalExpandedBytes > config.security.maxExpandedSizeBytes) {
        throw new SecurityError(
          `Archive exceeds maximum expanded uncompressed size limit of ${config.security.maxExpandedSizeBytes} bytes.`
        );
      }

      const destinationPath = SecurityUtils.assertSafeSubpath(targetDir, entry.entryName);
      await this.ensureDir(path.dirname(destinationPath));
      await fs.writeFile(destinationPath, entry.getData());
      extractedFileCount++;
    }

    return { fileCount: extractedFileCount, totalSizeBytes: totalExpandedBytes };
  }

  public static async scanProjectFiles(
    projectId: string,
    targetDir: string
  ): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    const rootNormalized = path.resolve(targetDir);

    async function walk(currentDir: string): Promise<void> {
      let entries;
      try {
        entries = await fs.readdir(currentDir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Skip standard excluded directories
          if (['node_modules', '.git', '.next', 'dist', 'build', '__pycache__', 'coverage', '.cache', 'vendor'].includes(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          const relativePath = path.relative(rootNormalized, fullPath).replace(/\\/g, '/');
          const stat = await fs.stat(fullPath);
          const ext = path.extname(entry.name).toLowerCase();

          // Skip minified or binary files
          if (['.min.js', '.min.css', '.map', '.lock', '.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar', '.gz'].some((e) => relativePath.endsWith(e))) {
            continue;
          }

          const language = LanguageDetector.detect(relativePath);

          let sha256 = '';
          try {
            sha256 = await StorageService.calculateFileHash(fullPath);
          } catch {
            sha256 = '0'.repeat(64);
          }

          let lineCount = 0;
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            lineCount = content.split(/\r?\n/).length;
          } catch {
            lineCount = 0;
          }

          const fileId = `file-${Buffer.from(relativePath).toString('base64url').slice(0, 16)}`;

          files.push({
            id: fileId,
            projectId,
            relativePath,
            language,
            sizeBytes: stat.size,
            lineCount,
            sha256Hash: sha256,
            isExcluded: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    await walk(rootNormalized);
    return files;
  }
}
