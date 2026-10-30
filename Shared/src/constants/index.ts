export const ANALYSIS_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial',
} as const;

export type AnalysisStatus = (typeof ANALYSIS_STATUS)[keyof typeof ANALYSIS_STATUS];

export const FINDING_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
} as const;

export type FindingSeverity = (typeof FINDING_SEVERITY)[keyof typeof FINDING_SEVERITY];

export const SYMBOL_KIND = {
  FUNCTION: 'function',
  METHOD: 'method',
  CLASS: 'class',
  INTERFACE: 'interface',
  VARIABLE: 'variable',
  CONSTANT: 'constant',
  TYPE_ALIAS: 'type_alias',
  ENUM: 'enum',
  MODULE: 'module',
  PROPERTY: 'property',
} as const;

export type SymbolKind = (typeof SYMBOL_KIND)[keyof typeof SYMBOL_KIND];

export const SUPPORTED_LANGUAGES = {
  TYPESCRIPT: 'typescript',
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
  JAVA: 'java',
  CSHARP: 'csharp',
  CPP: 'cpp',
  GO: 'go',
  RUST: 'rust',
  PHP: 'php',
  RUBY: 'ruby',
  UNKNOWN: 'unknown',
} as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[keyof typeof SUPPORTED_LANGUAGES];

export const SECURITY_LIMITS = {
  MAX_UPLOAD_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  MAX_EXPANDED_ARCHIVE_BYTES: 200 * 1024 * 1024, // 200 MB
  MAX_FILE_COUNT: 1000,
  MAX_SINGLE_FILE_BYTES: 5 * 1024 * 1024, // 5 MB
  DEFAULT_ANALYSIS_TIMEOUT_MS: 300000, // 5 minutes
} as const;

export const DEFAULT_EXCLUDED_DIRS: readonly string[] = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  'coverage',
  '__pycache__',
  '.venv',
  'venv',
  'vendor',
  '.turbo',
  '.cache',
  '.idea',
  '.vscode',
];

export const DEFAULT_EXCLUDED_EXTENSIONS: readonly string[] = [
  '.min.js',
  '.min.css',
  '.map',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.zip',
  '.tar',
  '.gz',
  '.pdf',
  '.bin',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.iso',
];
