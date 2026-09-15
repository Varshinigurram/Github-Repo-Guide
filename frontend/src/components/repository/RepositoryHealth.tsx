import { ShieldCheck, CheckCircle2, TrendingUp, Cpu, Info } from 'lucide-react'
import {
  type RepositoryHealthResult,
  type HealthGrade,
  type HealthCategoryStatus
} from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RepositoryHealthProps {
  health?: RepositoryHealthResult
}

function getGradeBadgeColor(grade: HealthGrade): string {
  switch (grade) {
    case 'A':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'B':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    case 'C':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'D':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
    case 'F':
      return 'bg-destructive/10 text-destructive border-destructive/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getStatusBadge(status: HealthCategoryStatus) {
  switch (status) {
    case 'strong':
      return <Badge variant="success" className="text-[10px] font-mono capitalize">Strong</Badge>
    case 'good':
      return <Badge variant="default" className="text-[10px] font-mono capitalize bg-blue-500/10 text-blue-400 border-blue-500/30">Good</Badge>
    case 'fair':
      return <Badge variant="warning" className="text-[10px] font-mono capitalize">Fair</Badge>
    case 'weak':
      return <Badge variant="destructive" className="text-[10px] font-mono capitalize">Weak</Badge>
    default:
      return <Badge variant="outline" className="text-[10px] font-mono capitalize">{status}</Badge>
  }
}

function getStatusProgressColor(status: HealthCategoryStatus): string {
  switch (status) {
    case 'strong':
      return 'bg-emerald-500'
    case 'good':
      return 'bg-blue-500'
    case 'fair':
      return 'bg-amber-500'
    case 'weak':
      return 'bg-destructive'
    default:
      return 'bg-primary'
  }
}

export function RepositoryHealth({ health }: RepositoryHealthProps) {
  if (!health || typeof health.score !== 'number') {
    return (
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-6 text-center text-xs text-muted-foreground font-mono">
          Health assessment unavailable for this analysis.
        </CardContent>
      </Card>
    )
  }

  const { score, grade, summary, categories = [], strengths = [], improvements = [], limitations = [] } = health

  // SVG circular progress calculation
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Repository Health Intelligence
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Deterministic repository health assessment based on inspected evidence.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground">
              Deterministic 0–100 Score
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Top Summary Banner: Circular Score Gauge + Grade + Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-border/40 bg-muted/20 items-center">
          {/* Circular SVG Gauge */}
          <div className="flex flex-col items-center justify-center space-y-1 md:col-span-1 border-b md:border-b-0 md:border-r border-border/40 pb-3 md:pb-0 md:pr-4">
            <div className="relative flex items-center justify-center w-24 h-24">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="text-muted/40 stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Score ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="text-emerald-500 stroke-current transition-all duration-500 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold font-mono text-foreground leading-none">
                  {score}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">/ 100</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground font-medium">Grade</span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getGradeBadgeColor(grade)}`}>
                {grade}
              </span>
            </div>
          </div>

          {/* Health Summary Text */}
          <div className="md:col-span-3 space-y-1.5">
            <h4 className="text-xs font-semibold font-mono text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              Health Assessment Summary
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {summary || 'No overall health summary provided.'}
            </p>
          </div>
        </div>

        {/* Category Breakdown List */}
        {categories && categories.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Weighted Category Evaluations ({categories.length})
            </h4>

            <div className="space-y-3">
              {categories.map((cat, idx) => {
                const percentage = Math.min(100, Math.max(0, (cat.score / cat.maxScore) * 100))
                return (
                  <div
                    key={`${cat.name}-${idx}`}
                    className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground font-mono">{cat.name}</span>
                        {getStatusBadge(cat.status)}
                      </div>
                      <div className="font-mono text-xs">
                        <span className="font-bold text-foreground">{cat.score}</span>
                        <span className="text-muted-foreground"> / {cat.maxScore}</span>
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStatusProgressColor(cat.status)} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Category Evidence List */}
                    {cat.evidence && cat.evidence.length > 0 && (
                      <div className="pt-1.5 space-y-1 text-[11px] text-muted-foreground font-mono">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                          Inspected Evidence:
                        </span>
                        <ul className="space-y-0.5 pl-2 border-l-2 border-border/60">
                          {cat.evidence.map((ev, i) => (
                            <li key={i} className="leading-snug truncate">
                              • {ev}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Strengths & Improvements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Strengths List */}
          {strengths && strengths.length > 0 && (
            <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <h4 className="text-xs font-semibold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Repository Strengths ({strengths.length})
              </h4>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold font-mono text-xs">•</span>
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Improvements List */}
          {improvements && improvements.length > 0 && (
            <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
              <h4 className="text-xs font-semibold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                Actionable Improvements ({improvements.length})
              </h4>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold font-mono text-xs">•</span>
                    <span className="leading-relaxed">{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Health Limitations Alert */}
        {limitations && limitations.length > 0 && (
          <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5 font-mono">
              <Info className="h-3.5 w-3.5 text-primary" />
              Health Evaluation Limitations
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
              {limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
