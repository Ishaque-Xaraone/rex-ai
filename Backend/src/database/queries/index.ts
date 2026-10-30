import { query, getPool } from '../connection.js';
import {
  ProjectMetadata,
  FileMetadata,
  AnalysisJob,
  CodeSymbol,
  DependencyEdge,
  Finding,
  AnalysisResult,
  AnalysisSummary,
} from '@rex/shared';

export class DatabaseQueries {
  // Projects
  public static async insertProject(project: ProjectMetadata): Promise<void> {
    await query(
      `INSERT INTO projects (id, name, description, repository_url, default_branch, root_path, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        project.id,
        project.name,
        project.description ?? null,
        project.repositoryUrl ?? null,
        project.defaultBranch ?? null,
        project.rootPath ?? null,
        project.createdAt,
        project.updatedAt,
      ]
    );
  }

  public static async getProjects(): Promise<ProjectMetadata[]> {
    const { rows } = await query<ProjectMetadata>(
      `SELECT id, name, description, repository_url as "repositoryUrl",
              default_branch as "defaultBranch", root_path as "rootPath",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM projects ORDER BY created_at DESC`
    );
    return rows;
  }

  public static async getProjectById(id: string): Promise<ProjectMetadata | null> {
    const { rows } = await query<ProjectMetadata>(
      `SELECT id, name, description, repository_url as "repositoryUrl",
              default_branch as "defaultBranch", root_path as "rootPath",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM projects WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  // Project Files
  public static async insertProjectFiles(files: FileMetadata[]): Promise<void> {
    if (files.length === 0) return;
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const f of files) {
        await client.query(
          `INSERT INTO project_files (id, project_id, relative_path, language, size_bytes, line_count, sha256_hash, is_excluded, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (project_id, relative_path) DO UPDATE SET
             id = EXCLUDED.id,
             language = EXCLUDED.language,
             size_bytes = EXCLUDED.size_bytes,
             line_count = EXCLUDED.line_count,
             sha256_hash = EXCLUDED.sha256_hash`,
          [f.id, f.projectId, f.relativePath, f.language, f.sizeBytes, f.lineCount, f.sha256Hash, f.isExcluded, f.createdAt]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public static async getFilesByProjectId(projectId: string): Promise<FileMetadata[]> {
    const { rows } = await query<FileMetadata>(
      `SELECT id, project_id as "projectId", relative_path as "relativePath",
              language, size_bytes as "sizeBytes", line_count as "lineCount",
              sha256_hash as "sha256Hash", is_excluded as "isExcluded", created_at as "createdAt"
       FROM project_files WHERE project_id = $1 ORDER BY relative_path ASC`,
      [projectId]
    );
    return rows;
  }

  // Analysis Jobs
  public static async createAnalysisJob(job: AnalysisJob): Promise<void> {
    await query(
      `INSERT INTO analysis_jobs (id, project_id, status, progress_percent, current_phase, started_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [job.id, job.projectId, job.status, job.progressPercent, job.currentPhase ?? null, job.startedAt ?? new Date().toISOString()]
    );
  }

  public static async updateAnalysisJob(job: Partial<AnalysisJob> & { id: string }): Promise<void> {
    await query(
      `UPDATE analysis_jobs SET
         status = COALESCE($2, status),
         progress_percent = COALESCE($3, progress_percent),
         current_phase = COALESCE($4, current_phase),
         completed_at = COALESCE($5, completed_at),
         error_message = COALESCE($6, error_message),
         limitations = COALESCE($7, limitations)
       WHERE id = $1`,
      [
        job.id,
        job.status ?? null,
        job.progressPercent ?? null,
        job.currentPhase ?? null,
        job.completedAt ?? null,
        job.errorMessage ?? null,
        job.limitations ? JSON.stringify(job.limitations) : null,
      ]
    );
  }

  public static async getAnalysisJob(id: string): Promise<AnalysisJob | null> {
    const { rows } = await query<AnalysisJob & { summary?: AnalysisSummary }>(
      `SELECT aj.id, aj.project_id as "projectId", aj.status, aj.progress_percent as "progressPercent",
              aj.current_phase as "currentPhase", aj.started_at as "startedAt",
              aj.completed_at as "completedAt", aj.error_message as "errorMessage",
              aj.limitations, ar.summary
       FROM analysis_jobs aj
       LEFT JOIN analysis_results ar ON ar.job_id = aj.id
       WHERE aj.id = $1`,
      [id]
    );

    const job = rows[0];
    if (!job) return null;

    return {
      id: job.id,
      projectId: job.projectId,
      status: job.status,
      progressPercent: job.progressPercent,
      currentPhase: job.currentPhase,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      limitations: job.limitations,
      summary: job.summary,
    };
  }

  public static async getLatestAnalysisJobByProject(projectId: string): Promise<AnalysisJob | null> {
    const { rows } = await query<AnalysisJob & { summary?: AnalysisSummary }>(
      `SELECT aj.id, aj.project_id as "projectId", aj.status, aj.progress_percent as "progressPercent",
              aj.current_phase as "currentPhase", aj.started_at as "startedAt",
              aj.completed_at as "completedAt", aj.error_message as "errorMessage",
              aj.limitations, ar.summary
       FROM analysis_jobs aj
       LEFT JOIN analysis_results ar ON ar.job_id = aj.id
       WHERE aj.project_id = $1
       ORDER BY aj.created_at DESC
       LIMIT 1`,
      [projectId]
    );

    const job = rows[0];
    if (!job) return null;

    return {
      id: job.id,
      projectId: job.projectId,
      status: job.status,
      progressPercent: job.progressPercent,
      currentPhase: job.currentPhase,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      limitations: job.limitations,
      summary: job.summary,
    };
  }

  // Save Complete Analysis Result (Atomic Transaction)
  public static async saveAnalysisResult(result: AnalysisResult): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Upsert analysis_results
      await client.query(
        `INSERT INTO analysis_results (id, job_id, project_id, summary, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET summary = EXCLUDED.summary`,
        [
          `res-${result.job.id}`,
          result.job.id,
          result.job.projectId,
          JSON.stringify(result.summary),
        ]
      );

      // 2. Cleanly replace symbols for this project to ensure no stale symbols remain
      await client.query(`DELETE FROM symbols WHERE project_id = $1`, [result.job.projectId]);
      for (const sym of result.symbols) {
        await client.query(
          `INSERT INTO symbols (id, project_id, file_id, name, kind, scope, signature, return_type, is_exported, is_async, line_reference, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             kind = EXCLUDED.kind,
             scope = EXCLUDED.scope,
             signature = EXCLUDED.signature,
             return_type = EXCLUDED.return_type,
             is_exported = EXCLUDED.is_exported,
             is_async = EXCLUDED.is_async,
             line_reference = EXCLUDED.line_reference`,
          [
            sym.id,
            sym.projectId,
            sym.fileId,
            sym.name,
            sym.kind,
            sym.scope ?? null,
            sym.signature ?? null,
            sym.returnType ?? null,
            sym.isExported,
            sym.isAsync ?? false,
            JSON.stringify(sym.lineReference),
          ]
        );
      }

      // 3. Cleanly replace dependencies for this analysis_id
      await client.query(`DELETE FROM dependencies WHERE analysis_id = $1`, [result.job.id]);
      for (const dep of result.dependencies) {
        await client.query(
          `INSERT INTO dependencies (id, project_id, analysis_id, source_id, source_path, target_id, target_path, edge_type, specifier, is_external, line_reference, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
           ON CONFLICT (id) DO UPDATE SET
             target_id = EXCLUDED.target_id,
             target_path = EXCLUDED.target_path,
             edge_type = EXCLUDED.edge_type,
             specifier = EXCLUDED.specifier,
             is_external = EXCLUDED.is_external`,
          [
            dep.id,
            dep.projectId,
            dep.analysisId,
            dep.sourceId,
            dep.sourcePath,
            dep.targetId,
            dep.targetPath,
            dep.edgeType,
            dep.specifier ?? null,
            dep.isExternal,
            dep.lineReference ? JSON.stringify(dep.lineReference) : null,
          ]
        );
      }

      // 4. Cleanly replace findings for this analysis_id
      await client.query(`DELETE FROM findings WHERE analysis_id = $1`, [result.job.id]);
      for (const f of result.findings) {
        await client.query(
          `INSERT INTO findings (id, project_id, analysis_id, rule_id, rule_title, severity, category, description, evidence, remediation, confidence_score, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
           ON CONFLICT (id) DO UPDATE SET
             rule_title = EXCLUDED.rule_title,
             severity = EXCLUDED.severity,
             category = EXCLUDED.category,
             description = EXCLUDED.description,
             evidence = EXCLUDED.evidence,
             remediation = EXCLUDED.remediation,
             confidence_score = EXCLUDED.confidence_score`,
          [
            f.id,
            f.projectId,
            f.analysisId,
            f.ruleId,
            f.ruleTitle,
            f.severity,
            f.category,
            f.description,
            JSON.stringify(f.evidence),
            f.remediation ?? null,
            f.confidenceScore,
            f.metadata ? JSON.stringify(f.metadata) : null,
          ]
        );
      }

      // 5. Update job status to completed/partial in the exact same transaction
      await client.query(
        `UPDATE analysis_jobs SET
           status = $2,
           progress_percent = 100,
           current_phase = 'Completed',
           completed_at = $3,
           limitations = $4
         WHERE id = $1`,
        [
          result.job.id,
          result.job.status,
          new Date().toISOString(),
          result.job.limitations ? JSON.stringify(result.job.limitations) : null,
        ]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Get Dependencies for Graph
  public static async getDependencies(analysisId: string): Promise<DependencyEdge[]> {
    const { rows } = await query<DependencyEdge>(
      `SELECT id, project_id as "projectId", analysis_id as "analysisId",
              source_id as "sourceId", source_path as "sourcePath",
              target_id as "targetId", target_path as "targetPath",
              edge_type as "edgeType", specifier, is_external as "isExternal",
              line_reference as "lineReference"
       FROM dependencies WHERE analysis_id = $1`,
      [analysisId]
    );
    return rows;
  }

  // Get Findings
  public static async getFindings(analysisId: string, severity?: string): Promise<Finding[]> {
    let sql = `SELECT id, project_id as "projectId", analysis_id as "analysisId",
                      rule_id as "ruleId", rule_title as "ruleTitle", severity,
                      category, description, evidence, remediation,
                      confidence_score as "confidenceScore", metadata, created_at as "createdAt"
               FROM findings WHERE analysis_id = $1`;
    const params: unknown[] = [analysisId];

    if (severity) {
      sql += ` AND severity = $2`;
      params.push(severity);
    }

    sql += ` ORDER BY created_at DESC`;

    const { rows } = await query<Finding>(sql, params);
    return rows;
  }

  // Get Symbols
  public static async getSymbolsByProjectId(projectId: string): Promise<CodeSymbol[]> {
    const { rows } = await query<CodeSymbol>(
      `SELECT id, project_id as "projectId", file_id as "fileId", name, kind,
              scope, signature, return_type as "returnType", is_exported as "isExported",
              is_async as "isAsync", line_reference as "lineReference", documentation
       FROM symbols WHERE project_id = $1 ORDER BY name ASC`,
      [projectId]
    );
    return rows;
  }
}
