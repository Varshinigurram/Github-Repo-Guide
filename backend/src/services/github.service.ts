import { Octokit } from 'octokit';
import { RepositoryMetadata } from '../types/repository.types';

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

      if (status === 403 || status === 429) {
        const message = (error.message && error.message.toLowerCase().includes('rate limit')) || status === 429
          ? 'GitHub API rate limit reached. Please try again later.'
          : 'GitHub API rate limit reached. Please try again later.';

        throw new GitHubServiceError(
          message,
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
}

export const githubService = new GitHubService();
