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
 * Represents a file item in the repository structure.
 */
export interface FileItem {
  path: string;
  type: 'file';
  size?: number;
}

/**
 * Represents a directory item in the repository structure.
 */
export interface DirectoryItem {
  path: string;
  type: 'directory';
}

/**
 * Represents the extracted repository structure and file tree.
 */
export interface RepositoryStructure {
  totalFiles: number;
  returnedFiles: number;
  totalDirectories: number;
  returnedDirectories: number;
  truncated: boolean;
  responseLimited: boolean;
  files: FileItem[];
  directories: DirectoryItem[];
  importantFiles: string[];
}

/**
 * Represents extracted text evidence from an important repository file.
 */
export interface FileContentEvidence {
  path: string;
  size: number;
  content: string | null;
  truncated: boolean;
  fetched: boolean;
  skipReason?: string;
}

/**
 * Collection of extracted important file contents and summary metrics.
 */
export interface RepositoryFileContents {
  files: FileContentEvidence[];
  fetchedFiles: number;
  skippedFiles: number;
  truncatedFiles: number;
  totalContentBytes: number;
  contentLimited: boolean;
}

/**
 * Represents a detected technology with evidence and confidence score.
 */
export interface DetectedTechnology {
  name: string;
  category: string;
  confidence: 'high' | 'likely' | 'possible';
  evidence: string[];
}

/**
 * Represents an extracted dependency from a project manifest file.
 */
export interface ExtractedDependency {
  name: string;
  version?: string;
  source: string;
  category?: 'production' | 'development';
}

/**
 * Full technology analysis result.
 */
export interface TechnologyAnalysisResult {
  languages: DetectedTechnology[];
  frameworks: DetectedTechnology[];
  runtimes: DetectedTechnology[];
  packageManagers: DetectedTechnology[];
  databases: DetectedTechnology[];
  buildTools: DetectedTechnology[];
  testingTools: DetectedTechnology[];
  styling: DetectedTechnology[];
  containerization: DetectedTechnology[];
  dependencies: ExtractedDependency[];
}

/**
 * Successful response payload for POST /api/analyze.
 */
export interface AnalyzeSuccessResponse {
  success: true;
  data: {
    repository: RepositoryMetadata;
    structure: RepositoryStructure;
    fileContents: RepositoryFileContents;
    technologies: TechnologyAnalysisResult;
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
