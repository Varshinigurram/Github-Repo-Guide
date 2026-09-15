import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { type RepositoryAIAnalysis } from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RepositoryOverviewProps {
  analysis?: RepositoryAIAnalysis
}

export function RepositoryOverview({ analysis }: RepositoryOverviewProps) {
  if (!analysis || !analysis.overview) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          No overview analysis available for this repository.
        </CardContent>
      </Card>
    )
  }

  const { overview, howItWorks, limitations } = analysis

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Repository Overview
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Evidence-grounded architectural summary derived from parsed repository files.
              </CardDescription>
            </div>
          </div>

          {overview.confidence && (
            <Badge variant="outline" className="text-[11px] font-mono capitalize border-border/80">
              Confidence: {overview.confidence}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        {overview.summary && (
          <p className="text-sm text-foreground/90 leading-relaxed">
            {overview.summary}
          </p>
        )}

        {/* Primary Purpose */}
        {overview.purpose && (
          <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Primary Purpose
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {overview.purpose}
            </p>
          </div>
        )}

        {/* How It Works */}
        {howItWorks && (howItWorks.description || (howItWorks.steps && howItWorks.steps.length > 0)) && (
          <div className="space-y-2.5 pt-3 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                How It Works & Core Workflow
              </h4>
              {howItWorks.confidence && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Confidence: {howItWorks.confidence}
                </span>
              )}
            </div>

            {howItWorks.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {howItWorks.description}
              </p>
            )}

            {howItWorks.steps && howItWorks.steps.length > 0 && (
              <ol className="space-y-2 pt-1">
                {howItWorks.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/10 p-2 rounded-md border border-border/30">
                    <span className="font-mono text-primary font-bold shrink-0">{idx + 1}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Reported Analysis Limitations */}
        {limitations && limitations.length > 0 && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-200/90 text-xs space-y-1">
            <span className="font-semibold flex items-center gap-1.5 text-amber-400 font-mono">
              <AlertCircle className="h-3.5 w-3.5" />
              Analysis Scope & Limitations
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
              {limitations.map((limit, idx) => (
                <li key={idx}>{limit}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
