import { v4 as uuidv4 } from 'uuid';
import {
  ProjectMetadata,
  ProjectImportResponse,
  FileMetadata,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '@rex/shared';
import { StorageService } from './storage.service.js';
import { DatabaseQueries } from '../database/queries/index.js';
import { checkDatabaseHealth } from '../database/connection.js';

// Fallback in-memory cache for development without running PostgreSQL instance
const inMemoryProjects = new Map<string, ProjectMetadata>();
const inMemoryFiles = new Map<string, FileMetadata[]>();

export class ProjectService {
  public static async createProject(
    name: string,
    description?: string,
    repositoryUrl?: string
  ): Promise<ProjectMetadata> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const project: ProjectMetadata = {
      id,
      name,
      description,
      repositoryUrl,
      createdAt: now,
      updatedAt: now,
    };

    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.connected) {
      await DatabaseQueries.insertProject(project);
    } else {
      inMemoryProjects.set(id, project);
    }

    return project;
  }

  public static async importArchive(
    name: string,
    zipFilePath: string,
    description?: string
  ): Promise<ProjectImportResponse> {
    const projectId = uuidv4();
    const projectDir = StorageService.getProjectDir(projectId);

    // 1. Extract zip with security protections
    const extractionResult = await StorageService.extractZipArchive(zipFilePath, projectDir);

    // 2. Scan files
    const files = await StorageService.scanProjectFiles(projectId, projectDir);

    // 3. Compute language stats
    const langCounts: Partial<Record<SupportedLanguage, number>> = {};
    for (const file of files) {
      langCounts[file.language] = (langCounts[file.language] ?? 0) + 1;
    }

    const detectedLanguages = Object.entries(langCounts).map(([lang, count]) => ({
      language: lang as SupportedLanguage,
      fileCount: count,
      percentage: files.length > 0 ? Math.round((count / files.length) * 100) : 0,
    }));

    const now = new Date().toISOString();
    const project: ProjectMetadata = {
      id: projectId,
      name,
      description,
      rootPath: projectDir,
      createdAt: now,
      updatedAt: now,
    };

    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.connected) {
      await DatabaseQueries.insertProject(project);
      await DatabaseQueries.insertProjectFiles(files);
    } else {
      inMemoryProjects.set(projectId, project);
      inMemoryFiles.set(projectId, files);
    }

    return {
      projectId,
      name,
      importedFilesCount: files.length,
      totalSizeBytes: extractionResult.totalSizeBytes,
      detectedLanguages,
      importedAt: now,
    };
  }

  public static async listProjects(): Promise<ProjectMetadata[]> {
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.connected) {
      return DatabaseQueries.getProjects();
    }
    return Array.from(inMemoryProjects.values());
  }

  public static async getProjectById(projectId: string): Promise<ProjectMetadata | null> {
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.connected) {
      return DatabaseQueries.getProjectById(projectId);
    }
    return inMemoryProjects.get(projectId) ?? null;
  }

  public static async getProjectFiles(projectId: string): Promise<FileMetadata[]> {
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.connected) {
      return DatabaseQueries.getFilesByProjectId(projectId);
    }
    return inMemoryFiles.get(projectId) ?? [];
  }
}
