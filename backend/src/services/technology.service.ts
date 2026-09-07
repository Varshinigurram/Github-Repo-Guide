import {
  RepositoryMetadata,
  RepositoryStructure,
  RepositoryFileContents,
  TechnologyAnalysisResult,
  DetectedTechnology,
  ExtractedDependency
} from '../types/repository.types.js';

/**
 * Service for analyzing deterministic repository evidence (metadata, file tree, file contents)
 * to detect programming languages, frameworks, runtimes, package managers, databases, build tools,
 * testing tools, styling, containerization, and dependencies.
 */
class TechnologyService {
  /**
   * Main entry point for technology detection.
   */
  public analyzeRepositoryTechnologies(
    metadata: RepositoryMetadata,
    structure: RepositoryStructure,
    fileContents: RepositoryFileContents
  ): TechnologyAnalysisResult {
    const languagesMap = new Map<string, DetectedTechnology>();
    const frameworksMap = new Map<string, DetectedTechnology>();
    const runtimesMap = new Map<string, DetectedTechnology>();
    const packageManagersMap = new Map<string, DetectedTechnology>();
    const databasesMap = new Map<string, DetectedTechnology>();
    const buildToolsMap = new Map<string, DetectedTechnology>();
    const testingToolsMap = new Map<string, DetectedTechnology>();
    const stylingMap = new Map<string, DetectedTechnology>();
    const containerizationMap = new Map<string, DetectedTechnology>();

    const extractedDependencies: ExtractedDependency[] = [];

    // Helper to add or merge detected technology with evidence
    const addTech = (
      map: Map<string, DetectedTechnology>,
      name: string,
      category: string,
      confidence: 'high' | 'likely' | 'possible',
      evidenceFile: string
    ) => {
      const key = name.toLowerCase();
      if (map.has(key)) {
        const existing = map.get(key)!;
        if (!existing.evidence.includes(evidenceFile)) {
          existing.evidence.push(evidenceFile);
        }
      } else {
        map.set(key, {
          name,
          category,
          confidence,
          evidence: [evidenceFile]
        });
      }
    };

    // 1. Languages Detection
    if (metadata.language) {
      addTech(languagesMap, metadata.language, 'language', 'high', 'github_metadata');
    }

    const allFilePaths = structure.files.map(f => f.path);
    for (const filePath of allFilePaths) {
      const lower = filePath.toLowerCase();
      if (lower.endsWith('.ts') || lower.endsWith('.tsx')) {
        addTech(languagesMap, 'TypeScript', 'language', 'high', 'repository_files');
      } else if (lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) {
        addTech(languagesMap, 'JavaScript', 'language', 'high', 'repository_files');
      } else if (lower.endsWith('.py')) {
        addTech(languagesMap, 'Python', 'language', 'high', 'repository_files');
      } else if (lower.endsWith('.go')) {
        addTech(languagesMap, 'Go', 'language', 'high', 'repository_files');
      } else if (lower.endsWith('.rs')) {
        addTech(languagesMap, 'Rust', 'language', 'high', 'repository_files');
      } else if (lower.endsWith('.java')) {
        addTech(languagesMap, 'Java', 'language', 'high', 'repository_files');
      } else if (lower.endsWith('.cpp') || lower.endsWith('.cxx') || lower.endsWith('.cc') || lower.endsWith('.c') || lower.endsWith('.h')) {
        addTech(languagesMap, 'C/C++', 'language', 'high', 'repository_files');
      } else if (lower.endsWith('.html')) {
        addTech(languagesMap, 'HTML', 'language', 'high', 'repository_files');
      } else if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.less')) {
        addTech(languagesMap, 'CSS', 'language', 'high', 'repository_files');
      }
    }

    // 2. Package Managers Detection (from tree file presence & important files)
    const importantFilesSet = new Set(structure.importantFiles.map(f => f.toLowerCase()));
    const allFilesSet = new Set(allFilePaths.map(f => f.toLowerCase()));

