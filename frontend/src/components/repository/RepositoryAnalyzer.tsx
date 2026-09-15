import { useState } from 'react'
import { Search, Sparkles, FolderGit2, ArrowRight, ShieldCheck, FolderTree, Code2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface RepositoryAnalyzerProps {
  onAnalyze: (url: string) => void
  isAnalyzing?: boolean
}

const SAMPLE_REPOS = [
  { name: 'facebook/react', label: 'React', description: 'UI Library' },
  { name: 'expressjs/express', label: 'Express', description: 'Web Framework' },
  { name: 'microsoft/vscode', label: 'VS Code', description: 'Code Editor' },
]

export function RepositoryAnalyzer({ onAnalyze, isAnalyzing }: RepositoryAnalyzerProps) {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateUrl = (value: string): boolean => {
    const trimmed = value.trim()
    if (!trimmed) {
      setValidationError('Please enter a GitHub repository URL or owner/repository name.')
      return false
    }

    const isFullUrl = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\/.*)?$/i.test(trimmed)
    const isOwnerRepo = /^[\w.-]+\/[\w.-]+$/.test(trimmed)

    if (!isFullUrl && !isOwnerRepo) {
      setValidationError('Enter a valid GitHub URL (e.g. https://github.com/facebook/react) or format owner/repo.')
      return false
    }

    setValidationError(null)
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateUrl(url)) {
      onAnalyze(url.trim())
    }
  }

  const handleSampleClick = (sampleRepo: string) => {
    const fullUrl = `https://github.com/${sampleRepo}`
    setUrl(fullUrl)
    setValidationError(null)
    onAnalyze(fullUrl)
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Primary URL Entry Card */}
      <Card className="border-border/60 shadow-md bg-card">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Analyze GitHub Repository
          </CardTitle>
          <CardDescription className="text-sm max-w-lg mx-auto text-muted-foreground">
            Enter a public GitHub repository URL to generate grounded architecture insights, health scoring, API route maps, and interactive evidence Q&A.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <Input
                type="text"
                placeholder="https://github.com/facebook/react or owner/repo"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                disabled={isAnalyzing}
                className="pl-10 pr-32 h-11 text-sm bg-background border-border/80 focus-visible:ring-primary font-mono"
              />
              <div className="absolute inset-y-1 right-1 flex items-center">
                <Button
                  type="submit"
                  disabled={isAnalyzing || !url.trim()}
                  size="sm"
                  className="h-9 px-4 font-medium gap-1.5 shadow-xs"
                >
                  {isAnalyzing ? (
                    'Analyzing...'
                  ) : (
                    <>
                      <span>Analyze</span>
                      <Sparkles className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {validationError && (
              <p className="text-xs text-destructive flex items-center gap-1 font-medium pl-1">
                {validationError}
              </p>
            )}
          </form>

          <div className="pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground font-medium mb-2.5">
              Or try a sample public repository:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_REPOS.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => handleSampleClick(sample.name)}
                  disabled={isAnalyzing}
                  className="flex items-center justify-between p-2.5 text-left rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 transition-colors group cursor-pointer text-xs disabled:opacity-50"
                >
                  <div>
                    <span className="font-mono font-medium text-foreground group-hover:text-primary transition-colors block">
                      {sample.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {sample.description}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Subordinate Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 bg-card/40">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground block">Evidence Grounded</span>
            AI interpretation is strictly grounded in parsed repository evidence.
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 bg-card/40">
          <FolderTree className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground block">Repository Structure</span>
            Deep tree analysis and package manifest dependency extraction.
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 bg-card/40">
          <Code2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground block">API Route Detection</span>
            Deterministic detection of declared REST & framework endpoints.
          </div>
        </div>
      </div>
    </div>
  )
}
