import { Octokit } from 'octokit';
import {
  RepositoryMetadata,
  RepositoryStructure,
  RepositoryFileContents,
  FileContentEvidence,
  FileItem,
  DirectoryItem
} from '../types/repository.types.js';

/**
 * Custom error class for GitHub Service operations.
 */
export class GitHubServiceError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'GitHubServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Service for communicating with GitHub REST API via Octokit.
 * Implements in-memory rate-limit pre-flight checking, header parsing, and safe dev-only logging.
 */
class GitHubService {
  private octokitInstance: Octokit | null = null;
  private currentToken: string | null = null;

  // In-memory rate-limit tracking state
  private rateLimitLimit: number | null = null;
  private rateLimitRemaining: number | null = null;
  private rateLimitReset: number | null = null; // epoch timestamp in ms
  private secondaryBlockUntil: number | null = null; // epoch timestamp in ms

  /**
   * Lazily resolves Octokit instance using process.env.GITHUB_TOKEN.
   * Re-initializes instance if token value changes at runtime.
   */
  private get octokit(): Octokit {
    const activeToken = process.env.GITHUB_TOKEN?.trim() || null;
    if (!this.octokitInstance || this.currentToken !== activeToken) {
      this.currentToken = activeToken;
      this.octokitInstance = new Octokit({
        auth: activeToken || undefined
      });
    }
    return this.octokitInstance;
  }

  /**
   * Pre-flight check to block requests early if backend knows primary or secondary rate limit is active.
   */
  public checkRateLimitPreflight(): void {
    const now = Date.now();

    // 1. Check secondary rate limit block (from retry-after header)
    if (this.secondaryBlockUntil && now < this.secondaryBlockUntil) {
      const waitSeconds = Math.max(1, Math.ceil((this.secondaryBlockUntil - now) / 1000));
      throw new GitHubServiceError(
        `GitHub API secondary rate limit triggered. Please retry after ${waitSeconds} seconds.`,
        429,
        'GITHUB_RATE_LIMITED'
      );
    }

    // 2. Check primary rate limit exhaustion (x-ratelimit-remaining === 0)
    if (this.rateLimitRemaining === 0 && this.rateLimitReset && now < this.rateLimitReset) {
      const resetSeconds = Math.max(1, Math.ceil((this.rateLimitReset - now) / 1000));
      throw new GitHubServiceError(
        `GitHub API rate limit reached. Reset in ${resetSeconds} seconds. Please try again later.`,
        429,
        'GITHUB_RATE_LIMITED'
      );
    }
  }

