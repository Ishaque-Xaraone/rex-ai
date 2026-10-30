import { SUPPORTED_LANGUAGES } from '@rex/shared';
import { BaseLanguageAdapter } from '../base-adapter.js';

export class PhpAdapter extends BaseLanguageAdapter {
  constructor() {
    super({
      id: SUPPORTED_LANGUAGES.PHP,
      displayName: 'PHP Analyzer',
      fileExtensions: ['.php', '.phtml'],
      functionPattern: /(?:public|protected|private|static|\s)*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
      classPattern: /(?:abstract\s+|final\s+)?(?:class|trait|interface)\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
      importPattern: /^(?:use|require|include|require_once|include_once)\s+([^\s;]+);/,
      singleLineComment: '//',
    });
  }
}
