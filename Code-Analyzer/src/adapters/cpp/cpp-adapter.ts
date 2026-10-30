import { SUPPORTED_LANGUAGES } from '@rex/shared';
import { BaseLanguageAdapter } from '../base-adapter.js';

export class CppAdapter extends BaseLanguageAdapter {
  constructor() {
    super({
      id: SUPPORTED_LANGUAGES.CPP,
      displayName: 'C/C++ Analyzer',
      fileExtensions: ['.cpp', '.c', '.cc', '.cxx', '.h', '.hpp'],
      functionPattern: /(?:[\w:*&<>]+\s+)+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*(?:const)?\s*\{/,
      classPattern: /(?:class|struct)\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
      importPattern: /^#include\s+([<"][^>"]+[>"])/,
      singleLineComment: '//',
    });
  }
}
