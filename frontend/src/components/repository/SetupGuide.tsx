import { useState } from 'react'
import { Terminal, Copy, CheckCircle2 } from 'lucide-react'
import { type SetupAnalysis } from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SetupGuideProps {
  setup?: SetupAnalysis
}

export function SetupGuide({ setup }: SetupGuideProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const hasSteps = setup?.steps && setup.steps.length > 0
  const hasCommands = setup?.commands && setup.commands.length > 0

  if (!hasSteps && !hasCommands) {
    return (
      <Card className="border-border/60 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 font-mono">
            <Terminal className="h-4 w-4 text-primary" />
            Setup & Execution Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground font-mono italic p-3 rounded-md bg-muted/20 border border-border/40">
            No setup steps or execution commands detected in the inspected repository evidence.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleCopy = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Setup & Run Information
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Execution procedures extracted from parsed repository documentation and manifests.
              </CardDescription>
            </div>
          </div>

          {setup?.confidence && (
            <Badge variant="outline" className="text-[11px] font-mono capitalize">
              Confidence: {setup.confidence}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Setup Steps List */}
        {hasSteps && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Installation & Configuration Steps
            </h4>
            <ol className="space-y-2">
              {setup!.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/10 p-2.5 rounded-md border border-border/40">
                  <span className="font-mono text-primary font-bold shrink-0">{idx + 1}.</span>
                  <span className="leading-relaxed text-foreground/90">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Setup Commands Terminal Box */}
        {hasCommands && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Detected Terminal Commands
            </h4>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 space-y-2">
              {setup!.commands.map((cmd, i) => (
                <div key={i} className="flex items-center justify-between gap-2 group">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500 shrink-0">$</span>
                    <span className="truncate">{cmd}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(cmd, i)}
                    className="h-6 w-6 text-slate-400 hover:text-slate-100 hover:bg-slate-800 shrink-0 cursor-pointer"
                  >
                    {copiedIndex === i ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