    if (allFilesSet.has('package-lock.json')) addTech(packageManagersMap, 'npm', 'package-manager', 'high', 'package-lock.json');
    if (allFilesSet.has('yarn.lock')) addTech(packageManagersMap, 'Yarn', 'package-manager', 'high', 'yarn.lock');
    if (allFilesSet.has('pnpm-lock.yaml')) addTech(packageManagersMap, 'pnpm', 'package-manager', 'high', 'pnpm-lock.yaml');
    if (allFilesSet.has('bun.lock') || allFilesSet.has('bun.lockb')) addTech(packageManagersMap, 'Bun', 'package-manager', 'high', 'bun.lock');
    if (allFilesSet.has('requirements.txt') || allFilesSet.has('pyproject.toml')) addTech(packageManagersMap, 'pip', 'package-manager', 'high', 'requirements.txt');
    if (allFilesSet.has('cargo.toml')) addTech(packageManagersMap, 'Cargo', 'package-manager', 'high', 'Cargo.toml');
    if (allFilesSet.has('go.mod')) addTech(packageManagersMap, 'Go Modules', 'package-manager', 'high', 'go.mod');
    if (allFilesSet.has('pom.xml')) addTech(packageManagersMap, 'Maven', 'package-manager', 'high', 'pom.xml');
    if (allFilesSet.has('build.gradle') || allFilesSet.has('build.gradle.kts')) addTech(packageManagersMap, 'Gradle', 'package-manager', 'high', 'build.gradle');

    if (allFilesSet.has('package.json') && packageManagersMap.size === 0) {
      addTech(packageManagersMap, 'npm', 'package-manager', 'likely', 'package.json');
    }

    // 3. Containerization Detection
    if (allFilesSet.has('dockerfile') || importantFilesSet.has('dockerfile')) {
      addTech(containerizationMap, 'Docker', 'containerization', 'high', 'Dockerfile');
    }
    if (allFilesSet.has('docker-compose.yml') || allFilesSet.has('docker-compose.yaml')) {
      addTech(containerizationMap, 'Docker Compose', 'containerization', 'high', 'docker-compose.yml');
    }

