import { z } from 'zod';
import {
  ANALYSIS_STATUS,
  FINDING_SEVERITY,
  SYMBOL_KIND,
  SUPPORTED_LANGUAGES,
} from '../constants/index.js';

export const AnalysisStatusSchema = z.enum([
  ANALYSIS_STATUS.QUEUED,
  ANALYSIS_STATUS.RUNNING,
  ANALYSIS_STATUS.COMPLETED,
  ANALYSIS_STATUS.FAILED,
  ANALYSIS_STATUS.PARTIAL,
]);

export const FindingSeveritySchema = z.enum([
  FINDING_SEVERITY.CRITICAL,
  FINDING_SEVERITY.HIGH,
  FINDING_SEVERITY.MEDIUM,
  FINDING_SEVERITY.LOW,
  FINDING_SEVERITY.INFO,
]);

export const SymbolKindSchema = z.enum([
  SYMBOL_KIND.FUNCTION,
  SYMBOL_KIND.METHOD,
  SYMBOL_KIND.CLASS,
  SYMBOL_KIND.INTERFACE,
  SYMBOL_KIND.VARIABLE,
  SYMBOL_KIND.CONSTANT,
  SYMBOL_KIND.TYPE_ALIAS,
  SYMBOL_KIND.ENUM,
  SYMBOL_KIND.MODULE,
  SYMBOL_KIND.PROPERTY,
]);

export const SupportedLanguageSchema = z.enum([
  SUPPORTED_LANGUAGES.TYPESCRIPT,
  SUPPORTED_LANGUAGES.JAVASCRIPT,
  SUPPORTED_LANGUAGES.PYTHON,
  SUPPORTED_LANGUAGES.JAVA,
  SUPPORTED_LANGUAGES.CSHARP,
  SUPPORTED_LANGUAGES.CPP,
  SUPPORTED_LANGUAGES.GO,
  SUPPORTED_LANGUAGES.RUST,
  SUPPORTED_LANGUAGES.PHP,
  SUPPORTED_LANGUAGES.RUBY,
  SUPPORTED_LANGUAGES.UNKNOWN,
]);

export const LineReferenceSchema = z.object({
  startLine: z.number().int().min(1),
  endLine: z.number().int().min(1),
  startColumn: z.number().int().optional(),
  endColumn: z.number().int().optional(),
});

export const SourceEvidenceSchema = z.object({
  fileId: z.string().uuid().or(z.string().min(1)),
  filePath: z.string().min(1),
  lineReference: LineReferenceSchema,
  snippet: z.string(),
  contextBefore: z.array(z.string()).optional(),
  contextAfter: z.array(z.string()).optional(),
});

export const ProjectMetadataSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  repositoryUrl: z.string().url().optional(),
  defaultBranch: z.string().optional(),
  rootPath: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectImportRequestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  sourceType: z.enum(['archive_upload', 'local_path', 'git_repository']),
  sourceReference: z.string().optional(),
});

export const ProjectImportResponseSchema = z.object({
  projectId: z.string().uuid().or(z.string().min(1)),
  name: z.string().min(1),
  importedFilesCount: z.number().int().nonnegative(),
  totalSizeBytes: z.number().int().nonnegative(),
  detectedLanguages: z.array(
    z.object({
      language: SupportedLanguageSchema,
      fileCount: z.number().int().nonnegative(),
      percentage: z.number().min(0).max(100),
    })
  ),
  warnings: z.array(z.string()).optional(),
  importedAt: z.string().datetime(),
});

export const FileMetadataSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  projectId: z.string().uuid().or(z.string().min(1)),
  relativePath: z.string().min(1),
  language: SupportedLanguageSchema,
  sizeBytes: z.number().int().nonnegative(),
  lineCount: z.number().int().nonnegative(),
  sha256Hash: z.string().length(64),
  isExcluded: z.boolean(),
  createdAt: z.string().datetime(),
});

export const CodeSymbolSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  projectId: z.string().uuid().or(z.string().min(1)),
  fileId: z.string().uuid().or(z.string().min(1)),
  name: z.string().min(1),
  kind: SymbolKindSchema,
  scope: z.string().optional(),
  signature: z.string().optional(),
  returnType: z.string().optional(),
  isExported: z.boolean(),
  isAsync: z.boolean().optional(),
  visibility: z.enum(['public', 'private', 'protected']).optional(),
  lineReference: LineReferenceSchema,
  documentation: z.string().optional(),
});

export const DependencyEdgeSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  projectId: z.string().uuid().or(z.string().min(1)),
  analysisId: z.string().uuid().or(z.string().min(1)),
  sourceId: z.string().min(1),
  sourcePath: z.string().min(1),
  targetId: z.string().min(1),
  targetPath: z.string().min(1),
  edgeType: z.enum(['import', 'call', 'inheritance', 'type_usage']),
  specifier: z.string().optional(),
  isExternal: z.boolean(),
  lineReference: LineReferenceSchema.optional(),
});

export const FindingSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  projectId: z.string().uuid().or(z.string().min(1)),
  analysisId: z.string().uuid().or(z.string().min(1)),
  ruleId: z.string().min(1),
  ruleTitle: z.string().min(1),
  severity: FindingSeveritySchema,
  category: z.enum(['security', 'architecture', 'reverse_engineering', 'code_quality', 'obfuscation']),
  description: z.string().min(1),
  evidence: SourceEvidenceSchema,
  remediation: z.string().optional(),
  confidenceScore: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
});

export const AnalysisSummarySchema = z.object({
  totalFiles: z.number().int().nonnegative(),
  analyzedFiles: z.number().int().nonnegative(),
  skippedFiles: z.number().int().nonnegative(),
  totalLinesOfCode: z.number().int().nonnegative(),
  symbolsCount: z.number().int().nonnegative(),
  dependenciesCount: z.number().int().nonnegative(),
  findingsCount: z.record(FindingSeveritySchema, z.number().int().nonnegative()),
  primaryLanguage: SupportedLanguageSchema,
  languageDistribution: z.record(SupportedLanguageSchema, z.number().int().nonnegative()),
  durationMs: z.number().int().nonnegative(),
  limitations: z.array(z.string()).optional(),
});

export const AnalysisJobSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  projectId: z.string().uuid().or(z.string().min(1)),
  status: AnalysisStatusSchema,
  progressPercent: z.number().min(0).max(100),
  currentPhase: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  errorMessage: z.string().optional(),
  limitations: z.array(z.string()).optional(),
  summary: AnalysisSummarySchema.optional(),
});

export const AnalysisResultSchema = z.object({
  job: AnalysisJobSchema,
  symbols: z.array(CodeSymbolSchema),
  dependencies: z.array(DependencyEdgeSchema),
  findings: z.array(FindingSchema),
  summary: AnalysisSummarySchema,
});

export const PdfReportMetadataSchema = z.object({
  reportId: z.string().uuid().or(z.string().min(1)),
  analysisId: z.string().uuid().or(z.string().min(1)),
  projectId: z.string().uuid().or(z.string().min(1)),
  projectName: z.string().min(1),
  generatedAt: z.string().datetime(),
  status: z.enum(['pending', 'generated', 'failed']),
  fileSizeBytes: z.number().int().positive().optional(),
  downloadUrl: z.string().optional(),
  checksumSha256: z.string().length(64).optional(),
  executiveSummary: z.string().min(1),
  totalFindings: z.number().int().nonnegative(),
  findingsBySeverity: z.record(FindingSeveritySchema, z.number().int().nonnegative()),
});
