/**
 * Represents parsed and normalized GitHub repository URL information.
 */
export interface ParsedRepository {
  owner: string;
  repository: string;
  url: string;
}

/**
 * Expected request body payload for POST /api/analyze.
 */
export interface AnalyzeRepositoryRequest {
  url: string;
}

/**
 * Clean internal TypeScript interface for GitHub repository metadata.
 */
export interface RepositoryMetadata {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  url: string;
  cloneUrl: string;
  isPrivate: boolean;
  isFork: boolean;
  language: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  defaultBranch: string;
  topics: string[];
  license: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  archived: boolean;
  disabled: boolean;
  size: number;
}

/**
 * Successful response payload for POST /api/analyze.
 */
export interface AnalyzeSuccessResponse {
  success: true;
  data: {
    repository: RepositoryMetadata;
  };
}

/**
 * Standard error response structure for API failures.
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
