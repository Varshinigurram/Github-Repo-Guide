import { Request, Response } from 'express';
import { z } from 'zod';
import { parseGitHubUrl } from '../utils/github-url.js';
import { GitHubServiceError } from '../services/github.service.js';
import { aiService, AIServiceError } from '../services/ai.service.js';
import { repositoryAnalysisService } from '../services/repository-analysis.service.js';

// Zod validation schema for request payload
const analyzeBodySchema = z.object({
  url: z.string().trim().min(1, 'url cannot be empty')
});

/**
 * Controller for POST /api/analyze
 * Validates GitHub URL, reuses/caches deterministic repository analysis,
 * generates structured AI interpretation, and returns all 9 analysis data fields.
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
    // 1. Get or fetch 100% deterministic repository analysis (cached / deduplicated in-flight)
    const deterministicAnalysis = await repositoryAnalysisService.getOrFetchRepositoryAnalysis(url);

    // 2. Generate structured AI repository interpretation based strictly on evidence package
    const analysis = await aiService.analyzeRepositoryEvidence(deterministicAnalysis.evidence);

    // Return success response containing metadata, structure, fileContents, technologies, evidence, analysis, health, architecture, and api
    res.status(200).json({
      success: true,
      data: {
        repository: deterministicAnalysis.repository,
        structure: deterministicAnalysis.structure,
        fileContents: deterministicAnalysis.fileContents,
        technologies: deterministicAnalysis.technologies,
        evidence: deterministicAnalysis.evidence,
        analysis,
        health: deterministicAnalysis.health,
        architecture: deterministicAnalysis.architecture,
        api: deterministicAnalysis.api
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

    if (error instanceof AIServiceError) {
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
