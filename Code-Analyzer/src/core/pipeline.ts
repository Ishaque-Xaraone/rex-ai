import fs from 'node:fs/promises';
import {
  CodeSymbol,
  DependencyEdge,
  Finding,
  AnalysisSummary,
  AnalysisResult,
  ANALYSIS_STATUS,
  FINDING_SEVERITY,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  FindingSeverity,
} from '@rex/shared';
import {
  LanguageAdapter,
  AnalyzerOptions,
  FileAnalysisContext,
} from './analyzer-interface.js';
import { LanguageDetector } from '../detector/language-detector.js';
import { TypeScriptAdapter } from '../adapters/typescript/typescript-adapter.js';
import { PythonAdapter } from '../adapters/python/python-adapter.js';
import { JavaAdapter } from '../adapters/java/java-adapter.js';
import { CSharpAdapter } from '../adapters/csharp/csharp-adapter.js';
import { CppAdapter } from '../adapters/cpp/cpp-adapter.js';
import { GoAdapter } from '../adapters/go/go-adapter.js';
import { RustAdapter } from '../adapters/rust/rust-adapter.js';
import { PhpAdapter } from '../adapters/php/php-adapter.js';
import { RubyAdapter } from '../adapters/ruby/ruby-adapter.js';
import { FileWalker, DiscoveredFile } from '../utils/file-walker.js';

export class AnalysisPipeline {
  private readonly adapters: LanguageAdapter[] = [];

  constructor() {
    this.registerDefaultAdapters();
  }

  public registerAdapter(adapter: LanguageAdapter): void {
    this.adapters.push(adapter);
  }

  private registerDefaultAdapters(): void {
    this.registerAdapter(new TypeScriptAdapter());
    this.registerAdapter(new PythonAdapter());
    this.registerAdapter(new JavaAdapter());
    this.registerAdapter(new CSharpAdapter());
    this.registerAdapter(new CppAdapter());
    this.registerAdapter(new GoAdapter());
    this.registerAdapter(new RustAdapter());
    this.registerAdapter(new PhpAdapter());
    this.registerAdapter(new RubyAdapter());
  }

  public getAdapterForFile(filePath: string): LanguageAdapter | undefined {
    return this.adapters.find((adapter) => adapter.canHandle(filePath));
  }

  public async run(rootDir: string, options?: AnalyzerOptions): Promise<AnalysisResult> {
    const startTime = Date.now();
    const projectId = options?.projectId ?? 'proj-default';
    const analysisId = options?.analysisId ?? `analysis-${Date.now()}`;

    const files: DiscoveredFile[] = await FileWalker.discoverFiles(rootDir, {
      excludedDirectories: options?.excludedDirectories,
      excludedExtensions: options?.excludedExtensions,
      maxFiles: options?.maxFiles,
    });

    const allSymbols: CodeSymbol[] = [];
    const allDependencies: DependencyEdge[] = [];
    const allFindings: Finding[] = [];
    const limitations: string[] = [];

    const languageDist: Record<SupportedLanguage, number> = {
      [SUPPORTED_LANGUAGES.TYPESCRIPT]: 0,
      [SUPPORTED_LANGUAGES.JAVASCRIPT]: 0,
      [SUPPORTED_LANGUAGES.PYTHON]: 0,
      [SUPPORTED_LANGUAGES.JAVA]: 0,
      [SUPPORTED_LANGUAGES.CSHARP]: 0,
      [SUPPORTED_LANGUAGES.CPP]: 0,
      [SUPPORTED_LANGUAGES.GO]: 0,
      [SUPPORTED_LANGUAGES.RUST]: 0,
      [SUPPORTED_LANGUAGES.PHP]: 0,
      [SUPPORTED_LANGUAGES.RUBY]: 0,
      [SUPPORTED_LANGUAGES.UNKNOWN]: 0,
    };

    const severityCounts: Record<FindingSeverity, number> = {
      [FINDING_SEVERITY.CRITICAL]: 0,
      [FINDING_SEVERITY.HIGH]: 0,
      [FINDING_SEVERITY.MEDIUM]: 0,
      [FINDING_SEVERITY.LOW]: 0,
      [FINDING_SEVERITY.INFO]: 0,
    };

    let analyzedFilesCount = 0;
    let skippedFilesCount = 0;
    let totalLinesOfCode = 0;

    for (const file of files) {
      const language = LanguageDetector.detect(file.relativePath);
      languageDist[language] = (languageDist[language] ?? 0) + 1;

      const adapter = this.getAdapterForFile(file.absolutePath);
      if (!adapter) {
        skippedFilesCount++;
        if (!limitations.includes(`No registered adapter for language: ${language}`)) {
          limitations.push(`No registered adapter for language: ${language}`);
        }
        continue;
      }

      let content: string;
      try {
        content = await fs.readFile(file.absolutePath, 'utf-8');
      } catch (err) {
        skippedFilesCount++;
        limitations.push(`Could not read file: ${file.relativePath}`);
        continue;
      }

      const fileId = `file-${Buffer.from(file.relativePath).toString('base64url').slice(0, 16)}`;
      const context: FileAnalysisContext = {
        filePath: file.absolutePath,
        relativePath: file.relativePath,
        content,
        projectId,
        analysisId,
        fileId,
      };

      try {
        const fileResult = await adapter.analyzeFile(context);
        analyzedFilesCount++;
        totalLinesOfCode += fileResult.metrics.linesOfCode;

        allSymbols.push(...fileResult.symbols);
        allDependencies.push(...fileResult.dependencies);
        allFindings.push(...fileResult.findings);

        for (const finding of fileResult.findings) {
          severityCounts[finding.severity] = (severityCounts[finding.severity] ?? 0) + 1;
        }
      } catch (adapterErr) {
        skippedFilesCount++;
        limitations.push(`Analysis error in ${file.relativePath}: ${adapterErr instanceof Error ? adapterErr.message : String(adapterErr)}`);
      }
    }

    // Determine primary language
    let primaryLanguage: SupportedLanguage = SUPPORTED_LANGUAGES.UNKNOWN;
    let maxCount = -1;
    for (const [lang, count] of Object.entries(languageDist)) {
      if (count > maxCount && lang !== SUPPORTED_LANGUAGES.UNKNOWN) {
        maxCount = count;
        primaryLanguage = lang as SupportedLanguage;
      }
    }

    const durationMs = Date.now() - startTime;
    const isPartial = limitations.length > 0 && analyzedFilesCount > 0;
    const isFailed = analyzedFilesCount === 0 && files.length > 0;

    const status = isFailed
      ? ANALYSIS_STATUS.FAILED
      : isPartial
        ? ANALYSIS_STATUS.PARTIAL
        : ANALYSIS_STATUS.COMPLETED;

    const summary: AnalysisSummary = {
      totalFiles: files.length,
      analyzedFiles: analyzedFilesCount,
      skippedFiles: skippedFilesCount,
      totalLinesOfCode,
      symbolsCount: allSymbols.length,
      dependenciesCount: allDependencies.length,
      findingsCount: severityCounts,
      primaryLanguage,
      languageDistribution: languageDist,
      durationMs,
      limitations: limitations.length > 0 ? limitations : undefined,
    };

    return {
      job: {
        id: analysisId,
        projectId,
        status,
        progressPercent: 100,
        completedAt: new Date().toISOString(),
        limitations: limitations.length > 0 ? limitations : undefined,
        summary,
      },
      symbols: allSymbols,
      dependencies: allDependencies,
      findings: allFindings,
      summary,
    };
  }
}
