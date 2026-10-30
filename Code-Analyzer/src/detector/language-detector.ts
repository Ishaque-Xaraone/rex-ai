import path from 'node:path';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@rex/shared';

const EXTENSION_MAP: Record<string, SupportedLanguage> = {
  '.ts': SUPPORTED_LANGUAGES.TYPESCRIPT,
  '.tsx': SUPPORTED_LANGUAGES.TYPESCRIPT,
  '.mts': SUPPORTED_LANGUAGES.TYPESCRIPT,
  '.cts': SUPPORTED_LANGUAGES.TYPESCRIPT,
  '.js': SUPPORTED_LANGUAGES.JAVASCRIPT,
  '.jsx': SUPPORTED_LANGUAGES.JAVASCRIPT,
  '.mjs': SUPPORTED_LANGUAGES.JAVASCRIPT,
  '.cjs': SUPPORTED_LANGUAGES.JAVASCRIPT,
  '.py': SUPPORTED_LANGUAGES.PYTHON,
  '.pyw': SUPPORTED_LANGUAGES.PYTHON,
  '.java': SUPPORTED_LANGUAGES.JAVA,
  '.cs': SUPPORTED_LANGUAGES.CSHARP,
  '.cpp': SUPPORTED_LANGUAGES.CPP,
  '.c': SUPPORTED_LANGUAGES.CPP,
  '.cc': SUPPORTED_LANGUAGES.CPP,
  '.cxx': SUPPORTED_LANGUAGES.CPP,
  '.h': SUPPORTED_LANGUAGES.CPP,
  '.hpp': SUPPORTED_LANGUAGES.CPP,
  '.go': SUPPORTED_LANGUAGES.GO,
  '.rs': SUPPORTED_LANGUAGES.RUST,
  '.php': SUPPORTED_LANGUAGES.PHP,
  '.phtml': SUPPORTED_LANGUAGES.PHP,
  '.rb': SUPPORTED_LANGUAGES.RUBY,
};

export class LanguageDetector {
  public static detect(filePath: string): SupportedLanguage {
    const ext = path.extname(filePath).toLowerCase();
    return EXTENSION_MAP[ext] ?? SUPPORTED_LANGUAGES.UNKNOWN;
  }

  public static isSupported(language: SupportedLanguage): boolean {
    return language !== SUPPORTED_LANGUAGES.UNKNOWN;
  }
}
