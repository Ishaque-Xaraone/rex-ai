import { SUPPORTED_LANGUAGES } from '@rex/shared';
import { BaseLanguageAdapter } from '../base-adapter.js';

export class RustAdapter extends BaseLanguageAdapter {
  constructor() {
    super({
      id: SUPPORTED_LANGUAGES.RUST,
      displayName: 'Rust Analyzer',
      fileExtensions: ['.rs'],
      functionPattern: /^(?:pub(?:\(crate\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:<[^>]*>)?\s*\(/,
      classPattern: /^(?:pub(?:\(crate\))?\s+)?(?:struct|enum|trait)\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
      importPattern: /^(?:pub\s+)?use\s+([a-zA-Z0-9_:]+);/,
      singleLineComment: '//',
    });
  }
}
