import { SUPPORTED_LANGUAGES } from '@rex/shared';
import { BaseLanguageAdapter } from '../base-adapter.js';

export class PythonAdapter extends BaseLanguageAdapter {
  constructor() {
    super({
      id: SUPPORTED_LANGUAGES.PYTHON,
      displayName: 'Python Analyzer',
      fileExtensions: ['.py', '.pyw'],
      functionPattern: /^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
      classPattern: /^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
      importPattern: /^(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/,
      singleLineComment: '#',
    });
  }
}