    // 4. File Content Evidence Analysis (Manifest Parsing)
    for (const fileEvidence of fileContents.files) {
      if (!fileEvidence.fetched || !fileEvidence.content) continue;

      const filePath = fileEvidence.path;
      const lowerPath = filePath.toLowerCase();
      const content = fileEvidence.content;

      // --- Node.js package.json ---
      if (lowerPath.endsWith('package.json')) {
        addTech(runtimesMap, 'Node.js', 'runtime', 'high', filePath);

        try {
          const pkg = JSON.parse(content);
          const prodDeps = pkg.dependencies || {};
          const devDeps = pkg.devDependencies || {};
          const allDeps = { ...prodDeps, ...devDeps };

          // Extract Dependencies
          for (const [name, version] of Object.entries(prodDeps)) {
            extractedDependencies.push({
              name,
              version: typeof version === 'string' ? version : undefined,
              source: filePath,
              category: 'production'
            });
          }
          for (const [name, version] of Object.entries(devDeps)) {
            extractedDependencies.push({
              name,
              version: typeof version === 'string' ? version : undefined,
              source: filePath,
              category: 'development'
            });
          }

          // Frameworks
          if (allDeps['react'] || allDeps['react-dom']) addTech(frameworksMap, 'React', 'frontend-framework', 'high', filePath);
          if (allDeps['next']) addTech(frameworksMap, 'Next.js', 'fullstack-framework', 'high', filePath);
          if (allDeps['express']) addTech(frameworksMap, 'Express', 'backend-framework', 'high', filePath);
          if (allDeps['@nestjs/core']) addTech(frameworksMap, 'NestJS', 'backend-framework', 'high', filePath);
          if (allDeps['@angular/core']) addTech(frameworksMap, 'Angular', 'frontend-framework', 'high', filePath);
          if (allDeps['vue']) addTech(frameworksMap, 'Vue.js', 'frontend-framework', 'high', filePath);
          if (allDeps['svelte']) addTech(frameworksMap, 'Svelte', 'frontend-framework', 'high', filePath);
          if (allDeps['gatsby']) addTech(frameworksMap, 'Gatsby', 'frontend-framework', 'high', filePath);
          if (allDeps['fastify']) addTech(frameworksMap, 'Fastify', 'backend-framework', 'high', filePath);

          // Runtimes / Desktop Frameworks
          if (allDeps['electron']) addTech(runtimesMap, 'Electron', 'desktop-framework', 'high', filePath);

          // Databases
          if (allDeps['mongoose'] || allDeps['mongodb']) addTech(databasesMap, 'MongoDB', 'database', 'likely', filePath);
          if (allDeps['pg'] || allDeps['postgres']) addTech(databasesMap, 'PostgreSQL', 'database', 'likely', filePath);
          if (allDeps['mysql'] || allDeps['mysql2']) addTech(databasesMap, 'MySQL', 'database', 'likely', filePath);
          if (allDeps['sqlite3'] || allDeps['better-sqlite3']) addTech(databasesMap, 'SQLite', 'database', 'likely', filePath);
          if (allDeps['redis'] || allDeps['ioredis']) addTech(databasesMap, 'Redis', 'database', 'likely', filePath);

          // Build Tools
          if (allDeps['vite']) addTech(buildToolsMap, 'Vite', 'build-tool', 'high', filePath);
          if (allDeps['webpack']) addTech(buildToolsMap, 'Webpack', 'build-tool', 'high', filePath);
          if (allDeps['@babel/core'] || allDeps['babel-core']) addTech(buildToolsMap, 'Babel', 'build-tool', 'high', filePath);
          if (allDeps['rollup']) addTech(buildToolsMap, 'Rollup', 'build-tool', 'high', filePath);
          if (allDeps['esbuild']) addTech(buildToolsMap, 'esbuild', 'build-tool', 'high', filePath);
          if (allDeps['turbo']) addTech(buildToolsMap, 'Turborepo', 'build-tool', 'high', filePath);

          // Testing Tools
          if (allDeps['jest']) addTech(testingToolsMap, 'Jest', 'testing-tool', 'high', filePath);
          if (allDeps['vitest']) addTech(testingToolsMap, 'Vitest', 'testing-tool', 'high', filePath);
          if (allDeps['mocha']) addTech(testingToolsMap, 'Mocha', 'testing-tool', 'high', filePath);
          if (allDeps['cypress']) addTech(testingToolsMap, 'Cypress', 'testing-tool', 'high', filePath);
          if (allDeps['@playwright/test']) addTech(testingToolsMap, 'Playwright', 'testing-tool', 'high', filePath);

          // Styling
          if (allDeps['tailwindcss']) addTech(stylingMap, 'Tailwind CSS', 'styling', 'high', filePath);
          if (allDeps['sass'] || allDeps['node-sass']) addTech(stylingMap, 'Sass', 'styling', 'high', filePath);
          if (allDeps['styled-components']) addTech(stylingMap, 'Styled Components', 'styling', 'high', filePath);
        } catch {
          // Ignore JSON parse errors for incomplete/malformed package.json
        }
      }

      // --- Python requirements.txt ---
      else if (lowerPath.endsWith('requirements.txt')) {
        addTech(runtimesMap, 'Python', 'runtime', 'high', filePath);
        const lines = content.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;

          const parts = trimmed.split(/[==,>=,<=,~=,!=]/);
          const name = parts[0].trim();
          const version = parts[1] ? parts[1].trim() : undefined;

          if (name) {
            extractedDependencies.push({
              name,
              version,
              source: filePath,
              category: 'production'
            });

            const lowerName = name.toLowerCase();
            if (lowerName === 'django') addTech(frameworksMap, 'Django', 'backend-framework', 'high', filePath);
            if (lowerName === 'flask') addTech(frameworksMap, 'Flask', 'backend-framework', 'high', filePath);
            if (lowerName === 'fastapi') addTech(frameworksMap, 'FastAPI', 'backend-framework', 'high', filePath);
            if (lowerName === 'pytest') addTech(testingToolsMap, 'Pytest', 'testing-tool', 'high', filePath);
            if (lowerName === 'psycopg2' || lowerName === 'asyncpg') addTech(databasesMap, 'PostgreSQL', 'database', 'likely', filePath);
            if (lowerName === 'pymongo') addTech(databasesMap, 'MongoDB', 'database', 'likely', filePath);
            if (lowerName === 'redis') addTech(databasesMap, 'Redis', 'database', 'likely', filePath);
          }
        }
      }

