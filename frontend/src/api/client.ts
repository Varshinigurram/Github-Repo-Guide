import {
  type HealthStatusResponse,
  type AnalyzeSuccessResponse,
  type AskSuccessResponse,
  type ErrorResponse,
  ApiClientError
} from '../types/api.types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')

/**
 * Helper to handle fetch responses and parse standard backend error objects.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    if (payload && typeof payload === 'object' && payload.success === false && payload.error) {
      const err = payload as ErrorResponse
      throw new ApiClientError(
        err.error.message || `API request failed with status ${response.status}`,
        err.error.code || 'API_ERROR',
        response.status
      )
    }

    throw new ApiClientError(
      `API request failed with HTTP ${response.status}`,
      'HTTP_ERROR',
      response.status
    )
  }

  return payload as T
}

/**
 * Centralized API client for communicating with GitHub Repo Guide backend.
 */
export const apiClient = {
  /**
   * GET /api/health
   * Verifies backend availability.
   */
  async getHealth(): Promise<HealthStatusResponse> {
    const res = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })
    return handleResponse<HealthStatusResponse>(res)
  },

  /**
   * POST /api/analyze
   * Analyzes public GitHub repository and returns full deterministic evidence, health, architecture, API, and AI analysis.
   */
  async analyzeRepository(url: string): Promise<AnalyzeSuccessResponse> {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ url })
    })
    return handleResponse<AnalyzeSuccessResponse>(res)
  },

  /**
   * POST /api/ask
   * Performs grounded Q&A on public GitHub repository using evidence package.
   */
  async askRepository(url: string, question: string): Promise<AskSuccessResponse> {
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ url, question })
    })
    return handleResponse<AskSuccessResponse>(res)
  }
}
