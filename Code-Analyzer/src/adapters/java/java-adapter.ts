import { SUPPORTED_LANGUAGES } from '@rex/shared';
import { BaseLanguageAdapter } from '../base-adapter.js';

export class JavaAdapter extends BaseLanguageAdapter {
  constructor() {
    super({
      id: SUPPORTED_LANGUAGES.JAVA,
      displayName: 'Java Analyzer',
      fileExtensions: ['.java'],
      functionPattern: /(?:public|protected|private|static|\s)+[\w<>\[\]]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{/,
      classPattern: /(?:public\s+)?(?:abstract\s+)?(?:final\s+)?class\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
      importPattern: /^import\s+(?:static\s+)?([a-zA-Z0-9_.]+);/,
      singleLineComment: '//',
    });
  }
}
