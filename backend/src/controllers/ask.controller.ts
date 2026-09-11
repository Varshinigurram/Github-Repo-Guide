import { Request, Response } from 'express';
import { z } from 'zod';
import { parseGitHubUrl } from '../utils/github-url.js';
import { askService, AskServiceError } from '../services/ask.service.js';
import { GitHubServiceError } from '../services/github.service.js';

// Zod validation schema for POST /api/ask payload
const askBodySchema = z.object({
  url: z.string().trim().min(1, 'url cannot be empty'),
  question: z.string().trim().min(1, 'question cannot be empty').max(1000, 'question exceeds maximum length of 1000 characters')
});

/**
 * Controller for POST /api/ask
 * Validates request payload (url, question), checks URL format and question constraints,
 * aggregates repository evidence, and invokes single grounded OpenRouter AI call.
 */
export const askRepository = async (req: Request, res: Response): Promise<void> => {
  // Check for missing or non-object request body
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_REQUEST_BODY',
        message: 'Request body is required and must contain "url" and "question" fields.'
      }
    });
    return;
  }

  // Check specifically if url or question are missing before schema parsing for exact error codes
  if (typeof req.body.url !== 'string' || req.body.url.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST_BODY',
        message: 'url field is required and cannot be empty.'
      }
    });
    return;
  }

  if (typeof req.body.question !== 'string' || req.body.question.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_QUESTION',
        message: 'question field is required and cannot be empty.'
      }
    });
    return;
  }

  if (req.body.question.trim().length > 1000) {
    res.status(400).json({
      success: false,
      error: {
        code: 'QUESTION_TOO_LONG',
        message: 'Question exceeds maximum length of 1000 characters.'
      }
    });
    return;
  }

  // Parse payload using Zod
  const validationResult = askBodySchema.safeParse(req.body);
  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST_BODY',
        message: validationResult.error.issues[0]?.message || 'Invalid request body.'
      }
    });
    return;
  }

  const { url, question } = validationResult.data;

  // Validate GitHub URL format
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
    const result = await askService.askRepository(url, question);

    res.status(200).json({
      success: true,
      data: result
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

    if (error instanceof AskServiceError) {
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
        message: 'An unexpected error occurred while processing your question.'
      }
    });
  }
};
