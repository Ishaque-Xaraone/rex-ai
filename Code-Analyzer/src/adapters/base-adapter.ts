import {
  CodeSymbol,
  DependencyEdge,
  Finding,
  SYMBOL_KIND,
  FINDING_SEVERITY,
  SupportedLanguage,
  LineReference,
} from '@rex/shared';
import {
  LanguageAdapter,
  FileAnalysisContext,
  FileAnalysisResult,
  FileMetrics,
} from '../core/analyzer-interface.js';

export interface AdapterConfig {
  id: SupportedLanguage;
  displayName: string;
  fileExtensions: readonly string[];
  functionPattern?: RegExp;
  classPattern?: RegExp;
  importPattern?: RegExp;
  singleLineComment: string;
}

export class BaseLanguageAdapter implements LanguageAdapter {
  public readonly id: SupportedLanguage;
  public readonly displayName: string;
  public readonly fileExtensions: readonly string[];
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
    this.id = config.id;
    this.displayName = config.displayName;
    this.fileExtensions = config.fileExtensions;
  }

  public canHandle(filePath: string): boolean {
    const lower = filePath.toLowerCase();
    return this.fileExtensions.some((ext) => lower.endsWith(ext));
  }

  public async analyzeFile(context: FileAnalysisContext): Promise<FileAnalysisResult> {
    const symbols: CodeSymbol[] = [];
    const dependencies: DependencyEdge[] = [];
    const findings: Finding[] = [];
    const lines = context.content.split(/\r?\n/);

    let symbolSeq = 0;
    let depSeq = 0;
    let findingSeq = 0;
    let commentLines = 0;
    let blankLines = 0;
    let codeLines = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();
      const lineNum = i + 1;

      if (!trimmed) {
        blankLines++;
        continue;
      }

      if (trimmed.startsWith(this.config.singleLineComment)) {
        commentLines++;
        continue;
      }

      codeLines++;

      const lineRef: LineReference = {
        startLine: lineNum,
        endLine: lineNum,
        startColumn: 1,
        endColumn: line.length + 1,
      };

      // Class matching
      if (this.config.classPattern) {
        const match = this.config.classPattern.exec(trimmed);
        if (match && match[1]) {
          symbols.push({
            id: `${context.fileId}-sym-${++symbolSeq}`,
            projectId: context.projectId,
            fileId: context.fileId,
            name: match[1],
            kind: SYMBOL_KIND.CLASS,
            isExported: true,
            lineReference: lineRef,
          });
          continue;
        }
      }

      // Function matching
      if (this.config.functionPattern) {
        const match = this.config.functionPattern.exec(trimmed);
        if (match && match[1]) {
          symbols.push({
            id: `${context.fileId}-sym-${++symbolSeq}`,
            projectId: context.projectId,
            fileId: context.fileId,
            name: match[1],
            kind: SYMBOL_KIND.FUNCTION,
            isExported: true,
            lineReference: lineRef,
          });
          continue;
        }
      }

      // Import matching
      if (this.config.importPattern) {
        const match = this.config.importPattern.exec(trimmed);
        if (match && match[1]) {
          const specifier = match[1].replace(/['";]/g, '').trim();
          dependencies.push({
            id: `${context.analysisId}-${context.fileId}-dep-${++depSeq}`,
            projectId: context.projectId,
            analysisId: context.analysisId,
            sourceId: context.fileId,
            sourcePath: context.relativePath,
            targetId: specifier,
            targetPath: specifier,
            edgeType: 'import',
            specifier,
            isExternal: true,
            lineReference: lineRef,
          });
        }
      }
    }

    const metrics: FileMetrics = {
      linesOfCode: codeLines,
      commentLines,
      blankLines,
    };

    return {
      symbols,
      dependencies,
      findings,
      metrics,
    };
  }
}
