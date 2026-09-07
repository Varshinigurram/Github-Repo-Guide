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
 */
class GitHubService {
  private octokit: Octokit;

  constructor() {
    const token = process.env.GITHUB_TOKEN?.trim();
    this.octokit = new Octokit({
      auth: token || undefined
    });
  }

  /**
   * Fetches repository metadata from GitHub REST API.
   * 
   * @param owner GitHub username or organization name
   * @param repo Repository name
   */
  public async fetchRepositoryMetadata(owner: string, repo: string): Promise<RepositoryMetadata> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo
      });

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
      const status = error.status || error.statusCode;

      if (status === 404) {
        throw new GitHubServiceError(
          'The GitHub repository could not be found.',
          404,
          'REPOSITORY_NOT_FOUND'
        );
      }

      if (status === 401) {
        throw new GitHubServiceError(
          'GitHub API authentication failed or token is invalid.',
          500,
          'GITHUB_CONFIG_ERROR'
        );
      }

      if (status === 403 || status === 429 || (error.message && (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('quota')))) {
        throw new GitHubServiceError(
          'GitHub API rate limit reached. Please try again later.',
          429,
          'GITHUB_RATE_LIMITED'
        );
      }

      throw new GitHubServiceError(
        'Unable to retrieve repository information from GitHub.',
        502,
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
    try {
      const response = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: '1'
      });

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
      const status = error.status || error.statusCode;

      if (status === 404) {
        throw new GitHubServiceError(
          'The repository tree could not be found.',
          404,
          'REPOSITORY_NOT_FOUND'
        );
      }

      if (status === 401) {
        throw new GitHubServiceError(
          'GitHub API authentication failed or token is invalid.',
          500,
          'GITHUB_CONFIG_ERROR'
        );
      }

      if (status === 403 || status === 429 || (error.message && (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('quota')))) {
        throw new GitHubServiceError(
          'GitHub API rate limit reached. Please try again later.',
          429,
          'GITHUB_RATE_LIMITED'
        );
      }

      throw new GitHubServiceError(
        'Unable to retrieve repository structure from GitHub.',
        502,
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

      try {
        const response = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: defaultBranch
        });

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

        // Rate limit / Quota check during file content request
        if (status === 403 || status === 429 || (error.message && (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('quota')))) {
          throw new GitHubServiceError(
            'GitHub API rate limit reached. Please try again later.',
            429,
            'GITHUB_RATE_LIMITED'
          );
        }

        // Individual file fetch failure (e.g. 404)
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
