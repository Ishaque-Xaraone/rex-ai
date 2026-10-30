import {
  ProjectMetadata,
  ProjectImportResponse,
  FileMetadata,
  AnalysisJob,
  Finding,
  PdfReportMetadata,
} from '@rex/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiClient {
  public static async getHealth(): Promise<{ status: string; uptimeSeconds: number; services: Record<string, unknown> }> {
    const res = await fetch(`${API_BASE}/health`);
    const json = await res.json();
    return json;
  }

  public static async listProjects(): Promise<ProjectMetadata[]> {
    const res = await fetch(`${API_BASE}/projects`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch projects');
    return json.data || [];
  }

  public static async getProject(projectId: string): Promise<ProjectMetadata> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || `Project ${projectId} not found`);
    return json.data;
  }

  public static async getProjectFiles(projectId: string): Promise<FileMetadata[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/files`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch project files');
    return json.data || [];
  }

  public static async importProject(formData: FormData): Promise<ProjectImportResponse> {
    const res = await fetch(`${API_BASE}/projects/import`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to import project');
    return json.data;
  }

  public static async triggerAnalysis(projectId: string): Promise<AnalysisJob> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/analyze`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to trigger analysis');
    return json.data;
  }

  public static async getAnalysisJob(analysisId: string): Promise<AnalysisJob> {
    const res = await fetch(`${API_BASE}/analysis/${analysisId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || `Analysis job ${analysisId} not found`);
    return json.data;
  }

  public static async getAnalysisGraph(analysisId: string): Promise<{
    nodes: Array<{ id: string; label: string; type: string; position?: { x: number; y: number } }>;
    edges: Array<{ id: string; source: string; target: string; label?: string; type?: string }>;
  }> {
    const res = await fetch(`${API_BASE}/analysis/${analysisId}/graph`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to load dependency graph');
    return json.data || { nodes: [], edges: [] };
  }

  public static async getAnalysisFindings(
    analysisId: string,
    severity?: string
  ): Promise<Finding[]> {
    const query = severity ? `?severity=${encodeURIComponent(severity)}` : '';
    const res = await fetch(`${API_BASE}/analysis/${analysisId}/findings${query}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to load findings');
    return json.data || [];
  }

  public static async getAnalysisReport(analysisId: string): Promise<PdfReportMetadata> {
    const res = await fetch(`${API_BASE}/analysis/${analysisId}/report`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to load report');
    return json.data;
  }
}
