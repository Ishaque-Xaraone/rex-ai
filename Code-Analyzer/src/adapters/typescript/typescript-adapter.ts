import path from 'node:path';
import ts from 'typescript';
import {
  CodeSymbol,
  DependencyEdge,
  Finding,
  SYMBOL_KIND,
  FINDING_SEVERITY,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  LineReference,
} from '@rex/shared';
import {
  LanguageAdapter,
  FileAnalysisContext,
  FileAnalysisResult,
  FileMetrics,
} from '../../core/analyzer-interface.js';

export class TypeScriptAdapter implements LanguageAdapter {
  public readonly id: SupportedLanguage = SUPPORTED_LANGUAGES.TYPESCRIPT;
  public readonly displayName: string = 'TypeScript / JavaScript Analyzer';
  public readonly fileExtensions: readonly string[] = [
    '.ts',
    '.tsx',
    '.mts',
    '.cts',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
  ];

  public canHandle(filePath: string): boolean {
    const lower = filePath.toLowerCase();
    return this.fileExtensions.some((ext) => lower.endsWith(ext));
  }

  public async analyzeFile(context: FileAnalysisContext): Promise<FileAnalysisResult> {
    const sourceFile = ts.createSourceFile(
      context.filePath,
      context.content,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true
    );

    const symbols: CodeSymbol[] = [];
    const dependencies: DependencyEdge[] = [];
    const findings: Finding[] = [];
    const lines = context.content.split(/\r?\n/);

    const getLineReference = (node: ts.Node): LineReference => {
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
      return {
        startLine: start.line + 1,
        endLine: end.line + 1,
        startColumn: start.character + 1,
        endColumn: end.character + 1,
      };
    };

    const getSnippet = (lineRef: LineReference): string => {
      const startIdx = Math.max(0, lineRef.startLine - 1);
      const endIdx = Math.min(lines.length, lineRef.endLine);
      return lines.slice(startIdx, endIdx).join('\n');
    };

    const resolveTargetPath = (specifier: string): { targetPath: string; isExternal: boolean } => {
      const isInternal = specifier.startsWith('.') || specifier.startsWith('/');
      if (!isInternal) {
        return { targetPath: specifier, isExternal: true };
      }

      const fileDir = path.dirname(context.relativePath);
      const resolved = path.normalize(path.join(fileDir, specifier)).replace(/\\/g, '/');
      return { targetPath: resolved, isExternal: false };
    };

    let symbolSeq = 0;
    let depSeq = 0;
    let findingSeq = 0;

    const currentScopeStack: string[] = [];

    const visit = (node: ts.Node): void => {
      // 1. Symbol Extraction: Function Declaration
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        const lineRef = getLineReference(node);
        const isExported = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        );
        const isAsync = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
        );

        symbols.push({
          id: `${context.fileId}-sym-${++symbolSeq}`,
          projectId: context.projectId,
          fileId: context.fileId,
          name,
          kind: SYMBOL_KIND.FUNCTION,
          scope: currentScopeStack.join('.'),
          isExported,
          isAsync,
          lineReference: lineRef,
        });

