import { SUPPORTED_LANGUAGES } from '@rex/shared';
import { BaseLanguageAdapter } from '../base-adapter.js';

export class CSharpAdapter extends BaseLanguageAdapter {
  constructor() {
    super({
      id: SUPPORTED_LANGUAGES.CSHARP,
      displayName: 'C# Analyzer',
      fileExtensions: ['.cs'],
      functionPattern: /(?:public|protected|internal|private|static|async|\s)+[\w<>\[\]?]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)/,
      classPattern: /(?:public|internal|private|\s)*(?:static|abstract|sealed|\s)*class\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
      importPattern: /^using\s+(?:static\s+)?([a-zA-Z0-9_.]+);/,
      singleLineComment: '//',
    });
  }
}
