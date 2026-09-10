import {
  RepositoryEvidencePackage,
  RepositoryAIAnalysis,
  RepositoryArchitectureResult,
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureNodeType
} from '../types/repository.types.js';

export class ArchitectureService {
  /**
   * Deterministically constructs a compact architecture graph from existing in-memory evidence
   * and optional Step 8A AI analysis.
   *
   * Requirements:
   * - 0 GitHub API calls
   * - 0 AI calls
   * - In-memory deterministic detection
   * - Preserves exact repository-relative evidence paths
   * - Bounded: max 30 nodes, max 50 edges, max 10 items per array field
   */
  public buildArchitecture(
    evidence: RepositoryEvidencePackage,
    aiAnalysis?: RepositoryAIAnalysis
  ): RepositoryArchitectureResult {
    const rawNodes: ArchitectureNode[] = [];
    const rawEdges: ArchitectureEdge[] = [];
    const limitations: string[] = [];

    // Valid paths set for evidence verification
    const validPathsSet = new Set<string>([
      ...evidence.structure.importantFiles,
      ...evidence.fileContents.map((f) => f.path),
      ...evidence.configFiles.map((c) => c.path),
      ...evidence.manifestFiles.map((m) => m.path),
      ...evidence.documentationFiles.map((d) => d.path),
      ...evidence.entryPoints.map((e) => e.path)
    ]);

    // 1. Detect Frontend Node
    this.detectFrontendNode(evidence, validPathsSet, rawNodes);

    // 2. Detect Backend Node
    this.detectBackendNode(evidence, validPathsSet, rawNodes);

    // 3. Detect API Node
    this.detectApiNode(evidence, validPathsSet, rawNodes);

    // 4. Detect Database Node
    this.detectDatabaseNode(evidence, validPathsSet, rawNodes);

    // 5. Detect Cache Node
    this.detectCacheNode(evidence, validPathsSet, rawNodes);

    // 6. Detect Queue / Worker Node
    this.detectWorkerQueueNode(evidence, validPathsSet, rawNodes);

    // 7. Detect Deployment / Containerization Node
    this.detectDeploymentNode(evidence, validPathsSet, rawNodes);

    // 8. Detect Build Node
    this.detectBuildNode(evidence, validPathsSet, rawNodes);

    // 9. Integrate Step 8A AI Architecture Components (if available)
    if (aiAnalysis && aiAnalysis.architecture && Array.isArray(aiAnalysis.architecture.components)) {
      this.integrateAIComponents(aiAnalysis, validPathsSet, rawNodes);
    }

    // Deduplicate & merge nodes
    const nodes = this.deduplicateNodes(rawNodes);

    // 10. Detect Edges between verified nodes based strictly on evidence
    this.detectEdges(evidence, nodes, validPathsSet, rawEdges);

    // Deduplicate & merge edges
    const edges = this.deduplicateEdges(rawEdges, nodes);

    // 11. Completeness Awareness
    const isLimited =
      evidence.completeness.responseLimited ||
      evidence.completeness.contentLimited ||
      evidence.completeness.treeTruncated ||
      evidence.completeness.skippedFilesCount > 0 ||
      evidence.completeness.truncatedFilesCount > 0;

    if (isLimited) {
      limitations.push(
        'Architecture is based on available repository evidence; some components or relationships may not have been observed because repository evidence was incomplete.'
      );
    }

    if (nodes.length === 0) {
      limitations.push(
        'Architecture components were not sufficiently observed in the available repository evidence.'
      );
    }

    // Bounding limits enforcement
    const boundedNodes = nodes.slice(0, 30).map((n) => ({
      ...n,
      technologies: n.technologies.slice(0, 10),
      evidence: n.evidence.slice(0, 10)
    }));

    const boundedEdges = edges.slice(0, 50).map((e) => ({
      ...e,
      evidence: e.evidence.slice(0, 10)
    }));

    const boundedLimitations = Array.from(new Set(limitations)).slice(0, 10);

    // Overall confidence determination
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (boundedNodes.length >= 2 && boundedNodes.some((n) => n.confidence === 'high')) {
      confidence = 'high';
    } else if (boundedNodes.length >= 1) {
      confidence = 'medium';
    }

    return {
      nodes: boundedNodes,
      edges: boundedEdges,
      limitations: boundedLimitations,
      confidence
    };
  }

