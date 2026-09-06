import { Request, Response } from 'express';
import { z } from 'zod';
import { parseGitHubUrl } from '../utils/github-url.js';
import { githubService, GitHubServiceError } from '../services/github.service.js';

// Zod validation schema for request payload
const analyzeBodySchema = z.object({
  url: z.string().trim().min(1, 'url cannot be empty')
});

/**
 * Controller for POST /api/analyze
 * Validates GitHub URL, fetches metadata, tree structure, and important file contents from GitHub API.
 */
export const analyzeRepository = async (req: Request, res: Response): Promise<void> => {
  // Check for missing or empty request body object
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_REQUEST_BODY',
        message: 'Request body is required and must contain a "url" field.'
      }
    });
    return;
  }

  // Validate payload structure using Zod
  const validationResult = analyzeBodySchema.safeParse(req.body);

  if (!validationResult.success) {
    const firstIssue = validationResult.error.issues[0];
    const message = firstIssue ? firstIssue.message : 'Invalid url field.';

    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST_BODY',
        message
      }
    });
    return;
  }

  const { url } = validationResult.data;

  // Parse and validate GitHub URL
  const parsedRepo = parseGitHubUrl(url);

  if (!parsedRepo) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_GITHUB_URL',
        message: 'Please provide a valid GitHub repository URL (e.g. https://github.com/facebook/react).'
      }
    });
    return;
  }

  try {
    // 1. Fetch real repository metadata from GitHub API
    const repositoryMetadata = await githubService.fetchRepositoryMetadata(
      parsedRepo.owner,
      parsedRepo.repository
    );

    // 2. Fetch repository file and folder structure using default branch
    const repositoryStructure = await githubService.fetchRepositoryTree(
      parsedRepo.owner,
      parsedRepo.repository,
      repositoryMetadata.defaultBranch
    );

    // 3. Fetch text contents for selected important files using default branch
    const repositoryFileContents = await githubService.fetchImportantFileContents(
      parsedRepo.owner,
      parsedRepo.repository,
      repositoryMetadata.defaultBranch,
      repositoryStructure.importantFiles
    );

    // Return success response containing metadata, structure, and fileContents
    res.status(200).json({
      success: true,
      data: {
        repository: repositoryMetadata,
        structure: repositoryStructure,
        fileContents: repositoryFileContents
      }
    });
  } catch (error: any) {
    if (error instanceof GitHubServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while analyzing the repository.'
      }
    });
  }
};
