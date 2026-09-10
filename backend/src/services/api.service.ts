import {
  RepositoryEvidencePackage,
  RepositoryApiResult,
  ApiEndpoint,
  ApiSpecification,
  HttpMethod
} from '../types/repository.types.js';

export class ApiService {
  /**
   * Deterministically detects API endpoints, frameworks, and specifications from available repository evidence.
   *
   * Core Rules:
   * 1. 0 GitHub API calls
   * 2. 0 AI calls
   * 3. 100% in-memory deterministic pattern matching
   * 4. Bounded: max 100 endpoints, max 20 frameworks, max 20 specs, max 10 limitations.
   * 5. Preserves exact repository-relative evidence paths without flattening.
   */
  public detectApiEndpoints(evidence: RepositoryEvidencePackage): RepositoryApiResult {
    const rawEndpoints: ApiEndpoint[] = [];
    const rawSpecifications: ApiSpecification[] = [];
    const detectedFrameworks: string[] = [];
    const limitations: string[] = [];

    // Collect framework names from technology detection
    const frameworksList = (evidence.technologies.frameworks || []).map((f) => f.name);
    for (const fw of frameworksList) {
      detectedFrameworks.push(fw);
    }

    // 1. Detect API Specifications (OpenAPI, Swagger, GraphQL, gRPC)
    this.detectSpecifications(evidence, rawSpecifications, detectedFrameworks);

    // 2. Parse OpenApi/Swagger specifications for endpoints if content available
    this.extractEndpointsFromOpenApiSpecs(evidence, rawEndpoints);

    // 3. Extract endpoints from file contents based on framework patterns
    for (const fileContent of evidence.fileContents) {
      if (!fileContent.fetched || !fileContent.content) continue;

      // Skip README.md to prevent random prose text from creating code endpoints
      if (fileContent.path.toLowerCase().endsWith('readme.md')) {
        continue;
      }

      this.extractEndpointsFromContent(fileContent.path, fileContent.content, rawEndpoints, detectedFrameworks);
    }

    // 4. Extract Next.js conventional API routes from repository structure
    this.extractNextJsApiRoutes(evidence, rawEndpoints, detectedFrameworks);

    // Deduplicate endpoints and specifications
    const endpoints = this.deduplicateEndpoints(rawEndpoints);
    const specifications = this.deduplicateSpecifications(rawSpecifications);
    const frameworks = Array.from(new Set(detectedFrameworks));

    // 5. Completeness & Limitation Assessment
    const isLimited =
      evidence.completeness.responseLimited ||
      evidence.completeness.contentLimited ||
      evidence.completeness.treeTruncated ||
      evidence.completeness.skippedFilesCount > 0 ||
      evidence.completeness.truncatedFilesCount > 0;

    if (endpoints.length === 0) {
      if (isLimited) {
        limitations.push('No API endpoints were observed in the available repository evidence.');
        limitations.push(
          'API detection was limited by incomplete repository evidence; additional endpoints may exist in files that were not available for analysis.'
        );
      } else {
        limitations.push('No API endpoints were detected in the analyzed repository evidence.');
      }
    } else if (isLimited) {
      limitations.push(
        'API detection was limited by incomplete repository evidence; additional endpoints may exist in files that were not available for analysis.'
      );
    }

    // Sort endpoints deterministically: high confidence first, then method, then path
    endpoints.sort((a, b) => {
      const confRank = { high: 3, medium: 2, low: 1 };
      const diff = confRank[b.confidence] - confRank[a.confidence];
      if (diff !== 0) return diff;
      const mDiff = a.method.localeCompare(b.method);
      if (mDiff !== 0) return mDiff;
      return a.path.localeCompare(b.path);
    });

    if (endpoints.length > 100) {
      limitations.push('API endpoint output was bounded to 100 items.');
    }

    const boundedEndpoints = endpoints.slice(0, 100);
    const boundedFrameworks = frameworks.slice(0, 20);
    const boundedSpecs = specifications.slice(0, 20);
    const boundedLimitations = Array.from(new Set(limitations)).slice(0, 10);

    // Overall confidence calculation
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (boundedEndpoints.some((e) => e.confidence === 'high') || boundedSpecs.some((s) => s.confidence === 'high')) {
      confidence = 'high';
    } else if (boundedEndpoints.length > 0) {
      confidence = 'medium';
    }

    return {
      frameworks: boundedFrameworks,
      endpoints: boundedEndpoints,
      specifications: boundedSpecs,
      limitations: boundedLimitations,
      confidence
    };
  }