        currentScopeStack.push(name);
        ts.forEachChild(node, visit);
        currentScopeStack.pop();
        return;
      }

      // Class Declaration
      if (ts.isClassDeclaration(node) && node.name) {
        const name = node.name.text;
        const lineRef = getLineReference(node);
        const isExported = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        );

        symbols.push({
          id: `${context.fileId}-sym-${++symbolSeq}`,
          projectId: context.projectId,
          fileId: context.fileId,
          name,
          kind: SYMBOL_KIND.CLASS,
          scope: currentScopeStack.join('.'),
          isExported,
          lineReference: lineRef,
        });

        currentScopeStack.push(name);
        ts.forEachChild(node, visit);
        currentScopeStack.pop();
        return;
      }

      // Method Declaration
      if (ts.isMethodDeclaration(node) && node.name) {
        const name = node.name.getText(sourceFile);
        const lineRef = getLineReference(node);
        const isAsync = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
        );

        symbols.push({
          id: `${context.fileId}-sym-${++symbolSeq}`,
          projectId: context.projectId,
          fileId: context.fileId,
          name,
          kind: SYMBOL_KIND.METHOD,
          scope: currentScopeStack.join('.'),
          isExported: false,
          isAsync,
          lineReference: lineRef,
        });

        currentScopeStack.push(name);
        ts.forEachChild(node, visit);
        currentScopeStack.pop();
        return;
      }

      // Variable Statement (Constants, exported variables, arrow functions)
      if (ts.isVariableStatement(node)) {
        const isExported = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        );
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            const name = decl.name.text;
            const lineRef = getLineReference(decl);
            const isFunction =
              decl.initializer &&
              (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer));
            const isAsync =
              isFunction &&
              Boolean(
                decl.initializer?.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
              );

            const kind = isFunction
              ? SYMBOL_KIND.FUNCTION
              : node.declarationList.flags & ts.NodeFlags.Const
                ? SYMBOL_KIND.CONSTANT
                : SYMBOL_KIND.VARIABLE;

            symbols.push({
              id: `${context.fileId}-sym-${++symbolSeq}`,
              projectId: context.projectId,
              fileId: context.fileId,
              name,
              kind,
              scope: currentScopeStack.join('.'),
              isExported,
              isAsync: isFunction ? isAsync : undefined,
              lineReference: lineRef,
            });

            if (isFunction && decl.initializer) {
              currentScopeStack.push(name);
              ts.forEachChild(decl.initializer, visit);
              currentScopeStack.pop();
            }
          }
        }
      }

      // Interface Declaration
      if (ts.isInterfaceDeclaration(node)) {
        const name = node.name.text;
        const lineRef = getLineReference(node);
        const isExported = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        );

        symbols.push({
          id: `${context.fileId}-sym-${++symbolSeq}`,
          projectId: context.projectId,
          fileId: context.fileId,
          name,
          kind: SYMBOL_KIND.INTERFACE,
          scope: currentScopeStack.join('.'),
          isExported,
          lineReference: lineRef,
        });
      }

      // Type Alias
      if (ts.isTypeAliasDeclaration(node)) {
        const name = node.name.text;
        const lineRef = getLineReference(node);
        const isExported = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        );

        symbols.push({
          id: `${context.fileId}-sym-${++symbolSeq}`,
          projectId: context.projectId,
          fileId: context.fileId,
          name,
          kind: SYMBOL_KIND.TYPE_ALIAS,
          scope: currentScopeStack.join('.'),
          isExported,
          lineReference: lineRef,
        });
      }

      // Enum Declaration
      if (ts.isEnumDeclaration(node)) {
        const name = node.name.text;
        const lineRef = getLineReference(node);
        const isExported = Boolean(
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        );

        symbols.push({
          id: `${context.fileId}-sym-${++symbolSeq}`,
          projectId: context.projectId,
          fileId: context.fileId,
          name,
          kind: SYMBOL_KIND.ENUM,
          scope: currentScopeStack.join('.'),
          isExported,
          lineReference: lineRef,
        });
      }

      // 2. Dependency Extraction: Imports
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
        const lineRef = getLineReference(node);
        const { targetPath, isExternal } = resolveTargetPath(moduleSpecifier);

        dependencies.push({
          id: `${context.analysisId}-${context.fileId}-dep-${++depSeq}`,
          projectId: context.projectId,
          analysisId: context.analysisId,
          sourceId: context.fileId,
          sourcePath: context.relativePath,
          targetId: targetPath,
          targetPath,
          edgeType: 'import',
          specifier: moduleSpecifier,
          isExternal,
          lineReference: lineRef,
        });
      }

      // Re-export declarations: export { ... } from './module'
      if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
        const lineRef = getLineReference(node);
        const { targetPath, isExternal } = resolveTargetPath(moduleSpecifier);

        dependencies.push({
          id: `${context.analysisId}-${context.fileId}-dep-${++depSeq}`,
          projectId: context.projectId,
          analysisId: context.analysisId,
          sourceId: context.fileId,
          sourcePath: context.relativePath,
          targetId: targetPath,
          targetPath,
          edgeType: 'import',
          specifier: moduleSpecifier,
          isExternal,
          lineReference: lineRef,
        });
      }

      // require() calls
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' &&
        node.arguments.length > 0
      ) {
        const firstArg = node.arguments[0];
        if (firstArg && ts.isStringLiteral(firstArg)) {
          const moduleSpecifier = firstArg.text;
          const lineRef = getLineReference(node);
          const { targetPath, isExternal } = resolveTargetPath(moduleSpecifier);

          dependencies.push({
            id: `${context.analysisId}-${context.fileId}-dep-${++depSeq}`,
            projectId: context.projectId,
            analysisId: context.analysisId,
            sourceId: context.fileId,
            sourcePath: context.relativePath,
            targetId: targetPath,
            targetPath,
            edgeType: 'import',
            specifier: moduleSpecifier,
            isExternal,
            lineReference: lineRef,
          });
        }
      }

      // Function/Method Calls (Security & Call graph check)
      if (ts.isCallExpression(node)) {
        const lineRef = getLineReference(node);
        const callTarget = node.expression.getText(sourceFile);

        // Security Rule Check: SEC-001 eval() or Function constructor
        if (callTarget === 'eval' || callTarget === 'Function') {
          findings.push({
            id: `${context.analysisId}-${context.fileId}-fnd-${++findingSeq}`,
            projectId: context.projectId,
            analysisId: context.analysisId,
            ruleId: 'SEC-001',
            ruleTitle: 'Dangerous Dynamic Code Execution (eval/Function)',
            severity: FINDING_SEVERITY.CRITICAL,
            category: 'security',
            description: `Detected invocation of '${callTarget}'. Evaluating dynamic code can lead to remote code execution and arbitrary execution flaws.`,
            evidence: {
              fileId: context.fileId,
              filePath: context.relativePath,
              lineReference: lineRef,
              snippet: getSnippet(lineRef),
            },
            remediation:
              'Avoid eval() and Function constructors. Use structured parsers (e.g. JSON.parse) or static typing.',
            confidenceScore: 0.95,
            createdAt: new Date().toISOString(),
          });
        }

        // Security Rule Check: SEC-002 child_process execution
        if (
          callTarget.includes('exec(') ||
          callTarget.includes('execSync') ||
          callTarget.endsWith('.exec') ||
          callTarget.endsWith('.execSync')
        ) {
          findings.push({
            id: `${context.analysisId}-${context.fileId}-fnd-${++findingSeq}`,
            projectId: context.projectId,
            analysisId: context.analysisId,
            ruleId: 'SEC-002',
            ruleTitle: 'Potential Command Injection Risk',
            severity: FINDING_SEVERITY.HIGH,
            category: 'security',
            description: `Detected invocation of command execution function '${callTarget}'. Verify that inputs are sanitized and parameterized.`,
            evidence: {
              fileId: context.fileId,
              filePath: context.relativePath,
              lineReference: lineRef,
              snippet: getSnippet(lineRef),
            },
            remediation:
              'Use execFile or spawn with argument arrays rather than shell string execution.',
            confidenceScore: 0.85,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Security Rule Check: SEC-003 Hardcoded Secrets in String Literals
      if (ts.isStringLiteral(node)) {
        const text = node.text;
        const lineRef = getLineReference(node);

        const secretPatterns = [
          {
            pattern: /^(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|AIza[0-9A-Za-z-_]{35})$/,
            title: 'Hardcoded API Key',
          },
          { pattern: /-----BEGIN (RSA|EC|PRIVATE) KEY-----/, title: 'Hardcoded Private Key' },
          {
            pattern: /postgres:\/\/[^:]+:[^@]+@/,
            title: 'Hardcoded Database Connection String with Credentials',
          },
        ];

        for (const sec of secretPatterns) {
          if (sec.pattern.test(text)) {
            findings.push({
              id: `${context.analysisId}-${context.fileId}-fnd-${++findingSeq}`,
              projectId: context.projectId,
              analysisId: context.analysisId,
              ruleId: 'SEC-003',
              ruleTitle: sec.title,
              severity: FINDING_SEVERITY.CRITICAL,
              category: 'security',
              description: `A potentially sensitive secret credential was found embedded in source code.`,
              evidence: {
                fileId: context.fileId,
                filePath: context.relativePath,
                lineReference: lineRef,
                snippet: getSnippet(lineRef),
              },
              remediation:
                'Store credentials in environment variables or secret managers, never commit them to source control.',
              confidenceScore: 0.9,
              createdAt: new Date().toISOString(),
            });
            break;
          }
        }
      }

      // Security Rule Check: SEC-004 Dangerous DOM manipulation (innerHTML)
      if (ts.isPropertyAccessExpression(node)) {
        const prop = node.name.text;
        if (prop === 'innerHTML' || prop === 'dangerouslySetInnerHTML') {
          const lineRef = getLineReference(node);
          findings.push({
            id: `${context.analysisId}-${context.fileId}-fnd-${++findingSeq}`,
            projectId: context.projectId,
            analysisId: context.analysisId,
            ruleId: 'SEC-004',
            ruleTitle: 'Direct InnerHTML / Dangerous DOM Injection',
            severity: FINDING_SEVERITY.MEDIUM,
            category: 'security',
            description: `Direct assignment or reference to '${prop}' detected. This pattern is vulnerable to Cross-Site Scripting (XSS) if unsanitized data is inserted.`,
            evidence: {
              fileId: context.fileId,
              filePath: context.relativePath,
              lineReference: lineRef,
              snippet: getSnippet(lineRef),
            },
            remediation: 'Use textContent, safe template components, or sanitize with DOMPurify.',
            confidenceScore: 0.85,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Code Quality Check: QUAL-001 Empty Catch Block
      if (ts.isCatchClause(node)) {
        if (node.block.statements.length === 0) {
          const lineRef = getLineReference(node);
          findings.push({
            id: `${context.analysisId}-${context.fileId}-fnd-${++findingSeq}`,
            projectId: context.projectId,
            analysisId: context.analysisId,
            ruleId: 'QUAL-001',
            ruleTitle: 'Empty Catch Block Silencing Exceptions',
            severity: FINDING_SEVERITY.LOW,
            category: 'code_quality',
            description: 'Found an empty catch block that silently suppresses runtime exceptions.',
            evidence: {
              fileId: context.fileId,
              filePath: context.relativePath,
              lineReference: lineRef,
              snippet: getSnippet(lineRef),
            },
            remediation:
              'Log the error or handle the failure gracefully instead of silently ignoring it.',
            confidenceScore: 0.95,
            createdAt: new Date().toISOString(),
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Compute basic metrics
    let commentLines = 0;
    let blankLines = 0;
    let codeLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        blankLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }

    const metrics: FileMetrics = {
      linesOfCode: codeLines,
      commentLines,
      blankLines,
    };

    return {
      symbols,
      dependencies,
      findings,
      metrics,
    };
  }
}
