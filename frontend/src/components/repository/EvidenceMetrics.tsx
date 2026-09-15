import { FileText, ShieldCheck, Database, Layers, Check, AlertTriangle } from 'lucide-react'
import { type RepositoryStructure, type RepositoryFileContents, type EvidenceCompleteness } from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EvidenceMetricsProps {
  structure: RepositoryStructure
  fileContents: RepositoryFileContents
  completeness?: EvidenceCompleteness
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
  if (bytes >= 1024) {
    return (bytes / 1024).toFixed(1) + ' KB'
  }
  return bytes + ' B'
}

export function EvidenceMetrics({ structure, fileContents, completeness }: EvidenceMetricsProps) {
  const isTruncated = structure.truncated || completeness?.treeTruncated
  const isLimited = structure.responseLimited || fileContents.contentLimited || completeness?.contentLimited

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Repository Evidence Scope
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Deterministic coverage and manifest analysis limits.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isTruncated ? (
              <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-400">
                Tree Truncated
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400">
                Complete Tree
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 font-mono text-xs">
        {/* Total Files & Returned Files */}
        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            Total Repository Files
          </span>
          <div className="text-right">
            <span className="font-semibold text-foreground">{structure.totalFiles}</span>
            {structure.totalFiles !== structure.returnedFiles && (
              <span className="text-[11px] text-muted-foreground block font-normal">
                ({structure.returnedFiles} returned)
              </span>
            )}
          </div>
        </div>

        {/* Total Directories & Returned Directories */}
        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            Total Directories
          </span>
          <div className="text-right">
            <span className="font-semibold text-foreground">{structure.totalDirectories}</span>
            {structure.totalDirectories !== structure.returnedDirectories && (
              <span className="text-[11px] text-muted-foreground block font-normal">
                ({structure.returnedDirectories} returned)
              </span>
            )}
          </div>
        </div>

        {/* Important Identified Files */}
        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            Identified Important Files
          </span>
          <span className="font-semibold text-foreground">{structure.importantFiles.length}</span>
        </div>

        {/* Fetched & Parsed File Contents */}
        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Fetched File Contents
          </span>
          <span className="font-semibold text-foreground">{fileContents.fetchedFiles}</span>
        </div>

        {/* Total Parsed Content Bytes */}
        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
          <span className="text-muted-foreground">Total Content Inspected</span>
          <span className="font-semibold text-foreground">{formatBytes(fileContents.totalContentBytes)}</span>
        </div>

        {/* Analysis Coverage Status */}
        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-muted-foreground font-sans">Coverage Status:</span>
          {isLimited ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Bounded Content Limit
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Check className="h-3 w-3" />
              Full Evidence Parsed
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
