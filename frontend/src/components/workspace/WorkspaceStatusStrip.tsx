import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Files, HardDrive, Route, Network, Activity, AlertTriangle } from 'lucide-react'
import type { AnalyzeSuccessResponse } from '@/types/api.types'

interface WorkspaceStatusStripProps {
  data: AnalyzeSuccessResponse['data']
}

export function WorkspaceStatusStrip({ data }: WorkspaceStatusStripProps) {
  const { structure, fileContents, api, architecture, health, evidence } = data

  const isLimited =
    structure.truncated ||
    fileContents.contentLimited ||
    evidence?.completeness?.treeTruncated ||
    evidence?.completeness?.contentLimited

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const getGradeBadgeClass = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'B':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
      case 'C':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      case 'D':
      case 'F':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="w-full rounded-lg border border-border/80 bg-card/60 p-3 sm:p-4 backdrop-blur shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Analysis Active
          </span>
          {isLimited ? (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] py-0">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Scope Truncated
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] py-0">
              Full Scope
            </Badge>
          )}
        </div>

        {/* Fact Metrics Bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
          {/* Files Metric */}
          <div className="flex items-center gap-1.5" title="Returned files / Total files detected">
            <Files className="h-3.5 w-3.5 text-blue-400" />
            <span>Files:</span>
            <span className="font-semibold text-foreground">
              {structure.returnedFiles} / {structure.totalFiles}
            </span>
          </div>

          <span className="text-border hidden sm:inline">•</span>

          {/* Bytes Metric */}
          <div className="flex items-center gap-1.5" title="Total content bytes fetched from repository">
            <HardDrive className="h-3.5 w-3.5 text-purple-400" />
            <span>Fetched:</span>
            <span className="font-semibold text-foreground">
              {formatBytes(fileContents.totalContentBytes || 0)}
            </span>
          </div>

          <span className="text-border hidden sm:inline">•</span>

          {/* Endpoints Metric */}
          <div className="flex items-center gap-1.5" title="Detected API endpoints">
            <Route className="h-3.5 w-3.5 text-amber-400" />
            <span>Endpoints:</span>
            <span className="font-semibold text-foreground">{api?.endpoints?.length || 0}</span>
          </div>

          <span className="text-border hidden sm:inline">•</span>

          {/* Architecture Nodes Metric */}
          <div className="flex items-center gap-1.5" title="Discovered architecture nodes">
            <Network className="h-3.5 w-3.5 text-cyan-400" />
            <span>Nodes:</span>
            <span className="font-semibold text-foreground">{architecture?.nodes?.length || 0}</span>
          </div>

          <span className="text-border hidden sm:inline">•</span>

          {/* Health Score */}
          <div className="flex items-center gap-1.5" title="Repository health score and grade">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Health:</span>
            <span className="font-semibold text-foreground">{health?.score || 0}/100</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-bold ${getGradeBadgeClass(health?.grade || 'N/A')}`}>
              Grade {health?.grade || 'N/A'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
