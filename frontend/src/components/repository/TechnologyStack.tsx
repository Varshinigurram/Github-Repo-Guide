import { Cpu, Code2, Database, Wrench, ShieldCheck, Box, Package } from 'lucide-react'
import { type TechnologyAnalysisResult, type DetectedTechnology } from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface TechnologyStackProps {
  technologies?: TechnologyAnalysisResult
}

interface TechGroupProps {
  title: string
  items: DetectedTechnology[]
  icon: React.ReactNode
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'success'
}

function TechGroup({ title, items, icon }: TechGroupProps) {
  if (!items || items.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
        {icon}
        {title} ({items.length})
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((tech) => (
          <Tooltip key={tech.name}>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/20 text-xs font-mono group cursor-help hover:border-primary/40 transition-colors">
                <span className="font-medium text-foreground">{tech.name}</span>
                {tech.confidence && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono uppercase text-muted-foreground">
                    {tech.confidence}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs space-y-1">
              <p className="font-semibold text-xs text-foreground font-mono">{tech.name}</p>
              {tech.evidence && tech.evidence.length > 0 ? (
                <div className="text-[11px] text-muted-foreground space-y-0.5 font-mono">
                  <span className="font-bold text-foreground">Evidence:</span>
                  {tech.evidence.map((ev, i) => (
                    <p key={i} className="truncate">• {ev}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">Detected from repository manifests.</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

export function TechnologyStack({ technologies }: TechnologyStackProps) {
  if (!technologies) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          No technology detection data available.
        </CardContent>
      </Card>
    )
  }

  const hasAnyTech =
    technologies.languages.length > 0 ||
    technologies.frameworks.length > 0 ||
    technologies.runtimes.length > 0 ||
    technologies.databases.length > 0 ||
    technologies.packageManagers.length > 0 ||
    technologies.buildTools.length > 0 ||
    technologies.testingTools.length > 0 ||
    technologies.styling.length > 0 ||
    technologies.containerization.length > 0 ||
    technologies.dependencies.length > 0

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Detected Technology Stack
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Deterministic detection from parsed code manifests, configs, and repository tree.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasAnyTech ? (
          <p className="text-xs text-muted-foreground font-mono italic">
            No technology stack items detected in the inspected evidence.
          </p>
        ) : (
          <div className="space-y-4">
            <TechGroup
              title="Languages"
              items={technologies.languages}
              icon={<Code2 className="h-3.5 w-3.5 text-primary" />}
            />

            <TechGroup
              title="Frameworks"
              items={technologies.frameworks}
              icon={<Box className="h-3.5 w-3.5 text-emerald-400" />}
            />

            <TechGroup
              title="Runtimes & Environments"
              items={technologies.runtimes}
              icon={<Cpu className="h-3.5 w-3.5 text-blue-400" />}
            />

            <TechGroup
              title="Databases & Storage"
              items={technologies.databases}
              icon={<Database className="h-3.5 w-3.5 text-purple-400" />}
            />

            <TechGroup
              title="Build & Bundling Tools"
              items={technologies.buildTools}
              icon={<Wrench className="h-3.5 w-3.5 text-amber-400" />}
            />

            <TechGroup
              title="Package Managers"
              items={technologies.packageManagers}
              icon={<Package className="h-3.5 w-3.5 text-indigo-400" />}
            />

            <TechGroup
              title="Testing Frameworks"
              items={technologies.testingTools}
              icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
            />

            <TechGroup
              title="Styling & UI Tools"
              items={technologies.styling}
              icon={<Box className="h-3.5 w-3.5 text-pink-400" />}
            />

            <TechGroup
              title="Containerization & DevOps"
              items={technologies.containerization}
              icon={<Box className="h-3.5 w-3.5 text-cyan-400" />}
            />

            {/* Extracted Dependencies List */}
            {technologies.dependencies && technologies.dependencies.length > 0 && (
              <div className="pt-3 border-t border-border/40 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  Extracted Manifest Dependencies ({technologies.dependencies.length})
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {technologies.dependencies.map((dep, idx) => (
                    <Badge
                      key={`${dep.name}-${idx}`}
                      variant="outline"
                      className="text-[11px] font-mono py-0.5 px-2 border-border/60 bg-muted/10"
                    >
                      <span className="text-foreground font-semibold">{dep.name}</span>
                      {dep.version && <span className="text-muted-foreground ml-1">@{dep.version}</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