  /**
   * Detects API specification files (OpenAPI, Swagger, GraphQL, gRPC).
   */
  private detectSpecifications(
    evidence: RepositoryEvidencePackage,
    specifications: ApiSpecification[],
    frameworks: string[]
  ) {
    const allPaths = [
      ...evidence.structure.importantFiles,
      ...evidence.configFiles.map((c) => c.path),
      ...evidence.documentationFiles.map((d) => d.path)
    ];

    for (const filePath of Array.from(new Set(allPaths))) {
      const lower = filePath.toLowerCase();
      if (lower.endsWith('openapi.yaml') || lower.endsWith('openapi.yml') || lower.endsWith('openapi.json')) {
        specifications.push({ path: filePath, type: 'OpenAPI', confidence: 'high' });
        frameworks.push('OpenAPI');
      } else if (lower.endsWith('swagger.yaml') || lower.endsWith('swagger.yml') || lower.endsWith('swagger.json')) {
        specifications.push({ path: filePath, type: 'Swagger', confidence: 'high' });
        frameworks.push('Swagger');
      } else if (lower.endsWith('schema.graphql') || lower.endsWith('.graphql')) {
        specifications.push({ path: filePath, type: 'GraphQL', confidence: 'high' });
        frameworks.push('GraphQL');
      } else if (lower.endsWith('.proto')) {
        specifications.push({ path: filePath, type: 'gRPC', confidence: 'high' });
        frameworks.push('gRPC');
      }
    }
  }