  /**
   * 1. Detect Frontend Node
   */
  private detectFrontendNode(
    evidence: RepositoryEvidencePackage,
    validPaths: Set<string>,
    nodes: ArchitectureNode[]
  ) {
    const frontendTechs: string[] = [];
    const frontendEvidence: string[] = [];

    // Technologies check
    const techNames = [
      ...evidence.technologies.frameworks.map((f) => f.name),
      ...evidence.technologies.styling.map((s) => s.name),
      ...evidence.technologies.languages.map((l) => l.name)
    ];

    const targetTechs = ['React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Vite', 'Nuxt', 'Tailwind CSS', 'Redux', 'HTML', 'CSS'];
    for (const tech of targetTechs) {
      if (techNames.some((t) => t.toLowerCase() === tech.toLowerCase())) {
        frontendTechs.push(tech);
      }
    }

    // Path check
    for (const path of validPaths) {
      const lower = path.toLowerCase();
      if (
        lower.startsWith('client/') ||
        lower.startsWith('frontend/') ||
        lower.startsWith('web/') ||
        lower.startsWith('ui/') ||
        lower.includes('vite.config.') ||
        lower.includes('next.config.') ||
        lower.includes('tailwind.config.') ||
        lower.includes('src/components/') ||
        lower.includes('src/pages/') ||
        lower.includes('src/app/')
      ) {
        frontendEvidence.push(path);
      }
    }

    if (frontendTechs.length > 0 || frontendEvidence.length > 0) {
      nodes.push({
        id: 'frontend',
        label: 'Frontend',
        type: 'frontend',
        technologies: Array.from(new Set(frontendTechs)),
        evidence: Array.from(new Set(frontendEvidence)),
        confidence: frontendEvidence.length > 0 ? 'high' : 'medium'
      });
    }
  }

  /**
   * 2. Detect Backend Node
   */
  private detectBackendNode(
    evidence: RepositoryEvidencePackage,
    validPaths: Set<string>,
    nodes: ArchitectureNode[]
  ) {
    const backendTechs: string[] = [];
    const backendEvidence: string[] = [];

    const techNames = [
      ...evidence.technologies.frameworks.map((f) => f.name),
      ...evidence.technologies.runtimes.map((r) => r.name),
      ...evidence.technologies.languages.map((l) => l.name)
    ];

    const targetTechs = ['Express', 'Node.js', 'Django', 'Flask', 'FastAPI', 'Spring', 'NestJS', 'Koa', 'Ruby on Rails', 'Laravel', 'ASP.NET'];
    for (const tech of targetTechs) {
      if (techNames.some((t) => t.toLowerCase() === tech.toLowerCase())) {
        backendTechs.push(tech);
      }
    }

    // Path check
    for (const path of validPaths) {
      const lower = path.toLowerCase();
      if (
        lower.startsWith('server/') ||
        lower.startsWith('backend/') ||
        lower.includes('src/controllers/') ||
        lower.includes('src/routes/') ||
        lower.includes('src/services/') ||
        lower.endsWith('server.ts') ||
        lower.endsWith('server.js') ||
        lower.endsWith('app.py') ||
        lower.endsWith('main.go') ||
        lower.endsWith('manage.py')
      ) {
        backendEvidence.push(path);
      }
    }

    if (backendTechs.length > 0 || backendEvidence.length > 0) {
      nodes.push({
        id: 'backend',
        label: 'Backend',
        type: 'backend',
        technologies: Array.from(new Set(backendTechs)),
        evidence: Array.from(new Set(backendEvidence)),
        confidence: backendEvidence.length > 0 ? 'high' : 'medium'
      });
    }
  }

