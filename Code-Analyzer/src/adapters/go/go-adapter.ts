import { SUPPORTED_LANGUAGES } from '@rex/shared';
import { BaseLanguageAdapter } from '../base-adapter.js';

export class GoAdapter extends BaseLanguageAdapter {
  constructor() {
    super({
      id: SUPPORTED_LANGUAGES.GO,
      displayName: 'Go Analyzer',
      fileExtensions: ['.go'],
      functionPattern: /^func\s+(?:\([^)]*\)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
      classPattern: /^type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+struct/,
      importPattern: /^(?:import\s+"([^"]+)"|import\s+\(\s*"([^"]+)")/,
      singleLineComment: '//',
    });
  }
}