  /**
   * Extracts API endpoints directly from OpenAPI / Swagger JSON or YAML contents.
   */
  private extractEndpointsFromOpenApiSpecs(
    evidence: RepositoryEvidencePackage,
    endpoints: ApiEndpoint[]
  ) {
    for (const fileContent of evidence.fileContents) {
      if (!fileContent.fetched || !fileContent.content) continue;
      const lower = fileContent.path.toLowerCase();
      const isSpec = lower.includes('openapi') || lower.includes('swagger');
      if (!isSpec) continue;

      try {
        // Simple JSON parse check
        if (lower.endsWith('.json')) {
          const parsed = JSON.parse(fileContent.content);
          if (parsed && typeof parsed.paths === 'object') {
            for (const [routePath, methodsObj] of Object.entries(parsed.paths)) {
              if (typeof methodsObj === 'object' && methodsObj !== null) {
                for (const methodKey of Object.keys(methodsObj)) {
                  const upperMethod = methodKey.toUpperCase();
                  if (this.isValidHttpMethod(upperMethod)) {
                    endpoints.push({
                      method: upperMethod as HttpMethod,
                      path: this.normalizePath(routePath),
                      framework: 'OpenAPI',
                      evidence: fileContent.path,
                      confidence: 'high'
                    });
                  }
                }
              }
            }
          }
        } else {
          // Structural line pattern check for YAML OpenAPI specs
          const lines = fileContent.content.split('\n');
          let currentPath = '';

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const pathMatch = line.match(/^\s*(?:\/|['"]\/)([^'":\s]+)['"]?:\s*$/);
            if (pathMatch) {
              const rawPath = line.trim().replace(/:$/, '').replace(/^['"]|['"]$/g, '');
              if (rawPath.startsWith('/')) {
                currentPath = rawPath;
              }
            } else if (currentPath) {
              const methodMatch = line.match(/^\s{2,6}(get|post|put|patch|delete|options|head):\s*/i);
              if (methodMatch) {
                const method = methodMatch[1].toUpperCase() as HttpMethod;
                endpoints.push({
                  method,
                  path: this.normalizePath(currentPath),
                  framework: 'OpenAPI',
                  evidence: fileContent.path,
                  confidence: 'high'
                });
              }
            }
          }
        }
      } catch {
        // Ignore parse errors on malformed specs
      }
    }
  }

  /**
   * Pattern-based route extraction from code content.
   */
  private extractEndpointsFromContent(
    filePath: string,
    content: string,
    endpoints: ApiEndpoint[],
    frameworks: string[]
  ) {
    // Check for Express router prefix composition in current file
    let routerPrefix = '';
    const prefixMatch = content.match(/(?:app|router|server)\.use\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:[a-zA-Z0-9_]+)\)/);
    if (prefixMatch && prefixMatch[1] && prefixMatch[1].startsWith('/')) {
      routerPrefix = prefixMatch[1].replace(/\/$/, '');
    }

    // 1. Express / Fastify / Koa / Hono routes: app.get("/path", ...), router.post("/path", ...)
    const expressRegex = /(?:app|router|server|fastify|hono)\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let match: RegExpExecArray | null;
    while ((match = expressRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase() as HttpMethod;
      let rawRoute = match[2];
      if (rawRoute.startsWith('/') || rawRoute === '*') {
        if (routerPrefix && rawRoute.startsWith('/')) {
          rawRoute = `${routerPrefix}${rawRoute}`;
        }
        endpoints.push({
          method,
          path: this.normalizePath(rawRoute),
          framework: 'Express',
          evidence: filePath,
          confidence: 'high'
        });
        if (!frameworks.includes('Express')) frameworks.push('Express');
      }
    }

    // 2. NestJS Decorators
    const controllerMatch = content.match(/@Controller\s*\(\s*['"`]([^'"`]*)['"`]\)/i);
    const controllerPrefix = controllerMatch ? this.normalizePath(controllerMatch[1]) : '';

    const nestRegex = /@(Get|Post|Put|Patch|Delete|Options|Head)\s*\(\s*(?:['"`]([^'"`]*)['"`])?\)/gi;
    while ((match = nestRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase() as HttpMethod;
      const subPath = match[2] ? this.normalizePath(match[2]) : '';
      const fullPath = this.combinePaths(controllerPrefix, subPath);

      endpoints.push({
        method,
        path: fullPath,
        framework: 'NestJS',
        evidence: filePath,
        confidence: 'high'
      });
      if (!frameworks.includes('NestJS')) frameworks.push('NestJS');
    }

    // 3. Python FastAPI
    const fastApiRegex = /@(?:app|router|api)\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = fastApiRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase() as HttpMethod;
      endpoints.push({
        method,
        path: this.normalizePath(match[2]),
        framework: 'FastAPI',
        evidence: filePath,
        confidence: 'high'
      });
      if (!frameworks.includes('FastAPI')) frameworks.push('FastAPI');
    }

    // 4. Python Flask
    const flaskRegex = /@(?:app|api|bp|blueprint)\.(?:route|get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`](?:.*?methods\s*=\s*\[\s*(.*?)\s*\])?/gi;
    while ((match = flaskRegex.exec(content)) !== null) {
      let method: HttpMethod = 'GET';
      if (match[2]) {
        const methodsDeclared = match[2].toUpperCase();
        if (methodsDeclared.includes('POST')) method = 'POST';
        else if (methodsDeclared.includes('PUT')) method = 'PUT';
        else if (methodsDeclared.includes('DELETE')) method = 'DELETE';
      }
      endpoints.push({
        method,
        path: this.normalizePath(match[1]),
        framework: 'Flask',
        evidence: filePath,
        confidence: 'high'
      });
      if (!frameworks.includes('Flask')) frameworks.push('Flask');
    }

    // 5. Python Django URL paths
    const djangoRegex = /(?:path|re_path)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = djangoRegex.exec(content)) !== null) {
      const rawPath = match[1];
      if (!rawPath.includes('.')) {
        endpoints.push({
          method: 'GET',
          path: this.normalizePath(rawPath),
          framework: 'Django',
          evidence: filePath,
          confidence: 'high'
        });
        if (!frameworks.includes('Django')) frameworks.push('Django');
      }
    }

    // 6. Java Spring Mapping Decorators
    const springClassMatch = content.match(/@RequestMapping\s*\(\s*(?:value\s*=\s*)?['"`]([^'"`]+)['"`]\)/i);
    const springClassPrefix = springClassMatch ? this.normalizePath(springClassMatch[1]) : '';

    const springRegex = /@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*\(\s*(?:(?:value|path)\s*=\s*)?['"`]([^'"`]*)['"`]/gi;
    while ((match = springRegex.exec(content)) !== null) {
      const mappingType = match[1];
      let method: HttpMethod = 'GET';
      if (mappingType.startsWith('Post')) method = 'POST';
      else if (mappingType.startsWith('Put')) method = 'PUT';
      else if (mappingType.startsWith('Patch')) method = 'PATCH';
      else if (mappingType.startsWith('Delete')) method = 'DELETE';

      const methodPath = this.normalizePath(match[2]);
      const fullPath = this.combinePaths(springClassPrefix, methodPath);

      endpoints.push({
        method,
        path: fullPath,
        framework: 'Spring',
        evidence: filePath,
        confidence: 'high'
      });
      if (!frameworks.includes('Spring')) frameworks.push('Spring');
    }
  }

  /**
   * Extracts Next.js API conventional routes from tree structure.
   */
  private extractNextJsApiRoutes(
    evidence: RepositoryEvidencePackage,
    endpoints: ApiEndpoint[],
    frameworks: string[]
  ) {
    for (const filePath of evidence.structure.importantFiles) {
      const lower = filePath.toLowerCase();

      // Pages Router API: pages/api/...
      if (lower.startsWith('pages/api/') || lower.includes('/pages/api/')) {
        const relativeApi = filePath.substring(filePath.toLowerCase().indexOf('pages/api/') + 9);
        const routePath = '/api/' + relativeApi.replace(/\.(ts|js|tsx|jsx)$/, '');
        endpoints.push({
          method: 'GET',
          path: this.normalizePath(routePath),
          framework: 'Next.js',
          evidence: filePath,
          confidence: 'high'
        });
        if (!frameworks.includes('Next.js')) frameworks.push('Next.js');
      }

      // App Router API: app/api/.../route.ts
      if ((lower.startsWith('app/api/') || lower.includes('/app/api/')) && lower.endsWith('route.ts')) {
        const relativeApi = filePath.substring(filePath.toLowerCase().indexOf('app/api/') + 7);
        const routePath = '/api/' + relativeApi.replace(/\/route\.(ts|js)$/, '');

        // Check if file content has explicit method exports
        const fileContent = evidence.fileContents.find((f) => f.path === filePath);
        if (fileContent && fileContent.content) {
          const methodsFound: HttpMethod[] = [];
          for (const m of ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) {
            if (new RegExp(`export\\s+(?:async\\s+)?function\\s+${m}\\b`).test(fileContent.content)) {
              methodsFound.push(m as HttpMethod);
            }
          }
          if (methodsFound.length > 0) {
            for (const method of methodsFound) {
              endpoints.push({
                method,
                path: this.normalizePath(routePath),
                framework: 'Next.js',
                evidence: filePath,
                confidence: 'high'
              });
            }
          } else {
            endpoints.push({
              method: 'GET',
              path: this.normalizePath(routePath),
              framework: 'Next.js',
              evidence: filePath,
              confidence: 'high'
            });
          }
        } else {
          endpoints.push({
            method: 'GET',
            path: this.normalizePath(routePath),
            framework: 'Next.js',
            evidence: filePath,
            confidence: 'high'
          });
        }
        if (!frameworks.includes('Next.js')) frameworks.push('Next.js');
      }
    }
  }

  /**
   * Normalizes path string cleanly ensuring a single leading slash.
   */
  private normalizePath(p: string): string {
    if (!p) return '/';
    let trimmed = p.trim();
    if (!trimmed.startsWith('/')) {
      trimmed = '/' + trimmed;
    }
    // Remove duplicate slashes
    return trimmed.replace(/\/+/g, '/');
  }

  /**
   * Combines controller/class prefix path with method route path cleanly.
   */
  private combinePaths(prefix: string, path: string): string {
    const cleanPrefix = prefix ? this.normalizePath(prefix).replace(/\/$/, '') : '';
    const cleanPath = path ? this.normalizePath(path) : '';
    if (!cleanPrefix) return cleanPath || '/';
    if (!cleanPath || cleanPath === '/') return cleanPrefix;
    return `${cleanPrefix}${cleanPath}`;
  }

  /**
   * Validates if method is a supported HttpMethod string.
   */
  private isValidHttpMethod(m: string): boolean {
    return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].includes(m);
  }

  /**
   * Deduplicates endpoints by method + path + framework + evidence.
   */
  private deduplicateEndpoints(raw: ApiEndpoint[]): ApiEndpoint[] {
    const map = new Map<string, ApiEndpoint>();
    for (const item of raw) {
      const key = `${item.method}:${item.path}:${item.framework || 'unknown'}:${item.evidence}`;
      if (!map.has(key)) {
        map.set(key, { ...item });
      }
    }
    return Array.from(map.values());
  }

  /**
   * Deduplicates specifications by path + type.
   */
  private deduplicateSpecifications(raw: ApiSpecification[]): ApiSpecification[] {
    const map = new Map<string, ApiSpecification>();
    for (const item of raw) {
      const key = `${item.path}:${item.type}`;
      if (!map.has(key)) {
        map.set(key, { ...item });
      }
    }
    return Array.from(map.values());
  }
}

export const apiService = new ApiService();
