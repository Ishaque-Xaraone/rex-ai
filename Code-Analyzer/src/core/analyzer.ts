import { AnalysisResult } from '@rex/shared';
import { AnalyzerOptions, LanguageAdapter } from './analyzer-interface.js';
import { AnalysisPipeline } from './pipeline.js';

export class RexCodeAnalyzer {
  private readonly pipeline: AnalysisPipeline;

  constructor() {
    this.pipeline = new AnalysisPipeline();
  }

  public registerAdapter(adapter: LanguageAdapter): void {
    this.pipeline.registerAdapter(adapter);
  }

  public async analyzeDirectory(rootDir: string, options?: AnalyzerOptions): Promise<AnalysisResult> {
    return this.pipeline.run(rootDir, options);
  }
}
