import { SUPPORTED_LANGUAGES } from '@rex/shared';
import { BaseLanguageAdapter } from '../base-adapter.js';

export class RubyAdapter extends BaseLanguageAdapter {
  constructor() {
    super({
      id: SUPPORTED_LANGUAGES.RUBY,
      displayName: 'Ruby Analyzer',
      fileExtensions: ['.rb'],
      functionPattern: /^def\s+([a-zA-Z_][a-zA-Z0-9_]*[?!]?)/,
      classPattern: /^(?:class|module)\s+([a-zA-Z_][a-zA-Z0-9_:]*)/,
      importPattern: /^(?:require|require_relative|load)\s+['"]([^'"]+)['"]/,
      singleLineComment: '#',
    });
  }
}