  /**
   * Parses GitHub API response headers to update in-memory rate limit state and perform safe dev-only logging.
   * NEVER logs tokens, Authorization headers, or credentials.
   */
  private updateRateLimitState(path: string, status: number, headers: Record<string, any>): void {
    if (!headers) return;

    // Normalize header lookup
    const getHeader = (name: string): string | undefined => {
      const lower = name.toLowerCase();
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lower && value !== undefined && value !== null) {
          return String(value);
        }
      }
      return undefined;
    };

    const limitVal = getHeader('x-ratelimit-limit');
    const remainingVal = getHeader('x-ratelimit-remaining');
    const resetVal = getHeader('x-ratelimit-reset');
    const retryAfterVal = getHeader('retry-after');

    if (limitVal !== undefined) {
      const parsed = parseInt(limitVal, 10);
      if (!isNaN(parsed)) this.rateLimitLimit = parsed;
    }

    if (remainingVal !== undefined) {
      const parsed = parseInt(remainingVal, 10);
      if (!isNaN(parsed)) this.rateLimitRemaining = parsed;
    }

    if (resetVal !== undefined) {
      const resetEpochSec = parseInt(resetVal, 10);
      if (!isNaN(resetEpochSec)) {
        this.rateLimitReset = resetEpochSec * 1000;
      }
    }

    if (retryAfterVal !== undefined) {
      const retrySec = parseInt(retryAfterVal, 10);
      if (!isNaN(retrySec) && retrySec > 0) {
        this.secondaryBlockUntil = Date.now() + (retrySec * 1000);
      }
    }

    // Diagnostic logging strictly in development mode
    if (process.env.NODE_ENV !== 'production') {
      const remainingStr = this.rateLimitRemaining !== null ? `${this.rateLimitRemaining}` : 'unknown';
      const limitStr = this.rateLimitLimit !== null ? `${this.rateLimitLimit}` : 'unknown';
      const resetInSec = this.rateLimitReset ? Math.max(0, Math.ceil((this.rateLimitReset - Date.now()) / 1000)) : 0;

      console.log(
        `[github] ${path} (status: ${status}) - remaining: ${remainingStr}/${limitStr}, resetIn: ${resetInSec}s`
      );

      if (this.secondaryBlockUntil && Date.now() < this.secondaryBlockUntil) {
        const secWait = Math.ceil((this.secondaryBlockUntil - Date.now()) / 1000);
        console.warn(`[github] Secondary rate limit active! Retry after ${secWait}s`);
      }
    }
  }

  /**
   * Safe helper method to inspect current GitHub API rate limit state and token validity.
   * NEVER logs or returns sensitive tokens.
   */
  public async getAuthenticationStatus(): Promise<{
    authenticated: boolean;
    limit: number | null;
    remaining: number | null;
    reset: string | null;
  }> {
    const hasToken = Boolean(process.env.GITHUB_TOKEN?.trim());
    try {
      const response = await this.octokit.rest.rateLimit.get();
      this.updateRateLimitState('/rate_limit', response.status, response.headers);

      const core = response.data.resources?.core || response.data.rate;
      const limit = core ? core.limit : this.rateLimitLimit;
      const remaining = core ? core.remaining : this.rateLimitRemaining;
      const resetIso = core ? new Date(core.reset * 1000).toISOString() : (this.rateLimitReset ? new Date(this.rateLimitReset).toISOString() : null);

      return {
        authenticated: hasToken && (limit ? limit > 60 : false),
        limit,
        remaining,
        reset: resetIso
      };
    } catch (error: any) {
      const headers = error.response?.headers || {};
      this.updateRateLimitState('/rate_limit', error.status || 500, headers);

      return {
        authenticated: hasToken,
        limit: this.rateLimitLimit,
        remaining: this.rateLimitRemaining,
        reset: this.rateLimitReset ? new Date(this.rateLimitReset).toISOString() : null
      };
    }
  }

  /**
   * Handles and maps Octokit API errors to structured GitHubServiceError after updating rate limit state.
   */
  private handleApiError(error: any, path: string, defaultMessage: string, defaultCode: string): GitHubServiceError {
    const status = error.status || error.statusCode || 500;
    const headers = error.response?.headers || {};

    this.updateRateLimitState(path, status, headers);

    if (status === 404) {
      return new GitHubServiceError(
        'The GitHub repository could not be found.',
        404,
        'REPOSITORY_NOT_FOUND'
      );
    }

    if (status === 401) {
      return new GitHubServiceError(
        'GitHub API authentication failed or token is invalid.',
        500,
        'GITHUB_CONFIG_ERROR'
      );
    }

    if (
      status === 403 ||
      status === 429 ||
      (error.message && (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('quota')))
    ) {
      return new GitHubServiceError(
        'GitHub API rate limit reached. Please try again later.',
        429,
        'GITHUB_RATE_LIMITED'
      );
    }

    return new GitHubServiceError(
      defaultMessage,
      status >= 400 && status < 600 ? status : 502,
      defaultCode
    );
  }

  /**
   * Fetches repository metadata from GitHub REST API.
   * 
   * @param owner GitHub username or organization name
   * @param repo Repository name
   */
  public async fetchRepositoryMetadata(owner: string, repo: string): Promise<RepositoryMetadata> {
    this.checkRateLimitPreflight();
    const reqPath = `GET /repos/${owner}/${repo}`;

    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo
      });

      this.updateRateLimitState(reqPath, response.status, response.headers);
      const data = response.data;

      // Extract license identifier safely
      let licenseName: string | null = null;
      if (data.license) {
        licenseName = data.license.spdx_id && data.license.spdx_id !== 'NOASSERTION'
          ? data.license.spdx_id
          : data.license.name || null;
      }

      // Map GitHub API response to clean RepositoryMetadata format
      const metadata: RepositoryMetadata = {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        owner: data.owner.login,
        description: data.description ?? null,
        url: data.html_url,
        cloneUrl: data.clone_url,
        isPrivate: data.private,
        isFork: data.fork,
        language: data.language ?? null,
        stars: data.stargazers_count,
        forks: data.forks_count,
        watchers: data.watchers_count,
        openIssues: data.open_issues_count,
        defaultBranch: data.default_branch,
        topics: Array.isArray(data.topics) ? data.topics : [],
        license: licenseName,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        pushedAt: data.pushed_at,
        archived: data.archived ?? false,
        disabled: data.disabled ?? false,
        size: data.size
      };

      return metadata;
    } catch (error: any) {
      throw this.handleApiError(
        error,
        reqPath,
        'Unable to retrieve repository information from GitHub.',
        'GITHUB_API_ERROR'
      );
    }
  }

  /**
   * Fetches the repository file and directory tree recursively using GitHub Git Trees API.
   * Bounds returned files/directories and prioritizes important config/manifest files.
   * 
   * @param owner GitHub username or organization name
   * @param repo Repository name
   * @param defaultBranch Default branch name (e.g. 'main', 'master')
   */
  public async fetchRepositoryTree(
    owner: string,
    repo: string,
    defaultBranch: string
  ): Promise<RepositoryStructure> {
    this.checkRateLimitPreflight();
    const reqPath = `GET /repos/${owner}/${repo}/git/trees/${defaultBranch}`;

    try {
      const response = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: '1'
      });

      this.updateRateLimitState(reqPath, response.status, response.headers);

      const rawTree = Array.isArray(response.data.tree) ? response.data.tree : [];
      const isTruncated = Boolean(response.data.truncated);

      const allFiles: FileItem[] = [];
      const allDirectories: DirectoryItem[] = [];

      for (const item of rawTree) {
        if (!item.path) continue;

        if (item.type === 'blob') {
          allFiles.push({
            path: item.path,
            type: 'file',
            ...(typeof item.size === 'number' ? { size: item.size } : {})
          });
        } else if (item.type === 'tree') {
          allDirectories.push({
            path: item.path,
            type: 'directory'
          });
        }
      }

      const totalFiles = allFiles.length;
      const totalDirectories = allDirectories.length;

      const MAX_RETURNED_FILES = 500;
      const MAX_RETURNED_DIRECTORIES = 300;
      const MAX_IMPORTANT_FILES = 40;

      const responseLimited = totalFiles > MAX_RETURNED_FILES || totalDirectories > MAX_RETURNED_DIRECTORIES;

      const boundedFiles = allFiles.slice(0, MAX_RETURNED_FILES);
      const boundedDirectories = allDirectories.slice(0, MAX_RETURNED_DIRECTORIES);

      // Rank & score important files that physically exist in the tree
      const scoredImportantFiles = allFiles
        .map(file => ({ path: file.path, score: this.scoreImportantFile(file.path) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || a.path.length - b.path.length || a.path.localeCompare(b.path));

      const importantFiles = Array.from(new Set(scoredImportantFiles.map(i => i.path))).slice(0, MAX_IMPORTANT_FILES);

      return {
        totalFiles,
        returnedFiles: boundedFiles.length,
        totalDirectories,
        returnedDirectories: boundedDirectories.length,
        truncated: isTruncated,
        responseLimited,
        files: boundedFiles,
        directories: boundedDirectories,
        importantFiles
      };
    } catch (error: any) {
      throw this.handleApiError(
        error,
        reqPath,
        'Unable to retrieve repository structure from GitHub.',
        'GITHUB_API_ERROR'
      );
    }
  }

  /**
   * Fetches, decodes, and bounds text content for up to 10 selected important repository files.
   * Performs strictly sequential requests (one active request at a time) to avoid secondary rate limits.
   * 
   * @param owner GitHub username or organization name
   * @param repo Repository name
   * @param defaultBranch Default branch name
   * @param candidateImportantFiles Ranked array of candidate file paths from tree structure
   */
  public async fetchImportantFileContents(
    owner: string,
    repo: string,
    defaultBranch: string,
    candidateImportantFiles: string[]
  ): Promise<RepositoryFileContents> {
    const MAX_FILES_TO_FETCH = 10;
    const MAX_FILE_CONTENT_BYTES = 50 * 1024; // 50 KB
    const MAX_TOTAL_CONTENT_BYTES = 500 * 1024; // 500 KB

    // Sort candidates prioritizing root-level manifests & configs
    const prioritizedPaths = Array.from(new Set(candidateImportantFiles))
      .map(path => ({ path, score: this.scoreImportantFile(path) }))
      .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
      .map(item => item.path)
      .slice(0, MAX_FILES_TO_FETCH);

    const fileEvidences: FileContentEvidence[] = [];
    let fetchedFiles = 0;
    let skippedFiles = 0;
    let truncatedFiles = 0;
    let totalContentBytes = 0;
    let contentLimited = false;

    // Strictly sequential for...of loop — only ONE active GitHub API request at a time
    for (const filePath of prioritizedPaths) {
      // Check preflight rate limit before each file request
      this.checkRateLimitPreflight();

      // 1. Check cumulative total content byte budget
      if (totalContentBytes >= MAX_TOTAL_CONTENT_BYTES) {
        contentLimited = true;
        fileEvidences.push({
          path: filePath,
          size: 0,
          content: null,
          truncated: false,
          fetched: false,
          skipReason: 'content_budget_exceeded'
        });
        skippedFiles++;
        continue;
      }

      // 2. Check binary extensions before API call
      if (this.isBinaryFilePath(filePath)) {
        fileEvidences.push({
          path: filePath,
          size: 0,
          content: null,
          truncated: false,
          fetched: false,
          skipReason: 'binary_or_unsupported'
        });
        skippedFiles++;
        continue;
      }

      const reqPath = `GET /repos/${owner}/${repo}/contents/${filePath}`;

      try {
        const response = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: defaultBranch
        });

        this.updateRateLimitState(reqPath, response.status, response.headers);
        const data = response.data;

        // If GitHub returns an array (directory) or missing file object
        if (!data || Array.isArray(data) || data.type !== 'file') {
          fileEvidences.push({
            path: filePath,
            size: Array.isArray(data) ? 0 : (data as any)?.size || 0,
            content: null,
            truncated: false,
            fetched: false,
            skipReason: 'not_a_file'
          });
          skippedFiles++;
          continue;
        }

        const rawContent = data.content || '';
        const originalSize = data.size || 0;

        if (!rawContent) {
          fileEvidences.push({
            path: filePath,
            size: originalSize,
            content: '',
            truncated: false,
            fetched: true
          });
          fetchedFiles++;
          continue;
        }

        // Decode base64 to Buffer
        const contentBuffer = Buffer.from(rawContent, 'base64');

        // Check if buffer contains binary characters
        if (this.isBinaryBuffer(contentBuffer)) {
          fileEvidences.push({
            path: filePath,
            size: originalSize,
            content: null,
            truncated: false,
            fetched: false,
            skipReason: 'binary_or_unsupported'
          });
          skippedFiles++;
          continue;
        }

        let utf8Text = contentBuffer.toString('utf-8');
        let textByteLength = Buffer.byteLength(utf8Text, 'utf8');
        let isFileTruncated = false;

        // Truncate individual file if it exceeds 50 KB
        if (textByteLength > MAX_FILE_CONTENT_BYTES) {
          const slicedBuffer = Buffer.from(utf8Text, 'utf8').subarray(0, MAX_FILE_CONTENT_BYTES);
          utf8Text = slicedBuffer.toString('utf8');
          textByteLength = Buffer.byteLength(utf8Text, 'utf8');
          isFileTruncated = true;
          truncatedFiles++;
        }

        // Check hard total content budget limit
        if (totalContentBytes + textByteLength > MAX_TOTAL_CONTENT_BYTES) {
          contentLimited = true;
          fileEvidences.push({
            path: filePath,
            size: originalSize,
            content: null,
            truncated: false,
            fetched: false,
            skipReason: 'content_budget_exceeded'
          });
          skippedFiles++;
          continue;
        }

        totalContentBytes += textByteLength;
        fetchedFiles++;
        fileEvidences.push({
          path: filePath,
          size: originalSize,
          content: utf8Text,
          truncated: isFileTruncated,
          fetched: true
        });
      } catch (error: any) {
        const status = error.status || error.statusCode;

        // Rate limit / Quota check during file content request — rethrow to trigger 429
        if (
          status === 403 ||
          status === 429 ||
          (error.message && (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('quota')))
        ) {
          throw this.handleApiError(
            error,
            reqPath,
            'GitHub API rate limit reached. Please try again later.',
            'GITHUB_RATE_LIMITED'
          );
        }

        // Individual file fetch failure (e.g. 404) — record skipped file without aborting analysis
        this.updateRateLimitState(reqPath, status || 500, error.response?.headers || {});
        fileEvidences.push({
          path: filePath,
          size: 0,
          content: null,
          truncated: false,
          fetched: false,
          skipReason: status === 404 ? 'file_not_found' : 'fetch_failed'
        });
        skippedFiles++;
      }
    }

    return {
      files: fileEvidences,
      fetchedFiles,
      skippedFiles,
      truncatedFiles,
      totalContentBytes,
      contentLimited
    };
  }

  /**
   * Helper method to score and prioritize important configuration, manifest, or entry-point files.
   */
  private scoreImportantFile(filePath: string): number {
    const normalized = filePath.trim().toLowerCase();
    const segments = normalized.split('/');
    const filename = segments[segments.length - 1];
    const depth = segments.length - 1;

    // Priority 1 (Highest): Core manifests & README (Root preferred)
    const priority1Set = new Set([
      'readme.md', 'readme', 'readme.txt', 'readme.rst',
      'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
      'requirements.txt', 'pyproject.toml', 'pipfile',
      'pom.xml', 'build.gradle', 'build.gradle.kts',
      'cargo.toml', 'go.mod', 'composer.json',
      'dockerfile', 'docker-compose.yml', 'docker-compose.yaml'
    ]);

    if (priority1Set.has(filename)) {
      return depth === 0 ? 2000 : 1800 - depth * 10;
    }

    // Priority 2: Build / tool / workspace configs
    const priority2Exact = new Set(['tsconfig.json', 'angular.json', 'makefile']);
    const priority2Prefixes = [
      'vite.config.', 'next.config.', 'webpack.config.',
      'rollup.config.', 'babel.config.', 'jest.config.', 'vitest.config.', 'tailwind.config.'
    ];

    if (priority2Exact.has(filename) || priority2Prefixes.some(p => filename.startsWith(p))) {
      return depth === 0 ? 1500 : 1400 - depth * 10;
    }

    // Priority 3: Primary entry points & main source files
    const priority3Files = new Set([
      'index.ts', 'index.js', 'index.jsx', 'index.tsx', 'index.html',
      'main.ts', 'main.js', 'main.go', 'main.py', 'main.rs', 'main.cpp',
      'app.ts', 'app.js', 'app.py', 'server.ts', 'server.js',
      'page.tsx', 'page.jsx', 'page.js', 'layout.tsx', 'layout.jsx'
    ]);

    if (priority3Files.has(filename)) {
      return depth <= 2 ? 1200 - depth * 10 : 800 - depth * 10;
    }

    return 0;
  }

  /**
   * Helper method to detect known binary file extensions.
   */
  private isBinaryFilePath(filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext) return false;

    const binaryExtensions = new Set([
      'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'webp', 'pdf',
      'zip', 'tar', 'gz', '7z', 'rar', 'exe', 'dll', 'so', 'dylib',
      'woff', 'woff2', 'ttf', 'eot', 'mp3', 'mp4', 'wav', 'mov', 'avi',
      'pyc', 'class', 'jar', 'bin', 'iso', 'lock'
    ]);

    return binaryExtensions.has(ext);
  }

  /**
   * Helper method to inspect Buffer bytes for binary null-byte control characters.
   */
  private isBinaryBuffer(buffer: Buffer): boolean {
    const checkLen = Math.min(buffer.length, 1024);
    for (let i = 0; i < checkLen; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  }
}

export const githubService = new GitHubService();

