import fs from 'node:fs/promises';
import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service.js';
import { AnalysisService } from '../services/analysis.service.js';

export class ProjectController {
  public static async importProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const name = req.body.name || (req.file ? req.file.originalname.replace(/\.[^/.]+$/, '') : 'Imported Project');
      const description = req.body.description;

      if (req.file) {
        // Zip archive upload
        const response = await ProjectService.importArchive(name, req.file.path, description);
        res.status(201).json({ success: true, data: response });
        return;
      }

      // Metadata only or local project initialization
      const project = await ProjectService.createProject(name, description, req.body.repositoryUrl);
      res.status(201).json({
        success: true,
        data: {
          projectId: project.id,
          name: project.name,
          importedFilesCount: 0,
          totalSizeBytes: 0,
          detectedLanguages: [],
          importedAt: project.createdAt,
        },
      });
    } catch (err) {
      next(err);
    } finally {
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch {
          // Ignore cleanup error
        }
      }
    }
  }

  public static async listProjects(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const projects = await ProjectService.listProjects();
      res.json({ success: true, data: projects });
    } catch (err) {
      next(err);
    }
  }

  public static async getProjectById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const project = await ProjectService.getProjectById(projectId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Project ${projectId} not found` },
        });
        return;
      }

      res.json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  }

  public static async getProjectFiles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const files = await ProjectService.getProjectFiles(projectId);
      res.json({ success: true, data: files });
    } catch (err) {
      next(err);
    }
  }

  public static async triggerAnalysis(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const job = await AnalysisService.triggerAnalysis(projectId);
      res.status(202).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }
}
