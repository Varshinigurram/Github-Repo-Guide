import { Loader2, FileCode2, Cpu, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface AnalysisLoadingProps {
  url?: string
}

export function AnalysisLoading({ url }: AnalysisLoadingProps) {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Analysis Status */}
      <Card className="border-border/80 bg-card shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">
                    ANALYZING REPOSITORY
                  </span>
                </div>
                <p className="text-sm font-mono text-foreground font-medium truncate max-w-md mt-0.5">
                  {url || 'Fetching GitHub repository analysis...'}
                </p>
              </div>
            </div>

            {/* Indeterminate Analysis Steps Feedback */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 font-medium">
                <FileCode2 className="h-3.5 w-3.5 text-primary" />
                <span>Repository evidence</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 font-medium">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                <span>Technology and file inspection</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Preparing repository intelligence</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structured Skeleton Placeholders */}
      <div className="space-y-6">
        {/* Workspace Header Skeleton */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-5/6" />
            <div className="flex flex-wrap gap-3 pt-2">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-7 w-28 rounded-md" />
              <Skeleton className="h-7 w-32 rounded-md" />
            </div>
          </CardHeader>
        </Card>

        {/* Content Skeletons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-border/60 bg-card">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-72" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <div className="pt-3">
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
