/**
 * Response format for GET /api/health endpoint.
 */
export interface HealthStatusResponse {
  status: string;
  service: string;
}

/**
 * Standard error response structure returned by backend for API failures.
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Custom error class for frontend API failures.
 */
export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, code: string = 'API_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Expected request body payload for POST /api/analyze.
 */
export interface AnalyzeRepositoryRequest {
  url: string;
}

/**
 * Clean TypeScript interface for GitHub repository metadata.
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
 * File item in repository structure tree.
 */
export interface FileItem {
  path: string;
  type: 'file';
  size?: number;
}

/**
 * Directory item in repository structure tree.
 */
export interface DirectoryItem {
  path: string;
  type: 'directory';
}

/**
 * Extracted repository file structure and tree summary.
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
 * Text evidence extracted from an important file.
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
 * Collection of extracted file contents and metrics.
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
 * Detected technology with evidence and confidence score.
 */
export interface DetectedTechnology {
  name: string;
  category: string;
  confidence: 'high' | 'likely' | 'possible';
  evidence: string[];
}

/**
 * Dependency extracted from project manifests.
 */
export interface ExtractedDependency {
  name: string;
  version?: string;
  source: string;
  category?: 'production' | 'development';
}

/**
 * Technology detection analysis output.
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
 * Potential entry-point candidate evidence item.
 */
export interface EntryPointEvidence {
  path: string;
  reason: string;
  source?: string;
}

/**
 * Config file evidence item.
 */
export interface ConfigFileEvidence {
  path: string;
  type: string;
}

/**
 * Manifest file evidence item.
 */
export interface ManifestEvidence {
  path: string;
  type: string;
}

/**
 * Documentation file evidence item.
 */
export interface DocEvidence {
  path: string;
  type: string;
}

/**
 * Evidence completeness & truncation metrics.
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
 * Bounded summary of repository metadata for evidence package.
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
  pushedAt?: string;
  updatedAt?: string;
  archived?: boolean;
  disabled?: boolean;
  openIssues?: number;
}

/**
 * Bounded summary of repository structure for evidence package.
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
 * Aggregated evidence package payload.
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
 * Overview section of AI analysis.
 */
export interface OverviewAnalysis {
  summary: string;
  purpose: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * How it works section of AI analysis.
 */
export interface HowItWorksAnalysis {
  description: string;
  steps: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Interpreted technology role in AI analysis.
 */
export interface TechnologyRoleAnalysis {
  name: string;
  role: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

/**
 * Architecture component in AI analysis.
 */
export interface ArchitectureComponent {
  name: string;
  role: string;
  evidence: string[];
}

/**
 * Architecture section of AI analysis.
 */
export interface ArchitectureAnalysis {
  style: string;
  components: ArchitectureComponent[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Entry point analysis in AI output.
 */
export interface EntryPointAnalysis {
  path: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Setup steps and commands in AI output.
 */
export interface SetupAnalysis {
  steps: string[];
  commands: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Full structured AI interpretation output produced by Step 8A.
 */
export interface RepositoryAIAnalysis {
  overview: OverviewAnalysis;
  howItWorks: HowItWorksAnalysis;
  technologies: TechnologyRoleAnalysis[];
  architecture: ArchitectureAnalysis;
  entryPoints: EntryPointAnalysis[];
  setup: SetupAnalysis;
  limitations: string[];
}

export type HealthCategoryStatus = 'strong' | 'good' | 'fair' | 'weak';
export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface HealthCategoryScore {
  name: string;
  score: number;
  maxScore: number;
  status: HealthCategoryStatus;
  evidence: string[];
}

/**
 * Repository health analysis payload produced by Step 8B.
 */
export interface RepositoryHealthResult {
  score: number;
  grade: HealthGrade;
  summary: string;
  categories: HealthCategoryScore[];
  strengths: string[];
  improvements: string[];
  limitations: string[];
}

export type ArchitectureNodeType =
  | 'frontend'
  | 'backend'
  | 'api'
  | 'database'
  | 'cache'
  | 'queue'
  | 'worker'
  | 'external_service'
  | 'build'
  | 'deployment'
  | 'storage'
  | 'authentication'
  | 'unknown';

export interface ArchitectureNode {
  id: string;
  label: string;
  type: ArchitectureNodeType;
  technologies: string[];
  evidence: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ArchitectureEdge {
  source: string;
  target: string;
  label: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

/**
 * Architecture visualization payload produced by Step 9.
 */
export interface RepositoryArchitectureResult {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  limitations: string[];
  confidence: 'high' | 'medium' | 'low';
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  framework?: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ApiSpecification {
  path: string;
  type: 'OpenAPI' | 'Swagger' | 'GraphQL' | 'gRPC';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * API detection payload produced by Step 10.
 */
export interface RepositoryApiResult {
  frameworks: string[];
  endpoints: ApiEndpoint[];
  specifications: ApiSpecification[];
  limitations: string[];
  confidence: 'high' | 'medium' | 'low';
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
    analysis: RepositoryAIAnalysis;
    health: RepositoryHealthResult;
    architecture: RepositoryArchitectureResult;
    api: RepositoryApiResult;
  };
}

/**
 * Request payload for POST /api/ask.
 */
export interface AskRequest {
  url: string;
  question: string;
}

/**
 * Cited evidence item supporting Ask Repository response.
 */
export interface AskEvidence {
  path: string;
  snippet?: string | null;
  reason: string;
}

/**
 * Grounded AI response payload for POST /api/ask.
 */
export interface RepositoryAskResult {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: AskEvidence[];
  limitations: string[];
}

/**
 * Successful response payload for POST /api/ask.
 */
export interface AskSuccessResponse {
  success: true;
  data: RepositoryAskResult;
}
