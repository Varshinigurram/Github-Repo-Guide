import { AlertTriangle, RefreshCw, HelpCircle, WifiOff } from 'lucide-react'
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
        description: 'Enter a valid public GitHub repository URL (e.g. https://github.com/owner/repo or owner/repo).',
        solution: 'Check the URL format and make sure it points to a public repository root rather than an issue, pull request, or wiki.'
      }
    case 'REPOSITORY_NOT_FOUND':
      return {
        title: 'Repository Not Found',
        description: 'Check that the repository URL is correct and that the repository is publicly accessible.',
        solution: 'Verify the owner and repository spelling on GitHub. Private repositories are not accessible without authentication.'
      }
    case 'GITHUB_RATE_LIMITED':
      return {
        title: 'GitHub API Rate Limit Reached',
        description: 'GitHub temporarily limited requests for this server.',
        solution: 'Wait a few minutes before trying again or configure a GITHUB_TOKEN on the backend server.'
      }
    case 'AI_CONFIG_ERROR':
      return {
        title: 'AI Service Not Configured',
        description: 'The backend AI analysis service configuration is missing or incomplete.',
        solution: 'Ensure the OPENROUTER_API_KEY environment variable is configured on the backend server.'
      }
    case 'AI_AUTH_ERROR':
      return {
        title: 'AI Authentication Failed',
        description: 'Authentication with the AI service failed.',
        solution: 'Check backend AI API key configuration and credentials.'
      }
    case 'AI_RATE_LIMITED':
    case 'OPENROUTER_RATE_LIMITED':
      return {
        title: 'AI Request Limit Reached',
        description: 'AI request limit reached. Please try again later.',
        solution: 'Please wait a moment and click Try Again.'
      }
    case 'AI_TIMEOUT':
    case 'OPENROUTER_TIMEOUT':
      return {
        title: 'AI Analysis Timeout',
        description: 'The AI analysis took too long to respond.',
        solution: 'The repository may be very large. Click Try Again to retry.'
      }
    case 'AI_PROVIDER_ERROR':
      return {
        title: 'AI Service Unavailable',
        description: 'The AI analysis service is temporarily unavailable.',
        solution: 'Click Try Again to resubmit your request.'
      }
    case 'INVALID_AI_RESPONSE':
      return {
        title: 'AI Response Validation Error',
        description: 'The AI response could not be validated.',
        solution: 'Click Try Again to request a fresh interpretation.'
      }
    case 'PAYLOAD_TOO_LARGE':
      return {
        title: 'Repository Exceeds Bounds',
        description: 'This repository contains too many files or large files exceeding inspection bounds.',
        solution: 'Try analyzing a smaller repository or specific package.'
      }
    case 'NETWORK_ERROR':
    case 'HTTP_ERROR':
      return {
        title: 'Unable to Connect to Analysis Service',
        description: 'Make sure the GitHub Repo Guide backend is running and try again.',
        solution: 'Verify the backend server is active at http://localhost:5000 and click Try Again.'
      }
    default:
      return {
        title: 'Analysis Error',
        description: message || 'An unexpected error occurred while processing the repository.',
        solution: 'Make sure the GitHub Repo Guide backend is running and try again.'
      }
  }
}

export function ErrorAlert({ code, message, onRetry }: ErrorAlertProps) {
  const details = getErrorDetails(code, message)
  const isNetwork = code === 'NETWORK_ERROR' || code === 'HTTP_ERROR'

  return (
    <Card className="w-full max-w-2xl mx-auto border-destructive/40 bg-destructive/5 shadow-md animate-in fade-in duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
              {isNetwork ? <WifiOff className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
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
          {details.description}
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
            className="gap-1.5 font-medium cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
