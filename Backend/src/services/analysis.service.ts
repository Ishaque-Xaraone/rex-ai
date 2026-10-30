import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisJob,
  AnalysisResult,
  ANALYSIS_STATUS,
  DependencyEdge,
  Finding,
  PdfReportMetadata,
  FINDING_SEVERITY,
  FindingSeverity,
} from '@rex/shared';
import { RexCodeAnalyzer } from '@rex/code-analyzer';
import { ProjectService } from './project.service.js';
import { StorageService } from './storage.service.js';
import { DatabaseQueries } from '../database/queries/index.js';
import { checkDatabaseHealth } from '../database/connection.js';

// Fallback in-memory storage for jobs, results, findings, and dependencies
const inMemoryJobs = new Map<string, AnalysisJob>();
const inMemoryResults = new Map<string, AnalysisResult>();

export class AnalysisService {
  private static analyzer = new RexCodeAnalyzer();

  public static async triggerAnalysis(projectId: string): Promise<AnalysisJob> {
    const project = await ProjectService.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project not found with id: ${projectId}`);
    }

    if (!project.rootPath) {
      throw new Error('Project has no source files to analyze. Please upload a project archive first.');
    }

    try {
      await fs.access(project.rootPath);
    } catch {
      throw new Error(`Project directory does not exist on disk: ${project.rootPath}`);
    }

    const analysisId = uuidv4();
    const startedAt = new Date().toISOString();

    const job: AnalysisJob = {
      id: analysisId,
      projectId,
      status: ANALYSIS_STATUS.RUNNING,
      progressPercent: 15,
      currentPhase: 'Scanning files and initializing static analysis pipeline',
      startedAt,
    };

    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.connected) {
      // Ensure all project files are indexed in project_files before running analysis
      const files = await StorageService.scanProjectFiles(projectId, project.rootPath);
      await DatabaseQueries.insertProjectFiles(files);
      await DatabaseQueries.createAnalysisJob(job);
    } else {
      inMemoryJobs.set(analysisId, job);
    }

    // Execute analysis pipeline asynchronously (job returned immediately to caller)
    this.runAnalysisPipeline(analysisId, project.rootPath, projectId).catch((err) => {
      console.error(`[Analysis Pipeline] Failure in job ${analysisId}:`, err);
    });

    return job;
  }

  private static async runAnalysisPipeline(
    analysisId: string,
    targetDir: string,
    projectId: string
  ): Promise<void> {
    try {
      const result = await this.analyzer.analyzeDirectory(targetDir, {
        projectId,
        analysisId,
      });

      const dbHealth = await checkDatabaseHealth();
      if (dbHealth.connected) {
        // Atomic transaction: persists summary, symbols, dependencies, findings and sets status = completed/partial
        await DatabaseQueries.saveAnalysisResult(result);
      } else {
        inMemoryJobs.set(analysisId, {
          ...result.job,
          summary: result.summary,
        });
        inMemoryResults.set(analysisId, result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown analysis error';
      console.error(`[Analysis Pipeline] Error running analysis for ${analysisId}:`, errorMessage);

      const failedJob: AnalysisJob = {
        id: analysisId,
        projectId,
        status: ANALYSIS_STATUS.FAILED,
        progressPercent: 100,
        currentPhase: 'Failed',
        completedAt: new Date().toISOString(),
        errorMessage,
      };

      const dbHealth = await checkDatabaseHealth();
      if (dbHealth.connected) {
        await DatabaseQueries.updateAnalysisJob(failedJob);
      } else {
        inMemoryJobs.set(analysisId, failedJob);
      }
    }
  }

  public static async getAnalysisJob(analysisId: string): Promise<AnalysisJob | null> {
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.connected) {
      return DatabaseQueries.getAnalysisJob(analysisId);
    }
    return inMemoryJobs.get(analysisId) ?? null;
  }

  public static async getGraphData(analysisId: string): Promise<{
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      position: { x: number; y: number };
      data?: Record<string, unknown>;
    }>;
    edges: Array<{ id: string; source: string; target: string; label?: string; type?: string }>;
  }> {
    const dbHealth = await checkDatabaseHealth();
    let dependencies: DependencyEdge[] = [];

    if (dbHealth.connected) {
      dependencies = await DatabaseQueries.getDependencies(analysisId);
    } else {
      const result = inMemoryResults.get(analysisId);
      dependencies = result?.dependencies ?? [];
    }

    const nodeMap = new Map<string, { id: string; label: string; type: string }>();

    for (const dep of dependencies) {
      if (!nodeMap.has(dep.sourcePath)) {
        nodeMap.set(dep.sourcePath, {
          id: dep.sourcePath,
          label: dep.sourcePath,
          type: 'internalModule',
        });
      }
      if (!nodeMap.has(dep.targetPath)) {
        nodeMap.set(dep.targetPath, {
          id: dep.targetPath,
          label: dep.targetPath,
          type: dep.isExternal ? 'externalPackage' : 'internalModule',
        });
      }
    }

    const nodeList = Array.from(nodeMap.values()).map((node, index) => {
      // Calculate a readable grid layout for React Flow nodes
      const col = index % 3;
      const row = Math.floor(index / 3);
      return {
        ...node,
        position: { x: col * 300 + 50, y: row * 180 + 50 },
        data: { label: node.label, type: node.type },
      };
    });

    const edges = dependencies.map((dep, idx) => ({
      id: dep.id || `edge-${idx}`,
      source: dep.sourcePath,
      target: dep.targetPath,
      label: dep.edgeType === 'import' ? dep.specifier || 'imports' : dep.edgeType,
      type: 'smoothstep',
    }));

    return {
      nodes: nodeList,
      edges,
    };
  }

  public static async getFindings(
    analysisId: string,
    severity?: string
  ): Promise<Finding[]> {
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.connected) {
      return DatabaseQueries.getFindings(analysisId, severity);
    }

    const result = inMemoryResults.get(analysisId);
    if (!result) return [];

    if (severity) {
      return result.findings.filter((f) => f.severity === severity);
    }
    return result.findings;
  }

  public static async getReport(analysisId: string): Promise<PdfReportMetadata> {
    const job = await this.getAnalysisJob(analysisId);
    if (!job) {
      throw new Error(`Analysis job not found: ${analysisId}`);
    }

    const project = await ProjectService.getProjectById(job.projectId);
    const findings = await this.getFindings(analysisId);

    const severityCounts: Record<FindingSeverity, number> = {
      [FINDING_SEVERITY.CRITICAL]: 0,
      [FINDING_SEVERITY.HIGH]: 0,
      [FINDING_SEVERITY.MEDIUM]: 0,
      [FINDING_SEVERITY.LOW]: 0,
      [FINDING_SEVERITY.INFO]: 0,
    };

    for (const f of findings) {
      severityCounts[f.severity] = (severityCounts[f.severity] ?? 0) + 1;
    }

    const durationSec = job.summary?.durationMs ? (job.summary.durationMs / 1000).toFixed(1) : '1.2';
    const totalLines = job.summary?.totalLinesOfCode ?? 0;
    const totalFiles = job.summary?.totalFiles ?? 0;

    return {
      reportId: `report-${analysisId}`,
      analysisId,
      projectId: job.projectId,
      projectName: project?.name ?? 'Unknown Project',
      generatedAt: new Date().toISOString(),
      status: job.status === 'completed' || job.status === 'partial' ? 'generated' : 'pending',
      executiveSummary: `Static analysis audit for '${project?.name ?? job.projectId}': Analyzed ${totalFiles} files (${totalLines} lines of code) in ${durationSec}s. Identified ${findings.length} findings (${severityCounts.critical} critical, ${severityCounts.high} high, ${severityCounts.medium} medium, ${severityCounts.low} low).`,
      totalFindings: findings.length,
      findingsBySeverity: severityCounts,
    };
  }
}
