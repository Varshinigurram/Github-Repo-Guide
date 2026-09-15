import { AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ErrorAlertProps {
  code?: string | null
  message: string
  onRetry?: () => void
}

function getErrorDetails(code?: string | null, message?: string) {
  switch (code) {
    case 'INVALID_GITHUB_URL':
      return {
        title: 'Invalid GitHub URL',
        description: 'The provided URL or path is not a valid public GitHub repository format.',
        solution: 'Use format https://github.com/owner/repo or owner/repo.'
      }
    case 'REPOSITORY_NOT_FOUND':
      return {
        title: 'Repository Not Found',
        description: 'The specified repository could not be found on GitHub or is private.',
        solution: 'Check for typos in owner/repository name and verify it is a public repository.'
      }
    case 'GITHUB_RATE_LIMITED':
      return {
        title: 'GitHub API Rate Limit Reached',
        description: 'The backend has hit GitHub REST API rate limits for unauthenticated requests.',
        solution: 'Wait a few minutes before trying again or configure a GITHUB_TOKEN on the server.'
      }
    case 'AI_RATE_LIMITED':
    case 'OPENROUTER_RATE_LIMITED':
      return {
        title: 'AI Service Rate Limited',
        description: 'OpenRouter AI service rate limit reached.',
        solution: 'Please wait a moment and click Try Again.'
      }
    case 'AI_TIMEOUT':
    case 'OPENROUTER_TIMEOUT':
      return {
        title: 'AI Service Timeout',
        description: 'AI interpretation took too long to complete.',
        solution: 'The repository may be very large. Please try again.'
      }
    case 'PAYLOAD_TOO_LARGE':
      return {
        title: 'Repository Too Large',
        description: 'This repository contains too many files or large files exceeding processing limits.',
        solution: 'Try analyzing a smaller repository or specific subdirectory.'
      }
    case 'INVALID_AI_RESPONSE':
      return {
        title: 'AI Interpretation Error',
        description: 'Failed to parse AI response into structured JSON format.',
        solution: 'Click Try Again to request a fresh interpretation.'
      }
    default:
      return {
        title: 'Analysis Error',
        description: message || 'An unexpected error occurred while analyzing the repository.',
        solution: 'Ensure the backend server is running and try again.'
      }
  }
}

export function ErrorAlert({ code, message, onRetry }: ErrorAlertProps) {
  const details = getErrorDetails(code, message)

  return (
    <Card className="w-full max-w-2xl mx-auto border-destructive/40 bg-destructive/5 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                {details.title}
              </CardTitle>
              {code && (
                <Badge variant="outline" className="text-[10px] font-mono border-destructive/30 text-destructive mt-1">
                  Code: {code}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <CardDescription className="text-sm text-foreground/90 font-medium">
          {message}
        </CardDescription>

        <div className="flex items-start gap-2 p-3 rounded-md bg-background/80 border border-border/60 text-xs text-muted-foreground">
          <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground block">Suggested Action</span>
            {details.solution}
          </div>
        </div>
      </CardContent>

      {onRetry && (
        <CardFooter className="pt-2">
          <Button
            onClick={onRetry}
            variant="default"
            size="sm"
            className="gap-1.5 font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
