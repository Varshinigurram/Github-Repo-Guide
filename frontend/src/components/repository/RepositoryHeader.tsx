import { ExternalLink, Star, GitFork, AlertCircle, GitBranch, Shield, Calendar, ArrowLeft } from 'lucide-react'
import { type RepositoryMetadata, type RepositoryStructure, type TechnologyAnalysisResult } from '@/types/api.types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface RepositoryHeaderProps {
  repository: RepositoryMetadata
  structure?: RepositoryStructure
  technologies?: TechnologyAnalysisResult
  onReset: () => void
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toLocaleString()
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

export function RepositoryHeader({ repository, structure, technologies, onReset }: RepositoryHeaderProps) {
  return (
    <Card className="border-border/60 shadow-xs bg-card">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Top bar: Back action & GitHub Link */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground gap-1 px-2 h-7"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Analyze another repository</span>
          </Button>

          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <span>View on GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
              {repository.fullName}
            </h1>

            {repository.language && (
              <Badge variant="secondary" className="font-mono text-xs">
                {repository.language}
              </Badge>
            )}

            {repository.isPrivate ? (
              <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">
                Public
              </Badge>
            )}

            {repository.archived && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                Archived
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
            {repository.description || 'No description provided for this repository.'}
          </p>
        </div>

        {/* Key Metrics Pills */}
        <div className="flex items-center flex-wrap gap-3 pt-1 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
            <span className="font-semibold text-foreground">{formatNumber(repository.stars)}</span>
            <span>stars</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 text-muted-foreground">
            <GitFork className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-semibold text-foreground">{formatNumber(repository.forks)}</span>
            <span>forks</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold text-foreground">{formatNumber(repository.openIssues)}</span>
            <span>open issues</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5 text-purple-500" />
            <span className="font-mono text-foreground">{repository.defaultBranch}</span>
          </div>

          {repository.license && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-indigo-500" />
              <span>{repository.license}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Updated {formatDate(repository.pushedAt || repository.updatedAt)}</span>
          </div>

          {structure && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 text-muted-foreground">
              <span className="font-semibold text-foreground">{structure.totalFiles}</span>
              <span>files parsed</span>
            </div>
          )}
        </div>

        {/* Topics List */}
        {repository.topics && repository.topics.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground font-medium mr-1">Topics:</span>
            {repository.topics.map((topic) => (
              <Badge key={topic} variant="outline" className="text-[11px] font-mono py-0 px-2 border-border/80">
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {/* Primary Stack Summary Bar */}
        {technologies && (technologies.frameworks.length > 0 || technologies.languages.length > 0) && (
          <div className="pt-2 border-t border-border/40 flex items-center flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Detected Stack:</span>
            {technologies.languages.map((tech) => (
              <Badge key={tech.name} variant="secondary" className="text-[11px] font-mono bg-primary/10 text-primary hover:bg-primary/20">
                {tech.name}
              </Badge>
            ))}
            {technologies.frameworks.map((tech) => (
              <Badge key={tech.name} variant="secondary" className="text-[11px] font-mono bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                {tech.name}
              </Badge>
            ))}
            {technologies.databases.map((tech) => (
              <Badge key={tech.name} variant="secondary" className="text-[11px] font-mono bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">
                {tech.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
