import {
  AnalysisStatus,
  FindingSeverity,
  SymbolKind,
  SupportedLanguage,
} from '../constants/index.js';

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  rootPath?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ProjectImportRequest {
  name: string;
  description?: string;
  sourceType: 'archive_upload' | 'local_path' | 'git_repository';
  sourceReference?: string;
}

export interface ProjectImportResponse {
  projectId: string;
  name: string;
  importedFilesCount: number;
  totalSizeBytes: number;
  detectedLanguages: Array<{
    language: SupportedLanguage;
    fileCount: number;
    percentage: number;
  }>;
  warnings?: string[];
  importedAt: string; // ISO 8601
}

export interface FileMetadata {
  id: string;
  projectId: string;
  relativePath: string;
  language: SupportedLanguage;
  sizeBytes: number;
  lineCount: number;
  sha256Hash: string;
  isExcluded: boolean;
  createdAt: string; // ISO 8601
}

export interface LineReference {
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}

export interface SourceEvidence {
  fileId: string;
  filePath: string;
  lineReference: LineReference;
  snippet: string;
  contextBefore?: string[];
  contextAfter?: string[];
}

export interface CodeSymbol {
  id: string;
  projectId: string;
  fileId: string;
  name: string;
  kind: SymbolKind;
  scope?: string;
  signature?: string;
  returnType?: string;
  isExported: boolean;
  isAsync?: boolean;
  visibility?: 'public' | 'private' | 'protected';
  lineReference: LineReference;
  documentation?: string;
}

export interface DependencyEdge {
  id: string;
  projectId: string;
  analysisId: string;
  sourceId: string; // fileId or symbolId
  sourcePath: string;
  targetId: string; // fileId or module name or symbolId
  targetPath: string;
  edgeType: 'import' | 'call' | 'inheritance' | 'type_usage';
  specifier?: string; // e.g. import { foo } from './bar'
  isExternal: boolean;
  lineReference?: LineReference;
}

export interface Finding {
  id: string;
  projectId: string;
  analysisId: string;
  ruleId: string;
  ruleTitle: string;
  severity: FindingSeverity;
  category: 'security' | 'architecture' | 'reverse_engineering' | 'code_quality' | 'obfuscation';
  description: string;
  evidence: SourceEvidence;
  remediation?: string;
  confidenceScore: number; // 0.0 to 1.0
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO 8601
}

export interface AnalysisSummary {
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  totalLinesOfCode: number;
  symbolsCount: number;
  dependenciesCount: number;
  findingsCount: Record<FindingSeverity, number>;
  primaryLanguage: SupportedLanguage;
  languageDistribution: Record<SupportedLanguage, number>;
  durationMs: number;
  limitations?: string[]; // Distinguishes partial analysis limitations
}

export interface AnalysisJob {
  id: string;
  projectId: string;
  status: AnalysisStatus;
  progressPercent: number;
  currentPhase?: string;
  startedAt?: string; // ISO 8601
  completedAt?: string; // ISO 8601
  errorMessage?: string;
  limitations?: string[];
  summary?: AnalysisSummary;
}

export interface AnalysisResult {
  job: AnalysisJob;
  symbols: CodeSymbol[];
  dependencies: DependencyEdge[];
  findings: Finding[];
  summary: AnalysisSummary;
}

export interface PdfReportMetadata {
  reportId: string;
  analysisId: string;
  projectId: string;
  projectName: string;
  generatedAt: string; // ISO 8601
  status: 'pending' | 'generated' | 'failed';
  fileSizeBytes?: number;
  downloadUrl?: string;
  checksumSha256?: string;
  executiveSummary: string;
  totalFindings: number;
  findingsBySeverity: Record<FindingSeverity, number>;
}
