import { parseGitHubUrl } from '../utils/github-url.js';
import { githubService, GitHubServiceError } from './github.service.js';
import { technologyService } from './technology.service.js';
import { evidenceService } from './evidence.service.js';
import { healthService } from './health.service.js';
import { architectureService } from './architecture.service.js';
import { apiService } from './api.service.js';
import {
  repositoryCacheService,
  DeterministicRepositoryAnalysis
} from './repository-cache.service.js';

export class RepositoryAnalysisService {
  /**
   * Orchestrates 100% deterministic repository analysis and reuses cached results or in-flight promises.
   */
  public async getOrFetchRepositoryAnalysis(
    url: string
  ): Promise<DeterministicRepositoryAnalysis> {
    const parsedRepo = parseGitHubUrl(url);
    if (!parsedRepo) {
      throw new GitHubServiceError(
        'Please provide a valid GitHub repository URL (e.g. https://github.com/facebook/react).',
        'INVALID_GITHUB_URL',
        400
      );
    }

    const key = repositoryCacheService.canonicalizeKey(parsedRepo.owner, parsedRepo.repository);

    return repositoryCacheService.executeOrReuseInFlight(key, async () => {
      // 1. Fetch metadata
      const repositoryMetadata = await githubService.fetchRepositoryMetadata(
        parsedRepo.owner,
        parsedRepo.repository
      );

      // 2. Fetch tree structure
      const repositoryStructure = await githubService.fetchRepositoryTree(
        parsedRepo.owner,
        parsedRepo.repository,
        repositoryMetadata.defaultBranch
      );

      // 3. Fetch important file contents
      const repositoryFileContents = await githubService.fetchImportantFileContents(
        parsedRepo.owner,
        parsedRepo.repository,
        repositoryMetadata.defaultBranch,
        repositoryStructure.importantFiles
      );

      // 4. Analyze technology stack
      const technologies = technologyService.analyzeRepositoryTechnologies(
        repositoryMetadata,
        repositoryStructure,
        repositoryFileContents
      );

      // 5. Aggregate evidence package
      const evidence = evidenceService.aggregateEvidence(
        repositoryMetadata,
        repositoryStructure,
        repositoryFileContents,
        technologies
      );

      // 6. Calculate deterministic health score
      const health = healthService.calculateRepositoryHealth(evidence);

      // 7. Construct deterministic architecture graph
      const architecture = architectureService.buildArchitecture(evidence);

      // 8. Detect deterministic API endpoints
      const api = apiService.detectApiEndpoints(evidence);

      return {
        repository: repositoryMetadata,
        structure: repositoryStructure,
        fileContents: repositoryFileContents,
        technologies,
        evidence,
        health,
        architecture,
        api
      };
    });
  }
}

export const repositoryAnalysisService = new RepositoryAnalysisService();