      // --- Rust Cargo.toml ---
      else if (lowerPath.endsWith('cargo.toml')) {
        addTech(runtimesMap, 'Rust', 'runtime', 'high', filePath);
        if (content.toLowerCase().includes('actix-web')) addTech(frameworksMap, 'Actix Web', 'backend-framework', 'high', filePath);
        if (content.toLowerCase().includes('axum')) addTech(frameworksMap, 'Axum', 'backend-framework', 'high', filePath);
        if (content.toLowerCase().includes('tokio')) addTech(buildToolsMap, 'Tokio', 'async-runtime', 'high', filePath);
      }

      // --- Go go.mod ---
      else if (lowerPath.endsWith('go.mod')) {
        addTech(runtimesMap, 'Go', 'runtime', 'high', filePath);
        if (content.includes('github.com/gin-gonic/gin')) addTech(frameworksMap, 'Gin', 'backend-framework', 'high', filePath);
        if (content.includes('github.com/gofiber/fiber')) addTech(frameworksMap, 'Fiber', 'backend-framework', 'high', filePath);
      }

      // --- tsconfig.json ---
      else if (lowerPath.endsWith('tsconfig.json')) {
        addTech(languagesMap, 'TypeScript', 'language', 'high', filePath);
      }

      // --- Configuration file detections ---
      else if (lowerPath.includes('next.config.')) addTech(frameworksMap, 'Next.js', 'fullstack-framework', 'high', filePath);
      else if (lowerPath.includes('vite.config.')) addTech(buildToolsMap, 'Vite', 'build-tool', 'high', filePath);
      else if (lowerPath.includes('tailwind.config.')) addTech(stylingMap, 'Tailwind CSS', 'styling', 'high', filePath);
      else if (lowerPath.includes('jest.config.')) addTech(testingToolsMap, 'Jest', 'testing-tool', 'high', filePath);
      else if (lowerPath.includes('vitest.config.')) addTech(testingToolsMap, 'Vitest', 'testing-tool', 'high', filePath);
    }

    // High-Signal Dependencies bounding (Maximum 30 items)
    const MAX_DEPENDENCIES = 30;
    const prioritizedDependencies = extractedDependencies
      .filter(dep => Boolean(dep.name))
      .slice(0, MAX_DEPENDENCIES);

    return {
      languages: Array.from(languagesMap.values()),
      frameworks: Array.from(frameworksMap.values()),
      runtimes: Array.from(runtimesMap.values()),
      packageManagers: Array.from(packageManagersMap.values()),
      databases: Array.from(databasesMap.values()),
      buildTools: Array.from(buildToolsMap.values()),
      testingTools: Array.from(testingToolsMap.values()),
      styling: Array.from(stylingMap.values()),
      containerization: Array.from(containerizationMap.values()),
      dependencies: prioritizedDependencies
    };
  }
}

export const technologyService = new TechnologyService();