  /**
   * 3. Detect API Node
   */
  private detectApiNode(
    evidence: RepositoryEvidencePackage,
    validPaths: Set<string>,
    nodes: ArchitectureNode[]
  ) {
    const apiTechs: string[] = [];
    const apiEvidence: string[] = [];

    // Look for GraphQL, OpenAPI, REST in technologies or dependencies
    const allDeps = evidence.technologies.dependencies.map((d) => d.name.toLowerCase());
    if (allDeps.some((d) => d.includes('graphql') || d.includes('apollo') || d.includes('trpc') || d.includes('swagger'))) {
      apiTechs.push('GraphQL/REST API');
    }

    for (const path of validPaths) {
      const lower = path.toLowerCase();
      if (lower.startsWith('api/') || lower.includes('openapi.') || lower.includes('swagger.') || lower.includes('schema.graphql')) {
        apiEvidence.push(path);
      }
    }

    if (apiTechs.length > 0 || apiEvidence.length > 0) {
      nodes.push({
        id: 'api',
        label: 'API Layer',
        type: 'api',
        technologies: Array.from(new Set(apiTechs)),
        evidence: Array.from(new Set(apiEvidence)),
        confidence: apiEvidence.length > 0 ? 'high' : 'medium'
      });
    }
  }

  /**
   * 4. Detect Database Node
   */
  private detectDatabaseNode(
    evidence: RepositoryEvidencePackage,
    validPaths: Set<string>,
    nodes: ArchitectureNode[]
  ) {
    const dbTechs: string[] = evidence.technologies.databases.map((d) => d.name);
    const dbEvidence: string[] = [];

    for (const path of validPaths) {
      const lower = path.toLowerCase();
      if (
        lower.startsWith('database/') ||
        lower.startsWith('db/') ||
        lower.includes('prisma/') ||
        lower.includes('migrations/') ||
        lower.includes('models/') ||
        lower.endsWith('schema.prisma')
      ) {
        dbEvidence.push(path);
      }
    }

    if (dbTechs.length > 0 || dbEvidence.length > 0) {
      nodes.push({
        id: 'database',
        label: 'Database',
        type: 'database',
        technologies: Array.from(new Set(dbTechs)),
        evidence: Array.from(new Set(dbEvidence)),
        confidence: dbTechs.length > 0 ? 'high' : 'medium'
      });
    }
  }

  /**
   * 5. Detect Cache Node
   */
  private detectCacheNode(
    evidence: RepositoryEvidencePackage,
    validPaths: Set<string>,
    nodes: ArchitectureNode[]
  ) {
    const cacheTechs: string[] = [];
    const cacheEvidence: string[] = [];

    const allDeps = evidence.technologies.dependencies.map((d) => d.name.toLowerCase());
    if (allDeps.some((d) => d === 'redis' || d === 'ioredis' || d === 'memcached')) {
      cacheTechs.push('Redis/Cache');
    }

    for (const path of validPaths) {
      const lower = path.toLowerCase();
      if (lower.startsWith('cache/') || lower.includes('redis')) {
        cacheEvidence.push(path);
      }
    }

    if (cacheTechs.length > 0 || cacheEvidence.length > 0) {
      nodes.push({
        id: 'cache',
        label: 'Cache',
        type: 'cache',
        technologies: Array.from(new Set(cacheTechs)),
        evidence: Array.from(new Set(cacheEvidence)),
        confidence: cacheTechs.length > 0 ? 'high' : 'medium'
      });
    }
  }

  /**
   * 6. Detect Queue / Worker Node
   */
  private detectWorkerQueueNode(
    evidence: RepositoryEvidencePackage,
    validPaths: Set<string>,
    nodes: ArchitectureNode[]
  ) {
    const workerTechs: string[] = [];
    const workerEvidence: string[] = [];

    const allDeps = evidence.technologies.dependencies.map((d) => d.name.toLowerCase());
    if (allDeps.some((d) => d.includes('bull') || d.includes('celery') || d.includes('rabbitmq') || d.includes('amqp') || d.includes('kafka'))) {
      workerTechs.push('Background Queue / Worker');
    }

    for (const path of validPaths) {
      const lower = path.toLowerCase();
      if (lower.startsWith('worker/') || lower.startsWith('jobs/') || lower.startsWith('queue/') || lower.includes('tasks/')) {
        workerEvidence.push(path);
      }
    }

    if (workerTechs.length > 0 || workerEvidence.length > 0) {
      nodes.push({
        id: 'worker',
        label: 'Background Worker',
        type: 'worker',
        technologies: Array.from(new Set(workerTechs)),
        evidence: Array.from(new Set(workerEvidence)),
        confidence: workerEvidence.length > 0 ? 'high' : 'medium'
      });
    }
  }

