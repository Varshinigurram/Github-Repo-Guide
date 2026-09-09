import {
  RepositoryMetadata,
  RepositoryStructure,
  RepositoryFileContents,
  TechnologyAnalysisResult,
  RepositoryEvidencePackage,
  EntryPointEvidence,
  ConfigFileEvidence,
  ManifestEvidence,
  DocEvidence,
  EvidenceCompleteness,
  EvidenceRepositorySummary,
  EvidenceStructureSummary
} from '../types/repository.types.js';

/**
 * Service for organizing and aggregating deterministic evidence from Steps 3-6
 * into a compact, structured, traceable RepositoryEvidencePackage.
 * 
 * CORE RULES:
 * 1. Zero network requests — operates 100% in-memory on existing server data.
 * 2. Zero AI / LLM calls — organizes evidence without natural-language interpretation.
 * 3. Preserves exact source paths for full provenance and traceability.
 */
class EvidenceService {
  /**
   * Main entry point for evidence aggregation.
   * Runs synchronously on existing evidence held in server memory.
   */
  public aggregateEvidence(
    metadata: RepositoryMetadata,
    structure: RepositoryStructure,
    fileContents: RepositoryFileContents,
    technologies: TechnologyAnalysisResult
  ): RepositoryEvidencePackage {
    // 1. Repository Evidence Summary
    const repositorySummary: EvidenceRepositorySummary = {
      name: metadata.name,
      fullName: metadata.fullName,
      description: metadata.description,
      defaultBranch: metadata.defaultBranch,
      primaryLanguage: metadata.language,
      license: metadata.license,
      topics: metadata.topics,
      url: metadata.url,
      pushedAt: metadata.pushedAt,
      updatedAt: metadata.updatedAt,
      archived: metadata.archived,
      disabled: metadata.disabled,
      openIssues: metadata.openIssues
    };

    // 2. Structure Evidence Summary
    const structureSummary: EvidenceStructureSummary = {
      totalFiles: structure.totalFiles,
      totalDirectories: structure.totalDirectories,
      importantFiles: structure.importantFiles,
      returnedFiles: structure.returnedFiles,
      returnedDirectories: structure.returnedDirectories,
      truncated: structure.truncated,
      responseLimited: structure.responseLimited
    };

    // Collect set of all file paths present in tree for deterministic matching
    const allTreePaths = structure.files.map(f => f.path);

    // 3. Entry-Point Candidates Detection
    const entryPoints = this.detectEntryPoints(allTreePaths, fileContents);

    // 4. Configuration Files Evidence Detection
    const configFiles = this.detectConfigFiles(allTreePaths);

    // 5. Dependency Manifest Files Evidence Detection
    const manifestFiles = this.detectManifestFiles(allTreePaths);

    // 6. Documentation Files Evidence Detection
    const documentationFiles = this.detectDocumentationFiles(allTreePaths);

    // 7. Completeness & Limits Information
    const completeness: EvidenceCompleteness = {
      responseLimited: structure.responseLimited,
      contentLimited: fileContents.contentLimited,
      treeTruncated: structure.truncated,
      fetchedFilesCount: fileContents.fetchedFiles,
      skippedFilesCount: fileContents.skippedFiles,
      truncatedFilesCount: fileContents.truncatedFiles,
      totalContentBytes: fileContents.totalContentBytes
    };

    return {
      repository: repositorySummary,
      structure: structureSummary,
      technologies,
      fileContents: fileContents.files,
      entryPoints,
      configFiles,
      manifestFiles,
      documentationFiles,
      completeness
    };
  }

