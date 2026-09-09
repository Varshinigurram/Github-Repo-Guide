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
 * Represents evidence for a potential entry-point candidate file.
 */
export interface EntryPointEvidence {
  path: string;
  reason: string;
  source?: string;
}

/**
 * Represents evidence for a configuration file present in the repository.
 */
export interface ConfigFileEvidence {
  path: string;
  type: string;
}

/**
 * Represents evidence for a dependency manifest file present in the repository.
 */
export interface ManifestEvidence {
  path: string;
  type: string;
}

/**
 * Represents evidence for a documentation file present in the repository.
 */
export interface DocEvidence {
  path: string;
  type: string;
}

/**
 * Summary metrics exposing repository and evidence completeness or truncation status.
 */
export interface EvidenceCompleteness {
  responseLimited: boolean;
  contentLimited: boolean;
  treeTruncated: boolean;
  fetchedFilesCount: number;
  skippedFilesCount: number;
  truncatedFilesCount: number;
  totalContentBytes: number;
}

/**
 * Bounded summary metadata of repository information for downstream analysis.
 */
export interface EvidenceRepositorySummary {
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  primaryLanguage: string | null;
  license: string | null;
  topics: string[];
  url: string;
}

/**
 * Bounded summary metadata of structure information for downstream analysis.
 */
export interface EvidenceStructureSummary {
  totalFiles: number;
  totalDirectories: number;
  importantFiles: string[];
  returnedFiles: number;
  returnedDirectories: number;
  truncated: boolean;
  responseLimited: boolean;
}

/**
 * Structured evidence package aggregating all deterministic evidence for downstream analysis.
 */
export interface RepositoryEvidencePackage {
  repository: EvidenceRepositorySummary;
  structure: EvidenceStructureSummary;
  technologies: TechnologyAnalysisResult;
  fileContents: FileContentEvidence[];
  entryPoints: EntryPointEvidence[];
  configFiles: ConfigFileEvidence[];
  manifestFiles: ManifestEvidence[];
  documentationFiles: DocEvidence[];
  completeness: EvidenceCompleteness;
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
    evidence: RepositoryEvidencePackage;
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
