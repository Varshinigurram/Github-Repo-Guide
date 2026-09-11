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
  pushedAt?: string;
  updatedAt?: string;
  archived?: boolean;
  disabled?: boolean;
  openIssues?: number;
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
 * Overview section of AI repository interpretation.
 */
export interface OverviewAnalysis {
  summary: string;
  purpose: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * How it works section of AI repository interpretation.
 */
export interface HowItWorksAnalysis {
  description: string;
  steps: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Interpreted technology role in AI repository interpretation.
 */
export interface TechnologyRoleAnalysis {
  name: string;
  role: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

/**
 * Architecture component in AI repository interpretation.
 */
export interface ArchitectureComponent {
  name: string;
  role: string;
  evidence: string[];
}

/**
 * Architecture section of AI repository interpretation.
 */
export interface ArchitectureAnalysis {
  style: string;
  components: ArchitectureComponent[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Entry point analysis in AI repository interpretation.
 */
export interface EntryPointAnalysis {
  path: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Setup steps and commands in AI repository interpretation.
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

/**
 * Status levels for health categories.
 */
export type HealthCategoryStatus = 'strong' | 'good' | 'fair' | 'weak';

/**
 * Letter grades for overall repository health.
 */
export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Individual health category evaluation score.
 */
export interface HealthCategoryScore {
  name: string;
  score: number;
  maxScore: number;
  status: HealthCategoryStatus;
  evidence: string[];
}

/**
 * Deterministic repository health analysis output produced by Step 8B.
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

/**
 * Supported node types for architecture visualization graph.
 */
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

/**
 * Individual node in the architecture graph.
 */
export interface ArchitectureNode {
  id: string;
  label: string;
  type: ArchitectureNodeType;
  technologies: string[];
  evidence: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Individual directed edge between nodes in the architecture graph.
 */
export interface ArchitectureEdge {
  source: string;
  target: string;
  label: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

/**
 * Deterministic architecture graph visualization payload produced by Step 9.
 */
export interface RepositoryArchitectureResult {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  limitations: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Supported HTTP methods for API endpoint detection.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/**
 * Individual API endpoint route detection.
 */
export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  framework?: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * API Specification / Schema file detection.
 */
export interface ApiSpecification {
  path: string;
  type: 'OpenAPI' | 'Swagger' | 'GraphQL' | 'gRPC';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Deterministic API / Endpoint detection payload produced by Step 10.
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
 * Standard error response structure for API failures.
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Expected request body payload for POST /api/ask.
 */
export interface AskRequest {
  url: string;
  question: string;
}

/**
 * Cited repository evidence item supporting an Ask Repository answer.
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