  /**
   * Deterministically detects potential entry-point candidates from repository file tree and fetched manifests.
   */
  private detectEntryPoints(allPaths: string[], fileContents: RepositoryFileContents): EntryPointEvidence[] {
    const entryMap = new Map<string, EntryPointEvidence>();

    const addEntry = (path: string, reason: string, source?: string) => {
      const key = path.toLowerCase();
      if (entryMap.has(key)) {
        const existing = entryMap.get(key)!;
        if (!existing.reason.includes(reason)) {
          existing.reason += `, ${reason}`;
        }
      } else {
        entryMap.set(key, { path, reason, source });
      }
    };

    // Pattern matching on tree paths
    for (const filePath of allPaths) {
      const lower = filePath.toLowerCase();
      const segments = lower.split('/');
      const filename = segments[segments.length - 1];
      const depth = segments.length - 1;

      // Common root or src or cmd entry points
      if (depth <= 2) {
        if (
          filename === 'index.ts' || filename === 'index.js' || filename === 'index.tsx' || filename === 'index.jsx' ||
          filename === 'main.ts' || filename === 'main.js' || filename === 'main.go' || filename === 'main.py' ||
          filename === 'main.rs' || filename === 'main.cpp' || filename === 'app.ts' || filename === 'app.js' ||
          filename === 'app.py' || filename === 'server.ts' || filename === 'server.js' || filename === 'manage.py'
        ) {
          addEntry(filePath, 'filename_pattern');
        }
      }

      if (lower.startsWith('cmd/') && filename === 'main.go') {
        addEntry(filePath, 'filename_pattern');
      }
    }

    // Inspect fetched package.json contents for main field or scripts
    for (const evidence of fileContents.files) {
      if (!evidence.fetched || !evidence.content) continue;
      if (evidence.path.toLowerCase().endsWith('package.json')) {
        try {
          const pkg = JSON.parse(evidence.content);
          if (pkg.main && typeof pkg.main === 'string') {
            addEntry(evidence.path, `package_json_main_field: "${pkg.main}"`, evidence.path);
          }
          if (pkg.scripts && typeof pkg.scripts === 'object') {
            const scriptKeys = Object.keys(pkg.scripts);
            if (scriptKeys.includes('start') || scriptKeys.includes('dev') || scriptKeys.includes('serve')) {
              addEntry(evidence.path, `package_json_script_reference: [${scriptKeys.slice(0, 3).join(', ')}]`, evidence.path);
            }
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
    }

    const MAX_ENTRY_POINTS = 15;
    return Array.from(entryMap.values()).slice(0, MAX_ENTRY_POINTS);
  }

  /**
   * Identifies configuration files present in the repository tree.
   */
  private detectConfigFiles(allPaths: string[]): ConfigFileEvidence[] {
    const configMap = new Map<string, ConfigFileEvidence>();

    const configRules: Array<{ pattern: (filename: string, lowerPath: string) => boolean; type: string }> = [
      { pattern: f => f === 'tsconfig.json' || f === 'jsconfig.json', type: 'typescript_config' },
      { pattern: f => f.startsWith('vite.config.'), type: 'bundler_config' },
      { pattern: f => f.startsWith('webpack.config.'), type: 'bundler_config' },
      { pattern: f => f.startsWith('babel.config.') || f === '.babelrc', type: 'transpiler_config' },
      { pattern: f => f.startsWith('rollup.config.'), type: 'bundler_config' },
      { pattern: f => f.startsWith('.eslintrc') || f === 'eslint.config.js', type: 'linter_config' },
      { pattern: f => f.startsWith('.prettierrc') || f === 'prettier.config.js', type: 'formatter_config' },
      { pattern: f => f === 'dockerfile' || f.startsWith('dockerfile.'), type: 'container_config' },
      { pattern: f => f === 'docker-compose.yml' || f === 'docker-compose.yaml', type: 'container_config' },
      { pattern: f => f === '.env.example' || f === '.env.sample', type: 'environment_template' },
      { pattern: f => f.startsWith('next.config.'), type: 'framework_config' },
      { pattern: f => f.startsWith('tailwind.config.'), type: 'styling_config' },
      { pattern: f => f.startsWith('jest.config.') || f.startsWith('vitest.config.'), type: 'testing_config' },
      { pattern: f => f.startsWith('postcss.config.'), type: 'styling_config' },
      { pattern: f => f === 'cargo.toml', type: 'build_config' },
      { pattern: f => f === 'pyproject.toml', type: 'build_config' }
    ];

    for (const filePath of allPaths) {
      const lowerPath = filePath.toLowerCase();
      const segments = lowerPath.split('/');
      const filename = segments[segments.length - 1];

      for (const rule of configRules) {
        if (rule.pattern(filename, lowerPath)) {
          const key = lowerPath;
          if (!configMap.has(key)) {
            configMap.set(key, { path: filePath, type: rule.type });
          }
          break;
        }
      }
    }

    const MAX_CONFIG_FILES = 20;
    return Array.from(configMap.values()).slice(0, MAX_CONFIG_FILES);
  }

  /**
   * Identifies dependency manifests present in the repository tree.
   */
  private detectManifestFiles(allPaths: string[]): ManifestEvidence[] {
    const manifestMap = new Map<string, ManifestEvidence>();

    const manifestTypes: Record<string, string> = {
      'package.json': 'npm_manifest',
      'package-lock.json': 'npm_lockfile',
      'yarn.lock': 'yarn_lockfile',
      'pnpm-lock.yaml': 'pnpm_lockfile',
      'bun.lock': 'bun_lockfile',
      'bun.lockb': 'bun_lockfile',
      'requirements.txt': 'pip_manifest',
      'pyproject.toml': 'python_manifest',
      'pipfile': 'pipenv_manifest',
      'cargo.toml': 'cargo_manifest',
      'cargo.lock': 'cargo_lockfile',
      'go.mod': 'go_manifest',
      'go.sum': 'go_lockfile',
      'pom.xml': 'maven_manifest',
      'build.gradle': 'gradle_manifest',
      'build.gradle.kts': 'gradle_manifest',
      'composer.json': 'composer_manifest'
    };

    for (const filePath of allPaths) {
      const lowerPath = filePath.toLowerCase();
      const segments = lowerPath.split('/');
      const filename = segments[segments.length - 1];

      if (manifestTypes[filename]) {
        const key = lowerPath;
        if (!manifestMap.has(key)) {
          manifestMap.set(key, { path: filePath, type: manifestTypes[filename] });
        }
      }
    }

    const MAX_MANIFESTS = 20;
    return Array.from(manifestMap.values()).slice(0, MAX_MANIFESTS);
  }

  /**
   * Identifies documentation files present in the repository tree.
   */
  private detectDocumentationFiles(allPaths: string[]): DocEvidence[] {
    const docMap = new Map<string, DocEvidence>();

    for (const filePath of allPaths) {
      const lowerPath = filePath.toLowerCase();
      const segments = lowerPath.split('/');
      const filename = segments[segments.length - 1];

      if (
        filename.startsWith('readme') ||
        filename.startsWith('contributing') ||
        filename === 'code_of_conduct.md' ||
        filename === 'license' ||
        filename === 'claude.md' ||
        lowerPath.startsWith('docs/')
      ) {
        const key = lowerPath;
        if (!docMap.has(key)) {
          const type = filename.startsWith('readme')
            ? 'readme'
            : filename.startsWith('contributing')
            ? 'contributing_guide'
            : lowerPath.startsWith('docs/')
            ? 'documentation_folder'
            : 'general_doc';

          docMap.set(key, { path: filePath, type });
        }
      }
    }

    const MAX_DOC_FILES = 15;
    return Array.from(docMap.values()).slice(0, MAX_DOC_FILES);
  }
}

export const evidenceService = new EvidenceService();