  /**
   * 7. Detect Deployment / Containerization Node
   */
  private detectDeploymentNode(
    evidence: RepositoryEvidencePackage,
    validPaths: Set<string>,
    nodes: ArchitectureNode[]
  ) {
    const deployTechs: string[] = evidence.technologies.containerization.map((c) => c.name);
    const deployEvidence: string[] = [];

    for (const path of validPaths) {
      const lower = path.toLowerCase();
      if (
        lower.includes('dockerfile') ||
        lower.includes('docker-compose') ||
        lower.startsWith('.github/workflows/') ||
        lower.includes('k8s/')
      ) {
        deployEvidence.push(path);
      }
    }

    if (deployTechs.length > 0 || deployEvidence.length > 0) {
      nodes.push({
        id: 'deployment',
        label: 'Deployment & Infrastructure',
        type: 'deployment',
        technologies: Array.from(new Set(deployTechs)),
        evidence: Array.from(new Set(deployEvidence)),
        confidence: deployEvidence.length > 0 ? 'high' : 'medium'
      });
    }
  }

  /**
   * 8. Detect Build Node
   */
  private detectBuildNode(
    evidence: RepositoryEvidencePackage,
    validPaths: Set<string>,
    nodes: ArchitectureNode[]
  ) {
    const buildTechs: string[] = evidence.technologies.buildTools.map((b) => b.name);
    const buildEvidence: string[] = [];

    for (const path of validPaths) {
      const lower = path.toLowerCase();
      if (lower.includes('webpack.') || lower.includes('tsconfig.') || lower.includes('babel.')) {
        buildEvidence.push(path);
      }
    }

    if (buildTechs.length > 0 || buildEvidence.length > 0) {
      nodes.push({
        id: 'build',
        label: 'Build System',
        type: 'build',
        technologies: Array.from(new Set(buildTechs)),
        evidence: Array.from(new Set(buildEvidence)),
        confidence: 'high'
      });
    }
  }

  /**
   * 9. Integrate Step 8A AI Architecture Components safely
   */
  private integrateAIComponents(
    aiAnalysis: RepositoryAIAnalysis,
    validPaths: Set<string>,
    nodes: ArchitectureNode[]
  ) {
    const aiComponents = aiAnalysis.architecture.components || [];

    for (const comp of aiComponents) {
      if (!comp.name) continue;

      // Check if evidence paths exist in valid paths
      const verifiedPaths = (comp.evidence || []).filter((p) => validPaths.has(p));
      const nodeId = comp.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      // Map AI component role to node type
      const roleLower = (comp.role || '').toLowerCase();
      let type: ArchitectureNodeType = 'unknown';
      if (roleLower.includes('frontend') || roleLower.includes('ui') || roleLower.includes('client')) type = 'frontend';
      else if (roleLower.includes('backend') || roleLower.includes('server') || roleLower.includes('controller')) type = 'backend';
      else if (roleLower.includes('api') || roleLower.includes('route')) type = 'api';
      else if (roleLower.includes('database') || roleLower.includes('storage') || roleLower.includes('model')) type = 'database';
      else if (roleLower.includes('worker') || roleLower.includes('queue') || roleLower.includes('job')) type = 'worker';

      nodes.push({
        id: nodeId,
        label: comp.name,
        type,
        technologies: [],
        evidence: verifiedPaths,
        confidence: verifiedPaths.length > 0 ? 'high' : 'medium'
      });
    }
  }

  /**
   * Deduplicates nodes by ID / Type and merges technologies and evidence arrays.
   */
  private deduplicateNodes(rawNodes: ArchitectureNode[]): ArchitectureNode[] {
    const nodeMap = new Map<string, ArchitectureNode>();

    for (const node of rawNodes) {
      const key = node.id;
      if (!nodeMap.has(key)) {
        nodeMap.set(key, { ...node });
      } else {
        const existing = nodeMap.get(key)!;
        existing.technologies = Array.from(new Set([...existing.technologies, ...node.technologies]));
        existing.evidence = Array.from(new Set([...existing.evidence, ...node.evidence]));
        if (node.confidence === 'high') existing.confidence = 'high';
      }
    }

    return Array.from(nodeMap.values());
  }

