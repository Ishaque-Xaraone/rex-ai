import {
  CodeSymbol,
  DependencyEdge,
  Finding,
  SupportedLanguage,
  AnalysisSummary,
  AnalysisResult,
  LineReference,
} from '@rex/shared';

export interface FileAnalysisContext {
  filePath: string;
  relativePath: string;
  content: string;
  projectId: string;
  analysisId: string;
  fileId: string;
}

export interface FileMetrics {
  linesOfCode: number;
  commentLines: number;
  blankLines: number;
  cyclomaticComplexity?: number;
}

export interface FileAnalysisResult {
  symbols: CodeSymbol[];
  dependencies: DependencyEdge[];
  findings: Finding[];
  metrics: FileMetrics;
}

export interface LanguageAdapter {
  readonly id: SupportedLanguage;
  readonly displayName: string;
  readonly fileExtensions: readonly string[];
  canHandle(filePath: string): boolean;
  analyzeFile(context: FileAnalysisContext): Promise<FileAnalysisResult>;
}

export interface AnalyzerOptions {
  projectId?: string;
  analysisId?: string;
  maxFiles?: number;
  excludedDirectories?: readonly string[];
  excludedExtensions?: readonly string[];
  includeExternalDependencies?: boolean;
  rulesConfig?: Record<string, boolean>;
}

export interface NormalizedAnalysisOutput {
  summary: AnalysisSummary;
  symbols: CodeSymbol[];
  dependencies: DependencyEdge[];
  findings: Finding[];
}