  /**
   * 10. Detect Edges between verified nodes strictly based on evidence
   */
  private detectEdges(
    evidence: RepositoryEvidencePackage,
    nodes: ArchitectureNode[],
    validPaths: Set<string>,
    edges: ArchitectureEdge[]
  ) {
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Rule A: Frontend -> Backend
    if (nodeIds.has('frontend') && (nodeIds.has('backend') || nodeIds.has('api'))) {
      const targetId = nodeIds.has('backend') ? 'backend' : 'api';
      const edgeEvidence = nodes
        .filter((n) => n.id === 'frontend' || n.id === targetId)
        .flatMap((n) => n.evidence);

      edges.push({
        source: 'frontend',
        target: targetId,
        label: 'HTTP/API',
        confidence: edgeEvidence.length > 0 ? 'high' : 'medium',
        evidence: Array.from(new Set(edgeEvidence))
      });
    }

    // Rule B: Backend/API -> Database
    if ((nodeIds.has('backend') || nodeIds.has('api')) && nodeIds.has('database')) {
      const sourceId = nodeIds.has('backend') ? 'backend' : 'api';
      const dbEvidence = nodes
        .filter((n) => n.id === sourceId || n.id === 'database')
        .flatMap((n) => n.evidence);

      edges.push({
        source: sourceId,
        target: 'database',
        label: 'Database Query',
        confidence: dbEvidence.length > 0 ? 'high' : 'medium',
        evidence: Array.from(new Set(dbEvidence))
      });
    }

    // Rule C: Backend -> Cache
    if (nodeIds.has('backend') && nodeIds.has('cache')) {
      const cacheEvidence = nodes
        .filter((n) => n.id === 'backend' || n.id === 'cache')
        .flatMap((n) => n.evidence);

      edges.push({
        source: 'backend',
        target: 'cache',
        label: 'Cache',
        confidence: cacheEvidence.length > 0 ? 'high' : 'medium',
        evidence: Array.from(new Set(cacheEvidence))
      });
    }

    // Rule D: Backend -> Worker
    if (nodeIds.has('backend') && nodeIds.has('worker')) {
      const workerEvidence = nodes
        .filter((n) => n.id === 'backend' || n.id === 'worker')
        .flatMap((n) => n.evidence);

      edges.push({
        source: 'backend',
        target: 'worker',
        label: 'Job/Queue',
        confidence: workerEvidence.length > 0 ? 'high' : 'medium',
        evidence: Array.from(new Set(workerEvidence))
      });
    }

    // Rule E: Deployment -> Frontend / Backend
    if (nodeIds.has('deployment')) {
      const deployNode = nodes.find((n) => n.id === 'deployment')!;
      if (nodeIds.has('frontend')) {
        edges.push({
          source: 'deployment',
          target: 'frontend',
          label: 'Deploys UI',
          confidence: 'high',
          evidence: deployNode.evidence
        });
      }
      if (nodeIds.has('backend')) {
        edges.push({
          source: 'deployment',
          target: 'backend',
          label: 'Deploys Server',
          confidence: 'high',
          evidence: deployNode.evidence
        });
      }
    }
  }

  /**
   * Deduplicates edges by source + target + label.
   */
  private deduplicateEdges(
    rawEdges: ArchitectureEdge[],
    nodes: ArchitectureNode[]
  ): ArchitectureEdge[] {
    const validNodeIds = new Set(nodes.map((n) => n.id));
    const edgeMap = new Map<string, ArchitectureEdge>();

    for (const edge of rawEdges) {
      if (!validNodeIds.has(edge.source) || !validNodeIds.has(edge.target)) {
        continue;
      }
      const key = `${edge.source}->${edge.target}:${edge.label}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { ...edge });
      } else {
        const existing = edgeMap.get(key)!;
        existing.evidence = Array.from(new Set([...existing.evidence, ...edge.evidence]));
      }
    }

    return Array.from(edgeMap.values());
  }
}

export const architectureService = new ArchitectureService();
